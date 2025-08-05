import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

interface StripeAccount {
  account_exists: boolean;
  account_id?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  onboarding_completed?: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
}

export function StripeOnboarding() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [accountStatus, setAccountStatus] = useState<StripeAccount | null>(null);
  const { toast } = useToast();

  const checkAccountStatus = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.functions.invoke("stripe-account-status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setAccountStatus(data);
      
      if (data.account_exists && data.onboarding_completed) {
        toast({
          title: "Conta configurada",
          description: "Sua conta Stripe está pronta para receber pagamentos!",
        });
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o status da conta",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const startOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.functions.invoke("stripe-onboard", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success && data.onboarding_url) {
        // Abrir onboarding em nova aba
        window.open(data.onboarding_url, "_blank");
        
        toast({
          title: "Redirecionando",
          description: "Abrindo processo de configuração da conta Stripe...",
        });
      }
    } catch (error) {
      console.error("Erro no onboarding:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o processo de configuração",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!accountStatus?.account_exists) {
      return <Badge variant="secondary">Não configurado</Badge>;
    }
    
    if (accountStatus.onboarding_completed) {
      return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
    }
    
    if (accountStatus.details_submitted) {
      return <Badge variant="outline">Em análise</Badge>;
    }
    
    return <Badge variant="destructive">Pendente</Badge>;
  };

  const renderRequirements = () => {
    if (!accountStatus?.requirements) return null;

    const { currently_due, eventually_due, past_due, pending_verification } = accountStatus.requirements;
    const hasRequirements = currently_due.length > 0 || past_due.length > 0;

    if (!hasRequirements) return null;

    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Documentação pendente:</p>
            {past_due.length > 0 && (
              <div>
                <p className="text-sm text-red-600 font-medium">Vencidos:</p>
                <ul className="text-sm list-disc list-inside">
                  {past_due.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            {currently_due.length > 0 && (
              <div>
                <p className="text-sm text-orange-600 font-medium">Pendentes:</p>
                <ul className="text-sm list-disc list-inside">
                  {currently_due.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            {pending_verification.length > 0 && (
              <div>
                <p className="text-sm text-blue-600 font-medium">Em verificação:</p>
                <ul className="text-sm list-disc list-inside">
                  {pending_verification.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Configuração de Pagamentos
        </CardTitle>
        <CardDescription>
          Configure sua conta Stripe para receber pagamentos pelos seus serviços
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da conta */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Status da conta:</p>
            <p className="text-sm text-muted-foreground">
              {accountStatus?.account_exists ? `ID: ${accountStatus.account_id}` : "Conta não criada"}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Detalhes do status */}
        {accountStatus?.account_exists && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {accountStatus.charges_enabled ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Receber pagamentos</span>
            </div>
            <div className="flex items-center gap-2">
              {accountStatus.payouts_enabled ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Transferências</span>
            </div>
          </div>
        )}

        {/* Requisitos pendentes */}
        {renderRequirements()}

        {/* Ações */}
        <div className="flex gap-2">
          {!accountStatus?.account_exists ? (
            <Button 
              onClick={startOnboarding} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <CreditCard className="h-4 w-4" />
              Configurar Conta Stripe
              <ExternalLink className="h-4 w-4" />
            </Button>
          ) : (
            !accountStatus.onboarding_completed && (
              <Button 
                onClick={startOnboarding} 
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Continuar Configuração
                <ExternalLink className="h-4 w-4" />
              </Button>
            )
          )}
          
          <Button 
            onClick={checkAccountStatus} 
            disabled={checking}
            variant="secondary"
            className="flex items-center gap-2"
          >
            {checking && <Loader2 className="h-4 w-4 animate-spin" />}
            Verificar Status
          </Button>
        </div>

        {/* Informações importantes */}
        <Alert>
          <AlertDescription className="text-sm">
            <p className="font-medium mb-2">Informações importantes:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Você receberá 50% de cada pagamento realizado</li>
              <li>Influenciadores recebem 25% (quando aplicável)</li>
              <li>Os valores são transferidos automaticamente para sua conta</li>
              <li>É necessário completar a verificação de identidade</li>
              <li>As transferências seguem o cronograma do Stripe (geralmente 2 dias úteis)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}