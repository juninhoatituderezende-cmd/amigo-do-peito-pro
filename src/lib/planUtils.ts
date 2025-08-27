import { supabase } from "@/integrations/supabase/client";

export interface ActivePlan {
  id: string;
  status: string;
  group_id: string;
  amount_paid: number;
  joined_at: string;
  group_status?: string;
  service_name?: string;
}

/**
 * Verifica se o usuário possui algum plano ativo usando a nova estrutura
 * Um plano é considerado ativo se:
 * - Usuário tem participação ativa em um grupo
 * - O grupo está em formação ou completo (não cancelado)
 */
export const checkUserActivePlan = async (userId: string): Promise<{
  hasActivePlan: boolean;
  activePlans: ActivePlan[];
  error?: string;
}> => {
  try {
    console.log('🔍 Verificando planos ativos para usuário:', userId);

    // Usar a função do banco para verificar se tem plano ativo
    const { data: hasActivePlan, error: checkError } = await supabase
      .rpc('user_has_active_plan', { user_uuid: userId });

    if (checkError) {
      console.error('❌ Erro ao verificar planos:', checkError);
      return {
        hasActivePlan: false,
        activePlans: [],
        error: checkError.message
      };
    }

    // Se não tem plano ativo, retornar vazio
    if (!hasActivePlan) {
      console.log('📭 Nenhum plano ativo encontrado');
      return {
        hasActivePlan: false,
        activePlans: []
      };
    }

      // Buscar detalhes das participações ativas
      const { data: participations, error: participationError } = await supabase
        .from('group_participants')
        .select(`
          id,
          status,
          group_id,
          amount_paid,
          joined_at,
          plan_groups!inner(
            id,
            status,
            service_id,
            referral_code,
            current_participants,
            max_participants
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .in('plan_groups.status', ['forming', 'complete']);

      if (participationError) {
        console.error('❌ Erro ao buscar detalhes das participações:', participationError);
        return {
          hasActivePlan: true,
          activePlans: [],
          error: participationError.message
        };
      }

      // Para cada participação, buscar o nome do serviço
      const activePlans: ActivePlan[] = await Promise.all(
        (participations || []).map(async (p) => {
          const { data: planData } = await supabase
            .from('custom_plans')
            .select('name')
            .eq('id', p.plan_groups?.service_id)
            .single();

          return {
            id: p.id,
            status: p.status,
            group_id: p.group_id,
            amount_paid: p.amount_paid,
            joined_at: p.joined_at,
            group_status: p.plan_groups?.status,
            service_name: planData?.name || 'Serviço não definido'
          };
        })
      );

    console.log('✅ Verificação concluída:', {
      hasActivePlan: true,
      totalPlans: activePlans.length
    });

    return {
      hasActivePlan: true,
      activePlans
    };

  } catch (error: any) {
    console.error('❌ Erro inesperado ao verificar planos:', error);
    return {
      hasActivePlan: false,
      activePlans: [],
      error: error.message
    };
  }
};

/**
 * Redireciona o usuário baseado no status do plano
 */
export const redirectBasedOnPlanStatus = (
  hasActivePlan: boolean, 
  userRole: string,
  navigate: (path: string, options?: any) => void
) => {
  if (userRole !== 'user') {
    // Outros tipos de usuário seguem fluxo normal
    const dashboardRoute = userRole === 'admin' ? '/admin/dashboard' :
                          userRole === 'professional' ? '/profissional/dashboard' :
                          userRole === 'influencer' ? '/influenciador/dashboard' :
                          '/usuario/dashboard';
    
    navigate(dashboardRoute, { replace: true });
    return;
  }

  // Para usuários comuns, verificar plano ativo
  if (hasActivePlan) {
    console.log('✅ Usuário tem plano ativo, redirecionando para dashboard');
    navigate('/usuario/dashboard', { replace: true });
  } else {
    console.log('⚠️ Usuário sem plano ativo, redirecionando para seleção de planos');
    navigate('/plans', { replace: true });
  }
};