import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Edit, Trash2, Plus } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  active: boolean;
  created_at: string;
  type?: 'service' | 'product';
}

export function AdminProductsManagerSimple() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      // Load from both services and products table
      const [servicesResponse, productsResponse] = await Promise.all([
        supabase.from('services').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false })
      ]);

      if (servicesResponse.error) throw servicesResponse.error;
      if (productsResponse.error) throw productsResponse.error;

      // Combine and format data
      const servicesData = (servicesResponse.data || []).map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        category: service.category,
        active: service.active,
        created_at: service.created_at,
        type: 'service' as const
      }));

      const productsData = (productsResponse.data || []).map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        active: product.active,
        created_at: product.created_at,
        type: 'product' as const
      }));

      const combinedData = [...servicesData, ...productsData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setServices(combinedData);
    } catch (error) {
      console.error('Erro ao carregar produtos/serviços:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos/serviços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      setServices(prev => 
        prev.map(service => 
          service.id === serviceId 
            ? { ...service, active: !currentStatus }
            : service
        )
      );

      toast({
        title: "Sucesso",
        description: `Serviço ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do serviço.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciar Produtos/Serviços</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Lista de Produtos/Serviços
          </CardTitle>
          <CardDescription>
            Gerencie todos os produtos e serviços disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.description || 'N/A'}</TableCell>
                  <TableCell>R$ {service.price.toFixed(2)}</TableCell>
                  <TableCell>{service.category || 'N/A'}</TableCell>
                  <TableCell>
                    {service.active ? (
                      <Badge className="bg-green-500">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleServiceStatus(service.id, service.active)}
                      >
                        {service.active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}