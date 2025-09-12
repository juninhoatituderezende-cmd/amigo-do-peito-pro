import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, Filter, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportData {
  period: string;
  newMembers: number;
  revenue: number;
  completedGroups: number;
  conversionRate: number;
}

const mockReports: ReportData[] = [
  {
    period: "Janeiro 2024",
    newMembers: 45,
    revenue: 18000,
    completedGroups: 3,
    conversionRate: 87
  },
  {
    period: "Dezembro 2023",
    newMembers: 38,
    revenue: 15200,
    completedGroups: 2,
    conversionRate: 92
  },
  {
    period: "Novembro 2023",
    newMembers: 52,
    revenue: 20800,
    completedGroups: 4,
    conversionRate: 89
  }
];

interface InfluencerReport {
  id: string;
  name: string;
  referrals: number;
  commissions: number;
  conversionRate: number;
  status: "active" | "inactive";
}

const mockInfluencerReports: InfluencerReport[] = [
  {
    id: "1",
    name: "Amanda Ferreira",
    referrals: 23,
    commissions: 8500,
    conversionRate: 4.8,
    status: "active"
  },
  {
    id: "2",
    name: "Carlos Silva",
    referrals: 18,
    commissions: 6200,
    conversionRate: 3.2,
    status: "active"
  },
  {
    id: "3",
    name: "Ana Costa",
    referrals: 12,
    commissions: 4100,
    conversionRate: 2.1,
    status: "inactive"
  }
];

export const ReportsAnalytics = () => {
  const { toast } = useToast();
  const currentPeriod = mockReports[0];
  const previousPeriod = mockReports[1];

  const calculateGrowth = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100;
    return growth.toFixed(1);
  };

  const handleFilters = () => {
    toast({
      title: "Filtros",
      description: "Funcionalidade de filtros será implementada em breve.",
    });
  };

  const handleExportReports = () => {
    try {
      const headers = [
        'Período',
        'Novos Membros',
        'Receita (R$)',
        'Grupos Finalizados',
        'Taxa de Conversão (%)'
      ].join(',');

      const rows = mockReports.map(report => [
        `"${report.period}"`,
        report.newMembers,
        report.revenue,
        report.completedGroups,
        report.conversionRate
      ].join(','));

      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorios-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Exportação concluída!",
        description: "Relatórios exportados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os relatórios.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Novos Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPeriod.newMembers}</div>
            <p className="text-xs text-muted-foreground">
              +{calculateGrowth(currentPeriod.newMembers, previousPeriod.newMembers)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {currentPeriod.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{calculateGrowth(currentPeriod.revenue, previousPeriod.revenue)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grupos Finalizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPeriod.completedGroups}</div>
            <p className="text-xs text-muted-foreground">
              +{calculateGrowth(currentPeriod.completedGroups, previousPeriod.completedGroups)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPeriod.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Média de finalização
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatórios Mensais
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportReports}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockReports.map((report, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{report.period}</h4>
                  <Badge variant="secondary">
                    {report.conversionRate}% conversão
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Novos Membros</span>
                    <div className="font-medium">{report.newMembers}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Receita</span>
                    <div className="font-medium">R$ {report.revenue.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grupos Finalizados</span>
                    <div className="font-medium">{report.completedGroups}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taxa Conversão</span>
                    <div className="font-medium">{report.conversionRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Influencer Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance dos Influenciadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* TODO: Replace with real data source (admin view) */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};