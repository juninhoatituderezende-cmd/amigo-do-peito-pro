
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { supabase } from "../../lib/supabase";

interface Professional {
  id: string;
  full_name: string;
  email: string;
  category: string;
  location: string;
  phone: string;
  instagram: string;
  approved: boolean;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  referral_code: string;
}

interface Influencer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  instagram: string;
  followers: string;
  approved: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  type: "service" | "commission" | "withdrawal";
  professional: string;
  user?: string;
  service?: string;
  amount: number;
  status: "pending" | "completed" | "refunded" | "cancelled";
  date: string;
  paymentMethod?: string;
}

interface WithdrawalRequest {
  id: string;
  professional: string;
  amount: number;
  pixKey: string;
  status: "pending" | "approved" | "rejected" | "processed";
  requestDate: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // State for data from Supabase
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  
  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load professionals
        const { data: professionalsData, error: professionalsError } = await supabase
          .from('professionals')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (professionalsError) {
          console.error('Error loading professionals:', professionalsError);
        } else {
          setProfessionals(professionalsData || []);
        }
        
        // Load users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (usersError) {
          console.error('Error loading users:', usersError);
        } else {
          setUsers(usersData || []);
        }
        
        // Load influencers
        const { data: influencersData, error: influencersError } = await supabase
          .from('influencers')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (influencersError) {
          console.error('Error loading influencers:', influencersError);
        } else {
          setInfluencers(influencersData || []);
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do dashboard.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    
    return () => clearInterval(interval);
  }, [toast]);
  
  // Mock data removed - now using real Supabase data
  
  // Mock transactions for demo (will be replaced with real data later)
  const [mockTransactions] = useState<Transaction[]>([
    {
      id: "tx1",
      type: "service",
      professional: "Ana Costa",
      user: "João Silva",
      service: "Lentes de contato dental",
      amount: 1500.00,
      status: "completed",
      date: "2024-01-20T14:30:00Z",
      paymentMethod: "PIX"
    },
    {
      id: "tx2",
      type: "commission",
      professional: "Bruno Digital",
      amount: 150.00,
      status: "pending",
      date: "2024-01-19T10:15:00Z"
    },
    {
      id: "tx3",
      type: "withdrawal",
      professional: "Pedro Santos",
      amount: 800.00,
      status: "completed",
      date: "2024-01-18T16:45:00Z",
      paymentMethod: "PIX"
    }
  ]);

  const [mockWithdrawals] = useState<WithdrawalRequest[]>([
    {
      id: "wd1",
      professional: "Ana Costa",
      amount: 1200.00,
      pixKey: "ana.costa@email.com",
      status: "pending",
      requestDate: "2024-01-21T09:00:00Z"
    },
    {
      id: "wd2",
      professional: "Pedro Santos",
      amount: 500.00,
      pixKey: "11999887766",
      status: "approved",
      requestDate: "2024-01-20T15:30:00Z"
    }
  ]);

  const handleApprove = async (id: string, type: string) => {
    try {
      if (type === "Profissional") {
        const { error } = await supabase
          .from('professionals')
          .update({ approved: true })
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Update local state
        setProfessionals(prev => prev.map(p => 
          p.id === id ? { ...p, approved: true } : p
        ));
      } else if (type === "Influenciador") {
        const { error } = await supabase
          .from('influencers')
          .update({ approved: true })
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Update local state
        setInfluencers(prev => prev.map(i => 
          i.id === id ? { ...i, approved: true } : i
        ));
      }
      
      toast({
        title: `${type} aprovado`,
        description: `${type} foi aprovado com sucesso.`,
      });
    } catch (error) {
      console.error('Error approving:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string, type: string) => {
    try {
      if (type === "Profissional") {
        const { error } = await supabase
          .from('professionals')
          .update({ approved: false })
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Update local state
        setProfessionals(prev => prev.map(p => 
          p.id === id ? { ...p, approved: false } : p
        ));
      } else if (type === "Influenciador") {
        const { error } = await supabase
          .from('influencers')
          .update({ approved: false })
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Update local state
        setInfluencers(prev => prev.map(i => 
          i.id === id ? { ...i, approved: false } : i
        ));
      }
      
      toast({
        title: `${type} rejeitado`,
        description: `${type} foi rejeitado.`,
      });
    } catch (error) {
      console.error('Error rejecting:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleWithdrawal = (id: string, action: string) => {
    toast({
      title: `Saque ${action}`,
      description: `Solicitação de saque foi ${action}.`,
    });
  };

  // Calculate real statistics
  const stats = {
    totalProfessionals: professionals.length,
    pendingProfessionals: professionals.filter(p => !p.approved).length,
    approvedProfessionals: professionals.filter(p => p.approved).length,
    totalUsers: users.length,
    totalInfluencers: influencers.length,
    pendingInfluencers: influencers.filter(i => !i.approved).length,
    totalRevenue: 0, // Will be calculated from transactions later
    pendingWithdrawals: 0, // Will be calculated from withdrawals later
    monthlyGrowth: "+15.3%"
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-slate-50">
        <div className="ap-container py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Painel Administrativo Completo</h1>
              <p className="text-gray-600">Controle total da plataforma Amigo do Peito</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-2">
              <Input 
                placeholder="Buscar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Button className="bg-ap-orange hover:bg-ap-orange/90">
                Exportar Relatório
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-6">
            <div className="overflow-x-auto">
              <TabsList className="grid grid-cols-4 md:grid-cols-7 min-w-max">
                <TabsTrigger value="overview" className="text-xs md:text-sm">Visão Geral</TabsTrigger>
                <TabsTrigger value="professionals" className="text-xs md:text-sm">Profissionais</TabsTrigger>
                <TabsTrigger value="users" className="text-xs md:text-sm">Usuários</TabsTrigger>
                <TabsTrigger value="influencers" className="text-xs md:text-sm">Influenciadores</TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs md:text-sm">Transações</TabsTrigger>
                <TabsTrigger value="withdrawals" className="text-xs md:text-sm">Saques</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs md:text-sm">Analytics</TabsTrigger>
              </TabsList>
            </div>

            {/* VISÃO GERAL */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "Total Profissionais",
                    value: stats.totalProfessionals,
                    subtitle: `${stats.pendingProfessionals} pendentes`,
                    color: "bg-blue-50 text-blue-700",
                    icon: "👨‍⚕️"
                  },
                  {
                    title: "Total Usuários",
                    value: stats.totalUsers,
                    subtitle: "Usuários ativos",
                    color: "bg-green-50 text-green-700",
                    icon: "👥"
                  },
                  {
                    title: "Influenciadores",
                    value: stats.totalInfluencers,
                    subtitle: `${stats.pendingInfluencers} pendentes`,
                    color: "bg-purple-50 text-purple-700",
                    icon: "📱"
                  },
                  {
                    title: "Receita Total",
                    value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`,
                    subtitle: stats.monthlyGrowth + " este mês",
                    color: "bg-orange-50 text-orange-700",
                    icon: "💰"
                  }
                ].map((stat, index) => (
                  <Card key={index} className="border-none shadow-sm">
                    <CardContent className={`p-6 ${stat.color} rounded-lg`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{stat.title}</p>
                          <h2 className="text-2xl font-bold mt-1">{stat.value}</h2>
                          <p className="text-sm opacity-80 mt-1">{stat.subtitle}</p>
                        </div>
                        <div className="text-2xl">{stat.icon}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Ações rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ações Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                      <span>{stats.pendingProfessionals} profissionais aguardando aprovação</span>
                      <Button size="sm" onClick={() => setActiveTab("professionals")}>Ver</Button>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                      <span>{stats.pendingWithdrawals} solicitações de saque</span>
                      <Button size="sm" onClick={() => setActiveTab("withdrawals")}>Ver</Button>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                      <span>{stats.pendingInfluencers} influenciadores aguardando</span>
                      <Button size="sm" onClick={() => setActiveTab("influencers")}>Ver</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Últimas Atividades</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockTransactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center p-2 border-b">
                        <div>
                          <p className="font-medium">{tx.professional}</p>
                          <p className="text-sm text-gray-600">{tx.type === "service" ? tx.service : tx.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">R$ {tx.amount.toFixed(2)}</p>
                          <Badge variant={tx.status === "completed" ? "default" : "secondary"}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* PROFISSIONAIS */}
            <TabsContent value="professionals" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestão de Profissionais</h2>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="rejected">Rejeitados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ap-orange mx-auto" />
                    <p className="mt-2 text-gray-600">Carregando profissionais...</p>
                  </div>
                ) : professionals.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-600">Nenhum profissional cadastrado ainda.</p>
                  </div>
                ) : (
                  professionals.map((pro) => (
                    <Card key={pro.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{pro.full_name}</CardTitle>
                            <p className="text-sm text-gray-600 capitalize">{pro.category}</p>
                          </div>
                          <Badge variant={pro.approved ? "default" : "secondary"}>
                            {pro.approved ? "Aprovado" : "Pendente"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <p>📍 {pro.location}</p>
                          <p>📱 {pro.phone}</p>
                          <p>📸 @{pro.instagram}</p>
                          <p>✉️ {pro.email}</p>
                          <p>📅 {new Date(pro.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          {!pro.approved && (
                            <>
                              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" 
                                      onClick={() => handleApprove(pro.id, "Profissional")}>
                                Aprovar
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 border-red-500 text-red-500"
                                      onClick={() => handleReject(pro.id, "Profissional")}>
                                Rejeitar
                              </Button>
                            </>
                          )}
                          {pro.approved && (
                            <Button size="sm" variant="outline" className="w-full">
                              Ver Detalhes
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* USUÁRIOS */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestão de Usuários</h2>
                <div className="text-sm text-gray-600">
                  Total: {users.length} usuários
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ap-orange mx-auto" />
                  <p className="mt-2 text-gray-600">Carregando usuários...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nenhum usuário cadastrado ainda.</p>
                </div>
              ) : (

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {user.referral_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button size="sm" variant="outline">Ver Perfil</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </TabsContent>

            {/* INFLUENCIADORES */}
            <TabsContent value="influencers" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestão de Influenciadores</h2>
                <div className="text-sm text-gray-600">
                  Total: {influencers.length} influenciadores
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ap-orange mx-auto" />
                  <p className="mt-2 text-gray-600">Carregando influenciadores...</p>
                </div>
              ) : influencers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nenhum influenciador cadastrado ainda.</p>
                </div>
              ) : (

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {influencers.map((inf) => (
                  <Card key={inf.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{inf.full_name}</CardTitle>
                          <p className="text-sm text-gray-600">{inf.instagram}</p>
                        </div>
                        <Badge variant={inf.approved ? "default" : "secondary"}>
                          {inf.approved ? "Aprovado" : "Pendente"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <p><strong>Seguidores:</strong> {inf.followers}</p>
                        <p><strong>Email:</strong> {inf.email}</p>
                        <p><strong>Telefone:</strong> {inf.phone}</p>
                        <p><strong>Data:</strong> {new Date(inf.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>

                      <div className="flex gap-2">
                        {!inf.approved && (
                          <>
                            <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    onClick={() => handleApprove(inf.id, "Influenciador")}>
                              Aprovar
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1"
                                    onClick={() => handleReject(inf.id, "Influenciador")}>
                              Rejeitar
                            </Button>
                          </>
                        )}
                        {inf.approved && (
                          <Button size="sm" variant="outline" className="w-full">
                            Ver Detalhes
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              )}
            </TabsContent>

            {/* TRANSAÇÕES */}
            <TabsContent value="transactions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Histórico de Transações</h2>
                <div className="flex gap-2">
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="service">Serviços</SelectItem>
                      <SelectItem value="commission">Comissões</SelectItem>
                      <SelectItem value="withdrawal">Saques</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="refunded">Estornado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profissional</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço/Desc</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{tx.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">
                            {tx.type === "service" ? "Serviço" : tx.type === "commission" ? "Comissão" : "Saque"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{tx.professional}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.service || tx.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          R$ {tx.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(tx.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={
                            tx.status === 'completed' ? 'default' : 
                            tx.status === 'pending' ? 'secondary' : 
                            'destructive'
                          }>
                            {tx.status === 'completed' ? 'Concluído' : 
                             tx.status === 'pending' ? 'Pendente' : 
                             tx.status === 'refunded' ? 'Estornado' : 'Cancelado'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button size="sm" variant="outline">Ver</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* SAQUES */}
            <TabsContent value="withdrawals" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Solicitações de Saque</h2>
                <div className="text-sm text-gray-600">
                  {stats.pendingWithdrawals} solicitações pendentes
                </div>
              </div>

              <div className="space-y-4">
                {mockWithdrawals.map((withdrawal) => (
                  <Card key={withdrawal.id}>
                    <CardContent className="p-4 md:p-6">
                      <div className="space-y-4">
                        {/* Header com nome e valor */}
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-lg">{withdrawal.professional}</p>
                            <p className="text-sm text-gray-600">PIX: {withdrawal.pixKey}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl text-green-600">R$ {withdrawal.amount.toFixed(2)}</p>
                            <Badge variant={
                              withdrawal.status === 'processed' ? 'default' :
                              withdrawal.status === 'approved' ? 'secondary' :
                              withdrawal.status === 'pending' ? 'outline' : 'destructive'
                            }>
                              {withdrawal.status === 'processed' ? 'Processado' :
                               withdrawal.status === 'approved' ? 'Aprovado' :
                               withdrawal.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                            </Badge>
                          </div>
                        </div>

                        {/* Data da solicitação */}
                        <div className="border-t pt-3">
                          <p className="text-sm text-gray-600">
                            Solicitado em: {new Date(withdrawal.requestDate).toLocaleDateString('pt-BR')} às {new Date(withdrawal.requestDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {/* Botões de ação */}
                        <div className="border-t pt-4">
                          {withdrawal.status === 'pending' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button 
                                className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                                onClick={() => handleWithdrawal(withdrawal.id, "aprovado")}
                              >
                                ✅ Aprovar Saque
                              </Button>
                              <Button 
                                variant="outline" 
                                className="flex-1 border-red-500 text-red-500 hover:bg-red-50 h-12"
                                onClick={() => handleWithdrawal(withdrawal.id, "rejeitado")}
                              >
                                ❌ Rejeitar
                              </Button>
                            </div>
                          )}
                          {withdrawal.status === 'approved' && (
                            <Button 
                              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                              onClick={() => handleWithdrawal(withdrawal.id, "processado")}
                            >
                              💳 Processar PIX Agora
                            </Button>
                          )}
                          {(withdrawal.status === 'processed' || withdrawal.status === 'rejected') && (
                            <Button variant="outline" className="w-full h-12">
                              📄 Ver Detalhes Completos
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ANALYTICS */}
            <TabsContent value="analytics" className="space-y-6">
              <h2 className="text-2xl font-bold">Analytics e Relatórios</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo Mensal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Novos Profissionais:</span>
                      <span className="font-bold">8</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Novos Usuários:</span>
                      <span className="font-bold">24</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Serviços Realizados:</span>
                      <span className="font-bold">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Conversão:</span>
                      <span className="font-bold text-green-600">68%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Categorias</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Tatuagens</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-16 h-2 bg-ap-orange rounded"></div>
                        </div>
                        <span className="text-sm">80%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Odontologia</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-10 h-2 bg-ap-light-blue rounded"></div>
                        </div>
                        <span className="text-sm">50%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Relatórios Disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <span className="text-lg mb-1">📊</span>
                    Relatório Financeiro
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <span className="text-lg mb-1">👥</span>
                    Relatório de Usuários
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <span className="text-lg mb-1">⭐</span>
                    Relatório de Performance
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;
