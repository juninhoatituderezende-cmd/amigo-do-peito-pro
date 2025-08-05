import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Buscar dados do profissional
    const { data: professional, error: professionalError } = await supabase
      .from("professionals")
      .select("*")
      .eq("id", user.id)
      .single();

    if (professionalError || !professional) {
      throw new Error("Profissional não encontrado");
    }

    // Verificar se já existe conta Stripe
    const { data: existingAccount } = await supabase
      .from("stripe_accounts")
      .select("*")
      .eq("professional_id", professional.id)
      .single();

    let stripeAccountId;

    if (existingAccount) {
      stripeAccountId = existingAccount.stripe_account_id;
    } else {
      // Criar nova conta Stripe Connect
      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        email: professional.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          mcc: "8999", // Serviços profissionais
          product_description: `Serviços profissionais - ${professional.category}`,
        },
        individual: {
          email: professional.email,
          first_name: professional.full_name.split(" ")[0],
          last_name: professional.full_name.split(" ").slice(1).join(" "),
          phone: professional.phone,
        },
      });

      stripeAccountId = account.id;

      // Salvar no banco
      await supabase
        .from("stripe_accounts")
        .insert({
          professional_id: professional.id,
          stripe_account_id: stripeAccountId,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        });
    }

    // Criar link de onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${req.headers.get("origin")}/pro/dashboard?refresh=stripe`,
      return_url: `${req.headers.get("origin")}/pro/dashboard?success=stripe`,
      type: "account_onboarding",
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        onboarding_url: accountLink.url,
        account_id: stripeAccountId 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro no onboarding Stripe:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});