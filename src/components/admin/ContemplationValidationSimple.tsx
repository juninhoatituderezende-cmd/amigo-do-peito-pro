import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Award, CheckCircle, Clock, Users } from 'lucide-react';

interface GroupParticipant {
  id: string;
  user_id: string;
  group_id: string;
  amount_paid: number;
  status: string;
  joined_at: string;
  user_name?: string;
  user_email?: string;
}

export function ContemplationValidationSimple() {
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      // Load group participants
      const { data: participantsData, error } = await supabase
        .from('group_participants')
        .select('*')
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Load user details for each participant
      const userIds = participantsData?.map(p => p.user_id) || [];
      const { data: usersData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      // Combine the data
      const enrichedParticipants = (participantsData || []).map(participant => ({
        ...participant,
        user_name: usersData?.find(u => u.user_id === participant.user_id)?.full_name || 'N/A',
        user_email: usersData?.find(u => u.user_id === participant.user_id)?.email || 'N/A'
      }));

      setParticipants(enrichedParticipants);
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar participantes para contemplação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContemplation = async (participantId: string, action: 'contemplate' | 'remove') => {
    try {
      const newStatus = action === 'contemplate' ? 'contemplated' : 'active';
      
      const { error } = await supabase
        .from('group_participants')
        .update({ status: newStatus })
        .eq('id', participantId);

      if (error) throw error;

      setParticipants(prev => 
        prev.map(p => 
          p.id === participantId ? { ...p, status: newStatus } : p
        )
      );

      toast({
        title: "Sucesso",
        description: `Participante ${action === 'contemplate' ? 'contemplado' : 'reativado'} com sucesso.`,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'contemplated':
        return <Badge className="bg-blue-500"><Award className="w-3 h-3 mr-1" />Contemplado</Badge>;
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
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
        <h2 className="text-3xl font-bold tracking-tight">Validação de Contemplação</h2>
        <Button onClick={loadParticipants}>
          <Users className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-5 w-5" />
            Participantes Elegíveis
          </CardTitle>
          <CardDescription>
            Gerencie as contemplações dos participantes dos grupos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Ingresso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">{participant.user_name}</TableCell>
                  <TableCell>{participant.user_email}</TableCell>
                  <TableCell>R$ {participant.amount_paid.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(participant.status)}</TableCell>
                  <TableCell>{new Date(participant.joined_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {participant.status !== 'contemplated' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContemplation(participant.id, 'contemplate')}
                        >
                          <Award className="h-4 w-4 mr-1" />
                          Contemplar
                        </Button>
                      )}
                      {participant.status === 'contemplated' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContemplation(participant.id, 'remove')}
                        >
                          Reverter
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}