import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 3600000);

function checkRateLimit(identifier: string, maxRequests = 100, windowMs = 3600000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || 
                    req.headers.get("x-real-ip") || 
                    "unknown";

    // Apply rate limiting
    if (!checkRateLimit(clientIP, 100, 3600000)) {
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded. Try again later." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    const { 
      message, 
      stack, 
      componentStack, 
      errorId, 
      timestamp, 
      userAgent, 
      url 
    } = await req.json();

    // Validate required fields
    if (!message || !errorId) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Log error to database
    const { error: dbError } = await supabaseClient
      .from("error_logs")
      .insert({
        error_id: errorId,
        message: message,
        stack: stack,
        component_stack: componentStack,
        timestamp: timestamp,
        user_agent: userAgent,
        url: url,
        client_ip: clientIP,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("Failed to log error to database:", dbError);
      // Don't fail the request if logging fails
    }

    // Log to console for immediate visibility
    console.error("Frontend Error:", {
      errorId,
      message,
      url,
      timestamp,
      clientIP,
    });

    // Send to external monitoring service if configured
    const sentryDsn = Deno.env.get("SENTRY_DSN");
    if (sentryDsn) {
      try {
        const sentryPayload = {
          message,
          level: "error",
          tags: {
            errorId,
            url,
            userAgent,
          },
          extra: {
            stack,
            componentStack,
            timestamp,
          },
        };

        await fetch(`${sentryDsn}/api/store/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sentryPayload),
        });
      } catch (sentryError) {
        console.error("Failed to send to Sentry:", sentryError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      errorId,
      message: "Error logged successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in log-error function:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});