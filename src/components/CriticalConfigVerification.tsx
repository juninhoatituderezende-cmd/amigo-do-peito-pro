import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ConfigCheck {
  name: string;
  status: 'checking' | 'success' | 'error' | 'unknown';
  message: string;
  details?: any;
}

export const CriticalConfigVerification = () => {
  const { toast } = useToast();
  const [checks, setChecks] = useState<ConfigCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateCheck = (name: string, status: ConfigCheck['status'], message: string, details?: any) => {
    setChecks(prev => {
      const newChecks = [...prev];
      const index = newChecks.findIndex(c => c.name === name);
      if (index >= 0) {
        newChecks[index] = { name, status, message, details };
      } else {
        newChecks.push({ name, status, message, details });
      }
      return newChecks;
    });
  };

  const runCriticalVerification = async () => {
    setIsRunning(true);
    setChecks([]);

    // 1. Verificar se Google Provider está habilitado
    updateCheck('GOOGLE_PROVIDER', 'checking', 'Verificando se Google Provider está habilitado...');
    
    try {
      const response = await fetch('https://rczygmsaybzcrmdxxyge.supabase.co/auth/v1/settings', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const settings = await response.json();
        console.log('🔍 Supabase Auth Settings:', settings);
        
        if (settings.external?.google?.enabled) {
          updateCheck('GOOGLE_PROVIDER', 'success', 'Google Provider está HABILITADO', {
            enabled: settings.external.google.enabled,
            clientId: settings.external.google.client_id ? 'Configurado' : 'NÃO CONFIGURADO'
          });
          
          if (!settings.external.google.client_id) {
            updateCheck('CLIENT_ID', 'error', 'Client ID NÃO está configurado no Supabase!');
          } else {
            updateCheck('CLIENT_ID', 'success', 'Client ID está configurado');
          }
        } else {
          updateCheck('GOOGLE_PROVIDER', 'error', 'Google Provider NÃO está habilitado no Supabase!');
        }
      } else {
        updateCheck('GOOGLE_PROVIDER', 'error', `Erro ao verificar configuração: ${response.status}`);
      }
    } catch (err) {
      updateCheck('GOOGLE_PROVIDER', 'error', 'Erro ao acessar configurações do Supabase', err);
    }

    // 2. Verificar URLs atuais
    const currentOrigin = window.location.origin;
    const supabaseUrl = 'https://rczygmsaybzcrmdxxyge.supabase.co';
    
    updateCheck('URLS_CHECK', 'unknown', 'URLs que devem estar configuradas', {
      googleCloudOrigins: [supabaseUrl, currentOrigin],
      googleCloudRedirect: `${supabaseUrl}/auth/v1/callback`,
      supabaseSiteUrl: currentOrigin,
      supabaseRedirectUrl: `${currentOrigin}/**`
    });

    // 3. Teste de conectividade OAuth
    updateCheck('OAUTH_TEST', 'checking', 'Testando geração de URL OAuth...');
    
    try {
      // Não vamos realmente fazer login, só testar se consegue gerar a URL
      const response = await fetch(`${supabaseUrl}/auth/v1/authorize?provider=google`, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      updateCheck('OAUTH_TEST', 'success', 'Endpoint OAuth responde');
    } catch (err) {
      updateCheck('OAUTH_TEST', 'error', 'Problema no endpoint OAuth', err);
    }

    setIsRunning(false);
    
    toast({
      title: "✅ Verificação completa",
      description: "Verifique os resultados abaixo",
      variant: "default",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking': return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'checking': return 'bg-blue-50 border-blue-200';
      default: return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Verificação Crítica - Erro 403
          </CardTitle>
          <CardDescription>
            Verificando as 3 configurações essenciais para resolver o erro 403
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erro 403 persistente:</strong> Uma das 3 configurações críticas não está correta. Vamos verificar cada uma.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={runCriticalVerification}
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? 'Verificando...' : '🔍 Verificar 3 Configurações Críticas'}
          </Button>

          {/* Resultados da verificação */}
          {checks.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">📋 Resultados da Verificação:</h4>
              {checks.map((check, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <div className="font-medium">{check.name}</div>
                      <div className="text-sm mt-1">{check.message}</div>
                      {check.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer font-medium">Ver detalhes</summary>
                          <pre className="text-xs bg-white/70 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(check.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instruções específicas para cada configuração */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Configuração 1: Google Provider */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-2">🔧 1. Google Provider no Supabase</h4>
              <div className="text-sm text-red-700 space-y-2">
                <p><strong>Verificar:</strong></p>
                <ul className="text-xs space-y-1">
                  <li>• Toggle "Enable sign in with Google" está VERDE</li>
                  <li>• Client ID preenchido</li>
                  <li>• Client Secret preenchido</li>
                  <li>• Botão "Save" foi clicado</li>
                </ul>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://supabase.com/dashboard/project/rczygmsaybzcrmdxxyge/auth/providers', '_blank')}
                  className="w-full text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Verificar Agora
                </Button>
              </div>
            </div>

            {/* Configuração 2: Google Cloud Console */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">☁️ 2. Google Cloud Console</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p><strong>Authorized JavaScript origins:</strong></p>
                <div className="bg-white p-1 rounded text-xs font-mono">
                  https://rczygmsaybzcrmdxxyge.supabase.co<br/>
                  {window.location.origin}
                </div>
                <p><strong>Authorized redirect URIs:</strong></p>
                <div className="bg-white p-1 rounded text-xs font-mono">
                  https://rczygmsaybzcrmdxxyge.supabase.co/auth/v1/callback
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                  className="w-full text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Verificar Agora
                </Button>
              </div>
            </div>

            {/* Configuração 3: Supabase URL Config */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">📐 3. Supabase URL Config</h4>
              <div className="text-sm text-green-700 space-y-2">
                <p><strong>Site URL:</strong></p>
                <div className="bg-white p-1 rounded text-xs font-mono">
                  {window.location.origin}
                </div>
                <p><strong>Redirect URLs:</strong></p>
                <div className="bg-white p-1 rounded text-xs font-mono">
                  {window.location.origin}/**
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://supabase.com/dashboard/project/rczygmsaybzcrmdxxyge/auth/url-configuration', '_blank')}
                  className="w-full text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Verificar Agora
                </Button>
              </div>
            </div>
          </div>

          {/* Checklist final */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">✅ Checklist Final (todos devem estar ✅):</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-yellow-800">Supabase:</p>
                <ul className="text-yellow-700 space-y-1">
                  <li>□ Google toggle verde</li>
                  <li>□ Client ID preenchido</li>
                  <li>□ Client Secret preenchido</li>
                  <li>□ Configuração salva</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-yellow-800">Google Cloud:</p>
                <ul className="text-yellow-700 space-y-1">
                  <li>□ 2 JavaScript origins</li>
                  <li>□ 1 Redirect URI</li>
                  <li>□ OAuth consent screen</li>
                  <li>□ Credenciais salvas</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-yellow-800">URLs:</p>
                <ul className="text-yellow-700 space-y-1">
                  <li>□ Site URL correta</li>
                  <li>□ Redirect URL com /**</li>
                  <li>□ Configuração salva</li>
                  <li>□ Aguardado propagação</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};