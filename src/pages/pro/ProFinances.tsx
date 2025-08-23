import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProSidebar from "@/components/pro/ProSidebar";
import { FinancialReports } from "@/components/pro/FinancialReports";

const ProFinances = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <ProSidebar />
        
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Relatórios Financeiros
            </h1>
            <p className="text-muted-foreground">
              Acompanhe sua performance financeira e metas
            </p>
          </div>

          <FinancialReports />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ProFinances;