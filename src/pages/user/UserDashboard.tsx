import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserGroupsHistory } from "@/components/user/UserGroupsHistory";
import { UserProfile } from "@/components/user/UserProfile";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { ReferralSystem } from "@/components/user/ReferralSystem";
import { PlansSelection } from "@/components/plans/PlansSelection";
import { CreditBalance } from "@/components/user/CreditBalance";
import { ParticipationDashboard } from "@/components/user/ParticipationDashboard";
import { 
  User, 
  Users, 
  Bell, 
  ShoppingCart, 
  Settings, 
  Share, 
  Wallet,
  Target,
  Package,
  TrendingUp,
  Gift
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { balance } = useCredits();
  const [userData, setUserData] = useState({
    name: user?.name || "Usuário",
    email: user?.email || "",
    joinDate: "2024-01-10",
    totalGroups: 0,
    activeGroups: 0,
    contemplatedGroups: 0
  });
  const [loading, setLoading] = useState(true);
  const [quickStats, setQuickStats] = useState({
    activeParticipations: 0,
    totalReferrals: 0,
    unreadNotifications: 0
  });

  useEffect(() => {
    if (user) {
      loadUserData();
      loadQuickStats();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user participations
      const { data: participations } = await supabase
        .from('group_participants')
        .select(`
          *,
          plan_groups(*)
        `)
        .eq('user_id', user?.id);

      const totalGroups = participations?.length || 0;
      const activeGroups = participations?.filter(p => p.status === 'active').length || 0;
      const contemplatedGroups = participations?.filter(p => p.status === 'contemplated').length || 0;

      setUserData({
        name: user?.name || "Usuário",
        email: user?.email || "",
        joinDate: "2024-01-10",
        totalGroups,
        activeGroups,
        contemplatedGroups
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuickStats = async () => {
    try {
      // Load active participations
      const { data: activeParticipations } = await supabase
        .from('group_participants')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      // Load referrals (using profiles table with referred_by)
      const { data: referralData } = await supabase
        .from('profiles')
        .select('id')
        .eq('referred_by', user?.id);

      // Load unread notifications
      const { data: notifications } = await supabase
        .from('notification_triggers')
        .select('id')
        .eq('user_id', user?.id)
        .eq('sent', false);

      setQuickStats({
        activeParticipations: activeParticipations?.length || 0,
        totalReferrals: referralData?.length || 0,
        unreadNotifications: notifications?.length || 0
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-ap-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header com Informações Rápidas */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Olá, {userData.name}!</h1>
                <p className="text-muted-foreground">
                  Membro desde {userData.joinDate}
                </p>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/usuario/marketplace')}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Marketplace
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/plans')}
                className="flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                Participar de Plano
              </Button>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Créditos</p>
                    <p className="text-xl font-bold">
                      {balance ? formatCurrency(balance.availableCredits) : "R$ 0,00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Planos Ativos</p>
                    <p className="text-xl font-bold">{quickStats.activeParticipations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Indicações</p>
                    <p className="text-xl font-bold">{quickStats.totalReferrals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Bell className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Notificações</p>
                    <p className="text-xl font-bold">{quickStats.unreadNotifications}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          {/* Menu de Navegação - Unificado para Desktop e Mobile */}
          <div className="w-full">
            {/* Layout Desktop */}
            <div className="hidden lg:block">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Grupos
                </TabsTrigger>
                <TabsTrigger value="referrals" className="flex items-center gap-2">
                  <Share className="h-4 w-4" />
                  Indicações
                </TabsTrigger>
                <TabsTrigger value="credits" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Créditos
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificações
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Perfil
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Layout Mobile - Agora no topo também */}
            <div className="lg:hidden w-full">
              <TabsList className="grid grid-cols-6 w-full h-14">
                <TabsTrigger value="dashboard" className="flex flex-col items-center justify-center p-1 h-full">
                  <Target className="h-4 w-4 mb-1" />
                  <span className="text-xs">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex flex-col items-center justify-center p-1 h-full">
                  <Users className="h-4 w-4 mb-1" />
                  <span className="text-xs">Grupos</span>
                </TabsTrigger>
                <TabsTrigger value="referrals" className="flex flex-col items-center justify-center p-1 h-full">
                  <Share className="h-4 w-4 mb-1" />
                  <span className="text-xs">Indicações</span>
                </TabsTrigger>
                <TabsTrigger value="credits" className="flex flex-col items-center justify-center p-1 h-full">
                  <Wallet className="h-4 w-4 mb-1" />
                  <span className="text-xs">Créditos</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex flex-col items-center justify-center p-1 h-full">
                  <Bell className="h-4 w-4 mb-1" />
                  <span className="text-xs">Notificações</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex flex-col items-center justify-center p-1 h-full">
                  <Settings className="h-4 w-4 mb-1" />
                  <span className="text-xs">Perfil</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="dashboard">
            <ParticipationDashboard />
          </TabsContent>

          <TabsContent value="groups">
            <UserGroupsHistory />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSystem />
          </TabsContent>

          <TabsContent value="credits">
            <CreditBalance />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;