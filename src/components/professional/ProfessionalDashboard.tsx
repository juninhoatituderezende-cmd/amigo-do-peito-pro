import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Camera,
  FileText,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SimpleImageUpload from "@/components/SimpleImageUpload";

interface ClientData {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_type: string;
  service_price: number;
  payment_amount: number;
  payment_status: string;
  contemplation_date: string;
  service_completed: boolean;
  created_at: string;
}

interface ProfessionalStats {
  total_clients: number;
  completed_services: number;
  pending_payments: number;
  total_earnings: number;
}

export function ProfessionalDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [stats, setStats] = useState<ProfessionalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [confirmingService, setConfirmingService] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState<string>('');
  const [afterPhoto, setAfterPhoto] = useState<string>('');
  const [serviceNotes, setServiceNotes] = useState('');

  useEffect(() => {
    loadProfessionalData();
  }, [user]);

  const loadProfessionalData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar ID do profissional
      const { data: professionalData } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!professionalData) {
        toast({
          title: "Erro",
          description: "Dados do profissional não encontrados.",
          variant: "destructive",
        });
        return;
      }

      // Carregar serviços/clientes atribuídos (usando transações como proxy)
      const { data: clientsData } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          status,
          description,
          created_at,
          user_id,
          service_id
        `)
        .eq('professional_id', professionalData.id)
        .order('created_at', { ascending: false });

      if (clientsData) {
        const formattedClients: ClientData[] = clientsData.map(client => ({
          id: client.id,
          client_name: `Cliente ${client.user_id.slice(-4)}`,
          client_email: 'contato@example.com',
          client_phone: '(11) 99999-9999',
          service_type: client.description || 'Serviço',
          service_price: client.amount,
          payment_amount: client.amount * 0.7, // 70% do valor para o profissional
          payment_status: client.status,
          contemplation_date: client.created_at,
          service_completed: client.status === 'completed',
          created_at: client.created_at
        }));

        setClients(formattedClients);

        // Calcular estatísticas
        const totalClients = formattedClients.length;
        const completedServices = formattedClients.filter(c => c.service_completed).length;
        const pendingPayments = formattedClients.filter(c => c.payment_status === 'pendente').length;
        const totalEarnings = formattedClients
          .filter(c => c.payment_status === 'pago')
          .reduce((sum, c) => sum + c.payment_amount, 0);

        setStats({
          total_clients: totalClients,
          completed_services: completedServices,
          pending_payments: pendingPayments,
          total_earnings: totalEarnings
        });
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar seus dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmServiceCompletion = async () => {
    if (!selectedClient) return;

    setConfirmingService(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          description: `${selectedClient.service_type} - Concluído. Notas: ${serviceNotes || 'Nenhuma observação'}`
        })
        .eq('id', selectedClient.id);

      if (error) throw error;

      toast({
        title: "Serviço confirmado!",
        description: "O serviço foi marcado como concluído.",
      });

      setSelectedClient(null);
      setBeforePhoto('');
      setAfterPhoto('');
      setServiceNotes('');
      loadProfessionalData();

    } catch (error) {
      console.error('Erro ao confirmar serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar conclusão do serviço.",
        variant: "destructive",
      });
    } finally {
      setConfirmingService(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string, completed: boolean) => {
    if (completed) {
      return <Badge variant="default">Concluído</Badge>;
    }
    
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary">Aguardando Serviço</Badge>;
      case 'liberado':
        return <Badge variant="outline">Pronto para Atender</Badge>;
      case 'pago':
        return <Badge variant="default">Pago</Badge>;
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard do Profissional</h2>
        <p className="text-muted-foreground">
          Gerencie seus clientes e serviços
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_clients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed_services}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending_payments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.total_earnings)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Clientes</CardTitle>
          <CardDescription>
            Clientes atribuídos a você e status dos serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum cliente atribuído ainda. Aguarde novas contemplações.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.client_name}</p>
                        <p className="text-sm text-muted-foreground">{client.client_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{client.service_type}</TableCell>
                    <TableCell>{formatCurrency(client.payment_amount)}</TableCell>
                    <TableCell>
                      {getStatusBadge(client.payment_status, client.service_completed)}
                    </TableCell>
                    <TableCell>{formatDate(client.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${client.client_phone}`)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`mailto:${client.client_email}`)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        
                        {!client.service_completed && client.payment_status === 'liberado' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                onClick={() => setSelectedClient(client)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirmar Serviço
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Confirmar Conclusão do Serviço</DialogTitle>
                                <DialogDescription>
                                  Marque este serviço como concluído para {client.client_name}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Foto Antes (Opcional)</label>
                                  <SimpleImageUpload onUpload={setBeforePhoto} />
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Foto Depois (Opcional)</label>
                                  <SimpleImageUpload onUpload={setAfterPhoto} />
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Observações</label>
                                  <textarea
                                    className="w-full mt-1 p-2 border rounded-md"
                                    rows={3}
                                    value={serviceNotes}
                                    onChange={(e) => setServiceNotes(e.target.value)}
                                    placeholder="Observações sobre o serviço..."
                                  />
                                </div>
                                
                                <Button 
                                  onClick={confirmServiceCompletion}
                                  disabled={confirmingService}
                                  className="w-full"
                                >
                                  {confirmingService ? 'Confirmando...' : 'Confirmar Conclusão'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}