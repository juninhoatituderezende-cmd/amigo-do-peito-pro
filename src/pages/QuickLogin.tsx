import Header from "../components/Header";
import Footer from "../components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QuickLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await login(email, password);
        if (error) throw error;
        
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para seu painel...",
        });
        
        // Não fazer redirecionamento manual - deixar o AuthContext fazer automaticamente
      } else {
        const userData = {
          email,
          fullName: fullName || "Usuário",
          phone: phone || ""
        };
        
        const { error } = await register(email, password, userData, "user");
        if (error) throw error;
        
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Sua conta foi criada. Redirecionando...",
        });
        
        // Não fazer redirecionamento manual - deixar o AuthContext fazer automaticamente
      }
    } catch (error: any) {
      console.error('QuickLogin error:', error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 bg-gradient-to-br from-primary/5 to-background">
        <div className="container">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Acesso do Cliente</CardTitle>
                <CardDescription>
                  {isLogin ? "Entre em sua conta" : "Crie sua conta agora"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={isLogin ? "login" : "register"} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger 
                      value="login" 
                      onClick={() => setIsLogin(true)}
                    >
                      Entrar
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      onClick={() => setIsLogin(false)}
                    >
                      Cadastrar
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="space-y-4 mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="seu@email.com"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Sua senha"
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Entrando..." : "Entrar"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="space-y-4 mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nome</Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Seu nome completo (opcional)"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="seu@email.com"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(11) 99999-9999 (opcional)"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Mínimo 6 caracteres"
                          minLength={6}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Criando conta..." : "Criar conta"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">
                    ℹ️ Informação importante:
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• O sistema pode exigir confirmação de email</li>
                    <li>• Se não receber o email, aguarde alguns minutos</li>
                    <li>• Após cadastro, aguarde o redirecionamento automático</li>
                    <li>• Se houver problemas, entre em contato com suporte</li>
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