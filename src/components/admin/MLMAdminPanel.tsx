import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  TrendingUp, 
  Crown, 
  Target,
  Award,
  Calendar,
  DollarSign,
  Gift
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MLMStats {
  totalGroups: number;
  activeGroups: number;
  completedGroups: number;
  totalParticipants: number;
  totalRevenue: number;
  conversionRate: number;
}

interface Group {
  id: string;
  service_name: string;
  current_participants: number;
  max_participants: number;
  status: string;
  created_at: string;
  target_amount: number;
  current_amount: number;
}

export function MLMAdminPanel() {
  const [stats, setStats] = useState<MLMStats>({
    totalGroups: 0,
    activeGroups: 0,
    completedGroups: 0,
    totalParticipants: 0,
    totalRevenue: 0,
    conversionRate: 0
  });
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMLMData();
  }, []);

  const loadMLMData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados dos grupos
      const { data: groupsData, error: groupsError } = await supabase
        .from('plan_groups')
        .select(`
          *,
          services (
            name,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Carregar participantes
      const { data: participantsData } = await supabase
        .from('group_participants')
        .select('*');

      // Processar dados
      const mappedGroups: Group[] = (groupsData || []).map(group => ({
        id: group.id,
        service_name: group.services?.name || 'Serviço',
        current_participants: group.current_participants || 0,
        max_participants: group.max_participants || 10,
        status: group.status || 'forming',
        created_at: group.created_at,
        target_amount: group.target_amount || 0,
        current_amount: group.current_amount || 0
      }));

      setGroups(mappedGroups);

      // Calcular estatísticas
      const totalGroups = mappedGroups.length;
      const activeGroups = mappedGroups.filter(g => g.status === 'forming').length;
      const completedGroups = mappedGroups.filter(g => g.status === 'completed').length;
      const totalParticipants = participantsData?.length || 0;
      const totalRevenue = mappedGroups.reduce((acc, group) => acc + (group.current_amount || 0), 0);
      const conversionRate = totalGroups > 0 ? (completedGroups / totalGroups) * 100 : 0;

      setStats({
        totalGroups,
        activeGroups,
        completedGroups,
        totalParticipants,
        totalRevenue,
        conversionRate
      });

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'forming':
        return <Badge variant="outline" className="text-blue-600">Em Formação</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completo</Badge>;
      case 'contemplated':
        return <Badge variant="default" className="bg-yellow-600">Contemplado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando dados do MLM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Painel MLM</h1>
        <p className="text-muted-foreground">
          Monitoramento e gestão do sistema de grupos MLM
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Grupos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalGroups}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grupos Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeGroups}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Crown className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grupos Completos</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.completedGroups}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Participantes</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalParticipants}</p>
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
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
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
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-orange-600">{stats.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Management */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Grupos Ativos</TabsTrigger>
          <TabsTrigger value="completed">Grupos Completos</TabsTrigger>
          <TabsTrigger value="all">Todos os Grupos</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Grupos em Formação ({groups.filter(g => g.status === 'forming').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groups.filter(g => g.status === 'forming').map(group => (
                  <div key={group.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{group.service_name}</h3>
                      {getStatusBadge(group.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Participantes</p>
                        <p className="font-medium">{group.current_participants}/{group.max_participants}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Arrecadado</p>
                        <p className="font-medium">{formatCurrency(group.current_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Criado em</p>
                        <p className="font-medium">{formatDate(group.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso do Grupo</span>
                        <span>{Math.round((group.current_participants / group.max_participants) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(group.current_participants / group.max_participants) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
                
                {groups.filter(g => g.status === 'forming').length === 0 && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum grupo em formação no momento</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Grupos Completos ({groups.filter(g => g.status === 'completed').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groups.filter(g => g.status === 'completed').map(group => (
                  <div key={group.id} className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{group.service_name}</h3>
                      {getStatusBadge(group.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Participantes</p>
                        <p className="font-medium">{group.current_participants}/{group.max_participants}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="font-medium">{formatCurrency(group.current_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completado em</p>
                        <p className="font-medium">{formatDate(group.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {groups.filter(g => g.status === 'completed').length === 0 && (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum grupo completo ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Todos os Grupos ({groups.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groups.map(group => (
                  <div key={group.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{group.service_name}</h3>
                      {getStatusBadge(group.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Participantes</p>
                        <p className="font-medium">{group.current_participants}/{group.max_participants}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Arrecadado</p>
                        <p className="font-medium">{formatCurrency(group.current_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Meta</p>
                        <p className="font-medium">{formatCurrency(group.target_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Criado em</p>
                        <p className="font-medium">{formatDate(group.created_at)}</p>
                      </div>
                    </div>
                    
                    {group.status === 'forming' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{Math.round((group.current_participants / group.max_participants) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(group.current_participants / group.max_participants) * 100}
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                ))}
                
                {groups.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum grupo encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}