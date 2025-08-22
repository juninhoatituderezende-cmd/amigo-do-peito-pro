import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
// Google OAuth removido - sistema simplificado

const UserLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🔄 Login form submitted');
    e.preventDefault();
    setLoading(true);
    
    console.log('📧 Attempting login with:', { email: formData.email, passwordLength: formData.password.length });
    
    try {
      console.log('🚀 Calling login function...');
      const result = await login(formData.email, formData.password, null);
      
      if (result.error) {
        console.error('❌ Login failed:', result.error);
        
        // Verificar se é problema de email não confirmado
        if (result.error.message?.includes('Email not confirmed')) {
          toast({
            title: "Email não confirmado",
            description: "Verifique seu email e clique no link de confirmação antes de fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no login",
            description: result.error.message || "Credenciais inválidas. Verifique seu email e senha.",
            variant: "destructive",
          });
        }
        } else {
          console.log('✅ Login successful');
          // Navigation will be handled by AuthContext automatically
        }
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🔄 Login process completed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 bg-gradient-to-br from-ap-light-orange to-white">
        <div className="ap-container">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Login de Usuário</CardTitle>
                <p className="text-center text-gray-600">
                  Acesse sua conta para ver seus grupos e serviços
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-ap-orange hover:bg-ap-orange/90"
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  
                  {/* Google OAuth removido - sistema simplificado */}
                </form>

                <div className="mt-6 text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Não tem uma conta?{" "}
                    <Link to="/usuario/cadastro" className="text-ap-orange hover:underline">
                      Cadastre-se
                    </Link>
                  </p>
                  <p className="text-sm text-gray-600">
                    <Link to="/esqueci-senha" className="text-ap-orange hover:underline">
                      Esqueci minha senha
                    </Link>
                  </p>
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

export default UserLogin;