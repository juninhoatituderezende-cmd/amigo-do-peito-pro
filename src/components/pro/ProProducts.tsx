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

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: string;
  created_at: string;
  total_sales?: number;
  total_revenue?: number;
  affiliate_link?: string;
}

export const ProProducts = () => {
  const [products, setProducts] = useState<Service[]>([]);
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
      // Get professional ID first
      const { data: professional } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .eq('role', 'professional')
        .single();

      if (!professional) {
        setLoading(false);
        return;
      }

      // Load products
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .eq('professional_id', professional.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add mock stats and affiliate links
      const productsWithStats = (productsData || []).map(product => ({
        ...product,
        duration: '1 hora', // Default duration since not in DB
        total_sales: Math.floor(Math.random() * 20),
        total_revenue: product.price * Math.floor(Math.random() * 20),
        affiliate_link: `${window.location.origin}/service/${product.id}`
      }));

      setProducts(productsWithStats);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar serviços",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyAffiliateLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link copiado!",
        description: "O link do serviço foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar link",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      });
    }
  };

  const shareProduct = async (product: Service) => {
    const shareData = {
      title: product.name,
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
          <h2 className="text-2xl font-bold">Meus Serviços</h2>
          <p className="text-muted-foreground">
            Gerencie seus serviços e acompanhe os resultados
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar serviços..."
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
                <p className="text-sm text-muted-foreground">Total Serviços</p>
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
                <p className="text-sm text-muted-foreground">Serviços Ativos</p>
                <p className="text-2xl font-bold">{products.length}</p>
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
            <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Tente ajustar sua busca" : "Comece criando seu primeiro serviço"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Serviço
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
                  {/* Product Icon */}
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Preço: {formatCurrency(product.price)}</span>
                          <span>Duração: {product.duration}</span>
                          <Badge variant="outline">{product.category}</Badge>
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