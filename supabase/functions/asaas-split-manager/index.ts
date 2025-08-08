import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASAAS-SPLIT-MANAGER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { action, ...data } = await req.json();
    logStep("Request data received", { action });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // ASAAS API configuration
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      throw new Error("ASAAS_API_KEY não configurada");
    }

    const asaasHeaders = {
      "access_token": asaasApiKey,
      "Content-Type": "application/json",
    };

    let result;

    switch (action) {
      case "create_split_rule":
        result = await createSplitRule(supabaseClient, data);
        break;
      
      case "update_split_rule":
        result = await updateSplitRule(supabaseClient, data);
        break;
      
      case "get_split_rules":
        result = await getSplitRules(supabaseClient, data);
        break;
      
      case "process_pending_splits":
        result = await processPendingSplits(supabaseClient, asaasHeaders);
        break;
      
      case "get_split_history":
        result = await getSplitHistory(supabaseClient, data);
        break;
      
      default:
        throw new Error(`Ação não reconhecida: ${action}`);
    }

    logStep("Operation completed successfully", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in asaas-split-manager", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Criar regra de split
async function createSplitRule(supabaseClient: any, data: any) {
  logStep("Creating split rule", data);

  const { error } = await supabaseClient
    .from("payment_split_rules")
    .insert({
      product_id: data.product_id || null,
      service_id: data.service_id || null,
      professional_percentage: data.professional_percentage || 70.0,
      platform_percentage: data.platform_percentage || 20.0,
      influencer_percentage: data.influencer_percentage || 10.0,
      fixed_platform_fee: data.fixed_platform_fee || 0
    });

  if (error) {
    throw new Error(`Erro ao criar regra de split: ${error.message}`);
  }

  return {
    success: true,
    message: "Regra de split criada com sucesso"
  };
}

// Atualizar regra de split
async function updateSplitRule(supabaseClient: any, data: any) {
  logStep("Updating split rule", data);

  const { error } = await supabaseClient
    .from("payment_split_rules")
    .update({
      professional_percentage: data.professional_percentage,
      platform_percentage: data.platform_percentage,
      influencer_percentage: data.influencer_percentage,
      fixed_platform_fee: data.fixed_platform_fee,
      updated_at: new Date().toISOString()
    })
    .eq("id", data.rule_id);

  if (error) {
    throw new Error(`Erro ao atualizar regra de split: ${error.message}`);
  }

  return {
    success: true,
    message: "Regra de split atualizada com sucesso"
  };
}

// Buscar regras de split
async function getSplitRules(supabaseClient: any, data: any) {
  logStep("Getting split rules", data);

  let query = supabaseClient
    .from("payment_split_rules")
    .select("*");

  if (data.product_id) {
    query = query.eq("product_id", data.product_id);
  }

  if (data.service_id) {
    query = query.eq("service_id", data.service_id);
  }

  const { data: rules, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar regras de split: ${error.message}`);
  }

  return {
    success: true,
    rules: rules || []
  };
}

// Processar splits pendentes (função administrativa)
async function processPendingSplits(supabaseClient: any, asaasHeaders: any) {
  logStep("Processing pending splits");

  // Buscar splits não executados onde o pagamento foi confirmado
  const { data: pendingSplits, error: splitsError } = await supabaseClient
    .from("payment_splits")
    .select(`
      *,
      payments!inner(status, stripe_session_id),
      professionals(id),
      asaas_subaccounts!inner(asaas_account_id, status, verification_status)
    `)
    .eq("split_executed", false)
    .eq("payments.status", "paid")
    .eq("asaas_subaccounts.status", "active")
    .eq("asaas_subaccounts.verification_status", "approved");

  if (splitsError) {
    throw new Error(`Erro ao buscar splits pendentes: ${splitsError.message}`);
  }

  if (!pendingSplits || pendingSplits.length === 0) {
    return {
      success: true,
      message: "Nenhum split pendente encontrado",
      processed: 0
    };
  }

  let processed = 0;
  const errors: string[] = [];

  for (const split of pendingSplits) {
    try {
      logStep("Processing split", { splitId: split.id, asaasPaymentId: split.asaas_payment_id });

      // Executar transferência no ASAAS
      const transferPayload = {
        value: split.professional_amount,
        targetWalletId: split.asaas_subaccounts.asaas_account_id,
        description: `Split de pagamento ${split.asaas_payment_id}`
      };

      const transferResponse = await fetch("https://www.asaas.com/api/v3/transfers", {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify(transferPayload),
      });

      if (transferResponse.ok) {
        // Marcar split como executado
        await supabaseClient
          .from("payment_splits")
          .update({
            split_executed: true,
            split_executed_at: new Date().toISOString()
          })
          .eq("id", split.id);

        processed++;
        logStep("Split executed successfully", { splitId: split.id });
      } else {
        const errorText = await transferResponse.text();
        const error = `Erro na transferência ASAAS: ${errorText}`;
        
        await supabaseClient
          .from("payment_splits")
          .update({
            split_error: error
          })
          .eq("id", split.id);

        errors.push(`Split ${split.id}: ${error}`);
        logStep("Split execution failed", { splitId: split.id, error });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Split ${split.id}: ${errorMessage}`);
      logStep("Split execution error", { splitId: split.id, error: errorMessage });
    }
  }

  return {
    success: true,
    message: `Processamento concluído: ${processed} splits executados`,
    processed,
    errors: errors.length > 0 ? errors : undefined
  };
}

// Buscar histórico de splits
async function getSplitHistory(supabaseClient: any, data: any) {
  logStep("Getting split history", data);

  let query = supabaseClient
    .from("payment_splits")
    .select(`
      *,
      payments(id, amount, status, created_at),
      professionals(full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (data.professional_id) {
    query = query.eq("professional_id", data.professional_id);
  }

  if (data.limit) {
    query = query.limit(data.limit);
  }

  const { data: splits, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar histórico de splits: ${error.message}`);
  }

  return {
    success: true,
    splits: splits || []
  };
}