import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, DollarSign, Award } from "lucide-react";

interface GroupData {
  id: string;
  name: string;
  members: number;
  totalPaid: number;
  currentValue: number;
  targetValue: number;
  status: "filling" | "contemplated" | "completed";
  contemplatedMember?: string;
  createdAt: string;
}

const mockGroups: GroupData[] = [];

export const GroupsOverview = () => {
  const getStatusColor = (status: GroupData["status"]) => {
    switch (status) {
      case "filling": return "bg-yellow-100 text-yellow-800";
      case "contemplated": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: GroupData["status"]) => {
    switch (status) {
      case "filling": return "Preenchendo";
      case "contemplated": return "Contemplado";
      case "completed": return "Finalizado";
      default: return "Desconhecido";
    }
  };

  const totalGroups = mockGroups.length;
  const activeGroups = mockGroups.filter(g => g.status === "filling").length;
  const totalMembers = mockGroups.reduce((sum, g) => sum + g.members, 0);
  const totalRevenue = mockGroups.reduce((sum, g) => sum + g.totalPaid, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGroups}</div>
            <p className="text-xs text-muted-foreground">
              {activeGroups} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Total de membros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Arrecadado nos grupos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Grupos completados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Grupos MLM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockGroups.map((group) => (
              <div key={group.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{group.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Criado em {group.createdAt}
                    </p>
                  </div>
                  <Badge className={getStatusColor(group.status)}>
                    {getStatusText(group.status)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm mb-3">
                  <div className="flex items-center gap-4">
                    <span>{group.members} membros</span>
                    <span>R$ {group.totalPaid.toLocaleString()} / R$ {group.targetValue.toLocaleString()}</span>
                  </div>
                  {group.contemplatedMember && (
                    <span className="text-green-600 font-medium">
                      Contemplado: {group.contemplatedMember}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-ap-orange h-2 rounded-full" 
                    style={{ width: `${(group.totalPaid / group.targetValue) * 100}%` }}
                  ></div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                  {group.status === "contemplated" && (
                    <Button variant="outline" size="sm">
                      Finalizar Grupo
                    </Button>
                  )}
                  {group.status === "filling" && group.members >= 10 && (
                    <Button size="sm" className="bg-ap-orange hover:bg-ap-orange/90">
                      Sortear Contemplado
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};