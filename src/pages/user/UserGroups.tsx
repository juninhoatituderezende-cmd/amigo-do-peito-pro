import { UserGroupsHistory } from "@/components/user/UserGroupsHistory";
import Header from "@/components/Header";
import DashboardFooter from "@/components/DashboardFooter";

const UserGroups = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Meus Grupos</h1>
          <p className="text-muted-foreground">
            Acompanhe suas participações em grupos
          </p>
        </div>
        
        <UserGroupsHistory />
      </main>

      <DashboardFooter />
    </div>
  );
};

export default UserGroups;