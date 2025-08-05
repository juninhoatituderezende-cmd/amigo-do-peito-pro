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
    const { plan_id, user_id, influencer_code, payment_method = "credit_card" } = await req.json();

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

    // Get user details
    const { data: user, error: userError } = await supabaseClient.auth.admin.getUserById(user_id);
    if (userError) throw new Error("Usuário não encontrado");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    let result;

    if (payment_method === "pix") {
      // Generate PIX payment
      const pixCode = generatePixCode(plan.entry_value, user.user.email, plan.title);
      
      // Create payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from("payments")
        .insert({
          user_id,
          plan_id,
          amount: plan.entry_value,
          currency: "BRL",
          payment_method: "pix",
          status: "pending",
          pix_code: pixCode,
          influencer_code: influencer_code || null,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      result = {
        payment_type: "pix",
        pix_code: pixCode,
        payment_id: payment.id,
        amount: plan.entry_value,
        qr_code: generatePixQRCode(pixCode),
      };

    } else {
      // Stripe credit card payment
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
          metadata: { user_id, plan_id }
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
          plan_id,
          user_id,
          influencer_code: influencer_code || "",
        },
      });

      // Create payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from("payments")
        .insert({
          user_id,
          plan_id,
          amount: plan.entry_value,
          currency: "BRL",
          payment_method: "credit_card",
          status: "pending",
          stripe_session_id: session.id,
          influencer_code: influencer_code || null,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      result = {
        payment_type: "stripe",
        checkout_url: session.url,
        session_id: session.id,
        payment_id: payment.id,
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment processing error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generatePixCode(amount: number, email: string, description: string): string {
  const pixKey = Deno.env.get("PIX_KEY") || "seu-pix@exemplo.com";
  const merchantCity = "São Paulo";
  const merchantName = "MLM System";
  
  // Simplified PIX code generation (in production, use proper PIX library)
  const timestamp = Date.now().toString();
  return `00020126360014BR.GOV.BCB.PIX01${pixKey.length.toString().padStart(2, '0')}${pixKey}520400005303986540${amount.toFixed(2)}5802BR5913${merchantName}6009${merchantCity}62070503***6304${timestamp.slice(-4)}`;
}

function generatePixQRCode(pixCode: string): string {
  // In production, use proper QR code generation service
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`;
}