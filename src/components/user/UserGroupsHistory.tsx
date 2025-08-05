import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, DollarSign, Clock, Eye } from "lucide-react";

interface GroupParticipation {
  id: string;
  groupName: string;
  productName: string;
  joinDate: string;
  amountPaid: number;
  totalValue: number;
  status: "active" | "contemplated" | "completed" | "pending_payment";
  members: number;
  maxMembers: number;
  nextDrawDate?: string;
  position?: number;
}

const mockParticipations: GroupParticipation[] = [
  {
    id: "1",
    groupName: "Grupo Fechamento Braço #1",
    productName: "Fechamento de braço",
    joinDate: "2024-01-15",
    amountPaid: 400,
    totalValue: 4000,
    status: "active",
    members: 8,
    maxMembers: 10,
    nextDrawDate: "2024-02-01",
    position: 3
  },
  {
    id: "2",
    groupName: "Grupo Prótese Dental #2", 
    productName: "Prótese dentária (10 dentes)",
    joinDate: "2024-01-10",
    amountPaid: 500,
    totalValue: 5000,
    status: "contemplated",
    members: 10,
    maxMembers: 10,
    position: 1
  },
  {
    id: "3",
    groupName: "Grupo Fechamento Perna #3",
    productName: "Fechamento de perna",
    joinDate: "2024-01-05",
    amountPaid: 0,
    totalValue: 6000,
    status: "pending_payment",
    members: 5,
    maxMembers: 12,
    position: 5
  }
];

export const UserGroupsHistory = () => {
  const getStatusColor = (status: GroupParticipation["status"]) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800";
      case "contemplated": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "pending_payment": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: GroupParticipation["status"]) => {
    switch (status) {
      case "active": return "Ativo";
      case "contemplated": return "Contemplado";
      case "completed": return "Finalizado";
      case "pending_payment": return "Pagamento Pendente";
      default: return "Desconhecido";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalInvested = mockParticipations.reduce((sum, p) => sum + p.amountPaid, 0);
  const activeGroups = mockParticipations.filter(p => p.status === "active").length;
  const contemplatedGroups = mockParticipations.filter(p => p.status === "contemplated").length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Investido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-muted-foreground">
              Em {mockParticipations.length} grupos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Grupos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGroups}</div>
            <p className="text-xs text-muted-foreground">
              Participações ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contemplações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contemplatedGroups}</div>
            <p className="text-xs text-muted-foreground">
              Procedimentos ganhos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Grupos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockParticipations.map((group) => (
              <div key={group.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{group.groupName}</h4>
                    <p className="text-sm text-muted-foreground">{group.productName}</p>
                  </div>
                  <Badge className={getStatusColor(group.status)}>
                    {getStatusText(group.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">Posição:</span>
                    <div className="font-medium">#{group.position}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Membros:</span>
                    <div className="font-medium">{group.members}/{group.maxMembers}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pago:</span>
                    <div className="font-medium">{formatCurrency(group.amountPaid)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entrada em:</span>
                    <div className="font-medium">{group.joinDate}</div>
                  </div>
                </div>

                {/* Progress Bar for Active Groups */}
                {group.status === "active" && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso do grupo</span>
                      <span>{Math.round((group.members / group.maxMembers) * 100)}%</span>
                    </div>
                    <Progress value={(group.members / group.maxMembers) * 100} className="h-2" />
                  </div>
                )}

                {/* Next Draw Date */}
                {group.nextDrawDate && group.status === "active" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>Próximo sorteio: {group.nextDrawDate}</span>
                  </div>
                )}

                {/* Contemplated Message */}
                {group.status === "contemplated" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                    <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      Parabéns! Você foi contemplado neste grupo!
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Entre em contato conosco para agendar seu procedimento.
                    </p>
                  </div>
                )}

                {/* Pending Payment Warning */}
                {group.status === "pending_payment" && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Pagamento pendente
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      Complete seu pagamento para participar dos sorteios.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  {group.status === "pending_payment" && (
                    <Button size="sm" className="bg-ap-orange hover:bg-ap-orange/90">
                      Fazer Pagamento
                    </Button>
                  )}
                  {group.status === "contemplated" && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Agendar Procedimento
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {mockParticipations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não participou de nenhum grupo.</p>
              <p className="text-sm">Comece agora e concorra a procedimentos incríveis!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};