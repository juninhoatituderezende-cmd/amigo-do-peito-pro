import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Package, 
  DollarSign, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from 'react-router-dom';

interface PlanDetails {
  // Dados do plano
  id: string;
  plan_name: string;
  plan_description: string;
  category_name: string;
  total_price: number;
  entry_price: number;
  max_participants: number;
  
  // Dados do cliente
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  
  // Dados do grupo
  group_number: number;
  position_number: number;
  current_participants: number;
  group_status: string;
  
  // Status de pagamento
  payment_status: string;
  entry_amount: number;
  payment_date: string;
  
  // Status de contemplação
  contemplated: boolean;
  contemplation_date: string;
  service_completed: boolean;
  service_completion_date: string;
  
  // Profissional
  professional_id: string;
  professional_name: string;
  professional_specialty: string;
  professional_location: string;
  professional_phone: string;
  professional_email: string;
  
  // Influenciador
  influencer_id: string;
  influencer_name: string;
  
  // Datas
  enrollment_date: string;
}

export function PlanDetails() {
  const { planId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planId) {
      loadPlanDetails();
    }
  }, [planId]);

  const loadPlanDetails = async () => {
    if (!planId) return;

    setLoading(true);
    try {
      // Buscar detalhes completos do plano
      const { data, error } = await supabase
        .from('plan_participations')
        .select(`
          id,
          entry_amount,
          payment_status,
          payment_date,
          position_number,
          contemplated,
          service_completed,
          created_at,
          
          clientes(
            id,
            nome,
            email,
            telefone
          ),
          
          plan_groups(
            id,
            group_number,
            current_participants,
            status,
            contemplation_date,
            
            custom_plans(
              id,
              name,
              description,
              total_price,
              entry_price,
              max_participants,
              service_categories(name)
            ),
            
            profissionais(
              id,
              nome,
              especialidade,
              local_atendimento,
              telefone,
              email
            )
          ),
          
          plan_commissions(
            influenciadores(
              id,
              nome
            )
          )
        `)
        .eq('id', planId)
        .single();

      if (error) throw error;

      if (data) {
        const planGroup = (data.plan_groups as any);
        const customPlan = planGroup?.custom_plans;
        const professional = planGroup?.profissionais;
        const client = (data.clientes as any);
        const influencer = (data.plan_commissions as any)?.[0]?.influenciadores;

        const formattedDetails: PlanDetails = {
          id: data.id,
          plan_name: customPlan?.name || '',
          plan_description: customPlan?.description || '',
          category_name: customPlan?.service_categories?.name || '',
          total_price: customPlan?.total_price || 0,
          entry_price: customPlan?.entry_price || 0,
          max_participants: customPlan?.max_participants || 0,
          
          client_id: client?.id || '',
          client_name: client?.nome || '',
          client_email: client?.email || '',
          client_phone: client?.telefone || '',
          
          group_number: planGroup?.group_number || 0,
          position_number: data.position_number || 0,
          current_participants: planGroup?.current_participants || 0,
          group_status: planGroup?.status || '',
          
          payment_status: data.payment_status || '',
          entry_amount: data.entry_amount || 0,
          payment_date: data.payment_date || '',
          
          contemplated: data.contemplated || false,
          contemplation_date: planGroup?.contemplation_date || '',
          service_completed: data.service_completed || false,
          service_completion_date: '', // Campo não disponível na query atual
          
          professional_id: professional?.id || '',
          professional_name: professional?.nome || '',
          professional_specialty: professional?.especialidade || '',
          professional_location: professional?.local_atendimento || '',
          professional_phone: professional?.telefone || '',
          professional_email: professional?.email || '',
          
          influencer_id: influencer?.id || '',
          influencer_name: influencer?.nome || '',
          
          enrollment_date: data.created_at || ''
        };

        setPlanDetails(formattedDetails);
      }

    } catch (error) {
      console.error('Erro ao carregar detalhes do plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes do plano.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressPercentage = () => {
    if (!planDetails) return 0;
    return Math.round((planDetails.current_participants / planDetails.max_participants) * 100);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'forming': { label: 'Formando', variant: 'secondary' as const },
      'full': { label: 'Completo', variant: 'default' as const },
      'contemplating': { label: 'Contemplando', variant: 'default' as const },
      'completed': { label: 'Finalizado', variant: 'default' as const },
      'pending': { label: 'Pendente', variant: 'secondary' as const },
      'paid': { label: 'Pago', variant: 'default' as const }
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!planDetails) {
    return (
      <div className="text-center py-8">
        <Alert>
          <AlertDescription>
            Plano não encontrado ou você não tem permissão para visualizá-lo.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{planDetails.plan_name}</h2>
          <p className="text-muted-foreground">{planDetails.plan_description}</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {planDetails.category_name}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="text-lg font-semibold">{planDetails.client_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="text-sm">{planDetails.client_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="text-sm">{planDetails.client_phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data de Inscrição</p>
                  <p className="text-sm">{formatDate(planDetails.enrollment_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posição no Grupo</p>
                  <p className="text-sm font-semibold">#{planDetails.position_number}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progresso do Grupo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Progresso do Grupo {planDetails.group_number}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Participantes</span>
                <span>{planDetails.current_participants}/{planDetails.max_participants}</span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status do Grupo</span>
                <Badge {...getStatusBadge(planDetails.group_status)}>
                  {getStatusBadge(planDetails.group_status).label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total do Serviço</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(planDetails.total_price)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor da Entrada</p>
                  <p className="text-xl font-bold">{formatCurrency(planDetails.entry_price)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status do Pagamento</span>
                <Badge {...getStatusBadge(planDetails.payment_status)}>
                  {getStatusBadge(planDetails.payment_status).label}
                </Badge>
              </div>
              {planDetails.payment_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Data do Pagamento</p>
                  <p className="text-sm">{formatDate(planDetails.payment_date)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status de Contemplação e Serviço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Status do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl mb-2">
                    {planDetails.contemplated ? '🎉' : '⏳'}
                  </div>
                  <p className="font-semibold">
                    {planDetails.contemplated ? 'Contemplado' : 'Aguardando'}
                  </p>
                  {planDetails.contemplation_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(planDetails.contemplation_date)}
                    </p>
                  )}
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl mb-2">
                    {planDetails.service_completed ? '✅' : '🔄'}
                  </div>
                  <p className="font-semibold">
                    {planDetails.service_completed ? 'Concluído' : 'Pendente'}
                  </p>
                  {planDetails.service_completion_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(planDetails.service_completion_date)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Profissional Atribuído */}
          {planDetails.professional_name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Profissional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">{planDetails.professional_name}</p>
                  <p className="text-sm text-muted-foreground">{planDetails.professional_specialty}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{planDetails.professional_location}</span>
                  </div>
                  
                  {planDetails.professional_phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{planDetails.professional_phone}</span>
                    </div>
                  )}
                  
                  {planDetails.professional_email && (
                    <div className="flex items-center text-sm">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{planDetails.professional_email}</span>
                    </div>
                  )}
                </div>

                {planDetails.contemplated && !planDetails.service_completed && (
                  <div className="space-y-2">
                    <Separator />
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Você foi contemplado! Entre em contato com o profissional para agendar seu serviço.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(`tel:${planDetails.professional_phone}`)}>
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${planDetails.professional_email}`)}>
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Influenciador */}
          {planDetails.influencer_name && (
            <Card>
              <CardHeader>
                <CardTitle>Indicado por</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{planDetails.influencer_name}</p>
                <p className="text-sm text-muted-foreground">Influenciador</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Inscrição realizada</p>
                    <p className="text-xs text-muted-foreground">{formatDate(planDetails.enrollment_date)}</p>
                  </div>
                </div>
                
                {planDetails.payment_date && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Pagamento confirmado</p>
                      <p className="text-xs text-muted-foreground">{formatDate(planDetails.payment_date)}</p>
                    </div>
                  </div>
                )}
                
                {planDetails.contemplation_date ? (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Contemplado</p>
                      <p className="text-xs text-muted-foreground">{formatDate(planDetails.contemplation_date)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Aguardando contemplação</p>
                    </div>
                  </div>
                )}
                
                {planDetails.service_completion_date ? (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Serviço concluído</p>
                      <p className="text-xs text-muted-foreground">{formatDate(planDetails.service_completion_date)}</p>
                    </div>
                  </div>
                ) : planDetails.contemplated ? (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-orange-600">Aguardando realização do serviço</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Serviço pendente</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}