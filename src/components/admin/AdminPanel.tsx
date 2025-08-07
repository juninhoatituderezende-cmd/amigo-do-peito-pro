import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Calendar,
  UserCheck
} from 'lucide-react';

export function AdminPanel() {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    activeGroups: 0,
    monthlyRevenue: 0,
    contemplatedThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Dados simulados para demonstração
      setStats({
        totalParticipants: 156,
        activeGroups: 12,
        monthlyRevenue: 45000,
        contemplatedThisMonth: 8
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h2>
        <Button onClick={loadDashboardData}>
          <Activity className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Participantes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Grupos Ativos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeGroups}</div>
            <p className="text-xs text-muted-foreground">
              3 novos grupos este mês
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Mensal
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +8% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contemplados Este Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contemplatedThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              2 contemplações pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Conteúdo */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="finances">Financeiro</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>
                  Últimas atividades no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Novo participante inscrito
                      </p>
                      <p className="text-sm text-muted-foreground">
                        João Silva se inscreveu no Plano Premium
                      </p>
                    </div>
                    <div className="ml-auto font-medium">Há 2 horas</div>
                  </div>
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Contemplação realizada
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Maria Santos foi contemplada no Grupo 5
                      </p>
                    </div>
                    <div className="ml-auto font-medium">Há 4 horas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Próximas Contemplações</CardTitle>
                <CardDescription>
                  Grupos próximos da contemplação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">Grupo 3</Badge>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        8/10 participantes
                      </p>
                      <p className="text-sm text-muted-foreground">
                        80% completo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">Grupo 7</Badge>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        9/10 participantes
                      </p>
                      <p className="text-sm text-muted-foreground">
                        90% completo
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Participantes</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os participantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Funcionalidade de gerenciamento será implementada aqui.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="finances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>
                Acompanhe o desempenho financeiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Relatórios financeiros detalhados serão exibidos aqui.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}