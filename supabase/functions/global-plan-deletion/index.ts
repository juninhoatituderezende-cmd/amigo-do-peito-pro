import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan_id, confirm } = await req.json();

    if (!plan_id || !confirm) {
      throw new Error('Plan ID and confirmation required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🗑️ Iniciando exclusão global do plano: ${plan_id}`);

    // 1. Verificar se o plano existe e obter informações
    let planData: any = null;
    let tableName = '';

    // Buscar em custom_plans
    const { data: customPlan } = await supabase
      .from('custom_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (customPlan) {
      planData = customPlan;
      tableName = 'custom_plans';
    } else {
      // Buscar em planos_tatuador
      const { data: tattPlan } = await supabase
        .from('planos_tatuador')
        .select('*')
        .eq('id', plan_id)
        .single();

      if (tattPlan) {
        planData = tattPlan;
        tableName = 'planos_tatuador';
      } else {
        // Buscar em planos_dentista
        const { data: dentPlan } = await supabase
          .from('planos_dentista')
          .select('*')
          .eq('id', plan_id)
          .single();

        if (dentPlan) {
          planData = dentPlan;
          tableName = 'planos_dentista';
        }
      }
    }

    if (!planData) {
      throw new Error('Plano não encontrado');
    }

    console.log(`📋 Plano encontrado: ${planData.name} na tabela ${tableName}`);

    // 2. Buscar todos os usuários/grupos afetados
    const { data: affectedGroups } = await supabase
      .from('plan_groups')
      .select(`
        id,
        current_participants,
        group_participants (
          id,
          user_id,
          profiles!inner (id, full_name)
        )
      `)
      .eq('service_id', plan_id);

    const { data: affectedParticipants } = await supabase
      .from('group_participants')
      .select(`
        id,
        user_id,
        group_id,
        plan_groups!inner (service_id)
      `)
      .eq('plan_groups.service_id', plan_id);

    const affectedUsersCount = affectedParticipants?.length || 0;
    const affectedGroupsCount = affectedGroups?.length || 0;

    console.log(`👥 Usuários afetados: ${affectedUsersCount}`);
    console.log(`📦 Grupos afetados: ${affectedGroupsCount}`);

    // 3. Remover participações dos usuários
    if (affectedParticipants && affectedParticipants.length > 0) {
      const participantIds = affectedParticipants.map(p => p.id);
      
      // Remover agendamentos relacionados
      const { error: agendError } = await supabase
        .from('agendamentos')
        .delete()
        .in('participation_id', participantIds);

      if (agendError) {
        console.error('Erro ao remover agendamentos:', agendError);
      }

      // Remover participações
      const { error: partError } = await supabase
        .from('group_participants')
        .delete()
        .in('id', participantIds);

      if (partError) {
        console.error('Erro ao remover participações:', partError);
        throw partError;
      }

      console.log(`✅ Removidas ${participantIds.length} participações`);
    }

    // 4. Remover grupos relacionados
    if (affectedGroups && affectedGroups.length > 0) {
      const groupIds = affectedGroups.map(g => g.id);
      
      const { error: groupError } = await supabase
        .from('plan_groups')
        .delete()
        .in('id', groupIds);

      if (groupError) {
        console.error('Erro ao remover grupos:', groupError);
        throw groupError;
      }

      console.log(`✅ Removidos ${groupIds.length} grupos`);
    }

    // 5. Marcar plano como inativo/excluído
    const { error: planError } = await supabase
      .from(tableName)
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', plan_id);

    if (planError) {
      console.error('Erro ao desativar plano:', planError);
      throw planError;
    }

    console.log(`✅ Plano ${planData.name} marcado como inativo`);

    // 6. Criar notificações para usuários afetados (se houver)
    if (affectedParticipants && affectedParticipants.length > 0) {
      const notifications = affectedParticipants.map(participant => ({
        user_id: participant.user_id,
        event_type: 'plan_deleted',
        title: 'Plano Removido',
        message: `O plano "${planData.name}" foi removido do sistema. Entre em contato com o suporte para mais informações.`,
        data: {
          deleted_plan_id: plan_id,
          deleted_plan_name: planData.name
        }
      }));

      const { error: notifError } = await supabase
        .from('notification_triggers')
        .insert(notifications);

      if (notifError) {
        console.error('Erro ao criar notificações:', notifError);
      } else {
        console.log(`📧 Criadas ${notifications.length} notificações`);
      }
    }

    // 7. Preparar relatório
    const report = {
      planName: planData.name,
      affectedUsers: affectedUsersCount,
      affectedGroups: affectedGroupsCount,
      success: true
    };

    console.log(`🎉 Exclusão global concluída com sucesso!`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        report,
        message: `Plano "${planData.name}" excluído com sucesso. ${affectedUsersCount} usuários e ${affectedGroupsCount} grupos foram atualizados.`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Erro na exclusão global:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});