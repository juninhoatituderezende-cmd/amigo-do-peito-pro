import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserGroupsHistory } from "@/components/user/UserGroupsHistory";
import { UserProfile } from "@/components/user/UserProfile";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { ReferralSystem } from "@/components/user/ReferralSystem";
import { PlansSelection } from "@/components/plans/PlansSelection";
import { PlanProgress } from "@/components/user/PlanProgress";
import { User, Users, Bell, ShoppingCart, Settings, Share } from "lucide-react";

const UserDashboard = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState({
    name: user?.name || "Usuário",
    email: user?.email || "",
    joinDate: "2024-01-10",
    totalGroups: 0,
    activeGroups: 0,
    contemplatedGroups: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user participations
      const { data: participations } = await supabase
        .from('plan_participants')
        .select(`
          *,
          plan_groups(*)
        `)
        .eq('user_id', user?.id);

      const totalGroups = participations?.length || 0;
      const activeGroups = participations?.filter(p => p.contemplation_status === 'waiting').length || 0;
      const contemplatedGroups = participations?.filter(p => p.contemplation_status === 'contemplated').length || 0;

      setUserData({
        name: user?.name || "Usuário",
        email: user?.email || "",
        joinDate: "2024-01-10", // Default date since created_at is not available in User type
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-ap-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="ap-container py-8">
        {/* User Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 bg-ap-orange rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Olá, {userData.name}!</h1>
              <p className="text-muted-foreground">
                Membro desde {userData.joinDate}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="groups" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-5">
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Meus Grupos
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Indicações
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Participar
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Perfil
            </TabsTrigger>
          </TabsList>

        <TabsContent value="groups">
          <UserGroupsHistory />
        </TabsContent>

        <TabsContent value="progress">
          <PlanProgress />
        </TabsContent>

          <TabsContent value="referrals">
            <ReferralSystem />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="marketplace">
            <PlansSelection />
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