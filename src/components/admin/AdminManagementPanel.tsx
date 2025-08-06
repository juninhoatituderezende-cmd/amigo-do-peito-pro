import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Mail, 
  Eye, 
  Filter,
  Download,
  UserCheck,
  Send,
  Gift
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VoucherGenerator } from "@/components/voucher/VoucherGenerator";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  service_type: string;
  entry_amount: number;
  referral_count: number;
  payment_status: string;
  contemplation_status: string;
  voucher_sent: boolean;
  created_at: string;
  contemplation_date?: string;
  professional_assigned?: string;
}

interface VoucherData {
  id: string;
  user_name: string;
  user_email: string;
  service_type: string;
  service_price: number;
  voucher_code: string;
  expiry_date: string;
  professional_name?: string;
  professional_location?: string;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  contemplated_users: number;
  pending_payments: number;
  vouchers_sent: number;
  total_revenue: number;
}

export function AdminManagementPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, statusFilter, serviceFilter, searchTerm]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Carregar usuários dos participantes de planos
      const { data: clientesData } = await supabase
        .from('plan_participants')
        .select(`
          id,
          nome,
          email,
          telefone,
          created_at,
          contemplacao_status,
          contemplacao_data,
          service_type,
          payment_status
        `)
        .order('created_at', { ascending: false });

      if (clientesData) {
        const formattedUsers: UserRecord[] = clientesData.map(client => ({
          id: client.id,
          name: client.nome || 'N/A',
          email: client.email || 'N/A',
          phone: client.telefone || 'N/A',
          service_type: client.service_type || 'Não definido',
          entry_amount: 1000, // Valor fixo por enquanto
          referral_count: 0, // Seria calculado com base em indicações
          payment_status: client.payment_status || 'pending',
          contemplation_status: client.contemplacao_status || 'pending',
          voucher_sent: false, // Campo a ser implementado
          created_at: client.created_at,
          contemplation_date: client.contemplacao_data,
          professional_assigned: 'Profissional não definido'
        }));
        
        setUsers(formattedUsers);

        // Calcular estatísticas
        const totalUsers = formattedUsers.length;
        const contemplatedUsers = formattedUsers.filter(u => u.contemplation_status === 'contemplado').length;
        const pendingPayments = formattedUsers.filter(u => u.payment_status === 'pending').length;
        const vouchersSent = formattedUsers.filter(u => u.voucher_sent).length;
        const totalRevenue = formattedUsers.reduce((sum, u) => sum + u.entry_amount, 0);

        setStats({
          total_users: totalUsers,
          contemplated_users: contemplatedUsers,
          pending_payments: pendingPayments,
          vouchers_sent: vouchersSent,
          total_revenue: totalRevenue
        });
      }

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

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        switch (statusFilter) {
          case 'contemplated':
            return user.contemplation_status === 'contemplado';
          case 'pending':
            return user.contemplation_status === 'pending';
          case 'paid':
            return user.payment_status === 'paid';
          default:
            return true;
        }
      });
    }

    // Filtro por serviço
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.service_type.toLowerCase().includes(serviceFilter.toLowerCase())
      );
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const approveContemplation = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('plan_participants')
        .update({ 
          contemplacao_status: 'contemplado',
          contemplacao_data: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Contemplação aprovada!",
        description: "Usuário foi marcado como contemplado.",
      });

      loadAdminData();
    } catch (error) {
      console.error('Erro ao aprovar contemplação:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar contemplação.",
        variant: "destructive",
      });
    }
  };

  const validatePayment = async (userId: string) => {
    try {
      // Atualizar status de pagamento
      const { error } = await supabase
        .from('plan_participants')
        .update({ payment_status: 'paid' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Pagamento validado!",
        description: "Pagamento foi marcado como validado.",
      });

      loadAdminData();
    } catch (error) {
      console.error('Erro ao validar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao validar pagamento.",
        variant: "destructive",
      });
    }
  };

  const generateVoucher = (user: UserRecord) => {
    const voucherCode = `VCH${Date.now().toString().slice(-8)}`;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 meses de validade

    const voucher: VoucherData = {
      id: user.id,
      user_name: user.name,
      user_email: user.email,
      service_type: user.service_type,
      service_price: user.entry_amount * 10, // Assumindo que entrada é 10% do total
      voucher_code: voucherCode,
      expiry_date: expiryDate.toISOString(),
      professional_name: user.professional_assigned,
      professional_location: 'Local do profissional', // Seria obtido dos dados reais
      created_at: new Date().toISOString()
    };

    setVoucherData(voucher);
    setSelectedUser(user);
    setShowVoucherDialog(true);
  };

  const handleVoucherSent = () => {
    if (selectedUser) {
      // Atualizar status de voucher enviado
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, voucher_sent: true }
          : user
      ));
      
      setShowVoucherDialog(false);
      setSelectedUser(null);
      setVoucherData(null);

      toast({
        title: "Voucher enviado!",
        description: "Voucher foi enviado para o usuário.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'contemplado': { label: 'Contemplado', variant: 'default' as const },
      'pending': { label: 'Pendente', variant: 'secondary' as const },
      'paid': { label: 'Pago', variant: 'default' as const },
      'failed': { label: 'Falhou', variant: 'destructive' as const }
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
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
        <h2 className="text-3xl font-bold tracking-tight">Painel Administrativo</h2>
        <p className="text-muted-foreground">
          Gerencie usuários, contemplações e vouchers
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contemplados</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.contemplated_users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending_payments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vouchers Enviados</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.vouchers_sent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.total_revenue)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contemplated">Contemplados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os serviços" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="tatuagem">Tatuagem</SelectItem>
                  <SelectItem value="estetica">Estética</SelectItem>
                  <SelectItem value="odontologia">Odontologia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={() => {
                setStatusFilter('all');
                setServiceFilter('all');
                setSearchTerm('');
              }} variant="outline">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contemplação</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.service_type}</TableCell>
                  <TableCell>{formatCurrency(user.entry_amount)}</TableCell>
                  <TableCell>
                    <Badge {...getStatusBadge(user.payment_status)}>
                      {getStatusBadge(user.payment_status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge {...getStatusBadge(user.contemplation_status)}>
                      {getStatusBadge(user.contemplation_status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.voucher_sent ? (
                      <Badge variant="default">Enviado</Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {user.contemplation_status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => approveContemplation(user.id)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {user.payment_status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => validatePayment(user.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {user.contemplation_status === 'contemplado' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => generateVoucher(user)}
                        >
                          <Gift className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog do Voucher */}
      <Dialog open={showVoucherDialog} onOpenChange={setShowVoucherDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Voucher Digital</DialogTitle>
            <DialogDescription>
              Voucher para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          {voucherData && (
            <VoucherGenerator 
              voucherData={voucherData} 
              onEmailSent={handleVoucherSent}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}