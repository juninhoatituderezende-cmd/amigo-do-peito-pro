import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Clock, Star, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  entryPrice: number; // 10% do preço
  category: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  max_participants: number;
  duration_months: number;
  image_url?: string | null;
}

// Planos agora vêm do banco de dados

interface PlansSelectionProps {
  onSelectPlan?: (plan: Plan) => void;
  selectedPlanId?: string;
}

export const PlansSelection = ({ onSelectPlan, selectedPlanId }: PlansSelectionProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      // Buscar planos de todas as tabelas específicas
      const tattooPlansPromise = supabase
        .from('planos_tatuador')
        .select('*')
        .eq('active', true);
        
      const dentalPlansPromise = supabase
        .from('planos_dentista')
        .select('*')
        .eq('active', true);

      const [tattooResponse, dentalResponse] = await Promise.all([
        tattooPlansPromise,
        dentalPlansPromise
      ]);

      // Combinar todos os planos
      const allPlans = [
        ...(tattooResponse.data || []).map(plan => ({ ...plan, category: 'tattoo' })),
        ...(dentalResponse.data || []).map(plan => ({ ...plan, category: 'dental' }))
      ];

      const formattedPlans: Plan[] = allPlans.map((plan, index) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || `Plano ${plan.name}`,
        price: plan.price,
        entryPrice: Math.round(plan.price * 0.1), // 10% do preço como entrada
        category: plan.category,
        features: plan.description ? [plan.description] : [`Plano completo de ${plan.category === 'tattoo' ? 'tatuagem' : 'odontologia'}`],
        popular: index === 0, // Primeiro plano é marcado como popular
        icon: getCategoryIcon(plan.category),
        max_participants: plan.max_participants || 10,
        duration_months: 1, // padrão
        image_url: plan.image_url
      }));

      setPlans(formattedPlans);
      console.log('Planos carregados:', formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos disponíveis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string | null) => {
    if (!category) return <Package className="h-6 w-6" />;
    
    switch (category.toLowerCase()) {
      case 'tattoo': return <Star className="h-6 w-6" />;
      case 'dental': return <Users className="h-6 w-6" />;
      case 'service': return <Package className="h-6 w-6" />;
      default: return <Clock className="h-6 w-6" />;
    }
  };

  const handleSelectPlan = async (plan: Plan) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Login necessário",
          description: "Faça login para comprar um plano.",
          variant: "destructive",
        });
        return;
      }

      // Chamar a função de criar pagamento
      const { data, error } = await supabase.functions.invoke('create-asaas-payment', {
        body: {
          plan_id: plan.id,
          plan_category: plan.category,
          user_id: session.user.id,
          payment_method: 'pix' // Pode ser alterado para permitir escolha
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Pagamento criado!",
          description: `PIX de R$ ${data.amount} gerado para o plano ${data.plan_name}`,
        });
        
        // Aqui você pode redirecionar para uma página de checkout
        // ou abrir um modal com os dados do pagamento
        console.log('Dados do pagamento:', data);
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive",
      });
    }

    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "tattoo": return "bg-purple-100 text-purple-800";
      case "dental": return "bg-blue-100 text-blue-800";
      case "service": return "bg-green-100 text-green-800";
      case "course": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case "tattoo": return "Tatuagem";
      case "dental": return "Dental";
      case "service": return "Serviço";
      case "course": return "Curso";
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Nenhum plano disponível</h3>
        <p className="text-muted-foreground">
          Os planos estão sendo configurados. Volte em breve!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen overflow-y-auto px-4 py-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Escolha seu Plano
        </h2>
        <p className="text-muted-foreground mb-8">
          Forme um grupo de 10 pessoas e pague apenas 10% de entrada
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative transition-all duration-200 hover:shadow-lg cursor-pointer overflow-hidden ${
              selectedPlanId === plan.id 
                ? "border-2 border-ap-orange shadow-lg" 
                : "border hover:border-ap-orange/50"
            } ${plan.popular ? "border-2 border-ap-orange" : ""}`}
            onClick={() => handleSelectPlan(plan)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              </div>
            )}
            
            {plan.image_url && (
              <div className="relative h-32 w-full overflow-hidden">
                <img
                  src={plan.image_url}
                  alt={plan.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}
            
            <CardHeader className={`text-center ${plan.image_url ? 'pb-2' : 'pb-4'}`}>
              <div className="flex justify-center items-center gap-2 mb-3">
                {!plan.image_url && (
                  <div className="p-2 bg-ap-orange/10 rounded-lg text-ap-orange">
                    {plan.icon}
                  </div>
                )}
                <Badge variant="secondary" className={getCategoryColor(plan.category)}>
                  {getCategoryLabel(plan.category)}
                </Badge>
              </div>
              
              <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  Valor total do serviço
                </div>
                <div className="text-lg font-medium text-gray-600 line-through">
                  R$ {plan.price.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Você paga apenas:
                </div>
                <div className="text-2xl font-bold text-ap-orange">
                  R$ {plan.entryPrice.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  entrada (10% do valor)
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Incluso no plano:</h4>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button 
                className="w-full mt-4 font-semibold text-white bg-ap-orange hover:bg-ap-orange-dark transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPlan(plan);
                }}
              >
                Comprar Plano
              </Button>

              {/* Group Info */}
              <div className="text-center mt-3">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{plan.max_participants} pessoas por grupo</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Duração: {plan.duration_months} {plan.duration_months === 1 ? 'mês' : 'meses'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium">Como funciona</h4>
              <p className="text-sm text-muted-foreground">
                Forme um grupo e todos economizam
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium">Pagamento seguro</h4>
              <p className="text-sm text-muted-foreground">
                Pague apenas 10% de entrada via cartão ou PIX
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Star className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium">Profissionais qualificados</h4>
              <p className="text-sm text-muted-foreground">
                Apenas profissionais verificados e experientes
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export { type Plan };