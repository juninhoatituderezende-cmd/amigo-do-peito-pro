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
    const { plan_id, user_id, influencer_code } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from("custom_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError) throw new Error("Plano não encontrado");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get user details
    const { data: user, error: userError } = await supabaseClient.auth.admin.getUserById(user_id);
    if (userError) throw new Error("Usuário não encontrado");

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ 
      email: user.user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.user.email,
        metadata: {
          user_id: user_id,
          plan_id: plan_id
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: plan.title,
              description: plan.description,
            },
            unit_amount: Math.round(plan.entry_value * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/success?plan_id=${plan_id}`,
      cancel_url: `${req.headers.get("origin")}/cancel`,
      metadata: {
        plan_id: plan_id,
        user_id: user_id,
        influencer_code: influencer_code || "",
      },
    });

    return new Response(JSON.stringify({ 
      checkout_url: session.url,
      session_id: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});