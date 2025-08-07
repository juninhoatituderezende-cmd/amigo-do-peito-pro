import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationTriggersManager } from "@/components/admin/NotificationTriggersManager";
import { MaterialUploadPanel } from "@/components/admin/MaterialUploadPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Upload, 
  Send, 
  Users,
  Mail,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminNotificacoes() {
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all'
  });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) {
      toast({
        title: "Erro",
        description: "Preencha título e mensagem.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);

      // Buscar usuários baseado no target
      let userQuery = supabase.from('users').select('id');
      
      if (broadcastForm.target === 'professionals') {
        const { data: professionals } = await supabase
          .from('professionals')
          .select('user_id');
        const profIds = professionals?.map(p => p.user_id) || [];
        userQuery = userQuery.in('id', profIds);
      } else if (broadcastForm.target === 'influencers') {
        const { data: influencers } = await supabase
          .from('influencers')
          .select('user_id');
        const infIds = influencers?.map(i => i.user_id) || [];
        userQuery = userQuery.in('id', infIds);
      }

      const { data: targetUsers } = await userQuery;

      if (!targetUsers || targetUsers.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum usuário encontrado para o público selecionado.",
          variant: "destructive",
        });
        return;
      }

      // Criar notificações para todos os usuários alvo
      const notifications = targetUsers.map(user => ({
        user_id: user.id,
        title: broadcastForm.title,
        message: broadcastForm.message,
        type: broadcastForm.type,
        category: 'admin_broadcast'
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: "Notificação enviada!",
        description: `Notificação enviada para ${targetUsers.length} usuários.`,
      });

      // Reset form
      setBroadcastForm({
        title: '',
        message: '',
        type: 'info',
        target: 'all'
      });

    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar notificação.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Centro de Notificações</h1>
        <p className="text-muted-foreground">
          Gerencie notificações automáticas, materiais e comunicação com usuários
        </p>
      </div>

      <Tabs defaultValue="triggers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Triggers Automáticos
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Materiais
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Notificação Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="triggers">
          <NotificationTriggersManager />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialUploadPanel />
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Enviar Notificação Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Notificação</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Nova funcionalidade disponível"
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Público Alvo</Label>
                  <Select value={broadcastForm.target} onValueChange={(value) => setBroadcastForm(prev => ({ ...prev, target: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o público" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      <SelectItem value="professionals">Apenas profissionais</SelectItem>
                      <SelectItem value="influencers">Apenas influenciadores</SelectItem>
                      <SelectItem value="users">Apenas usuários comuns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Digite a mensagem que será enviada para todos os usuários..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo da Notificação</Label>
                <Select value={broadcastForm.type} onValueChange={(value) => setBroadcastForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleBroadcast} disabled={sending}>
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Enviando...' : 'Enviar Notificação'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setBroadcastForm({ title: '', message: '', type: 'info', target: 'all' })}
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {(broadcastForm.title || broadcastForm.message) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview da Notificação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-muted/10">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      broadcastForm.type === 'success' ? 'bg-green-100' :
                      broadcastForm.type === 'warning' ? 'bg-yellow-100' :
                      broadcastForm.type === 'error' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      <Bell className={`h-4 w-4 ${
                        broadcastForm.type === 'success' ? 'text-green-600' :
                        broadcastForm.type === 'warning' ? 'text-yellow-600' :
                        broadcastForm.type === 'error' ? 'text-red-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{broadcastForm.title || 'Título da notificação'}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {broadcastForm.message || 'Mensagem da notificação aparecerá aqui...'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Agora mesmo
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}