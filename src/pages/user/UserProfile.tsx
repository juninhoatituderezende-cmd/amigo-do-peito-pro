import { UserProfile as UserProfileComponent } from "@/components/user/UserProfile";
import Header from "@/components/Header";
import DashboardFooter from "@/components/DashboardFooter";

const UserProfile = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
        </div>
        
        <UserProfileComponent />
      </main>

      <DashboardFooter />
    </div>
  );
};

export default UserProfile;