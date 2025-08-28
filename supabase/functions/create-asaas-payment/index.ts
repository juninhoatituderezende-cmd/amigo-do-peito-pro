import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { plan_id, plan_category, user_id, payment_method = 'pix' } = await req.json()

    console.log('Iniciando criação de pagamento:', { plan_id, plan_category, user_id, payment_method })

    // Obter configuração ativa da integração Asaas
    const { data: asaasConfig, error: configError } = await supabaseClient
      .from('asaas_integration')
      .select('*')
      .eq('status', 'active')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (configError || !asaasConfig) {
      throw new Error('Integração Asaas não configurada ou inativa')
    }

    // Buscar dados do plano
    let planData = null
    const tableMap: Record<string, string> = {
      'tattoo': 'planos_tatuador',
      'dental': 'planos_dentista'
    }

    const tableName = tableMap[plan_category]
    if (!tableName) {
      throw new Error('Categoria de plano inválida')
    }

    const { data: plan, error: planError } = await supabaseClient
      .from(tableName)
      .select('*')
      .eq('id', plan_id)
      .eq('active', true)
      .single()

    if (planError || !plan) {
      throw new Error('Plano não encontrado ou inativo')
    }

    planData = plan

    // Buscar dados do usuário
    const { data: user, error: userError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (userError || !user) {
      throw new Error('Usuário não encontrado')
    }

    // Calcular valor da entrada (10% do preço total)
    const entryAmount = Math.round(planData.price * 0.1)

    // Preparar dados para o Asaas
    const asaasBaseUrl = asaasConfig.environment === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3'

    const apiKey = atob(asaasConfig.api_key_encrypted) // Descriptografar a chave

    // Primeiro, criar/buscar cliente no Asaas se necessário
    let customerId = null;
    
    // Tentar buscar cliente existente pelo email
    const customerSearchResponse = await fetch(`${asaasBaseUrl}/customers?email=${encodeURIComponent(user.email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      }
    });

    const existingCustomers = await customerSearchResponse.json();
    
    if (existingCustomers.data && existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      console.log('Cliente existente encontrado:', customerId);
    } else {
      // Criar novo cliente
      const newCustomerData = {
        name: user.full_name || user.email,
        email: user.email,
        cpfCnpj: user.cpf || undefined,
        phone: user.phone || undefined
      };

      const createCustomerResponse = await fetch(`${asaasBaseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        },
        body: JSON.stringify(newCustomerData)
      });

      const newCustomer = await createCustomerResponse.json();
      
      if (!createCustomerResponse.ok) {
        console.error('Erro ao criar cliente:', newCustomer);
        throw new Error(newCustomer.errors?.[0]?.description || 'Erro ao criar cliente');
      }
      
      customerId = newCustomer.id;
      console.log('Novo cliente criado:', customerId);
    }

    const paymentData = {
      customer: customerId,
      billingType: payment_method === 'pix' ? 'PIX' : 'BOLETO',
      value: entryAmount,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
      description: `Entrada do plano: ${planData.name} (10% do valor total)`,
      externalReference: `plan_${plan_id}_user_${user_id}`,
      postalService: false
    }

    // Validar se CPF foi fornecido antes de criar cobrança
    if (!user.cpf) {
      console.error('❌ CPF/CNPJ não fornecido para criação da cobrança - usuário:', user_id);
      throw new Error('Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente.');
    }
    
    // Criar cobrança no Asaas
    console.log('Criando cobrança com dados:', paymentData);
    console.log('✅ CPF do cliente fornecido:', user.cpf);
    const asaasResponse = await fetch(`${asaasBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentData)
    })

    const asaasResult = await asaasResponse.json()
    console.log('Resposta completa da API Asaas:', JSON.stringify(asaasResult, null, 2));

    if (!asaasResponse.ok) {
      console.error('Erro na API Asaas:', asaasResult)
      throw new Error(asaasResult.errors?.[0]?.description || 'Erro ao criar cobrança')
    }

    console.log('Cobrança criada com sucesso:', asaasResult.id)

    // Preparar resposta padrão
    console.log('Resposta da API Asaas:', JSON.stringify(asaasResult, null, 2));

    // Salvar pagamento no banco de dados
    const { data: paymentRecord, error: saveError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user_id,
        plan_id: plan_id,
        asaas_payment_id: asaasResult.id,
        amount: entryAmount,
        status: 'pending',
        payment_method: payment_method,
        payment_url: asaasResult.invoiceUrl || asaasResult.bankSlipUrl || null,
        plan_name: planData.name,
        customer_id: customerId,
        due_date: asaasResult.dueDate,
        external_reference: `plan_${plan_id}_user_${user_id}`
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ Erro ao salvar pagamento:', saveError);
      throw new Error('Erro ao salvar dados do pagamento');
    }

    console.log('✅ Pagamento salvo no banco:', paymentRecord.id);

    // **FLUXO iFood: Redirecionar automaticamente para payment_url**
    let redirectUrl = null;
    
    // Para PIX, usar invoiceUrl se disponível
    if (payment_method === 'pix' && asaasResult.invoiceUrl) {
      redirectUrl = asaasResult.invoiceUrl;
    }
    // Para boleto, usar bankSlipUrl
    else if (payment_method === 'boleto' && asaasResult.bankSlipUrl) {
      redirectUrl = asaasResult.bankSlipUrl;
    }
    // Fallback para invoiceUrl genérica
    else if (asaasResult.invoiceUrl) {
      redirectUrl = asaasResult.invoiceUrl;
    }

    if (!redirectUrl) {
      console.error('❌ URL de pagamento não encontrada na resposta do Asaas');
      throw new Error('URL de pagamento não disponível');
    }

    console.log('🔗 URL de redirecionamento:', redirectUrl);

    // Retornar dados para redirecionamento imediato
    const responseData = {
      success: true,
      payment_id: paymentRecord.id,
      asaas_payment_id: asaasResult.id,
      redirect_url: redirectUrl,
      amount: entryAmount,
      plan_name: planData.name,
      status: 'pending',
      message: 'Redirecionando para pagamento...'
    };

    console.log('📤 Retornando dados de redirecionamento:', responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro ao criar pagamento:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})