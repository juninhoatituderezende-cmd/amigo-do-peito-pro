import { PlanCard } from "./PlanCard";

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

interface PlansGridProps {
  plans: Plan[];
  selectedPlanId?: string;
  processing: boolean;
  onSelectPlan: (plan: Plan) => void;
  getCategoryColor: (category: string) => string;
  getCategoryLabel: (category: string) => string;
}

export const PlansGrid = ({ 
  plans, 
  selectedPlanId, 
  processing, 
  onSelectPlan, 
  getCategoryColor, 
  getCategoryLabel 
}: PlansGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          selectedPlanId={selectedPlanId}
          processing={processing}
          onSelectPlan={onSelectPlan}
          getCategoryColor={getCategoryColor}
          getCategoryLabel={getCategoryLabel}
        />
      ))}
    </div>
  );
};