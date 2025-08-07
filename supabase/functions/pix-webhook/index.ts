import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PIX-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const webhookData = await req.json();
    logStep("Webhook data", webhookData);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Extract payment information from webhook
    const { event, payment } = webhookData;
    
    if (!payment || !payment.id) {
      logStep("Invalid webhook data - no payment ID");
      return new Response("Invalid webhook data", { status: 400 });
    }

    // Find payment record using Asaas payment ID
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("stripe_session_id", payment.id) // Usando campo stripe_session_id para ID do Asaas
      .single();

    if (paymentError || !paymentRecord) {
      logStep("Payment not found in database", { asaasId: payment.id, error: paymentError });
      return new Response("Payment not found", { status: 404 });
    }

    logStep("Payment found", { paymentId: paymentRecord.id, currentStatus: paymentRecord.status });

    // Process payment confirmation
    if (event === "PAYMENT_RECEIVED" && payment.status === "RECEIVED") {
      logStep("Processing payment confirmation");

      // Update payment status
      const { error: updateError } = await supabaseClient
        .from("payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentRecord.id);

      if (updateError) {
        logStep("Error updating payment status", updateError);
        throw new Error("Erro ao atualizar status do pagamento");
      }

      // Get plan details if available
      let planData = null;
      if (paymentRecord.plan_id) {
        const { data: plan, error: planError } = await supabaseClient
          .from("custom_plans")
          .select("*")
          .eq("id", paymentRecord.plan_id)
          .single();
        
        if (!planError && plan) {
          planData = plan;
        }
      }

      // Add user to MLM network if not already exists
      const { data: existingNetwork, error: networkError } = await supabaseClient
        .from("mlm_network")
        .select("*")
        .eq("user_id", paymentRecord.user_id)
        .single();

      if (networkError && networkError.code === "PGRST116") {
        // User not in network, add them
        const { error: insertNetworkError } = await supabaseClient
          .from("mlm_network")
          .insert({
            user_id: paymentRecord.user_id,
            referred_by_user_id: null, // Will be updated if referral exists
            status: "active",
          });

        if (insertNetworkError) {
          logStep("Error adding user to MLM network", insertNetworkError);
        } else {
          logStep("User added to MLM network");
        }
      }

      // Process referral commission if exists
      if (paymentRecord.influencer_code) {
        logStep("Processing referral commission", { influencerCode: paymentRecord.influencer_code });

        // Find referrer
        const { data: referrer, error: referrerError } = await supabaseClient
          .from("mlm_network")
          .select("user_id")
          .eq("referral_code", paymentRecord.influencer_code)
          .single();

        if (!referrerError && referrer) {
          // Update referred user's network record
          await supabaseClient
            .from("mlm_network")
            .update({
              referred_by_user_id: referrer.user_id,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", paymentRecord.user_id);

          // Update or create referral record
          const { error: referralError } = await supabaseClient
            .from("mlm_referrals")
            .upsert({
              referrer_id: referrer.user_id,
              referred_id: paymentRecord.user_id,
              referral_code_used: paymentRecord.influencer_code,
              commission_earned: paymentRecord.amount * 0.1, // 10% commission
              status: "confirmed",
              confirmed_at: new Date().toISOString(),
            }, {
              onConflict: "referrer_id,referred_id"
            });

          if (referralError) {
            logStep("Error updating referral", referralError);
          } else {
            logStep("Referral commission processed");
          }

          // Create commission record
          await supabaseClient
            .from("mlm_commissions")
            .insert({
              user_id: referrer.user_id,
              source_user_id: paymentRecord.user_id,
              level: 1,
              amount: paymentRecord.amount * 0.1,
              percentage: 10.0,
              type: "referral",
              status: "pending",
            });

          // Update referrer's network stats
          await supabaseClient
            .from("mlm_network")
            .update({
              total_referrals: supabaseClient.rpc("increment", { x: 1 }),
              active_referrals: supabaseClient.rpc("increment", { x: 1 }),
              total_earnings: supabaseClient.rpc("increment", { x: paymentRecord.amount * 0.1 }),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", referrer.user_id);

          logStep("Referrer stats updated");
        }
      }

      // Add user to plan group if plan exists
      if (paymentRecord.plan_id && planData) {
        logStep("Adding user to plan", { planId: paymentRecord.plan_id });

        // Find or create a plan group that's not full
        let { data: availableGroup } = await supabaseClient
          .from("plan_groups")
          .select("*")
          .eq("plan_id", paymentRecord.plan_id)
          .eq("status", "forming")
          .lt("current_participants", planData.max_participants || 9)
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (!availableGroup) {
          // Create new group
          const { data: newGroup, error: groupError } = await supabaseClient
            .from("plan_groups")
            .insert({
              plan_id: paymentRecord.plan_id,
              status: "forming",
              current_participants: 0,
              group_number: 1, // You might want to calculate this based on existing groups
            })
            .select()
            .single();

          if (groupError) {
            logStep("Error creating new group", groupError);
          } else {
            availableGroup = newGroup;
            logStep("New group created", { groupId: availableGroup.id });
          }
        }

        if (availableGroup) {
          // Add user to group
          const { error: participantError } = await supabaseClient
            .from("plan_participants")
            .upsert({
              plan_id: paymentRecord.plan_id,
              group_id: availableGroup.id,
              user_id: paymentRecord.user_id,
              payment_status: "paid",
              contemplation_status: "waiting",
              joined_at: new Date().toISOString(),
            }, {
              onConflict: "plan_id,user_id"
            });

          if (participantError) {
            logStep("Error adding user to plan", participantError);
          } else {
            // Update group participant count
            await supabaseClient
              .from("plan_groups")
              .update({
                current_participants: supabaseClient.rpc("increment", { x: 1 }),
                updated_at: new Date().toISOString(),
              })
              .eq("id", availableGroup.id);

            logStep("User added to plan group", { groupId: availableGroup.id });
          }
        }
      }

      // Log activity
      await supabaseClient
        .from("activity_logs")
        .insert({
          user_id: paymentRecord.user_id,
          action: "payment_confirmed_pix",
          resource_type: "payment",
          resource_id: paymentRecord.id,
          details: {
            amount: paymentRecord.amount,
            payment_method: "pix",
            asaas_payment_id: payment.id,
            plan_id: paymentRecord.plan_id,
          },
        });

      logStep("Payment confirmation completed successfully");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in pix-webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});