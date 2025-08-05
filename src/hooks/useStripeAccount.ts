import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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

export function useStripeAccount() {
  const [account, setAccount] = useState<StripeAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkAccountStatus = async () => {
    try {
      setError(null);
      
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

      setAccount(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      console.error("Erro ao verificar conta Stripe:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async () => {
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
        window.open(data.onboarding_url, "_blank");
        
        toast({
          title: "Redirecionando",
          description: "Abrindo processo de configuração da conta Stripe...",
        });

        // Aguardar um pouco e verificar status novamente
        setTimeout(() => {
          checkAccountStatus();
        }, 2000);

        return data;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o processo de configuração",
        variant: "destructive",
      });
      console.error("Erro no onboarding Stripe:", err);
      return null;
    }
  };

  useEffect(() => {
    checkAccountStatus();
  }, []);

  // Verificar status quando a aba volta ao foco (após onboarding)
  useEffect(() => {
    const handleFocus = () => {
      checkAccountStatus();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return {
    account,
    loading,
    error,
    checkAccountStatus,
    startOnboarding,
    isConfigured: account?.onboarding_completed || false,
    canReceivePayments: account?.charges_enabled || false,
  };
}