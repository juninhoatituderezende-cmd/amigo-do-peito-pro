import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, DollarSign, Users, Download, Search, Filter } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface AdminStats {
  total_sales: number;
  total_commissions: number;
  contemplated_professionals: number;
  pending_payments: number;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  contemplation_status: string;
  payment_status: string;
  plan_name: string;
  entry_amount: number;
  commission_amount: number;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  type: 'professional' | 'influencer';
  recipient_name: string;
  amount: number;
  status: string;
  created_at: string;
  client_name: string;
}

export function AdminPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState<UserRecord[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, statusFilter]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Carregar usuários
      const { data: usersData } = await supabase
        .from('clientes')
        .select(`
          id, nome, email, cpf, telefone, contemplacao_status, created_at,
          plan_participations(
            payment_status, entry_amount,
            plan_groups(
              custom_plans(name)
            )
          ),
          comissoes_influenciadores(valor_comissao, status)
        `)
        .order('created_at', { ascending: false });

      let formattedUsers: UserRecord[] = [];
      if (usersData) {
        formattedUsers = usersData.map(user => ({
          id: user.id,
          name: user.nome || '',
          email: user.email || '',
          cpf: user.cpf || '',
          phone: user.telefone || '',
          contemplation_status: user.contemplacao_status || 'pending',
          payment_status: (user.plan_participations as any)?.[0]?.payment_status || 'pending',
          plan_name: (user.plan_participations as any)?.[0]?.plan_groups?.[0]?.custom_plans?.[0]?.name || 'N/A',
          entry_amount: (user.plan_participations as any)?.[0]?.entry_amount || 0,
          commission_amount: (user.comissoes_influenciadores as any)?.[0]?.valor_comissao || 0,
          created_at: user.created_at || ''
        }));
        setUsers(formattedUsers);
      }

      // Carregar pagamentos
      const { data: professionalPayments } = await supabase
        .from('pagamentos_profissionais')
        .select(`
          id, valor_repasse, status, created_at,
          profissionais(nome),
          clientes(nome)
        `);

      const { data: influencerCommissions } = await supabase
        .from('comissoes_influenciadores')
        .select(`
          id, valor_comissao, status, created_at,
          influenciadores(nome),
          clientes(nome)
        `);

      const allPayments: PaymentRecord[] = [
        ...(professionalPayments || []).map(p => ({
          id: p.id,
          type: 'professional' as const,
          recipient_name: (p.profissionais as any)?.[0]?.nome || '',
          amount: p.valor_repasse,
          status: p.status,
          created_at: p.created_at,
          client_name: (p.clientes as any)?.[0]?.nome || ''
        })),
        ...(influencerCommissions || []).map(c => ({
          id: c.id,
          type: 'influencer' as const,
          recipient_name: (c.influenciadores as any)?.[0]?.nome || '',
          amount: c.valor_comissao,
          status: c.status,
          created_at: c.created_at,
          client_name: (c.clientes as any)?.[0]?.nome || ''
        }))
      ];

      setPayments(allPayments);

      // Calcular estatísticas
      const totalSales = formattedUsers.reduce((sum, u) => sum + u.entry_amount, 0);
      const totalCommissions = allPayments
        .filter(p => p.status === 'pago')
        .reduce((sum, p) => sum + p.amount, 0);
      const contemplatedProfessionals = formattedUsers
        .filter(u => u.contemplation_status === 'contemplado').length;
      const pendingPayments = allPayments
        .filter(p => p.status === 'pendente').length;

      setStats({
        total_sales: totalSales,
        total_commissions: totalCommissions,
        contemplated_professionals: contemplatedProfessionals,
        pending_payments: pendingPayments
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados administrativos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cpf.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        switch (statusFilter) {
          case 'contemplated':
            return user.contemplation_status === 'contemplado';
          case 'pending':
            return user.payment_status === 'pendente';
          case 'paid':
            return user.payment_status === 'pago';
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  };

  const approvePayment = async (paymentId: string, type: 'professional' | 'influencer') => {
    try {
      const { error } = await supabase.rpc('mark_payment_as_paid', {
        p_payment_type: type,
        p_payment_id: paymentId,
        p_admin_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      toast({
        title: "Pagamento aprovado!",
        description: "Pagamento foi marcado como pago.",
      });

      loadAdminData();
    } catch (error) {
      console.error('Erro ao aprovar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar pagamento.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Tipo', 'Beneficiário', 'Cliente', 'Valor', 'Status', 'Data'];
    const csvData = payments.map(p => [
      p.id,
      p.type === 'professional' ? 'Profissional' : 'Influenciador',
      p.recipient_name,
      p.client_name,
      p.amount.toString(),
      p.status,
      new Date(p.created_at).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagamentos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "CSV exportado!",
      description: "Arquivo de pagamentos baixado com sucesso.",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'contemplado': { label: 'Contemplado', variant: 'default' as const },
      'pendente': { label: 'Pendente', variant: 'secondary' as const },
      'pago': { label: 'Pago', variant: 'default' as const }
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Painel Administrativo</h2>
        <p className="text-muted-foreground">Controle completo do sistema</p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_sales)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_commissions)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contemplados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.contemplated_professionals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending_payments}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Filtros e Busca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Buscar por nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="contemplated">Contemplados</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} variant="outline">
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.cpf}</TableCell>
                      <TableCell>{user.plan_name}</TableCell>
                      <TableCell>
                        <Badge {...getStatusBadge(user.contemplation_status)}>
                          {getStatusBadge(user.contemplation_status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(user.entry_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Controle de Pagamentos</CardTitle>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Beneficiário</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.type === 'professional' ? 'Profissional' : 'Influenciador'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{payment.recipient_name}</TableCell>
                      <TableCell>{payment.client_name}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge {...getStatusBadge(payment.status)}>
                          {getStatusBadge(payment.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.status === 'pendente' && (
                          <Button
                            size="sm"
                            onClick={() => approvePayment(payment.id, payment.type)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}