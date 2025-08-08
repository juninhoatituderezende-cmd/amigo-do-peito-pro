import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { Stethoscope, Loader2 } from "lucide-react";

const ProfessionalLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await login(formData.email, formData.password, "professional");
      
      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao painel profissional.",
      });

      navigate("/profissional/dashboard");
    } catch (error: any) {
      console.error("Professional login error:", error);
      setError(error.message || "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 bg-gradient-to-br from-ap-light-orange to-white">
        <div className="ap-container">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Stethoscope className="h-12 w-12 text-ap-orange" />
                </div>
                <CardTitle className="text-2xl font-bold">Login Profissional</CardTitle>
                <CardDescription>
                  Acesse sua conta profissional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Digite sua senha"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-ap-orange hover:bg-ap-orange/90" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">
                        Ou continue com
                      </span>
                    </div>
                  </div>
                  
                  <GoogleLoginButton />
                </form>
                
                <div className="mt-6 text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Não tem uma conta?{" "}
                    <Link to="/cadastro" className="text-ap-orange hover:underline">
                      Cadastre-se como profissional
                    </Link>
                  </p>
                  <p className="text-sm text-gray-600">
                    <Link to="/esqueci-senha" className="text-ap-orange hover:underline">
                      Esqueci minha senha
                    </Link>
                  </p>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate("/")}
                    className="text-sm"
                  >
                    ← Voltar ao site
                  </Button>
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

export default ProfessionalLogin;