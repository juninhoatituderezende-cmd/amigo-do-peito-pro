import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, User, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function GoogleSignupComplete() {
  // Pegar dados da URL (simulariam dados reais do Google OAuth)
  const urlParams = new URLSearchParams(window.location.search);
  const googleEmail = urlParams.get('email') || 'cliente@example.com';
  const googleName = urlParams.get('name') || 'Cliente Google';
  
  const [userData, setUserData] = useState({
    name: googleName,
    email: googleEmail,
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      // Simular criação de conta com dados do Google + telefone opcional
      const result = await register(
        userData.email,
        "google_oauth_user", // senha temporária para usuários Google
        {
          name: userData.name,
          phone: userData.phone,
          provider: 'google'
        },
        'user' // role padrão para clientes
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Conta criada com sucesso! 🎉",
        description: "Bem-vindo à Amigo do Peito! Redirecionando...",
        variant: "default",
      });
      
      // Pequeno delay para mostrar toast e depois redirecionar
      setTimeout(() => {
        window.location.href = '/usuario/dashboard';
      }, 1500);
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao finalizar cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    
    try {
      // Criar conta sem telefone
      const result = await register(
        userData.email,
        "google_oauth_user",
        {
          name: userData.name,
          provider: 'google'
        },
        'user'
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Conta criada! 🎉",
        description: "Redirecionando para seu painel...",
        variant: "default",
      });
      
      setTimeout(() => {
        window.location.href = '/usuario/dashboard';
      }, 1500);
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ap-light-orange to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Quase pronto!</CardTitle>
          <CardDescription>
            Seus dados do Google foram coletados. Deseja adicionar um telefone?
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <Label className="text-sm font-medium">Nome</Label>
                <p className="text-sm text-gray-600">{userData.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <Label className="text-sm font-medium">E-mail</Label>
                <p className="text-sm text-gray-600">{userData.email}</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(XX) XXXXX-XXXX"
                value={userData.phone}
                onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Você pode pular e adicionar depois no seu perfil
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleComplete}
              className="w-full bg-ap-orange hover:bg-ap-orange/90"
              disabled={loading}
            >
              {loading ? "Finalizando..." : "Finalizar Cadastro"}
            </Button>
            
            <Button 
              onClick={handleSkip}
              variant="ghost"
              className="w-full"
              disabled={loading}
            >
              Pular por agora
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              ✨ Sem senha necessária - você já está autenticado pelo Google
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}