import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from 'lucide-react';

export function AsaasSplitDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Asaas Split</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Sistema em Configuração
          </CardTitle>
          <CardDescription>
            O sistema de Split de Pagamentos Asaas está sendo configurado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade estará disponível em breve. O sistema de Split permite:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Divisão automática de pagamentos</li>
            <li>Gestão de comissões</li>
            <li>Relatórios financeiros</li>
            <li>Integração com Asaas</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}