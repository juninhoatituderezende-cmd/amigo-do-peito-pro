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

    // Começar transação
    const { data: currentBalance, error: balanceError } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar saldo: ${balanceError.message}`);
    }

    // Se não existe registro, criar um novo
    if (!currentBalance) {
      const { error: createError } = await supabaseClient
        .from('user_credits')
        .insert({
          user_id: userId,
          total_credits: amount,
          available_credits: amount,
          pending_withdrawal: 0
        });

      if (createError) {
        throw new Error(`Erro ao criar saldo inicial: ${createError.message}`);
      }
    } else {
      // Atualizar saldo existente
      const { error: updateError } = await supabaseClient
        .from('user_credits')
        .update({
          total_credits: currentBalance.total_credits + amount,
          available_credits: currentBalance.available_credits + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Erro ao atualizar saldo: ${updateError.message}`);
      }
    }

    // Registrar transação
    const { error: transactionError } = await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: 'credit',
        source: source,
        description: description,
        related_order_id: relatedOrderId || null
      });

    if (transactionError) {
      throw new Error(`Erro ao registrar transação: ${transactionError.message}`);
    }

    console.log(`Créditos adicionados: ${amount} para usuário ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Créditos adicionados com sucesso",
        amount: amount
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao adicionar créditos:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});