import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SECURE-PIX-WEBHOOK] ${step}${detailsStr}`);
};

// SECURITY: Verify webhook signature from Asaas
const verifyWebhookSignature = async (
  rawBody: string,
  signature: string | null,
  secret: string
): Promise<boolean> => {
  if (!signature || !secret) {
    logStep("Missing signature or secret");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody)
    );

    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const receivedHex = signature.replace('sha256=', '');
    
    logStep("Signature verification", { 
      expected: expectedHex.substring(0, 10) + "...", 
      received: receivedHex.substring(0, 10) + "..." 
    });

    return expectedHex === receivedHex;
  } catch (error) {
    logStep("Signature verification error", error);
    return false;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Secure webhook received");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // SECURITY: Rate limiting check
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    
    // Check rate limit: max 10 webhook requests per minute per IP
    const rateLimitCheck = await supabaseClient.rpc('check_rate_limit', {
      identifier: clientIp,
      action_type: 'webhook_request',
      max_requests: 10,
      window_minutes: 1
    });

    if (!rateLimitCheck.data) {
      logStep("SECURITY: Rate limit exceeded", { ip: clientIp });
      
      await supabaseClient.from("security_events").insert({
        event_type: "webhook_rate_limit_exceeded",
        ip_address: clientIp,
        user_agent: userAgent,
        details: {
          endpoint: "secure-pix-webhook",
          timestamp: new Date().toISOString()
        }
      });

      return new Response("Rate limit exceeded", { status: 429 });
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // SECURITY: Validate JSON format
    let webhookData;
    try {
      webhookData = JSON.parse(rawBody);
    } catch (parseError) {
      logStep("SECURITY: Invalid JSON in webhook", parseError);
      
      await supabaseClient.from("security_events").insert({
        event_type: "webhook_invalid_json",
        ip_address: clientIp,
        user_agent: userAgent,
        details: {
          error: parseError.message,
          body_length: rawBody.length
        }
      });

      return new Response("Invalid JSON", { status: 400 });
    }
    
    logStep("Webhook data received", { event: webhookData.event, paymentId: webhookData.payment?.id });

    // SECURITY: Verify webhook signature
    const asaasWebhookSecret = Deno.env.get("ASAAS_WEBHOOK_SECRET");
    const signature = req.headers.get("asaas-signature");
    
    const isValidSignature = await verifyWebhookSignature(
      rawBody,
      signature,
      asaasWebhookSecret || ""
    );

    if (!isValidSignature) {
      logStep("SECURITY: Invalid webhook signature");
      
      // Log security event
      await supabaseClient.from("security_events").insert({
        event_type: "invalid_webhook_signature",
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
        user_agent: req.headers.get("user-agent"),
        details: {
          webhook_event: webhookData.event,
          payment_id: webhookData.payment?.id,
          signature_provided: !!signature,
          timestamp: new Date().toISOString()
        }
      });

      return new Response("Unauthorized", { status: 401 });
    }

    logStep("Webhook signature verified successfully");

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
      .eq("stripe_session_id", payment.id) // Using stripe_session_id field for Asaas ID
      .single();

    if (paymentError || !paymentRecord) {
      logStep("Payment not found in database", { asaasId: payment.id, error: paymentError });
      return new Response("Payment not found", { status: 404 });
    }

    logStep("Payment found", { paymentId: paymentRecord.id, currentStatus: paymentRecord.status });

    // SECURITY: Validate payment amount
    const amountValid = await supabaseClient.rpc('validate_payment_amount', {
      payment_id: paymentRecord.id,
      received_amount: payment.value || payment.amount || 0
    });

    if (!amountValid.data) {
      logStep("SECURITY: Payment amount mismatch", {
        expected: paymentRecord.amount,
        received: payment.value || payment.amount
      });

      // Log security event
      await supabaseClient.from("security_events").insert({
        event_type: "payment_amount_mismatch",
        user_id: paymentRecord.user_id,
        details: {
          payment_id: paymentRecord.id,
          expected_amount: paymentRecord.amount,
          received_amount: payment.value || payment.amount,
          asaas_payment_id: payment.id
        }
      });

      return new Response("Payment amount mismatch", { status: 400 });
    }

    // Create payment validation record
    await supabaseClient.from("payment_validations").insert({
      payment_id: paymentRecord.id,
      asaas_payment_id: payment.id,
      webhook_signature: signature,
      amount_verified: true,
      signature_verified: true
    });

    // Process payment confirmation
    if (event === "PAYMENT_RECEIVED" && payment.status === "RECEIVED") {
      logStep("Processing secure payment confirmation");

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

      // ... rest of payment processing logic (same as before but secure)
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
            referred_by_user_id: null,
            status: "active",
          });

        if (insertNetworkError) {
          logStep("Error adding user to MLM network", insertNetworkError);
        } else {
          logStep("User added to MLM network");
        }
      }

      // Process referral commission with validation
      if (paymentRecord.influencer_code) {
        logStep("Processing referral commission", { influencerCode: paymentRecord.influencer_code });

        // Find referrer with rate limiting check
        const { data: referrer, error: referrerError } = await supabaseClient
          .from("mlm_network")
          .select("user_id, total_referrals")
          .eq("referral_code", paymentRecord.influencer_code)
          .single();

        if (!referrerError && referrer) {
          // SECURITY: Validate referral limits (prevent abuse)
          if (referrer.total_referrals > 1000) {
            logStep("SECURITY: Referral limit exceeded", { referrerId: referrer.user_id });
            
            await supabaseClient.from("security_events").insert({
              event_type: "referral_limit_exceeded",
              user_id: referrer.user_id,
              details: { total_referrals: referrer.total_referrals }
            });
          } else {
            // Process referral normally
            const commissionAmount = paymentRecord.amount * 0.1; // 10% commission

            // Update referred user's network record
            await supabaseClient
              .from("mlm_network")
              .update({
                referred_by_user_id: referrer.user_id,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", paymentRecord.user_id);

            // Create referral record
            await supabaseClient
              .from("mlm_referrals")
              .upsert({
                referrer_id: referrer.user_id,
                referred_id: paymentRecord.user_id,
                referral_code_used: paymentRecord.influencer_code,
                commission_earned: commissionAmount,
                status: "confirmed",
                confirmed_at: new Date().toISOString(),
              }, {
                onConflict: "referrer_id,referred_id"
              });

            // Create commission record
            await supabaseClient
              .from("mlm_commissions")
              .insert({
                user_id: referrer.user_id,
                source_user_id: paymentRecord.user_id,
                level: 1,
                amount: commissionAmount,
                percentage: 10.0,
                type: "referral",
                status: "pending",
              });

            logStep("Secure referral commission processed");
          }
        }
      }

      // Log successful payment processing
      await supabaseClient.from("security_events").insert({
        event_type: "payment_processed_successfully",
        user_id: paymentRecord.user_id,
        details: {
          payment_id: paymentRecord.id,
          amount: paymentRecord.amount,
          asaas_payment_id: payment.id,
          plan_id: paymentRecord.plan_id
        }
      });

      logStep("Secure payment confirmation completed successfully");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in secure-pix-webhook", { message: errorMessage });
    
    // Log error as security event
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseClient.from("security_events").insert({
      event_type: "webhook_processing_error",
      details: { error: errorMessage, timestamp: new Date().toISOString() }
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});