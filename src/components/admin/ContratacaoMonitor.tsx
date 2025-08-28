import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, XCircle, RefreshCw, DollarSign, Calculator, Download, Settings, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContratacaoStats {
  total_tentativas: number;
  sucesso: number;
  falhas: number;
  pendentes: number;
  taxa_sucesso: number;
  valor_total_processado: number;
  impostos_arrecadados: number;
}

interface ErrorLog {
  id: string;
  created_at: string;
  error_message: string;
  user_id: string;
  plan_id: string;
  valor: number;
  status: string;
}

export const ContratacaoMonitor = () => {
  const [stats, setStats] = useState<ContratacaoStats | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar estatísticas de transações
      const { data: transacoes, error: transacoesError } = await supabase
        .from('transacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (transacoesError) {
        throw transacoesError;
      }

      // Calcular estatísticas
      const total = transacoes?.length || 0;
      const sucesso = transacoes?.filter(t => t.status === 'pago').length || 0;
      const falhas = transacoes?.filter(t => t.status === 'falha').length || 0;
      const pendentes = transacoes?.filter(t => t.status === 'pendente').length || 0;
      
      const taxaSucesso = total > 0 ? (sucesso / total) * 100 : 0;
      const valorTotal = transacoes?.reduce((acc, t) => acc + (t.valor || 0), 0) || 0;
      const impostosTotal = transacoes?.reduce((acc, t) => acc + (t.valor_impostos || 0), 0) || 0;

      setStats({
        total_tentativas: total,
        sucesso,
        falhas,
        pendentes,
        taxa_sucesso: taxaSucesso,
        valor_total_processado: valorTotal,
        impostos_arrecadados: impostosTotal
      });

      // Buscar logs de erro recentes
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!paymentsError && payments) {
        const formattedErrors: ErrorLog[] = payments.map(p => ({
          id: p.id,
          created_at: p.created_at,
          error_message: 'Falha no pagamento',
          user_id: p.user_id,
          plan_id: p.plan_id || '',
          valor: p.amount || 0,
          status: p.status
        }));
        setErrorLogs(formattedErrors);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do monitor:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de monitoramento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'falha':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'falha':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Monitor de Contratações</h2>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tentativas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_tentativas || 0}</div>
            <p className="text-xs text-muted-foreground">
              Todas as tentativas de contratação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.taxa_sucesso.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.sucesso || 0} de {stats?.total_tentativas || 0} sucessos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Processado</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats?.valor_total_processado || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total em transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impostos Calculados</CardTitle>
            <Calculator className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats?.impostos_arrecadados || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de impostos calculados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{stats?.sucesso || 0}</div>
              <div className="text-sm text-muted-foreground">Pagos</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{stats?.pendentes || 0}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600">{stats?.falhas || 0}</div>
              <div className="text-sm text-muted-foreground">Falhas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs de Erro Recentes */}
      {errorLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Falhas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errorLogs.map((error) => (
                <div key={error.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(error.status)}
                    <div>
                      <div className="font-medium text-sm">{error.error_message}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(error.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(error.valor)}</div>
                    <Badge variant="outline" className={getStatusColor(error.status)}>
                      {error.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Dados
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
            
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            
            <Button variant="outline" size="sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Logs Detalhados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};