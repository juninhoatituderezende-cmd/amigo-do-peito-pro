import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Bell, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  event_type: string;
  created_at: string;
  details: any;
  user_id?: string | null;
  ip_address?: unknown;
  user_agent?: string | null;
}

interface SecurityAlertProps {
  enableRealTimeAlerts?: boolean;
  showCriticalOnly?: boolean;
}

const CRITICAL_EVENTS = [
  'invalid_webhook_signature',
  'payment_amount_mismatch',
  'webhook_rate_limit_exceeded',
  'transaction_limit_exceeded',
  'deprecated_webhook_accessed'
];

export const SecurityAlert = ({ enableRealTimeAlerts = true, showCriticalOnly = false }: SecurityAlertProps) => {
  const [alerts, setAlerts] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const fetchRecentAlerts = async () => {
    try {
      setLoading(true);
      
      // Use notification_triggers as a substitute for security events
      let query = supabase
        .from('notification_triggers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching security alerts:', error);
        return;
      }

      // Transform notification triggers to security events format
      const transformedData = (data || []).map(item => ({
        id: item.id,
        event_type: item.event_type || 'notification_trigger',
        created_at: item.created_at,
        details: item.data,
        user_id: item.user_id,
        ip_address: null,
        user_agent: null
      }));

      setAlerts(transformedData);
    } catch (error) {
      console.error('Error in fetchRecentAlerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentAlerts();

    if (enableRealTimeAlerts) {
      const channel = supabase
        .channel('security-events')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notification_triggers' 
          },
          (payload) => {
            const newEvent = payload.new as SecurityEvent;
            
            // Add to alerts list
            setAlerts(prev => [newEvent, ...prev.slice(0, 9)]);
            
            // Show toast for critical events
            if (CRITICAL_EVENTS.includes(newEvent.event_type)) {
              toast.error(`Security Alert: ${getEventTitle(newEvent.event_type)}`, {
                description: `Critical security event detected at ${new Date(newEvent.created_at).toLocaleTimeString()}`,
                action: {
                  label: 'View Details',
                  onClick: () => setIsMinimized(false)
                }
              });
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [enableRealTimeAlerts, showCriticalOnly]);

  const getEventTitle = (eventType: string): string => {
    const titles: { [key: string]: string } = {
      'invalid_webhook_signature': 'Invalid Webhook Signature',
      'payment_amount_mismatch': 'Payment Amount Mismatch',
      'webhook_rate_limit_exceeded': 'Webhook Rate Limit Exceeded',
      'transaction_limit_exceeded': 'Transaction Limit Exceeded',
      'deprecated_webhook_accessed': 'Deprecated Webhook Accessed',
      'webhook_invalid_json': 'Invalid Webhook JSON',
      'referral_limit_exceeded': 'Referral Limit Exceeded',
      'payment_processed_successfully': 'Payment Processed',
      'transaction_validation': 'Transaction Validated'
    };
    
    return titles[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEventSeverity = (eventType: string): 'critical' | 'warning' | 'info' => {
    if (CRITICAL_EVENTS.includes(eventType)) {
      return 'critical';
    }
    
    const warningEvents = [
      'webhook_invalid_json',
      'referral_limit_exceeded',
      'transaction_validation'
    ];
    
    return warningEvents.includes(eventType) ? 'warning' : 'info';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'warning':
        return 'bg-accent text-accent-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <Bell className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const criticalCount = alerts.filter(alert => 
    CRITICAL_EVENTS.includes(alert.event_type)
  ).length;

  if (loading) {
    return (
      <Alert className="border-muted">
        <Shield className="h-4 w-4" />
        <AlertTitle>Security Monitor</AlertTitle>
        <AlertDescription>Loading security events...</AlertDescription>
      </Alert>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          variant={criticalCount > 0 ? "destructive" : "secondary"}
          size="sm"
          className="rounded-full"
        >
          <Shield className="h-4 w-4 mr-2" />
          Security {criticalCount > 0 && `(${criticalCount})`}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className={criticalCount > 0 ? "border-destructive" : "border-muted"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <AlertTitle>Security Monitor</AlertTitle>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} Critical
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={fetchRecentAlerts}
              variant="ghost"
              size="sm"
            >
              Refresh
            </Button>
            <Button
              onClick={() => setIsMinimized(true)}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <AlertDescription className="mt-4">
          {alerts.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No recent security events
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.map((alert) => {
                const severity = getEventSeverity(alert.event_type);
                const title = getEventTitle(alert.event_type);
                
                return (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-1 rounded ${getSeverityColor(severity)}`}>
                        {getSeverityIcon(severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium">{title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                        {alert.ip_address && (
                          <p className="text-xs text-muted-foreground">
                            IP: {String(alert.ip_address)}
                          </p>
                        )}
                        {alert.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
                              {JSON.stringify(alert.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};