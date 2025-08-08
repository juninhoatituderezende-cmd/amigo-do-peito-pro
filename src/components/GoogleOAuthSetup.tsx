import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Settings, CheckCircle, AlertTriangle } from "lucide-react";

export const GoogleOAuthSetup = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração do Google OAuth
          </CardTitle>
          <CardDescription>
            Para ativar o login com Google, você precisa configurar as credenciais OAuth no Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Status atual:</strong> Google OAuth não está configurado. O botão aparece mas não funciona.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Passos para configurar:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center font-medium">1</div>
                <div>
                  <h4 className="font-medium">Google Cloud Console</h4>
                  <p className="text-sm text-gray-600">
                    Crie um projeto no Google Cloud Console e configure OAuth 2.0
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Google Cloud Console
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center font-medium">2</div>
                <div>
                  <h4 className="font-medium">Configurar Consent Screen</h4>
                  <p className="text-sm text-gray-600">
                    Configure a tela de consentimento com domínios autorizados
                  </p>
                  <ul className="text-xs text-gray-500 mt-1 space-y-1">
                    <li>• Adicionar domínio: rczygmsaybzcrmdxxyge.supabase.co</li>
                    <li>• Scopes: email, profile, openid</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center font-medium">3</div>
                <div>
                  <h4 className="font-medium">Criar Credenciais OAuth</h4>
                  <p className="text-sm text-gray-600">
                    Crie Client ID e Secret para aplicação web
                  </p>
                  <ul className="text-xs text-gray-500 mt-1 space-y-1">
                    <li>• Tipo: Web application</li>
                    <li>• JavaScript origins: seus domínios</li>
                    <li>• Redirect URIs: callback do Supabase</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center font-medium">4</div>
                <div>
                  <h4 className="font-medium">Configurar no Supabase</h4>
                  <p className="text-sm text-gray-600">
                    Adicione as credenciais no painel do Supabase
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Supabase Auth Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">URLs importantes:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Redirect URL:</strong> https://rczygmsaybzcrmdxxyge.supabase.co/auth/v1/callback</p>
              <p><strong>Site URL:</strong> https://preview--amigo-do-peito-pro.lovable.app</p>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Após configurar:</strong> O login com Google criará automaticamente contas de usuário comum, 
              coletando apenas nome e email do Google, sem exigir preenchimento adicional.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};