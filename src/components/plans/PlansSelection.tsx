import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Clock, Star } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  fullPrice: number;
  entryPrice: number; // 10% do valor total
  category: "tattoo" | "dental" | "complete";
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    id: "tattoo",
    name: "Tatuagem",
    description: "Tatuagem profissional com artistas qualificados",
    fullPrice: 1000,
    entryPrice: 100,
    category: "tattoo",
    features: [
      "Consulta e orçamento gratuito",
      "Tatuagem até 15cm",
      "Artista profissional certificado",
      "Material descartável e esterilizado",
      "Acompanhamento pós-tatuagem"
    ],
    icon: <Star className="h-6 w-6" />
  },
  {
    id: "lente-superior",
    name: "Lente Superior",
    description: "Lentes de contato dental para arcada superior",
    fullPrice: 2500,
    entryPrice: 250,
    category: "dental",
    features: [
      "Consulta e avaliação bucal",
      "Até 10 lentes superiores",
      "Material de porcelana premium",
      "Moldagem digital 3D",
      "Garantia de 2 anos"
    ],
    icon: <Users className="h-6 w-6" />
  },
  {
    id: "lente-inferior",
    name: "Lente Inferior", 
    description: "Lentes de contato dental para arcada inferior",
    fullPrice: 2500,
    entryPrice: 250,
    category: "dental",
    features: [
      "Consulta e avaliação bucal",
      "Até 10 lentes inferiores",
      "Material de porcelana premium",
      "Moldagem digital 3D",
      "Garantia de 2 anos"
    ],
    icon: <Users className="h-6 w-6" />
  },
  {
    id: "plano-completo",
    name: "Plano Completo",
    description: "Lentes superiores + inferiores (sorriso completo)",
    fullPrice: 4500,
    entryPrice: 450,
    category: "complete",
    popular: true,
    features: [
      "Consulta e avaliação bucal completa",
      "Até 20 lentes (superior + inferior)",
      "Material de porcelana premium",
      "Moldagem digital 3D",
      "Planejamento digital do sorriso",
      "Garantia de 3 anos",
      "Acompanhamento completo"
    ],
    icon: <Clock className="h-6 w-6" />
  }
];

interface PlansSelectionProps {
  onSelectPlan?: (plan: Plan) => void;
  selectedPlanId?: string;
}

export const PlansSelection = ({ onSelectPlan, selectedPlanId }: PlansSelectionProps) => {
  const handleSelectPlan = (plan: Plan) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  const getCategoryColor = (category: Plan["category"]) => {
    switch (category) {
      case "tattoo": return "bg-purple-100 text-purple-800";
      case "dental": return "bg-blue-100 text-blue-800";
      case "complete": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category: Plan["category"]) => {
    switch (category) {
      case "tattoo": return "Tatuagem";
      case "dental": return "Dental";
      case "complete": return "Completo";
      default: return "Outros";
    }
  };

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
            className={`relative transition-all duration-200 hover:shadow-lg cursor-pointer ${
              selectedPlanId === plan.id 
                ? "border-2 border-ap-orange shadow-lg" 
                : "border hover:border-ap-orange/50"
            } ${plan.popular ? "border-2 border-ap-orange" : ""}`}
            onClick={() => handleSelectPlan(plan)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center items-center gap-2 mb-3">
                <div className="p-2 bg-ap-orange/10 rounded-lg text-ap-orange">
                  {plan.icon}
                </div>
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
                  R$ {plan.fullPrice.toLocaleString()}
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
                className={`w-full mt-4 ${
                  selectedPlanId === plan.id 
                    ? "bg-ap-orange hover:bg-ap-orange/90" 
                    : "bg-gray-900 hover:bg-gray-800"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPlan(plan);
                }}
              >
                {selectedPlanId === plan.id ? "Plano Selecionado" : "Formar Grupo"}
              </Button>

              {/* Group Info */}
              <div className="text-center mt-3">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>10 pessoas por grupo</span>
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
                Forme um grupo de 10 pessoas e todos economizam
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

export { plans, type Plan };