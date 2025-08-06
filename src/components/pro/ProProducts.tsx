import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  DollarSign, 
  Eye, 
  Share2, 
  Edit, 
  Trash2,
  Search,
  Plus,
  ExternalLink,
  Copy,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  full_price: number;
  down_payment: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  total_sales?: number;
  total_revenue?: number;
  affiliate_link?: string;
}

export const ProProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      // Load products with sales statistics
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          sales!inner(count),
          affiliate_links(referral_code)
        `)
        .eq('professional_id', user?.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Calculate sales statistics for each product
      const productsWithStats = await Promise.all(
        (productsData || []).map(async (product) => {
          const { data: salesData } = await supabase
            .from('sales')
            .select('amount_paid')
            .eq('product_id', product.id)
            .eq('payment_status', 'paid');

          const totalSales = salesData?.length || 0;
          const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.amount_paid), 0) || 0;
          const affiliateLink = product.affiliate_links?.[0]?.referral_code;

          return {
            ...product,
            total_sales: totalSales,
            total_revenue: totalRevenue,
            affiliate_link: affiliateLink ? `${window.location.origin}/ref/${affiliateLink}` : ''
          };
        })
      );

      setProducts(productsWithStats);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.map(product =>
        product.id === productId
          ? { ...product, is_active: !currentStatus }
          : product
      ));

      toast({
        title: currentStatus ? "Produto desativado" : "Produto ativado",
        description: "O status do produto foi atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const copyAffiliateLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link copiado!",
        description: "O link de afiliado foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar link",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      });
    }
  };

  const shareProduct = async (product: Product) => {
    const shareData = {
      title: product.title,
      text: product.description,
      url: product.affiliate_link
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        copyAffiliateLink(product.affiliate_link || '');
      }
    } else {
      copyAffiliateLink(product.affiliate_link || '');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meus Produtos</h2>
          <p className="text-muted-foreground">
            Gerencie seus produtos e acompanhe as vendas
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Produtos</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produtos Ativos</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendas</p>
                <p className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + (p.total_sales || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-lg font-bold">
                  {formatCurrency(products.reduce((sum, p) => sum + (p.total_revenue || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Tente ajustar sua busca" : "Comece criando seu primeiro produto"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Produto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{product.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Preço: {formatCurrency(product.full_price)}</span>
                          <span>Entrada: {formatCurrency(product.down_payment)}</span>
                          <Badge variant="outline">{product.category}</Badge>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right text-sm">
                        <div className="font-semibold">{product.total_sales || 0} vendas</div>
                        <div className="text-muted-foreground">
                          {formatCurrency(product.total_revenue || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Criado em {formatDate(product.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => shareProduct(product)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Compartilhar
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyAffiliateLink(product.affiliate_link || '')}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar Link
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(product.affiliate_link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver Página
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                      >
                        {product.is_active ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};