import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASAAS-INTEGRATION] ${step}${detailsStr}`);
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

    let result;

    switch (action) {
      case "test_connection":
        result = await testAsaasConnection(data);
        break;
      
      case "save_configuration":
        result = await saveConfiguration(supabaseClient, data);
        break;
      
      case "sync_products":
        result = await syncProducts(supabaseClient);
        break;
      
      case "get_integration_status":
        result = await getIntegrationStatus(supabaseClient);
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
    logStep("ERROR in asaas-integration-manager", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Testar conexão com Asaas
async function testAsaasConnection(data: any) {
  logStep("Testing Asaas connection", { environment: data.environment });

  const baseUrl = data.environment === 'production' 
    ? 'https://www.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';

  try {
    const response = await fetch(`${baseUrl}/myAccount`, {
      method: 'GET',
      headers: {
        'access_token': data.api_key,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const accountData = await response.json();
      logStep("Asaas connection successful", { account: accountData.name });
      
      return {
        success: true,
        message: "Conexão com Asaas estabelecida com sucesso",
        account_info: {
          name: accountData.name,
          email: accountData.email,
          environment: data.environment
        }
      };
    } else {
      const errorText = await response.text();
      throw new Error(`Erro na API Asaas: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Asaas connection failed", { error: errorMessage });
    
    return {
      success: false,
      error: `Falha na conexão: ${errorMessage}`
    };
  }
}

// Salvar configuração
async function saveConfiguration(supabaseClient: any, data: any) {
  logStep("Saving configuration", { environment: data.environment });

  try {
    // Criptografar a API key (simulação básica - em produção usar crypto adequado)
    const apiKeyEncrypted = btoa(data.api_key);

    // Verificar se já existe configuração
    const { data: existing } = await supabaseClient
      .from('asaas_integration')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const configData = {
      api_key_encrypted: apiKeyEncrypted,
      environment: data.environment,
      status: data.auto_sync ? 'active' : 'inactive',
      connection_status: 'connected',
      error_message: null,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existing) {
      // Atualizar configuração existente
      result = await supabaseClient
        .from('asaas_integration')
        .update(configData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Criar nova configuração
      result = await supabaseClient
        .from('asaas_integration')
        .insert({
          ...configData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (result.error) {
      throw new Error(`Erro ao salvar configuração: ${result.error.message}`);
    }

    return {
      success: true,
      message: "Configuração salva com sucesso",
      integration_id: result.data.id
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error saving configuration", { error: errorMessage });
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Sincronizar produtos
async function syncProducts(supabaseClient: any) {
  logStep("Starting product sync");

  try {
    // Buscar configuração ativa
    const { data: integration, error: integrationError } = await supabaseClient
      .from('asaas_integration')
      .select('*')
      .eq('status', 'active')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (integrationError || !integration) {
      throw new Error("Nenhuma integração ativa encontrada");
    }

    // Descriptografar API key
    const apiKey = atob(integration.api_key_encrypted);
    const baseUrl = integration.environment === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3';

    // Buscar produtos que precisam ser sincronizados
    const { data: products } = await supabaseClient
      .from('products')
      .select('*')
      .eq('active', true)
      .is('asaas_product_id', null);

    const { data: customPlans } = await supabaseClient
      .from('custom_plans')
      .select('*')
      .eq('active', true)
      .is('asaas_product_id', null);

    let syncedCount = 0;

    // Sincronizar produtos
    if (products) {
      for (const product of products) {
        try {
          const asaasProduct = await createAsaasProduct(baseUrl, apiKey, {
            name: product.name,
            description: product.description,
            value: product.price,
            type: 'INSTALLMENT'
          });

          if (asaasProduct.id) {
            await supabaseClient
              .from('products')
              .update({ asaas_product_id: asaasProduct.id })
              .eq('id', product.id);

            syncedCount++;
            logStep("Product synced", { productId: product.id, asaasId: asaasProduct.id });
          }
        } catch (error) {
          logStep("Error syncing product", { productId: product.id, error: error.message });
        }
      }
    }

    // Sincronizar planos customizados
    if (customPlans) {
      for (const plan of customPlans) {
        try {
          const asaasPlan = await createAsaasProduct(baseUrl, apiKey, {
            name: plan.name,
            description: plan.description,
            value: plan.price,
            type: 'INSTALLMENT'
          });

          if (asaasPlan.id) {
            await supabaseClient
              .from('custom_plans')
              .update({ asaas_product_id: asaasPlan.id })
              .eq('id', plan.id);

            syncedCount++;
            logStep("Plan synced", { planId: plan.id, asaasId: asaasPlan.id });
          }
        } catch (error) {
          logStep("Error syncing plan", { planId: plan.id, error: error.message });
        }
      }
    }

    // Atualizar timestamp da última sincronização
    await supabaseClient
      .from('asaas_integration')
      .update({ 
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id);

    return {
      success: true,
      message: `Sincronização concluída: ${syncedCount} itens sincronizados`,
      synced: syncedCount
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error in product sync", { error: errorMessage });
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Criar produto no Asaas
async function createAsaasProduct(baseUrl: string, apiKey: string, productData: any) {
  const response = await fetch(`${baseUrl}/subscriptions`, {
    method: 'POST',
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      billingType: 'BOLETO',
      cycle: 'MONTHLY',
      name: productData.name,
      description: productData.description,
      value: productData.value
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao criar produto no Asaas: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Buscar status da integração
async function getIntegrationStatus(supabaseClient: any) {
  logStep("Getting integration status");

  try {
    const { data, error } = await supabaseClient
      .from('asaas_integration')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return {
      success: true,
      integration: data
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error getting integration status", { error: errorMessage });
    
    return {
      success: false,
      error: errorMessage
    };
  }
}