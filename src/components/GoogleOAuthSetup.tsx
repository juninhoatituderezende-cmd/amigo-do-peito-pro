import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Settings, CheckCircle, AlertTriangle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const GoogleOAuthSetup = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
      variant: "default",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Guia Completo: Configuração Google OAuth
          </CardTitle>
          <CardDescription>
            Tutorial passo-a-passo para configurar login com Google no seu projeto Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Status:</strong> Google OAuth precisa ser configurado no Google Cloud Console e no Supabase
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">🔧 Passo 1: Google Cloud Console</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1.1 Criar/Selecionar Projeto</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open('https://console.cloud.google.com/projectcreate', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Criar Projeto Google Cloud
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">1.2 Configurar OAuth Consent Screen</h4>
                  <ul className="text-sm space-y-1 mb-3">
                    <li>• Vá para "APIs & Services" → "OAuth consent screen"</li>
                    <li>• Escolha "External" (para usuários públicos)</li>
                    <li>• Preencha nome da aplicação, email de suporte</li>
                    <li>• Em "Authorized domains", adicione:</li>
                  </ul>
                  <div className="bg-white p-3 rounded border font-mono text-sm flex items-center justify-between">
                    <span>rczygmsaybzcrmdxxyge.supabase.co</span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyToClipboard('rczygmsaybzcrmdxxyge.supabase.co', 'Domínio autorizado')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Scopes necessários: .../auth/userinfo.email, .../auth/userinfo.profile, openid
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">1.3 Criar Credenciais OAuth</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                    className="mb-3"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ir para Credenciais
                  </Button>
                  <ul className="text-sm space-y-1 mb-3">
                    <li>• Clique "Create Credentials" → "OAuth client ID"</li>
                    <li>• Application type: "Web application"</li>
                    <li>• Authorized JavaScript origins:</li>
                  </ul>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border font-mono text-sm flex items-center justify-between">
                      <span>https://rczygmsaybzcrmdxxyge.supabase.co</span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard('https://rczygmsaybzcrmdxxyge.supabase.co', 'JavaScript Origin')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="bg-white p-3 rounded border font-mono text-sm flex items-center justify-between">
                      <span>https://preview--amigo-do-peito-pro.lovable.app</span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard('https://preview--amigo-do-peito-pro.lovable.app', 'JavaScript Origin')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mt-2 mb-2">• Authorized redirect URIs:</p>
                  <div className="bg-white p-3 rounded border font-mono text-sm flex items-center justify-between">
                    <span>https://rczygmsaybzcrmdxxyge.supabase.co/auth/v1/callback</span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyToClipboard('https://rczygmsaybzcrmdxxyge.supabase.co/auth/v1/callback', 'Redirect URI')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3 text-green-900">⚙️ Passo 2: Configurar Supabase</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm mb-3">
                    Após criar as credenciais no Google Cloud, você receberá um <strong>Client ID</strong> e <strong>Client Secret</strong>.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://supabase.com/dashboard/project/rczygmsaybzcrmdxxyge/auth/providers', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Supabase Auth Settings
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">2.1 Em "Authentication" → "Providers":</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Encontre "Google" na lista de providers</li>
                    <li>• Habilite o toggle "Enable sign in with Google"</li>
                    <li>• Cole o <strong>Client ID</strong> do Google Cloud</li>
                    <li>• Cole o <strong>Client Secret</strong> do Google Cloud</li>
                    <li>• Clique "Save"</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">2.2 Configurar URLs (se necessário):</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://supabase.com/dashboard/project/rczygmsaybzcrmdxxyge/auth/url-configuration', '_blank')}
                    className="mb-2"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    URL Configuration
                  </Button>
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>Site URL:</strong>
                      <div className="bg-white p-2 rounded border font-mono text-xs mt-1">
                        https://preview--amigo-do-peito-pro.lovable.app
                      </div>
                    </div>
                    <div>
                      <strong>Redirect URLs (adicionar):</strong>
                      <div className="bg-white p-2 rounded border font-mono text-xs mt-1">
                        https://preview--amigo-do-peito-pro.lovable.app/**
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3 text-purple-900">🚀 Passo 3: Deploy e Publicação</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">3.1 Para Deploy em Produção:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Netlify:</strong> Conecte seu repositório GitHub, configure build command como "npm run build"</li>
                    <li>• <strong>Vercel:</strong> Importe projeto do GitHub, Vercel detecta configuração automaticamente</li>
                    <li>• Adicione o domínio de produção nas configurações do Google Cloud Console</li>
                    <li>• Atualize as redirect URLs no Supabase com o domínio de produção</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">3.2 Links para Deploy:</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://app.netlify.com/start', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Deploy no Netlify
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://vercel.com/new', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Deploy no Vercel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Resultado esperado:</strong> Após a configuração, o botão "Continuar com Google" abrirá a tela oficial do Google para seleção de conta, 
              e após a autorização, o usuário será automaticamente registrado e logado no sistema.
            </AlertDescription>
          </Alert>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">💡 Dicas Importantes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Teste sempre em ambiente de desenvolvimento primeiro</li>
              <li>• Mantenha as credenciais seguras - nunca as compartilhe publicamente</li>
              <li>• Para produção, considere usar domínio personalizado</li>
              <li>• Monitore os logs de autenticação no Supabase para debuggar problemas</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};