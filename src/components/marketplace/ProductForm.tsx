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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ServiceFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  duration: string;
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
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: 'produtos-gerais',
    price: 0,
    duration: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (field: keyof ServiceFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar serviços.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get professional ID from professionals table
      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!professional) {
        toast({
          title: "Erro",
          description: "Você precisa ser um profissional cadastrado para criar serviços.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('services')
        .insert({
          professional_id: professional.id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          duration: formData.duration
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Serviço criado!",
        description: "Seu serviço foi cadastrado com sucesso e já está disponível no marketplace.",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'produtos-gerais',
        price: 0,
        duration: ''
      });

    } catch (error: any) {
      toast({
        title: "Erro ao criar serviço",
        description: error.message || "Erro inesperado ao cadastrar o serviço.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.description && formData.category && formData.price > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Cadastrar Novo Serviço
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Nome do Serviço
            </Label>
            <Input
              id="name"
              placeholder="Ex: Consultoria em Marketing Digital"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva detalhadamente seu serviço..."
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

          {/* Duração */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duração</Label>
            <Input
              id="duration"
              placeholder="Ex: 2 horas, 1 dia, 1 semana"
              value={formData.duration}
              onChange={(e) => handleInputChange("duration", e.target.value)}
              required
            />
          </div>

          {/* Botão de Submit */}
          <Button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Cadastrando..." : "Cadastrar Serviço"}
          </Button>

          {/* Informações sobre comissões */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Informações sobre comissões:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Você receberá o valor integral do serviço quando contratado</p>
              <p>• Influenciadores ganham comissão quando indicam seu serviço</p>
              <p>• Um link único será gerado automaticamente para compartilhamento</p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};