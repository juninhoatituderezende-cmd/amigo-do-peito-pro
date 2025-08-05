import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleFileUpload } from "@/components/ui/simple-file-upload";
import { Upload, Package, DollarSign, Tag, Image, Save, ExternalLink, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ProductFormData {
  title: string;
  description: string;
  category: string;
  full_price: number;
  image_url: string;
  external_link: string;
  visibility: 'client' | 'professional' | 'both';
}

const CATEGORIES = [
  { value: "produtos-gerais", label: "Produtos Gerais" },
  { value: "insumos-tecnicos", label: "Insumos Técnicos" },
  { value: "servicos-profissionais", label: "Serviços Profissionais" },
  { value: "produtos-digitais", label: "Produtos Digitais" },
  { value: "cursos-online", label: "Cursos Online" },
  { value: "consultoria", label: "Consultoria" },
  { value: "eventos", label: "Eventos" },
  { value: "outros", label: "Outros" }
];

export const ProductForm = () => {
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    category: 'produtos-gerais',
    full_price: 0,
    image_url: '',
    external_link: '',
    visibility: 'both'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
    toast({
      title: "Imagem carregada!",
      description: "A imagem foi carregada com sucesso.",
    });
  };

  const calculateDownPayment = () => {
    // Se é dropshipping, não há entrada
    if (formData.external_link) {
      return 0;
    }
    return formData.full_price * 0.1; // 10% de entrada para produtos internos
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
      const { data, error } = await supabase
        .from('products')
        .insert({
          professional_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          full_price: formData.full_price,
          down_payment: calculateDownPayment(),
          image_url: formData.image_url,
          external_link: formData.external_link || null,
          visibility: formData.visibility
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
        title: '',
        description: '',
        category: 'produtos-gerais',
        full_price: 0,
        image_url: '',
        external_link: '',
        visibility: 'both'
      });

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

  const isFormValid = formData.title && formData.description && formData.category && 
                     (formData.external_link || formData.full_price > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Cadastrar Novo Produto/Serviço
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Título do Produto/Serviço
            </Label>
            <Input
              id="title"
              placeholder="Ex: Consultoria em Marketing Digital"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva detalhadamente seu produto ou serviço..."
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
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibilidade */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visibilidade
            </Label>
            <Select value={formData.visibility} onValueChange={(value) => handleInputChange('visibility', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Quem pode ver este produto?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Todos os usuários</SelectItem>
                <SelectItem value="client">Apenas clientes</SelectItem>
                <SelectItem value="professional">Apenas profissionais</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Link Externo (Dropshipping) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Link Externo (Dropshipping)
            </Label>
            <Input
              type="url"
              value={formData.external_link}
              onChange={(e) => handleInputChange('external_link', e.target.value)}
              placeholder="https://... (opcional para produtos externos)"
            />
            <p className="text-xs text-muted-foreground">
              Se preenchido, o produto redirecionará para este link ao invés de processar pagamento interno
            </p>
          </div>

          {/* Preços (apenas se não for dropshipping) */}
          {!formData.external_link && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Preço Total (R$)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.full_price || ''}
                  onChange={(e) => handleInputChange('full_price', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 1000.00"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Entrada (10% do valor total)
                </Label>
                <Input
                  type="number"
                  value={calculateDownPayment().toFixed(2)}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Calculado automaticamente como 10% do preço total
                </p>
              </div>
            </>
          )}

          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Imagem do Produto
            </Label>
            <SimpleFileUpload
              onFileSelect={async (file: File) => {
                // For now, we'll just simulate the upload and use a placeholder
                const mockUrl = URL.createObjectURL(file);
                setFormData(prev => ({ ...prev, image_url: mockUrl }));
                handleImageUpload(mockUrl);
              }}
              accept="image/*"
            />
            {formData.image_url && (
              <div className="mt-2">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          {/* Botão de Submit */}
          <Button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Cadastrando..." : "Cadastrar Produto"}
          </Button>

          {/* Informações sobre o tipo de produto */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">
              {formData.external_link ? "Produto Dropshipping:" : "Produto Interno:"}
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {formData.external_link ? (
                <>
                  <p>• Este produto redirecionará para o link externo</p>
                  <p>• Não haverá processamento de pagamento interno</p>
                  <p>• Ideal para afiliados e parcerias</p>
                </>
              ) : (
                <>
                  <p>• Você receberá 50% do valor pago em cada venda</p>
                  <p>• Influenciadores ganham 25% quando indicam seu produto</p>
                  <p>• Um link único será gerado automaticamente para compartilhamento</p>
                </>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};