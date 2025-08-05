import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  service_id: string;
  user_id: string;
  influencer_code?: string;
  amount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { service_id, user_id, influencer_code, amount }: PaymentRequest = await req.json();

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Inicializar Supabase com service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Buscar dados do serviço e profissional
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select(`
        *,
        professionals (*)
      `)
      .eq("id", service_id)
      .single();

    if (serviceError || !service) {
      throw new Error("Serviço não encontrado");
    }

    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      throw new Error("Usuário não encontrado");
    }

    // Buscar influenciador se código fornecido
    let influencer = null;
    if (influencer_code) {
      const { data: influencerData } = await supabase
        .from("influencers")
        .select("*")
        .eq("referral_code", influencer_code)
        .eq("approved", true)
        .single();
      
      influencer = influencerData;
    }

    // Calcular comissões com base nas regras definidas
    const amountTotal = amount * 100; // Converter para centavos
    const amountProfessional = Math.round(amountTotal * 0.50); // 50%
    const amountInfluencer = influencer ? Math.round(amountTotal * 0.25) : 0; // 25% se houver influenciador
    const amountPlatform = amountTotal - amountProfessional - amountInfluencer; // 25% ou 50%

    // Buscar conta Stripe do profissional
    const { data: stripeAccount, error: accountError } = await supabase
      .from("stripe_accounts")
      .select("*")
      .eq("professional_id", service.professional_id)
      .single();

    if (accountError || !stripeAccount || !stripeAccount.charges_enabled) {
      throw new Error("Profissional ainda não configurou conta de pagamento");
    }

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountTotal,
      currency: "brl",
      payment_method_types: ["card"],
      transfer_data: {
        destination: stripeAccount.stripe_account_id,
        amount: amountProfessional,
      },
      application_fee_amount: amountPlatform,
      metadata: {
        service_id,
        user_id,
        professional_id: service.professional_id,
        influencer_id: influencer?.id || "",
        influencer_code: influencer_code || "",
      },
    });

    // Registrar pagamento no banco
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id,
        professional_id: service.professional_id,
        service_id,
        influencer_id: influencer?.id || null,
        stripe_payment_intent_id: paymentIntent.id,
        amount_total: amount,
        amount_professional: amountProfessional / 100,
        amount_influencer: amountInfluencer / 100,
        amount_platform: amountPlatform / 100,
        status: "pending",
        metadata: {
          service_name: service.name,
          professional_name: service.professionals.full_name,
          user_name: user.full_name,
          influencer_name: influencer?.full_name || null,
        },
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Erro ao registrar pagamento: ${paymentError.message}`);
    }

    // Criar comissão para influenciador se houver
    if (influencer && amountInfluencer > 0) {
      await supabase
        .from("commissions")
        .insert({
          payment_id: payment.id,
          influencer_id: influencer.id,
          amount: amountInfluencer / 100,
          status: "pending",
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_id: payment.id,
        breakdown: {
          total: amount,
          professional: amountProfessional / 100,
          influencer: amountInfluencer / 100,
          platform: amountPlatform / 100,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});