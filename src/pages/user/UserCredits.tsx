import { CreditBalance } from "@/components/user/CreditBalance";
import Header from "@/components/Header";
import DashboardFooter from "@/components/DashboardFooter";

const UserCredits = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Meus Créditos</h1>
          <p className="text-muted-foreground">
            Acompanhe seu saldo e transações
          </p>
        </div>
        
        <CreditBalance />
      </main>

      <DashboardFooter />
    </div>
  );
};

export default UserCredits;