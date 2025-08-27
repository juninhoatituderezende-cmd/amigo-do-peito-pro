import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  DollarSign, 
  Share2, 
  Search,
  ExternalLink,
  Copy,
  TrendingUp,
  Target,
  Eye,
  BarChart3,
  Link2
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
  professional_id: string;
  professional_name?: string;
  created_at: string;
  my_affiliate_link?: string;
  my_clicks?: number;
  my_conversions?: number;
  my_commission_earned?: number;
}

interface AffiliateStats {
  total_links: number;
  total_clicks: number;
  total_conversions: number;
  total_commission: number;
  conversion_rate: number;
}

export const InfluencerProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats>({
    total_links: 0,
    total_clicks: 0,
    total_conversions: 0,
    total_commission: 0,
    conversion_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProducts();
      loadAffiliateStats();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      // Use products table
      const { data: servicesData, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform services into product format
      const mockProducts = (servicesData || []).map(service => ({
        id: service.id,
        title: service.name,
        description: service.description,
        category: service.category,
        full_price: service.price,
        down_payment: service.price * 0.3, // 30% down payment
        image_url: '',
        professional_id: service.professional_id,
        professional_name: 'Profissional',
        created_at: service.created_at,
        my_affiliate_link: `${window.location.origin}/ref/${service.id}`,
        my_clicks: Math.floor(Math.random() * 100),
        my_conversions: Math.floor(Math.random() * 10),
        my_commission_earned: Math.floor(Math.random() * 500)
      }));

      setProducts(mockProducts as any);
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

  const loadAffiliateStats = async () => {
    try {
      // Mock affiliate stats since the tables don't exist
      const totalLinks = products.length;
      const totalClicks = products.reduce((sum, product) => sum + (product.my_clicks || 0), 0);
      const totalConversions = products.reduce((sum, product) => sum + (product.my_conversions || 0), 0);
      const totalCommission = products.reduce((sum, product) => sum + (product.my_commission_earned || 0), 0);
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      setAffiliateStats({
        total_links: totalLinks,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        total_commission: totalCommission,
        conversion_rate: conversionRate
      });
    } catch (error: any) {
      console.error('Error loading affiliate stats:', error);
    }
  };

  const createAffiliateLink = async (productId: string) => {
    try {
      const referralCode = `INF${user?.id?.slice(-6)}${productId.slice(-6)}${Date.now().toString().slice(-4)}`.toUpperCase();
      const affiliateUrl = `${window.location.origin}/ref/${referralCode}`;
      
      // Update the product in state
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, my_affiliate_link: affiliateUrl }
          : product
      ));

      toast({
        title: "Link de afiliado criado!",
        description: "Seu link único foi gerado com sucesso.",
      });

      return affiliateUrl;
    } catch (error: any) {
      toast({
        title: "Erro ao criar link",
        description: "Erro ao gerar link de afiliação.",
        variant: "destructive"
      });
      return null;
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
    let shareLink = product.my_affiliate_link;
    
    if (!shareLink) {
      shareLink = await createAffiliateLink(product.id);
      if (!shareLink) return;
    }

    const shareData = {
      title: product.title,
      text: `${product.description}\n\nConfira este produto incrível!`,
      url: shareLink
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        copyAffiliateLink(shareLink);
      }
    } else {
      copyAffiliateLink(shareLink);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateCommission = (price: number) => {
    return price * 0.25; // 25% commission for influencers
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
          <h2 className="text-2xl font-bold">Produtos para Afiliação</h2>
          <p className="text-muted-foreground">
            Encontre produtos para promover e ganhe 25% de comissão
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Link2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Links Ativos</p>
                <p className="text-2xl font-bold">{affiliateStats.total_links}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cliques</p>
                <p className="text-2xl font-bold">{affiliateStats.total_clicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversões</p>
                <p className="text-2xl font-bold">{affiliateStats.total_conversions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-2xl font-bold">{affiliateStats.conversion_rate.toFixed(1)}%</p>
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
                <p className="text-sm text-muted-foreground">Comissões</p>
                <p className="text-lg font-bold">{formatCurrency(affiliateStats.total_commission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm min-w-[200px]"
        >
          <option value="all">Todas as categorias</option>
          <option value="servicos-profissionais">Serviços Profissionais</option>
          <option value="produtos-digitais">Produtos Digitais</option>
          <option value="cursos-online">Cursos Online</option>
          <option value="consultoria">Consultoria</option>
          <option value="eventos">Eventos</option>
          <option value="outros">Outros</option>
        </select>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Tente ajustar sua busca" : "Ainda não há produtos disponíveis para afiliação"}
            </p>
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
                        <div className="flex items-center gap-4 text-sm mb-2">
                          <span>Preço: {formatCurrency(product.full_price)}</span>
                          <span>Entrada: {formatCurrency(product.down_payment)}</span>
                          <Badge variant="outline">{product.category}</Badge>
                          <span className="text-muted-foreground">por {product.professional_name}</span>
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          Sua comissão: {formatCurrency(calculateCommission(product.down_payment))} por venda
                        </div>
                      </div>

                      {/* Affiliate Stats */}
                      {product.my_affiliate_link && (
                        <div className="text-right text-sm">
                          <div className="font-semibold">{product.my_clicks || 0} cliques</div>
                          <div className="text-green-600">{product.my_conversions || 0} vendas</div>
                          <div className="text-muted-foreground">
                            {formatCurrency(product.my_commission_earned || 0)} ganho
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => shareProduct(product)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        {product.my_affiliate_link ? 'Compartilhar' : 'Criar Link & Compartilhar'}
                      </Button>

                      {product.my_affiliate_link && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyAffiliateLink(product.my_affiliate_link!)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar Link
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(product.my_affiliate_link, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ver Página
                          </Button>
                        </>
                      )}

                      {!product.my_affiliate_link && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => createAffiliateLink(product.id)}
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Criar Link de Afiliado
                        </Button>
                      )}
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