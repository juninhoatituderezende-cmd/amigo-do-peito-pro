import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  CreditCard,
  Banknote,
  RefreshCw
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  refundedPayments: number;
}

export function PaymentManagement() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    refundedPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      // Load marketplace sales (payment transactions)
      const { data: salesData, error: salesError } = await supabase
        .from('marketplace_sales')
        .select(`
          *,
          buyer:profiles!marketplace_sales_buyer_id_fkey(email, full_name),
          seller:profiles!marketplace_sales_seller_id_fkey(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Load payment splits for additional revenue tracking
      const { data: splitsData, error: splitsError } = await supabase
        .from('payment_splits')
        .select('*')
        .order('created_at', { ascending: false });

      if (splitsError) throw splitsError;

      // Transform sales data to payment transactions
      const transformedTransactions: PaymentTransaction[] = (salesData || []).map(sale => ({
        id: sale.id,
        user_id: sale.buyer_id || '',
        amount: Number(sale.total_amount),
        status: sale.status,
        payment_method: sale.payment_method,
        created_at: sale.created_at,
        user_email: sale.buyer?.email || 'N/A',
        user_name: sale.buyer?.full_name || 'N/A'
      }));

      setTransactions(transformedTransactions);

      // Calculate stats
      const totalRevenue = transformedTransactions
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingPayments = transformedTransactions
        .filter(t => t.status === 'pending').length;

      const completedPayments = transformedTransactions
        .filter(t => t.status === 'paid').length;

      const refundedPayments = transformedTransactions
        .filter(t => t.status === 'refunded').length;

      setStats({
        totalRevenue,
        pendingPayments,
        completedPayments,
        refundedPayments
      });

    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de pagamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'refunded':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Reembolsado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const exportTransactions = () => {
    const headers = ['ID', 'Usuário', 'Email', 'Valor', 'Status', 'Método', 'Data'].join(',');
    const rows = filteredTransactions.map(transaction => [
      transaction.id,
      `"${transaction.user_name}"`,
      transaction.user_email,
      transaction.amount,
      transaction.status,
      transaction.payment_method,
      new Date(transaction.created_at).toLocaleDateString('pt-BR')
    ].join(','));

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída!",
      description: "Transações exportadas com sucesso.",
    });
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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Pagamentos</h2>
        <Button onClick={loadPaymentData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Pagamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedPayments}</div>
            <p className="text-xs text-muted-foreground">
              Transações finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reembolsos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.refundedPayments}</div>
            <p className="text-xs text-muted-foreground">
              Pagamentos reembolsados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transações de Pagamento</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportTransactions} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-xs">
                      {transaction.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.user_name}</div>
                        <div className="text-sm text-muted-foreground">{transaction.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {transaction.payment_method === 'pix' ? (
                          <Banknote className="w-4 h-4 mr-1" />
                        ) : (
                          <CreditCard className="w-4 h-4 mr-1" />
                        )}
                        {transaction.payment_method.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}