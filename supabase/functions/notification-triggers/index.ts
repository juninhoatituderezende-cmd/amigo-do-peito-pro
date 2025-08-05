import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserAlert {
  userId: string;
  email: string;
  fullName: string;
  daysInactive: number;
  groupStatus: string;
  lastActivity: string;
  referralCount: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFICATION-TRIGGERS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Iniciando verificação de gatilhos temporais");

    // Inicializar Supabase client com service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const alerts: UserAlert[] = [];

    // Buscar usuários com grupos em formação há mais de 15 dias
    const { data: usersWithGroups, error: groupsError } = await supabaseClient
      .from('groups')
      .select(`
        user_id,
        created_at,
        status,
        users (email, full_name),
        group_members (count)
      `)
      .eq('status', 'forming');

    if (groupsError) {
      logStep("Erro ao buscar grupos", { error: groupsError.message });
    } else {
      logStep("Grupos encontrados", { count: usersWithGroups?.length || 0 });

      for (const group of usersWithGroups || []) {
        const createdAt = new Date(group.created_at);
        const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        // Verificar se precisa de alerta (15, 30, 60, 90, 180 dias)
        const alertDays = [15, 30, 60, 90, 180];
        
        if (alertDays.includes(daysDiff)) {
          // Buscar contagem de indicações do usuário
          const { data: referrals, error: referralsError } = await supabaseClient
            .from('group_members')
            .select('id')
            .eq('referred_by', group.user_id);

          const referralCount = referrals?.length || 0;

          alerts.push({
            userId: group.user_id,
            email: group.users.email,
            fullName: group.users.full_name,
            daysInactive: daysDiff,
            groupStatus: group.status,
            lastActivity: group.created_at,
            referralCount
          });

          logStep(`Alerta criado para usuário ${group.user_id}`, { 
            days: daysDiff, 
            referrals: referralCount 
          });
        }
      }
    }

    // Processar alertas e criar notificações
    for (const alert of alerts) {
      await processUserAlert(supabaseClient, alert);
    }

    // Verificar conversões automáticas para créditos (180+ dias)
    await processAutoConversions(supabaseClient);

    // Enviar resumo para admins se houver alertas
    if (alerts.length > 0) {
      await notifyAdmins(supabaseClient, alerts);
    }

    logStep("Verificação concluída", { 
      alertsProcessed: alerts.length,
      timestamp: now.toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsProcessed: alerts.length,
        timestamp: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    logStep("ERRO no processamento de gatilhos", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function processUserAlert(supabaseClient: any, alert: UserAlert) {
  const { userId, daysInactive, referralCount, fullName } = alert;
  
  let title = "";
  let message = "";
  let actionUrl = "/dashboard";
  let emailTemplate = "";

  switch (daysInactive) {
    case 15:
      if (referralCount === 0) {
        title = "🚀 Vamos começar suas indicações!";
        message = "Olá! Notamos que você ainda não fez nenhuma indicação. Que tal começar compartilhando com amigos?";
        emailTemplate = "first_reminder";
      } else {
        title = "📈 Continue compartilhando!";
        message = `Parabéns pelas ${referralCount} indicações! Continue assim para completar seu grupo mais rápido.`;
        emailTemplate = "encouragement";
      }
      break;

    case 30:
      title = "💡 Materiais de ajuda disponíveis";
      message = "Enviamos novos materiais promocionais para ajudar você a divulgar melhor seus links!";
      emailTemplate = "materials_available";
      actionUrl = "/biblioteca-materiais";
      break;

    case 60:
      title = "🎯 Estratégias para acelerar seu grupo";
      message = "Que tal conhecer nossas dicas para formar grupos mais rapidamente? Temos várias estratégias eficazes!";
      emailTemplate = "strategies_tips";
      break;

    case 90:
      title = "🤝 Grupos públicos disponíveis";
      message = "Considere participar de grupos públicos ou tornar o seu público para acelerar a formação!";
      emailTemplate = "public_groups_info";
      actionUrl = "/feira-grupos";
      break;

    case 180:
      title = "✨ Seus créditos estão disponíveis!";
      message = "Após 180 dias, convertemos seu pagamento em créditos! Use no marketplace ou solicite saque.";
      emailTemplate = "credits_available";
      actionUrl = "/creditos";
      break;
  }

  // Criar notificação in-app
  const { error: notificationError } = await supabaseClient
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type: daysInactive >= 180 ? 'success' : 'info',
      category: daysInactive >= 180 ? 'system' : 'group',
      read: false,
      action_url: actionUrl,
      action_text: daysInactive >= 180 ? 'Ver Créditos' : 'Ver Detalhes'
    });

  if (notificationError) {
    logStep("Erro ao criar notificação", { userId, error: notificationError.message });
  }

  // Enviar email
  try {
    await supabaseClient.functions.invoke('send-notification-email', {
      body: {
        userId,
        type: 'automated_reminder',
        templateData: {
          fullName,
          daysInactive,
          referralCount,
          template: emailTemplate,
          actionUrl
        }
      }
    });
    logStep(`Email enviado para usuário ${userId}`, { template: emailTemplate });
  } catch (emailError) {
    logStep("Erro ao enviar email", { userId, error: emailError.message });
  }
}

async function processAutoConversions(supabaseClient: any) {
  logStep("Verificando conversões automáticas para créditos");

  // Buscar grupos com mais de 180 dias que ainda não foram convertidos
  const { data: expiredGroups, error } = await supabaseClient
    .from('groups')
    .select(`
      id,
      user_id,
      paid_amount,
      created_at,
      users (email, full_name)
    `)
    .eq('status', 'forming')
    .lt('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    logStep("Erro ao buscar grupos expirados", { error: error.message });
    return;
  }

  if (!expiredGroups || expiredGroups.length === 0) {
    logStep("Nenhum grupo para conversão automática encontrado");
    return;
  }

  logStep(`Grupos para conversão encontrados`, { count: expiredGroups.length });

  for (const group of expiredGroups) {
    // Verificar se já foi convertido
    const { data: existingTransaction } = await supabaseClient
      .from('credit_transactions')
      .select('id')
      .eq('user_id', group.user_id)
      .eq('source', 'initial_payment')
      .eq('related_order_id', group.id)
      .single();

    if (existingTransaction) {
      logStep(`Grupo ${group.id} já foi convertido anteriormente`);
      continue;
    }

    // Adicionar créditos
    try {
      await supabaseClient.functions.invoke('add-user-credits', {
        body: {
          userId: group.user_id,
          amount: group.paid_amount,
          source: 'initial_payment',
          description: `Conversão automática após 180 dias - Grupo #${group.id}`,
          relatedOrderId: group.id
        }
      });

      // Atualizar status do grupo
      await supabaseClient
        .from('groups')
        .update({ status: 'expired_converted' })
        .eq('id', group.id);

      logStep(`Conversão automática realizada`, { 
        groupId: group.id, 
        userId: group.user_id, 
        amount: group.paid_amount 
      });

    } catch (conversionError) {
      logStep("Erro na conversão automática", { 
        groupId: group.id, 
        error: conversionError.message 
      });
    }
  }
}

async function notifyAdmins(supabaseClient: any, alerts: UserAlert[]) {
  logStep("Enviando resumo para admins");

  // Buscar admins
  const { data: admins, error } = await supabaseClient
    .from('users')
    .select('id, email')
    .eq('role', 'admin');

  if (error || !admins || admins.length === 0) {
    logStep("Nenhum admin encontrado");
    return;
  }

  const alertsByType = {
    critical: alerts.filter(a => a.daysInactive >= 90 && a.referralCount === 0),
    warning: alerts.filter(a => a.daysInactive >= 30 && a.daysInactive < 90),
    info: alerts.filter(a => a.daysInactive < 30)
  };

  for (const admin of admins) {
    const { error: adminNotificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: admin.id,
        title: `📊 Relatório de Usuários - ${alerts.length} alertas`,
        message: `Críticos: ${alertsByType.critical.length}, Atenção: ${alertsByType.warning.length}, Info: ${alertsByType.info.length}`,
        type: alertsByType.critical.length > 0 ? 'warning' : 'info',
        category: 'system',
        read: false,
        action_url: '/admin/relatorios',
        action_text: 'Ver Relatório'
      });

    if (adminNotificationError) {
      logStep("Erro ao notificar admin", { adminId: admin.id, error: adminNotificationError.message });
    }
  }
}