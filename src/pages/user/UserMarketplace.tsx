import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Search, ShoppingCart, Package, Filter, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MarketplaceProduct {
  id: string;
  name: string;
  description?: string;
  valor_total: number;
  category: string;
  image_url?: string;
  ativo: boolean;
  approved: boolean;
  type?: 'service' | 'product';
}

const UserMarketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const creditsHook = useCredits();
  const { balance, useCredits: useCreditsFunction } = creditsHook;
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadMarketplaceProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const loadMarketplaceProducts = async () => {
    try {
      setLoading(true);
      
      // Carregar APENAS produtos reais cadastrados no admin (sem filtro de target_audience)
      const productsResponse = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (productsResponse.error) throw productsResponse.error;

      // Se não há produtos reais, array vazio
      if (!productsResponse.data || productsResponse.data.length === 0) {
        setProducts([]);
        setCategories([]);
        return;
      }

      // Transform products to marketplace products format
      const productItems = productsResponse.data.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        valor_total: product.price,
        category: product.category || 'Produtos',
        ativo: product.active,
        approved: true,
        image_url: product.image_url,
        created_at: product.created_at,
        type: 'product' as const
      }));

      setProducts(productItems);
      
      // Extrair categorias únicas dos produtos reais
      const uniqueCategories = [...new Set(productItems.map(p => p.category))];
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro ao carregar produtos reais",
        description: "Não foi possível carregar os produtos cadastrados no sistema.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handlePurchase = async (product: MarketplaceProduct) => {
    if (!balance) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar seu saldo.",
        variant: "destructive"
      });
      return;
    }

    if (balance.availableCredits < product.valor_total) {
      toast({
        title: "Saldo insuficiente",
        description: `Você precisa de ${formatCurrency(product.valor_total)} em créditos para este produto.`,
        variant: "destructive"
      });
      return;
    }

    const success = await useCreditsFunction(
      product.valor_total,
      'marketplace_purchase',
      `Compra no marketplace: ${product.name}`,
      product.id
    );

    if (success) {
      toast({
        title: "Compra realizada!",
        description: `Você resgatou ${product.name} com sucesso!`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShoppingCart className="h-8 w-8 text-primary" />
                Marketplace de Produtos
              </h1>
              <p className="text-muted-foreground mt-2">
                Use seus créditos para resgatar produtos exclusivos
              </p>
            </div>
            
            {/* Saldo Display */}
            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Seus Créditos</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(balance?.availableCredits || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-64">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                {products.length === 0 
                  ? "Nenhum produto foi cadastrado pelos administradores ainda. Apenas produtos reais e aprovados são exibidos no marketplace." 
                  : "Tente ajustar os filtros de busca."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  {product.image_url && (
                    <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  {!product.image_url && (
                    <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{product.category}</Badge>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(product.valor_total)}
                        </p>
                        <p className="text-xs text-muted-foreground">em créditos</p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handlePurchase(product)}
                      disabled={!balance || balance.availableCredits < product.valor_total}
                      className="w-full"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {(!balance || balance.availableCredits < product.valor_total) 
                        ? "Saldo insuficiente" 
                        : "Resgatar com Créditos"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default UserMarketplace;