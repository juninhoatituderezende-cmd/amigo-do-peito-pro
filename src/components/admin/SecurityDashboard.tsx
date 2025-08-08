import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, Eye, UserX, Activity } from 'lucide-react';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string | null;
  ip_address?: unknown;
  user_agent?: string | null;
  details: any;
  created_at: string;
}

export const SecurityDashboard: React.FC = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityEvents();
  }, []);

  const loadSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSecurityEvents(data || []);
    } catch (error) {
      console.error('Error loading security events:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar eventos de segurança",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'invalid_webhook_signature':
      case 'payment_amount_mismatch':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'referral_limit_exceeded':
        return <UserX className="h-4 w-4 text-orange-500" />;
      case 'payment_processed_successfully':
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getEventSeverity = (eventType: string) => {
    const criticalEvents = ['invalid_webhook_signature', 'payment_amount_mismatch'];
    const warningEvents = ['referral_limit_exceeded', 'webhook_processing_error'];
    
    if (criticalEvents.includes(eventType)) return 'critical';
    if (warningEvents.includes(eventType)) return 'warning';
    return 'info';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const criticalEvents = securityEvents.filter(e => getEventSeverity(e.event_type) === 'critical');
  const warningEvents = securityEvents.filter(e => getEventSeverity(e.event_type) === 'warning');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Dashboard de Segurança
        </h2>
        <Button onClick={loadSecurityEvents} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Eventos Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalEvents.length}</div>
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600">Avisos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{warningEvents.length}</div>
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Total de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{securityEvents.length}</div>
            <p className="text-xs text-muted-foreground">Últimos 50 eventos</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalEvents.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atenção:</strong> {criticalEvents.length} evento(s) crítico(s) de segurança detectado(s). 
            Revise imediatamente os eventos abaixo.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Eventos de Segurança Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum evento de segurança registrado
              </p>
            ) : (
              securityEvents.map((event) => {
                const severity = getEventSeverity(event.event_type);
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-4 border rounded-lg bg-card"
                  >
                    {getEventIcon(event.event_type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {formatEventType(event.event_type)}
                        </span>
                        <Badge className={getSeverityColor(severity)}>
                          {severity}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          <strong>Data:</strong> {new Date(event.created_at).toLocaleString('pt-BR')}
                        </div>
                        {event.ip_address && (
                          <div>
                            <strong>IP:</strong> {String(event.ip_address)}
                          </div>
                        )}
                        {event.details && Object.keys(event.details).length > 0 && (
                          <div>
                            <strong>Detalhes:</strong> {JSON.stringify(event.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};