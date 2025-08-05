import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface AutomatedTrigger {
  userId: string;
  triggerType: '15_days' | '30_days' | '60_days' | '90_days' | '180_days';
  executed: boolean;
  executedAt?: string;
  scheduledFor: string;
  groupId: string;
}

export const useNotificationTriggers = () => {
  const [triggers, setTriggers] = useState<AutomatedTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Verificar e executar gatilhos pendentes
  const checkAndExecuteTriggers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('notification-triggers', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('Erro ao verificar gatilhos:', error);
      } else {
        console.log('Gatilhos verificados:', data);
      }
    } catch (error) {
      console.error('Erro ao executar gatilhos:', error);
    }
  };

  // Agendar próximos gatilhos para um usuário
  const scheduleTriggersForUser = async (userId: string, groupId: string, initialDate: Date) => {
    const triggerDays = [15, 30, 60, 90, 180];
    const triggers = triggerDays.map(days => {
      const scheduledDate = new Date(initialDate);
      scheduledDate.setDate(scheduledDate.getDate() + days);
      
      return {
        user_id: userId,
        group_id: groupId,
        trigger_type: `${days}_days` as AutomatedTrigger['triggerType'],
        scheduled_for: scheduledDate.toISOString(),
        executed: false
      };
    });

    try {
      const { error } = await supabase
        .from('notification_triggers')
        .insert(triggers);

      if (error) {
        console.error('Erro ao agendar gatilhos:', error);
      } else {
        console.log('Gatilhos agendados para usuário:', userId);
      }
    } catch (error) {
      console.error('Erro ao agendar gatilhos:', error);
    }
  };

  // Buscar gatilhos do usuário atual
  const loadUserTriggers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_triggers')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Erro ao carregar gatilhos:', error);
      } else {
        const formattedTriggers: AutomatedTrigger[] = data?.map(t => ({
          userId: t.user_id,
          triggerType: t.trigger_type,
          executed: t.executed,
          executedAt: t.executed_at,
          scheduledFor: t.scheduled_for,
          groupId: t.group_id
        })) || [];
        
        setTriggers(formattedTriggers);
      }
    } catch (error) {
      console.error('Erro ao carregar gatilhos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Executar verificação manual de gatilhos (para admins)
  const runTriggersManually = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('notification-triggers');
      
      if (error) {
        console.error('Erro ao executar gatilhos manualmente:', error);
        return false;
      }
      
      console.log('Gatilhos executados manualmente:', data);
      return true;
    } catch (error) {
      console.error('Erro ao executar gatilhos:', error);
      return false;
    }
  };

  // Estatísticas de gatilhos
  const getTriggerStats = () => {
    const total = triggers.length;
    const executed = triggers.filter(t => t.executed).length;
    const pending = total - executed;
    const overdue = triggers.filter(t => 
      !t.executed && new Date(t.scheduledFor) < new Date()
    ).length;

    return { total, executed, pending, overdue };
  };

  useEffect(() => {
    if (user) {
      loadUserTriggers();
      
      // Verificar gatilhos a cada 5 minutos quando o usuário está ativo
      const interval = setInterval(() => {
        checkAndExecuteTriggers();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    triggers,
    loading,
    checkAndExecuteTriggers,
    scheduleTriggersForUser,
    runTriggersManually,
    getTriggerStats,
    refreshTriggers: loadUserTriggers
  };
};