import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUserHistory, HistoryType, SortField, SortOrder } from '@/hooks/useUserHistory';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Gift,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

const StatusColors = {
  concluido: 'bg-green-100 text-green-700',
  confirmado: 'bg-blue-100 text-blue-700',
  contemplado: 'bg-purple-100 text-purple-700',
  pago: 'bg-green-100 text-green-700',
  agendado: 'bg-yellow-100 text-yellow-700',
  aguardando: 'bg-orange-100 text-orange-700',
  processado: 'bg-gray-100 text-gray-700',
  cancelado: 'bg-red-100 text-red-700'
};

const TypeIcons = {
  compras: ShoppingCart,
  creditos: CreditCard,
  grupos: Users,
  comissoes: DollarSign
};

const TypeLabels = {
  compras: 'Compras',
  creditos: 'Créditos',
  grupos: 'Grupos MLM',
  comissoes: 'Comissões'
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const UserHistory = () => {
  const navigate = useNavigate();
  const {
    items,
    loading,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    selectedType,
    sortField,
    sortOrder,
    dateRange,
    minAmount,
    maxAmount,
    monthlyData,
    setSelectedType,
    setSortField,
    setSortOrder,
    setDateRange,
    setAmountRange,
    setCurrentPage,
    setItemsPerPage,
    refresh,
    exportToPDF,
    exportToCSV,
    clearFilters
  } = useUserHistory();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Calculate summary stats
  const totalAmount = items.reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);
  const typeDistribution = items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeDistribution).map(([type, count], index) => ({
    name: TypeLabels[type as keyof typeof TypeLabels],
    value: count,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/usuario')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold">Histórico Detalhado</h1>
              <p className="text-muted-foreground">
                Visualize todas as suas transações e atividades
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Itens</p>
                  <p className="text-xl font-bold">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="text-xl font-bold">6 meses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Mensal</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(totalAmount / Math.max(monthlyData.length, 1))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Total']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Filtros Avançados</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Type Filter */}
                <div>
                  <Label>Tipo</Label>
                  <Select value={selectedType} onValueChange={(value) => setSelectedType(value as HistoryType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="compras">Compras</SelectItem>
                      <SelectItem value="creditos">Créditos</SelectItem>
                      <SelectItem value="grupos">Grupos MLM</SelectItem>
                      <SelectItem value="comissoes">Comissões</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div>
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDateRange({
                      ...dateRange,
                      start: e.target.value ? new Date(e.target.value) : null
                    })}
                  />
                </div>
                
                <div>
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDateRange({
                      ...dateRange,
                      end: e.target.value ? new Date(e.target.value) : null
                    })}
                  />
                </div>

                {/* Items per page */}
                <div>
                  <Label>Itens por página</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Valor Mínimo (R$)</Label>
                  <Input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setAmountRange(Number(e.target.value), maxAmount)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Valor Máximo (R$)</Label>
                  <Input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setAmountRange(minAmount, Number(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Histórico de Transações</CardTitle>
              <div className="text-sm text-muted-foreground">
                {items.length} de {totalItems} itens
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted rounded-lg mb-4 text-sm font-medium">
              <div 
                className="col-span-2 cursor-pointer flex items-center gap-1"
                onClick={() => handleSort('date')}
              >
                Data {getSortIcon('date')}
              </div>
              <div 
                className="col-span-2 cursor-pointer flex items-center gap-1"
                onClick={() => handleSort('type')}
              >
                Tipo {getSortIcon('type')}
              </div>
              <div className="col-span-4">Descrição</div>
              <div 
                className="col-span-2 cursor-pointer flex items-center gap-1"
                onClick={() => handleSort('amount')}
              >
                Valor {getSortIcon('amount')}
              </div>
              <div 
                className="col-span-2 cursor-pointer flex items-center gap-1"
                onClick={() => handleSort('status')}
              >
                Status {getSortIcon('status')}
              </div>
            </div>

            {/* Table Body */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Nenhum item encontrado
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ajuste os filtros para ver mais resultados
                    </p>
                  </div>
                ) : (
                  items.map((item) => {
                    const IconComponent = TypeIcons[item.type];
                    return (
                      <div key={item.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="col-span-2 text-sm">
                          {format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{TypeLabels[item.type]}</span>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <div>
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <div className="col-span-2">
                          {item.amount && (
                            <span className={`font-medium ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Badge 
                            variant="secondary" 
                            className={StatusColors[item.status as keyof typeof StatusColors] || 'bg-gray-100 text-gray-700'}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} • {totalItems} itens
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default UserHistory;