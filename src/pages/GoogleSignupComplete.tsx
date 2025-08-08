import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, User, Mail } from "lucide-react";

export default function GoogleSignupComplete() {
  const [userData, setUserData] = useState({
    name: "João Silva", // Mockado - viria do Google
    email: "joao.silva@gmail.com", // Mockado - viria do Google
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      // Simular finalização do cadastro
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Conta criada com sucesso! 🎉",
        description: "Bem-vindo à Amigo do Peito! Você já está logado.",
        variant: "default",
      });
      
      // Redirecionar para dashboard do usuário
      window.location.href = '/usuario/dashboard';
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao finalizar cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: "Conta criada! 🎉",
      description: "Você pode adicionar o telefone depois no seu perfil.",
      variant: "default",
    });
    window.location.href = '/usuario/dashboard';
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