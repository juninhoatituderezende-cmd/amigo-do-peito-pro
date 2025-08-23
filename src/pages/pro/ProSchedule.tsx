import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProSidebar from "@/components/pro/ProSidebar";
import { AppointmentScheduler } from "@/components/pro/AppointmentScheduler";

const ProSchedule = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <ProSidebar />
        
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Agenda de Atendimentos
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus agendamentos e horários disponíveis
            </p>
          </div>

          <AppointmentScheduler />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ProSchedule;