import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EmailDiagnosticTool = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const checkEmailStatus = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Digite um email para verificar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-email-status', {
        body: { email }
      });

      if (error) throw error;

      setResult(data);
      
      toast({
        title: "Verificação concluída",
        description: data.found ? "Usuário encontrado" : "Usuário não encontrado"
      });
    } catch (error: any) {
      console.error('Erro na verificação:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro na verificação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmEmail = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-confirm-email', {
        body: { email }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: data.message || "Email confirmado com sucesso"
      });

      // Atualizar status
      await checkEmailStatus();
    } catch (error: any) {
      console.error('Erro ao confirmar email:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao confirmar email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Diagnóstico de Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="diagnostic-email">Email do usuário</Label>
          <Input
            id="diagnostic-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={checkEmailStatus} 
            disabled={loading}
            variant="outline"
          >
            {loading ? "Verificando..." : "Verificar Status"}
          </Button>
          
          {result?.found && !result?.email_confirmed && (
            <Button 
              onClick={confirmEmail}
              disabled={loading}
            >
              Confirmar Email
            </Button>
          )}
        </div>

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Resultado:</h4>
            {result.found ? (
              <div className="space-y-1 text-sm">
                <p><strong>User ID:</strong> {result.user_id}</p>
                <p><strong>Email:</strong> {result.email}</p>
                <p><strong>Email Confirmado:</strong> 
                  <span className={result.email_confirmed ? "text-green-600" : "text-red-600"}>
                    {result.email_confirmed ? " ✅ Sim" : " ❌ Não"}
                  </span>
                </p>
                {result.email_confirmed_at && (
                  <p><strong>Confirmado em:</strong> {new Date(result.email_confirmed_at).toLocaleString()}</p>
                )}
                <p><strong>Criado em:</strong> {new Date(result.created_at).toLocaleString()}</p>
                {result.last_sign_in_at && (
                  <p><strong>Último login:</strong> {new Date(result.last_sign_in_at).toLocaleString()}</p>
                )}
              </div>
            ) : (
              <p className="text-red-600">Usuário não encontrado no sistema</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailDiagnosticTool;