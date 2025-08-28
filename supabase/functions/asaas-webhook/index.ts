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
    // Verificar se é POST
    if (req.method !== "POST") {
      console.log('❌ Método não permitido:', req.method);
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse do body
    const body = await req.json();
    console.log('📝 Dados do webhook:', JSON.stringify(body, null, 2));

    // Validar estrutura do webhook
    if (!body.event || !body.payment) {
      console.log('❌ Estrutura de webhook inválida');
      return new Response('Invalid webhook structure', { status: 400 });
    }

    const { event, payment } = body;
    console.log('🎯 Evento:', event);
    console.log('💳 Pagamento ID:', payment.id);
    console.log('💰 Status:', payment.status);

    // Inicializar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Buscar pagamento no banco
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('asaas_payment_id', payment.id)
      .single();

    if (paymentError || !paymentRecord) {
      console.log('❌ Pagamento não encontrado no banco:', payment.id);
      return new Response('Payment not found', { status: 404 });
    }

    console.log('💾 Registro encontrado:', paymentRecord.id);

    // Processar evento baseado no status
    let newStatus = paymentRecord.status;
    let shouldCreateGroup = false;

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        console.log('✅ Pagamento confirmado');
        newStatus = 'paid';
        shouldCreateGroup = true;
        break;

      case 'PAYMENT_OVERDUE':
        console.log('⏰ Pagamento em atraso');
        newStatus = 'overdue';
        break;

      case 'PAYMENT_DELETED':
        console.log('🗑️ Pagamento cancelado');
        newStatus = 'cancelled';
        break;

      default:
        console.log('ℹ️ Evento não processado:', event);
        break;
    }

    // Atualizar status do pagamento
    if (newStatus !== paymentRecord.status) {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error: updateError } = await supabaseClient
        .from('payments')
        .update(updateData)
        .eq('id', paymentRecord.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar pagamento:', updateError);
        throw updateError;
      }

      console.log('✅ Status atualizado para:', newStatus);
    }

    // Se pagamento confirmado, criar/juntar grupo
    if (shouldCreateGroup && paymentRecord.plan_id) {
      console.log('🏗️ Criando/juntando usuário ao grupo...');

      try {
        // Verificar se usuário já está em algum grupo para este plano
        const { data: existingParticipation } = await supabaseClient
          .from('group_participants')
          .select('id')
          .eq('user_id', paymentRecord.user_id)
          .single();

        if (!existingParticipation) {
          // Buscar grupo disponível para o plano
          const { data: availableGroup } = await supabaseClient
            .from('plan_groups')
            .select('*')
            .eq('service_id', paymentRecord.plan_id)
            .eq('status', 'forming')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          let groupId = availableGroup?.id;

          // Se não existe grupo disponível, criar novo
          if (!groupId) {
            const { data: planData } = await supabaseClient
              .from('custom_plans')
              .select('max_participants, price')
              .eq('id', paymentRecord.plan_id)
              .single();

            if (planData) {
              // Obter próximo número de grupo
              const { data: lastGroup } = await supabaseClient
                .from('plan_groups')
                .select('group_number')
                .eq('service_id', paymentRecord.plan_id)
                .order('group_number', { ascending: false })
                .limit(1)
                .single();

              const nextGroupNumber = (lastGroup?.group_number || 0) + 1;

              const { data: newGroup, error: groupError } = await supabaseClient
                .from('plan_groups')
                .insert({
                  service_id: paymentRecord.plan_id,
                  max_participants: planData.max_participants,
                  target_amount: planData.price,
                  current_participants: 0,
                  current_amount: 0,
                  status: 'forming',
                  group_number: nextGroupNumber
                })
                .select()
                .single();

              if (groupError) {
                console.error('❌ Erro ao criar grupo:', groupError);
                throw groupError;
              }

              groupId = newGroup.id;
              console.log('🆕 Novo grupo criado:', groupId);
            }
          }

          // Adicionar usuário ao grupo
          if (groupId) {
            const { error: participantError } = await supabaseClient
              .from('group_participants')
              .insert({
                user_id: paymentRecord.user_id,
                group_id: groupId,
                amount_paid: paymentRecord.amount,
                status: 'active',
                joined_at: new Date().toISOString()
              });

            if (participantError) {
              console.error('❌ Erro ao adicionar participante:', participantError);
              throw participantError;
            }

            // Atualizar contadores do grupo
            const { data: updatedGroup, error: updateGroupError } = await supabaseClient
              .from('plan_groups')
              .update({
                current_participants: supabaseClient.rpc('increment', 1),
                current_amount: supabaseClient.rpc('add', paymentRecord.amount),
                updated_at: new Date().toISOString()
              })
              .eq('id', groupId)
              .select()
              .single();

            if (updateGroupError) {
              console.error('❌ Erro ao atualizar grupo:', updateGroupError);
            } else {
              console.log('✅ Usuário adicionado ao grupo:', groupId);

              // Verificar se grupo ficou completo
              if (updatedGroup && updatedGroup.current_participants >= updatedGroup.max_participants) {
                await supabaseClient
                  .from('plan_groups')
                  .update({ status: 'complete', contemplated_at: new Date().toISOString() })
                  .eq('id', groupId);

                console.log('🎉 Grupo completado:', groupId);
              }
            }

            // Criar notificação para o usuário
            await supabaseClient
              .from('notification_triggers')
              .insert({
                user_id: paymentRecord.user_id,
                event_type: 'payment_confirmed',
                title: 'Pagamento Confirmado!',
                message: `Seu pagamento de R$ ${paymentRecord.amount} foi confirmado e você foi adicionado ao grupo.`,
                data: {
                  payment_id: paymentRecord.id,
                  group_id: groupId,
                  amount: paymentRecord.amount,
                  plan_name: paymentRecord.plan_name
                }
              });
          }
        } else {
          console.log('ℹ️ Usuário já está em um grupo');
        }

      } catch (error) {
        console.error('❌ Erro ao processar grupo:', error);
        // Não falhar o webhook se der erro no grupo
      }
    }

    console.log('🎉 Webhook processado com sucesso');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook processed successfully',
      payment_id: payment.id,
      status: newStatus
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

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