import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SecureFileUpload } from "@/components/SecureFileUpload";

interface UserProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  valor_total: number;
  percentual_entrada: number;
  image_url: string;
  ativo: boolean;
  target_audience: string;
  created_at: string;
  approved: boolean;
}

export const UserMarketplaceManager: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<UserProduct | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    valor_total: 0,
    percentual_entrada: 0,
    image_url: '',
    ativo: true
  });

  const categories = [
    'Acessórios',
    'Produtos de Beleza',
    'Suplementos',
    'Consultorias',
    'Cursos Online',
    'Produtos Físicos',
    'Outros'
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('target_audience', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading user marketplace products:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos do marketplace de usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const productData = {
        ...formData,
        target_audience: 'user',
        created_by: user.id,
        approved: true, // Admin products are auto-approved
        approved_by: user.id,
        approved_at: new Date().toISOString()
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('marketplace_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso!",
          description: "Produto atualizado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('marketplace_products')
          .insert([productData]);

        if (error) throw error;
        
        toast({
          title: "Sucesso!",
          description: "Produto cadastrado com sucesso"
        });
      }

      resetForm();
      loadProducts();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving user marketplace product:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar produto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Produto excluído com sucesso"
      });
      
      loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir produto",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: UserProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      valor_total: product.valor_total,
      percentual_entrada: product.percentual_entrada,
      image_url: product.image_url || '',
      ativo: product.ativo
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      valor_total: 0,
      percentual_entrada: 0,
      image_url: '',
      ativo: true
    });
    setEditingProduct(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando produtos para usuários...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Marketplace para Usuários</h2>
          <p className="text-sm text-muted-foreground">
            Produtos que usuários podem comprar com saldo de reembolso ou pagamento direto
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Produto
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto para Usuários'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor_total">Preço (R$)</Label>
                  <Input
                    id="valor_total"
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({...formData, valor_total: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="percentual_entrada">Desconto com Saldo (%)</Label>
                  <Input
                    id="percentual_entrada"
                    type="number"
                    step="0.1"
                    value={formData.percentual_entrada}
                    onChange={(e) => setFormData({...formData, percentual_entrada: parseFloat(e.target.value) || 0})}
                    placeholder="0 = sem desconto"
                  />
                </div>
              </div>

              <div>
                <Label>Imagem do Produto</Label>
                <SecureFileUpload
                  type="image"
                  category="marketplace_products"
                  onUploadComplete={(result) => {
                    setFormData({...formData, image_url: result.url});
                    toast({
                      title: "Upload concluído",
                      description: "Imagem enviada com sucesso!"
                    });
                  }}
                  label="Selecionar Imagem"
                  description="Clique ou arraste uma imagem para fazer upload"
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <img src={formData.image_url} alt="Preview" className="w-20 h-20 object-cover rounded" />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
                />
                <Label htmlFor="ativo">Produto Ativo</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingProduct ? 'Atualizar' : 'Cadastrar'} Produto
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            {product.image_url && (
              <div className="h-48 bg-gray-200">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="flex space-x-1">
                  <Badge variant={product.ativo ? "default" : "secondary"}>
                    {product.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <Badge variant="outline">Usuários</Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                <p className="text-sm"><strong>Categoria:</strong> {product.category}</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(product.valor_total)}</p>
                {product.percentual_entrada > 0 && (
                  <p className="text-sm text-blue-600">
                    Desconto com saldo: {product.percentual_entrada}%
                  </p>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum produto para usuários cadastrado ainda.</p>
            <p className="text-sm text-gray-400 mt-2">
              Clique em "Cadastrar Produto" para adicionar o primeiro produto do marketplace de usuários.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};