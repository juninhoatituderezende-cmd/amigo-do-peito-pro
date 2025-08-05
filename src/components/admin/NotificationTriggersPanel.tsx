import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Calendar,
  Users,
  Activity
} from "lucide-react";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const NotificationTriggersPanel = () => {
  const { 
    triggers, 
    loading, 
    runTriggersManually, 
    getTriggerStats 
  } = useNotificationTriggers();
  const { user } = useAuth();
  const { toast } = useToast();

  const stats = getTriggerStats();
  const isAdmin = user?.email?.includes('admin') || false; // Ajustar conforme sua lógica de admin

  const handleManualRun = async () => {
    const success = await runTriggersManually();
    if (success) {
      toast({
        title: "Gatilhos executados",
        description: "Verificação manual de gatilhos concluída com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Erro ao executar gatilhos manualmente.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case '15_days': return '15 dias - Primeiro lembrete';
      case '30_days': return '30 dias - Materiais de apoio';
      case '60_days': return '60 dias - Estratégias avançadas';
      case '90_days': return '90 dias - Grupos públicos';
      case '180_days': return '180 dias - Conversão para créditos';
      default: return type;
    }
  };

  const getTriggerIcon = (type: string, executed: boolean) => {
    if (executed) return <CheckCircle className="h-4 w-4 text-green-600" />;
    
    switch (type) {
      case '15_days':
      case '30_days':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case '60_days':
      case '90_days':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case '180_days':
        return <Activity className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Sistema de Gatilhos Automáticos
            </CardTitle>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRun}
              >
                <Play className="h-4 w-4 mr-2" />
                Executar Manualmente
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-700">Total de Gatilhos</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.executed}</div>
              <div className="text-sm text-green-700">Executados</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-orange-700">Pendentes</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-red-700">Atrasados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Gatilhos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seus Gatilhos Programados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {triggers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum gatilho programado</p>
              <p className="text-sm">Os gatilhos serão criados automaticamente quando você criar um grupo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {triggers.map((trigger, index) => (
                <div
                  key={`${trigger.groupId}-${trigger.triggerType}`}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    trigger.executed 
                      ? 'bg-green-50 border-green-200' 
                      : new Date(trigger.scheduledFor) < new Date()
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getTriggerIcon(trigger.triggerType, trigger.executed)}
                    <div>
                      <h4 className="font-medium">
                        {getTriggerLabel(trigger.triggerType)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Grupo #{trigger.groupId.slice(-8)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm">
                      {trigger.executed ? (
                        <Badge variant="default" className="bg-green-600">
                          Executado
                        </Badge>
                      ) : new Date(trigger.scheduledFor) < new Date() ? (
                        <Badge variant="destructive">
                          Atrasado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Agendado
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {trigger.executed && trigger.executedAt 
                        ? `Executado: ${formatDate(trigger.executedAt)}`
                        : `Agendado: ${formatDate(trigger.scheduledFor)}`
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações para Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Como Funcionam os Gatilhos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">15 e 30 dias</h4>
                <p className="text-sm text-blue-700">
                  Lembretes e materiais de apoio para ajudar na divulgação
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900">60 e 90 dias</h4>
                <p className="text-sm text-orange-700">
                  Estratégias avançadas e opções de grupos públicos
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">180 dias</h4>
                <p className="text-sm text-purple-700">
                  Conversão automática do pagamento em créditos para uso no marketplace
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};