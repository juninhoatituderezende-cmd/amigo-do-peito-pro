
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

interface Professional {
  id: string;
  name: string;
  category: string;
  location: string;
  phone: string;
  instagram: string;
  pixKey: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  totalEarnings: number;
  servicesCompleted: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  status: "active" | "inactive";
  registeredAt: string;
  totalSpent: number;
  groupsParticipated: number;
}

interface Influencer {
  id: string;
  name: string;
  email: string;
  instagram: string;
  followers: string;
  niche: string;
  status: "pending" | "approved" | "rejected";
  totalCommissions: number;
  referrals: number;
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
  
  // Mock data - em produção viria do Supabase
  const [mockProfessionals] = useState<Professional[]>([
    {
      id: "pro1",
      name: "Carlos Silva",
      category: "tatuador",
      location: "São Paulo, SP",
      phone: "(11) 98765-4321",
      instagram: "carlossilvatattoo",
      pixKey: "carlos@email.com",
      status: "pending",
      createdAt: "2024-01-10T14:30:00Z",
      totalEarnings: 0,
      servicesCompleted: 0
    },
    {
      id: "pro2",
      name: "Ana Costa",
      category: "dentista",
      location: "Rio de Janeiro, RJ",
      phone: "(21) 98877-6655",
      instagram: "draanacosta",
      pixKey: "ana.costa@email.com",
      status: "approved",
      createdAt: "2024-01-05T10:15:00Z",
      totalEarnings: 4500.00,
      servicesCompleted: 3
    },
    {
      id: "pro3",
      name: "Pedro Santos",
      category: "tatuador",
      location: "Belo Horizonte, MG",
      phone: "(31) 99988-7766",
      instagram: "pedrotattoobh",
      pixKey: "11999887766",
      status: "approved",
      createdAt: "2024-01-03T08:45:00Z",
      totalEarnings: 3200.00,
      servicesCompleted: 4
    }
  ]);

  const [mockUsers] = useState<User[]>([
    {
      id: "user1",
      name: "João Silva",
      email: "joao@email.com",
      phone: "(11) 99999-8888",
      city: "São Paulo, SP",
      status: "active",
      registeredAt: "2024-01-15T09:00:00Z",
      totalSpent: 1070.00,
      groupsParticipated: 2
    },
    {
      id: "user2",
      name: "Maria Santos",
      email: "maria@email.com",
      phone: "(21) 98888-7777",
      city: "Rio de Janeiro, RJ",
      status: "active",
      registeredAt: "2024-01-12T14:30:00Z",
      totalSpent: 720.00,
      groupsParticipated: 1
    }
  ]);

  const [mockInfluencers] = useState<Influencer[]>([
    {
      id: "inf1",
      name: "Julia Influence",
      email: "julia@email.com",
      instagram: "@juliainfluence",
      followers: "50k-100k",
      niche: "beleza",
      status: "pending",
      totalCommissions: 0,
      referrals: 0
    },
    {
      id: "inf2",
      name: "Bruno Digital",
      email: "bruno@email.com",
      instagram: "@brunodigital",
      followers: "10k-50k",
      niche: "lifestyle",
      status: "approved",
      totalCommissions: 850.00,
      referrals: 15
    }
  ]);

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

  const handleApprove = (id: string, type: string) => {
    toast({
      title: `${type} aprovado`,
      description: `${type} foi aprovado com sucesso.`,
    });
  };

  const handleReject = (id: string, type: string) => {
    toast({
      title: `${type} rejeitado`,
      description: `${type} foi rejeitado.`,
    });
  };

  const handleWithdrawal = (id: string, action: string) => {
    toast({
      title: `Saque ${action}`,
      description: `Solicitação de saque foi ${action}.`,
    });
  };

  // Estatísticas gerais
  const stats = {
    totalProfessionals: mockProfessionals.length,
    pendingProfessionals: mockProfessionals.filter(p => p.status === "pending").length,
    totalUsers: mockUsers.length,
    totalInfluencers: mockInfluencers.length,
    pendingInfluencers: mockInfluencers.filter(i => i.status === "pending").length,
    totalRevenue: mockTransactions.filter(t => t.status === "completed").reduce((sum, t) => sum + t.amount, 0),
    pendingWithdrawals: mockWithdrawals.filter(w => w.status === "pending").length,
    monthlyGrowth: "+15%"
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
            <TabsList className="grid grid-cols-7 max-w-4xl">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="professionals">Profissionais</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="influencers">Influenciadores</TabsTrigger>
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="withdrawals">Saques</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

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
                {mockProfessionals.map((pro) => (
                  <Card key={pro.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{pro.name}</CardTitle>
                          <p className="text-sm text-gray-600 capitalize">{pro.category}</p>
                        </div>
                        <Badge variant={pro.status === "approved" ? "default" : pro.status === "pending" ? "secondary" : "destructive"}>
                          {pro.status === "approved" ? "Aprovado" : pro.status === "pending" ? "Pendente" : "Rejeitado"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <p>📍 {pro.location}</p>
                        <p>📱 {pro.phone}</p>
                        <p>📸 @{pro.instagram}</p>
                        <p>💳 {pro.pixKey}</p>
                        <p>📅 {new Date(pro.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      
                      {pro.status === "approved" && (
                        <div className="bg-green-50 p-3 rounded">
                          <p className="text-sm"><strong>Ganhos:</strong> R$ {pro.totalEarnings.toFixed(2)}</p>
                          <p className="text-sm"><strong>Serviços:</strong> {pro.servicesCompleted}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {pro.status === "pending" && (
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
                        {pro.status === "approved" && (
                          <Button size="sm" variant="outline" className="w-full">
                            Ver Detalhes
                          </Button>
                        )}
                        {pro.status === "rejected" && (
                          <Button size="sm" className="w-full" onClick={() => handleApprove(pro.id, "Profissional")}>
                            Reconsiderar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* USUÁRIOS */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestão de Usuários</h2>
                <div className="text-sm text-gray-600">
                  Total: {mockUsers.length} usuários
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gasto Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.city}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          R$ {user.totalSpent.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.groupsParticipated}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button size="sm" variant="outline">Ver Perfil</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* INFLUENCIADORES */}
            <TabsContent value="influencers" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestão de Influenciadores</h2>
                <div className="text-sm text-gray-600">
                  Total: {mockInfluencers.length} influenciadores
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockInfluencers.map((inf) => (
                  <Card key={inf.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{inf.name}</CardTitle>
                          <p className="text-sm text-gray-600">{inf.instagram}</p>
                        </div>
                        <Badge variant={inf.status === "approved" ? "default" : "secondary"}>
                          {inf.status === "approved" ? "Aprovado" : "Pendente"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <p><strong>Seguidores:</strong> {inf.followers}</p>
                        <p><strong>Nicho:</strong> {inf.niche}</p>
                        <p><strong>Email:</strong> {inf.email}</p>
                      </div>

                      {inf.status === "approved" && (
                        <div className="bg-purple-50 p-3 rounded">
                          <p className="text-sm"><strong>Comissões:</strong> R$ {inf.totalCommissions.toFixed(2)}</p>
                          <p className="text-sm"><strong>Indicações:</strong> {inf.referrals}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {inf.status === "pending" && (
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
                        {inf.status === "approved" && (
                          <Button size="sm" variant="outline" className="w-full">
                            Ver Detalhes
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        <div>
                          <p className="font-medium">{withdrawal.professional}</p>
                          <p className="text-sm text-gray-600">PIX: {withdrawal.pixKey}</p>
                        </div>
                        <div>
                          <p className="font-bold text-lg">R$ {withdrawal.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Solicitado em:</p>
                          <p className="text-sm">{new Date(withdrawal.requestDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
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
                        <div className="flex gap-2">
                          {withdrawal.status === 'pending' && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleWithdrawal(withdrawal.id, "aprovado")}>
                                Aprovar
                              </Button>
                              <Button size="sm" variant="outline" className="border-red-500 text-red-500"
                                      onClick={() => handleWithdrawal(withdrawal.id, "rejeitado")}>
                                Rejeitar
                              </Button>
                            </>
                          )}
                          {withdrawal.status === 'approved' && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleWithdrawal(withdrawal.id, "processado")}>
                              Processar PIX
                            </Button>
                          )}
                          {(withdrawal.status === 'processed' || withdrawal.status === 'rejected') && (
                            <Button size="sm" variant="outline">
                              Ver Detalhes
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
