import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Eye, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  valor_total: number;
  percentual_entrada: number;
  image_url: string;
  ativo: boolean;
  approved: boolean;
  created_at: string;
  professional_id: string;
  professionals?: {
    full_name: string;
    email: string;
    category: string;
  };
}

export const MarketplaceManager: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          professionals (
            full_name,
            email,
            category
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading marketplace products:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos do marketplace",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (productId: string, approved: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updateData = {
        approved,
        approved_by: user.id,
        approved_at: approved ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('marketplace_products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Produto ${approved ? 'aprovado' : 'rejeitado'} com sucesso`
      });

      loadProducts();
    } catch (error: any) {
      console.error('Error updating product approval:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar aprovação do produto",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredProducts = products.filter(product => {
    switch (filter) {
      case 'pending':
        return !product.approved;
      case 'approved':
        return product.approved;
      case 'rejected':
        return product.approved === false; // Explicitly false
      default:
        return true;
    }
  });

  const getStatusBadge = (product: MarketplaceProduct) => {
    if (product.approved === true) {
      return <Badge variant="default">Aprovado</Badge>;
    } else if (product.approved === false) {
      return <Badge variant="destructive">Rejeitado</Badge>;
    } else {
      return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando produtos do marketplace...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Marketplace</h2>
        
        <div className="flex space-x-2">
          <Badge variant="outline">
            Total: {products.length}
          </Badge>
          <Badge variant="secondary">
            Pendentes: {products.filter(p => p.approved === null).length}
          </Badge>
          <Badge variant="default">
            Aprovados: {products.filter(p => p.approved === true).length}
          </Badge>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
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
                    {getStatusBadge(product)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Por: {product.professionals?.full_name || 'N/A'}
                  </p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    <p className="text-sm"><strong>Categoria:</strong> {product.category}</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(product.valor_total)}</p>
                    <p className="text-sm text-gray-500">
                      Entrada: {product.percentual_entrada}% ({formatCurrency(product.valor_total * (product.percentual_entrada / 100))})
                    </p>
                    <p className="text-xs text-gray-400">
                      Criado em: {formatDate(product.created_at)}
                    </p>
                    
                    <div className="flex justify-between items-center pt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Produto</DialogTitle>
                          </DialogHeader>
                          
                          {selectedProduct && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Produto:</strong> {selectedProduct.name}
                                </div>
                                <div>
                                  <strong>Categoria:</strong> {selectedProduct.category}
                                </div>
                                <div>
                                  <strong>Profissional:</strong> {selectedProduct.professionals?.full_name}
                                </div>
                                <div>
                                  <strong>Email:</strong> {selectedProduct.professionals?.email}
                                </div>
                                <div>
                                  <strong>Valor Total:</strong> {formatCurrency(selectedProduct.valor_total)}
                                </div>
                                <div>
                                  <strong>Entrada:</strong> {selectedProduct.percentual_entrada}%
                                </div>
                              </div>
                              
                              <div>
                                <strong>Descrição:</strong>
                                <p className="mt-1 text-gray-600">{selectedProduct.description}</p>
                              </div>
                              
                              {selectedProduct.image_url && (
                                <div>
                                  <strong>Imagem:</strong>
                                  <img 
                                    src={selectedProduct.image_url} 
                                    alt={selectedProduct.name}
                                    className="mt-2 max-w-full h-64 object-cover rounded"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {product.approved === null && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleApproval(product.id, true)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleApproval(product.id, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {filter === 'pending' && 'Nenhum produto pendente de aprovação.'}
                  {filter === 'approved' && 'Nenhum produto aprovado ainda.'}
                  {filter === 'rejected' && 'Nenhum produto rejeitado.'}
                  {filter === 'all' && 'Nenhum produto do marketplace encontrado.'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Os profissionais podem cadastrar produtos através do painel deles.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};