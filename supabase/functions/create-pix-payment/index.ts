import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PixPaymentRequest {
  serviceId: string;
  amount: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  referrerId?: string;
  groupParticipation?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PixPaymentRequest = await req.json();
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');

    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY não configurada');
    }

    // 1. Criar/buscar cliente no Asaas
    let customerId = await getOrCreateAsaasCustomer(asaasApiKey, {
      name: body.customerName,
      email: body.customerEmail,
      cpfCnpj: body.customerCpf
    });

    // 2. Criar cobrança PIX
    const pixPayment = await createAsaasPixPayment(asaasApiKey, {
      customer: customerId,
      value: body.amount,
      description: body.description,
      externalReference: body.serviceId,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    // 3. Buscar QR Code
    const pixQrCode = await getPixQrCode(asaasApiKey, pixPayment.id);

    // 4. Registrar venda no marketplace
    const { data: sale } = await supabase
      .from('marketplace_sales')
      .insert({
        buyer_id: user.id,
        seller_id: body.serviceId, // Será corrigido depois
        service_id: body.serviceId,
        payment_method: 'pix',
        total_amount: body.amount,
        payment_id: pixPayment.id,
        status: 'pending',
        referrer_id: body.referrerId
      })
      .select()
      .single();

    // 5. Se for participação em grupo, processar
    if (body.groupParticipation) {
      await processGroupJoin(supabase, user.id, body.serviceId, body.amount, body.referrerId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: pixPayment.id,
          status: pixPayment.status,
          amount: body.amount,
          qrCode: pixQrCode.encodedImage,
          pixCopyPaste: pixQrCode.payload,
          expiresAt: pixPayment.dueDate
        },
        sale: sale
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao criar PIX:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getOrCreateAsaasCustomer(apiKey: string, customerData: any) {
  // Tentar buscar cliente existente
  const searchResponse = await fetch(`https://www.asaas.com/api/v3/customers?email=${customerData.email}`, {
    headers: { 'access_token': apiKey }
  });

  if (searchResponse.ok) {
    const searchResult = await searchResponse.json();
    if (searchResult.data && searchResult.data.length > 0) {
      return searchResult.data[0].id;
    }
  }

  // Criar novo cliente
  const createResponse = await fetch('https://www.asaas.com/api/v3/customers', {
    method: 'POST',
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(customerData)
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Erro ao criar cliente: ${error}`);
  }

  const customer = await createResponse.json();
  return customer.id;
}

async function createAsaasPixPayment(apiKey: string, paymentData: any) {
  const response = await fetch('https://www.asaas.com/api/v3/payments', {
    method: 'POST',
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...paymentData,
      billingType: 'PIX'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao criar cobrança PIX: ${error}`);
  }

  return await response.json();
}

async function getPixQrCode(apiKey: string, paymentId: string) {
  const response = await fetch(`https://www.asaas.com/api/v3/payments/${paymentId}/pixQrCode`, {
    headers: { 'access_token': apiKey }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar QR Code PIX');
  }

  return await response.json();
}

async function processGroupJoin(supabase: any, userId: string, serviceId: string, amount: number, referrerId?: string) {
  // Buscar grupo ativo ou criar novo
  let { data: activeGroup } = await supabase
    .from('plan_groups')
    .select('*')
    .eq('service_id', serviceId)
    .eq('status', 'forming')
    .lt('current_participants', 10)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!activeGroup) {
    // Criar novo grupo
    const { data: newGroup } = await supabase
      .from('plan_groups')
      .insert({
        service_id: serviceId,
        group_number: Math.floor(Math.random() * 10000),
        target_amount: amount * 10,
        current_amount: 0,
        current_participants: 0,
        max_participants: 10,
        status: 'forming'
      })
      .select()
      .single();

    activeGroup = newGroup;
  }

  // Adicionar participante (será confirmado via webhook)
  await supabase
    .from('group_participants')
    .insert({
      group_id: activeGroup.id,
      user_id: userId,
      amount_paid: amount,
      referrer_id: referrerId,
      status: 'pending'
    });

  return activeGroup;
}