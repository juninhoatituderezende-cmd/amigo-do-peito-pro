import { useState } from "react";
import { PlansDisplay } from "@/components/user/PlansDisplay";
import { PaymentModal } from "@/components/PaymentModal";
import { PaymentDebugTool } from "@/components/PaymentDebugTool";
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSelectPlan = (plan: Plan) => {
    console.log('🎯 DIRETO PARA PIX - Plano:', plan.name, 'Preço:', plan.price);
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('✅ PIX processado:', paymentData);
    
    toast({
      title: "PIX Gerado!",
      description: `PIX de R$ ${selectedPlan?.price} para "${selectedPlan?.name}" está aguardando pagamento.`,
    });

    // Fechar modal mas manter na tela para ver status
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };

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

        {/* Ferramenta de Debug Temporária */}
        <PaymentDebugTool />

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

        {/* Modal de Pagamento PIX */}
        <PaymentModal
          plan={selectedPlan}
          isOpen={showPaymentModal}
          onClose={handleCloseModal}
          onSuccess={handlePaymentSuccess}
        />
      </main>

      <Footer />
    </div>
  );
};

export default UserPlans;