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

    // Buscar pagamento no banco (verificar nas duas tabelas)
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('asaas_payment_id', payment.id)
      .single();

    const { data: transacaoRecord, error: transacaoError } = await supabaseClient
      .from('transacoes')
      .select('*')
      .eq('asaas_payment_id', payment.id)
      .single();

    const recordToUpdate = paymentRecord || transacaoRecord;

    if ((paymentError && transacaoError) || !recordToUpdate) {
      console.log('❌ Pagamento não encontrado no banco:', payment.id);
      return new Response('Payment not found', { status: 404 });
    }

    console.log('💾 Registro encontrado:', recordToUpdate.id);

    // Processar evento baseado no status
    let newStatus = recordToUpdate.status;
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

    // Atualizar status do pagamento/transação
    if (newStatus !== recordToUpdate.status) {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      // Atualizar na tabela payments se existir
      if (paymentRecord) {
        const { error: updatePaymentError } = await supabaseClient
          .from('payments')
          .update(updateData)
          .eq('id', paymentRecord.id);

        if (updatePaymentError) {
          console.error('❌ Erro ao atualizar payments:', updatePaymentError);
        }
      }

      // Atualizar na tabela transacoes se existir
      if (transacaoRecord) {
        const { error: updateTransacaoError } = await supabaseClient
          .from('transacoes')
          .update(updateData)
          .eq('id', transacaoRecord.id);

        if (updateTransacaoError) {
          console.error('❌ Erro ao atualizar transacoes:', updateTransacaoError);
        }
      }

      console.log('✅ Status atualizado para:', newStatus);
    }

    // Se pagamento confirmado, processar grupo e comissões
    if (shouldCreateGroup && recordToUpdate.plan_id) {
      console.log('🏗️ Processando grupo e comissões...');

      try {
        // Verificar se usuário já está em algum grupo para este plano
        const { data: existingParticipation } = await supabaseClient
          .from('group_participants')
          .select('id, group_id')
          .eq('user_id', recordToUpdate.user_id || recordToUpdate.usuario_id)
          .single();

        if (!existingParticipation) {
          // Buscar grupo disponível para o plano
          const { data: availableGroup } = await supabaseClient
            .from('plan_groups')
            .select('*')
            .eq('service_id', recordToUpdate.plan_id)
            .eq('status', 'forming')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          let groupId = availableGroup?.id;

          // Se não existe grupo disponível, criar novo
          if (!groupId) {
            // Buscar dados do plano - verificar em ambas as tabelas
            let planData = null;
            
              // Tentar buscar em custom_plans primeiro
              const { data: customPlan } = await supabaseClient
                .from('custom_plans')
                .select('max_participants, price, name')
                .eq('id', recordToUpdate.plan_id)
              .single();

            if (customPlan) {
              planData = customPlan;
            } else {
                // Buscar em planos_tatuador
                const { data: tattooPlan } = await supabaseClient
                  .from('planos_tatuador')
                  .select('max_participants, price, name')
                  .eq('id', recordToUpdate.plan_id)
                .single();

              if (tattooPlan) {
                planData = tattooPlan;
              } else {
                  // Buscar em planos_dentista
                  const { data: dentalPlan } = await supabaseClient
                    .from('planos_dentista')
                    .select('max_participants, price, name')
                    .eq('id', recordToUpdate.plan_id)
                  .single();

                if (dentalPlan) {
                  planData = dentalPlan;
                }
              }
            }

            if (planData) {
                // Obter próximo número de grupo
                const { data: lastGroup } = await supabaseClient
                  .from('plan_groups')
                  .select('group_number')
                  .eq('service_id', recordToUpdate.plan_id)
                .order('group_number', { ascending: false })
                .limit(1)
                .single();

              const nextGroupNumber = (lastGroup?.group_number || 0) + 1;

                const { data: newGroup, error: groupError } = await supabaseClient
                  .from('plan_groups')
                  .insert({
                    service_id: recordToUpdate.plan_id,
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
            // Buscar se há referrer no pagamento
            let referrerId = null;
            const { data: userProfile } = await supabaseClient
              .from('profiles')
              .select('referred_by')
              .eq('user_id', recordToUpdate.user_id || recordToUpdate.usuario_id)
              .single();

            if (userProfile?.referred_by) {
              referrerId = userProfile.referred_by;
            }

            const { error: participantError } = await supabaseClient
              .from('group_participants')
              .insert({
                user_id: recordToUpdate.user_id || recordToUpdate.usuario_id,
                group_id: groupId,
                amount_paid: recordToUpdate.amount || recordToUpdate.valor,
                status: 'active',
                joined_at: new Date().toISOString(),
                referrer_id: referrerId
              });

            if (participantError) {
              console.error('❌ Erro ao adicionar participante:', participantError);
              throw participantError;
            }

            // Atualizar contadores do grupo manualmente
            const { data: currentGroup } = await supabaseClient
              .from('plan_groups')
              .select('current_participants, current_amount, max_participants')
              .eq('id', groupId)
              .single();

            if (currentGroup) {
              const newParticipants = currentGroup.current_participants + 1;
              const newAmount = currentGroup.current_amount + (recordToUpdate.amount || recordToUpdate.valor);

              const { data: updatedGroup, error: updateGroupError } = await supabaseClient
                .from('plan_groups')
                .update({
                  current_participants: newParticipants,
                  current_amount: newAmount,
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
                if (newParticipants >= currentGroup.max_participants) {
                  await supabaseClient
                    .from('plan_groups')
                    .update({ status: 'complete', contemplated_at: new Date().toISOString() })
                    .eq('id', groupId);

                  console.log('🎉 Grupo completado:', groupId);
                }
              }
            }

            // Processar comissões MLM se houver referrer
            if (referrerId) {
              console.log('💰 Processando comissões MLM...');
              
              try {
                // Calcular comissões (percentuais estilo iFood)
                const totalAmount = recordToUpdate.amount || recordToUpdate.valor;
                const platformAmount = Math.round(totalAmount * 0.50); // 50% plataforma
                const professionalAmount = Math.round(totalAmount * 0.30); // 30% profissional
                const referrerAmount = Math.round(totalAmount * 0.20); // 20% referrer

                // Buscar user_id do referrer
                const { data: referrerProfile } = await supabaseClient
                  .from('profiles')
                  .select('user_id')
                  .eq('id', referrerId)
                  .single();

                if (referrerProfile) {
                  // Creditar referrer
                    const { error: creditError } = await supabaseClient
                      .from('credit_transactions')
                      .insert({
                        user_id: referrerProfile.user_id,
                        type: 'referral_commission',
                        amount: referrerAmount,
                        description: `Comissão de referência: ${recordToUpdate.plan_name || 'Plano'} (20%)`,
                        source_type: 'payment',
                        commission_rate: 20,
                        reference_id: recordToUpdate.id
                      });

                  if (!creditError) {
                    // Atualizar saldo do referrer
                    await supabaseClient
                      .from('user_credits')
                      .update({
                        total_credits: supabaseClient.rpc('increment', referrerAmount),
                        available_credits: supabaseClient.rpc('increment', referrerAmount),
                        updated_at: new Date().toISOString()
                      })
                      .eq('user_id', referrerProfile.user_id);

                    // Notificar referrer
                      await supabaseClient
                        .from('notification_triggers')
                        .insert({
                          user_id: referrerProfile.user_id,
                          event_type: 'commission_earned',
                          title: 'Comissão Recebida!',
                          message: `Você recebeu R$ ${referrerAmount} de comissão pela indicação de ${recordToUpdate.plan_name || 'um plano'}`,
                          data: {
                            payment_id: recordToUpdate.id,
                            amount: referrerAmount,
                            plan_name: recordToUpdate.plan_name,
                            commission_rate: 20
                          }
                        });

                    console.log('✅ Comissão do referrer processada:', referrerAmount);
                  }
                }

                // Registrar split de pagamento
                await supabaseClient
                  .from('payment_splits')
                  .insert({
                    payment_id: recordToUpdate.id,
                    service_id: recordToUpdate.plan_id,
                    professional_id: null, // Será definido quando necessário
                    referrer_id: referrerId,
                    total_amount: totalAmount,
                    professional_amount: professionalAmount,
                    platform_amount: platformAmount,
                    referrer_amount: referrerAmount,
                    status: 'processed'
                  });

                console.log('✅ Payment split registrado');

              } catch (commissionError) {
                console.error('❌ Erro ao processar comissões:', commissionError);
                // Não falhar o webhook por erro de comissão
              }
            }

            // Criar notificação para o usuário
            await supabaseClient
              .from('notification_triggers')
              .insert({
                user_id: recordToUpdate.user_id || recordToUpdate.usuario_id,
                event_type: 'payment_confirmed',
                title: 'Pagamento Confirmado!',
                message: `Seu pagamento de R$ ${recordToUpdate.amount || recordToUpdate.valor} foi confirmado e você foi adicionado ao grupo.`,
                data: {
                  payment_id: recordToUpdate.id,
                  group_id: groupId,
                  amount: recordToUpdate.amount || recordToUpdate.valor,
                  plan_name: recordToUpdate.plan_name || 'Plano'
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