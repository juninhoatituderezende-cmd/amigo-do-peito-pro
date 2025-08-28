import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, Calendar } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  max_participants: number;
  image_url?: string;
  active: boolean;
  created_at: string;
}

interface PlansDisplayProps {
  category: 'tatuador' | 'dentista';
  title: string;
  onSelectPlan?: (plan: Plan) => void;
}

export const PlansDisplay = ({ category, title, onSelectPlan }: PlansDisplayProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const tableMap = {
    tatuador: 'planos_tatuador',
    dentista: 'planos_dentista'
  };

  const loadPlans = async () => {
    try {
      setLoading(true);
      
      // Buscar planos diretamente da tabela baseado na categoria
      let data, error;
      
      if (category === 'tatuador') {
        const response = await supabase
          .from('planos_tatuador')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });
        data = response.data;
        error = response.error;
      } else {
        const response = await supabase
          .from('planos_dentista')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });
        data = response.data;
        error = response.error;
      }

      if (error) {
        throw error;
      }

      setPlans(data || []);

    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [category]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhum plano de {category === 'tatuador' ? 'tatuagem' : 'odontologia'} disponível no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{title}</h3>
        <Badge variant="outline">
          {plans.length} plano{plans.length > 1 ? 's' : ''} disponível{plans.length > 1 ? 'is' : ''}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              {plan.image_url && (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={plan.image_url} 
                    alt={plan.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {plan.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {plan.description}
                </p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-green-600">
                      {formatPrice(plan.price)}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    Ativo
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Máximo {plan.max_participants} participantes</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              
              {onSelectPlan && (
                <Button 
                  className="w-full"
                  onClick={() => onSelectPlan(plan)}
                >
                  Selecionar Plano
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};