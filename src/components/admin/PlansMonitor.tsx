import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UnifiedPlan {
  id: string;
  name: string;
  price: number;
  active: boolean;
  tipo_transacao: string;
  category: string;
  table_source: string;
  created_at: string;
}

interface PlanStats {
  total_found: number;
  total_valid: number;
  total_filtered: number;
  by_category: Record<string, number>;
  by_transaction_type: Record<string, number>;
  by_table_source: Record<string, number>;
  errors: string[];
}

export const PlansMonitor = () => {
  const [plans, setPlans] = useState<UnifiedPlan[]>([]);
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { toast } = useToast();

  const loadPlansData = async (includeInactive = false) => {
    setLoading(true);
    try {
      console.log('🔍 [MONITOR] Carregando dados completos dos planos...');
      
      const { data: response, error } = await supabase.functions.invoke('unified-plans-loader', {
        body: { 
          include_inactive: includeInactive, 
          admin_view: true 
        }
      });

      if (error) {
        console.error('❌ [MONITOR] Erro na edge function:', error);
        throw error;
      }

      if (!response?.success) {
        console.error('❌ [MONITOR] Resposta inválida:', response);
        throw new Error('Falha ao carregar dados dos planos');
      }

      setPlans(response.plans || []);
      setStats(response.stats || null);
      setLastRefresh(new Date());

      console.log('✅ [MONITOR] Dados carregados:', {
        total: response.plans?.length || 0,
        errors: response.errors?.length || 0
      });

      if (response.errors && response.errors.length > 0) {
        toast({
          title: "Avisos encontrados",
          description: `${response.errors.length} problemas detectados nos dados.`,
          variant: "default",
        });
      }

    } catch (error) {
      console.error('❌ [MONITOR] Erro crítico:', error);
      toast({
        title: "Erro no Monitor",
        description: "Falha ao carregar dados dos planos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlansData();
  }, []);

  const getStatusColor = (active: boolean) => {
    return active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'tattoo': 'bg-purple-100 text-purple-800',
      'dental': 'bg-blue-100 text-blue-800',
      'service': 'bg-green-100 text-green-800',
      'product': 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getTableSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'planos_tatuador': 'bg-purple-50 text-purple-700',
      'planos_dentista': 'bg-blue-50 text-blue-700',
      'custom_plans': 'bg-green-50 text-green-700',
      'products': 'bg-orange-50 text-orange-700',
    };
    return colors[source] || 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Planos</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real de todos os planos e produtos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => loadPlansData(false)}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Apenas Ativos
          </Button>
          
          <Button
            onClick={() => loadPlansData(true)}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Todos (Incluindo Inativos)
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Encontrado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_found}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_valid} válidos, {stats.total_found - stats.total_valid} inválidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Serviços:</span>
                  <span className="font-medium">{stats.by_transaction_type.servico || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Produtos:</span>
                  <span className="font-medium">{stats.by_transaction_type.produto || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Tatuagem:</span>
                  <span className="font-medium">{stats.by_category.tattoo || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dental:</span>
                  <span className="font-medium">{stats.by_category.dental || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Produtos:</span>
                  <span className="font-medium">{stats.by_category.product || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.errors.length > 0 ? (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span className="text-sm">{stats.errors.length} problemas</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">Tudo funcionando</span>
                  </div>
                )}
                {lastRefresh && (
                  <p className="text-xs text-muted-foreground">
                    Última atualização: {lastRefresh.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de erros se houver */}
      {stats?.errors && stats.errors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Problemas Detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.errors.map((error, index) => (
                <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de planos */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Planos ({plans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground">ID: {plan.id}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">R$ {plan.price}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(plan.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(plan.active)}>
                    {plan.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  
                  <Badge className={getCategoryColor(plan.category)}>
                    {plan.category}
                  </Badge>
                  
                  <Badge variant="outline">
                    {plan.tipo_transacao}
                  </Badge>
                  
                  <Badge className={getTableSourceColor(plan.table_source)}>
                    {plan.table_source}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          {plans.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum plano encontrado
            </div>
          )}
          
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <div className="text-muted-foreground">Carregando dados...</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};