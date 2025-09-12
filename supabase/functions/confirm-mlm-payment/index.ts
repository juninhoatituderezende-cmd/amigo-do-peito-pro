import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-MLM-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Iniciando confirmação de pagamento MLM");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id é obrigatório");

    logStep("Session ID recebido", { session_id });

    // Initialize clients
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get Stripe session details
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Stripe session recuperada", { 
      status: session.payment_status,
      metadata: session.metadata 
    });

    if (session.payment_status !== 'paid') {
      throw new Error("Pagamento não foi confirmado");
    }

    const { 
      user_id, 
      product_id, 
      group_id, 
      referral_code,
      is_group_creator 
    } = session.metadata || {};

    if (!user_id || !product_id || !group_id) {
      throw new Error("Metadados incompletos na sessão do Stripe");
    }

    logStep("Processando confirmação", {
      user_id,
      product_id,
      group_id,
      is_group_creator: is_group_creator === 'true'
    });

    // Update purchase status
    const { error: purchaseUpdateError } = await supabase
      .from("user_purchases")
      .update({
        status: 'completed',
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString()
      })
      .eq("stripe_session_id", session_id);

    if (purchaseUpdateError) {
      logStep("Erro ao atualizar purchase", purchaseUpdateError);
      throw purchaseUpdateError;
    }

    // Get current group details
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", group_id)
      .single();

    if (groupError || !group) {
      throw new Error("Grupo não encontrado");
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", group_id)
      .eq("user_id", user_id)
      .single();

    if (existingMember) {
      logStep("Usuário já é membro do grupo", { existingMember });
      return new Response(JSON.stringify({
        success: true,
        message: "Usuário já é membro do grupo",
        group_id: group_id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Add user to group
    const position = group.current_count;
    const isCreator = is_group_creator === 'true';
    
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: group_id,
        user_id: user_id,
        referred_by: isCreator ? null : group.buyer_id,
        position: position,
        payment_id: session.payment_intent
      });

    if (memberError) {
      logStep("Erro ao adicionar membro", memberError);
      throw memberError;
    }

    logStep("Membro adicionado ao grupo", { 
      user_id, 
      group_id, 
      position 
    });

    // If there was a referral, confirm it and update commission
    if (referral_code && !isCreator) {
      const { error: referralUpdateError } = await supabase
        .from("referrals")
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq("referral_code", referral_code)
        .eq("referred_id", user_id)
        .eq("group_id", group_id);

      if (referralUpdateError) {
        logStep("Erro ao confirmar referral", referralUpdateError);
      } else {
        logStep("Referral confirmado", { referral_code });
        
        // Confirmar comissão do influenciador
        const { error: commissionUpdateError } = await supabase
          .from("influencer_commissions")
          .update({ status: 'confirmed' })
          .eq("referral_code", referral_code)
        // Record influencer conversion and credit transaction
        try {
          await supabase.rpc('record_influencer_conversion', {
            p_referral_code: referral_code,
            p_client_id: user.id,
            p_payment_id: purchase.id,
            p_entry_value: purchase.amount_paid,
            p_product_total_value: null
          });
        } catch (e) {
          console.log('record_influencer_conversion failed', e);
        }

          .eq("client_id", user_id);
          
        if (commissionUpdateError) {
          logStep("Erro ao confirmar comissão", commissionUpdateError);
        } else {
          logStep("Comissão confirmada");
        }
      }
    }

    // Check if group is now complete (this will be handled by database triggers)
    const { data: updatedGroup } = await supabase
      .from("groups")
      .select("current_count, status")
      .eq("id", group_id)
      .single();

    logStep("Status final do grupo", updatedGroup);

    return new Response(JSON.stringify({
      success: true,
      message: "Pagamento confirmado e usuário adicionado ao grupo",
      group_id: group_id,
      group_status: updatedGroup?.status,
      current_count: updatedGroup?.current_count
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