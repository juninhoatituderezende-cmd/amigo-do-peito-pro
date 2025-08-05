import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner, SkeletonCard } from "@/components/LoadingComponents";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Clock, 
  DollarSign, 
  Share2, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Gift,
  Copy,
  ExternalLink
} from "lucide-react";

interface PlanParticipation {
  id: string;
  plan_id: string;
  payment_status: string;
  contemplated: boolean;
  position_in_queue: number;
  entry_paid_at: string;
  plan: {
    title: string;
    description: string;
    entry_value: number;
    contemplation_value: number;
    max_participants: number;
  };
}

interface UserStats {
  total_referrals: number;
  pending_commission: number;
  total_earned: number;
  active_plans: number;
}

export function EnhancedUserDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanParticipation[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState("plans");
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserPlans(),
        loadUserStats(),
        loadReferralCode(),
      ]);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPlans = async () => {
    const { data, error } = await supabase
      .from("plan_participants")
      .select(`
        *,
        plan:custom_plans(
          title,
          description,
          entry_value,
          contemplation_value,
          max_participants
        )
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Calculate position in queue for each plan
    const plansWithPosition = await Promise.all(
      data.map(async (participation) => {
        const { count } = await supabase
          .from("plan_participants")
          .select("id", { count: "exact" })
          .eq("plan_id", participation.plan_id)
          .eq("payment_status", "paid")
          .lt("entry_paid_at", participation.entry_paid_at);

        return {
          ...participation,
          position_in_queue: (count || 0) + 1,
        };
      })
    );

    setPlans(plansWithPosition);
  };

  const loadUserStats = async () => {
    // Mock stats - replace with real data
    setStats({
      total_referrals: 5,
      pending_commission: 150.00,
      total_earned: 320.50,
      active_plans: plans.length,
    });
  };

  const loadReferralCode = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user?.id)
      .single();

    if (data?.referral_code) {
      setReferralCode(data.referral_code);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "Compartilhe este link para ganhar comissões",
    });
  };

  const shareReferralLink = () => {
    const link = `${window.location.origin}/?ref=${referralCode}`;
    const text = "Participe dos meus grupos de contemplação e realize seus sonhos!";
    
    if (navigator.share) {
      navigator.share({
        title: "Convite para Grupo de Contemplação",
        text: text,
        url: link,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + link)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const getStatusBadge = (status: string, contemplated: boolean) => {
    if (contemplated) {
      return <Badge className="bg-green-100 text-green-800">Contemplado</Badge>;
    }
    
    switch (status) {
      case "paid":
        return <Badge className="bg-blue-100 text-blue-800">Ativo</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  const calculateProgress = (position: number, maxParticipants: number) => {
    return Math.max(0, ((maxParticipants - position) / maxParticipants) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">
          Olá, {(user as any)?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário"}! 👋
        </h1>
        <p className="opacity-90">
          Acompanhe seus grupos de contemplação e indicações
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planos Ativos</p>
                <p className="text-2xl font-bold">{stats?.active_plans || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Indicações</p>
                <p className="text-2xl font-bold">{stats?.total_referrals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comissão Pendente</p>
                <p className="text-2xl font-bold">R$ {stats?.pending_commission?.toFixed(2) || "0,00"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ganho</p>
                <p className="text-2xl font-bold">R$ {stats?.total_earned?.toFixed(2) || "0,00"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Meus Planos</TabsTrigger>
          <TabsTrigger value="referrals">Indicações</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          {plans.length === 0 ? (
            <Alert>
              <Gift className="h-4 w-4" />
              <AlertDescription>
                Você ainda não participa de nenhum plano. 
                <Button variant="link" className="p-0 h-auto ml-1">
                  Explore nossos planos disponíveis
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.plan.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.plan.description}
                        </p>
                      </div>
                      {getStatusBadge(plan.payment_status, plan.contemplated)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Pago</p>
                        <p className="font-semibold">R$ {plan.plan.entry_value.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Meta</p>
                        <p className="font-semibold">R$ {plan.plan.contemplation_value.toFixed(2)}</p>
                      </div>
                    </div>

                    {!plan.contemplated && plan.payment_status === "paid" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Posição na fila: #{plan.position_in_queue}</span>
                          <span>{plan.plan.max_participants - plan.position_in_queue} para frente</span>
                        </div>
                        <Progress 
                          value={calculateProgress(plan.position_in_queue, plan.plan.max_participants)} 
                          className="h-2"
                        />
                      </div>
                    )}

                    {plan.contemplated && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          🎉 Parabéns! Você foi contemplado neste plano!
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="h-5 w-5" />
                <span>Seu Link de Indicação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm">
                  {window.location.origin}/?ref={referralCode}
                </code>
                <Button size="sm" variant="outline" onClick={copyReferralLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button onClick={shareReferralLink} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar Link
                </Button>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Estatísticas
                </Button>
              </div>

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Ganhe 10% de comissão para cada pessoa que se cadastrar usando seu link!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <p className="text-sm text-muted-foreground">
                    {(user as any)?.user_metadata?.full_name || user?.email?.split('@')[0] || "Não informado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Button variant="outline">Editar Perfil</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}