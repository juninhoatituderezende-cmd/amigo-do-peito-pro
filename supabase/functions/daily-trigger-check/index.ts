import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Esta função deve ser executada pelo cron job do Supabase
// Pode ser configurada para rodar diariamente às 2h da manhã
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[CRON] Iniciando verificação automática de gatilhos - ${new Date().toISOString()}`);

    // Inicializar Supabase client com service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    let totalProcessed = 0;

    // Buscar gatilhos que precisam ser executados (data atual >= scheduled_for)
    const { data: triggersToExecute, error: triggersError } = await supabaseClient
      .from('notification_triggers')
      .select(`
        id,
        user_id,
        group_id,
        trigger_type,
        scheduled_for,
        users (email, full_name),
        groups (status, created_at, paid_amount)
      `)
      .eq('executed', false)
      .lte('scheduled_for', now.toISOString());

    if (triggersError) {
      console.error('[CRON] Erro ao buscar gatilhos:', triggersError);
      throw triggersError;
    }

    console.log(`[CRON] Encontrados ${triggersToExecute?.length || 0} gatilhos para executar`);

    if (!triggersToExecute || triggersToExecute.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Nenhum gatilho para executar",
          processed: 0,
          timestamp: now.toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Processar cada gatilho
    for (const trigger of triggersToExecute) {
      try {
        await processTrigger(supabaseClient, trigger);
        totalProcessed++;
        
        // Marcar gatilho como executado
        await supabaseClient
          .from('notification_triggers')
          .update({ 
            executed: true, 
            executed_at: now.toISOString() 
          })
          .eq('id', trigger.id);

        console.log(`[CRON] Gatilho ${trigger.id} executado com sucesso`);
        
      } catch (error) {
        console.error(`[CRON] Erro ao processar gatilho ${trigger.id}:`, error);
        // Continuar com os próximos gatilhos mesmo se um falhar
      }
    }

    // Verificar conversões automáticas para créditos (180+ dias)
    await processAutoConversions(supabaseClient);

    console.log(`[CRON] Verificação concluída: ${totalProcessed} gatilhos processados`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Gatilhos processados com sucesso",
        processed: totalProcessed,
        timestamp: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[CRON] Erro na execução do cron job:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function processTrigger(supabaseClient: any, trigger: any) {
  const { user_id, trigger_type, users, groups } = trigger;
  
  if (!users || !groups) {
    console.log(`[CRON] Dados incompletos para gatilho ${trigger.id}`);
    return;
  }

  const daysSinceCreation = Math.floor(
    (new Date().getTime() - new Date(groups.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Buscar contagem de referrals do usuário
  const { data: referrals } = await supabaseClient
    .from('group_members')
    .select('id')
    .eq('referred_by', user_id);

  const referralCount = referrals?.length || 0;

  let title = "";
  let message = "";
  let actionUrl = "/dashboard";
  let notificationType = "info";

  switch (trigger_type) {
    case '15_days':
      if (referralCount === 0) {
        title = "🚀 Vamos começar suas indicações!";
        message = "Olá! Notamos que você ainda não fez nenhuma indicação. Enviamos materiais para te ajudar a começar!";
      } else {
        title = "📈 Continue compartilhando!";
        message = `Parabéns pelas ${referralCount} indicações! Continue assim para completar seu grupo mais rápido.`;
      }
      actionUrl = "/materiais";
      break;

    case '30_days':
      title = "💡 Novos materiais disponíveis!";
      message = "Adicionamos novos materiais promocionais para ajudar você a divulgar melhor seus links!";
      actionUrl = "/materiais";
      break;

    case '60_days':
      title = "🎯 Estratégias avançadas";
      message = "Acesse nossas dicas exclusivas para formar grupos mais rapidamente. Várias estratégias eficazes te esperam!";
      actionUrl = "/materiais";
      break;

    case '90_days':
      title = "🤝 Considere grupos públicos";
      message = "Que tal tornar seu grupo público ou participar de outros grupos? Isso pode acelerar muito a formação!";
      actionUrl = "/feira-grupos";
      break;

    case '180_days':
      title = "✨ Seus créditos estão disponíveis!";
      message = "Convertemos seu pagamento em créditos! Use no marketplace ou solicite saque quando quiser.";
      actionUrl = "/creditos";
      notificationType = "success";
      break;
  }

  // Criar notificação in-app
  await supabaseClient
    .from('notifications')
    .insert({
      user_id,
      title,
      message,
      type: notificationType,
      category: trigger_type === '180_days' ? 'system' : 'group',
      read: false,
      action_url: actionUrl,
      action_text: trigger_type === '180_days' ? 'Ver Créditos' : 'Ver Materiais'
    });

  console.log(`[CRON] Notificação criada para usuário ${user_id}: ${title}`);

  // Para 180 dias, processar conversão para créditos
  if (trigger_type === '180_days' && groups.status === 'forming') {
    try {
      await supabaseClient.functions.invoke('add-user-credits', {
        body: {
          userId: user_id,
          amount: groups.paid_amount,
          source: 'initial_payment',
          description: `Conversão automática após 180 dias - Grupo #${trigger.group_id}`,
          relatedOrderId: trigger.group_id
        }
      });

      // Atualizar status do grupo
      await supabaseClient
        .from('groups')
        .update({ status: 'expired_converted' })
        .eq('id', trigger.group_id);

      console.log(`[CRON] Conversão para créditos realizada: ${groups.paid_amount} para usuário ${user_id}`);
    } catch (error) {
      console.error(`[CRON] Erro na conversão para créditos:`, error);
    }
  }
}

async function processAutoConversions(supabaseClient: any) {
  console.log('[CRON] Verificando conversões automáticas adicionais...');

  // Buscar grupos antigos que ainda não foram convertidos (sem gatilho de 180 dias)
  const { data: oldGroups, error } = await supabaseClient
    .from('groups')
    .select('id, user_id, paid_amount, created_at')
    .eq('status', 'forming')
    .lt('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('[CRON] Erro ao buscar grupos antigos:', error);
    return;
  }

  if (!oldGroups || oldGroups.length === 0) {
    console.log('[CRON] Nenhum grupo antigo para conversão encontrado');
    return;
  }

  for (const group of oldGroups) {
    // Verificar se já foi convertido
    const { data: existingTransaction } = await supabaseClient
      .from('credit_transactions')
      .select('id')
      .eq('user_id', group.user_id)
      .eq('source', 'initial_payment')
      .eq('related_order_id', group.id)
      .single();

    if (existingTransaction) {
      continue; // Já foi convertido
    }

    try {
      await supabaseClient.functions.invoke('add-user-credits', {
        body: {
          userId: group.user_id,
          amount: group.paid_amount,
          source: 'initial_payment',
          description: `Conversão automática de grupo antigo - Grupo #${group.id}`,
          relatedOrderId: group.id
        }
      });

      await supabaseClient
        .from('groups')
        .update({ status: 'expired_converted' })
        .eq('id', group.id);

      console.log(`[CRON] Conversão automática de grupo antigo: ${group.paid_amount} para usuário ${group.user_id}`);
    } catch (error) {
      console.error(`[CRON] Erro na conversão de grupo antigo ${group.id}:`, error);
    }
  }
}