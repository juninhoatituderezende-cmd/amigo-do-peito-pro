
import { useState } from "react";
import ProSidebar from "../../components/pro/ProSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "completed" | "canceled";
  notes?: string;
}

interface TimeSlot {
  id: string;
  day: string;
  time: string;
  status: "available" | "booked";
}

const ProSchedule = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [availabilityForm, setAvailabilityForm] = useState({
    day: "monday",
    startTime: "09:00",
    endTime: "18:00",
    interval: "60",
  });
  
  // Mock data - would come from API in real app
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "1",
      clientName: "Maria Silva",
      service: "Tatuagem Braço",
      date: "2023-05-20",
      time: "14:00",
      status: "confirmed",
    },
    {
      id: "2",
      clientName: "João Santos",
      service: "Tatuagem Pequena",
      date: "2023-05-21",
      time: "10:30",
      status: "confirmed",
    },
    {
      id: "3",
      clientName: "Ana Oliveira",
      service: "Lentes de Contato Dental",
      date: "2023-05-18",
      time: "16:00",
      status: "completed",
      notes: "Cliente satisfeito com o resultado."
    },
    {
      id: "4",
      clientName: "Pedro Lima",
      service: "Avaliação Dental",
      date: "2023-05-19",
      time: "09:00",
      status: "canceled",
    },
  ]);
  
  // Mock data for availability
  const [availability, setAvailability] = useState<TimeSlot[]>([
    { id: "1", day: "monday", time: "09:00", status: "available" },
    { id: "2", day: "monday", time: "10:00", status: "available" },
    { id: "3", day: "monday", time: "11:00", status: "available" },
    { id: "4", day: "monday", time: "14:00", status: "available" },
    { id: "5", day: "monday", time: "15:00", status: "available" },
    { id: "6", day: "monday", time: "16:00", status: "available" },
    { id: "7", day: "tuesday", time: "09:00", status: "available" },
    { id: "8", day: "tuesday", time: "10:00", status: "available" },
    { id: "9", day: "tuesday", time: "11:00", status: "available" },
    { id: "10", day: "wednesday", time: "14:00", status: "available" },
    { id: "11", day: "wednesday", time: "15:00", status: "available" },
    { id: "12", day: "wednesday", time: "16:00", status: "available" },
    { id: "13", day: "thursday", time: "09:00", status: "available" },
    { id: "14", day: "thursday", time: "10:00", status: "available" },
    { id: "15", day: "friday", time: "14:00", status: "available" },
    { id: "16", day: "friday", time: "15:00", status: "available" },
    { id: "17", day: "friday", time: "16:00", status: "available" },
  ]);
  
  // Helper functions for the calendar
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const generateCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: 0, hasAppointment: false });
    }
    
    // Add cells for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
      // Check if there are any appointments for this day
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hasAppointment = appointments.some(apt => apt.date === dateStr);
      
      days.push({ day: i, hasAppointment });
    }
    
    return days;
  };
  
  const handleDayClick = (day: number) => {
    if (day === 0) return;
    
    const today = new Date();
    const newDate = new Date(today.getFullYear(), today.getMonth(), day);
    setSelectedDate(newDate);
  };
  
  const handleAvailabilityChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setAvailabilityForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddAvailability = () => {
    // In a real app, this would make an API call to add the availability
    toast({
      title: "Disponibilidade adicionada",
      description: "Os horários foram adicionados ao seu calendário.",
    });
    setIsAvailabilityDialogOpen(false);
  };
  
  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };
  
  const handleCancelAppointment = (id: string) => {
    // In a real app, this would make an API call to cancel the appointment
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status: "canceled" } : apt
    ));
    
    toast({
      title: "Agendamento cancelado",
      description: "O agendamento foi cancelado com sucesso.",
    });
  };
  
  const handleCompleteAppointment = (id: string) => {
    // In a real app, this would make an API call to mark the appointment as completed
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status: "completed" } : apt
    ));
    
    toast({
      title: "Atendimento concluído",
      description: "O atendimento foi marcado como concluído.",
    });
  };
  
  const getDayName = (dayNumber: number): string => {
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return days[dayNumber];
  };
  
  const getMonthName = (monthNumber: number): string => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[monthNumber];
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <ProSidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Agenda</h1>
              <p className="text-gray-600">Gerencie seus horários e atendimentos</p>
            </div>
            
            <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0 bg-ap-orange hover:bg-ap-orange/90">
                  Adicionar Disponibilidade
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Disponibilidade</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="day" className="block text-sm font-medium mb-1">
                        Dia da Semana
                      </label>
                      <select
                        id="day"
                        name="day"
                        value={availabilityForm.day}
                        onChange={handleAvailabilityChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="monday">Segunda-feira</option>
                        <option value="tuesday">Terça-feira</option>
                        <option value="wednesday">Quarta-feira</option>
                        <option value="thursday">Quinta-feira</option>
                        <option value="friday">Sexta-feira</option>
                        <option value="saturday">Sábado</option>
                        <option value="sunday">Domingo</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="interval" className="block text-sm font-medium mb-1">
                        Intervalo (minutos)
                      </label>
                      <select
                        id="interval"
                        name="interval"
                        value={availabilityForm.interval}
                        onChange={handleAvailabilityChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="30">30 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="90">1 hora e 30 minutos</option>
                        <option value="120">2 horas</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium mb-1">
                        Hora Inicial
                      </label>
                      <input
                        id="startTime"
                        name="startTime"
                        type="time"
                        value={availabilityForm.startTime}
                        onChange={handleAvailabilityChange}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium mb-1">
                        Hora Final
                      </label>
                      <input
                        id="endTime"
                        name="endTime"
                        type="time"
                        value={availabilityForm.endTime}
                        onChange={handleAvailabilityChange}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 text-right">
                    <Button
                      onClick={handleAddAvailability}
                      className="bg-ap-orange hover:bg-ap-orange/90"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 max-w-md mb-4">
              <TabsTrigger value="calendar">Calendário</TabsTrigger>
              <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle>
                      {getMonthName(new Date().getMonth())} {new Date().getFullYear()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, i) => (
                        <div key={i} className="text-center font-medium text-gray-500 text-sm">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {generateCalendarDays().map((day, i) => (
                        <button
                          key={i}
                          className={`
                            h-12 flex items-center justify-center rounded-md 
                            ${day.day === 0 ? "bg-transparent cursor-default" : "hover:bg-gray-100"}
                            ${day.hasAppointment ? "border-2 border-ap-orange" : ""}
                            ${selectedDate && day.day === selectedDate.getDate() ? "bg-ap-light-orange" : "bg-white"}
                          `}
                          onClick={() => handleDayClick(day.day)}
                          disabled={day.day === 0}
                        >
                          {day.day > 0 && day.day}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>
                      {selectedDate && (
                        <>
                          {getDayName(selectedDate.getDay())}, {selectedDate.getDate()} de {getMonthName(selectedDate.getMonth())}
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDate && getAppointmentsForDate(selectedDate).length > 0 ? (
                      <div className="space-y-4">
                        {getAppointmentsForDate(selectedDate).map(apt => (
                          <div 
                            key={apt.id} 
                            className={`
                              p-3 rounded-md 
                              ${apt.status === 'completed' ? 'bg-green-50' : 
                                apt.status === 'canceled' ? 'bg-red-50' : 'bg-blue-50'}
                            `}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{apt.clientName}</h3>
                                <p className="text-sm text-gray-600">
                                  {apt.service} - {apt.time}
                                </p>
                                {apt.notes && (
                                  <p className="text-xs text-gray-500 mt-1 italic">
                                    Nota: {apt.notes}
                                  </p>
                                )}
                              </div>
                              <span 
                                className={`
                                  px-2 py-1 text-xs rounded-full 
                                  ${apt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                                    apt.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                    apt.status === 'canceled' ? 'bg-red-100 text-red-800' : 
                                    'bg-yellow-100 text-yellow-800'}
                                `}
                              >
                                {apt.status === 'confirmed' ? 'Confirmado' : 
                                  apt.status === 'completed' ? 'Concluído' : 
                                  apt.status === 'canceled' ? 'Cancelado' : 'Pendente'}
                              </span>
                            </div>
                            
                            {apt.status === 'confirmed' && (
                              <div className="mt-3 flex space-x-2">
                                <Button 
                                  onClick={() => handleCompleteAppointment(apt.id)}
                                  className="text-xs py-1 h-auto bg-green-600 hover:bg-green-700 flex-1"
                                >
                                  Completar
                                </Button>
                                <Button 
                                  onClick={() => handleCancelAppointment(apt.id)}
                                  variant="outline" 
                                  className="text-xs py-1 h-auto border-red-500 text-red-500 hover:bg-red-50 flex-1"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          {selectedDate ? "Nenhum agendamento para este dia." : "Selecione um dia para ver os agendamentos."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="availability" className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Minha Disponibilidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => {
                      const daySlots = availability.filter(slot => slot.day === day);
                      const dayName = {
                        monday: "Segunda-feira",
                        tuesday: "Terça-feira",
                        wednesday: "Quarta-feira",
                        thursday: "Quinta-feira",
                        friday: "Sexta-feira",
                        saturday: "Sábado",
                        sunday: "Domingo",
                      }[day];
                      
                      return (
                        <div key={day}>
                          <h3 className="font-medium mb-2">{dayName}</h3>
                          {daySlots.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {daySlots.map(slot => (
                                <div 
                                  key={slot.id}
                                  className="bg-white border border-gray-200 rounded-md p-2 text-center"
                                >
                                  {slot.time}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Nenhum horário disponível.</p>
                          )}
                        </div>
                      );
                    })}
                    
                    <div className="text-center mt-8">
                      <Button 
                        onClick={() => setIsAvailabilityDialogOpen(true)}
                        className="bg-ap-orange hover:bg-ap-orange/90"
                      >
                        Adicionar Novos Horários
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProSchedule;
