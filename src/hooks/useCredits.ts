import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  source: 'initial_payment' | 'referral_bonus' | 'marketplace_purchase' | 'withdrawal' | 'admin_adjustment';
  description: string;
  relatedOrderId?: string;
  createdAt: string;
}

export interface CreditBalance {
  userId: string;
  totalCredits: number;
  availableCredits: number;
  pendingWithdrawal: number;
  lastUpdated: string;
}

export const useCredits = () => {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar saldo e transações do usuário
  const loadUserCredits = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Carregar saldo atual
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('Erro ao carregar saldo:', balanceError);
      } else if (balanceData) {
        setBalance({
          userId: balanceData.user_id,
          totalCredits: balanceData.total_credits,
          availableCredits: balanceData.available_credits,
          pendingWithdrawal: balanceData.pending_withdrawal,
          lastUpdated: balanceData.updated_at
        });
      } else {
        // Criar registro inicial de créditos
        const { data: newBalance, error: createError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            total_credits: 0,
            available_credits: 0,
            pending_withdrawal: 0
          })
          .select()
          .single();

        if (createError) {
          console.error('Erro ao criar saldo inicial:', createError);
        } else if (newBalance) {
          setBalance({
            userId: newBalance.user_id,
            totalCredits: newBalance.total_credits,
            availableCredits: newBalance.available_credits,
            pendingWithdrawal: newBalance.pending_withdrawal,
            lastUpdated: newBalance.updated_at
          });
        }
      }

      // Carregar histórico de transações
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) {
        console.error('Erro ao carregar transações:', transactionsError);
      } else if (transactionsData) {
        const formattedTransactions: CreditTransaction[] = transactionsData.map(t => ({
          id: t.id,
          userId: t.user_id,
          amount: t.amount,
          type: (t.type as 'credit' | 'debit'),
          source: (t.source as 'initial_payment' | 'referral_bonus' | 'marketplace_purchase' | 'withdrawal' | 'admin_adjustment'),
          description: t.description,
          relatedOrderId: t.related_order_id || '',
          createdAt: t.created_at
        }));
        setTransactions(formattedTransactions);
      }

    } catch (error) {
      console.error('Erro ao carregar dados de créditos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar créditos (para pagamentos, bônus, etc.)
  const addCredits = async (amount: number, source: CreditTransaction['source'], description: string, relatedOrderId?: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('add-user-credits', {
        body: {
          userId: user.id,
          amount,
          source,
          description,
          relatedOrderId
        }
      });

      if (error) {
        console.error('Erro ao adicionar créditos:', error);
        toast({
          title: "Erro ao adicionar créditos",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive"
        });
        return false;
      }

      // Recarregar dados
      await loadUserCredits();
      
      toast({
        title: "Créditos adicionados!",
        description: `R$ ${amount.toFixed(2)} foi adicionado ao seu saldo.`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao adicionar créditos:', error);
      return false;
    }
  };

  // Usar créditos (para marketplace, etc.)
  const useCredits = async (amount: number, source: CreditTransaction['source'], description: string, relatedOrderId?: string) => {
    if (!user || !balance) return false;

    if (balance.availableCredits < amount) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem créditos suficientes para esta transação.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('use-user-credits', {
        body: {
          userId: user.id,
          amount,
          source,
          description,
          relatedOrderId
        }
      });

      if (error) {
        console.error('Erro ao usar créditos:', error);
        toast({
          title: "Erro ao processar transação",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive"
        });
        return false;
      }

      // Recarregar dados
      await loadUserCredits();
      
      toast({
        title: "Créditos utilizados!",
        description: `R$ ${amount.toFixed(2)} foi debitado do seu saldo.`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao usar créditos:', error);
      return false;
    }
  };

  // Solicitar saque
  const requestWithdrawal = async (amount: number) => {
    if (!user || !balance) return false;

    if (balance.availableCredits < amount) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem créditos suficientes para este saque.",
        variant: "destructive"
      });
      return false;
    }

    if (amount < 50) {
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para saque é R$ 50,00.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('request-withdrawal', {
        body: {
          userId: user.id,
          amount
        }
      });

      if (error) {
        console.error('Erro ao solicitar saque:', error);
        toast({
          title: "Erro ao solicitar saque",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive"
        });
        return false;
      }

      // Recarregar dados
      await loadUserCredits();
      
      toast({
        title: "Saque solicitado!",
        description: `Sua solicitação de saque de R$ ${amount.toFixed(2)} está em análise.`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      return false;
    }
  };

  // Converter valor de entrada para créditos (quando usuário paga mas grupo não completa)
  const convertPaymentToCredits = async (paymentAmount: number, orderId: string) => {
    return await addCredits(
      paymentAmount,
      'initial_payment',
      `Conversão de pagamento em créditos - Pedido #${orderId}`,
      orderId
    );
  };

  // Listener para atualizações em tempo real
  useEffect(() => {
    if (!user) return;

    loadUserCredits();

    // Configurar listener para mudanças em tempo real
    const channel = supabase
      .channel('user-credits')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadUserCredits();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadUserCredits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    balance,
    transactions,
    loading,
    addCredits,
    useCredits,
    requestWithdrawal,
    convertPaymentToCredits,
    refreshData: loadUserCredits
  };
};