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
    const { payment_id, admin_id } = await req.json();

    if (!payment_id || !admin_id) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios: payment_id, admin_id" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    console.log(`Releasing professional payment:`, { payment_id, admin_id });

    // Chamar a função SQL
    const { data, error } = await supabase.rpc('release_professional_payment', {
      p_payment_id: payment_id,
      p_admin_id: admin_id
    });

    if (error) {
      console.error('Error releasing payment:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Buscar informações do pagamento para notificação
    const { data: paymentData } = await supabase
      .from('pagamentos_profissionais')
      .select(`
        *,
        professional:professional_id (full_name, email),
        client:client_id (full_name)
      `)
      .eq('id', payment_id)
      .single();

    if (paymentData?.professional) {
      // Criar notificação para o profissional
      await supabase
        .from('notifications')
        .insert({
          user_id: paymentData.professional_id,
          type: 'payment_released',
          title: 'Pagamento Liberado!',
          message: `Seu pagamento de R$ ${paymentData.professional_amount.toFixed(2)} foi liberado e está disponível para saque.`
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Pagamento liberado com sucesso",
        data 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );

  } catch (error) {
    console.error('Error in release-professional-payment function:', error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
});