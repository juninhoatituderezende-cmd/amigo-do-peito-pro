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
    const { userId, amount } = await req.json();

    if (!userId || !amount) {
      throw new Error("Parâmetros obrigatórios: userId, amount");
    }

    if (amount < 50) {
      throw new Error("Valor mínimo para saque é R$ 50,00");
    }

    // Inicializar Supabase client com service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar saldo disponível
    const { data: userCredits, error: creditsError } = await supabaseClient
      .from('user_credits')
      .select('available_credits')
      .eq('user_id', userId)
      .single();

    if (creditsError || !userCredits) {
      throw new Error("Usuário não encontrado ou sem créditos");
    }

    if (userCredits.available_credits < amount) {
      throw new Error("Saldo insuficiente para este saque");
    }

    // Verificar se já existe uma solicitação pendente
    const { data: existingRequest, error: requestError } = await supabaseClient
      .from('withdrawal_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      throw new Error("Você já possui uma solicitação de saque pendente");
    }

    // Criar solicitação de saque
    const { data: withdrawalRequest, error: insertError } = await supabaseClient
      .from('withdrawal_requests')
      .insert({
        user_id: userId,
        amount: amount,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Erro ao criar solicitação: ${insertError.message}`);
    }

    // Atualizar saldo (mover para pending_withdrawal)
    const { error: updateError } = await supabaseClient
      .from('user_credits')
      .update({
        available_credits: userCredits.available_credits - amount,
        pending_withdrawal: amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Erro ao atualizar saldo: ${updateError.message}`);
    }

    // Registrar transação
    const { error: transactionError } = await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: 'debit',
        source: 'withdrawal',
        description: `Solicitação de saque #${withdrawalRequest.id}`,
        related_order_id: withdrawalRequest.id
      });

    if (transactionError) {
      console.error('Erro ao registrar transação:', transactionError);
      // Não falhar a operação por causa disso
    }

    // Notificar admins sobre nova solicitação
    const { data: admins, error: adminError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: admin.id,
            title: 'Nova Solicitação de Saque',
            message: `Solicitação de saque de R$ ${amount.toFixed(2)} pendente de análise`,
            type: 'info',
            category: 'system',
            read: false,
            action_url: '/admin/saques',
            action_text: 'Analisar'
          });
      }
    }

    console.log(`Solicitação de saque criada: ${withdrawalRequest.id} - R$ ${amount} para usuário ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Solicitação de saque criada com sucesso",
        requestId: withdrawalRequest.id,
        amount: amount
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao processar solicitação de saque:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});