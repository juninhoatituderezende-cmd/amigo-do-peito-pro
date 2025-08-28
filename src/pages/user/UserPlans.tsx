import { useState } from "react";
import { PlansDisplay } from "@/components/user/PlansDisplay";
import { PaymentCheckout } from "@/components/PaymentCheckout";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

const UserPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSelectPlan = (plan: Plan) => {
    console.log('🎯 Plano selecionado para checkout:', plan);
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('✅ Pagamento processado:', paymentData);
    
    toast({
      title: "Pagamento Iniciado!",
      description: `Seu pagamento para o plano "${selectedPlan?.name}" foi processado. Acompanhe o status no painel.`,
    });

    // Redirecionar para dashboard após alguns segundos
    setTimeout(() => {
      navigate('/usuario/dashboard');
    }, 3000);
  };

  const handleBackToPlans = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  if (showCheckout && selectedPlan) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <PaymentCheckout
            plan={selectedPlan}
            onBack={handleBackToPlans}
            onSuccess={handlePaymentSuccess}
          />
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Nossos Planos de Serviços
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha entre nossos planos de tatuagem e odontologia com as melhores condições
          </p>
        </div>

        <PlansDisplay 
          category="tatuador" 
          title="Planos de Tatuagem"
          onSelectPlan={handleSelectPlan}
        />

        <PlansDisplay 
          category="dentista" 
          title="Planos Odontológicos" 
          onSelectPlan={handleSelectPlan}
        />
      </main>

      <Footer />
    </div>
  );
};

export default UserPlans;