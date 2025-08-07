import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Upload, 
  Filter, 
  Calendar, 
  User, 
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SimpleImageUpload from "@/components/SimpleImageUpload";

interface ProfessionalPayment {
  id: string;
  professional_id: string;
  client_id: string;
  contemplation_id: string;
  service_type: string;
  total_service_value: number;
  professional_amount: number;
  status: 'pending' | 'awaiting_validation' | 'released' | 'paid';
  release_date: string | null;
  payment_date: string | null;
  payment_proof_url: string | null;
  created_at: string;
  professional_name?: string;
  client_name?: string;
}

interface InfluencerCommission {
  id: string;
  influencer_id: string;
  client_id: string;
  referral_code: string;
  entry_value: number;
  commission_percentage: number;
  commission_amount: number;
  status: 'pending' | 'paid';
  payment_date: string | null;
  payment_proof_url: string | null;
  created_at: string;
  influencer_name?: string;
  client_name?: string;
}

interface PaymentLog {
  id: string;
  payment_type: 'professional' | 'influencer';
  payment_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  amount: number | null;
  user_id: string | null;
  admin_id: string | null;
  notes: string | null;
  created_at: string;
  user_name?: string;
  client_name?: string;
}

export const PaymentManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("professional");
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [dateFilter, setDateFilter] = useState("30");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  
  // Estados dos dados
  const [professionalPayments, setProfessionalPayments] = useState<ProfessionalPayment[]>([]);
  const [influencerCommissions, setInfluencerCommissions] = useState<InfluencerCommission[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  
  // Estados dos modais
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");

  // Carregar dados do banco
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProfessionalPayments(),
        loadInfluencerCommissions(),
        loadPaymentLogs()
      ]);
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de pagamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfessionalPayments = async () => {
    // Since pagamentos_profissionais table doesn't exist, use transactions for professional payments
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *
      `)
      .eq('type', 'professional_payment')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading professional payments:', error);
      return;
    }

    const paymentsWithNames = data?.map(payment => ({
      id: payment.id,
      professional_id: payment.professional_id || 'N/A',
      client_id: payment.user_id,
      contemplation_id: payment.id,
      service_type: payment.description,
      total_service_value: payment.amount,
      paid_amount: payment.amount,
      payment_status: payment.status,
      created_at: payment.created_at,
      professional_name: 'Profissional',
      client_name: 'Cliente'
    })) || [];

    setProfessionalPayments(paymentsWithNames as any);
  };

  const loadInfluencerCommissions = async () => {
    // Use credit_transactions for influencer commissions since comissoes_influenciadores doesn't exist
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('type', 'influencer_commission')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading influencer commissions:', error);
      return;
    }

    const commissionsWithNames = data?.map(commission => ({
      id: commission.id,
      influencer_id: commission.user_id,
      client_id: commission.user_id,
      referral_code: commission.related_order_id || 'REF001',
      entry_value: commission.amount,
      commission_value: commission.amount * 0.25,
      commission_percentage: 25,
      payment_status: 'pending',
      created_at: commission.created_at,
      influencer_name: 'Influenciador',
      client_name: 'Cliente'
    })) || [];

    setInfluencerCommissions(commissionsWithNames as any);
  };

  const loadPaymentLogs = async () => {
    // Use transactions as payment logs since payment_logs doesn't exist
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading payment logs:', error);
      return;
    }

    const logsWithNames = data?.map(log => ({
      id: log.id,
      payment_type: 'professional' as const,
      payment_id: log.id,
      action: 'created',
      old_status: 'pending',
      new_status: log.status,
      amount: log.amount,
      user_id: log.user_id,
      admin_id: 'admin',
      notes: null,
      created_at: log.created_at,
      user_name: 'Usuário',
      client_name: 'Cliente'
    })) || [];

    setPaymentLogs(logsWithNames as any);
  };

  const markAsPaid = async (paymentType: 'professional' | 'influencer', paymentId: string, proofUrl: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const table = paymentType === 'professional' ? 'transactions' : 'credit_transactions';
      
      const { error } = await supabase
        .from(table)
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Pagamento confirmado",
        description: "Pagamento marcado como pago com sucesso.",
      });

      // Recarregar dados
      loadAllData();
      setProofDialogOpen(false);
      setProofUrl("");
      setSelectedPayment(null);

    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar pagamento como pago.",
        variant: "destructive",
      });
    }
  };

  const releaseProfessionalPayment = async (paymentId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Pagamento liberado",
        description: "Pagamento liberado para o profissional.",
      });

      loadAllData();

    } catch (error) {
      console.error('Error releasing payment:', error);
      toast({
        title: "Erro",
        description: "Erro ao liberar pagamento.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      awaiting_validation: { label: "Aguardando Validação", variant: "outline" as const },
      released: { label: "Liberado", variant: "default" as const },
      paid: { label: "Pago", variant: "default" as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    
    return (
      <Badge variant={statusInfo.variant} className={status === 'paid' ? 'bg-green-100 text-green-800' : ''}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Filtros aplicados
  const getDateThreshold = () => {
    const days = parseInt(dateFilter);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);
    return threshold;
  };

  const filteredProfessionalPayments = professionalPayments.filter(payment => {
    const dateMatch = new Date(payment.created_at) >= getDateThreshold();
    const statusMatch = statusFilter === 'all' || payment.status === statusFilter;
    const userMatch = !userFilter || 
      payment.professional_name?.toLowerCase().includes(userFilter.toLowerCase()) ||
      payment.client_name?.toLowerCase().includes(userFilter.toLowerCase());
    
    return dateMatch && statusMatch && userMatch;
  });

  const filteredInfluencerCommissions = influencerCommissions.filter(commission => {
    const dateMatch = new Date(commission.created_at) >= getDateThreshold();
    const statusMatch = statusFilter === 'all' || commission.status === statusFilter;
    const userMatch = !userFilter || 
      commission.influencer_name?.toLowerCase().includes(userFilter.toLowerCase()) ||
      commission.client_name?.toLowerCase().includes(userFilter.toLowerCase());
    
    return dateMatch && statusMatch && userMatch;
  });

  const filteredPaymentLogs = paymentLogs.filter(log => {
    const dateMatch = new Date(log.created_at) >= getDateThreshold();
    const userMatch = !userFilter || 
      log.user_name?.toLowerCase().includes(userFilter.toLowerCase()) ||
      log.client_name?.toLowerCase().includes(userFilter.toLowerCase());
    
    return dateMatch && userMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Pagamentos</h2>
          <p className="text-gray-600">Administre repasses e comissões da plataforma</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="awaiting_validation">Aguardando</SelectItem>
              <SelectItem value="released">Liberado</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Buscar usuário..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-[200px]"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Repasses Profissionais
          </TabsTrigger>
          <TabsTrigger value="influencer" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Comissões Influenciadores
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: PAGAMENTOS PROFISSIONAIS */}
        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Repasses a Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo de Serviço</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Valor Repasse</TableHead>
                      <TableHead>Data Liberação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">Carregando...</TableCell>
                      </TableRow>
                    ) : filteredProfessionalPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">Nenhum pagamento encontrado</TableCell>
                      </TableRow>
                    ) : (
                      filteredProfessionalPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.professional_name}</TableCell>
                          <TableCell>{payment.client_name}</TableCell>
                          <TableCell>{payment.service_type}</TableCell>
                          <TableCell>{formatCurrency(payment.total_service_value)}</TableCell>
                          <TableCell>{formatCurrency(payment.professional_amount)}</TableCell>
                          <TableCell>
                            {payment.release_date ? formatDate(payment.release_date) : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {payment.status === 'awaiting_validation' && (
                                <Button
                                  size="sm"
                                  onClick={() => releaseProfessionalPayment(payment.id)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Liberar
                                </Button>
                              )}
                              {payment.status === 'released' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayment({ ...payment, type: 'professional' });
                                    setProofDialogOpen(true);
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Marcar Pago
                                </Button>
                              )}
                              {payment.payment_proof_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(payment.payment_proof_url!, '_blank')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: COMISSÕES INFLUENCIADORES */}
        <TabsContent value="influencer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Comissões de Influenciadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Influenciador</TableHead>
                      <TableHead>Cliente Indicado</TableHead>
                      <TableHead>Valor da Entrada</TableHead>
                      <TableHead>Valor Comissionado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
                      </TableRow>
                    ) : filteredInfluencerCommissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Nenhuma comissão encontrada</TableCell>
                      </TableRow>
                    ) : (
                      filteredInfluencerCommissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">{commission.influencer_name}</TableCell>
                          <TableCell>{commission.client_name}</TableCell>
                          <TableCell>{formatCurrency(commission.entry_value)}</TableCell>
                          <TableCell>{formatCurrency(commission.commission_amount)}</TableCell>
                          <TableCell>{getStatusBadge(commission.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {commission.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayment({ ...commission, type: 'influencer' });
                                    setProofDialogOpen(true);
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Marcar Pago
                                </Button>
                              )}
                              {commission.payment_proof_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(commission.payment_proof_url!, '_blank')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: LOGS DE AUDITORIA */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Auditoria de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Status Anterior</TableHead>
                      <TableHead>Status Novo</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
                      </TableRow>
                    ) : filteredPaymentLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">Nenhum log encontrado</TableCell>
                      </TableRow>
                    ) : (
                      filteredPaymentLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {log.payment_type === 'professional' ? 'Profissional' : 'Influenciador'}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.user_name || log.client_name || 'N/A'}</TableCell>
                          <TableCell>
                            {log.amount ? formatCurrency(log.amount) : '-'}
                          </TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.old_status || '-'}</TableCell>
                          <TableCell>{log.new_status || '-'}</TableCell>
                          <TableCell>{formatDate(log.created_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para upload de comprovante */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Pago</DialogTitle>
            <DialogDescription>
              Faça upload do comprovante de pagamento para marcar como pago.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="proof">Comprovante de Pagamento</Label>
              <SimpleImageUpload
                onUpload={(url) => setProofUrl(url)}
                label="Clique para fazer upload do comprovante"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setProofDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (selectedPayment && proofUrl) {
                    markAsPaid(selectedPayment.type, selectedPayment.id, proofUrl);
                  }
                }}
                disabled={!proofUrl}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};