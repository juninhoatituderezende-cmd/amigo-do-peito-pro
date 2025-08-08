import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

export const AdvancedOAuthDiagnostic = () => {
  const { toast } = useToast();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [urlParams, setUrlParams] = useState<any>({});

  useEffect(() => {
    // Capturar parâmetros da URL para análise
    const params = new URLSearchParams(window.location.search);
    const urlData = {
      hasCode: params.has('code'),
      hasError: params.has('error'),
      hasAccessToken: params.has('access_token'),
      hasTokenType: params.has('token_type'),
      error: params.get('error'),
      errorDescription: params.get('error_description'),
      allParams: Object.fromEntries(params.entries())
    };
    setUrlParams(urlData);

    if (urlData.hasError) {
      addDiagnostic('URL_ANALYSIS', 'error', `OAuth Error in URL: ${urlData.error}`, urlData);
    } else if (urlData.hasCode || urlData.hasAccessToken) {
      addDiagnostic('URL_ANALYSIS', 'info', 'OAuth parameters detected in URL', urlData);
    }
  }, []);

  const addDiagnostic = (step: string, status: 'success' | 'error' | 'warning' | 'info', message: string, details?: any) => {
    setDiagnostics(prev => [...prev, { step, status, message, details }]);
    console.log(`🔍 ${step}: ${message}`, details);
  };

  const runCompleteDiagnostic = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    
    try {
      // 1. Testar conexão básica com Supabase
      addDiagnostic('SUPABASE_CONNECTION', 'info', 'Testing Supabase connection...');
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
          addDiagnostic('SUPABASE_CONNECTION', 'error', 'Database connection failed', error);
        } else {
          addDiagnostic('SUPABASE_CONNECTION', 'success', 'Database connection successful');
        }
      } catch (err) {
        addDiagnostic('SUPABASE_CONNECTION', 'error', 'Connection test failed', err);
      }

      // 2. Verificar configuração de auth
      addDiagnostic('AUTH_CONFIG', 'info', 'Checking auth configuration...');
      try {
        const response = await fetch('https://rczygmsaybzcrmdxxyge.supabase.co/auth/v1/settings', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const settings = await response.json();
          addDiagnostic('AUTH_CONFIG', 'success', 'Auth settings retrieved', settings);
          
          // Verificar se Google está habilitado
          if (settings.external?.google?.enabled) {
            addDiagnostic('GOOGLE_PROVIDER', 'success', 'Google provider is enabled', {
              clientId: settings.external?.google?.client_id ? 'Present' : 'Missing'
            });
          } else {
            addDiagnostic('GOOGLE_PROVIDER', 'error', 'Google provider is NOT enabled or not configured');
          }
        } else {
          addDiagnostic('AUTH_CONFIG', 'error', `Failed to fetch auth settings: ${response.status}`);
        }
      } catch (err) {
        addDiagnostic('AUTH_CONFIG', 'error', 'Auth config check failed', err);
      }

      // 3. Verificar URLs atuais
      const currentOrigin = window.location.origin;
      const supabaseUrl = 'https://rczygmsaybzcrmdxxyge.supabase.co';
      
      addDiagnostic('URL_VALIDATION', 'info', 'Current environment URLs', {
        currentOrigin,
        supabaseUrl,
        expectedRedirectUri: `${supabaseUrl}/auth/v1/callback`,
        currentRedirectTarget: `${currentOrigin}/`
      });

      // 4. Testar se o endpoint de callback do Supabase responde
      addDiagnostic('CALLBACK_ENDPOINT', 'info', 'Testing Supabase callback endpoint...');
      try {
        const callbackResponse = await fetch(`${supabaseUrl}/auth/v1/callback`, {
          method: 'GET',
          mode: 'no-cors' // Para evitar CORS, só queremos ver se responde
        });
        addDiagnostic('CALLBACK_ENDPOINT', 'success', 'Supabase callback endpoint is accessible');
      } catch (err) {
        addDiagnostic('CALLBACK_ENDPOINT', 'warning', 'Could not test callback endpoint directly (CORS)', err);
      }

      // 5. Verificar se há sessão ativa
      addDiagnostic('SESSION_CHECK', 'info', 'Checking current session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          addDiagnostic('SESSION_CHECK', 'error', 'Session check failed', error);
        } else if (session) {
          addDiagnostic('SESSION_CHECK', 'success', 'Active session found', {
            userId: session.user?.id,
            provider: session.user?.app_metadata?.provider
          });
        } else {
          addDiagnostic('SESSION_CHECK', 'info', 'No active session');
        }
      } catch (err) {
        addDiagnostic('SESSION_CHECK', 'error', 'Session check error', err);
      }

      // 6. Testar criação de URL OAuth
      addDiagnostic('OAUTH_URL_TEST', 'info', 'Testing OAuth URL generation...');
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${currentOrigin}/`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          }
        });

        if (error) {
          addDiagnostic('OAUTH_URL_TEST', 'error', 'OAuth URL generation failed', error);
        } else {
          addDiagnostic('OAUTH_URL_TEST', 'warning', 'OAuth initiated (would redirect now)', data);
        }
      } catch (err) {
        addDiagnostic('OAUTH_URL_TEST', 'error', 'OAuth test failed', err);
      }

      toast({
        title: "✅ Diagnóstico completo",
        description: "Verifique os resultados abaixo",
        variant: "default",
      });

    } catch (error) {
      addDiagnostic('DIAGNOSTIC_ERROR', 'error', 'Diagnostic process failed', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Diagnóstico Avançado OAuth 403
          </CardTitle>
          <CardDescription>
            Verificação completa das configurações de autenticação Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Status atual da URL */}
          {Object.keys(urlParams).length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>URL Analysis:</strong> {
                  urlParams.hasError ? `Error: ${urlParams.error}` :
                  urlParams.hasCode || urlParams.hasAccessToken ? 'OAuth parameters detected' :
                  'Clean URL (no OAuth params)'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Botão para executar diagnóstico */}
          <Button 
            onClick={runCompleteDiagnostic}
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              '🔬'
            )}
            {isRunning ? 'Executando Diagnóstico...' : 'Executar Diagnóstico Completo'}
          </Button>

          {/* Resultados do diagnóstico */}
          {diagnostics.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">📋 Resultados do Diagnóstico:</h4>
              {diagnostics.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
                  <div className="flex items-start gap-2">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.step}</div>
                      <div className="text-sm">{result.message}</div>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer">Ver detalhes</summary>
                          <pre className="text-xs bg-white/50 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Links para configuração */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-800 mb-3">🔗 Links para Configuração:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/rczygmsaybzcrmdxxyge/auth/providers', '_blank')}
                className="w-full text-xs justify-start"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Supabase OAuth Providers
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/rczygmsaybzcrmdxxyge/auth/url-configuration', '_blank')}
                className="w-full text-xs justify-start"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Supabase URL Config
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                className="w-full text-xs justify-start"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Google Cloud Credentials
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://console.cloud.google.com/apis/consent', '_blank')}
                className="w-full text-xs justify-start"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Google OAuth Consent
              </Button>
            </div>
          </div>

          {/* Checklist crítico */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-800 mb-2">🚨 Checklist Crítico para Erro 403:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>□ Google Provider habilitado no Supabase</li>
              <li>□ Client ID e Secret corretos no Supabase</li>
              <li>□ {window.location.origin} nas "Authorized JavaScript origins" do Google</li>
              <li>□ https://rczygmsaybzcrmdxxyge.supabase.co/auth/v1/callback nas "Authorized redirect URIs" do Google</li>
              <li>□ OAuth consent screen configurado no Google</li>
              <li>□ Site URL configurada no Supabase: {window.location.origin}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};