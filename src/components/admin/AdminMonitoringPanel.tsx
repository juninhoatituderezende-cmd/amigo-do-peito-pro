import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Server,
  Database,
  Shield,
  RefreshCw
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number | string;
  status: 'healthy' | 'warning' | 'critical';
  description: string;
}

export function AdminMonitoringPanel() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadSystemMetrics();
    const interval = setInterval(loadSystemMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemMetrics = async () => {
    setLoading(true);
    try {
      // Dados simulados - não faz queries no banco
      const mockMetrics: SystemMetric[] = [
        {
          name: 'Usuários Ativos',
          value: 142,
          status: 'healthy',
          description: 'Usuários conectados nos últimos 5 minutos'
        },
        {
          name: 'Tempo de Resposta DB',
          value: '45ms',
          status: 'healthy',
          description: 'Tempo médio de resposta do banco de dados'
        },
        {
          name: 'Uso de Memória',
          value: '68%',
          status: 'warning',
          description: 'Uso atual de memória do servidor'
        },
        {
          name: 'Transações Pendentes',
          value: 12,
          status: 'healthy',
          description: 'Transações aguardando processamento'
        }
      ];

      setMetrics(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Saudável</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Atenção</Badge>;
      case 'critical':
        return <Badge className="bg-red-500">Crítico</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Monitoramento do Sistema</h2>
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
          <Button onClick={loadSystemMetrics} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Geral */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Operacional</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banco de Dados</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Conectado</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segurança</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Protegido</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">
              +5% desde ontem
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas do Sistema</CardTitle>
          <CardDescription>
            Monitoramento em tempo real dos componentes do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(metric.status)}
                    <div>
                      <p className="font-medium">{metric.name}</p>
                      <p className="text-sm text-muted-foreground">{metric.description}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-bold">{metric.value}</p>
                    {getStatusBadge(metric.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas do Sistema</CardTitle>
          <CardDescription>
            Notificações importantes sobre o estado do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Uso de memória acima de 65%. Considere otimizar o sistema.
            </AlertDescription>
          </Alert>
          
          <Alert className="border-green-200 bg-green-50">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Sistema operando normalmente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}