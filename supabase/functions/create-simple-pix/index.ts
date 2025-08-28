import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { plan_id, plan_category, user_id, payment_method = 'pix', municipio = 'sao_paulo' } = await req.json()

    console.log('🚀 [SIMPLE] Iniciando PIX simples:', { plan_id, user_id, payment_method })

    // Buscar dados do usuário
    const { data: user, error: userError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (userError || !user) {
      throw new Error('Usuário não encontrado')
    }

    console.log('✅ [SIMPLE] Usuário encontrado:', user.full_name)

    // Buscar plano usando unified-plans-loader
    const { data: plansResponse, error: plansError } = await supabaseClient.functions.invoke('unified-plans-loader', {
      body: { include_inactive: false, admin_view: false }
    })
    
    if (plansError || !plansResponse?.success) {
      throw new Error('Erro ao carregar planos')
    }
    
    const foundPlan = plansResponse.plans.find((plan: any) => plan.id === plan_id)
    
    if (!foundPlan) {
      throw new Error(`Plano não encontrado: ${plan_id}`)
    }

    console.log('✅ [SIMPLE] Plano encontrado:', foundPlan.name, 'R$', foundPlan.price)

    // Buscar configuração Asaas
    const { data: asaasConfigs, error: configError } = await supabaseClient
      .from('asaas_integration')
      .select('*')
      .order('created_at', { ascending: false })

    if (configError || !asaasConfigs || asaasConfigs.length === 0) {
      throw new Error('Configuração Asaas não encontrada')
    }

    const asaasConfig = asaasConfigs.find(config => config.status === 'active') || asaasConfigs[0]
    console.log('✅ [SIMPLE] Config Asaas:', asaasConfig.environment)

    // Preparar dados para o Asaas
    const asaasBaseUrl = asaasConfig.environment === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3'

    const apiKey = atob(asaasConfig.api_key_encrypted)

    // Criar/buscar cliente no Asaas
    let customerId = null;
    
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
      console.log('✅ [SIMPLE] Cliente existente:', customerId);
    } else {
      // Criar novo cliente
      const newCustomerData = {
        name: user.full_name || user.email,
        email: user.email,
        cpfCnpj: user.cpf,
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
        throw new Error(newCustomer.errors?.[0]?.description || 'Erro ao criar cliente');
      }
      
      customerId = newCustomer.id;
      console.log('✅ [SIMPLE] Novo cliente criado:', customerId);
    }

    // Criar cobrança PIX
    const paymentData = {
      customer: customerId,
      billingType: 'PIX',
      value: foundPlan.price,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `${foundPlan.name} - R$ ${foundPlan.price}`,
      externalReference: `plan_${plan_id}_user_${user_id}`,
      postalService: false
    }

    console.log('🔄 [SIMPLE] Criando cobrança PIX...')
    const asaasResponse = await fetch(`${asaasBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentData)
    })

    const asaasResult = await asaasResponse.json()

    if (!asaasResponse.ok) {
      console.error('❌ [SIMPLE] Erro Asaas:', asaasResult)
      throw new Error(asaasResult.errors?.[0]?.description || 'Erro ao criar cobrança')
    }

    console.log('✅ [SIMPLE] Cobrança criada:', asaasResult.id)

    // Buscar QR Code PIX
    let pixQrCode = null;
    let pixCode = null;
    
    const qrCodeResponse = await fetch(`${asaasBaseUrl}/payments/${asaasResult.id}/pixQrCode`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      }
    });

    if (qrCodeResponse.ok) {
      const qrCodeData = await qrCodeResponse.json();
      pixQrCode = qrCodeData.encodedImage;
      pixCode = qrCodeData.payload;
      console.log('✅ [SIMPLE] QR Code obtido');
    }

    // Salvar no banco
    const { data: transacaoRecord } = await supabaseClient
      .from('transacoes')
      .insert({
        usuario_id: user_id,
        plano_id: plan_id,
        valor: foundPlan.price,
        tipo_transacao: 'servico',
        status: 'pendente',
        asaas_payment_id: asaasResult.id,
        payment_method: payment_method,
        valor_liquido: foundPlan.price,
        observacoes: `PIX Instantâneo: ${foundPlan.name}`
      })
      .select()
      .single();

    console.log('✅ [SIMPLE] PIX salvo no banco')

    // Retornar PIX pronto
    const responseData = {
      success: true,
      payment_id: asaasResult.id,
      amount: foundPlan.price,
      plan_name: foundPlan.name,
      qr_code: pixQrCode,
      pix_code: pixCode,
      status: 'pending',
      message: 'PIX gerado com sucesso!'
    };

    console.log('🎉 [SIMPLE] PIX PRONTO!')

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ [SIMPLE] Erro:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})