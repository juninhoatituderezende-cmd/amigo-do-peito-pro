// DEPRECATED - This webhook is now DISABLED for security reasons
// All webhook processing has been moved to secure-pix-webhook
// This function will redirect to the secure webhook

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("DEPRECATED: pix-webhook called - redirecting to secure webhook");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client for logging
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Log security event - insecure webhook accessed
  console.error("SECURITY WARNING: Insecure pix-webhook was accessed");
  
  try {
    // Log security event to database
    await supabaseClient.from("security_events").insert({
      event_type: "deprecated_webhook_accessed",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent"),
      details: {
        endpoint: "pix-webhook",
        method: req.method,
        timestamp: new Date().toISOString(),
        warning: "Attempt to use deprecated insecure webhook endpoint"
      }
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }

  // Return security error
  return new Response(
    JSON.stringify({ 
      error: "DEPRECATED_WEBHOOK",
      message: "This webhook endpoint has been disabled for security reasons. Use secure-pix-webhook instead.",
      redirect_to: "secure-pix-webhook",
      timestamp: new Date().toISOString()
    }),
    { 
      status: 410, // Gone
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
});