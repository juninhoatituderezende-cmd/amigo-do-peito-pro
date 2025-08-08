import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, Download, Eye, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Sale {
  id: string;
  buyer_name: string;
  buyer_email: string;
  valor_total: number;
  valor_entrada_pago: number;
  influencer_code?: string;
  comissao_influencer: number;
  comissao_profissional: number;
  status: string;
  payment_method?: string;
  created_at: string;
  marketplace_products?: {
    name: string;
    category: string;
    professionals?: {
      full_name: string;
      email: string;
    };
  };
  influencer_profiles?: {
    full_name: string;
    email: string;
  };
}

export const SalesManager: React.FC = () => {
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_sales')
        .select(`
          *,
          marketplace_products (
            name,
            category,
            professionals (
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vendas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      paid: { label: 'Pago', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
      completed: { label: 'Concluído', variant: 'default' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.marketplace_products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.marketplace_products?.professionals?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.influencer_code && sale.influencer_code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.valor_entrada_pago, 0);
  const totalCommissions = filteredSales.reduce((sum, sale) => sum + sale.comissao_influencer + sale.comissao_profissional, 0);

  const exportToCSV = () => {
    const headers = [
      'Data',
      'Comprador',
      'Email',
      'Produto',
      'Profissional',
      'Valor Total',
      'Valor Pago',
      'Influencer',
      'Comissão Influencer',
      'Comissão Profissional',
      'Status'
    ].join(',');

    const rows = filteredSales.map(sale => [
      formatDate(sale.created_at),
      `"${sale.buyer_name}"`,
      sale.buyer_email,
      `"${sale.marketplace_products?.name || ''}"`,
      `"${sale.marketplace_products?.professionals?.full_name || ''}"`,
      sale.valor_total,
      sale.valor_entrada_pago,
      sale.influencer_code || '',
      sale.comissao_influencer,
      sale.comissao_profissional,
      sale.status
    ].join(','));

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Sucesso!",
      description: "Relatório exportado com sucesso"
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando vendas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lista de Vendas</h2>
        
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold">{filteredSales.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Comissões</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalCommissions)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vendas Hoje</p>
                <p className="text-2xl font-bold">
                  {filteredSales.filter(sale => 
                    new Date(sale.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por comprador, produto, profissional ou código influencer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Vendas */}
      <div className="space-y-4">
        {filteredSales.map((sale) => (
          <Card key={sale.id}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div>
                  <p className="font-semibold">{sale.buyer_name}</p>
                  <p className="text-sm text-gray-600">{sale.buyer_email}</p>
                  <p className="text-xs text-gray-400">{formatDate(sale.created_at)}</p>
                </div>
                
                <div>
                  <p className="font-medium">{sale.marketplace_products?.name}</p>
                  <p className="text-sm text-gray-600">{sale.marketplace_products?.category}</p>
                  <p className="text-sm text-gray-600">
                    Por: {sale.marketplace_products?.professionals?.full_name}
                  </p>
                </div>

                <div className="text-center">
                  <p className="font-bold text-lg">{formatCurrency(sale.valor_total)}</p>
                  <p className="text-sm text-green-600">Pago: {formatCurrency(sale.valor_entrada_pago)}</p>
                  <p className="text-xs text-gray-500">{sale.payment_method}</p>
                </div>

                <div className="text-center">
                  {sale.influencer_code ? (
                    <>
                      <p className="text-sm font-medium">Código: {sale.influencer_code}</p>
                      <p className="text-sm text-orange-600">
                        Comissão: {formatCurrency(sale.comissao_influencer)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Sem influencer</p>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm text-blue-600 mb-1">
                    Prof: {formatCurrency(sale.comissao_profissional)}
                  </p>
                  {getStatusBadge(sale.status)}
                </div>

                <div className="text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes da Venda</DialogTitle>
                      </DialogHeader>
                      
                      {selectedSale && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <strong>ID da Venda:</strong> {selectedSale.id}
                            </div>
                            <div>
                              <strong>Data:</strong> {formatDate(selectedSale.created_at)}
                            </div>
                            <div>
                              <strong>Comprador:</strong> {selectedSale.buyer_name}
                            </div>
                            <div>
                              <strong>Email:</strong> {selectedSale.buyer_email}
                            </div>
                            <div>
                              <strong>Produto:</strong> {selectedSale.marketplace_products?.name}
                            </div>
                            <div>
                              <strong>Profissional:</strong> {selectedSale.marketplace_products?.professionals?.full_name}
                            </div>
                            <div>
                              <strong>Valor Total:</strong> {formatCurrency(selectedSale.valor_total)}
                            </div>
                            <div>
                              <strong>Valor Pago:</strong> {formatCurrency(selectedSale.valor_entrada_pago)}
                            </div>
                            <div>
                              <strong>Método de Pagamento:</strong> {selectedSale.payment_method || 'N/A'}
                            </div>
                            <div>
                              <strong>Status:</strong> {getStatusBadge(selectedSale.status)}
                            </div>
                          </div>
                          
                          {selectedSale.influencer_code && (
                            <div className="border-t pt-4">
                              <h4 className="font-semibold mb-2">Informações do Influencer</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Código:</strong> {selectedSale.influencer_code}
                                </div>
                                <div>
                                  <strong>Comissão:</strong> {formatCurrency(selectedSale.comissao_influencer)}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Comissões</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <strong>Comissão Profissional:</strong> {formatCurrency(selectedSale.comissao_profissional)}
                              </div>
                              <div>
                                <strong>Comissão Influencer:</strong> {formatCurrency(selectedSale.comissao_influencer)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhuma venda encontrada.</p>
            <p className="text-sm text-gray-400 mt-2">
              As vendas aparecem aqui quando os usuários fazem compras no marketplace.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};