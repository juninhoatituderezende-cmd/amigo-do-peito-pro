import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle, 
  Calendar, 
  DollarSign, 
  Users, 
  Phone, 
  Mail 
} from "lucide-react";

interface ContemplatedPlan {
  id: string;
  plan_name: string;
  amount_paid: number;
  joined_at: string;
  contemplated_at: string;
  group_number: number;
  professional_name?: string;
  professional_phone?: string;
  professional_email?: string;
}

const ContemplatedPlans: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contemplatedPlans, setContemplatedPlans] = useState<ContemplatedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadContemplatedPlans();
    }
  }, [user]);

  const loadContemplatedPlans = async () => {
    try {
      console.log('🔍 Buscando planos contemplados para usuário:', user?.id);
      
      // Buscar participações do usuário em grupos contemplados
      const { data: participations, error } = await supabase
        .from('group_participants')
        .select(`
          *,
          plan_groups!inner (
            id,
            group_number,
            status,
            contemplated_at,
            service_id
          )
        `)
        .eq('user_id', user?.id)
        .eq('plan_groups.status', 'contemplated');

      if (error) {
        console.error('❌ Erro ao buscar planos contemplados:', error);
        return;
      }

      console.log('📊 Dados retornados:', participations);

      if (participations && participations.length > 0) {
        // Para cada participação, buscar dados do plano separadamente
        const formattedPlans: ContemplatedPlan[] = [];
        
        for (const participation of participations) {
          if (participation.plan_groups?.contemplated_at && participation.plan_groups?.service_id) {
            // Buscar dados do plano
            const { data: planData } = await supabase
              .from('custom_plans')
              .select('name, professional_id')
              .eq('id', participation.plan_groups.service_id)
              .single();
            
            let professionalData = null;
            if (planData?.professional_id) {
              const { data: professional } = await supabase
                .from('profiles')
                .select('full_name, phone, email')
                .eq('id', planData.professional_id)
                .single();
              professionalData = professional;
            }
            
            formattedPlans.push({
              id: participation.id,
              plan_name: planData?.name || 'Plano não identificado',
              amount_paid: participation.amount_paid,
              joined_at: participation.joined_at,
              contemplated_at: participation.plan_groups.contemplated_at,
              group_number: participation.plan_groups.group_number,
              professional_name: professionalData?.full_name,
              professional_phone: professionalData?.phone,
              professional_email: professionalData?.email,
            });
          }
        }

        setContemplatedPlans(formattedPlans);
        console.log('✅ Planos contemplados encontrados:', formattedPlans.length);
      } else {
        console.log('ℹ️ Nenhum plano contemplado encontrado');
      }
    } catch (error) {
      console.error('💥 Erro ao carregar planos contemplados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (contemplatedPlans.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum plano contemplado</h3>
          <p className="text-muted-foreground mb-4">
            Você ainda não foi contemplado em nenhum grupo.
          </p>
          <Button onClick={() => navigate('/usuario/planos')}>
            Ver Planos Disponíveis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-semibold">Planos Contemplados</h2>
        <Badge className="bg-green-500 text-white">{contemplatedPlans.length}</Badge>
      </div>

      {contemplatedPlans.map((plan) => (
        <Card key={plan.id} className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-green-600">
                  {plan.plan_name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Grupo {plan.group_number} • Contemplado em{' '}
                  {new Date(plan.contemplated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Badge className="bg-green-500 text-white">Contemplado</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Informações da participação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Valor pago: R$ {plan.amount_paid.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Entrada: {new Date(plan.joined_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Informações do profissional */}
            {(plan.professional_name || plan.professional_phone || plan.professional_email) && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">
                  Entre em contato com o profissional para agendar seu serviço:
                </h4>
                
                {plan.professional_name && (
                  <p className="text-green-700 font-medium mb-2">
                    {plan.professional_name}
                  </p>
                )}
                
                <div className="flex flex-col gap-2">
                  {plan.professional_phone && (
                    <div className="flex items-center gap-2 text-green-700">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{plan.professional_phone}</span>
                    </div>
                  )}
                  
                  {plan.professional_email && (
                    <div className="flex items-center gap-2 text-green-700">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{plan.professional_email}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  {plan.professional_phone && (
                    <Button 
                      size="sm"
                      onClick={() => window.open(`tel:${plan.professional_phone}`)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <Phone className="h-3 w-3" />
                      Ligar
                    </Button>
                  )}
                  
                  {plan.professional_email && (
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`mailto:${plan.professional_email}`)}
                      className="flex items-center gap-1 border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Mail className="h-3 w-3" />
                      Email
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ContemplatedPlans;