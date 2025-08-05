import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleFileUpload } from "@/components/ui/simple-file-upload";
import { Upload, Package, DollarSign, Tag, Image, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ProductFormData {
  title: string;
  description: string;
  category: string;
  fullPrice: string;
  imageUrl: string;
}

const CATEGORIES = [
  { value: "servicos-profissionais", label: "Serviços Profissionais" },
  { value: "produtos-digitais", label: "Produtos Digitais" },
  { value: "cursos-online", label: "Cursos Online" },
  { value: "consultoria", label: "Consultoria" },
  { value: "eventos", label: "Eventos" },
  { value: "outros", label: "Outros" }
];

export const ProductForm = () => {
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    category: "",
    fullPrice: "",
    imageUrl: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
    toast({
      title: "Imagem carregada!",
      description: "A imagem foi carregada com sucesso.",
    });
  };

  const calculateDownPayment = (fullPrice: string) => {
    const price = parseFloat(fullPrice);
    if (isNaN(price)) return "0.00";
    return (price * 0.1).toFixed(2);
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
      const fullPrice = parseFloat(formData.fullPrice);
      const downPayment = fullPrice * 0.1;

      const { data, error } = await supabase
        .from('products')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          full_price: fullPrice,
          down_payment: downPayment,
          image_url: formData.imageUrl,
          professional_id: user.id,
          is_active: true
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
        title: "",
        description: "",
        category: "",
        fullPrice: "",
        imageUrl: ""
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

  const isFormValid = formData.title && formData.category && formData.fullPrice && parseFloat(formData.fullPrice) > 0;

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
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
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

          {/* Preços */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullPrice" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Preço Cheio (R$)
              </Label>
              <Input
                id="fullPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.fullPrice}
                onChange={(e) => handleInputChange("fullPrice", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Entrada (10%)
              </Label>
              <Input
                type="text"
                value={`R$ ${calculateDownPayment(formData.fullPrice)}`}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

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
                setFormData(prev => ({ ...prev, imageUrl: mockUrl }));
                handleImageUpload(mockUrl);
              }}
              accept="image/*"
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
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

          {/* Informações sobre comissões */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Informações sobre Comissões:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Você receberá 50% do valor pago em cada venda</p>
              <p>• Influenciadores ganham 25% quando indicam seu produto</p>
              <p>• Um link único será gerado automaticamente para compartilhamento</p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};