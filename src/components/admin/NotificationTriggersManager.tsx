import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  BellOff, 
  Clock, 
  Users, 
  Play, 
  Pause,
  Settings,
  Filter,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp
} from "lucide-react";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";
import { useToast } from "@/hooks/use-toast";

interface TriggerConfig {
  id: string;
  name: string;
  description: string;
  days: number;
  enabled: boolean;
  lastExecuted?: string;
  totalExecutions: number;
  successRate: number;
}

interface InactiveUser {
  id: string;
  name: string;
  email: string;
  daysInactive: number;
  lastActivity: string;
  groupStatus: string;
  referralCount: number;
  scheduledTriggers: string[];
}

export const NotificationTriggersManager = () => {
  const [triggerConfigs, setTriggerConfigs] = useState<TriggerConfig[]>([
    {
      id: "15_days",
      name: "Primeiro Lembrete",
      description: "Usuários inativos há 15 dias recebem primeiro lembrete",
      days: 15,
      enabled: true,
      totalExecutions: 42,
      successRate: 98.5
    },
    {
      id: "30_days", 
      name: "Materiais de Apoio",
      description: "Envio de materiais promocionais após 30 dias",
      days: 30,
      enabled: true,
      totalExecutions: 28,
      successRate: 95.2
    },
    {
      id: "60_days",
      name: "Estratégias Avançadas", 
      description: "Dicas e estratégias para acelerar grupos",
      days: 60,
      enabled: true,
      totalExecutions: 15,
      successRate: 92.1
    },
    {
      id: "90_days",
      name: "Grupos Públicos",
      description: "Sugestão de participar de grupos públicos",
      days: 90,
      enabled: true,
      totalExecutions: 8,
      successRate: 89.0
    },
    {
      id: "180_days",
      name: "Conversão para Créditos",
      description: "Conversão automática do pagamento em créditos",
      days: 180,
      enabled: true,
      totalExecutions: 3,
      successRate: 100
    }
  ]);

  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([
    {
      id: "user1",
      name: "Maria Silva",
      email: "maria@email.com",
      daysInactive: 22,
      lastActivity: "2024-12-14T10:30:00Z",
      groupStatus: "forming",
      referralCount: 1,
      scheduledTriggers: ["15_days"]
    },
    {
      id: "user2", 
      name: "João Santos",
      email: "joao@email.com",
      daysInactive: 45,
      lastActivity: "2024-11-20T15:45:00Z",
      groupStatus: "forming",
      referralCount: 0,
      scheduledTriggers: ["15_days", "30_days"]
    },
    {
      id: "user3",
      name: "Ana Costa",
      email: "ana@email.com", 
      daysInactive: 95,
      lastActivity: "2024-10-01T09:20:00Z",
      groupStatus: "forming",
      referralCount: 3,
      scheduledTriggers: ["15_days", "30_days", "60_days", "90_days"]
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDays, setFilterDays] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [systemEnabled, setSystemEnabled] = useState(true);
  const { runTriggersManually } = useNotificationTriggers();
  const { toast } = useToast();

  // Executar gatilhos manualmente
  const handleManualExecution = async () => {
    setLoading(true);
    try {
      const success = await runTriggersManually();
      if (success) {
        toast({
          title: "Gatilhos executados!",
          description: "Verificação manual de gatilhos concluída com sucesso.",
        });
        
        // Atualizar estatísticas mock
        setTriggerConfigs(prev => prev.map(config => ({
          ...config,
          lastExecuted: new Date().toISOString(),
          totalExecutions: config.totalExecutions + 1
        })));
      }
    } catch (error) {
      toast({
        title: "Erro na execução",
        description: "Erro ao executar gatilhos manualmente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle de gatilho específico
  const toggleTrigger = (triggerId: string, enabled: boolean) => {
    setTriggerConfigs(prev => prev.map(config => 
      config.id === triggerId ? { ...config, enabled } : config
    ));
    
    toast({
      title: enabled ? "Gatilho ativado" : "Gatilho desativado",
      description: `O gatilho foi ${enabled ? 'ativado' : 'desativado'} com sucesso.`,
    });
  };

  // Toggle sistema completo
  const toggleSystem = (enabled: boolean) => {
    setSystemEnabled(enabled);
    toast({
      title: enabled ? "Sistema ativado" : "Sistema desativado",
      description: `O sistema de gatilhos foi ${enabled ? 'ativado' : 'desativado'}.`,
    });
  };

  // Filtrar usuários inativos
  const filteredUsers = inactiveUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDays = filterDays === "all" ||
                       (filterDays === "15" && user.daysInactive <= 30) ||
                       (filterDays === "30" && user.daysInactive > 30 && user.daysInactive <= 60) ||
                       (filterDays === "60" && user.daysInactive > 60 && user.daysInactive <= 90) ||
                       (filterDays === "90" && user.daysInactive > 90);
    
    return matchesSearch && matchesDays;
  });

  const getUrgencyColor = (days: number) => {
    if (days <= 30) return "text-blue-600";
    if (days <= 60) return "text-yellow-600"; 
    if (days <= 90) return "text-orange-600";
    return "text-red-600";
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 30) return { label: "Baixa", variant: "secondary" as const };
    if (days <= 60) return { label: "Média", variant: "default" as const };
    if (days <= 90) return { label: "Alta", variant: "destructive" as const };
    return { label: "Crítica", variant: "destructive" as const };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Controles Globais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações do Sistema
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={systemEnabled}
                  onCheckedChange={toggleSystem}
                />
                <span className="text-sm font-medium">
                  Sistema {systemEnabled ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <Button
                onClick={handleManualExecution}
                disabled={loading || !systemEnabled}
                variant="outline"
              >
                <Play className="h-4 w-4 mr-2" />
                {loading ? 'Executando...' : 'Executar Agora'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {triggerConfigs.filter(t => t.enabled).length}
              </div>
              <div className="text-sm text-blue-700">Gatilhos Ativos</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {triggerConfigs.reduce((acc, t) => acc + t.totalExecutions, 0)}
              </div>
              <div className="text-sm text-green-700">Total Executados</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {inactiveUsers.length}
              </div>
              <div className="text-sm text-orange-700">Usuários Inativos</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(triggerConfigs.reduce((acc, t) => acc + t.successRate, 0) / triggerConfigs.length)}%
              </div>
              <div className="text-sm text-purple-700">Taxa de Sucesso</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Gatilhos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configuração de Gatilhos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {triggerConfigs.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${config.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {config.enabled ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{config.name}</h4>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Execuções: {config.totalExecutions}</span>
                        <span>Sucesso: {config.successRate}%</span>
                        {config.lastExecuted && (
                          <span>Última: {formatDate(config.lastExecuted)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{config.days} dias</Badge>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(enabled) => toggleTrigger(config.id, enabled)}
                    disabled={!systemEnabled}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usuários Inativos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários Inativos ({filteredUsers.length})
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={filterDays}
                onChange={(e) => setFilterDays(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todos os períodos</option>
                <option value="15">Até 30 dias</option>
                <option value="30">31-60 dias</option>
                <option value="60">61-90 dias</option>
                <option value="90">90+ dias</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário inativo encontrado</p>
              <p className="text-sm">Os usuários inativos aparecerão aqui para monitoramento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const urgency = getUrgencyBadge(user.daysInactive);
                
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Último acesso: {formatDate(user.lastActivity)}</span>
                          <span>Indicações: {user.referralCount}</span>
                          <span>Status: {user.groupStatus}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getUrgencyColor(user.daysInactive)}`}>
                        {user.daysInactive} dias
                      </div>
                      <Badge variant={urgency.variant} className="text-xs">
                        {urgency.label}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Gatilhos: {user.scheduledTriggers.length}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximas Execuções Programadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Execuções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Verificação Diária</h4>
                  <p className="text-sm text-blue-700">Próxima execução automática</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-blue-900 font-medium">Hoje às 08:00</div>
                <div className="text-xs text-blue-700">Cron job ativo</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Gatilho 30 dias</span>
                </div>
                <p className="text-sm text-yellow-700">2 usuários agendados para hoje</p>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">Conversão 180 dias</span>
                </div>
                <p className="text-sm text-green-700">1 usuário para conversão amanhã</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};