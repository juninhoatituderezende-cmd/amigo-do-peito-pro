import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreditOperation {
  action: 'add' | 'use' | 'withdraw' | 'balance';
  amount?: number;
  description?: string;
  referenceId?: string;
  referenceTable?: string;
  withdrawalMethod?: 'pix' | 'bank_transfer';
  pixKey?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CreditOperation = await req.json();

    let result;
    switch (body.action) {
      case 'balance':
        result = await getUserBalance(supabase, user.id);
        break;
      case 'add':
        result = await addCredits(supabase, user.id, body);
        break;
      case 'use':
        result = await useCredits(supabase, user.id, body);
        break;
      case 'withdraw':
        result = await requestWithdrawal(supabase, user.id, body);
        break;
      default:
        throw new Error('Ação inválida');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no gerenciamento de créditos:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getUserBalance(supabase: any, userId: string) {
  // Buscar ou criar saldo do usuário
  let { data: balance } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!balance) {
    // Criar saldo inicial
    const { data: newBalance } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        total_credits: 0,
        available_credits: 0,
        pending_credits: 0
      })
      .select()
      .single();

    balance = newBalance;
  }

  // Buscar últimas transações
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    balance,
    transactions: transactions || []
  };
}

async function addCredits(supabase: any, userId: string, operation: CreditOperation) {
  if (!operation.amount || operation.amount <= 0) {
    throw new Error('Valor inválido');
  }

  // Buscar saldo atual
  const { data: currentBalance } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  const newTotal = (currentBalance?.total_credits || 0) + operation.amount;
  const newAvailable = (currentBalance?.available_credits || 0) + operation.amount;

  // Atualizar saldo
  const { data: updatedBalance } = await supabase
    .from('user_credits')
    .upsert({
      user_id: userId,
      total_credits: newTotal,
      available_credits: newAvailable,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  // Registrar transação
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      type: 'earned',
      amount: operation.amount,
      description: operation.description || 'Créditos adicionados',
      reference_id: operation.referenceId,
      reference_table: operation.referenceTable,
      status: 'completed'
    });

  return updatedBalance;
}

async function useCredits(supabase: any, userId: string, operation: CreditOperation) {
  if (!operation.amount || operation.amount <= 0) {
    throw new Error('Valor inválido');
  }

  // Buscar saldo atual
  const { data: currentBalance } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!currentBalance || currentBalance.available_credits < operation.amount) {
    throw new Error('Saldo insuficiente');
  }

  const newAvailable = currentBalance.available_credits - operation.amount;

  // Atualizar saldo
  const { data: updatedBalance } = await supabase
    .from('user_credits')
    .update({
      available_credits: newAvailable,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();

  // Registrar transação
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      type: 'spent',
      amount: -operation.amount,
      description: operation.description || 'Créditos utilizados',
      reference_id: operation.referenceId,
      reference_table: operation.referenceTable,
      status: 'completed'
    });

  return updatedBalance;
}

async function requestWithdrawal(supabase: any, userId: string, operation: CreditOperation) {
  if (!operation.amount || operation.amount <= 0) {
    throw new Error('Valor inválido para saque');
  }

  const minWithdrawal = 50; // Valor mínimo para saque
  if (operation.amount < minWithdrawal) {
    throw new Error(`Valor mínimo para saque é R$ ${minWithdrawal}`);
  }

  // Buscar saldo atual
  const { data: currentBalance } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!currentBalance || currentBalance.available_credits < operation.amount) {
    throw new Error('Saldo insuficiente para saque');
  }

  // Criar solicitação de saque
  const { data: withdrawal } = await supabase
    .from('withdrawal_requests')
    .insert({
      user_id: userId,
      amount: operation.amount,
      method: operation.withdrawalMethod || 'pix',
      pix_key: operation.pixKey,
      status: 'pending'
    })
    .select()
    .single();

  // Bloquear créditos (mover para pending)
  const newAvailable = currentBalance.available_credits - operation.amount;
  const newPending = (currentBalance.pending_credits || 0) + operation.amount;

  await supabase
    .from('user_credits')
    .update({
      available_credits: newAvailable,
      pending_credits: newPending,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  // Registrar transação
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      type: 'withdrawal_request',
      amount: -operation.amount,
      description: `Solicitação de saque - ${operation.withdrawalMethod}`,
      reference_id: withdrawal.id,
      reference_table: 'withdrawal_requests',
      status: 'pending'
    });

  // Notificar administradores
  await supabase
    .from('notification_triggers')
    .insert({
      event_type: 'withdrawal_request',
      user_id: userId,
      title: 'Nova Solicitação de Saque',
      message: `Usuário solicitou saque de R$ ${operation.amount.toFixed(2)}`,
      data: {
        withdrawal_id: withdrawal.id,
        amount: operation.amount,
        method: operation.withdrawalMethod
      }
    });

  return withdrawal;
}