import Header from "../components/Header";
import Footer from "../components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const QuickLogin = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 bg-gradient-to-br from-ap-light-orange to-white">
        <div className="ap-container">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Acesso Rápido</CardTitle>
                <CardDescription>
                  Entre na plataforma em segundos com sua conta Google
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <GoogleLoginButton>
                  Entrar com Google
                </GoogleLoginButton>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Ou use o método tradicional
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/usuario/login">
                      Login com Email/Senha
                    </Link>
                  </Button>
                  
                  <Button variant="ghost" asChild className="w-full">
                    <Link to="/usuario/cadastro">
                      Criar conta tradicional
                    </Link>
                  </Button>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    ⚡ Login com Google:
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>✅ Sem necessidade de senha</li>
                    <li>✅ Cadastro automático</li>
                    <li>✅ Acesso instantâneo</li>
                    <li>✅ Sem preenchimento de formulários</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuickLogin;