import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removido DatePicker pois não está implementado
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Download,
  Calendar,
  FileText,
  PieChart,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReportData {
  totalUsers: number;
  totalProfessionals: number;
  totalInfluencers: number;
  totalRevenue: number;
  monthlyGrowth: number;
  activeGroups: number;
  completedContemplations: number;
  pendingPayments: number;
}

interface ChartData {
  name: string;
  users: number;
  professionals: number;
  influencers: number;
  revenue: number;
}

export default function AdminRelatorios() {
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: 0,
    totalProfessionals: 0,
    totalInfluencers: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    activeGroups: 0,
    completedContemplations: 0,
    pendingPayments: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      // Carregar contadores básicos
      const [usersResult, professionalsResult, influencersResult, transactionsResult] = await Promise.all([
        supabase.from('users').select('id, created_at', { count: 'exact' }),
        supabase.from('professionals').select('id, created_at', { count: 'exact' }),
        supabase.from('influencers').select('id, created_at', { count: 'exact' }),
        supabase.from('transactions').select('amount, created_at, status')
      ]);

      // Calcular métricas
      const totalUsers = usersResult.count || 0;
      const totalProfessionals = professionalsResult.count || 0;
      const totalInfluencers = influencersResult.count || 0;
      
      const transactions = transactionsResult.data || [];
      const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Calcular crescimento mensal
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const recentUsers = usersResult.data?.filter(u => 
        new Date(u.created_at) > lastMonth
      ).length || 0;
      
      const monthlyGrowth = totalUsers > 0 ? (recentUsers / totalUsers) * 100 : 0;

      // Gerar dados do gráfico (últimos 7 dias)
      const chartData: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayUsers = usersResult.data?.filter(u => 
          u.created_at.startsWith(dateStr)
        ).length || 0;
        
        const dayProfessionals = professionalsResult.data?.filter(p => 
          p.created_at.startsWith(dateStr)
        ).length || 0;
        
        const dayInfluencers = influencersResult.data?.filter(i => 
          i.created_at.startsWith(dateStr)
        ).length || 0;
        
        const dayRevenue = transactions
          .filter(t => t.created_at.startsWith(dateStr) && t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        chartData.push({
          name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          users: dayUsers,
          professionals: dayProfessionals,
          influencers: dayInfluencers,
          revenue: dayRevenue
        });
      }

      setReportData({
        totalUsers,
        totalProfessionals,
        totalInfluencers,
        totalRevenue,
        monthlyGrowth,
        activeGroups: 12, // Mock data
        completedContemplations: 8, // Mock data
        pendingPayments: 5 // Mock data
      });

      setChartData(chartData);

    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvData = [
      ['Métrica', 'Valor'],
      ['Total de Usuários', reportData.totalUsers.toString()],
      ['Total de Profissionais', reportData.totalProfessionals.toString()],
      ['Total de Influenciadores', reportData.totalInfluencers.toString()],
      ['Receita Total (R$)', reportData.totalRevenue.toString()],
      ['Crescimento Mensal (%)', reportData.monthlyGrowth.toFixed(2)],
      ['Grupos Ativos', reportData.activeGroups.toString()],
      ['Contemplações Completadas', reportData.completedContemplations.toString()],
      ['Pagamentos Pendentes', reportData.pendingPayments.toString()]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Relatório exportado",
      description: "Relatório foi exportado com sucesso.",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios e Analytics</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho da plataforma e métricas importantes
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Usuários</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.totalUsers}</p>
                <p className="text-xs text-green-600">+{reportData.monthlyGrowth.toFixed(1)}% este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData.totalRevenue)}
                </p>
                <p className="text-xs text-green-600">+12.5% este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profissionais</p>
                <p className="text-2xl font-bold text-orange-600">{reportData.totalProfessionals}</p>
                <p className="text-xs text-green-600">+8.2% este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Influenciadores</p>
                <p className="text-2xl font-bold text-purple-600">{reportData.totalInfluencers}</p>
                <p className="text-xs text-green-600">+15.3% este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cadastros por Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Novos Cadastros (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{data.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-blue-600">{data.users} usuários</div>
                    <div className="text-sm text-orange-600">{data.professionals} profissionais</div>
                    <div className="text-sm text-purple-600">{data.influencers} influenciadores</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Métricas Operacionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Métricas Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Grupos Ativos</span>
                <span className="text-2xl font-bold text-blue-600">{reportData.activeGroups}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Contemplações Completadas</span>
                <span className="text-2xl font-bold text-green-600">{reportData.completedContemplations}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">Pagamentos Pendentes</span>
                <span className="text-2xl font-bold text-orange-600">{reportData.pendingPayments}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios Detalhados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span>Relatório de Usuários</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <DollarSign className="h-6 w-6 mb-2" />
              <span>Relatório Financeiro</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>Relatório de Performance</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}