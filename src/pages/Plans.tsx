import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlansSelection, type Plan } from '@/components/plans/PlansSelection';
import Header from '@/components/Header';
import DashboardFooter from '@/components/DashboardFooter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Plans = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    
    toast({
      title: "Plano selecionado!",
      description: `Você selecionou o plano ${plan.name}. Clique em "Continuar" para prosseguir.`,
    });
  };

  const handleContinue = () => {
    if (!selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "Por favor, selecione um plano antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    // Redirecionar para página de inscrição no plano
    navigate(`/plano/${selectedPlan.id}`);
  };

  const handleGoToDashboard = () => {
    if (user?.role === 'user') {
      navigate('/usuario/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={handleGoToDashboard}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {user ? 'Voltar ao Dashboard' : 'Voltar ao Início'}
            </Button>
            
            <h1 className="text-3xl font-bold">Escolha seu Plano</h1>
            <p className="text-muted-foreground">
              Selecione o plano ideal para você e forme um grupo para economizar
            </p>
          </div>
        </div>

        <PlansSelection 
          onSelectPlan={handleSelectPlan}
          selectedPlanId={selectedPlan?.id}
        />

        {selectedPlan && (
          <div className="mt-8 text-center">
            <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">
                Plano Selecionado: {selectedPlan.name}
              </h3>
              <p className="text-muted-foreground mb-4">
                Valor de entrada: R$ {selectedPlan.entryPrice.toLocaleString()}
              </p>
              <Button 
                onClick={handleContinue}
                className="bg-primary hover:bg-primary/90"
                size="lg"
              >
                Continuar com este Plano
              </Button>
            </div>
          </div>
        )}
      </main>

      <DashboardFooter />
    </div>
  );
};

export default Plans;