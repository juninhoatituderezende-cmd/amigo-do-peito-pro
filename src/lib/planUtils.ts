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
 * Verifica se o usuário possui algum plano ativo
 * Um plano é considerado ativo se:
 * - Usuário tem participação ativa em um grupo
 * - O grupo não foi contemplado/finalizado ainda
 */
export const checkUserActivePlan = async (userId: string): Promise<{
  hasActivePlan: boolean;
  activePlans: ActivePlan[];
  error?: string;
}> => {
  try {
    console.log('🔍 Verificando planos ativos para usuário:', userId);

    // Buscar participações ativas do usuário
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
          services(name)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (participationError) {
      console.error('❌ Erro ao buscar participações:', participationError);
      return {
        hasActivePlan: false,
        activePlans: [],
        error: participationError.message
      };
    }

    console.log('📊 Participações encontradas:', participations);

    if (!participations || participations.length === 0) {
      console.log('📭 Nenhuma participação ativa encontrada');
      return {
        hasActivePlan: false,
        activePlans: []
      };
    }

    // Filtrar apenas grupos que não foram contemplados/finalizados
    const activePlans: ActivePlan[] = participations
      .filter(p => p.plan_groups?.status !== 'complete')
      .map(p => ({
        id: p.id,
        status: p.status,
        group_id: p.group_id,
        amount_paid: p.amount_paid,
        joined_at: p.joined_at,
        group_status: p.plan_groups?.status,
        service_name: p.plan_groups?.services?.name || 'Serviço não definido'
      }));

    const hasActivePlan = activePlans.length > 0;

    console.log('✅ Verificação concluída:', {
      hasActivePlan,
      totalPlans: activePlans.length
    });

    return {
      hasActivePlan,
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