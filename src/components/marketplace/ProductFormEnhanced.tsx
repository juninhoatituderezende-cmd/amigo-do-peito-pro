import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleFileUpload } from "@/components/ui/simple-file-upload";
import { Switch } from "@/components/ui/switch";
import { Upload, Package, DollarSign, Tag, Image, Save, ExternalLink, Eye, Users, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  target_audience: 'professional' | 'consumer' | 'both';
  image_url?: string;
  external_link?: string;
  featured: boolean;
  stock_quantity: number;
}

interface Category {
  name: string;
  description: string;
}

const TARGET_AUDIENCES = [
  { value: "professional", label: "Profissionais", icon: Users, description: "Insumos e materiais para profissionais" },
  { value: "consumer", label: "Consumidor Final", icon: ShoppingCart, description: "Produtos/serviços para clientes finais" },
  { value: "both", label: "Ambos", icon: Package, description: "Disponível para ambos os públicos" }
];

export const ProductFormEnhanced = ({ onProductCreated }: { onProductCreated?: () => void }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    price: 0,
    target_audience: 'consumer',
    image_url: '',
    external_link: '',
    featured: false,
    stock_quantity: -1
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('name, description')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      
      toast({
        title: "Imagem enviada!",
        description: "A imagem foi carregada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao fazer upload da imagem.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar produtos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get professional ID from profiles table
      const { data: professional } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'professional')
        .single();

      if (!professional) {
        toast({
          title: "Erro",
          description: "Você precisa ser um profissional cadastrado para criar produtos.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          professional_id: professional.id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          target_audience: formData.target_audience,
          image_url: formData.image_url || null,
          external_link: formData.external_link || null,
          featured: formData.featured,
          stock_quantity: formData.stock_quantity,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Produto criado!",
        description: "Seu produto foi cadastrado com sucesso e já está disponível no marketplace.",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        price: 0,
        target_audience: 'consumer',
        image_url: '',
        external_link: '',
        featured: false,
        stock_quantity: -1
      });

      onProductCreated?.();

    } catch (error: any) {
      toast({
        title: "Erro ao criar produto",
        description: error.message || "Erro inesperado ao cadastrar o produto.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.description && formData.category && formData.price > 0;

  return (
    <div className="w-full">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Cadastrar Novo Produto/Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Público Alvo */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Público Alvo</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TARGET_AUDIENCES.map((audience) => {
                  const Icon = audience.icon;
                  return (
                    <Card 
                      key={audience.value} 
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        formData.target_audience === audience.value 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleInputChange('target_audience', audience.value as 'professional' | 'consumer' | 'both')}
                    >
                      <CardContent className="p-4 text-center">
                        <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <h3 className="font-medium">{audience.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{audience.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Nome do Produto/Serviço
              </Label>
              <Input
                id="name"
                placeholder="Ex: Kit Agulhas Profissionais ou Harmonização Facial"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição Detalhada</Label>
              <Textarea
                id="description"
                placeholder="Descreva detalhadamente seu produto/serviço, benefícios, diferencieis..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.description || category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Preço (R$)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 500.00"
                required
              />
            </div>

            {/* Upload de Imagem */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Imagem do Produto
              </Label>
              <SimpleFileUpload
                onFileSelect={handleImageUpload}
                accept="image/*"
                className="w-full"
              />
              {formData.image_url && (
                <div className="mt-2">
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="max-w-xs h-32 object-cover rounded border"
                  />
                </div>
              )}
            </div>

            {/* Link Externo (Dropshipping) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Link Externo (Opcional)
              </Label>
              <Input
                placeholder="https://exemplo.com/produto (para dropshipping ou links externos)"
                value={formData.external_link}
                onChange={(e) => handleInputChange("external_link", e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Use este campo para produtos de dropshipping ou links para agendamento externo
              </p>
            </div>

            {/* Controle de Estoque */}
            <div className="space-y-2">
              <Label>Controle de Estoque</Label>
              <Input
                type="number"
                min="-1"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || -1)}
                placeholder="-1 para ilimitado"
              />
              <p className="text-sm text-muted-foreground">
                -1 = Estoque ilimitado | 0 = Fora de estoque | Número positivo = Quantidade disponível
              </p>
            </div>

            {/* Produto em Destaque */}
            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => handleInputChange('featured', checked)}
              />
              <Label htmlFor="featured" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Produto em Destaque
              </Label>
            </div>

            {/* Botão de Submit */}
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Cadastrando..." : "Cadastrar Produto/Serviço"}
            </Button>

            {/* Informações sobre comissões */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Sistema de Comissões:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>Venda Direta:</strong> Você recebe 50% do valor, plataforma 50%</p>
                <p>• <strong>Venda com Influenciador:</strong> Você 50%, Influenciador 20%, Plataforma 30%</p>
                <p>• Links únicos são gerados automaticamente para compartilhamento</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};