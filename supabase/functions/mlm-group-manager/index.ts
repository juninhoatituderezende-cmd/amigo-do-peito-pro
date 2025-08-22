import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GroupAction {
  action: 'create' | 'join' | 'contemplate' | 'status' | 'history';
  serviceId?: string;
  amount?: number;
  referrerId?: string;
  groupId?: string;
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

    const body: GroupAction = await req.json();

    let result;
    switch (body.action) {
      case 'create':
        result = await createGroup(supabase, user.id, body);
        break;
      case 'join':
        result = await joinGroup(supabase, user.id, body);
        break;
      case 'contemplate':
        result = await contemplateGroup(supabase, body.groupId!);
        break;
      case 'status':
        result = await getGroupStatus(supabase, user.id, body.groupId);
        break;
      case 'history':
        result = await getUserGroupHistory(supabase, user.id);
        break;
      default:
        throw new Error('Ação inválida');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no gerenciamento de grupos:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createGroup(supabase: any, userId: string, action: GroupAction) {
  if (!action.serviceId || !action.amount) {
    throw new Error('ServiceId e amount são obrigatórios');
  }

  // Verificar se já existe grupo em formação para este serviço
  const { data: existingGroup } = await supabase
    .from('plan_groups')
    .select('*')
    .eq('service_id', action.serviceId)
    .eq('status', 'forming')
    .lt('current_participants', 10)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (existingGroup) {
    return { group: existingGroup, message: 'Grupo existente encontrado' };
  }

  // Criar novo grupo
  const groupNumber = Math.floor(Math.random() * 10000);
  const { data: newGroup } = await supabase
    .from('plan_groups')
    .insert({
      service_id: action.serviceId,
      group_number: groupNumber,
      target_amount: action.amount * 10,
      current_amount: 0,
      current_participants: 0,
      max_participants: 10,
      status: 'forming',
      created_by: userId
    })
    .select()
    .single();

  return { group: newGroup, message: 'Novo grupo criado' };
}

async function joinGroup(supabase: any, userId: string, action: GroupAction) {
  if (!action.serviceId || !action.amount) {
    throw new Error('ServiceId e amount são obrigatórios');
  }

  // Buscar grupo disponível
  const { data: availableGroup } = await supabase
    .from('plan_groups')
    .select('*')
    .eq('service_id', action.serviceId)
    .eq('status', 'forming')
    .lt('current_participants', 10)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!availableGroup) {
    // Criar novo grupo se não houver disponível
    const newGroup = await createGroup(supabase, userId, action);
    return newGroup;
  }

  // Verificar se usuário já está no grupo
  const { data: existingParticipation } = await supabase
    .from('group_participants')
    .select('id')
    .eq('group_id', availableGroup.id)
    .eq('user_id', userId)
    .single();

  if (existingParticipation) {
    throw new Error('Usuário já está neste grupo');
  }

  // Adicionar participante
  const { data: participation } = await supabase
    .from('group_participants')
    .insert({
      group_id: availableGroup.id,
      user_id: userId,
      amount_paid: action.amount,
      referrer_id: action.referrerId,
      status: 'pending' // Será confirmado via webhook de pagamento
    })
    .select()
    .single();

  return {
    group: availableGroup,
    participation,
    message: 'Participação registrada (pendente confirmação de pagamento)'
  };
}

async function contemplateGroup(supabase: any, groupId: string) {
  // Buscar grupo e participantes
  const { data: group } = await supabase
    .from('plan_groups')
    .select('*')
    .eq('id', groupId)
    .eq('status', 'complete')
    .single();

  if (!group) {
    throw new Error('Grupo não encontrado ou não está completo');
  }

  if (group.status === 'contemplated') {
    throw new Error('Grupo já foi contemplado');
  }

  // Buscar participantes ativos
  const { data: participants } = await supabase
    .from('group_participants')
    .select('user_id, profiles:user_id(full_name)')
    .eq('group_id', groupId)
    .eq('status', 'active');

  if (!participants || participants.length < 10) {
    throw new Error('Grupo não tem participantes suficientes para contemplação');
  }

  // Sortear contemplado
  const winnerIndex = Math.floor(Math.random() * participants.length);
  const winner = participants[winnerIndex];

  // Atualizar grupo
  const { data: updatedGroup } = await supabase
    .from('plan_groups')
    .update({
      status: 'contemplated',
      winner_id: winner.user_id,
      contemplated_at: new Date().toISOString()
    })
    .eq('id', groupId)
    .select()
    .single();

  // Atualizar participantes
  await supabase
    .from('group_participants')
    .update({ status: 'completed' })
    .eq('group_id', groupId);

  // Marcar vencedor
  await supabase
    .from('group_participants')
    .update({ status: 'winner' })
    .eq('group_id', groupId)
    .eq('user_id', winner.user_id);

  // Enviar notificações
  await sendContemplationNotifications(supabase, groupId, winner.user_id, participants);

  // Processar comissões MLM
  await processMLMCommissions(supabase, groupId, group.target_amount);

  return {
    group: updatedGroup,
    winner: winner,
    message: `Grupo contemplado! Vencedor: ${winner.profiles?.full_name || 'N/A'}`
  };
}

async function getGroupStatus(supabase: any, userId: string, groupId?: string) {
  if (groupId) {
    // Status de um grupo específico
    const { data: group } = await supabase
      .from('plan_groups')
      .select(`
        *,
        participants:group_participants(
          user_id,
          amount_paid,
          status,
          joined_at,
          profiles:user_id(full_name)
        )
      `)
      .eq('id', groupId)
      .single();

    return { group };
  } else {
    // Grupos ativos do usuário
    const { data: userGroups } = await supabase
      .from('group_participants')
      .select(`
        *,
        plan_groups:group_id(*)
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'pending', 'winner'])
      .order('joined_at', { ascending: false });

    return { userGroups };
  }
}

async function getUserGroupHistory(supabase: any, userId: string) {
  const { data: history } = await supabase
    .from('group_participants')
    .select(`
      *,
      plan_groups:group_id(
        group_number,
        status,
        winner_id,
        contemplated_at,
        target_amount
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
    .limit(20);

  // Estatísticas do usuário
  const { data: stats } = await supabase
    .from('group_participants')
    .select('status')
    .eq('user_id', userId);

  const statistics = {
    total_groups: stats?.length || 0,
    active_groups: stats?.filter(s => s.status === 'active')?.length || 0,
    completed_groups: stats?.filter(s => s.status === 'completed')?.length || 0,
    won_groups: stats?.filter(s => s.status === 'winner')?.length || 0
  };

  return { history, statistics };
}

async function sendContemplationNotifications(supabase: any, groupId: string, winnerId: string, participants: any[]) {
  // Notificar vencedor
  await supabase
    .from('notification_triggers')
    .insert({
      event_type: 'group_winner',
      user_id: winnerId,
      title: '🎉 PARABÉNS! Você foi contemplado!',
      message: 'Seu grupo MLM foi concluído e você foi o sortudo contemplado! Entre em contato conosco para resgatar seu prêmio.',
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
}

async function processMLMCommissions(supabase: any, groupId: string, totalAmount: number) {
  // Buscar participantes com referenciadores
  const { data: participants } = await supabase
    .from('group_participants')
    .select('user_id, referrer_id, amount_paid')
    .eq('group_id', groupId)
    .not('referrer_id', 'is', null);

  // Processar comissões (5% do valor total do grupo)
  const commissionRate = 0.05;
  
  for (const participant of participants || []) {
    if (participant.referrer_id) {
      const commissionAmount = participant.amount_paid * commissionRate;

      // Creditar comissão
      await supabase.rpc('manage-credits', {
        action: 'add',
        user_id: participant.referrer_id,
        amount: commissionAmount,
        description: `Comissão MLM - Grupo contemplado #${groupId}`,
        reference_id: groupId,
        reference_table: 'plan_groups'
      });

      // Registrar comissão
      await supabase
        .from('mlm_commissions')
        .insert({
          referrer_id: participant.referrer_id,
          referred_id: participant.user_id,
          group_id: groupId,
          commission_amount: commissionAmount,
          commission_type: 'group_completion',
          status: 'paid'
        });
    }
  }
}