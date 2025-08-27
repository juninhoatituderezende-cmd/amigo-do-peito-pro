import React from 'react';
import Header from "@/components/Header";
import DashboardFooter from "@/components/DashboardFooter";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Construction } from "lucide-react";

const Marketplace = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirecionar usuários não logados para login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
          <p className="text-muted-foreground">
            Descubra produtos e serviços incríveis de profissionais qualificados
          </p>
        </div>

        {/* Placeholder Content */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <ShoppingCart className="h-16 w-16 text-primary" />
                <Construction className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 bg-background rounded-full p-1" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mb-4">Marketplace em Construção</h2>
            <p className="text-muted-foreground mb-6">
              Estamos preparando uma experiência incrível para você descobrir produtos e serviços 
              de profissionais qualificados. Em breve, você poderá navegar por uma variedade de 
              ofertas especiais!
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Produtos Exclusivos</h3>
                    <p className="text-sm text-muted-foreground">
                      Acesso a produtos únicos de profissionais verificados
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShoppingCart className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Compra Segura</h3>
                    <p className="text-sm text-muted-foreground">
                      Sistema de pagamento seguro com créditos da plataforma
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="mt-6"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <DashboardFooter />
    </div>
  );
};

export default Marketplace;