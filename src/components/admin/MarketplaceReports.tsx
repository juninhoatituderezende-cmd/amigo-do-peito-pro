import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  DollarSign, 
  ExternalLink,
  CreditCard,
  Users,
  Download,
  Filter,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface MarketplaceSale {
  id: string;
  product_title: string;
  customer_name: string;
  amount_paid: number;
  payment_method: 'credits' | 'card' | 'external';
  buyer_type: 'client' | 'professional';
  product_type: 'internal' | 'dropshipping';
  created_at: string;
  professional_name: string;
}

interface MarketplaceStats {
  totalSales: number;
  totalRevenue: number;
  creditSales: number;
  cardSales: number;
  externalSales: number;
  clientPurchases: number;
  professionalPurchases: number;
}

export const MarketplaceReports = () => {
  const [sales, setSales] = useState<MarketplaceSale[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterBuyerType, setFilterBuyerType] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);

      // Carregar vendas do marketplace (simulado por enquanto)
      const mockSales: MarketplaceSale[] = [
        {
          id: "1",
          product_title: "Agulhas Profissionais Kit",
          customer_name: "Maria Silva",
          amount_paid: 150.00,
          payment_method: 'credits',
          buyer_type: 'professional',
          product_type: 'internal',
          created_at: new Date().toISOString(),
          professional_name: "João Santos"
        },
        {
          id: "2",
          product_title: "Curso Marketing Digital",
          customer_name: "Carlos Lima",
          amount_paid: 299.00,
          payment_method: 'card',
          buyer_type: 'client',
          product_type: 'internal',
          created_at: new Date().toISOString(),
          professional_name: "Ana Costa"
        },
        {
          id: "3",
          product_title: "Equipamento Importado",
          customer_name: "Lucia Mendes",
          amount_paid: 0, // Dropshipping - sem valor interno
          payment_method: 'external',
          buyer_type: 'professional',
          product_type: 'dropshipping',
          created_at: new Date().toISOString(),
          professional_name: "Pedro Oliveira"
        }
      ];

      setSales(mockSales);

      // Calcular estatísticas
      const totalSales = mockSales.length;
      const totalRevenue = mockSales.reduce((sum, sale) => sum + sale.amount_paid, 0);
      const creditSales = mockSales.filter(s => s.payment_method === 'credits').length;
      const cardSales = mockSales.filter(s => s.payment_method === 'card').length;
      const externalSales = mockSales.filter(s => s.payment_method === 'external').length;
      const clientPurchases = mockSales.filter(s => s.buyer_type === 'client').length;
      const professionalPurchases = mockSales.filter(s => s.buyer_type === 'professional').length;

      setStats({
        totalSales,
        totalRevenue,
        creditSales,
        cardSales,
        externalSales,
        clientPurchases,
        professionalPurchases
      });

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Produto', 'Cliente', 'Valor', 'Método Pagamento', 'Tipo Comprador', 'Tipo Produto', 'Data', 'Profissional'],
      ...filteredSales.map(sale => [
        sale.product_title,
        sale.customer_name,
        sale.amount_paid.toFixed(2),
        sale.payment_method,
        sale.buyer_type,
        sale.product_type,
        new Date(sale.created_at).toLocaleDateString('pt-BR'),
        sale.professional_name
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketplace-vendas-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: "Arquivo CSV baixado com sucesso."
    });
  };

  const filteredSales = sales.filter(sale => {
    const matchesType = filterType === "all" || sale.product_type === filterType;
    const matchesBuyerType = filterBuyerType === "all" || sale.buyer_type === filterBuyerType;
    return matchesType && matchesBuyerType;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'credits':
        return <Badge variant="default">Créditos</Badge>;
      case 'card':
        return <Badge variant="secondary">Cartão</Badge>;
      case 'external':
        return <Badge variant="outline">Externo</Badge>;
      default:
        return <Badge>{method}</Badge>;
    }
  };

  const getBuyerTypeBadge = (type: string) => {
    switch (type) {
      case 'client':
        return <Badge variant="default">Cliente</Badge>;
      case 'professional':
        return <Badge variant="secondary">Profissional</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios do Marketplace</h2>
          <p className="text-muted-foreground">
            Análise de vendas e performance dos produtos
          </p>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Vendas</p>
                  <p className="text-2xl font-bold">{stats.totalSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Compras de Clientes</p>
                  <p className="text-2xl font-bold">{stats.clientPurchases}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Compras de Profissionais</p>
                  <p className="text-2xl font-bold">{stats.professionalPurchases}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo de produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="internal">Produtos internos</SelectItem>
            <SelectItem value="dropshipping">Dropshipping</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterBuyerType} onValueChange={setFilterBuyerType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo de comprador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos compradores</SelectItem>
            <SelectItem value="client">Clientes</SelectItem>
            <SelectItem value="professional">Profissionais</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Produto</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Valor</th>
                  <th className="text-left p-2">Pagamento</th>
                  <th className="text-left p-2">Comprador</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Profissional</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{sale.product_title}</td>
                    <td className="p-2">{sale.customer_name}</td>
                    <td className="p-2">
                      {sale.payment_method === 'external' 
                        ? 'N/A' 
                        : formatCurrency(sale.amount_paid)
                      }
                    </td>
                    <td className="p-2">{getPaymentMethodBadge(sale.payment_method)}</td>
                    <td className="p-2">{getBuyerTypeBadge(sale.buyer_type)}</td>
                    <td className="p-2">
                      <Badge variant={sale.product_type === 'internal' ? 'default' : 'outline'}>
                        {sale.product_type === 'internal' ? 'Interno' : 'Dropshipping'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-2">{sale.professional_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma venda encontrada</h3>
              <p className="text-muted-foreground">
                Ajuste os filtros ou aguarde as primeiras vendas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Pagamentos com Crédito</span>
                </div>
                <span className="text-xl font-bold">{stats.creditSales}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm font-medium">Pagamentos com Cartão</span>
                </div>
                <span className="text-xl font-bold">{stats.cardSales}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <span className="text-sm font-medium">Redirecionamentos Externos</span>
                </div>
                <span className="text-xl font-bold">{stats.externalSales}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};