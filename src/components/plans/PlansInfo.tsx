import { Card } from "@/components/ui/card";
import { Users, Check, Star } from "lucide-react";

export const PlansInfo = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium">Como funciona</h4>
            <p className="text-sm text-muted-foreground">
              Forme um grupo e todos economizam
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium">Pagamento seguro</h4>
            <p className="text-sm text-muted-foreground">
              Pague apenas 10% de entrada via cartão ou PIX
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Star className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h4 className="font-medium">Profissionais qualificados</h4>
            <p className="text-sm text-muted-foreground">
              Apenas profissionais verificados e experientes
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};