import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  Share2, 
  Users, 
  Calendar, 
  TrendingUp, 
  Search, 
  Heart,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Gift,
  Target,
  DollarSign
} from "lucide-react";

interface Group {
  id: number;
  service: string;
  professional: string;
  status: "Em andamento" | "Completo" | "Aguardando";
  participants: number;
  maxParticipants: number;
  discount: string;
  originalPrice: number;
  finalPrice: number;
  startDate: string;
  endDate?: string;
  category: "tattoo" | "dental";
  description: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferences: string[];
  totalSavings: number;
  referralCount: number;
  joinDate: string;
}

interface Service {
  id: number;
  name: string;
  professional: string;
  category: "tattoo" | "dental";
  price: number;
  description: string;
  rating: number;
  duration: string;
  groupsAvailable: number;
}

const UserDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para dados do usuário
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: user?.id || "user123",
    name: (user as any)?.user_metadata?.full_name || user?.email?.split('@')[0] || "João Silva",
    email: user?.email || "joao@email.com",
    phone: "+55 11 99999-9999",
    preferences: ["tatuagem", "dental"],
    totalSavings: 1250,
    referralCount: 8,
    joinDate: "2024-01-15"
  });

  const [groups, setGroups] = useState<Group[]>([
    {
      id: 1,
      service: "Tatuagem Realista - Braço",
      professional: "Charles Ferreira",
      status: "Em andamento",
      participants: 3,
      maxParticipants: 5,
      discount: "30%",
      originalPrice: 800,
      finalPrice: 560,
      startDate: "2024-12-01",
      category: "tattoo",
      description: "Tatuagem realista com temática natureza, aproximadamente 15cm"
    },
    {
      id: 2,
      service: "Lentes de Contato Dental",
      professional: "Chaele Ferreira",
      status: "Completo",
      participants: 4,
      maxParticipants: 4,
      discount: "40%",
      originalPrice: 1500,
      finalPrice: 900,
      startDate: "2024-11-15",
      endDate: "2024-11-30",
      category: "dental",
      description: "Aplicação de 8 lentes de porcelana para sorriso harmônico"
    },
    {
      id: 3,
      service: "Tatuagem Old School",
      professional: "Charles Ferreira", 
      status: "Aguardando",
      participants: 2,
      maxParticipants: 6,
      discount: "45%",
      originalPrice: 600,
      finalPrice: 330,
      startDate: "2024-12-20",
      category: "tattoo",
      description: "Tatuagem estilo tradicional americano, tema marinheiro"
    }
  ]);

  const [availableServices, setAvailableServices] = useState<Service[]>([
    {
      id: 1,
      name: "Tatuagem Minimalista",
      professional: "Charles Ferreira",
      category: "tattoo",
      price: 400,
      description: "Tatuagens pequenas e delicadas com traços limpos",
      rating: 4.9,
      duration: "2-3 horas",
      groupsAvailable: 3
    },
    {
      id: 2,
      name: "Clareamento Dental",
      professional: "Chaele Ferreira",
      category: "dental",
      price: 800,
      description: "Clareamento dental profissional com tecnologia LED",
      rating: 4.8,
      duration: "1-2 sessões",
      groupsAvailable: 2
    },
    {
      id: 3,
      name: "Tatuagem Aquarela",
      professional: "Charles Ferreira",
      category: "tattoo",
      price: 900,
      description: "Técnica de aquarela com cores vibrantes",
      rating: 5.0,
      duration: "4-6 horas",
      groupsAvailable: 1
    }
  ]);

  const referralLink = `https://amigodopeito.com/ref/${userProfile.id}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copiado!",
      description: "O link de indicação foi copiado para a área de transferência.",
    });
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Amigo do Peito - Plataforma de Serviços",
        text: "Conheça a Amigo do Peito e economize em serviços de estética!",
        url: referralLink,
      });
    } else {
      copyReferralLink();
    }
  };

  const handleJoinGroup = (serviceId: number) => {
    toast({
      title: "Interesse registrado!",
      description: "Você será notificado quando o grupo estiver se formando.",
    });
  };

  const getStatusIcon = (status: Group["status"]) => {
    switch (status) {
      case "Completo":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Em andamento":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "Aguardando":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: Group["status"]) => {
    switch (status) {
      case "Completo":
        return "bg-green-100 text-green-800";
      case "Em andamento":
        return "bg-blue-100 text-blue-800";
      case "Aguardando":
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const filteredServices = availableServices.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.professional.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statistics = {
    activeGroups: groups.filter(g => g.status === "Em andamento").length,
    completedGroups: groups.filter(g => g.status === "Completo").length,
    waitingGroups: groups.filter(g => g.status === "Aguardando").length,
    totalSavings: groups.reduce((acc, group) => acc + (group.originalPrice - group.finalPrice), 0)
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header do Dashboard */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Olá, {userProfile.name}! 👋
                </h1>
                <p className="text-gray-600">
                  Bem-vindo ao seu painel. Aqui você pode acompanhar seus grupos e descobrir novos serviços.
                </p>
              </div>
              
              <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Editar Perfil
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                      Atualize suas informações pessoais e preferências.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input id="name" value={userProfile.name} onChange={(e) => 
                        setUserProfile(prev => ({ ...prev, name: e.target.value }))
                      } />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" value={userProfile.phone} onChange={(e) => 
                        setUserProfile(prev => ({ ...prev, phone: e.target.value }))
                      } />
                    </div>
                    <div>
                      <Label htmlFor="preferences">Interesses (separados por vírgula)</Label>
                      <Textarea 
                        id="preferences" 
                        value={userProfile.preferences.join(", ")}
                        onChange={(e) => 
                          setUserProfile(prev => ({ 
                            ...prev, 
                            preferences: e.target.value.split(", ").filter(p => p.trim()) 
                          }))
                        }
                        placeholder="tatuagem, dental, estética..."
                      />
                    </div>
                    <Button onClick={() => {
                      setIsProfileDialogOpen(false);
                      toast({
                        title: "Perfil atualizado!",
                        description: "Suas informações foram salvas com sucesso.",
                      });
                    }}>
                      Salvar Alterações
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Grupos Ativos</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics.activeGroups}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Grupos Completos</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.completedGroups}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aguardando</p>
                    <p className="text-2xl font-bold text-yellow-600">{statistics.waitingGroups}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Economizado</p>
                    <p className="text-2xl font-bold text-purple-600">R$ {statistics.totalSavings}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navegação por Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="groups">Meus Grupos</TabsTrigger>
              <TabsTrigger value="services">Serviços</TabsTrigger>
              <TabsTrigger value="referrals">Indicações</TabsTrigger>
            </TabsList>

            {/* Tab: Visão Geral */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Grupos Recentes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Atividade Recente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {groups.slice(0, 3).map((group) => (
                        <div key={group.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(group.status)}
                            <div>
                              <p className="font-medium">{group.service}</p>
                              <p className="text-sm text-gray-600">com {group.professional}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
                              {group.status}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {group.participants}/{group.maxParticipants} pessoas
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Link de Indicação */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5" />
                        Meu Link de Indicação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-gray-100 rounded-lg text-sm break-all font-mono">
                        {referralLink}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={copyReferralLink} className="flex-1">
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                        <Button size="sm" variant="outline" onClick={shareReferralLink}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600">
                        Compartilhe e ganhe desconto quando seus amigos se cadastrarem!
                      </p>
                    </CardContent>
                  </Card>

                  {/* Conquistas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Suas Conquistas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Grupos completos</span>
                        <span className="font-semibold">{statistics.completedGroups}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Amigos indicados</span>
                        <span className="font-semibold">{userProfile.referralCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Economia total</span>
                        <span className="font-semibold text-green-600">R$ {statistics.totalSavings}</span>
                      </div>
                      <Separator />
                      <div className="text-center">
                        <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full">
                          <Star className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="text-sm font-medium text-yellow-800">
                            Cliente Bronze
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Meus Grupos */}
            <TabsContent value="groups" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Grupos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {groups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{group.service}</h3>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(group.status)}`}>
                              {getStatusIcon(group.status)}
                              <span className="ml-2">{group.status}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-2">com {group.professional}</p>
                          <p className="text-sm text-gray-500">{group.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Progresso do Grupo</p>
                          <Progress 
                            value={(group.participants / group.maxParticipants) * 100} 
                            className="h-2"
                          />
                          <p className="text-xs text-gray-500">
                            {group.participants}/{group.maxParticipants} participantes
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Desconto</p>
                          <p className="text-lg font-bold text-green-600">{group.discount}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Preço Original</p>
                          <p className="text-lg line-through text-gray-500">R$ {group.originalPrice}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Preço Final</p>
                          <p className="text-lg font-bold text-blue-600">R$ {group.finalPrice}</p>
                        </div>
                      </div>

                      <Separator />
                      
                      <div className="flex flex-wrap gap-3">
                        {group.status === "Completo" ? (
                          <>
                            <Button className="bg-green-600 hover:bg-green-700">
                              <Calendar className="h-4 w-4 mr-2" />
                              Agendar Serviço
                            </Button>
                            <Button variant="outline">
                              <Heart className="h-4 w-4 mr-2" />
                              Avaliar Profissional
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline">
                              <Share2 className="h-4 w-4 mr-2" />
                              Compartilhar Grupo
                            </Button>
                            <Button variant="outline">
                              <Users className="h-4 w-4 mr-2" />
                              Convidar Amigos
                            </Button>
                          </>
                        )}
                        <Button variant="ghost">Ver Detalhes</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Serviços */}
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <CardTitle>Serviços Disponíveis</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar serviços..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full md:w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((service) => (
                      <Card key={service.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold text-lg">{service.name}</h3>
                              <p className="text-sm text-gray-600">com {service.professional}</p>
                            </div>
                            
                            <p className="text-sm text-gray-700">{service.description}</p>
                            
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(service.rating)
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">({service.rating})</span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Duração:</span>
                                <span>{service.duration}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Grupos disponíveis:</span>
                                <span className="font-medium">{service.groupsAvailable}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Preço:</span>
                                <span className="text-lg font-bold text-blue-600">R$ {service.price}</span>
                              </div>
                            </div>
                            
                            <Button 
                              className="w-full" 
                              onClick={() => handleJoinGroup(service.id)}
                              disabled={service.groupsAvailable === 0}
                            >
                              {service.groupsAvailable > 0 ? "Participar do Grupo" : "Indisponível"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Indicações */}
            <TabsContent value="referrals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Programa de Indicações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <h3 className="text-2xl font-bold text-blue-600 mb-2">{userProfile.referralCount}</h3>
                      <p className="text-gray-600">Amigos indicados</p>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Como funciona:</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Compartilhe seu link único</p>
                        <p>• Seus amigos se cadastram usando o link</p>
                        <p>• Ambos ganham desconto no próximo serviço</p>
                        <p>• Quanto mais indicações, maiores os descontos!</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Próximo nível:</strong> Indique mais 2 amigos para se tornar Cliente Prata e ganhar 5% extra de desconto!
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Seu Link de Indicação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <p className="text-sm font-mono break-all">{referralLink}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={copyReferralLink} className="flex items-center gap-2">
                        <Copy className="h-4 w-4" />
                        Copiar
                      </Button>
                      <Button variant="outline" onClick={shareReferralLink} className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Compartilhar
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Histórico de Indicações</h4>
                      <div className="space-y-2">
                        {[
                          { name: "Maria Silva", date: "15/11/2024", status: "Ativa" },
                          { name: "Pedro Santos", date: "10/11/2024", status: "Ativa" },
                          { name: "Ana Costa", date: "05/11/2024", status: "Ativa" }
                        ].map((referral, index) => (
                          <div key={index} className="flex justify-between items-center py-2">
                            <div>
                              <p className="font-medium">{referral.name}</p>
                              <p className="text-xs text-gray-600">{referral.date}</p>
                            </div>
                            <Badge variant="outline" className="text-green-600">
                              {referral.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
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

export default UserDashboard;