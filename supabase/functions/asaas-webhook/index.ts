import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AsaasWebhookEvent {
  event: string;
  payment: {
    id: string;
    status: string;
    value: number;
    netValue: number;
    externalReference: string;
    customer: string;
    billingType: string;
    confirmedDate?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookEvent: AsaasWebhookEvent = await req.json();
    console.log('Webhook recebido:', webhookEvent);

    const { event, payment } = webhookEvent;

    // Processar apenas eventos de pagamento confirmado
    if (event === 'PAYMENT_RECEIVED' && payment.status === 'RECEIVED') {
      await processPaymentConfirmation(supabase, payment);
    } else if (event === 'PAYMENT_CONFIRMED' && payment.status === 'CONFIRMED') {
      await processPaymentConfirmation(supabase, payment);
    } else if (event === 'PAYMENT_OVERDUE') {
      await processPaymentOverdue(supabase, payment);
    } else if (event === 'PAYMENT_DELETED') {
      await processPaymentCancellation(supabase, payment);
    }

    return new Response(
      JSON.stringify({ success: true, processed: event }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no webhook Asaas:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// FUNÇÕES DE PROCESSAMENTO
// ============================================================================

async function processPaymentConfirmation(supabase: any, payment: any) {
  console.log(`Processando confirmação de pagamento: ${payment.id}`);

  // 1. Atualizar status da venda no marketplace
  const { data: sale, error: saleError } = await supabase
    .from('marketplace_sales')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('payment_id', payment.id)
    .select(`*, services:service_id ( id, name, professional_id )`)
    .single();

  if (saleError) {
    console.error('Erro ao atualizar venda:', saleError);
    return;
  }

  if (!sale) {
    console.log('Venda não encontrada para payment_id:', payment.id);
    return;
  }

  // 2. Processar split de pagamento se ainda não foi processado
  const { data: existingSplit } = await supabase
    .from('payment_splits')
    .select('id')
    .eq('payment_id', payment.id)
    .eq('status', 'processed')
    .single();

  if (!existingSplit) {
    await processConfirmedSplit(supabase, payment, sale);
  }

  // 3. Se for pagamento de grupo MLM, processar participação
  if (sale.referrer_id) {
    await processMLMParticipation(supabase, sale);
  }

  // 4. Creditar valores para profissional
  await creditProfessional(supabase, sale, payment);

  // 5. Enviar notificações
  await sendPaymentNotifications(supabase, sale, payment);

  console.log(`Pagamento ${payment.id} processado com sucesso`);
}

async function processConfirmedSplit(supabase: any, payment: any, sale: any) {
  // Buscar regras de split
  const { data: splitRule } = await supabase
    .from('payment_split_rules')
    .select('*')
    .eq('service_id', sale.service_id)
    .single();

  const professionalPercentage = splitRule?.professional_percentage || 70;
  const platformPercentage = splitRule?.platform_percentage || 20;
  const referrerPercentage = splitRule?.referrer_percentage || 10;

  const totalAmount = sale.total_amount;
  const professionalAmount = totalAmount * (professionalPercentage / 100);
  const platformAmount = totalAmount * (platformPercentage / 100);
  const referrerAmount = sale.referrer_id ? totalAmount * (referrerPercentage / 100) : 0;

  // Registrar split
  await supabase
    .from('payment_splits')
    .insert({
      payment_id: payment.id,
      service_id: sale.service_id,
      professional_id: sale.seller_id,
      referrer_id: sale.referrer_id,
      total_amount: totalAmount,
      professional_amount: professionalAmount,
      platform_amount: platformAmount,
      referrer_amount: referrerAmount,
      status: 'processed',
      processed_at: new Date().toISOString()
    });

  // Creditar comissão para referenciador
  if (sale.referrer_id && referrerAmount > 0) {
    await creditReferrer(supabase, sale.referrer_id, referrerAmount, sale.service_id);
  }
}

async function creditProfessional(supabase: any, sale: any, payment: any) {
  // Buscar dados do profissional
  const { data: professional } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', sale.seller_id)
    .single();

  if (professional) {
    // Atualizar créditos do profissional
    await supabase
      .from('user_credits')
      .upsert({
        user_id: professional.user_id,
        total_credits: payment.netValue * 0.7, // 70% para o profissional
        available_credits: payment.netValue * 0.7
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    // Registrar transação
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: professional.user_id,
        type: 'earned',
        amount: payment.netValue * 0.7,
        description: `Venda confirmada: ${sale.services.name}`,
        reference_id: sale.id,
        reference_table: 'marketplace_sales',
        status: 'completed'
      });
  }
}

async function creditReferrer(supabase: any, referrerId: string, amount: number, serviceId: string) {
  // Buscar dados do referenciador
  const { data: referrer } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', referrerId)
    .single();

  if (referrer) {
    // Atualizar créditos do referenciador
    const { data: currentCredits } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', referrer.user_id)
      .single();

    const newTotal = (currentCredits?.total_credits || 0) + amount;
    const newAvailable = (currentCredits?.available_credits || 0) + amount;

    await supabase
      .from('user_credits')
      .upsert({
        user_id: referrer.user_id,
        total_credits: newTotal,
        available_credits: newAvailable,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    // Registrar transação
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: referrer.user_id,
        type: 'earned',
        amount: amount,
        description: 'Comissão MLM - Referência confirmada',
        reference_id: serviceId,
        reference_table: 'services',
        status: 'completed'
      });

    // Notificar referenciador
    await supabase
      .from('notification_triggers')
      .insert({
        event_type: 'commission_earned',
        user_id: referrer.user_id,
        title: 'Nova Comissão Recebida! 💰',
        message: `Você ganhou R$ ${amount.toFixed(2)} de comissão MLM!`,
        data: { amount, service_id: serviceId }
      });
  }
}

async function processMLMParticipation(supabase: any, sale: any) {
  // Verificar se é participação em grupo
  const { data: groupParticipation } = await supabase
    .from('group_participants')
    .select(`*, plan_groups:group_id ( id, current_participants, max_participants, status )`)
    .eq('user_id', sale.buyer_id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
    .limit(1)
    .single();

  if (groupParticipation && groupParticipation.plan_groups) {
    const group = groupParticipation.plan_groups;

    // Se grupo atingiu número máximo, processar contemplação
    if (group.current_participants >= group.max_participants && group.status === 'complete') {
      await processGroupContemplation(supabase, group.id);
    }
  }
}

async function processGroupContemplation(supabase: any, groupId: string) {
  // Buscar participantes do grupo
  const { data: participants } = await supabase
    .from('group_participants')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('status', 'active');

  if (participants && participants.length >= 10) {
    // Sortear contemplado
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const winnerId = participants[winnerIndex].user_id;

    // Atualizar grupo
    await supabase
      .from('plan_groups')
      .update({
        status: 'contemplated',
        winner_id: winnerId,
        contemplated_at: new Date().toISOString()
      })
      .eq('id', groupId);

    // Atualizar status dos participantes
    await supabase
      .from('group_participants')
      .update({ status: 'completed' })
      .eq('group_id', groupId);

    // Marcar vencedor
    await supabase
      .from('group_participants')
      .update({ status: 'winner' })
      .eq('group_id', groupId)
      .eq('user_id', winnerId);

    // Notificar vencedor
    await supabase
      .from('notification_triggers')
      .insert({
        event_type: 'group_winner',
        user_id: winnerId,
        title: '🎉 PARABÉNS! Você foi contemplado!',
        message: 'Seu grupo MLM foi concluído e você foi o sortudo contemplado! Entre em contato para resgatar seu prêmio.',
        data: { group_id: groupId }
      });

    // Notificar outros participantes
    for (const participant of participants) {
      if (participant.user_id !== winnerId) {
        await supabase
          .from('notification_triggers')
          .insert({
            event_type: 'group_completed',
            user_id: participant.user_id,
            title: 'Grupo MLM Concluído',
            message: 'Seu grupo foi concluído! Continue participando para ter mais chances de ser contemplado.',
            data: { group_id: groupId, winner_id: winnerId }
          });
      }
    }

    console.log(`Grupo ${groupId} contemplado. Vencedor: ${winnerId}`);
  }
}

async function sendPaymentNotifications(supabase: any, sale: any, payment: any) {
  // Notificar comprador
  await supabase
    .from('notification_triggers')
    .insert({
      event_type: 'payment_confirmed',
      user_id: sale.buyer_id,
      title: 'Pagamento Confirmado! ✅',
      message: `Seu pagamento de R$ ${payment.value.toFixed(2)} foi confirmado. O produto/serviço será entregue em breve.`,
      data: {
        payment_id: payment.id,
        sale_id: sale.id,
        amount: payment.value
      }
    });

  // Notificar vendedor/profissional
  const { data: professional } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', sale.seller_id)
    .single();

  if (professional) {
    await supabase
      .from('notification_triggers')
      .insert({
        event_type: 'sale_confirmed',
        user_id: professional.user_id,
        title: 'Nova Venda Confirmada! 💰',
        message: `Pagamento de R$ ${payment.value.toFixed(2)} foi confirmado. Prepare-se para entregar o serviço.`,
        data: {
          payment_id: payment.id,
          sale_id: sale.id,
          amount: payment.value,
          service_name: sale.services?.name
        }
      });
  }
}

async function processPaymentOverdue(supabase: any, payment: any) {
  // Atualizar status para vencido
  await supabase
    .from('marketplace_sales')
    .update({
      status: 'overdue',
      updated_at: new Date().toISOString()
    })
    .eq('payment_id', payment.id);

  console.log(`Pagamento ${payment.id} marcado como vencido`);
}

async function processPaymentCancellation(supabase: any, payment: any) {
  // Cancelar venda
  await supabase
    .from('marketplace_sales')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('payment_id', payment.id);

  // Estornar créditos se foram usados
  const { data: sale } = await supabase
    .from('marketplace_sales')
    .select('buyer_id, credits_used')
    .eq('payment_id', payment.id)
    .single();

  if (sale && sale.credits_used > 0) {
    // Estornar créditos
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('available_credits')
      .eq('user_id', sale.buyer_id)
      .single();

    if (userCredits) {
      await supabase
        .from('user_credits')
        .update({
          available_credits: userCredits.available_credits + sale.credits_used,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', sale.buyer_id);

      // Registrar estorno
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: sale.buyer_id,
          type: 'refund',
          amount: sale.credits_used,
          description: 'Estorno - Pagamento cancelado',
          reference_id: payment.id,
          reference_table: 'payments'
        });
    }
  }

  console.log(`Pagamento ${payment.id} cancelado e estornado`);
}