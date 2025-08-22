import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from 'lucide-react';

export function ProfessionalMarketplaceManager() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Marketplace Profissional</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Sistema em Configuração
          </CardTitle>
          <CardDescription>
            O sistema de Marketplace Profissional está sendo configurado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}