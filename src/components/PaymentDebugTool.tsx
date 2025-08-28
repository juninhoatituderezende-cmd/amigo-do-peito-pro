import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bug, CheckCircle, XCircle } from "lucide-react";

export const PaymentDebugTool = () => {
  const [debugging, setDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const runDebugTest = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    try {
      setDebugging(true);
      setDebugResults(null);

      const results = {
        step1: null,
        step2: null,
        step3: null,
        step4: null,
        final: null
      };

      // Step 1: Verificar dados do usuário
      console.log('🔍 DEBUG Step 1: Verificando dados do usuário...');
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      results.step1 = {
        success: !userError,
        data: userProfile,
        error: userError,
        cpf_exists: !!userProfile?.cpf,
        cpf_value: userProfile?.cpf
      };

      // Step 2: Verificar se o plano existe
      console.log('🔍 DEBUG Step 2: Verificando plano específico...');
      const planId = '1c179f6e-8748-421e-9781-97793ec5a6dd';
      const { data: plan, error: planError } = await supabase
        .from('planos_tatuador')
        .select('*')
        .eq('id', planId)
        .eq('active', true)
        .single();

      results.step2 = {
        success: !planError,
        data: plan,
        error: planError,
        plan_exists: !!plan,
        plan_active: plan?.active
      };

      // Step 3: Testar unified-plans-loader
      console.log('🔍 DEBUG Step 3: Testando unified-plans-loader...');
      const { data: plansResponse, error: plansError } = await supabase.functions.invoke('unified-plans-loader', {
        body: { include_inactive: false, admin_view: false }
      });

      const foundPlan = plansResponse?.plans?.find((p: any) => p.id === planId);

      results.step3 = {
        success: plansResponse?.success,
        total_plans: plansResponse?.plans?.length || 0,
        target_plan_found: !!foundPlan,
        target_plan_data: foundPlan,
        error: plansError
      };

      // Step 4: Verificar integração Asaas
      console.log('🔍 DEBUG Step 4: Verificando integração Asaas...');
      const { data: asaasConfig, error: asaasError } = await supabase
        .from('asaas_integration')
        .select('*')
        .eq('status', 'active')
        .eq('connection_status', 'connected')
        .single();

      results.step4 = {
        success: !asaasError,
        data: asaasConfig,
        error: asaasError,
        integration_active: asaasConfig?.status === 'active'
      };

      // Final: Tentar criar pagamento de teste (sem executar na API)
      console.log('🔍 DEBUG Final: Simulando chamada create-asaas-payment...');
      
      if (results.step1.success && results.step2.success && results.step3.success && results.step4.success) {
        try {
          const { data: paymentResponse, error: paymentError } = await supabase.functions.invoke('create-asaas-payment', {
            body: {
              plan_id: planId,
              plan_category: 'tatuador',
              user_id: user.id,
              payment_method: 'pix',
              municipio: 'sao_paulo'
            }
          });

          results.final = {
            success: paymentResponse?.success,
            data: paymentResponse,
            error: paymentError
          };
        } catch (error) {
          results.final = {
            success: false,
            error: error
          };
        }
      } else {
        results.final = {
          success: false,
          error: 'Pré-requisitos falharam'
        };
      }

      setDebugResults(results);

      toast({
        title: "Debug Completo",
        description: "Verifique os resultados abaixo",
      });

    } catch (error) {
      console.error('❌ Erro no debug:', error);
      toast({
        title: "Erro no debug",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setDebugging(false);
    }
  };

  const renderDebugStep = (stepName: string, stepData: any) => {
    if (!stepData) return null;

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {stepData.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            {stepName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
            {JSON.stringify(stepData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug do Fluxo de Pagamento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ferramenta para diagnosticar problemas no fluxo de pagamento do produto "Fechamento de braço"
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button
          onClick={runDebugTest}
          disabled={debugging || !user?.id}
          className="w-full"
        >
          {debugging ? "Executando Debug..." : "Executar Debug Completo"}
        </Button>

        {!user?.id && (
          <p className="text-sm text-red-600">
            Você precisa estar logado para executar o debug
          </p>
        )}

        {debugResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resultados do Debug:</h3>
            
            {renderDebugStep("Step 1: Dados do Usuário", debugResults.step1)}
            {renderDebugStep("Step 2: Verificação do Plano", debugResults.step2)}
            {renderDebugStep("Step 3: Unified Plans Loader", debugResults.step3)}
            {renderDebugStep("Step 4: Integração Asaas", debugResults.step4)}
            {renderDebugStep("Final: Criação de Pagamento", debugResults.final)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};