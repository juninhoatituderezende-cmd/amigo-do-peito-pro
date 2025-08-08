import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const OAuthDebug = () => {
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  const [testingConnection, setTestingConnection] = useState(false);
  const [supabaseAuthConfig, setSupabaseAuthConfig] = useState<any>(null);
  const [oauthProviders, setOauthProviders] = useState<any>(null);

  // Verificar configuração do Supabase ao carregar
  useEffect(() => {
    checkSupabaseConfig();
  }, []);

  const checkSupabaseConfig = async () => {
    try {
      // Tentar acessar configuração de auth (se disponível via API)
      console.log('🔍 Checking Supabase configuration...');
      
      // Verificar se conseguimos fazer uma query básica
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        console.error('❌ Database connection failed:', error);
        setSupabaseAuthConfig({ error: error.message });
      } else {
        console.log('✅ Database connection successful');
        setSupabaseAuthConfig({ connected: true });
      }
    } catch (err: any) {
      console.error('❌ Supabase config check failed:', err);
      setSupabaseAuthConfig({ error: err.message });
    }
  };

  const testSupabaseConnection = async () => {
    setTestingConnection(true);
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        toast({
          title: "❌ Conexão com Supabase falhou",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Conexão com Supabase OK",
          description: "Base de dados acessível",
          variant: "default",
        });
      }
    } catch (err: any) {
      toast({
        title: "❌ Erro de conexão",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleAdvancedTest = async () => {
    try {
      console.log('🧪 Running advanced OAuth diagnostics...');
      
      // Testar se o provider Google está habilitado
      const response = await fetch('https://rczygmsaybzcrmdxxyge.supabase.co/auth/v1/settings', {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const settings = await response.json();
        console.log('📋 Supabase Auth Settings:', settings);
        setOauthProviders(settings);
        
        toast({
          title: "✅ Configurações carregadas",
          description: "Verifique o console para detalhes",
          variant: "default",
        });
      } else {
        console.error('❌ Failed to fetch auth settings:', response.status, response.statusText);
        toast({
          title: "❌ Erro ao carregar configurações",
          description: `Status: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('❌ Advanced test failed:', err);
      toast({
        title: "❌ Teste avançado falhou",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleTestGoogleOAuth = async () => {
    try {
      console.log('🧪 Testing Google OAuth configuration...');
      console.log('📍 Current URL:', window.location.href);
      console.log('📍 Origin:', window.location.origin);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('❌ Google OAuth Error Details:', {
          message: error.message,
          status: error.status,
          details: error
        });
        
        toast({
          title: "❌ Erro no Google OAuth",
          description: `${error.message} (Status: ${error.status || 'unknown'})`,
          variant: "destructive",
        });
      } else {
        console.log('✅ Google OAuth data:', data);
        toast({
          title: "🚀 Google OAuth iniciado",
          description: "Redirecionando para Google...",
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      toast({
        title: "❌ Erro inesperado",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Diagnóstico OAuth Google
          </CardTitle>
          <CardDescription>
            Verificação do status da autenticação Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status atual */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Status atual:</strong> {loading ? 'Carregando...' : session ? 'Usuário logado' : 'Usuário não logado'}
            </AlertDescription>
          </Alert>

          {/* Informações do usuário */}
          {user && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">✅ Usuário autenticado:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li><strong>ID:</strong> {user.id}</li>
                <li><strong>Email:</strong> {user.email}</li>
                <li><strong>Nome:</strong> {user.full_name || 'Não informado'}</li>
                <li><strong>Role:</strong> {user.role}</li>
              </ul>
            </div>
          )}

          {/* Verificar configuração */}
          <div className="space-y-3">
            <h4 className="font-medium">Verificações necessárias:</h4>
            
            <div className="space-y-2">
              <Button 
                onClick={testSupabaseConnection}
                disabled={testingConnection}
                variant="outline"
                className="w-full"
              >
                {testingConnection ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Testar Conexão Supabase
              </Button>
              
              <Button 
                onClick={handleAdvancedTest}
                variant="outline"
                className="w-full"
              >
                🔬 Verificar Configuração Supabase
              </Button>
              
              <Button 
                onClick={handleTestGoogleOAuth}
                variant="outline"
                className="w-full"
              >
                🚀 Testar Google OAuth
              </Button>
            </div>
          </div>

          {/* Resultados dos testes */}
          {supabaseAuthConfig && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium mb-2">🔬 Resultados dos Testes:</h4>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(supabaseAuthConfig, null, 2)}
              </pre>
            </div>
          )}

          {oauthProviders && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium mb-2">⚙️ Configuração OAuth:</h4>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                {JSON.stringify(oauthProviders, null, 2)}
              </pre>
            </div>
          )}

          {/* URLs importantes */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">📋 URLs que devem estar configuradas no Google Cloud:</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <div>
                <strong>Authorized JavaScript Origins:</strong>
                <div className="bg-white p-2 rounded border font-mono text-xs mt-1 space-y-1">
                  <div>https://rczygmsaybzcrmdxxyge.supabase.co</div>
                  <div>{window.location.origin}</div>
                </div>
              </div>
              <div>
                <strong>Authorized Redirect URIs:</strong>
                <div className="bg-white p-2 rounded border font-mono text-xs mt-1">
                  https://rczygmsaybzcrmdxxyge.supabase.co/auth/v1/callback
                </div>
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
              <p className="text-xs text-yellow-800">
                <strong>⚠️ IMPORTANTE:</strong> Se você está testando, adicione <code>{window.location.origin}</code> às "Authorized JavaScript Origins" no Google Cloud Console.
              </p>
            </div>
          </div>

          {/* URLs do Supabase */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">⚙️ Configuração no Supabase:</h4>
            <div className="text-sm text-green-700 space-y-2">
              <div>
                <strong>Site URL (em Auth Settings):</strong>
                <div className="bg-white p-2 rounded border font-mono text-xs mt-1">
                  {window.location.origin}
                </div>
              </div>
              <div>
                <strong>Redirect URLs (adicionar):</strong>
                <div className="bg-white p-2 rounded border font-mono text-xs mt-1">
                  {window.location.origin}/**
                </div>
              </div>
            </div>
          </div>

          {/* Links diretos para configuração */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-800 mb-2">🔗 Links diretos para configuração:</h4>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/rczygmsaybzcrmdxxyge/auth/url-configuration', '_blank')}
                className="w-full text-xs"
              >
                📐 Supabase - URL Configuration
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/rczygmsaybzcrmdxxyge/auth/providers', '_blank')}
                className="w-full text-xs"
              >
                🔑 Supabase - OAuth Providers
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                className="w-full text-xs"
              >
                ☁️ Google Cloud - Credentials
              </Button>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Checklist de configuração:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>□ Google Cloud Console configurado</li>
              <li>□ Client ID e Secret inseridos no Supabase</li>
              <li>□ Provider Google habilitado no Supabase</li>
              <li>□ URLs de redirect configuradas corretamente</li>
              <li>□ {window.location.origin} adicionado nas JavaScript Origins</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};