
import { useState, useEffect } from "react";
import ProSidebar from "../../components/pro/ProSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  status: "pending" | "completed" | "canceled";
}

interface FinanceData {
  balance: number;
  pendingPayments: number;
  completedServices: number;
}

const ProDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [financeData, setFinanceData] = useState<FinanceData>({
    balance: 0,
    pendingPayments: 0,
    completedServices: 0,
  });

  useEffect(() => {
    // In a real app, this would be an API call to fetch the dashboard data
    // For this demo, we'll use mock data
    setAppointments([
      {
        id: "appt1",
        clientName: "Maria Silva",
        service: user?.category === "tatuador" ? "Tatuagem braço" : "Lentes de contato dental",
        date: "2023-05-20T14:00:00",
        status: "pending",
      },
      {
        id: "appt2",
        clientName: "João Santos",
        service: user?.category === "tatuador" ? "Tatuagem costas pequena" : "Lentes de contato (4 unidades)",
        date: "2023-05-21T10:30:00",
        status: "pending",
      },
      {
        id: "appt3",
        clientName: "Ana Oliveira",
        service: user?.category === "tatuador" ? "Tatuagem pulso" : "Avaliação inicial",
        date: "2023-05-18T16:00:00",
        status: "completed",
      },
    ]);

    setFinanceData({
      balance: 1250.75,
      pendingPayments: 850.00,
      completedServices: 5,
    });
  }, [user]);

  return (
    <div className="flex h-screen bg-slate-50">
      <ProSidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">
              Bem-vindo de volta, {user?.name.split(" ")[0] || "Profissional"}! Aqui está um resumo da sua atividade.
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Saldo Disponível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {financeData.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Disponível para saque via PIX
                </p>
                <Button className="mt-4 w-full bg-ap-orange hover:bg-ap-orange/90">
                  Solicitar Saque
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pagamentos Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {financeData.pendingPayments.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Serviços aguardando conclusão
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Serviços Realizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financeData.completedServices}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total de serviços concluídos
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Upcoming Appointments */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Próximos Atendimentos</h2>
              <Button variant="outline" onClick={() => {}}>
                Ver Todos
              </Button>
            </div>
            
            <div className="space-y-4">
              {appointments.filter(apt => apt.status === "pending").map((appointment) => (
                <Card key={appointment.id} className="overflow-hidden">
                  <div className="border-l-4 border-ap-orange p-4">
                    <div className="flex flex-col sm:flex-row justify-between">
                      <div>
                        <h3 className="font-medium">{appointment.clientName}</h3>
                        <p className="text-gray-600 text-sm">{appointment.service}</p>
                      </div>
                      <div className="mt-2 sm:mt-0 text-sm">
                        <div className="text-gray-700 font-medium">
                          {new Date(appointment.date).toLocaleDateString("pt-BR")} às {new Date(appointment.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {appointments.filter(apt => apt.status === "pending").length === 0 && (
                <div className="text-center py-8 bg-white rounded-lg border">
                  <p className="text-gray-600">Nenhum atendimento agendado.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Atividades Recentes</h2>
            </div>
            
            <div className="bg-white rounded-lg border p-4">
              <ul className="space-y-4 divide-y divide-gray-100">
                <li className="pt-4 first:pt-0">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium">Pagamento recebido</p>
                      <p className="text-xs text-gray-500">Você recebeu R$ 450,00 pelo serviço realizado para Ana Oliveira</p>
                      <p className="text-xs text-gray-400 mt-1">Há 2 dias</p>
                    </div>
                  </div>
                </li>
                <li className="pt-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium">Novo agendamento</p>
                      <p className="text-xs text-gray-500">João Santos agendou um serviço para 21/05/2023</p>
                      <p className="text-xs text-gray-400 mt-1">Ontem</p>
                    </div>
                  </div>
                </li>
                <li className="pt-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium">Serviço concluído</p>
                      <p className="text-xs text-gray-500">Você concluiu o serviço para Ana Oliveira</p>
                      <p className="text-xs text-gray-400 mt-1">Há 3 dias</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProDashboard;
