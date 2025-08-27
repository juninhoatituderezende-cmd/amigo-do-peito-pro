import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building, Users, DollarSign, Package, UserCheck, UserX, Search, Eye } from 'lucide-react';

interface Professional {
  id: string;
  full_name: string;
  email: string;
  role: string;
  approved: boolean;
  created_at: string;
}

interface ProfessionalService {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  active: boolean;
  professional_id: string;
  professional_name: string;
}

export function ProfessionalMarketplaceManager() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load professionals
      const { data: professionalsData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'professional')
        .order('created_at', { ascending: false });

      if (profError) throw profError;

      // Load products with professional info
      const { data: servicesData, error: servError } = await supabase
        .from('products')
        .select(`
          *,
          professional:profiles!products_professional_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (servError) throw servError;

      setProfessionals(professionalsData || []);
      
      const formattedServices = (servicesData || []).map(service => ({
        ...service,
        professional_name: service.professional?.full_name || 'N/A'
      }));
      
      setServices(formattedServices);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos profissionais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProfessional = async (id: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approved })
        .eq('id', id);

      if (error) throw error;

      setProfessionals(prev => 
        prev.map(prof => 
          prof.id === id ? { ...prof, approved } : prof
        )
      );

      toast({
        title: "Sucesso",
        description: `Profissional ${approved ? 'aprovado' : 'rejeitado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar profissional:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do profissional.",
        variant: "destructive",
      });
    }
  };

  const handleToggleService = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
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
        description: "Erro ao atualizar serviço.",
        variant: "destructive",
      });
    }
  };

  const filteredProfessionals = professionals.filter(prof =>
    prof.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prof.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter(service =>
    service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.professional_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingProfessionals = professionals.filter(p => !p.approved).length;
  const totalServices = services.length;
  const activeServices = services.filter(s => s.active).length;
  const totalRevenue = services.reduce((sum, s) => sum + (s.price || 0), 0);

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
        <h2 className="text-3xl font-bold tracking-tight">Marketplace Profissional</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar profissionais ou serviços..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-80"
          />
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{professionals.length}</div>
                <p className="text-sm text-muted-foreground">Total Profissionais</p>
              </div>
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{pendingProfessionals}</div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
              <UserCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{activeServices}/{totalServices}</div>
                <p className="text-sm text-muted-foreground">Serviços Ativos</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="professionals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="professionals" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Profissionais ({professionals.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Serviços ({services.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="professionals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Profissionais</CardTitle>
              <CardDescription>
                Gerencie aprovações e monitore atividade dos profissionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessionals.map((professional) => (
                    <TableRow key={professional.id}>
                      <TableCell className="font-medium">
                        {professional.full_name || 'Nome não informado'}
                      </TableCell>
                      <TableCell>{professional.email}</TableCell>
                      <TableCell>
                        {professional.approved ? (
                          <Badge className="bg-green-500">Aprovado</Badge>
                        ) : (
                          <Badge variant="destructive">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(professional.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {!professional.approved ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveProfessional(professional.id, true)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveProfessional(professional.id, false)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Serviços dos Profissionais</CardTitle>
              <CardDescription>
                Monitore e gerencie todos os serviços oferecidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-muted-foreground">
                              {service.description.substring(0, 50)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{service.professional_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>R$ {service.price?.toFixed(2) || '0.00'}</TableCell>
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
                            onClick={() => handleToggleService(service.id, service.active)}
                          >
                            {service.active ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}