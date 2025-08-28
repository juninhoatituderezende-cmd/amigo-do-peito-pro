import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Users, Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  entryPrice: number;
  category: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  max_participants: number;
  duration_months: number;
  image_url?: string | null;
}

interface PlanCardProps {
  plan: Plan;
  selectedPlanId?: string;
  processing: boolean;
  onSelectPlan: (plan: Plan) => void;
  getCategoryColor: (category: string) => string;
  getCategoryLabel: (category: string) => string;
}

export const PlanCard = ({ 
  plan, 
  selectedPlanId, 
  processing, 
  onSelectPlan, 
  getCategoryColor, 
  getCategoryLabel 
}: PlanCardProps) => {
  return (
    <Card 
      className={`relative transition-all duration-200 hover:shadow-lg cursor-pointer overflow-hidden ${
        selectedPlanId === plan.id 
          ? "border-2 border-ap-orange shadow-lg" 
          : "border hover:border-ap-orange/50"
      } ${plan.popular ? "border-2 border-ap-orange" : ""}`}
      onClick={() => onSelectPlan(plan)}
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
          className="w-full mt-4 font-semibold text-white bg-ap-orange hover:bg-ap-orange-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={(e) => {
            e.stopPropagation();
            onSelectPlan(plan);
          }}
          disabled={processing}
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            'Comprar Plano'
          )}
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
  );
};