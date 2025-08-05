import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
  userId: string;
  category: 'group' | 'referral' | 'payment' | 'system' | 'achievement';
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar notificações do usuário
  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedNotifications: Notification[] = data?.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.created_at,
        actionUrl: n.action_url,
        actionText: n.action_text,
        userId: n.user_id,
        category: n.category
      })) || [];

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova notificação
  const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          read: notificationData.read,
          action_url: notificationData.actionUrl,
          action_text: notificationData.actionText,
          category: notificationData.category
        })
        .select()
        .single();

      if (error) throw error;

      const newNotification: Notification = {
        id: data.id,
        title: data.title,
        message: data.message,
        type: data.type,
        read: data.read,
        createdAt: data.created_at,
        actionUrl: data.action_url,
        actionText: data.action_text,
        userId: data.user_id,
        category: data.category
      };

      setNotifications(prev => [newNotification, ...prev]);

      // Mostrar toast para notificações importantes
      if (!notificationData.read && notificationData.type === 'success') {
        toast({
          title: notificationData.title,
          description: notificationData.message,
        });
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  // Marcar como lida
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );

      toast({
        title: "Notificações marcadas como lidas",
        description: "Todas as notificações foram marcadas como lidas.",
      });
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  // Deletar notificação
  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
      
      toast({
        title: "Notificação removida",
        description: "A notificação foi removida com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  // Helpers para criar notificações específicas
  const notifyGroupUpdate = (groupName: string, membersCount: number, maxMembers: number) => {
    createNotification({
      title: 'Grupo Atualizado',
      message: `O ${groupName} agora tem ${membersCount}/${maxMembers} membros.`,
      type: 'info',
      read: false,
      category: 'group',
      actionUrl: '/dashboard',
      actionText: 'Ver Grupos'
    });
  };

  const notifyReferralSuccess = (referredName: string, commission: number) => {
    createNotification({
      title: 'Nova Indicação Convertida!',
      message: `${referredName} se inscreveu através da sua indicação. Você ganhou R$ ${commission.toFixed(2)}!`,
      type: 'success',
      read: false,
      category: 'referral',
      actionUrl: '/dashboard',
      actionText: 'Ver Dashboard'
    });
  };

  const notifyPaymentProcessed = (amount: number, type: 'withdrawal' | 'commission') => {
    const message = type === 'withdrawal' 
      ? `Seu saque de R$ ${amount.toFixed(2)} foi processado com sucesso!`
      : `Você recebeu uma comissão de R$ ${amount.toFixed(2)}!`;

    createNotification({
      title: type === 'withdrawal' ? 'Saque Processado' : 'Comissão Recebida',
      message,
      type: 'success',
      read: false,
      category: 'payment',
      actionUrl: '/dashboard',
      actionText: 'Ver Financeiro'
    });
  };

  const notifyAchievement = (achievementName: string, bonus?: number) => {
    const message = bonus 
      ? `Parabéns! Você desbloqueou '${achievementName}' e ganhou R$ ${bonus.toFixed(2)} de bônus!`
      : `Parabéns! Você desbloqueou a conquista '${achievementName}'!`;

    createNotification({
      title: 'Conquista Desbloqueada!',
      message,
      type: 'success',
      read: false,
      category: 'achievement',
      actionUrl: '/dashboard',
      actionText: 'Ver Conquistas'
    });
  };

  // Listener para notificações em tempo real
  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Configurar listener para notificações em tempo real
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
            read: payload.new.read,
            createdAt: payload.new.created_at,
            actionUrl: payload.new.action_url,
            actionText: payload.new.action_text,
            userId: payload.new.user_id,
            category: payload.new.category
          };

          setNotifications(prev => [newNotification, ...prev]);

          // Toast para novas notificações importantes
          if (newNotification.type === 'success' || newNotification.type === 'warning') {
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    // Helpers específicos
    notifyGroupUpdate,
    notifyReferralSuccess,
    notifyPaymentProcessed,
    notifyAchievement
  };
};