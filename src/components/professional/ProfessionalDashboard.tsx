import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp,
  Calendar,
  Bell,
  Settings
} from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  client_name: string;
  description: string;
  amount: number;
  commission: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export function ProfessionalDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    completedJobs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get professional profile
      const { data: professional } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'professional')
        .single();

      if (!professional) {
        setLoading(false);
        return;
      }

      // Load products count
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('professional_id', professional.id);

      // Load transactions (using credit_transactions as mock)
      const { data: transactionData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedTransactions: Transaction[] = (transactionData || []).map(transaction => ({
        id: transaction.id,
        client_name: 'Cliente',
        description: transaction.description || 'Serviço prestado',
        amount: Number(transaction.amount),
        commission: Number(transaction.amount) * 0.7, // 70% para o profissional
        status: transaction.status || 'completed',
        payment_status: transaction.status || 'completed',
        created_at: transaction.created_at || new Date().toISOString()
      }));

      setTransactions(formattedTransactions);

      // Calculate stats
      const totalProducts = products?.length || 0;
      const totalEarnings = formattedTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.commission, 0);
      const pendingPayments = formattedTransactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.commission, 0);

      setStats({
        totalProducts,
        totalEarnings,
        pendingPayments,
        completedJobs: formattedTransactions.filter(t => t.status === 'completed').length
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'completed':
        return <Badge variant="default">Concluído</Badge>;
      case 'paid':
        return <Badge>Pago</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Profissional</h2>
        <p className="text-muted-foreground">
          Acompanhe seus serviços e ganhos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ganhos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalEarnings)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pendingPayments)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trabalhos Concluídos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Últimas movimentações financeiras
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma transação encontrada ainda.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{transaction.client_name}</h4>
                    <p className="text-sm text-muted-foreground">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(transaction.commission)}</div>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Gerenciar Serviços</h3>
            <p className="text-sm text-muted-foreground">Adicione e edite seus serviços</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Agenda</h3>
            <p className="text-sm text-muted-foreground">Gerencie seus compromissos</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Configurações</h3>
            <p className="text-sm text-muted-foreground">Ajuste suas preferências</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}