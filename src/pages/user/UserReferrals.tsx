import { ReferralSystem } from "@/components/user/ReferralSystem";
import Header from "@/components/Header";
import DashboardFooter from "@/components/DashboardFooter";

const UserReferrals = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Minhas Indicações</h1>
          <p className="text-muted-foreground">
            Gerencie suas indicações e acompanhe comissões
          </p>
        </div>
        
        <ReferralSystem />
      </main>

      <DashboardFooter />
    </div>
  );
};

export default UserReferrals;