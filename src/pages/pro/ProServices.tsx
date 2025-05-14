
import { useState } from "react";
import ProSidebar from "../../components/pro/ProSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  images: string[];
  active: boolean;
}

interface CompletedService {
  id: string;
  serviceName: string;
  clientName: string;
  date: string;
  rating: number;
  review?: string;
  images: string[];
}

const ProServices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [isServiceDetailDialogOpen, setIsServiceDetailDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedCompletedService, setSelectedCompletedService] = useState<CompletedService | null>(null);
  
  const [newServiceForm, setNewServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    duration: "60",
    images: [] as File[],
  });
  
  // Mock data - would come from API in a real app
  const [services, setServices] = useState<Service[]>([
    {
      id: "1",
      name: user?.category === "tatuador" ? "Tatuagem Pequena" : "Avaliação Inicial",
      description: user?.category === "tatuador" 
        ? "Tatuagem de até 10cm em área simples. Inclui uma sessão de retoque se necessário."
        : "Avaliação completa e planejamento para lentes de contato dental.",
      price: user?.category === "tatuador" ? 250 : 150,
      duration: 60,
      images: ["/placeholder.svg"],
      active: true,
    },
    {
      id: "2",
      name: user?.category === "tatuador" ? "Tatuagem Média" : "Lentes de Contato (2 unidades)",
      description: user?.category === "tatuador"
        ? "Tatuagem de até 20cm em qualquer área do corpo. Inclui uma sessão de retoque se necessário."
        : "Procedimento completo para instalação de 2 lentes de contato dental.",
      price: user?.category === "tatuador" ? 500 : 1200,
      duration: 120,
      images: ["/placeholder.svg"],
      active: true,
    },
    {
      id: "3",
      name: user?.category === "tatuador" ? "Tatuagem Grande" : "Lentes de Contato (6 unidades)",
      description: user?.category === "tatuador"
        ? "Tatuagem de grande porte, acima de 20cm. Pode requerer múltiplas sessões."
        : "Procedimento completo para instalação de 6 lentes de contato dental.",
      price: user?.category === "tatuador" ? 1200 : 3200,
      duration: 240,
      images: ["/placeholder.svg"],
      active: false,
    },
  ]);
  
  const [completedServices, setCompletedServices] = useState<CompletedService[]>([
    {
      id: "cs1",
      serviceName: user?.category === "tatuador" ? "Tatuagem Média" : "Lentes de Contato (2 unidades)",
      clientName: "Maria Silva",
      date: "2023-05-15",
      rating: 5,
      review: "Serviço excelente! Super profissional e atencioso.",
      images: ["/placeholder.svg"],
    },
    {
      id: "cs2",
      serviceName: user?.category === "tatuador" ? "Tatuagem Pequena" : "Avaliação Inicial",
      clientName: "João Santos",
      date: "2023-05-12",
      rating: 4,
      images: ["/placeholder.svg", "/placeholder.svg"],
    },
    {
      id: "cs3",
      serviceName: user?.category === "tatuador" ? "Tatuagem Grande" : "Lentes de Contato (6 unidades)",
      clientName: "Ana Oliveira",
      date: "2023-05-10",
      rating: 5,
      review: "Resultado incrível! Recomendo a todos.",
      images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    },
  ]);
  
  const handleNewServiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewServiceForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files) {
      setNewServiceForm(prev => ({ ...prev, images: Array.from(files) }));
    }
  };
  
  const handleAddService = () => {
    // In a real app, this would make an API call to add the service
    const newService: Service = {
      id: `${services.length + 1}`,
      name: newServiceForm.name,
      description: newServiceForm.description,
      price: parseFloat(newServiceForm.price),
      duration: parseInt(newServiceForm.duration),
      images: newServiceForm.images.map(_ => "/placeholder.svg"),
      active: true,
    };
    
    setServices(prev => [...prev, newService]);
    setIsAddServiceDialogOpen(false);
    setNewServiceForm({
      name: "",
      description: "",
      price: "",
      duration: "60",
      images: [],
    });
    
    toast({
      title: "Serviço adicionado",
      description: "O serviço foi adicionado com sucesso!",
    });
  };
  
  const handleToggleServiceStatus = (id: string) => {
    setServices(prev => prev.map(service => 
      service.id === id ? { ...service, active: !service.active } : service
    ));
    
    const service = services.find(s => s.id === id);
    
    toast({
      title: service?.active ? "Serviço desativado" : "Serviço ativado",
      description: service?.active 
        ? "O serviço foi desativado e não aparecerá para novos clientes."
        : "O serviço foi ativado e já está disponível para novos clientes.",
    });
  };
  
  const handleServiceClick = (id: string) => {
    setSelectedServiceId(id);
    setIsServiceDetailDialogOpen(true);
  };
  
  const handleCompletedServiceClick = (service: CompletedService) => {
    setSelectedCompletedService(service);
  };
  
  const getSelectedService = () => {
    return services.find(service => service.id === selectedServiceId);
  };
  
  // Helper function to render rating stars
  const renderRatingStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <svg
        key={index}
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-400" : "text-gray-300"
        }`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <ProSidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Meus Serviços</h1>
              <p className="text-gray-600">Gerencie os serviços que você oferece</p>
            </div>
            
            <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0 bg-ap-orange hover:bg-ap-orange/90">
                  Adicionar Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Novo Serviço</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="name">Nome do Serviço</Label>
                    <Input
                      id="name"
                      name="name"
                      value={newServiceForm.name}
                      onChange={handleNewServiceChange}
                      placeholder="Ex: Tatuagem Pequena"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={newServiceForm.description}
                      onChange={handleNewServiceChange}
                      placeholder="Descreva o serviço, o que está incluído, etc."
                      className="w-full p-2 border rounded-md h-20"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Preço (R$)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        value={newServiceForm.price}
                        onChange={handleNewServiceChange}
                        placeholder="Ex: 250.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duração (minutos)</Label>
                      <select
                        id="duration"
                        name="duration"
                        value={newServiceForm.duration}
                        onChange={handleNewServiceChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="30">30 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="90">1 hora e 30 minutos</option>
                        <option value="120">2 horas</option>
                        <option value="180">3 horas</option>
                        <option value="240">4 horas</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="images">Imagens (até 5)</Label>
                    <Input
                      id="images"
                      name="images"
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*"
                      multiple
                      max={5}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Adicione imagens ilustrativas do serviço.
                    </p>
                  </div>
                  
                  <div className="mt-6 text-right">
                    <Button
                      onClick={handleAddService}
                      className="bg-ap-orange hover:bg-ap-orange/90"
                      disabled={!newServiceForm.name || !newServiceForm.price}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isServiceDetailDialogOpen} onOpenChange={setIsServiceDetailDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{getSelectedService()?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {getSelectedService() && (
                    <>
                      <p className="text-gray-600">{getSelectedService()?.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong className="text-gray-800">Preço:</strong>
                          <p className="text-gray-600">
                            R$ {getSelectedService()?.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <strong className="text-gray-800">Duração:</strong>
                          <p className="text-gray-600">
                            {getSelectedService()?.duration} minutos
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <strong className="text-gray-800">Imagens:</strong>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {getSelectedService()?.images.map((img, index) => (
                            <div key={index} className="h-24 bg-gray-100 rounded-md overflow-hidden">
                              <img 
                                src={img} 
                                alt={`${getSelectedService()?.name} - imagem ${index + 1}`}
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-between">
                        <Button
                          onClick={() => handleToggleServiceStatus(selectedServiceId)}
                          variant={getSelectedService()?.active ? "destructive" : "default"}
                        >
                          {getSelectedService()?.active ? "Desativar Serviço" : "Ativar Serviço"}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => setIsServiceDetailDialogOpen(false)}
                        >
                          Fechar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Services List */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Serviços Oferecidos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                <Card 
                  key={service.id}
                  className={`overflow-hidden cursor-pointer transition-all ${
                    !service.active && "opacity-60"
                  }`}
                  onClick={() => handleServiceClick(service.id)}
                >
                  <div className="h-40 bg-gray-100 overflow-hidden">
                    {service.images.length > 0 && (
                      <img 
                        src={service.images[0]} 
                        alt={service.name}
                        className="w-full h-full object-cover" 
                      />
                    )}
                  </div>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      <Badge variant={service.active ? "default" : "outline"}>
                        {service.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {service.description}
                    </p>
                    <div className="flex justify-between">
                      <div className="text-sm">
                        <strong>R$ {service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div className="text-sm text-gray-500">
                        {service.duration} min
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Completed Services */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Serviços Realizados</h2>
            
            {completedServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedServices.map(service => (
                  <Card 
                    key={service.id}
                    className="overflow-hidden cursor-pointer"
                    onClick={() => handleCompletedServiceClick(service)}
                  >
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      {service.images.length > 0 && (
                        <img 
                          src={service.images[0]} 
                          alt={service.serviceName}
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{service.serviceName}</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        Cliente: {service.clientName}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {new Date(service.date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex">
                          {renderRatingStars(service.rating)}
                        </div>
                      </div>
                      {service.review && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{service.review}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-md border p-8 text-center">
                <p className="text-gray-500">Nenhum serviço realizado ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProServices;
