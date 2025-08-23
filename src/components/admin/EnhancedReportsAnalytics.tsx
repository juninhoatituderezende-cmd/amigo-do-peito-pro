import { useState, useEffect } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Award,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Target,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

// Mock data for demonstration
const mockSalesData = [
  { month: 'Jan', vendas: 45000, usuarios: 120, comissoes: 4500, grupos: 8 },
  { month: 'Fev', vendas: 52000, usuarios: 145, comissoes: 5200, grupos: 12 },
  { month: 'Mar', vendas: 48000, usuarios: 132, comissoes: 4800, grupos: 10 },
  { month: 'Abr', vendas: 61000, usuarios: 178, comissoes: 6100, grupos: 15 },
  { month: 'Mai', vendas: 55000, usuarios: 156, comissoes: 5500, grupos: 13 },
  { month: 'Jun', vendas: 67000, usuarios: 189, comissoes: 6700, grupos: 18 }
];

const mockTopProducts = [
  { name: 'Harmonização Facial', vendas: 125, receita: 87500, crescimento: 15 },
  { name: 'Botox Premium', vendas: 89, receita: 62300, crescimento: 8 },
  { name: 'Preenchimento Labial', vendas: 76, receita: 53200, crescimento: -3 },
  { name: 'Limpeza de Pele', vendas: 156, receita: 46800, crescimento: 22 },
  { name: 'Peeling Químico', vendas: 45, receita: 31500, crescimento: 12 }
];

const mockActiveUsers = [
  { name: 'Maria Silva', participacoes: 8, comissoes: 750, nivel: 'Gold' },
  { name: 'João Santos', participacoes: 12, comissoes: 1200, nivel: 'Platinum' },
  { name: 'Ana Costa', participacoes: 6, comissoes: 450, nivel: 'Silver' },
  { name: 'Pedro Lima', participacoes: 15, comissoes: 1800, nivel: 'Diamond' },
  { name: 'Clara Oliveira', participacoes: 9, comissoes: 900, nivel: 'Gold' }
];

const mockGroupsData = [
  { status: 'Formando', count: 8, value: 45600 },
  { status: 'Em Andamento', count: 12, value: 78400 },
  { status: 'Concluídos', count: 25, value: 156800 },
  { status: 'Cancelados', count: 3, value: 12300 }
];

const mockCommissionsData = [
  { tipo: 'Indicação Direta', valor: 12500, quantidade: 45, status: 'Pago' },
  { tipo: 'Indicação Indireta', valor: 8900, quantidade: 32, status: 'Pago' },
  { tipo: 'Bônus de Grupo', valor: 6700, quantidade: 18, status: 'Pendente' },
  { tipo: 'Bônus de Performance', valor: 4200, quantidade: 12, status: 'Processando' }
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

interface EnhancedReportsAnalyticsProps {
  className?: string;
}

export const EnhancedReportsAnalytics = ({ className }: EnhancedReportsAnalyticsProps) => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedMetric, setSelectedMetric] = useState('vendas');
  const [selectedRegion, setSelectedRegion] = useState('todas');
  const { toast } = useToast();

  const handleExportData = (type: 'csv' | 'pdf') => {
    toast({
      title: `Export ${type.toUpperCase()} iniciado`,
      description: `Gerando relatório em formato ${type.toUpperCase()}...`,
    });
    
    // Simulate export
    setTimeout(() => {
      toast({
        title: "Export concluído",
        description: `Relatório ${type.toUpperCase()} foi baixado com sucesso.`,
      });
    }, 2000);
  };

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast({
      title: "Dados atualizados",
      description: "Relatórios foram atualizados com os dados mais recentes.",
    });
  };

  // Calculate key metrics
  const totalSales = mockSalesData.reduce((acc, item) => acc + item.vendas, 0);
  const totalUsers = mockSalesData[mockSalesData.length - 1].usuarios;
  const totalCommissions = mockSalesData.reduce((acc, item) => acc + item.comissoes, 0);
  const totalGroups = mockGroupsData.reduce((acc, item) => acc + item.count, 0);

  const conversionRate = ((totalGroups / totalUsers) * 100).toFixed(1);
  const avgOrderValue = totalSales / totalUsers;
  const growthRate = ((mockSalesData[mockSalesData.length - 1].vendas - mockSalesData[0].vendas) / mockSalesData[0].vendas * 100).toFixed(1);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6" />
                Relatórios Avançados & Analytics
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Dashboard completo com métricas detalhadas e insights de negócio
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportData('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportData('pdf')}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Data Final</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>

            {/* Metric Filter */}
            <div>
              <Label>Métrica Principal</Label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="usuarios">Usuários</SelectItem>
                  <SelectItem value="comissoes">Comissões</SelectItem>
                  <SelectItem value="grupos">Grupos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Region Filter */}
            <div>
              <Label>Região</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Regiões</SelectItem>
                  <SelectItem value="sudeste">Sudeste</SelectItem>
                  <SelectItem value="sul">Sul</SelectItem>
                  <SelectItem value="nordeste">Nordeste</SelectItem>
                  <SelectItem value="norte">Norte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Vendas Totais
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalSales)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">
                    +{growthRate}% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Usuários Ativos
                </p>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500">
                    +12% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Taxa de Conversão
                </p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-purple-500" />
                  <span className="text-xs text-purple-500">
                    +2.1% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ticket Médio
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(avgOrderValue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">
                    -1.2% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockSalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#8884d8" 
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Groups Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Grupos MLM</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockGroupsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {mockGroupsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Análises Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="products">Top Produtos</TabsTrigger>
              <TabsTrigger value="users">Usuários Ativos</TabsTrigger>
              <TabsTrigger value="groups">Grupos MLM</TabsTrigger>
              <TabsTrigger value="commissions">Comissões</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Produtos/Serviços Mais Vendidos</h3>
                <div className="space-y-3">
                  {mockTopProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {product.vendas} vendas • {formatCurrency(product.receita)}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={product.crescimento >= 0 ? "default" : "secondary"}
                        className={product.crescimento >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                      >
                        {product.crescimento >= 0 ? '+' : ''}{product.crescimento}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Usuários Mais Ativos no MLM</h3>
                <div className="space-y-3">
                  {mockActiveUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground text-sm font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {user.participacoes} participações • {formatCurrency(user.comissoes)} em comissões
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{user.nivel}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="groups">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resumo de Grupos MLM</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockGroupsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="commissions">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resumo de Comissões</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockCommissionsData.map((commission, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{commission.tipo}</h4>
                        <Badge 
                          variant={commission.status === 'Pago' ? 'default' : 'secondary'}
                        >
                          {commission.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Valor: <span className="font-medium text-foreground">
                            {formatCurrency(commission.valor)}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: <span className="font-medium text-foreground">
                            {commission.quantidade}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};