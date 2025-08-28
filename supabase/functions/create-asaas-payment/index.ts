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

    // Criar cobrança no Asaas
    console.log('Criando cobrança com dados:', paymentData);
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
    const responseData: any = {
      success: true,
      payment_id: asaasResult.id,
      amount: entryAmount,
      plan_name: planData.name,
      due_date: asaasResult.dueDate,
      status: asaasResult.status
    }

    // Adicionar dados específicos baseados no método de pagamento
    if (payment_method === 'pix') {
      console.log('Processando dados PIX...');
      
      if (asaasResult.pixTransaction) {
        responseData.pix_code = asaasResult.pixTransaction.qrCode?.payload || null;
        responseData.qr_code = asaasResult.pixTransaction.qrCode?.encodedImage || null;
        console.log('PIX Code:', responseData.pix_code ? 'Encontrado' : 'Não encontrado');
        console.log('QR Code:', responseData.qr_code ? 'Encontrado' : 'Não encontrado');
      } else {
        console.warn('pixTransaction não encontrado na resposta');
      }
    } else {
      console.log('Processando dados do boleto...');
      responseData.invoice_url = asaasResult.invoiceUrl || null;
      responseData.bank_slip_url = asaasResult.bankSlipUrl || null;
      console.log('Invoice URL:', responseData.invoice_url ? 'Encontrada' : 'Não encontrada');
      console.log('Bank Slip URL:', responseData.bank_slip_url ? 'Encontrada' : 'Não encontrada');
    }

    console.log('Dados de resposta finais:', JSON.stringify(responseData, null, 2));

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

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