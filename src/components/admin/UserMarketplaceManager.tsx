import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminProductsManagerSimple } from "./AdminProductsManagerSimple";
import { CustomPlansManager } from "./CustomPlansManager";
import { ShoppingBag, Package, Users, TrendingUp } from 'lucide-react';

export function UserMarketplaceManager() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Marketplace - Painel de Controle</h2>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Produtos & Serviços
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Planos Customizados
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Análise de Vendas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Gerenciamento de Produtos
              </CardTitle>
              <CardDescription>
                Gerencie todos os produtos e serviços disponíveis no marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminProductsManagerSimple />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
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

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análise de Vendas
              </CardTitle>
              <CardDescription>
                Visualize métricas e relatórios de performance do marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">156</div>
                    <p className="text-sm text-muted-foreground">Total de Produtos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">89</div>
                    <p className="text-sm text-muted-foreground">Vendas este Mês</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">R$ 12.450</div>
                    <p className="text-sm text-muted-foreground">Receita Total</p>
                  </CardContent>
                </Card>
              </div>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Relatórios Avançados</h3>
                <p className="text-muted-foreground">
                  Sistema de análise avançada será implementado em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}