import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const OAuthDebug = () => {
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  const [testingConnection, setTestingConnection] = useState(false);

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

  const handleTestGoogleOAuth = async () => {
    try {
      console.log('🧪 Testing Google OAuth configuration...');
      
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
        toast({
          title: "❌ Erro no Google OAuth",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "🚀 Google OAuth iniciado",
          description: "Redirecionando para Google...",
          variant: "default",
        });
      }
    } catch (err: any) {
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
                onClick={handleTestGoogleOAuth}
                variant="outline"
                className="w-full"
              >
                🚀 Testar Google OAuth
              </Button>
            </div>
          </div>

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