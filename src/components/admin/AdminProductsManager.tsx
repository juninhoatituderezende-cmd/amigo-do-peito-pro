import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Copy, 
  Edit, 
  Eye, 
  DollarSign, 
  Package, 
  ShoppingCart,
  ExternalLink,
  Save,
  Trash2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  full_price: number;
  down_payment: number;
  image_url?: string;
  external_link?: string;
  visibility: 'client' | 'professional' | 'both';
  is_active: boolean;
  created_at: string;
  professional_id?: string;
  professional_name?: string;
}

interface CustomPlan {
  id: string;
  plan_code: string;
  name: string;
  description: string;
  category_id: string;
  total_price: number;
  entry_price: number;
  max_participants: number;
  active: boolean;
  public_enrollment: boolean;
  created_at: string;
  image_url?: string;
}

interface ProductForm {
  title: string;
  description: string;
  category: string;
  full_price: string;
  down_payment: string;
  image_url: string;
  external_link: string;
  visibility: 'client' | 'professional' | 'both';
  is_active: boolean;
}

const CATEGORIES = [
  { value: "estetica", label: "Estética" },
  { value: "odontologia", label: "Odontologia" },
  { value: "tatuagem", label: "Tatuagem" },
  { value: "cabelo", label: "Cabelo & Beleza" },
  { value: "cosmeticos", label: "Cosméticos" },
  { value: "suplementos", label: "Suplementos" },
  { value: "roupas", label: "Roupas & Acessórios" },
  { value: "cursos", label: "Cursos Online" },
  { value: "consultoria", label: "Consultoria" },
  { value: "outros", label: "Outros" }
];

export function AdminProductsManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [customPlans, setCustomPlans] = useState<CustomPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [productForm, setProductForm] = useState<ProductForm>({
    title: '',
    description: '',
    category: 'outros',
    full_price: '',
    down_payment: '',
    image_url: '',
    external_link: '',
    visibility: 'both',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load services as marketplace products
      const { data: servicesData } = await supabase
        .from('services')
        .select(`
          *,
          professionals!inner(
            id,
            full_name,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      // Transform services into product format
      const transformedProducts = (servicesData || []).map(service => ({
        id: service.id,
        title: service.name,
        description: service.description,
        category: service.category,
        full_price: service.price,
        down_payment: service.price * 0.3, // 30% entrada
        image_url: '',
        external_link: undefined,
        visibility: 'both' as const,
        is_active: true,
        created_at: service.created_at,
        professional_id: service.professional_id,
        professional_name: service.professionals?.full_name
      }));

      setProducts(transformedProducts);

      // Load custom plans
      const { data: plansData } = await supabase
        .from('custom_plans')
        .select('*')
        .order('created_at', { ascending: false });

      setCustomPlans(plansData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!productForm.title || !productForm.category || !productForm.full_price) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // For now, create as a service since we don't have a products table yet
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: productForm.title,
          description: productForm.description,
          category: productForm.category,
          price: parseFloat(productForm.full_price),
          duration: '1 unidade',
          professional_id: null // Admin products don't need professional
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Produto criado!",
        description: `Produto "${productForm.title}" foi criado com sucesso.`,
      });

      // Reset form
      setProductForm({
        title: '',
        description: '',
        category: 'outros',
        full_price: '',
        down_payment: '',
        image_url: '',
        external_link: '',
        visibility: 'both',
        is_active: true
      });

      setActiveTab('marketplace');
      loadData();

    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyProductLink = (productId: string, type: 'marketplace' | 'plan' = 'marketplace') => {
    let url;
    if (type === 'plan') {
      const plan = customPlans.find(p => p.id === productId);
      url = `${window.location.origin}/mlm/products?plan=${plan?.plan_code}`;
    } else {
      url = `${window.location.origin}/marketplace?product=${productId}`;
    }
    
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "Link do produto copiado para a área de transferência.",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Produtos</h2>
          <p className="text-muted-foreground">
            Gerencie todos os produtos, planos e serviços da plataforma
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="plans">Planos MLM</TabsTrigger>
          <TabsTrigger value="create-product">Novo Produto</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Marketplace Products Tab */}
        <TabsContent value="marketplace" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Produtos do Marketplace</h3>
            <Button onClick={() => setActiveTab('create-product')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>

          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold">{product.title}</h3>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    <p className="text-muted-foreground">{product.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4" />
                        Preço: {formatCurrency(product.full_price)}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4" />
                        Entrada: {formatCurrency(product.down_payment)}
                      </span>
                      {product.professional_name && (
                        <span className="text-muted-foreground">
                          Por: {product.professional_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyProductLink(product.id)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Link
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* MLM Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Planos MLM</h3>
            <Button onClick={() => window.location.href = '/admin/planos'}>
              <Plus className="mr-2 h-4 w-4" />
              Gerenciar Planos
            </Button>
          </div>

          <div className="grid gap-4">
            {customPlans.map((plan) => (
              <Card key={plan.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      <Badge variant={plan.active ? "default" : "secondary"}>
                        {plan.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline">{plan.plan_code}</Badge>
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4" />
                        Total: {formatCurrency(plan.total_price)}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4" />
                        Entrada: {formatCurrency(plan.entry_price)}
                      </span>
                      <span>
                        {plan.max_participants} participantes/grupo
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyProductLink(plan.id, 'plan')}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Link
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Create Product Tab */}
        <TabsContent value="create-product" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Novo Produto</CardTitle>
              <CardDescription>
                Adicione um novo produto ao marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Nome do Produto *</Label>
                  <Input
                    id="title"
                    value={productForm.title}
                    onChange={(e) => setProductForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Creme Facial Premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_price">Preço Total (R$) *</Label>
                  <Input
                    id="full_price"
                    type="number"
                    step="0.01"
                    value={productForm.full_price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, full_price: e.target.value }))}
                    placeholder="199.90"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="down_payment">Entrada (R$)</Label>
                  <Input
                    id="down_payment"
                    type="number"
                    step="0.01"
                    value={productForm.down_payment}
                    onChange={(e) => setProductForm(prev => ({ ...prev, down_payment: e.target.value }))}
                    placeholder="Deixe vazio para 30% automático"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">URL da Imagem</Label>
                  <Input
                    id="image_url"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="external_link">Link Externo (Dropshipping)</Label>
                  <Input
                    id="external_link"
                    value={productForm.external_link}
                    onChange={(e) => setProductForm(prev => ({ ...prev, external_link: e.target.value }))}
                    placeholder="https://loja-externa.com/produto"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o produto detalhadamente..."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={productForm.is_active}
                  onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Produto ativo</Label>
              </div>

              <Button
                onClick={handleCreateProduct}
                disabled={loading}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Criar Produto"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Produtos
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">
                  produtos no marketplace
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Planos MLM
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customPlans.length}</div>
                <p className="text-xs text-muted-foreground">
                  planos ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Produtos Ativos
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.is_active).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  visíveis aos usuários
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}