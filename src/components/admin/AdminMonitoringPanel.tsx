import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { activityLogger } from "@/lib/activityLogger";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  User, 
  Calendar,
  DollarSign,
  Activity
} from "lucide-react";

interface AdminActivity {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  created_at: string;
  user_email?: string;
}

interface ErrorLog {
  id: string;
  error_id: string;
  message: string;
  url: string;
  created_at: string;
  resolved: boolean;
}

interface SystemMetrics {
  total_users: number;
  total_plans: number;
  total_payments: number;
  pending_payments: number;
  active_professionals: number;
  active_influencers: number;
}

export function AdminMonitoringPanel() {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadActivities(),
        loadErrors(),
        loadMetrics(),
      ]);
    } catch (error) {
      console.error("Error loading monitoring data:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de monitoramento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    const { data, error } = await supabase
      .from("issues")
      .select(`
        *,
        profiles:user_id(email)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    
    const activitiesWithEmail = data.map(activity => ({
      ...activity,
      user_email: activity.profiles?.email || "Sistema",
    }));
    
    setActivities(activitiesWithEmail);
  };

  const loadErrors = async () => {
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    setErrors(data);
  };

  const loadMetrics = async () => {
    const [usersCount, plansCount, paymentsCount, professionalsCount, influencersCount] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("services").select("id", { count: "exact" }),
      supabase.from("transactions").select("id", { count: "exact" }),
      supabase.from("professionals").select("id", { count: "exact" }),
      supabase.from("influencers").select("id", { count: "exact" }),
    ]);

    const { data: pendingPayments } = await supabase
      .from("transactions")
      .select("id", { count: "exact" })
      .eq("status", "pending");

    setMetrics({
      total_users: usersCount.count || 0,
      total_plans: plansCount.count || 0,
      total_payments: paymentsCount.count || 0,
      pending_payments: pendingPayments?.length || 0,
      active_professionals: professionalsCount.count || 0,
      active_influencers: influencersCount.count || 0,
    });
  };

  const resolveError = async (errorId: string) => {
    try {
      const { error } = await supabase
        .from("issues")
        .update({ resolved: true })
        .eq("id", errorId);

      if (error) throw error;

      await activityLogger.logAdminAction("error_resolved", "error_log", errorId);
      
      toast({
        title: "Erro marcado como resolvido",
        description: "O erro foi marcado como resolvido com sucesso.",
      });

      loadErrors();
    } catch (error) {
      console.error("Error resolving error:", error);
      toast({
        title: "Erro",
        description: "Falha ao marcar erro como resolvido",
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("login")) return <User className="h-4 w-4" />;
    if (action.includes("payment")) return <DollarSign className="h-4 w-4" />;
    if (action.includes("plan")) return <Calendar className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("login")) return "blue";
    if (action.includes("payment")) return "green";
    if (action.includes("error")) return "red";
    if (action.includes("admin")) return "purple";
    return "gray";
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
      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.total_users}</div>
              <p className="text-xs text-muted-foreground">Usuários</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.total_plans}</div>
              <p className="text-xs text-muted-foreground">Planos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.total_payments}</div>
              <p className="text-xs text-muted-foreground">Pagamentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{metrics.pending_payments}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.active_professionals}</div>
              <p className="text-xs text-muted-foreground">Profissionais</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.active_influencers}</div>
              <p className="text-xs text-muted-foreground">Influenciadores</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">Atividades Recentes</TabsTrigger>
          <TabsTrigger value="errors">Logs de Erro</TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Atividades do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full bg-${getActionColor(activity.action)}-100`}>
                        {getActionIcon(activity.action)}
                      </div>
                      <div>
                        <p className="font-medium">{activity.action.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          por {activity.user_email} • {new Date(activity.created_at).toLocaleString()}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground">
                            {JSON.stringify(activity.details)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-${getActionColor(activity.action)}-600`}>
                      {activity.resource_type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errors.map((error) => (
                  <Alert key={error.id} variant={error.resolved ? "default" : "destructive"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{error.message}</p>
                          <p className="text-sm text-muted-foreground">
                            {error.url} • {new Date(error.created_at).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {error.error_id}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {error.resolved ? (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolvido
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveError(error.id)}
                            >
                              Marcar como resolvido
                            </Button>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}