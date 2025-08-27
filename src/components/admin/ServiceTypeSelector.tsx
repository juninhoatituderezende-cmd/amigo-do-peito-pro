import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, Shield, Palette, Sparkles, User, Plus } from "lucide-react";

interface ServiceType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  table: string;
  color: string;
}

const SERVICE_TYPES: ServiceType[] = [
  {
    id: 'tatuador',
    name: 'Planos de Tatuagem',
    description: 'Serviços de tatuagem e arte corporal',
    icon: <Scissors className="h-8 w-8" />,
    table: 'planos_tatuador',
    color: 'bg-gradient-to-br from-red-500 to-pink-600'
  },
  {
    id: 'dentista',
    name: 'Planos Odontológicos',
    description: 'Serviços dentários e ortodônticos',
    icon: <Shield className="h-8 w-8" />,
    table: 'planos_dentista',
    color: 'bg-gradient-to-br from-blue-500 to-cyan-600'
  },
  {
    id: 'cabelo',
    name: 'Planos Capilares',
    description: 'Cortes e tratamentos capilares',
    icon: <Sparkles className="h-8 w-8" />,
    table: 'planos_cabelo',
    color: 'bg-gradient-to-br from-green-500 to-emerald-600'
  },
  {
    id: 'barba',
    name: 'Planos de Barbearia',
    description: 'Serviços de barba e cuidados masculinos',
    icon: <User className="h-8 w-8" />,
    table: 'planos_barba',
    color: 'bg-gradient-to-br from-amber-500 to-orange-600'
  },
  {
    id: 'implante',
    name: 'Implante Capilar',
    description: 'Tratamentos de implante e restauração capilar',
    icon: <Palette className="h-8 w-8" />,
    table: 'planos_implante_capilar',
    color: 'bg-gradient-to-br from-purple-500 to-violet-600'
  }
];

interface ServiceTypeSelectorProps {
  onSelectType: (serviceType: ServiceType) => void;
}

export function ServiceTypeSelector({ onSelectType }: ServiceTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Gerenciar Planos de Serviço</h2>
        <p className="text-muted-foreground mt-2">
          Selecione o tipo de serviço para gerenciar seus planos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICE_TYPES.map((serviceType) => (
          <Card 
            key={serviceType.id} 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
            onClick={() => onSelectType(serviceType)}
          >
            <CardHeader className="text-center pb-2">
              <div className={`w-16 h-16 mx-auto rounded-full ${serviceType.color} flex items-center justify-center text-white mb-4`}>
                {serviceType.icon}
              </div>
              <CardTitle className="text-xl">{serviceType.name}</CardTitle>
              <CardDescription className="text-sm">
                {serviceType.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className="w-full"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectType(serviceType);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Gerenciar Planos
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}