import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { payment_type, payment_id, proof_url, admin_id } = await req.json();

    if (!payment_type || !payment_id || !admin_id) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios: payment_type, payment_id, admin_id" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    console.log(`Marking payment as paid:`, { payment_type, payment_id, admin_id });

    // Chamar a função SQL
    const { data, error } = await supabase.rpc('mark_payment_as_paid', {
      p_payment_type: payment_type,
      p_payment_id: payment_id,
      p_proof_url: proof_url,
      p_admin_id: admin_id
    });

    if (error) {
      console.error('Error marking payment as paid:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Pagamento marcado como pago com sucesso",
        data 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );

  } catch (error) {
    console.error('Error in mark-payment-paid function:', error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
});