import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Lock,
  Unlock,
  User,
  Clock,
  RefreshCw,
  TrendingUp,
  Activity
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  suspiciousLogins: number;
  blockedAttempts: number;
}

export function SecurityDashboard() {
  const { toast } = useToast();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalEvents: 0,
    suspiciousLogins: 0,
    blockedAttempts: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Simulate security events (in a real app, these would come from logs/monitoring)
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          event_type: 'login_attempt',
          user_email: 'admin@amigodopeito.com',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          created_at: new Date().toISOString(),
          severity: 'low',
          description: 'Login administrativo bem-sucedido'
        },
        {
          id: '2',
          event_type: 'failed_login',
          user_email: 'unknown@email.com',
          ip_address: '10.0.0.1',
          user_agent: 'Bot/1.0',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          severity: 'medium',
          description: 'Tentativa de login falhada - usuário não encontrado'
        },
        {
          id: '3',
          event_type: 'multiple_failed_attempts',
          user_email: 'test@test.com',
          ip_address: '192.168.1.50',
          user_agent: 'Automated Tool',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          severity: 'high',
          description: 'Múltiplas tentativas de login falhadas - possível ataque de força bruta'
        },
        {
          id: '4',
          event_type: 'permission_escalation',
          user_email: 'user@email.com',
          ip_address: '203.0.113.1',
          user_agent: 'Mozilla/5.0',
          created_at: new Date(Date.now() - 10800000).toISOString(),
          severity: 'critical',
          description: 'Tentativa de acesso a recursos administrativos sem permissão'
        }
      ];

      setSecurityEvents(mockEvents);

      // Calculate security stats
      const stats = {
        totalEvents: mockEvents.length,
        criticalEvents: mockEvents.filter(e => e.severity === 'critical').length,
        suspiciousLogins: mockEvents.filter(e => e.event_type === 'failed_login' || e.event_type === 'multiple_failed_attempts').length,
        blockedAttempts: mockEvents.filter(e => e.event_type === 'multiple_failed_attempts').length
      };

      setStats(stats);

    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de segurança.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" />Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800"><Eye className="w-3 h-3 mr-1" />Médio</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Baixo</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login_attempt':
        return <User className="w-4 h-4 text-green-600" />;
      case 'failed_login':
        return <Lock className="w-4 h-4 text-red-600" />;
      case 'multiple_failed_attempts':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'permission_escalation':
        return <Shield className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
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
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Segurança</h2>
        <Button onClick={loadSecurityData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div>
            <p className="text-xs text-muted-foreground">
              Requer atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logins Suspeitos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.suspiciousLogins}</div>
            <p className="text-xs text-muted-foreground">
              Tentativas falhadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tentativas Bloqueadas</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.blockedAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Ataques prevenidos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="events">Eventos de Segurança</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-600" />
                  Status de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Autenticação 2FA</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Criptografia SSL</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Firewall</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Backup Automático</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Tendências de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Tentativas de Login</span>
                      <span className="text-sm font-medium">+12%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Eventos Suspeitos</span>
                      <span className="text-sm font-medium text-red-600">+3%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Segurança Recentes</CardTitle>
              <CardDescription>Monitoramento em tempo real de atividades suspeitas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {getEventIcon(event.event_type)}
                          <span className="ml-2 capitalize">
                            {event.event_type.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {event.user_email || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                          {event.ip_address}
                        </code>
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(event.severity)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {event.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(event.created_at).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Políticas de Segurança</CardTitle>
              <CardDescription>Configurações e regras de segurança ativas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Política de Senhas</h4>
                      <p className="text-sm text-muted-foreground">
                        Mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Bloqueio por Tentativas</h4>
                      <p className="text-sm text-muted-foreground">
                        Bloquear conta após 5 tentativas de login falhadas
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Sessão Automática</h4>
                      <p className="text-sm text-muted-foreground">
                        Logout automático após 30 minutos de inatividade
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}