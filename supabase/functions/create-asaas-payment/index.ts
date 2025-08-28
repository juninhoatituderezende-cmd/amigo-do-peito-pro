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

    const { plan_id, plan_category, user_id, payment_method = 'credit_card' } = await req.json()

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

    const paymentData = {
      customer: user.id,
      billingType: payment_method.toUpperCase(),
      value: entryAmount,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
      description: `Entrada do plano: ${planData.name} (10% do valor total)`,
      externalReference: `plan_${plan_id}_user_${user_id}`,
      postalService: false
    }

    // Criar cobrança no Asaas
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
      console.error('Erro na API Asaas:', asaasResult)
      throw new Error(asaasResult.errors?.[0]?.description || 'Erro ao criar cobrança')
    }

    console.log('Cobrança criada com sucesso:', asaasResult.id)

    // Retornar resposta baseada no método de pagamento
    const responseData = {
      success: true,
      payment_id: asaasResult.id,
      amount: entryAmount,
      plan_name: planData.name,
      due_date: asaasResult.dueDate,
      status: asaasResult.status
    }

    if (payment_method === 'pix') {
      responseData.pix_code = asaasResult.pixTransaction?.qrCode?.payload
      responseData.qr_code = asaasResult.pixTransaction?.qrCode?.encodedImage
    } else {
      responseData.invoice_url = asaasResult.invoiceUrl
      responseData.bank_slip_url = asaasResult.bankSlipUrl
    }

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