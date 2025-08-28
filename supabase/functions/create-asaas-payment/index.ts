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

    const { plan_id, plan_category, user_id, payment_method = 'pix', municipio = 'sao_paulo' } = await req.json()

    console.log('Iniciando criação de pagamento:', { plan_id, plan_category, user_id, payment_method, municipio })

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

    // **4. BUSCAR PLANO USANDO EDGE FUNCTION UNIFICADA**
    console.log('🔍 [PLAN-SEARCH] Buscando plano via unified-plans-loader...')
    
    const { data: plansResponse, error: plansError } = await supabaseClient.functions.invoke('unified-plans-loader', {
      body: { include_inactive: false, admin_view: false }
    })
    
    if (plansError || !plansResponse?.success) {
      console.error('❌ [PLAN-SEARCH] Erro ao buscar planos:', plansError)
      throw new Error('Erro ao carregar planos disponíveis')
    }
    
    const foundPlan = plansResponse.plans.find((plan: any) => plan.id === plan_id)
    
    if (!foundPlan) {
      console.error('❌ [PLAN-SEARCH] Plano não encontrado:', { plan_id, plan_category })
      console.log('📋 [PLAN-SEARCH] Planos disponíveis:', plansResponse.plans.map((p: any) => ({ id: p.id, name: p.name, active: p.active })))
      throw new Error(`Plano não encontrado ou inativo: ${plan_id}`)
    }
    
    if (!foundPlan.active) {
      console.error('❌ [PLAN-SEARCH] Plano inativo:', foundPlan)
      throw new Error(`Plano está inativo: ${foundPlan.name}`)
    }
    
    const planData = foundPlan
    const planTableSource = foundPlan.table_source
    
    console.log('✅ [PLAN-SEARCH] Plano encontrado:', {
      id: planData.id,
      name: planData.name,
      price: planData.price,
      source: planTableSource,
      tipo_transacao: planData.tipo_transacao
    })

    // **5. BUSCAR E VALIDAR DADOS DO USUÁRIO**
    console.log('👤 [USER-DATA] Buscando dados do usuário...')
    const { data: user, error: userError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (userError || !user) {
      console.error('❌ [USER-DATA] Usuário não encontrado:', userError)
      throw new Error('Usuário não encontrado')
    }

    if (!user.cpf) {
      console.error('❌ [USER-DATA] CPF obrigatório não informado')
      throw new Error('CPF é obrigatório para criar pagamentos')
    }

    console.log('✅ [USER-DATA] Usuário validado:', { id: user.id, email: user.email, cpf_provided: !!user.cpf })

    // **6. CALCULAR IMPOSTOS BASEADO NO TIPO DE TRANSAÇÃO**
    console.log('💰 [TAX-CALC] Calculando impostos para:', planData.tipo_transacao)
    
    const { data: impostos, error: impostosError } = await supabaseClient
      .rpc('calcular_impostos', {
        valor_base: planData.price,
        tipo: planData.tipo_transacao,
        municipio: 'sao_paulo',
        regime: 'simples_nacional'
      });

    if (impostosError) {
      console.error('⚠️ [TAX-CALC] Erro no cálculo de impostos:', impostosError);
      // Continuar sem impostos se cálculo falhar
    }

    console.log('📊 [TAX-CALC] Impostos calculados:', impostos);

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
      // Criar novo cliente - CORREÇÃO: Incluir CPF obrigatoriamente
      if (!user.cpf) {
        console.error('❌ CPF obrigatório para criar novo cliente no Asaas');
        throw new Error('CPF é obrigatório para criar clientes no Asaas');
      }

      const newCustomerData = {
        name: user.full_name || user.email,
        email: user.email,
        cpfCnpj: user.cpf, // CORREÇÃO: Sempre incluir CPF
        phone: user.phone || undefined
      };

      console.log('🆕 Criando novo cliente com dados:', newCustomerData);
      
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
        console.error('❌ Erro ao criar cliente no Asaas:', newCustomer);
        throw new Error(newCustomer.errors?.[0]?.description || 'Erro ao criar cliente no Asaas');
      }
      
      customerId = newCustomer.id;
      console.log('✅ Novo cliente criado com sucesso:', customerId);
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

    // Salvar transação no banco de dados
    const { data: transacaoRecord, error: transacaoError } = await supabaseClient
      .from('transacoes')
      .insert({
        usuario_id: user_id,
        plano_id: plan_id,
        valor: entryAmount,
        tipo_transacao: tipoTransacao,
        status: 'pendente',
        asaas_payment_id: asaasResult.id,
        payment_method: payment_method,
        iss_percentual: impostos?.iss_percentual || 0,
        icms_percentual: impostos?.icms_percentual || 0,
        pis_cofins_percentual: impostos?.pis_cofins_percentual || 0,
        valor_impostos: impostos?.total_impostos || 0,
        valor_liquido: impostos?.valor_liquido || entryAmount,
        municipio_iss: municipio,
        regime_tributario: 'simples_nacional',
        observacoes: `Entrada do plano: ${planData.name} (10% do valor total) - Tipo: ${tipoTransacao}`
      })
      .select()
      .single();

    if (transacaoError) {
      console.error('❌ Erro ao salvar transação:', transacaoError);
      throw new Error('Erro ao salvar dados da transação');
    }

    console.log('✅ Transação salva no banco:', transacaoRecord.id);

    // Também salvar na tabela payments para compatibilidade
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
      // Não falhar se der erro no payments, pois já temos na transacoes
    } else {
      console.log('✅ Pagamento salvo no banco:', paymentRecord.id);
    }

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
      transacao_id: transacaoRecord.id,
      payment_id: paymentRecord?.id || null,
      asaas_payment_id: asaasResult.id,
      redirect_url: redirectUrl,
      amount: entryAmount,
      valor_liquido: impostos?.valor_liquido || entryAmount,
      valor_impostos: impostos?.total_impostos || 0,
      tipo_transacao: tipoTransacao,
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