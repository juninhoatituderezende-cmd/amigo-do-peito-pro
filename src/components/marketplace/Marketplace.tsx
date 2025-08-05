import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  DollarSign, 
  Search,
  ShoppingCart,
  Star,
  Grid3X3,
  List,
  Eye,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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
  professional_avatar?: string;
  is_active: boolean;
  created_at: string;
  total_sales?: number;
  rating?: number;
}

const CATEGORIES = [
  { value: "all", label: "Todos" },
  { value: "servicos-profissionais", label: "Serviços Profissionais" },
  { value: "produtos-digitais", label: "Produtos Digitais" },
  { value: "cursos-online", label: "Cursos Online" },
  { value: "consultoria", label: "Consultoria" },
  { value: "eventos", label: "Eventos" },
  { value: "outros", label: "Outros" }
];

export const Marketplace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "price_low" | "price_high">("newest");
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles(full_name, avatar_url),
          sales!left(id)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedProducts = (productsData || []).map(product => {
        const salesCount = product.sales?.length || 0;
        const rating = 4.2 + Math.random() * 0.8; // Mock rating for now

        return {
          ...product,
          professional_name: product.profiles?.full_name || 'Profissional',
          professional_avatar: product.profiles?.avatar_url,
          total_sales: salesCount,
          rating: Math.round(rating * 10) / 10
        };
      });

      setProducts(enrichedProducts);
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

  const handlePurchase = (product: Product) => {
    // For now, just show a toast - later we'll implement Stripe checkout
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: `Compra do produto "${product.title}" será implementada em breve.`,
    });
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (product.professional_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.total_sales || 0) - (a.total_sales || 0);
        case "price_low":
          return a.down_payment - b.down_payment;
        case "price_high":
          return b.down_payment - a.down_payment;
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-32 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded"></div>
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
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
        <p className="text-muted-foreground">
          Descubra produtos e serviços incríveis de profissionais qualificados
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos, serviços ou profissionais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm min-w-[180px]"
        >
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border rounded-md text-sm min-w-[140px]"
        >
          <option value="newest">Mais recentes</option>
          <option value="popular">Mais populares</option>
          <option value="price_low">Menor preço</option>
          <option value="price_high">Maior preço</option>
        </select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredAndSortedProducts.length} produto{filteredAndSortedProducts.length !== 1 ? 's' : ''} encontrado{filteredAndSortedProducts.length !== 1 ? 's' : ''}
      </div>

      {/* Products Grid/List */}
      {filteredAndSortedProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== "all" 
                ? "Tente ajustar seus filtros de busca" 
                : "Ainda não há produtos disponíveis no marketplace"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredAndSortedProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={viewMode === "list" ? "flex" : ""}>
                {/* Product Image */}
                <div className={`bg-muted flex items-center justify-center overflow-hidden ${
                  viewMode === "list" ? "w-48 h-32" : "h-48"
                }`}>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                {/* Product Content */}
                <div className="flex-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {CATEGORIES.find(c => c.value === product.category)?.label || product.category}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Professional Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                        {product.professional_avatar ? (
                          <img
                            src={product.professional_avatar}
                            alt={product.professional_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{product.professional_name}</span>
                    </div>

                    {/* Rating and Sales */}
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{product.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{product.total_sales || 0} vendas</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Preço total:</span>
                        <span className="text-lg font-bold">{formatCurrency(product.full_price)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Para começar:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(product.down_payment)}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      onClick={() => handlePurchase(product)}
                      className="w-full"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Começar Agora
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Adquira apenas com {formatCurrency(product.down_payment)} de entrada
                    </p>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};