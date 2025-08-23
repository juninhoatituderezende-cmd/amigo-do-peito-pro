import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductFormEnhanced } from "@/components/marketplace/ProductFormEnhanced";
import { ProductListEnhanced } from "@/components/marketplace/ProductListEnhanced";
import { Plus, List, Package } from 'lucide-react';

export function AdminProductsManagerSimple() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleProductCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Marketplace - Gestão de Produtos</h2>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Listar Produtos
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Produto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <ProductListEnhanced refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="create">
          <ProductFormEnhanced onProductCreated={handleProductCreated} />
        </TabsContent>
      </Tabs>
    </div>
  );
}