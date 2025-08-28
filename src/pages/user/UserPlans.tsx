import { PlansDisplay } from "@/components/user/PlansDisplay";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const UserPlans = () => {
  const handleSelectPlan = (plan: any) => {
    console.log('Plano selecionado:', plan);
    // Aqui você pode implementar a lógica para redirecionar para checkout ou mais detalhes
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