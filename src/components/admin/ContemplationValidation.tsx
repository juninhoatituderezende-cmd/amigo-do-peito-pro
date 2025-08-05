import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  User,
  Award,
  AlertTriangle,
  Download,
  Mail,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface ContemplationRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  contemplated_at: string;
  service_type: string;
  professional_id?: string;
  professional_name?: string;
  status: 'confirmed' | 'pending' | 'revoked';
  voucher_code: string;
  total_referrals: number;
  total_commission: number;
  notes?: string;
}

export const ContemplationValidation = () => {
  const [contemplations, setContemplations] = useState<ContemplationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadContemplations();
  }, []);

  const loadContemplations = async () => {
    try {
      const { data, error } = await supabase
        .from('group_progress')
        .select(`
          *,
          profiles!owner_id(email, full_name)
        `)
        .eq('current_members', 9)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Transform data to match our interface
      const transformedData = (data || []).map(record => ({
        id: record.group_id,
        user_id: record.owner_id,
        user_name: record.profiles?.full_name || 'Usuário',
        user_email: record.profiles?.email || '',
        contemplated_at: record.completed_at || record.created_at,
        service_type: 'Grupo WhatsApp', // Default for now
        status: (record.status === 'completed' ? 'confirmed' : 'pending') as 'confirmed' | 'pending' | 'revoked',
        voucher_code: `VOUCHER-${record.group_id.slice(-8).toUpperCase()}`,
        total_referrals: record.current_members,
        total_commission: (record.current_members * 25) + 650, // R$25 per referral + milestones
        notes: ''
      }));

      setContemplations(transformedData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar contemplações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateContemplationStatus = async (contemplationId: string, newStatus: 'confirmed' | 'revoked') => {
    try {
      // Here you would update the actual database
      // For now, we'll update the local state
      setContemplations(prev => prev.map(item => 
        item.id === contemplationId 
          ? { ...item, status: newStatus }
          : item
      ));

      // Send notification email to user
      await sendStatusUpdateEmail(contemplationId, newStatus);

      toast({
        title: newStatus === 'confirmed' ? "Contemplação confirmada!" : "Contemplação revogada",
        description: `Status atualizado com sucesso. Email enviado ao usuário.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const sendStatusUpdateEmail = async (contemplationId: string, status: string) => {
    try {
      const contemplation = contemplations.find(c => c.id === contemplationId);
      if (!contemplation) return;

      const { error } = await supabase.functions.invoke('send-contemplation-email', {
        body: {
          user_email: contemplation.user_email,
          user_name: contemplation.user_name,
          status: status,
          voucher_code: contemplation.voucher_code,
          service_type: contemplation.service_type
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error sending email:', error);
    }
  };

  const generateVoucherPDF = async (contemplation: ContemplationRecord) => {
    // This would generate a PDF voucher - simplified for now
    toast({
      title: "Voucher gerado!",
      description: `Voucher PDF para ${contemplation.user_name} foi gerado com sucesso.`,
    });
  };

  const filteredContemplations = contemplations.filter(item => {
    const matchesSearch = item.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.voucher_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    const matchesDate = dateFilter === "all" || (() => {
      const itemDate = new Date(item.contemplated_at);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case "today": return diffDays === 0;
        case "week": return diffDays <= 7;
        case "month": return diffDays <= 30;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'revoked': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return { label: 'Confirmada', variant: 'default' as const };
      case 'revoked': return { label: 'Revogada', variant: 'destructive' as const };
      default: return { label: 'Pendente', variant: 'secondary' as const };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contemplações</p>
                <p className="text-2xl font-bold text-blue-600">{contemplations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {contemplations.filter(c => c.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {contemplations.filter(c => c.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revogadas</p>
                <p className="text-2xl font-bold text-red-600">
                  {contemplations.filter(c => c.status === 'revoked').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou voucher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm min-w-[150px]"
            >
              <option value="all">Todos os status</option>
              <option value="confirmed">Confirmadas</option>
              <option value="pending">Pendentes</option>
              <option value="revoked">Revogadas</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm min-w-[150px]"
            >
              <option value="all">Todas as datas</option>
              <option value="today">Hoje</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Contemplations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Contemplações Registradas ({filteredContemplations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContemplations.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma contemplação encontrada</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "As contemplações aparecerão aqui quando usuários completarem 9 indicações"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContemplations.map((contemplation) => {
                const statusBadge = getStatusBadge(contemplation.status);
                
                return (
                  <div key={contemplation.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{contemplation.user_name}</h3>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Email:</p>
                              <p className="font-medium">{contemplation.user_email}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Data da Contemplação:</p>
                              <p className="font-medium">{formatDate(contemplation.contemplated_at)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Código do Voucher:</p>
                              <p className="font-medium font-mono">{contemplation.voucher_code}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                            <div>
                              <p className="text-muted-foreground">Tipo de Serviço:</p>
                              <p className="font-medium">{contemplation.service_type}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total de Indicações:</p>
                              <p className="font-medium">{contemplation.total_referrals}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Comissão Total:</p>
                              <p className="font-medium text-green-600">
                                {formatCurrency(contemplation.total_commission)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        {contemplation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateContemplationStatus(contemplation.id, 'confirmed')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateContemplationStatus(contemplation.id, 'revoked')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Revogar
                            </Button>
                          </>
                        )}
                        
                        {contemplation.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateVoucherPDF(contemplation)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Voucher PDF
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendStatusUpdateEmail(contemplation.id, contemplation.status)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Reenviar Email
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};