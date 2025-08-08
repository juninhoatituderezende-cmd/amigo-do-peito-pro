import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, CheckCircle } from "lucide-react";

export function CreateAdminUser() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const createAdmin = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke("create-admin-user", {
        body: {
          email: "charlesink1996@gmail.com",
          password: "Arthur1234!",
          full_name: "Charles Administrador",
          phone: null
        }
      });

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast({
          title: "✅ Sucesso!",
          description: "Administrador cadastrado com sucesso",
        });
      } else {
        toast({
          title: "❌ Erro",
          description: data.error || "Erro ao cadastrar administrador",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "❌ Erro",
        description: "Erro ao comunicar com o servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Criar Administrador</CardTitle>
          <CardDescription>
            Cadastro de novo usuário administrativo do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  value="charlesink1996@gmail.com"
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password"
                  type="password"
                  value="Arthur1234!"
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name"
                value="Charles Administrador"
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Papel</Label>
              <Input 
                id="role"
                value="admin"
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Permissões Administrativas</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Gerenciamento de usuários e profissionais</li>
              <li>• Produtos e marketplace</li>
              <li>• Pagamentos e configurações de split</li>
              <li>• Relatórios e auditoria do sistema</li>
            </ul>
          </div>

          <Button 
            onClick={createAdmin} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando Administrador...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Criar Administrador
              </>
            )}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <div className="space-y-3">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Administrador Criado com Sucesso!</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>ID:</strong> {result.user_id}</p>
                    <p><strong>Email:</strong> {result.email}</p>
                    <p><strong>Role:</strong> {result.role}</p>
                    <p><strong>Status:</strong> {result.status}</p>
                    <p><strong>Nível de Acesso:</strong> {result.access_level}</p>
                    <p><strong>Criado em:</strong> {new Date(result.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ) : (
                <div className="text-red-800">
                  <p className="font-semibold">Erro ao criar administrador:</p>
                  <p className="text-sm mt-1">{result.error}</p>
                  {result.details && (
                    <p className="text-sm mt-1 text-red-600">{result.details}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}