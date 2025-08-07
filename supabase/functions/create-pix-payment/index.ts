import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PIX-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { plan_id, user_id, product_code, referral_code } = await req.json();
    logStep("Request data received", { plan_id, user_id, product_code, referral_code });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get plan or product details
    let amount = 40000; // R$ 400.00 padrão em centavos
    let description = "Plano MIN - Sistema MLM";
    
    if (plan_id) {
      const { data: plan, error: planError } = await supabaseClient
        .from("custom_plans")
        .select("*")
        .eq("id", plan_id)
        .single();
      
      if (!planError && plan) {
        amount = Math.round(plan.entry_price * 100);
        description = plan.name;
      }
    } else if (product_code) {
      const { data: service, error: serviceError } = await supabaseClient
        .from("services")
        .select("*")
        .eq("id", product_code.replace("SRV-", "").slice(0, -4))
        .single();
      
      if (!serviceError && service) {
        amount = Math.round(service.price * 0.1 * 100); // 10% de entrada
        description = service.name;
      }
    }

    logStep("Payment details calculated", { amount, description });

    // Create payment record first
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        user_id: user.id,
        plan_id: plan_id || null,
        amount: amount / 100,
        currency: "BRL",
        payment_method: "pix",
        status: "pending",
        influencer_code: referral_code || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      logStep("Error creating payment record", paymentError);
      throw new Error("Erro ao criar registro de pagamento");
    }

    logStep("Payment record created", { paymentId: payment.id });

    // Create PIX payment with Asaas API
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      throw new Error("ASAAS_API_KEY não configurada");
    }

    const asaasPayload = {
      customer: user.email,
      billingType: "PIX",
      value: amount / 100,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24h
      description: description,
      externalReference: payment.id,
      postalService: false,
    };

    logStep("Creating PIX with Asaas", asaasPayload);

    const asaasResponse = await fetch("https://www.asaas.com/api/v3/payments", {
      method: "POST",
      headers: {
        "access_token": asaasApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(asaasPayload),
    });

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text();
      logStep("Asaas API error", { status: asaasResponse.status, error: errorText });
      throw new Error(`Erro na API Asaas: ${asaasResponse.status} - ${errorText}`);
    }

    const asaasData = await asaasResponse.json();
    logStep("Asaas PIX created", asaasData);

    // Get PIX QR Code and copy-paste code
    const pixResponse = await fetch(`https://www.asaas.com/api/v3/payments/${asaasData.id}/pixQrCode`, {
      headers: {
        "access_token": asaasApiKey,
      },
    });

    let pixQrCode = null;
    let pixCopyPaste = null;

    if (pixResponse.ok) {
      const pixData = await pixResponse.json();
      pixQrCode = pixData.qrCode.encodedImage;
      pixCopyPaste = pixData.qrCode.payload;
      logStep("PIX QR Code retrieved", { hasQrCode: !!pixQrCode, hasCopyPaste: !!pixCopyPaste });
    }

    // Update payment record with Asaas data
    const { error: updateError } = await supabaseClient
      .from("payments")
      .update({
        pix_code: pixCopyPaste,
        stripe_session_id: asaasData.id, // Reutilizando campo para ID do Asaas
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      logStep("Error updating payment with PIX data", updateError);
    }

    // Process referral if exists
    if (referral_code) {
      logStep("Processing referral", { referral_code });
      
      const { data: referrer, error: referrerError } = await supabaseClient
        .from("mlm_network")
        .select("user_id")
        .eq("referral_code", referral_code)
        .single();

      if (!referrerError && referrer) {
        // Insert referral record
        await supabaseClient
          .from("mlm_referrals")
          .insert({
            referrer_id: referrer.user_id,
            referred_id: user.id,
            referral_code_used: referral_code,
            commission_earned: (amount / 100) * 0.1, // 10% commission
            status: "pending",
          });

        logStep("Referral processed", { referrerId: referrer.user_id });
      }
    }

    const result = {
      success: true,
      payment_id: payment.id,
      asaas_payment_id: asaasData.id,
      amount: amount / 100,
      pix_qr_code: pixQrCode ? `data:image/png;base64,${pixQrCode}` : null,
      pix_copy_paste: pixCopyPaste,
      status: asaasData.status,
      due_date: asaasData.dueDate,
    };

    logStep("Payment created successfully", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-pix-payment", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});