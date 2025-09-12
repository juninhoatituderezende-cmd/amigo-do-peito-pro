import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('🔗 Webhook Asaas recebido:', req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    // Read raw body for signature validation
    const rawBody = await req.text();
    const body = JSON.parse(rawBody || '{}');
    if (!body?.event || !body?.payment) {
      return new Response('Invalid webhook structure', { status: 400, headers: corsHeaders });
    }

    const { event, payment } = body;

    // Validate signature if secret configured
    const webhookSecret = Deno.env.get('ASAAS_WEBHOOK_SECRET');
    const receivedSig = req.headers.get('x-asaas-signature') || req.headers.get('asaas-signature') || '';
    if (webhookSecret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
      const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (receivedSig && receivedSig !== signatureHex) {
        return new Response('Invalid signature', { status: 401, headers: corsHeaders });
      }
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Idempotency via processed_payments
    const providerEventId = `asaas:${event}:${payment.id}:${payment.status || ''}`;
    const { error: idempError } = await supabaseClient
      .from('processed_payments')
      .insert({ provider_event_id: providerEventId })
    if (idempError && idempError.code === '23505') {
      return new Response(JSON.stringify({ success: true, duplicated: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Only process paid events
    const isPaid = event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED' || payment?.status === 'RECEIVED' || payment?.status === 'CONFIRMED';
    if (!isPaid) {
      return new Response(JSON.stringify({ success: true, message: 'Event ignored' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Parse order_id from externalReference "order=<id>;leader=<id>"
    const extRef: string = payment?.externalReference || '';
    const parseMap = new Map<string, string>();
    if (extRef) {
      for (const part of extRef.split(';')) {
        const [k, v] = part.split('=');
        if (k && v) parseMap.set(k.trim(), v.trim());
      }
    }
    const orderId = parseMap.get('order');
    const intendedLeaderId = parseMap.get('leader') || null;
    if (!orderId) {
      return new Response('Missing order reference', { status: 400, headers: corsHeaders });
    }

    // Load order
    const { data: order, error: orderErr } = await supabaseClient
      .from('orders')
      .select('*, user:orders_user_id_fkey(id), plan:orders_plan_id_fkey(id, price)')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) {
      return new Response('Order not found', { status: 404, headers: corsHeaders });
    }

    // Validate amount consistency (prefer entry_price if available)
    const { data: planRow } = await supabaseClient
      .from('custom_plans')
      .select('entry_price, price')
      .eq('id', order.plan_id)
      .maybeSingle();
    const basePrice = planRow?.entry_price ?? planRow?.price;
    const expectedCents = basePrice != null ? Math.round(Number(basePrice) * 100) : order.amount_cents;
    if (order.amount_cents !== expectedCents) {
      await supabaseClient.from('notification_triggers').insert({
        user_id: null,
        event_type: 'payment_amount_mismatch',
        title: 'Divergência de valor',
        message: `Order ${order.id} amount ${order.amount_cents} != expected ${expectedCents}`,
        data: { order_id: order.id, expected_cents: expectedCents, order_cents: order.amount_cents }
      });
      return new Response('Amount mismatch', { status: 422, headers: corsHeaders });
    }

    // If already paid, exit idempotently
    if (order.status === 'paid') {
      return new Response(JSON.stringify({ success: true, already_paid: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const buyerProfileId: string = order.user_id;

    // Resolve or create target group
    let groupId: string | null = null;
    let finalLeaderId: string | null = intendedLeaderId || order.intended_leader_id || null;

    if (!finalLeaderId) {
      // Create a new group for buyer as leader
      const { data: newGroup, error: groupErr } = await supabaseClient
        .from('groups')
        .insert({ leader_id: buyerProfileId, plan_id: order.plan_id, capacity: 10, current_size: 0, status: 'active' })
        .select('id, capacity')
        .single();
      if (groupErr && groupErr.code !== '23505') { // ignore unique conflicts
        console.error('Erro ao criar grupo próprio:', groupErr);
      }
      if (newGroup) groupId = newGroup.id;

      // If conflict due to uq_active_group_per_leader_plan, fetch existing
      if (!groupId) {
        const { data: existingGroup } = await supabaseClient
          .from('groups')
          .select('id, capacity, current_size')
          .eq('leader_id', buyerProfileId)
          .eq('plan_id', order.plan_id)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
        groupId = existingGroup?.id || null;
      }

      // Join as leader
      if (groupId) {
        await supabaseClient.rpc('join_group_membership', { p_group_id: groupId, p_user_profile_id: buyerProfileId, p_role: 'leader' });
      }
    } else {
      // Try to find active group for intended leader and same plan
      const { data: targetGroup } = await supabaseClient
        .from('groups')
        .select('id, capacity, current_size')
        .eq('leader_id', finalLeaderId)
        .eq('plan_id', order.plan_id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      groupId = targetGroup?.id || null;

      if (!groupId) {
        // Fallback: create own group
        const { data: ownGroup } = await supabaseClient
          .from('groups')
          .insert({ leader_id: buyerProfileId, plan_id: order.plan_id, capacity: 10, current_size: 0, status: 'active' })
          .select('id')
          .single();
        groupId = ownGroup?.id || null;
        finalLeaderId = buyerProfileId;
        if (groupId) await supabaseClient.rpc('join_group_membership', { p_group_id: groupId, p_user_profile_id: buyerProfileId, p_role: 'leader' });
      } else {
        // Attempt to join as member atomically
        const { data: joinResult } = await supabaseClient.rpc('join_group_membership', { p_group_id: groupId, p_user_profile_id: buyerProfileId, p_role: 'member' });
        const newSize = Array.isArray(joinResult) && joinResult.length > 0 ? joinResult[0]?.new_size : null;
        if (newSize === null) {
          // Group likely full. Fallback to own group as leader
          const { data: ownGroup2 } = await supabaseClient
            .from('groups')
            .insert({ leader_id: buyerProfileId, plan_id: order.plan_id, capacity: 10, current_size: 0, status: 'active' })
            .select('id')
            .single();
          groupId = ownGroup2?.id || null;
          finalLeaderId = buyerProfileId;
          if (groupId) await supabaseClient.rpc('join_group_membership', { p_group_id: groupId, p_user_profile_id: buyerProfileId, p_role: 'leader' });
        }
      }
    }

    // Mark order paid
    await supabaseClient.from('orders').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', order.id);

    // On completion: if current_size == capacity, mark completed and notify
    if (groupId) {
      const { data: grp } = await supabaseClient.from('groups').select('id, current_size, capacity, status').eq('id', groupId).single();
      if (grp && grp.current_size >= grp.capacity && grp.status !== 'completed') {
        await supabaseClient.from('groups').update({ status: 'completed', contemplated_at: new Date().toISOString() }).eq('id', groupId);
        await supabaseClient.from('notification_triggers').insert({
          user_id: null,
          event_type: 'group_complete',
          title: 'Grupo completo!',
          message: `Grupo ${groupId} atingiu ${grp.capacity}/${grp.capacity}.`,
          data: { group_id: groupId, plan_id: order.plan_id }
        });
      }
    }

    // Commission hook when there is intended leader different than buyer
    if (finalLeaderId && finalLeaderId !== buyerProfileId) {
      // Fetch leader auth user_id for credit_transactions
      const { data: leaderProfile } = await supabaseClient.from('profiles').select('user_id').eq('id', finalLeaderId).single();
      const commissionAmount = Math.round(order.amount_cents * 0.25) / 100; // decimal BRL
      if (leaderProfile?.user_id && commissionAmount > 0) {
        // Idempotent insert
        const { data: existingTx } = await supabaseClient
          .from('credit_transactions')
          .select('id')
          .eq('source_type', 'influencer_commission')
          .eq('reference_id', providerEventId)
          .single();
        if (!existingTx) {
          await supabaseClient.from('credit_transactions').insert({
            user_id: leaderProfile.user_id,
            type: 'earned',
            amount: commissionAmount,
            description: 'Comissão por indicação (25%)',
            reference_id: providerEventId,
            reference_table: 'processed_payments',
            status: 'pending',
            source_type: 'influencer_commission',
            commission_rate: 25,
            related_user_id: finalLeaderId
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, order_id: order.id, group_id: groupId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('💥 Erro no webhook:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});