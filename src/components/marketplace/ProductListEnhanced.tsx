import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Edit, Trash2, Search, Filter, Users, ShoppingCart, Package, ExternalLink, Star } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  target_audience: string;
  image_url: string | null;
  external_link: string | null;
  featured: boolean;
  stock_quantity: number;
  active: boolean;
  created_at: string;
  professional_id: string;
  profiles?: {
    full_name: string;
  };
}

interface Category {
  name: string;
  description: string;
}

const TARGET_AUDIENCE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  professional: { label: "Profissionais", icon: Users, color: "bg-blue-100 text-blue-700" },
  consumer: { label: "Consumidor", icon: ShoppingCart, color: "bg-green-100 text-green-700" },
  both: { label: "Ambos", icon: Package, color: "bg-purple-100 text-purple-700" }
};

export const ProductListEnhanced = ({ refreshTrigger }: { refreshTrigger?: number }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load products with professional info
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_professional_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('name, description')
        .order('name');

      if (categoriesError) throw categoriesError;

      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos/categorias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, active: !currentStatus }
            : product
        )
      );

      toast({
        title: "Sucesso",
        description: `Produto ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do produto.",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== productId));

      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir produto.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesAudience = audienceFilter === 'all' || product.target_audience === audienceFilter;
    
    return matchesSearch && matchesCategory && matchesAudience;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por Categoria */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.description || category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Público */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Público Alvo</label>
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os públicos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os públicos</SelectItem>
                  <SelectItem value="professional">Profissionais</SelectItem>
                  <SelectItem value="consumer">Consumidor Final</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Produtos/Serviços ({filteredProducts.length})
            </div>
          </CardTitle>
          <CardDescription>
            Gerencie todos os produtos e serviços do marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Público</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const audienceInfo = TARGET_AUDIENCE_LABELS[product.target_audience] || TARGET_AUDIENCE_LABELS.consumer;
                  const AudienceIcon = audienceInfo.icon;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            {product.name}
                            {product.featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                            {product.external_link && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.profiles?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {product.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={audienceInfo.color}>
                          <AudienceIcon className="h-3 w-3 mr-1" />
                          {audienceInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.category || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.stock_quantity === -1 ? (
                          <Badge variant="secondary">Ilimitado</Badge>
                        ) : product.stock_quantity === 0 ? (
                          <Badge variant="destructive">Esgotado</Badge>
                        ) : (
                          <Badge variant="default">{product.stock_quantity}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.active ? (
                          <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleProductStatus(product.id, product.active)}
                          >
                            {product.active ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== 'all' || audienceFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Cadastre o primeiro produto do marketplace.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};