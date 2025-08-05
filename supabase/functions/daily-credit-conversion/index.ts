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
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log('[CREDIT-CONVERSION] Starting daily credit conversion job');

    // Execute the auto_convert_expired_payments function
    const { data, error } = await supabaseClient.rpc('auto_convert_expired_payments');

    if (error) {
      console.error('[CREDIT-CONVERSION] Error executing conversion:', error);
      throw error;
    }

    console.log('[CREDIT-CONVERSION] Conversion completed successfully:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Credit conversion job completed',
      result: data 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('[CREDIT-CONVERSION] Function error:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});