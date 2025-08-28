import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Phone, 
  Mail,
  MapPin
} from "lucide-react";

interface PlanDetailsProps {
  planId?: string;
}

interface PlanData {
  id: string;
  name: string;
  description: string;
  price: number;
  max_participants: number;
  category: string;
  professional_id?: string;
}

interface GroupData {
  id: string;
  group_number: number;
  status: string;
  current_participants: number;
  max_participants: number;
  current_amount: number;
  target_amount: number;
  contemplated_at: string | null;
  winner_id: string | null;
  created_at: string;
}

interface ParticipationData {
  id: string;
  amount_paid: number;
  joined_at: string;
  status: string;
}

interface ProfessionalData {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  // Add more fields as needed
}

const PlanDetails: React.FC<PlanDetailsProps> = ({ planId: propPlanId }) => {
  const { planId: paramPlanId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const planId = propPlanId || paramPlanId;
  
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [participationData, setParticipationData] = useState<ParticipationData | null>(null);
  const [professionalData, setProfessionalData] = useState<ProfessionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (planId && user) {
      loadPlanDetails();
    }
  }, [planId, user]);

  const loadPlanDetails = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando detalhes do plano:', planId, 'para usuário:', user?.id);

      // 1. Buscar dados do plano nas mesmas tabelas que PlansSelection
      let plan = null;
      let planCategory = '';

      // Tentar buscar em planos_tatuador primeiro
      const { data: tattooPlan, error: tattooError } = await supabase
        .from('planos_tatuador')
        .select('*')
        .eq('id', planId)
        .eq('active', true)
        .single();

      if (tattooPlan) {
        plan = { ...tattooPlan, category: 'tattoo' };
        planCategory = 'tattoo';
      } else {
        // Se não encontrou, buscar em planos_dentista
        const { data: dentalPlan, error: dentalError } = await supabase
          .from('planos_dentista')
          .select('*')
          .eq('id', planId)
          .eq('active', true)
          .single();

        if (dentalPlan) {
          plan = { ...dentalPlan, category: 'dental' };
          planCategory = 'dental';
        } else {
          // Por último, tentar custom_plans
          const { data: customPlan, error: customError } = await supabase
            .from('custom_plans')
            .select('*')
            .eq('id', planId)
            .eq('active', true)
            .single();

          if (customPlan) {
            plan = { ...customPlan, category: 'service' };
            planCategory = 'service';
          }
        }
      }

      if (!plan) {
        console.error('❌ Plano não encontrado em nenhuma tabela:', planId);
        throw new Error('Plano não encontrado');
      }

      console.log('✅ Plano encontrado:', plan.name, 'Categoria:', planCategory);
      setPlanData({
        ...plan,
        category: planCategory
      });

      // 2. Buscar participação do usuário
      const { data: participation, error: participationError } = await supabase
        .from('group_participants')
        .select(`
          *,
          plan_groups (*)
        `)
        .eq('user_id', user?.id);

      if (participationError) {
        console.error('❌ Erro ao buscar participação:', participationError);
      } else if (participation && participation.length > 0) {
        // Encontrar participação relacionada a este plano
        const relevantParticipation = participation.find(p => 
          p.plan_groups && p.plan_groups.service_id === planId
        );
        
        if (relevantParticipation) {
          setParticipationData(relevantParticipation);
          setGroupData(relevantParticipation.plan_groups);
          console.log('✅ Participação encontrada no grupo:', relevantParticipation.plan_groups.group_number);
        }
      }

      // 3. Buscar dados do profissional se disponível
      if (plan.professional_id) {
        const { data: professional, error: professionalError } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email')
          .eq('id', plan.professional_id)
          .single();

        if (!professionalError && professional) {
          setProfessionalData(professional);
          console.log('✅ Profissional carregado:', professional.full_name);
        }
      }

    } catch (error: any) {
      console.error('💥 Erro ao carregar detalhes:', error);
      setError(error.message);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'contemplated':
        return <Badge className="bg-green-500 text-white">Contemplado</Badge>;
      case 'active':
        return <Badge className="bg-blue-500 text-white">Ativo</Badge>;
      case 'forming':
        return <Badge className="bg-yellow-500 text-white">Formando</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProgressPercentage = () => {
    if (!groupData) return 0;
    return Math.round((groupData.current_participants / groupData.max_participants) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !planData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Erro ao carregar plano</h3>
              <p className="text-muted-foreground mb-4">{error || 'Plano não encontrado'}</p>
              <Button onClick={() => navigate('/usuario/planos')}>
                Voltar aos Planos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{planData.name}</h1>
            <p className="text-muted-foreground">Detalhes do seu plano</p>
          </div>
        </div>

        {/* Plan Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Nome do Plano</p>
                <p className="text-muted-foreground">{planData.name}</p>
              </div>
              <div>
                <p className="font-medium">Categoria</p>
                <p className="text-muted-foreground capitalize">{planData.category}</p>
              </div>
              <div>
                <p className="font-medium">Valor Total</p>
                <p className="text-muted-foreground">R$ {planData.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Máximo de Participantes</p>
                <p className="text-muted-foreground">{planData.max_participants} pessoas</p>
              </div>
            </div>
            {planData.description && (
              <div>
                <p className="font-medium">Descrição</p>
                <p className="text-muted-foreground">{planData.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Progress */}
        {groupData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Progresso do Grupo {groupData.group_number}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Participantes</span>
                <span>{groupData.current_participants}/{groupData.max_participants}</span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Status do Grupo</p>
                  {getStatusBadge(groupData.status)}
                </div>
                <div>
                  <p className="font-medium">Data de Criação</p>
                  <p className="text-muted-foreground">
                    {new Date(groupData.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {groupData.contemplated_at && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">Grupo Contemplado!</p>
                  </div>
                  <p className="text-green-700 mt-1">
                    Contemplado em: {new Date(groupData.contemplated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Participation */}
        {participationData && (
          <Card>
            <CardHeader>
              <CardTitle>Sua Participação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Valor Pago</p>
                  <p className="text-muted-foreground">R$ {participationData.amount_paid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Data de Entrada</p>
                  <p className="text-muted-foreground">
                    {new Date(participationData.joined_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Status</p>
                  {getStatusBadge(participationData.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Professional Information */}
        {professionalData && groupData?.status === 'contemplated' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Você foi contemplado! Entre em contato com o profissional para agendar seu serviço.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{professionalData.full_name}</p>
                  <p className="text-muted-foreground">Profissional responsável</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  {professionalData.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{professionalData.phone}</span>
                    </div>
                  )}
                  
                  {professionalData.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{professionalData.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  {professionalData.phone && (
                    <Button 
                      onClick={() => window.open(`tel:${professionalData.phone}`)}
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Ligar
                    </Button>
                  )}
                  
                  {professionalData.email && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`mailto:${professionalData.email}`)}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {!participationData && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não está participando deste plano.
              </p>
              <Button onClick={() => navigate('/usuario/planos')}>
                Ver Planos Disponíveis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlanDetails;