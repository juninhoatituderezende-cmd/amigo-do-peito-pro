import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  price: number;
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    clientName: "Maria Silva",
    service: "Fechamento de braço",
    date: "2024-02-01",
    time: "14:00",
    duration: "3h",
    status: "scheduled",
    notes: "Primeira consulta - procedimento completo",
    price: 4000
  },
  {
    id: "2",
    clientName: "João Santos",
    service: "Prótese dentária",
    date: "2024-02-02",
    time: "09:00",
    duration: "2h",
    status: "scheduled",
    price: 5000
  },
  {
    id: "3",
    clientName: "Ana Costa",
    service: "Fechamento de perna",
    date: "2024-01-30",
    time: "16:00",
    duration: "4h",
    status: "completed",
    price: 6000
  }
];

export const AppointmentScheduler = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [selectedDate, setSelectedDate] = useState<string>("2024-02-01");
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({});
  const { toast } = useToast();

  const filteredAppointments = appointments.filter(apt => apt.date === selectedDate);

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Appointment["status"]) => {
    switch (status) {
      case "scheduled": return "Agendado";
      case "completed": return "Concluído";
      case "cancelled": return "Cancelado";
      default: return "Desconhecido";
    }
  };

  const handleCreateAppointment = () => {
    if (!newAppointment.clientName || !newAppointment.service || !newAppointment.date || !newAppointment.time) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      clientName: newAppointment.clientName!,
      service: newAppointment.service!,
      date: newAppointment.date!,
      time: newAppointment.time!,
      duration: newAppointment.duration || "2h",
      status: "scheduled",
      notes: newAppointment.notes,
      price: newAppointment.price || 0
    };

    setAppointments(prev => [...prev, appointment]);
    setNewAppointment({});
    setIsNewAppointmentOpen(false);
    
    toast({
      title: "Agendamento criado!",
      description: `Consulta de ${appointment.clientName} agendada para ${appointment.date} às ${appointment.time}.`,
    });
  };

  const updateAppointmentStatus = (id: string, status: Appointment["status"]) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === id ? { ...apt, status } : apt)
    );
    
    toast({
      title: "Status atualizado!",
      description: `Agendamento marcado como ${getStatusText(status).toLowerCase()}.`,
    });
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id));
    toast({
      title: "Agendamento removido",
      description: "O agendamento foi removido com sucesso.",
    });
  };

  // Generate next 7 days for quick selection
  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
      });
    }
    return days;
  };

  const totalRevenue = appointments
    .filter(apt => apt.status === "completed" && apt.date === selectedDate)
    .reduce((sum, apt) => sum + apt.price, 0);

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agenda - {new Date(selectedDate).toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
              <DialogTrigger asChild>
                <Button className="bg-ap-orange hover:bg-ap-orange/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Agendamento</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar um novo agendamento.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="clientName">Nome do Cliente *</Label>
                    <Input
                      id="clientName"
                      value={newAppointment.clientName || ""}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service">Serviço *</Label>
                    <Select onValueChange={(value) => setNewAppointment(prev => ({ ...prev, service: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fechamento de braço">Fechamento de braço</SelectItem>
                        <SelectItem value="Fechamento de perna">Fechamento de perna</SelectItem>
                        <SelectItem value="Fechamento de costas">Fechamento de costas</SelectItem>
                        <SelectItem value="Prótese dentária">Prótese dentária</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="date">Data *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newAppointment.date || ""}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Horário *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newAppointment.time || ""}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="duration">Duração</Label>
                      <Select onValueChange={(value) => setNewAppointment(prev => ({ ...prev, duration: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="2h" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1 hora</SelectItem>
                          <SelectItem value="2h">2 horas</SelectItem>
                          <SelectItem value="3h">3 horas</SelectItem>
                          <SelectItem value="4h">4 horas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="price">Valor (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newAppointment.price || ""}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, price: Number(e.target.value) }))}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={newAppointment.notes || ""}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notas adicionais sobre o agendamento"
                    />
                  </div>
                  <Button onClick={handleCreateAppointment} className="w-full">
                    Criar Agendamento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {getNextDays().map((day) => (
              <Button
                key={day.date}
                variant={selectedDate === day.date ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDate(day.date)}
                className="flex-shrink-0"
              >
                {day.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Agendamentos</p>
                <p className="text-xl font-bold">{filteredAppointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-xl font-bold">
                  {filteredAppointments.filter(apt => apt.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 text-green-500">R$</span>
              <div>
                <p className="text-sm text-muted-foreground">Receita do Dia</p>
                <p className="text-xl font-bold">R$ {totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum agendamento para este dia.</p>
                <p className="text-sm">Que tal criar um novo agendamento?</p>
              </div>
            ) : (
              filteredAppointments
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appointment) => (
                  <div key={appointment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="font-bold">{appointment.time}</div>
                          <div className="text-xs text-muted-foreground">{appointment.duration}</div>
                        </div>
                        <div>
                          <h4 className="font-medium">{appointment.clientName}</h4>
                          <p className="text-sm text-muted-foreground">{appointment.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">R$ {appointment.price.toLocaleString()}</span>
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusText(appointment.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mb-3 pl-16">
                        {appointment.notes}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 pl-16">
                      {appointment.status === "scheduled" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, "completed")}
                          >
                            Marcar como Concluído
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAppointment(appointment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};