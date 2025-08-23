import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Settings, ExternalLink, ArrowLeft } from 'lucide-react';

const EmailConfirmationHelp = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 bg-gradient-to-br from-ap-light-orange to-white">
        <div className="ap-container max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Mail className="h-16 w-16 text-ap-orange mx-auto mb-4" />
              <CardTitle className="text-2xl">Confirmação de Email Necessária</CardTitle>
              <p className="text-gray-600">
                Seu cadastro foi realizado com sucesso, mas é necessário confirmar seu email.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <strong>Verifique sua caixa de entrada</strong> - Um email de confirmação foi enviado. 
                  Clique no link para ativar sua conta.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Opções para resolver:
                </h3>
                
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">1. Verificar Email (Recomendado)</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Acesse sua caixa de entrada e clique no link de confirmação.
                    </p>
                    <p className="text-xs text-blue-600">
                      ✅ Não esqueça de verificar a pasta de spam/lixo eletrônico
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">2. Login Rápido (Alternativa)</h4>
                    <p className="text-sm text-green-700 mb-3">
                      Use o Google para entrar instantaneamente sem confirmação de email.
                    </p>
                    <Link to="/login-rapido">
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Entrar com Google
                      </Button>
                    </Link>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">3. Para Administradores</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Se você é o administrador do sistema, pode desabilitar a confirmação de email no Supabase:
                    </p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>• Acesse: Authentication → Settings</p>
                      <p>• Desmarque "Enable email confirmations"</p>
                      <p>• Salve as alterações</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Link to="/cadastro" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Cadastro
                  </Button>
                </Link>
                <Link to="/usuario/login" className="flex-1">
                  <Button className="w-full bg-ap-orange hover:bg-ap-orange/90">
                    Fazer Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EmailConfirmationHelp;