import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, CheckCircle, XCircle, Clock, Settings, Edit, Trash2 } from 'lucide-react';

interface Participant {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  serviceType: string;
  status: string;
  paymentStatus: string;
  contemplationStatus: string;
  joinDate: string;
  contemplationDate?: string | null;
}

export function AdminManagementPanel() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      // Carregar participantes dos planos
      const { data: participantsData, error } = await supabase
        .from('group_participants')
        .select('*')
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Carregar dados de usuários separadamente (usando profiles em vez de users)
      const userIds = participantsData?.map(p => p.user_id) || [];
      const { data: usersData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone')
        .in('user_id', userIds);

      // Carregar dados de grupos separadamente
      const groupIds = participantsData?.map(p => p.group_id) || [];
      const { data: groupsData } = await supabase
        .from('plan_groups')
        .select('id')
        .in('id', groupIds);

      // Transformar dados para o formato esperado
      const transformedParticipants = (participantsData || []).map(participant => {
        const user = usersData?.find(u => u.user_id === participant.user_id);
        const group = groupsData?.find(g => g.id === participant.group_id);
        
        return {
          id: participant.id,
          nome: user?.full_name || 'N/A',
          email: user?.email || 'N/A', 
          telefone: user?.phone || 'N/A',
          serviceType: 'Plano MLM',
          status: participant.status === 'active' ? 'Ativo' : 'Pendente',
          paymentStatus: participant.status || 'pending',
          contemplationStatus: 'aguardando',
          joinDate: participant.joined_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          contemplationDate: null
        };
      });

      setParticipants(transformedParticipants);
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar participantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContemplation = async (participantId: string, newStatus: string) => {
    try {
      // Atualizar no Supabase
      const { error } = await supabase
        .from('group_participants')
        .update({
          status: newStatus === 'contemplado' ? 'contemplated' : 'active'
        })
        .eq('id', participantId);

      if (error) throw error;

      // Atualizar estado local
      setParticipants(prev => prev.map(p => 
        p.id === participantId 
          ? { 
              ...p, 
              contemplationStatus: newStatus, 
              contemplationDate: newStatus === 'contemplado' ? new Date().toISOString().split('T')[0] : null 
            }
          : p
      ));

      // Se contemplado, criar registro na tabela contemplations
      if (newStatus === 'contemplado') {
        const participant = participants.find(p => p.id === participantId);
        if (participant) {
          // Log the contemplation (since we don't have a contemplations table)
          console.log(`Participant ${participant.nome} was contemplated`);
        }
      }

      toast({
        title: "Sucesso",
        description: "Status de contemplação atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar contemplação:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status de contemplação.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    try {
      // Remover do Supabase
      const { error } = await supabase
        .from('group_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      // Atualizar estado local
      setParticipants(prev => prev.filter(p => p.id !== participantId));

      toast({
        title: "Sucesso",
        description: "Participante removido com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao remover participante:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover participante.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'contemplado':
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Contemplado</Badge>;
      case 'aguardando':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Aguardando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
        <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Participantes</h2>
        <Button onClick={loadParticipants}>
          <Settings className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="participants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="contemplation">Contemplação</TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Lista de Participantes
              </CardTitle>
              <CardDescription>
                Gerencie todos os participantes dos planos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Contemplação</TableHead>
                    <TableHead>Data Inscrição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">{participant.nome}</TableCell>
                      <TableCell>{participant.email}</TableCell>
                      <TableCell>{participant.telefone}</TableCell>
                      <TableCell>{participant.serviceType}</TableCell>
                      <TableCell>{getStatusBadge(participant.paymentStatus)}</TableCell>
                      <TableCell>{getStatusBadge(participant.contemplationStatus)}</TableCell>
                      <TableCell>{new Date(participant.joinDate).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedParticipant(participant);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteParticipant(participant.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contemplation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Contemplação</CardTitle>
              <CardDescription>
                Gerencie o status de contemplação dos participantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {participants.filter(p => p.paymentStatus === 'paid').map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{participant.nome}</p>
                    <p className="text-sm text-muted-foreground">{participant.serviceType}</p>
                    <p className="text-sm">Status: {getStatusBadge(participant.contemplationStatus)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateContemplation(participant.id, 'contemplado')}
                      disabled={participant.contemplationStatus === 'contemplado'}
                    >
                      Contemplar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateContemplation(participant.id, 'aguardando')}
                      disabled={participant.contemplationStatus === 'aguardando'}
                    >
                      Reverter
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Participante</DialogTitle>
            <DialogDescription>
              Atualize as informações do participante
            </DialogDescription>
          </DialogHeader>
          {selectedParticipant && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" defaultValue={selectedParticipant.nome} />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" defaultValue={selectedParticipant.email} />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" defaultValue={selectedParticipant.telefone} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}