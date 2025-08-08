
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Eye,
  FileText,
  Download,
  Filter,
  Search,
  RefreshCw,
  MoreHorizontal,
  Star,
  Heart,
  MessageSquare,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Zap,
  Upload,
  Package,
  Store,
  ShoppingCart
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { NotificationTriggersManager } from "@/components/admin/NotificationTriggersManager";
import { MaterialUploadPanel } from "@/components/admin/MaterialUploadPanel";
import { PaymentManagement } from "@/components/admin/PaymentManagement";
import { CustomPlansManager } from "@/components/admin/CustomPlansManager";
import { AdminManagementPanel } from "@/components/admin/AdminManagementPanel";
import { ContemplationValidation } from "@/components/admin/ContemplationValidation";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard";
import { ServicePlansManager } from "@/components/admin/ServicePlansManager";
import { UserMarketplaceManager } from "@/components/admin/UserMarketplaceManager";
import { ProfessionalMarketplaceManager } from "@/components/admin/ProfessionalMarketplaceManager";
import { SalesManager } from "@/components/admin/SalesManager";
import { ReportsAnalytics } from "@/components/admin/ReportsAnalytics";

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

interface ActivityLog {
  id: string;
  type: "registration" | "approval" | "transaction" | "login" | "profile_update";
  user: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface RegistrationTrend {
  date: string;
  professionals: number;
  users: number;
  influencers: number;
}

interface CategoryStats {
  name: string;
  value: number;
  color: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  
  const handleGoogleSetup = () => {
    window.open('/google-setup', '_blank');
  };
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState("7days");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // State for data from Supabase
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  
  // Load data from Supabase with retry logic
  useEffect(() => {
    const loadData = async (retryCount = 0) => {
      try {
        setLoading(true);
        
        // Load professionals with retry
        const loadProfessionals = async () => {
          try {
            const { data, error } = await supabase
              .from('professionals')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (error) throw error;
            setProfessionals(data || []);
          } catch (error) {
            console.error('Error loading professionals:', error);
            if (retryCount < 2) {
              console.log('Retrying professionals load...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return loadProfessionals();
            }
          }
        };
        
        // Load users with retry
        const loadUsers = async () => {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (error) throw error;
            const transformedUsers = (data || []).map(user => ({
              id: user.id,
              name: user.nome,
              email: user.email,
              full_name: user.nome,
              phone: user.telefone,
              created_at: user.created_at,
              referral_code: `REF-${user.id.slice(-4).toUpperCase()}`
            }));
            setUsers(transformedUsers);
          } catch (error) {
            console.error('Error loading users:', error);
            if (retryCount < 2) {
              console.log('Retrying users load...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return loadUsers();
            }
          }
        };
        
        // Load influencers with retry
        const loadInfluencers = async () => {
          try {
            const { data, error } = await supabase
              .from('influencers')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (error) throw error;
            setInfluencers(data || []);
          } catch (error) {
            console.error('Error loading influencers:', error);
            if (retryCount < 2) {
              console.log('Retrying influencers load...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return loadInfluencers();
            }
          }
        };
        
        // Execute all loads in parallel
        await Promise.all([
          loadProfessionals(),
          loadUsers(),
          loadInfluencers()
        ]);
        
      } catch (error) {
        console.error('Error loading data:', error);
        if (retryCount < 2) {
          console.log(`Retrying data load... Attempt ${retryCount + 1}`);
          setTimeout(() => loadData(retryCount + 1), 2000);
          return;
        }
        
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do dashboard. Tente atualizar a página.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => loadData(), 30000);
    
    return () => clearInterval(interval);
  }, [toast]);
  
  // Activity logs para monitoramento (mock data - será substituído por dados reais)
  const [activityLogs] = useState<ActivityLog[]>([
    {
      id: "1",
      type: "registration",
      user: "João Silva",
      description: "Novo usuário se cadastrou na plataforma",
      timestamp: "2024-01-22T10:30:00Z"
    },
    {
      id: "2",
      type: "approval",
      user: "Admin",
      description: "Profissional Ana Costa foi aprovado",
      timestamp: "2024-01-22T09:15:00Z"
    },
    {
      id: "3",
      type: "profile_update",
      user: "Pedro Santos",
      description: "Profissional atualizou informações do perfil",
      timestamp: "2024-01-22T08:45:00Z"
    }
  ]);

  // Dados de tendência de cadastros (mock data)
  const [registrationTrends] = useState<RegistrationTrend[]>([
    { date: "16/01", professionals: 2, users: 8, influencers: 1 },
    { date: "17/01", professionals: 3, users: 12, influencers: 0 },
    { date: "18/01", professionals: 1, users: 15, influencers: 2 },
    { date: "19/01", professionals: 4, users: 10, influencers: 1 },
    { date: "20/01", professionals: 2, users: 18, influencers: 0 },
    { date: "21/01", professionals: 5, users: 14, influencers: 3 },
    { date: "22/01", professionals: 3, users: 20, influencers: 1 }
  ]);

  // Estatísticas por categoria
  const categoryStats: CategoryStats[] = [
    { name: "Tatuadores", value: professionals.filter(p => p.category === "tattoo").length, color: "#8884d8" },
    { name: "Dentistas", value: professionals.filter(p => p.category === "dental").length, color: "#82ca9d" },
    { name: "Outros", value: professionals.filter(p => !["tattoo", "dental"].includes(p.category)).length, color: "#ffc658" }
  ];
  
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

  const handleProfileView = (profile: any, type: string) => {
    setSelectedProfile({ ...profile, type });
    setProfileDialogOpen(true);
  };

  const refreshData = async () => {
    const currentTime = new Date();
    setLastRefresh(currentTime);
    setLoading(true);
    
    try {
      // Recarregar dados do Supabase
      const [professionalsRes, usersRes, influencersRes] = await Promise.all([
        supabase.from('professionals').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('influencers').select('*').order('created_at', { ascending: false })
      ]);

      if (professionalsRes.data) setProfessionals(professionalsRes.data);
      if (usersRes.data) {
        const transformedUsers = usersRes.data.map(user => ({
          id: user.id,
          name: user.nome,
          email: user.email,
          full_name: user.nome,
          phone: user.telefone,
          created_at: user.created_at,
          referral_code: `REF-${user.id.slice(-4).toUpperCase()}`
        }));
        setUsers(transformedUsers);
      }
      if (influencersRes.data) setInfluencers(influencersRes.data);

      toast({
        title: "Dados atualizados!",
        description: "Dashboard foi atualizado com os dados mais recentes.",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const headers = [
        'Tipo',
        'Nome',
        'Email',
        'Telefone',
        'Status',
        'Data de Cadastro',
        'Categoria/Instagram',
        'Localização/Seguidores'
      ].join(',');

      const professionalRows = professionals.map(p => [
        'Profissional',
        `"${p.full_name}"`,
        p.email,
        p.phone,
        p.approved ? 'Aprovado' : 'Pendente',
        new Date(p.created_at).toLocaleDateString('pt-BR'),
        p.category,
        `"${p.location}"`
      ].join(','));

      const userRows = users.map(u => [
        'Usuário',
        `"${u.full_name}"`,
        u.email,
        u.phone || '',
        'Ativo',
        new Date(u.created_at).toLocaleDateString('pt-BR'),
        u.referral_code,
        ''
      ].join(','));

      const influencerRows = influencers.map(i => [
        'Influenciador',
        `"${i.full_name}"`,
        i.email,
        i.phone,
        i.approved ? 'Aprovado' : 'Pendente',
        new Date(i.created_at).toLocaleDateString('pt-BR'),
        i.instagram,
        i.followers
      ].join(','));

      const csv = [headers, ...professionalRows, ...userRows, ...influencerRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Exportação concluída!",
        description: "Dados exportados com sucesso para CSV.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
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
    monthlyGrowth: "+15.3%",
    approvalRate: professionals.length > 0 ? Math.round((professionals.filter(p => p.approved).length / professionals.length) * 100) : 0,
    recentRegistrations: [...professionals, ...users, ...influencers]
      .filter(item => {
        const itemDate = new Date(item.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate > weekAgo;
      }).length
  };

  // Filtros para diferentes seções
  const filteredProfessionals = professionals.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "pending" && !p.approved) ||
                         (statusFilter === "approved" && p.approved);
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInfluencers = influencers.filter(i => {
    const matchesSearch = i.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         i.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "pending" && !i.approved) ||
                         (statusFilter === "approved" && i.approved);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600">
                Monitore cadastros, aprove perfis e acompanhe o crescimento da plataforma
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-500">
                  Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar perfis..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button 
                onClick={refreshData} 
                variant="outline" 
                className="flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                onClick={handleExportData}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Profissionais</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalProfessionals}</p>
                    <p className="text-sm text-gray-500">
                      {stats.pendingProfessionals} aguardando aprovação
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={stats.approvalRate} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">Taxa de aprovação: {stats.approvalRate}%</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Usuários</p>
                    <p className="text-3xl font-bold text-green-600">{stats.totalUsers}</p>
                    <p className="text-sm text-gray-500">Usuários ativos</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">{stats.monthlyGrowth}</span>
                  <span className="text-sm text-gray-500 ml-1">este mês</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Influenciadores</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalInfluencers}</p>
                    <p className="text-sm text-gray-500">
                      {stats.pendingInfluencers} pendentes
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600 font-medium">Ativos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cadastros Recentes</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.recentRegistrations}</p>
                    <p className="text-sm text-gray-500">Últimos 7 dias</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600 font-medium">Crescimento acelerado</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-6">
            <div className="border-b">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-13 h-auto p-1 bg-gray-100">
                <TabsTrigger value="overview" className="text-sm py-3">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="professionals" className="text-sm py-3">
                  <Users className="h-4 w-4 mr-2" />
                  Profissionais
                </TabsTrigger>
                <TabsTrigger value="users" className="text-sm py-3">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger value="influencers" className="text-sm py-3">
                  <Star className="h-4 w-4 mr-2" />
                  Influenciadores
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-sm py-3">
                  <Activity className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="monitoring" className="text-sm py-3">
                  <Eye className="h-4 w-4 mr-2" />
                  Monitoramento
                </TabsTrigger>
                <TabsTrigger value="triggers" className="text-sm py-3">
                  <Zap className="h-4 w-4 mr-2" />
                  Gatilhos
                </TabsTrigger>
                <TabsTrigger value="materials" className="text-sm py-3">
                  <Upload className="h-4 w-4 mr-2" />
                  Materiais
                </TabsTrigger>
                <TabsTrigger value="reports" className="text-sm py-3">
                  <FileText className="h-4 w-4 mr-2" />
                  Relatórios
                </TabsTrigger>
                <TabsTrigger value="payments" className="text-sm py-3">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pagamentos
                </TabsTrigger>
                <TabsTrigger value="contemplations" className="text-sm py-3">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Contemplações
                </TabsTrigger>
                <TabsTrigger value="security" className="text-sm py-3">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Segurança
                </TabsTrigger>
                <TabsTrigger value="service-plans" className="text-sm py-3">
                  <Package className="h-4 w-4 mr-2" />
                  Planos de Serviço
                </TabsTrigger>
                <TabsTrigger value="user-marketplace" className="text-sm py-3">
                  <Store className="h-4 w-4 mr-2" />
                  Marketplace Usuário
                </TabsTrigger>
                <TabsTrigger value="professional-marketplace" className="text-sm py-3">
                  <Store className="h-4 w-4 mr-2" />
                  Marketplace Profissional
                </TabsTrigger>
                <TabsTrigger value="sales" className="text-sm py-3">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Vendas
                </TabsTrigger>
              </TabsList>
            </div>

            {/* VISÃO GERAL */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Tendência de Cadastros */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Tendência de Cadastros (7 dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Gráfico de tendência de cadastros</p>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="h-2 w-full bg-blue-200 rounded mb-1"></div>
                            <span className="text-blue-600">Profissionais</span>
                          </div>
                          <div className="text-center">
                            <div className="h-2 w-full bg-green-200 rounded mb-1"></div>
                            <span className="text-green-600">Usuários</span>
                          </div>
                          <div className="text-center">
                            <div className="h-2 w-full bg-yellow-200 rounded mb-1"></div>
                            <span className="text-yellow-600">Influenciadores</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Distribuição por Categoria */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Distribuição de Profissionais por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Distribuição por categoria</p>
                        <div className="space-y-2 text-sm">
                          {categoryStats.map((stat, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: stat.color }}
                                ></div>
                                <span>{stat.name}</span>
                              </div>
                              <span className="font-medium">{stat.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ações Pendentes e Atividade Recente */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Ações Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-yellow-800">Profissionais Pendentes</p>
                          <p className="text-sm text-yellow-600">{stats.pendingProfessionals} aguardando aprovação</p>
                        </div>
                        <Button size="sm" onClick={() => setActiveTab("professionals")} className="bg-yellow-500 hover:bg-yellow-600">
                          Revisar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-purple-800">Influenciadores Pendentes</p>
                          <p className="text-sm text-purple-600">{stats.pendingInfluencers} aguardando análise</p>
                        </div>
                        <Button size="sm" onClick={() => setActiveTab("influencers")} className="bg-purple-500 hover:bg-purple-600">
                          Analisar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-blue-800">Novos Cadastros</p>
                          <p className="text-sm text-blue-600">{stats.recentRegistrations} nos últimos 7 dias</p>
                        </div>
                        <Button size="sm" onClick={() => setActiveTab("monitoring")} variant="outline">
                          Ver Todos
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      Atividade Recente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activityLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                          <div className={`p-2 rounded-full ${
                            log.type === 'registration' ? 'bg-blue-100' :
                            log.type === 'approval' ? 'bg-green-100' :
                            'bg-gray-100'
                          }`}>
                            {log.type === 'registration' ? <UserCheck className="h-4 w-4 text-blue-600" /> :
                             log.type === 'approval' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                             <Activity className="h-4 w-4 text-gray-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{log.user}</p>
                            <p className="text-sm text-gray-600">{log.description}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(log.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* PROFISSIONAIS */}
            <TabsContent value="professionals" className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Gestão de Profissionais</h2>
                  <p className="text-gray-600">Total: {filteredProfessionals.length} profissionais</p>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="approved">Aprovados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
                </div>
              ) : filteredProfessionals.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum profissional encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProfessionals.map((pro) => (
                    <Card key={pro.id} className="hover:shadow-lg transition-shadow">
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
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">📍</span>
                            <span>{pro.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">📱</span>
                            <span>{pro.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">📸</span>
                            <span>@{pro.instagram}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">✉️</span>
                            <span className="text-xs">{pro.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">📅</span>
                            <span>{new Date(pro.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex gap-2">
                          {!pro.approved ? (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1 bg-green-600 hover:bg-green-700" 
                                onClick={() => handleApprove(pro.id, "Profissional")}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aprovar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                                onClick={() => handleReject(pro.id, "Profissional")}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Rejeitar
                              </Button>
                            </>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleProfileView(pro, 'professional')}
                            >
                              <Eye className="h-4 w-4 mr-2" />
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleProfileView(user, 'user')}
                          >
                            Ver Perfil
                          </Button>
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleProfileView(inf, 'influencer')}
                          >
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
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col bg-blue-50 border-blue-200 hover:bg-blue-100"
                    onClick={() => window.open('/google-setup', '_blank')}
                  >
                    <span className="text-lg mb-1">🔑</span>
                    <span className="text-xs text-center">Configurar Google OAuth</span>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GATILHOS TEMPORAIS */}
            <TabsContent value="triggers" className="space-y-6">
              <NotificationTriggersManager />
            </TabsContent>

            {/* UPLOAD DE MATERIAIS */}
            <TabsContent value="materials" className="space-y-6">
              <MaterialUploadPanel />
            </TabsContent>

            {/* RELATÓRIOS E ANALYTICS */}
            <TabsContent value="reports" className="space-y-6">
              <ReportsAnalytics />
            </TabsContent>

            {/* GESTÃO DE PAGAMENTOS */}
            <TabsContent value="payments" className="space-y-6">
              <PaymentManagement />
            </TabsContent>

            {/* VALIDAÇÃO DE CONTEMPLAÇÕES */}
            <TabsContent value="contemplations" className="space-y-6">
              <ContemplationValidation />
            </TabsContent>

            {/* DASHBOARD DE SEGURANÇA */}
            <TabsContent value="security" className="space-y-6">
              <SecurityDashboard />
            </TabsContent>

            {/* PLANOS DE SERVIÇO */}
            <TabsContent value="service-plans" className="space-y-6">
              <ServicePlansManager />
            </TabsContent>

            {/* MARKETPLACE USUÁRIO */}
            <TabsContent value="user-marketplace" className="space-y-6">
              <UserMarketplaceManager />
            </TabsContent>

            {/* MARKETPLACE PROFISSIONAL */}
            <TabsContent value="professional-marketplace" className="space-y-6">
              <ProfessionalMarketplaceManager />
            </TabsContent>

            {/* LISTA DE VENDAS */}
            <TabsContent value="sales" className="space-y-6">
              <SalesManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog para visualização de perfis */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes do {selectedProfile?.type === 'professional' ? 'Profissional' : 
                         selectedProfile?.type === 'influencer' ? 'Influenciador' : 'Usuário'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Nome:</strong> {selectedProfile.full_name || selectedProfile.name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedProfile.email}
                </div>
                <div>
                  <strong>Telefone:</strong> {selectedProfile.phone || selectedProfile.telefone || 'N/A'}
                </div>
                <div>
                  <strong>Data de Cadastro:</strong> {new Date(selectedProfile.created_at).toLocaleDateString('pt-BR')}
                </div>
                
                {selectedProfile.type === 'professional' && (
                  <>
                    <div>
                      <strong>Categoria:</strong> {selectedProfile.category}
                    </div>
                    <div>
                      <strong>Localização:</strong> {selectedProfile.location}
                    </div>
                    <div>
                      <strong>Instagram:</strong> @{selectedProfile.instagram}
                    </div>
                    <div>
                      <strong>Status:</strong> {selectedProfile.approved ? 'Aprovado' : 'Pendente'}
                    </div>
                  </>
                )}
                
                {selectedProfile.type === 'influencer' && (
                  <>
                    <div>
                      <strong>Instagram:</strong> @{selectedProfile.instagram}
                    </div>
                    <div>
                      <strong>Seguidores:</strong> {selectedProfile.followers}
                    </div>
                    <div>
                      <strong>Status:</strong> {selectedProfile.approved ? 'Aprovado' : 'Pendente'}
                    </div>
                  </>
                )}
                
                {selectedProfile.type === 'user' && (
                  <div>
                    <strong>Código de Referência:</strong> {selectedProfile.referral_code}
                  </div>
                )}
              </div>
              
              {selectedProfile.description && (
                <div>
                  <strong>Descrição:</strong>
                  <p className="mt-1 text-sm text-gray-600">{selectedProfile.description}</p>
                </div>
              )}
              
              {selectedProfile.experience && (
                <div>
                  <strong>Experiência:</strong>
                  <p className="mt-1 text-sm text-gray-600">{selectedProfile.experience}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;
