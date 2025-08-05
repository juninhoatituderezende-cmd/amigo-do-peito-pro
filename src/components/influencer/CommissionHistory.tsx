import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Download, DollarSign } from "lucide-react";

interface Commission {
  id: string;
  customerName: string;
  service: string;
  value: number;
  commission: number;
  status: "pending" | "approved" | "paid";
  date: string;
}

const mockCommissions: Commission[] = [
  {
    id: "1",
    customerName: "Maria Silva",
    service: "Fechamento de braço",
    value: 4000,
    commission: 400,
    status: "paid",
    date: "2024-01-15"
  },
  {
    id: "2",
    customerName: "João Santos",
    service: "Prótese dentária (10 dentes)",
    value: 5000,
    commission: 500,
    status: "approved",
    date: "2024-01-20"
  },
  {
    id: "3",
    customerName: "Ana Costa",
    service: "Fechamento de perna",
    value: 6000,
    commission: 600,
    status: "pending",
    date: "2024-01-25"
  }
];

export const CommissionHistory = () => {
  const getStatusColor = (status: Commission["status"]) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "approved": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Commission["status"]) => {
    switch (status) {
      case "paid": return "Pago";
      case "approved": return "Aprovado";
      case "pending": return "Pendente";
      default: return "Desconhecido";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Comissões
          </CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockCommissions.map((commission) => (
            <div key={commission.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium">{commission.customerName}</h4>
                  <p className="text-sm text-muted-foreground">{commission.service}</p>
                </div>
                <Badge className={getStatusColor(commission.status)}>
                  {getStatusText(commission.status)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span>Valor: R$ {commission.value.toLocaleString()}</span>
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    R$ {commission.commission.toLocaleString()}
                  </span>
                </div>
                <span className="text-muted-foreground">{commission.date}</span>
              </div>
            </div>
          ))}
        </div>

        {mockCommissions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma comissão ainda.</p>
            <p className="text-sm">Suas comissões aparecerão aqui quando você fizer indicações!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};