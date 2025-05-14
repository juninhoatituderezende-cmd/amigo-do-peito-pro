
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { adminLogin, user } = useAuth();
  const { toast } = useToast();

  // If user is already logged in as admin, redirect to admin dashboard
  if (user && user.role === "admin") {
    navigate("/admin");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminLogin(password);
      navigate("/admin");
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Senha incorreta. Por favor, tente novamente.",
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <section className="py-16 flex-1 flex items-center justify-center bg-gradient-to-br from-ap-light-orange to-white">
        <div className="w-full max-w-md px-4">
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Acesso Administrativo</h1>
                <p className="text-gray-600 mt-2">Entre com a senha do administrador</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha de administrador"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-ap-orange hover:bg-ap-orange/90"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
              
              <div className="text-center mt-6">
                <button 
                  onClick={() => navigate("/")}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Voltar para a página inicial
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default AdminLogin;
