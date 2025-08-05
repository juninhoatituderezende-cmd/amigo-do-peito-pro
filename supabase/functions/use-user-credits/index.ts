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
    const { userId, amount, source, description, relatedOrderId } = await req.json();

    if (!userId || !amount || !source || !description) {
      throw new Error("Parâmetros obrigatórios: userId, amount, source, description");
    }

    if (amount <= 0) {
      throw new Error("O valor deve ser maior que zero");
    }

    // Inicializar Supabase client com service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar saldo atual
    const { data: currentBalance, error: balanceError } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (balanceError) {
      throw new Error(`Erro ao buscar saldo: ${balanceError.message}`);
    }

    if (!currentBalance) {
      throw new Error("Usuário não possui saldo de créditos");
    }

    if (currentBalance.available_credits < amount) {
      throw new Error("Saldo insuficiente para esta transação");
    }

    // Atualizar saldo
    const { error: updateError } = await supabaseClient
      .from('user_credits')
      .update({
        available_credits: currentBalance.available_credits - amount,
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
        source: source,
        description: description,
        related_order_id: relatedOrderId || null
      });

    if (transactionError) {
      throw new Error(`Erro ao registrar transação: ${transactionError.message}`);
    }

    console.log(`Créditos utilizados: ${amount} para usuário ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Créditos utilizados com sucesso",
        amount: amount,
        remainingBalance: currentBalance.available_credits - amount
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao usar créditos:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});