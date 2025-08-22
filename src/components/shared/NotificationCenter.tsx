import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotifications, NotificationType } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  CreditCard, 
  Users, 
  DollarSign, 
  Settings,
  Check, 
  X, 
  Eye, 
  EyeOff,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCheck
} from 'lucide-react';

const NotificationTypeIcons = {
  pagamento: CreditCard,
  grupo_mlm: Users,
  comissao: DollarSign,
  sistema: Settings
};

const NotificationTypeColors = {
  pagamento: 'bg-green-100 text-green-700',
  grupo_mlm: 'bg-blue-100 text-blue-700',
  comissao: 'bg-yellow-100 text-yellow-700',
  sistema: 'bg-purple-100 text-purple-700'
};

const NotificationTypeLabels = {
  pagamento: 'Pagamento',
  grupo_mlm: 'Grupo MLM',
  comissao: 'Comissão',
  sistema: 'Sistema'
};

interface NotificationItemProps {
  notification: any;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onPerformAction: (id: string, action: string) => void;
}

const NotificationItem = ({ notification, onMarkAsRead, onMarkAsUnread, onPerformAction }: NotificationItemProps) => {
  const IconComponent = NotificationTypeIcons[notification.type];
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { 
    addSuffix: true, 
    locale: ptBR 
  });

  return (
    <div className={`p-4 border-l-4 ${notification.read ? 'border-gray-200 bg-gray-50' : 'border-primary bg-primary/5'} rounded-lg`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full ${NotificationTypeColors[notification.type]}`}>
          <IconComponent className="h-4 w-4" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                {notification.title}
              </h4>
              <Badge variant="secondary" className="text-xs">
                {NotificationTypeLabels[notification.type]}
              </Badge>
              {!notification.read && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {notification.actions?.map((action: string) => (
                <Button
                  key={action}
                  size="sm"
                  variant={action === 'aceitar' ? 'default' : 'outline'}
                  onClick={() => onPerformAction(notification.id, action)}
                  className="h-7 text-xs"
                >
                  {action === 'aceitar' && <Check className="h-3 w-3 mr-1" />}
                  {action === 'recusar' && <X className="h-3 w-3 mr-1" />}
                  {action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')}
                </Button>
              ))}
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => notification.read ? onMarkAsUnread(notification.id) : onMarkAsRead(notification.id)}
              className="h-7 w-7 p-0"
            >
              {notification.read ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    loading,
    currentPage,
    totalPages,
    hasNextPage,
    selectedType,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    setSelectedType,
    nextPage,
    prevPage,
    refresh,
    performAction
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filterTypes: Array<{ value: NotificationType | 'all'; label: string; count?: number }> = [
    { value: 'all', label: 'Todas' },
    { value: 'pagamento', label: 'Pagamentos' },
    { value: 'grupo_mlm', label: 'Grupos MLM' },
    { value: 'comissao', label: 'Comissões' },
    { value: 'sistema', label: 'Sistema' }
  ];

  if (loading && notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Central de Notificações
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-2 py-1">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filter Tabs */}
        <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as NotificationType | 'all')}>
          <TabsList className="grid w-full grid-cols-5">
            {filterTypes.map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="text-sm">
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">
                  Nenhuma notificação encontrada
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedType === 'all' ? 
                    'Você não tem notificações no momento.' : 
                    `Não há notificações do tipo ${NotificationTypeLabels[selectedType as NotificationType]}.`
                  }
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onMarkAsUnread={markAsUnread}
                  onPerformAction={performAction}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={nextPage}
                disabled={!hasNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};