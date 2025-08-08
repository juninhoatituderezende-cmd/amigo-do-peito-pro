import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseRequest {
  product_code: string;
  referral_code?: string; // código de indicação (opcional)
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MLM-PURCHASE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Iniciando processo de compra MLM");

    // Parse request body
    const { product_code, referral_code } = await req.json() as PurchaseRequest;
    logStep("Request recebido", { product_code, referral_code });

    // Initialize clients
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header required");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("Usuário autenticado", { userId: user.id, email: user.email });

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("product_code", product_code)
      .eq("active", true)
      .single();

    if (productError || !product) {
      throw new Error(`Produto não encontrado: ${product_code}`);
    }
    logStep("Produto encontrado", product);

    // Check if user already has an active group for this product
    const { data: existingGroup, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("buyer_id", user.id)
      .eq("product_id", product.id)
      .eq("status", "open")
      .single();

    if (existingGroup) {
      throw new Error("Você já possui um grupo ativo para este produto");
    }

    let groupToJoin = null;
    let isGroupCreator = false;

    // Se tem código de indicação, tentar entrar em grupo existente
    if (referral_code) {
      logStep("Verificando código de indicação", { referral_code });
      
      const { data: existingGroupByCode, error: codeError } = await supabase
        .from("groups")
        .select("*, products(*)")
        .eq("referral_code", referral_code)
        .eq("status", "open")
        .eq("product_id", product.id)
        .single();

      if (existingGroupByCode && existingGroupByCode.current_count < 10) {
        groupToJoin = existingGroupByCode;
        logStep("Grupo encontrado para entrada", { 
          groupId: groupToJoin.id, 
          currentCount: groupToJoin.current_count 
        });
      } else {
        logStep("Código de indicação inválido ou grupo cheio");
      }
    }

    // Se não tem grupo para entrar, criar novo grupo
    if (!groupToJoin) {
      isGroupCreator = true;
      
      // Generate unique referral code
      let newReferralCode;
      let codeExists = true;
      
      while (codeExists) {
        newReferralCode = await generateReferralCode();
        const { data: existingCode } = await supabase
          .from("groups")
          .select("id")
          .eq("referral_code", newReferralCode)
          .single();
        
        codeExists = !!existingCode;
      }

      logStep("Criando novo grupo", { referralCode: newReferralCode });

      const { data: newGroup, error: newGroupError } = await supabase
        .from("groups")
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          referral_code: newReferralCode,
          current_count: 1
        })
        .select()
        .single();

      if (newGroupError) throw newGroupError;
      groupToJoin = newGroup;
      logStep("Novo grupo criado", { groupId: newGroup.id });
    }

    // Create Stripe checkout session
    logStep("Criando sessão Stripe", { 
      productName: product.name, 
      entryValue: product.entry_value 
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price: product.stripe_price_id,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/mlm/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/mlm/cancel`,
      metadata: {
        user_id: user.id,
        product_id: product.id,
        group_id: groupToJoin.id,
        referral_code: referral_code || "",
        is_group_creator: isGroupCreator.toString()
      }
    });

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("user_purchases")
      .insert({
        user_id: user.id,
        product_id: product.id,
        group_id: groupToJoin.id,
        stripe_session_id: session.id,
        amount_paid: product.entry_value,
        status: 'pending'
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;
    logStep("Registro de compra criado", { purchaseId: purchase.id });

    // Se está entrando em grupo existente, criar referral record
    if (referral_code && !isGroupCreator) {
      const { error: referralError } = await supabase
        .from("referrals")
        .insert({
          referrer_id: groupToJoin.buyer_id,
          referred_id: user.id,
          group_id: groupToJoin.id,
          referral_code: referral_code,
          status: 'pending'
        });

      if (referralError) logStep("Erro ao criar referral", referralError);
      
      // Criar comissão de influenciador com cálculo correto
      logStep("Criando comissão de influenciador");
      try {
        await supabase.rpc('create_influencer_commission', {
          p_influencer_id: groupToJoin.buyer_id,
          p_client_id: user.id,
          p_product_id: product.id,
          p_referral_code: referral_code,
          p_product_total_value: product.total_price
        });
        logStep("Comissão criada com sucesso");
      } catch (commissionError) {
        logStep("Erro ao criar comissão", commissionError);
      }
    }

    logStep("Processo concluído com sucesso", { 
      sessionUrl: session.url,
      groupId: groupToJoin.id
    });

    return new Response(JSON.stringify({
      success: true,
      checkout_url: session.url,
      group_id: groupToJoin.id,
      is_group_creator: isGroupCreator
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    logStep("ERRO", { message: errorMessage });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function generateReferralCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}