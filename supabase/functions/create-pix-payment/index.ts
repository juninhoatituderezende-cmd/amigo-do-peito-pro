import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PIX-PAYMENT-SPLIT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { plan_id, user_id, product_code, service_id, referral_code, professional_id } = await req.json();
    logStep("Request data received", { plan_id, user_id, product_code, service_id, referral_code, professional_id });

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

    // Get payment details and calculate split
    let amount = 40000; // R$ 400.00 padrão em centavos
    let description = "Plano MIN - Sistema MLM";
    let productId = null;
    let serviceIdForSplit = null;
    let professionalForSplit = null;
    
    if (plan_id) {
      const { data: plan, error: planError } = await supabaseClient
        .from("custom_plans")
        .select("*")
        .eq("id", plan_id)
        .single();
      
      if (!planError && plan) {
        amount = Math.round(plan.entry_price * 100);
        description = plan.name;
        if (plan.professional_id) {
          professionalForSplit = plan.professional_id;
        }
      }
    } else if (product_code) {
      // Buscar produto no marketplace
      const { data: product, error: productError } = await supabaseClient
        .from("marketplace_products")
        .select("*")
        .eq("id", product_code)
        .single();
      
      if (!productError && product) {
        amount = Math.round(product.valor_total * (product.percentual_entrada / 100) * 100);
        description = product.name;
        productId = product.id;
        professionalForSplit = product.professional_id;
      }
    } else if (service_id) {
      const { data: service, error: serviceError } = await supabaseClient
        .from("services")
        .select("*")
        .eq("id", service_id)
        .single();
      
      if (!serviceError && service) {
        amount = Math.round(service.price * 0.1 * 100); // 10% de entrada
        description = service.name;
        serviceIdForSplit = service.id;
        professionalForSplit = service.professional_id;
      }
    }

    // Se professional_id foi fornecido diretamente, usar ele
    if (professional_id) {
      professionalForSplit = professional_id;
    }

    logStep("Payment details calculated", { amount, description, professionalForSplit, productId, serviceIdForSplit });

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

    // Get split rules and subaccount info
    let splitInfo = null;
    let receiverAccountId = null;
    
    if (professionalForSplit) {
      // Buscar regras de split
      const { data: splitRules } = await supabaseClient
        .rpc("get_split_rules", { 
          p_product_id: productId, 
          p_service_id: serviceIdForSplit 
        });
      
      if (splitRules && splitRules.length > 0) {
        const rules = splitRules[0];
        
        // Buscar subconta do profissional
        const { data: subaccount } = await supabaseClient
          .from("asaas_subaccounts")
          .select("asaas_account_id, status, verification_status")
          .eq("professional_id", professionalForSplit)
          .eq("status", "active")
          .eq("verification_status", "approved")
          .single();
        
        if (subaccount) {
          receiverAccountId = subaccount.asaas_account_id;
          
          // Calcular valores do split
          const totalAmountInReais = amount / 100;
          const professionalAmount = Math.round(totalAmountInReais * (rules.professional_percentage / 100) * 100) / 100;
          const platformAmount = Math.round(totalAmountInReais * (rules.platform_percentage / 100) * 100) / 100;
          const influencerAmount = referral_code ? Math.round(totalAmountInReais * (rules.influencer_percentage / 100) * 100) / 100 : 0;
          
          splitInfo = {
            professional_percentage: rules.professional_percentage,
            platform_percentage: rules.platform_percentage,
            influencer_percentage: rules.influencer_percentage,
            professional_amount: professionalAmount,
            platform_amount: platformAmount,
            influencer_amount: influencerAmount,
            receiver_account_id: receiverAccountId
          };
          
          logStep("Split calculated", splitInfo);
        } else {
          logStep("Professional subaccount not ready for split", { professionalForSplit });
        }
      }
    }

    // Create PIX payment with Asaas API (with split if applicable)
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      throw new Error("ASAAS_API_KEY não configurada");
    }

    const asaasPayload: any = {
      customer: user.email,
      billingType: "PIX",
      value: amount / 100,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24h
      description: description,
      externalReference: payment.id,
      postalService: false,
    };

    // Adicionar split se configurado
    if (splitInfo && receiverAccountId) {
      asaasPayload.split = [
        {
          walletId: receiverAccountId,
          fixedValue: splitInfo.professional_amount,
          percentualValue: null
        }
      ];
      logStep("Split configuration added to payment", asaasPayload.split);
    }

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

    // Criar registro de split se configurado
    if (splitInfo) {
      const { error: splitError } = await supabaseClient
        .from("payment_splits")
        .insert({
          payment_id: payment.id,
          asaas_payment_id: asaasData.id,
          professional_id: professionalForSplit,
          total_amount: amount / 100,
          professional_amount: splitInfo.professional_amount,
          platform_amount: splitInfo.platform_amount,
          influencer_amount: splitInfo.influencer_amount,
          split_executed: !!receiverAccountId
        });

      if (splitError) {
        logStep("Error creating split record", splitError);
      } else {
        logStep("Split record created successfully");
      }
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
      split_configured: !!splitInfo,
      split_details: splitInfo || null,
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