import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminProductsManagerSimple } from "@/components/admin/AdminProductsManagerSimple";
import { CustomPlansManager } from "@/components/admin/CustomPlansManager";
import { UserMarketplaceManager } from "@/components/admin/UserMarketplaceManager";
import { ProfessionalMarketplaceManager } from "@/components/admin/ProfessionalMarketplaceManager";
import { 
  ShoppingBag, 
  Package, 
  Users, 
  Building, 
  TrendingUp, 
  DollarSign,
  Plus,
  BarChart3
} from 'lucide-react';

export default function AdminMarketplace() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Marketplace - Centro de Controle</h1>
          <p className="text-muted-foreground text-lg">
            Gerencie todos os aspectos do marketplace: produtos, planos, profissionais e vendas
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="professionals" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Profissionais
            </TabsTrigger>
          </TabsList>

          {/* VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">247</div>
                      <p className="text-sm text-muted-foreground">Total de Produtos</p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">38</div>
                      <p className="text-sm text-muted-foreground">Planos Ativos</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">1,234</div>
                      <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                    </div>
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">89</div>
                      <p className="text-sm text-muted-foreground">Profissionais</p>
                    </div>
                    <Building className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Ações Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setActiveTab("products")} 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Novo Produto
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("plans")} 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Plano Customizado
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("professionals")} 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Aprovar Profissionais
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Métricas de Vendas (Últimos 30 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Receita Total</span>
                      <span className="font-bold">R$ 45.678,90</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comissões Pagas</span>
                      <span className="font-bold">R$ 12.345,67</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transações</span>
                      <span className="font-bold">234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Conversão</span>
                      <span className="font-bold">3.4%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PRODUTOS */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Gerenciamento de Produtos e Serviços
                </CardTitle>
                <CardDescription>
                  Controle completo sobre todos os produtos e serviços do marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminProductsManagerSimple />
              </CardContent>
            </Card>
          </TabsContent>

          {/* PLANOS */}
          <TabsContent value="plans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Planos Customizados
                </CardTitle>
                <CardDescription>
                  Crie e gerencie planos especiais com recursos personalizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomPlansManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* USUÁRIOS */}
          <TabsContent value="users" className="space-y-6">
            <UserMarketplaceManager />
          </TabsContent>

          {/* PROFISSIONAIS */}
          <TabsContent value="professionals" className="space-y-6">
            <ProfessionalMarketplaceManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}