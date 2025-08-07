import React from 'react';
import { useDiagnostic } from './DiagnosticProvider';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export const DiagnosticDisplay: React.FC = () => {
  const { connectionStatus, lastError, testConnection } = useDiagnostic();

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'testing':
        return 'Testando conexão...';
      case 'connected':
        return 'Conexão estabelecida com sucesso';
      case 'failed':
        return `Falha na conexão: ${lastError}`;
      default:
        return 'Status da conexão desconhecido';
    }
  };

  if (connectionStatus === 'connected') {
    return null; // Não mostrar nada se estiver conectado
  }

  return (
    <Alert className="mb-4">
      {getStatusIcon()}
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span>{getStatusMessage()}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={connectionStatus === 'testing'}
          >
            Testar Novamente
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};