import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      action,
      resource_type,
      resource_id,
      details,
      user_id,
      ip_address,
      user_agent,
      timestamp
    } = await req.json();

    // Validate required fields
    if (!action) {
      return new Response(JSON.stringify({ 
        error: "Action is required" 
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

    // Insert activity log
    const { error: dbError } = await supabaseClient
      .from("activity_logs")
      .insert({
        user_id: user_id,
        action: action,
        resource_type: resource_type,
        resource_id: resource_id,
        details: details,
        ip_address: ip_address,
        user_agent: user_agent,
        created_at: timestamp || new Date().toISOString(),
      });

    if (dbError) {
      console.error("Failed to log activity:", dbError);
      return new Response(JSON.stringify({ 
        error: "Failed to log activity" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Log critical actions to console for immediate visibility
    const criticalActions = [
      'admin_user_deleted',
      'admin_plan_deleted',
      'payment_processed',
      'contemplation_approved',
      'contemplation_rejected'
    ];

    if (criticalActions.includes(action)) {
      console.log(`CRITICAL ACTION: ${action}`, {
        user_id,
        resource_type,
        resource_id,
        details,
        timestamp: timestamp || new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Activity logged successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in log-activity function:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});