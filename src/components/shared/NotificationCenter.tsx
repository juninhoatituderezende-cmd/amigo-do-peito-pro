import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Check, X, Info, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Nova Indicação Convertida!",
    message: "Sua indicação Maria Silva se inscreveu no Grupo Fechamento Braço #1. Você ganhou R$ 400 de comissão!",
    type: "success",
    read: false,
    createdAt: "2024-01-25T10:30:00Z",
    actionUrl: "/influenciador/dashboard",
    actionText: "Ver Dashboard"
  },
  {
    id: "2",
    title: "Grupo Quase Cheio",
    message: "O Grupo Prótese Dental #2 está com 8/10 vagas preenchidas. Em breve será realizado o sorteio!",
    type: "info",
    read: false,
    createdAt: "2024-01-24T16:45:00Z"
  },
  {
    id: "3",
    title: "Saque Processado",
    message: "Seu saque de R$ 2.500 via PIX foi processado com sucesso!",
    type: "success",
    read: true,
    createdAt: "2024-01-23T14:20:00Z"
  },
  {
    id: "4",
    title: "Novo Material Disponível",
    message: "Novos banners e templates foram adicionados aos seus materiais promocionais.",
    type: "info",
    read: true,
    createdAt: "2024-01-22T09:15:00Z",
    actionUrl: "/influenciador/ferramentas",
    actionText: "Ver Materiais"
  },
  {
    id: "5",
    title: "Conquista Desbloqueada!",
    message: "Parabéns! Você desbloqueou a conquista 'Indicador Bronze' e ganhou R$ 200 de bônus!",
    type: "success",
    read: true,
    createdAt: "2024-01-21T11:30:00Z"
  }
];

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    toast({
      title: "Notificações marcadas como lidas",
      description: "Todas as notificações foram marcadas como lidas.",
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({
      title: "Notificação removida",
      description: "A notificação foi removida com sucesso.",
    });
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return CheckCircle;
      case "warning": return AlertCircle;
      case "error": return AlertCircle;
      default: return Info;
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "success": return "text-green-600";
      case "warning": return "text-yellow-600";
      case "error": return "text-red-600";
      default: return "text-blue-600";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Agora mesmo";
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInHours < 48) return "Ontem";
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                Todas
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unread")}
              >
                Não lidas ({unreadCount})
              </Button>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {filter === "unread" 
                  ? "Nenhuma notificação não lida" 
                  : "Nenhuma notificação"
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const IconComponent = getIcon(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    !notification.read ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${getTypeColor(notification.type)}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`font-medium ${!notification.read ? "text-blue-900" : ""}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.createdAt)}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        {notification.actionUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = notification.actionUrl!}
                          >
                            {notification.actionText || "Ver mais"}
                          </Button>
                        )}
                        
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Marcar como lida
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};