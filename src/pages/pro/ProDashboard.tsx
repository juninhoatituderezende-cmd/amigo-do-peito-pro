
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: string;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  created_at: string;
}

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

const ProDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [professionalData, setProfessionalData] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: ""
  });

  useEffect(() => {
    if (!user || user.role !== "professional") {
      navigate("/profissional/login");
      return;
    }

    if (!user.approved) {
      navigate("/confirmacao");
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load professional data
      const { data: profData, error: profError } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profError) {
        console.error('Error loading professional:', profError);
      } else {
        setProfessionalData(profData);
      }

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('professional_id', user?.id)
        .order('created_at', { ascending: false });

      if (servicesError) {
        console.error('Error loading services:', servicesError);
      } else {
        setServices(servicesData || []);
      }

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('professional_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        console.error('Error loading transactions:', transactionsError);
      } else {
        setTransactions(transactionsData || []);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setServiceForm(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceCategoryChange = (value: string) => {
    setServiceForm(prev => ({ ...prev, category: value }));
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceForm.name || !serviceForm.description || !serviceForm.price || !serviceForm.duration || !serviceForm.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          professional_id: user?.id,
          name: serviceForm.name,
          description: serviceForm.description,
          price: parseFloat(serviceForm.price),
          duration: serviceForm.duration,
          category: serviceForm.category
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setServices(prev => [data, ...prev]);
      setServiceForm({ name: "", description: "", price: "", duration: "", category: "" });
      
      toast({
        title: "Serviço criado!",
        description: "Seu novo serviço foi adicionado com sucesso.",
      });

    } catch (error: any) {
      console.error('Error creating service:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar serviço.",
        variant: "destructive",
      });
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        throw error;
      }

      setServices(prev => prev.filter(s => s.id !== serviceId));
      
      toast({
        title: "Serviço removido",
        description: "Serviço foi removido com sucesso.",
      });

    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover serviço.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Calculate stats
  const totalEarnings = transactions
    .filter(t => t.type === 'service' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingEarnings = transactions
    .filter(t => t.type === 'service' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const completedServices = transactions
    .filter(t => t.type === 'service' && t.status === 'completed').length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-ap-orange" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 bg-slate-50">
        <div className="ap-container">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Profissional</h1>
              <p className="text-gray-600">
                Bem-vindo, {professionalData?.full_name || user?.name}!
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-2">
              <Button variant="outline" onClick={() => navigate("/profissional/perfil")}>
                Editar Perfil
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="services">Serviços</TabsTrigger>
              <TabsTrigger value="transactions">Financeiro</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* VISÃO GERAL */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ganhos Totais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-gray-600">Serviços completados</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ganhos Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      R$ {pendingEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-gray-600">Aguardando confirmação</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Serviços Realizados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {completedServices}
                    </div>
                    <p className="text-sm text-gray-600">Total de atendimentos</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab("services")}
                    >
                      📋 Gerenciar Serviços
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate("/profissional/financas")}
                    >
                      💰 Ver Finanças
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate("/profissional/perfil")}
                    >
                      👤 Editar Perfil
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status da Conta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <Badge variant="default" className="bg-green-600">
                        Aprovado
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Categoria:</span>
                      <Badge variant="outline" className="capitalize">
                        {professionalData?.category}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Serviços Ativos:</span>
                      <Badge variant="secondary">
                        {services.length}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              {transactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Transações Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                              {transaction.status === 'completed' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* SERVIÇOS */}
            <TabsContent value="services" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Service Form */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Adicionar Novo Serviço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateService} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome do Serviço *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={serviceForm.name}
                          onChange={handleServiceFormChange}
                          placeholder="Ex: Tatuagem Blackwork"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="price">Preço (R$) *</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          value={serviceForm.price}
                          onChange={handleServiceFormChange}
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="duration">Duração *</Label>
                        <Input
                          id="duration"
                          name="duration"
                          value={serviceForm.duration}
                          onChange={handleServiceFormChange}
                          placeholder="Ex: 2 horas, 30 min"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Categoria *</Label>
                        <Select onValueChange={handleServiceCategoryChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tatuagem">Tatuagem</SelectItem>
                            <SelectItem value="dentista">Odontologia</SelectItem>
                            <SelectItem value="estetica">Estética</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="description">Descrição *</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={serviceForm.description}
                          onChange={handleServiceFormChange}
                          placeholder="Descreva seu serviço em detalhes..."
                          rows={3}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full bg-ap-orange hover:bg-ap-orange/90">
                        Adicionar Serviço
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Services List */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xl font-semibold">Meus Serviços ({services.length})</h3>
                  
                  {services.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <p className="text-gray-600">Você ainda não tem serviços cadastrados.</p>
                        <p className="text-sm text-gray-500">Adicione seu primeiro serviço ao lado.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {services.map((service) => (
                        <Card key={service.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{service.name}</CardTitle>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline" className="capitalize">
                                    {service.category}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {service.duration}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">
                                  R$ {service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteService(service.id)}
                                  className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-600">{service.description}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Criado em {new Date(service.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* FINANCEIRO */}
            <TabsContent value="transactions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Saldo Disponível</p>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Pendente</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        R$ {pendingEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Button className="w-full bg-ap-orange hover:bg-ap-orange/90">
                        Solicitar Saque
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Nenhuma transação encontrada.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-600 capitalize">
                              {transaction.type} • {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              + R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                              {transaction.status === 'completed' ? 'Concluído' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ANALYTICS */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo do Mês</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Serviços Realizados:</span>
                      <span className="font-bold">{completedServices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Receita Gerada:</span>
                      <span className="font-bold text-green-600">
                        R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ticket Médio:</span>
                      <span className="font-bold">
                        R$ {completedServices > 0 ? (totalEarnings / completedServices).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Taxa de Conversão:</span>
                      <span className="font-bold text-green-600">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avaliação Média:</span>
                      <span className="font-bold text-yellow-600">4.8 ⭐</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clientes Recorrentes:</span>
                      <span className="font-bold">60%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProDashboard;
