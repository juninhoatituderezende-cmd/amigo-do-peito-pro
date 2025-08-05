import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, DollarSign, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";

interface FinancialData {
  period: string;
  revenue: number;
  appointments: number;
  averageTicket: number;
  growth: number;
}

const mockFinancialData: FinancialData[] = [
  {
    period: "Janeiro 2024",
    revenue: 18500,
    appointments: 12,
    averageTicket: 1542,
    growth: 15.2
  },
  {
    period: "Dezembro 2023", 
    revenue: 16100,
    appointments: 10,
    averageTicket: 1610,
    growth: 8.7
  },
  {
    period: "Novembro 2023",
    revenue: 14800,
    appointments: 9,
    averageTicket: 1644,
    growth: -2.1
  }
];

export const FinancialReports = () => {
  const currentPeriod = mockFinancialData[0];
  const previousPeriod = mockFinancialData[1];
  
  const totalRevenue = mockFinancialData.reduce((sum, data) => sum + data.revenue, 0);
  const totalAppointments = mockFinancialData.reduce((sum, data) => sum + data.appointments, 0);
  const averageMonthlyRevenue = totalRevenue / mockFinancialData.length;

  const calculateGrowth = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100;
    return growth.toFixed(1);
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  const monthlyGoal = 20000;
  const goalProgress = (currentPeriod.revenue / monthlyGoal) * 100;

  return (
    <div className="space-y-6">
      {/* Current Month Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Receita do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {currentPeriod.revenue.toLocaleString()}</div>
            <p className={`text-xs ${getGrowthColor(currentPeriod.growth)}`}>
              {currentPeriod.growth >= 0 ? "+" : ""}{currentPeriod.growth}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPeriod.appointments}</div>
            <p className={`text-xs ${getGrowthColor(
              Number(calculateGrowth(currentPeriod.appointments, previousPeriod.appointments))
            )}`}>
              +{calculateGrowth(currentPeriod.appointments, previousPeriod.appointments)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {currentPeriod.averageTicket.toLocaleString()}</div>
            <p className={`text-xs ${getGrowthColor(
              Number(calculateGrowth(currentPeriod.averageTicket, previousPeriod.averageTicket))
            )}`}>
              {calculateGrowth(currentPeriod.averageTicket, previousPeriod.averageTicket)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Meta Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(goalProgress)}%</div>
            <Progress value={goalProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              R$ {(monthlyGoal - currentPeriod.revenue).toLocaleString()} restantes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historical Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Histórica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockFinancialData.map((data, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{data.period}</h4>
                  <Badge 
                    variant="secondary"
                    className={data.growth >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {data.growth >= 0 ? "+" : ""}{data.growth}%
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Receita</span>
                    <div className="font-medium">R$ {data.revenue.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Atendimentos</span>
                    <div className="font-medium">{data.appointments}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ticket Médio</span>
                    <div className="font-medium">R$ {data.averageTicket.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receita Total (3 meses)</span>
              <span className="font-medium">R$ {totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Média Mensal</span>
              <span className="font-medium">R$ {Math.round(averageMonthlyRevenue).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de Atendimentos</span>
              <span className="font-medium">{totalAppointments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticket Médio Geral</span>
              <span className="font-medium">R$ {Math.round(totalRevenue / totalAppointments).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Próximas Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 text-sm font-medium mb-1">
                <Clock className="h-4 w-4" />
                Meta Atual (Janeiro)
              </div>
              <div className="text-sm text-blue-600">
                Atingir R$ 20.000 em receita
              </div>
              <Progress value={goalProgress} className="mt-2 h-2" />
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-gray-800 text-sm font-medium mb-1">
                <TrendingUp className="h-4 w-4" />
                Meta Trimestral
              </div>
              <div className="text-sm text-gray-600">
                Manter crescimento de 10% ao mês
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 text-sm font-medium mb-1">
                <Users className="h-4 w-4" />
                Meta de Atendimentos
              </div>
              <div className="text-sm text-green-600">
                15 atendimentos por mês
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};