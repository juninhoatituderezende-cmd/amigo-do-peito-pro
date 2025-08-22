import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type NotificationType = 'pagamento' | 'grupo_mlm' | 'comissao' | 'sistema';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  actions?: string[];
  created_at: string;
  updated_at: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  selectedType: NotificationType | 'all';
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setSelectedType: (type: NotificationType | 'all') => void;
  nextPage: () => void;
  prevPage: () => void;
  refresh: () => Promise<void>;
  performAction: (notificationId: string, action: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 10;
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

// Mock notifications for demonstration
const createMockNotifications = (userId: string): Notification[] => [
  {
    id: '1',
    user_id: userId,
    type: 'pagamento',
    title: 'Pagamento Confirmado',
    message: 'Seu pagamento de R$ 150,00 foi confirmado com sucesso.',
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    user_id: userId,
    type: 'grupo_mlm',
    title: 'Novo Grupo Formado',
    message: 'Parabéns! Você foi contemplado no grupo "Procedimento Premium".',
    read: false,
    actions: ['aceitar', 'recusar'],
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    user_id: userId,
    type: 'comissao',
    title: 'Comissão Recebida',
    message: 'Você recebeu R$ 25,00 de comissão por indicação.',
    read: true,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    user_id: userId,
    type: 'sistema',
    title: 'Atualização do Sistema',
    message: 'Nova funcionalidade de saque disponível!',
    read: false,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    user_id: userId,
    type: 'grupo_mlm',
    title: 'Grupo Quase Completo',
    message: 'Faltam apenas 2 participantes para o grupo "Tratamento Facial".',
    read: true,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    user_id: userId,
    type: 'pagamento',
    title: 'PIX Expirado',
    message: 'Seu PIX de R$ 200,00 expirou. Gere um novo código.',
    read: false,
    actions: ['gerar_novo_pix'],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');

  // Generate mock notifications when user is available
  useEffect(() => {
    if (user) {
      const mockNotifications = createMockNotifications(user.id);
      setNotifications(mockNotifications);
      setLoading(false);
    }
  }, [user]);

  // Filter notifications by type
  const filteredNotifications = notifications.filter(
    notification => selectedType === 'all' || notification.type === selectedType
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
  const hasNextPage = currentPage < totalPages;

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Auto-refresh notifications
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      // In a real implementation, this would call Supabase
      // const { error } = await supabase
      //   .from('notifications')
      //   .update({ read: true, updated_at: new Date().toISOString() })
      //   .eq('id', id);

      // if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );

    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const markAsUnread = useCallback(async (id: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: false } : n)
      );
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como não lida.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );

      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas.",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const performAction = useCallback(async (notificationId: string, action: string) => {
    try {
      // In a real implementation, this would handle different actions
      console.log(`Performing action "${action}" on notification ${notificationId}`);
      
      toast({
        title: "Ação realizada",
        description: `Ação "${action}" executada com sucesso.`,
      });
      
      // Mark notification as read after action
      await markAsRead(notificationId);
      
    } catch (error) {
      console.error('Error performing action:', error);
      toast({
        title: "Erro",
        description: "Não foi possível executar a ação.",
        variant: "destructive"
      });
    }
  }, [markAsRead, toast]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch fresh data from Supabase
      // For now, we'll just simulate a refresh
      if (user) {
        const mockNotifications = createMockNotifications(user.id);
        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      setError('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  return {
    notifications: paginatedNotifications,
    unreadCount,
    loading,
    error,
    currentPage,
    totalPages,
    hasNextPage,
    selectedType,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    setSelectedType,
    nextPage,
    prevPage,
    refresh,
    performAction
  };
};