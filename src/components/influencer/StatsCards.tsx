import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Eye } from "lucide-react";

interface StatsCardsProps {
  totalEarnings: number;
  pendingEarnings: number;
  totalReferrals: number;
  conversionRate: number;
  clicksThisMonth: number;
}

export const StatsCards = ({ 
  totalEarnings, 
  pendingEarnings, 
  totalReferrals, 
  conversionRate,
  clicksThisMonth 
}: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Ganho</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {totalEarnings.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Comissões acumuladas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendente</CardTitle>
          <DollarSign className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {pendingEarnings.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando aprovação
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Indicações</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalReferrals}</div>
          <p className="text-xs text-muted-foreground">
            Total de conversões
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {clicksThisMonth} cliques este mês
          </p>
        </CardContent>
      </Card>
    </div>
  );
};