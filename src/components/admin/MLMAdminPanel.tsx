import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Network, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Copy,
  BarChart3,
  Award,
  Target,
  Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MLMUser {
  user_id: string;
  user_name: string;
  user_email: string;
  referral_code: string;
  level: number;
  total_referrals: number;
  active_referrals: number;
  total_earnings: number;
  status: string;
  joined_at: string;
}

interface MLMReferral {
  referral_id: string;
  referrer_name: string;
  referrer_email: string;
  referred_name: string;
  referred_email: string;
  referral_code_used: string;
  commission_earned: number;
  commission_percentage: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  paid_at: string | null;
}

interface MLMCommissions {
  total_commissions: number;
  pending_commissions: number;
  paid_commissions: number;
  referral_commissions: number;
  bonus_commissions: number;
  override_commissions: number;
  commission_details: any;
}

interface MLMStatistics {
  total_users_in_network: number;
  active_users: number;
  level_1_users: number;
  total_referrals_network: number;
  total_network_earnings: number;
  total_referrals_processed: number;
  confirmed_referrals: number;
  pending_referrals: number;
  pending_commissions_total: number;
  paid_commissions_total: number;
}

export const MLMAdminPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userNetwork, setUserNetwork] = useState<MLMUser[]>([]);
  const [allReferrals, setAllReferrals] = useState<MLMReferral[]>([]);
  const [userCommissions, setUserCommissions] = useState<MLMCommissions | null>(null);
  const [statistics, setStatistics] = useState<MLMStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [networkDialogOpen, setNetworkDialogOpen] = useState(false);
  
  // Estados para filtros
  const [users, setUsers] = useState<Array<{id: string, nome: string, email: string}>>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadStatistics(),
        loadAllReferrals()
      ]);
    } catch (error) {
      console.error('Error loading MLM data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do MLM.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, nome, email')
      .order('nome');
    
    if (!error && data) {
      setUsers(data);
    }
  };

  const loadStatistics = async () => {
    const { data, error } = await supabase
      .from('mlm_statistics')
      .select('*')
      .single();
    
    if (!error && data) {
      setStatistics(data);
    }
  };

  const loadAllReferrals = async () => {
    const { data, error } = await supabase
      .rpc('get_referrals_by_status', { filter_status: statusFilter });
    
    if (!error && data) {
      setAllReferrals(data);
    }
  };

  const loadUserNetwork = async (userId: string) => {
    const { data, error } = await supabase
      .rpc('get_user_network', { target_user_id: userId });
    
    if (!error && data) {
      setUserNetwork(data);
    }
  };

  const loadUserCommissions = async (userId: string) => {
    const { data, error } = await supabase
      .rpc('get_user_commissions', { target_user_id: userId });
    
    if (!error && data && data.length > 0) {
      setUserCommissions(data[0]);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    if (userId) {
      loadUserNetwork(userId);
      loadUserCommissions(userId);
    } else {
      setUserNetwork([]);
      setUserCommissions(null);
    }
  };

  const updateReferralStatus = async (referralId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .rpc('admin_update_referral_status', {
          referral_id: referralId,
          new_status: newStatus
        });

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "Status da indicação foi atualizado com sucesso.",
      });

      // Recarregar dados
      loadAllReferrals();
      if (selectedUser) {
        loadUserNetwork(selectedUser);
        loadUserCommissions(selectedUser);
      }
      loadStatistics();

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status da indicação.",
        variant: "destructive",
      });
    }
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: "Código de indicação copiado para a área de transferência.",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Ativo", variant: "default" as const },
      inactive: { label: "Inativo", variant: "secondary" as const },
      suspended: { label: "Suspenso", variant: "destructive" as const },
      pending: { label: "Pendente", variant: "secondary" as const },
      confirmed: { label: "Confirmado", variant: "default" as const },
      paid: { label: "Pago", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const filteredReferrals = allReferrals.filter(referral => {
    const matchesSearch = 
      referral.referrer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.referred_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.referral_code_used?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Painel MLM (Min)</h2>
          <p className="text-muted-foreground">
            Gerencie a rede de marketing multinível da plataforma
          </p>
        </div>
        <Button onClick={loadInitialData} variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Atualizar Dados
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usuários na Rede</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.total_users_in_network}</p>
                  <p className="text-xs text-green-600">{statistics.active_users} ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ganhos Totais</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(statistics.total_network_earnings)}
                  </p>
                  <p className="text-xs text-green-600">Rede completa</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Indicações</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.total_referrals_processed}</p>
                  <p className="text-xs text-green-600">{statistics.confirmed_referrals} confirmadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissões Pendentes</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(statistics.pending_commissions_total)}
                  </p>
                  <p className="text-xs text-gray-600">{statistics.pending_referrals} pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="network" className="space-y-4">
        <TabsList>
          <TabsTrigger value="network">Rede de Usuários</TabsTrigger>
          <TabsTrigger value="referrals">Indicações</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
        </TabsList>

        {/* Aba Rede de Usuários */}
        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Consultar Rede de Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Select value={selectedUser} onValueChange={handleUserSelect}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nome} - {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedUser && (
                  <Button onClick={() => setNetworkDialogOpen(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Rede Completa
                  </Button>
                )}
              </div>

              {userCommissions && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Comissões Totais</p>
                      <p className="text-xl font-bold">{formatCurrency(userCommissions.total_commissions)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                      <p className="text-xl font-bold text-orange-600">{formatCurrency(userCommissions.pending_commissions)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Pagas</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(userCommissions.paid_commissions)}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {userNetwork.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Primeiros Níveis da Rede</h3>
                  {userNetwork.slice(0, 5).map((networkUser) => (
                    <div key={networkUser.user_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                            <span className="text-sm font-bold text-blue-600">{networkUser.level}</span>
                          </div>
                          <div>
                            <p className="font-medium">{networkUser.user_name}</p>
                            <p className="text-sm text-muted-foreground">{networkUser.user_email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(networkUser.total_earnings)}</p>
                          <p className="text-sm text-muted-foreground">{networkUser.total_referrals} indicações</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(networkUser.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyReferralCode(networkUser.referral_code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Indicações */}
        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Gerenciar Indicações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  loadAllReferrals();
                }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="confirmed">Confirmadas</SelectItem>
                    <SelectItem value="paid">Pagas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredReferrals.map((referral) => (
                  <div key={referral.referral_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        <div>
                          <p className="font-medium">{referral.referrer_name}</p>
                          <p className="text-sm text-muted-foreground">Indicou → {referral.referred_name}</p>
                          <p className="text-xs text-muted-foreground">Código: {referral.referral_code_used}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Comissão</p>
                          <p className="font-medium">{formatCurrency(referral.commission_earned)}</p>
                          <p className="text-xs text-muted-foreground">{referral.commission_percentage}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Data</p>
                          <p className="font-medium">{formatDate(referral.created_at)}</p>
                          {referral.confirmed_at && (
                            <p className="text-xs text-green-600">Confirmada: {formatDate(referral.confirmed_at)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(referral.status)}
                        {referral.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateReferralStatus(referral.referral_id, 'confirmed')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateReferralStatus(referral.referral_id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {referral.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReferralStatus(referral.referral_id, 'paid')}
                          >
                            Marcar como Pago
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Comissões */}
        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Detalhes de Comissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userCommissions && userCommissions.commission_details ? (
                <div className="space-y-4">
                  {userCommissions.commission_details.map((commission: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Nível {commission.level} - {commission.type}</p>
                          <p className="text-sm text-muted-foreground">
                            De: {commission.source_user_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(commission.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(commission.amount)}</p>
                          {getStatusBadge(commission.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Selecione um usuário na aba "Rede de Usuários" para ver as comissões
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog da Rede Completa */}
      <Dialog open={networkDialogOpen} onOpenChange={setNetworkDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Rede Completa (9 Níveis)</DialogTitle>
            <DialogDescription>
              Visualização completa da rede MLM do usuário selecionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {Array.from({ length: 9 }, (_, level) => {
              const levelUsers = userNetwork.filter(u => u.level === level + 1);
              return (
                <div key={level} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Nível {level + 1} ({levelUsers.length} usuários)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {levelUsers.map((user) => (
                      <div key={user.user_id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium text-sm">{user.user_name}</p>
                          <p className="text-xs text-muted-foreground">{user.total_referrals} indicações</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(user.total_earnings)}</p>
                          {getStatusBadge(user.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {levelUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Nenhum usuário neste nível</p>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};