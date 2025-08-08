import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Key, AlertTriangle } from "lucide-react";

export const GoogleCredentialsSetup = () => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔑 Configuração Google OAuth - URGENTE
          </CardTitle>
          <CardDescription>
            As credenciais do Google precisam ser configuradas no Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erro 403:</strong> Indica que o Google Provider não está configurado ou as credenciais estão incorretas no Supabase.
            </AlertDescription>
          </Alert>

          {/* Passo 1: Google Cloud Console */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-3">📋 Passo 1: Obter credenciais do Google Cloud</h4>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Google Cloud Console - Credentials
              </Button>
              
              <div className="text-sm text-blue-700 space-y-2">
                <div><strong>1.</strong> Crie ou selecione um projeto</div>
                <div><strong>2.</strong> Vá em "Create Credentials" → "OAuth client ID"</div>
                <div><strong>3.</strong> Application type: "Web application"</div>
                <div><strong>4.</strong> Authorized JavaScript origins:</div>
                <div className="bg-white p-2 rounded border font-mono text-xs">
                  https://rczygmsaybzcrmdxxyge.supabase.co<br/>
                  {window.location.origin}
                </div>
                <div><strong>5.</strong> Authorized redirect URIs:</div>
                <div className="bg-white p-2 rounded border font-mono text-xs">
                  https://rczygmsaybzcrmdxxyge.supabase.co/auth/v1/callback
                </div>
              </div>
            </div>
          </div>

          {/* Passo 2: Configurar no Supabase */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-3">⚙️ Passo 2: Configurar no Supabase</h4>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/rczygmsaybzcrmdxxyge/auth/providers', '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Supabase - OAuth Providers
              </Button>
              
              <div className="text-sm text-green-700 space-y-2">
                <div><strong>1.</strong> Encontre "Google" na lista de providers</div>
                <div><strong>2.</strong> Habilite o toggle "Enable sign in with Google"</div>
                <div><strong>3.</strong> Cole o <strong>Client ID</strong> do Google Cloud</div>
                <div><strong>4.</strong> Cole o <strong>Client Secret</strong> do Google Cloud</div>
                <div><strong>5.</strong> Clique "Save"</div>
              </div>
            </div>
          </div>

          {/* Passo 3: URL Configuration */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-800 mb-3">📐 Passo 3: Configurar URLs no Supabase</h4>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/rczygmsaybzcrmdxxyge/auth/url-configuration', '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Supabase - URL Configuration
              </Button>
              
              <div className="text-sm text-purple-700 space-y-2">
                <div><strong>Site URL:</strong></div>
                <div className="bg-white p-2 rounded border font-mono text-xs">
                  {window.location.origin}
                </div>
                <div><strong>Redirect URLs (adicionar):</strong></div>
                <div className="bg-white p-2 rounded border font-mono text-xs">
                  {window.location.origin}/**
                </div>
              </div>
            </div>
          </div>

          {/* Checklist final */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">✅ Checklist Final:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>□ Projeto criado no Google Cloud Console</li>
              <li>□ OAuth client ID criado com URLs corretas</li>
              <li>□ Client ID copiado para Supabase</li>
              <li>□ Client Secret copiado para Supabase</li>
              <li>□ Google Provider habilitado no Supabase</li>
              <li>□ Site URL configurada no Supabase</li>
              <li>□ Redirect URLs configuradas no Supabase</li>
            </ul>
          </div>

          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Após configurar tudo, aguarde alguns minutos para as alterações entrarem em vigor antes de testar novamente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};