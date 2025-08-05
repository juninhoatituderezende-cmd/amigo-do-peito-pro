import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentNotificationData {
  recipientEmail: string;
  recipientName: string;
  recipientType: 'professional' | 'influencer';
  notificationType: 'pending' | 'approved' | 'paid';
  amount: number;
  clientName?: string;
  serviceType?: string;
  paymentId: string;
}

const getEmailTemplate = (data: PaymentNotificationData) => {
  const { recipientName, recipientType, notificationType, amount, clientName, serviceType } = data;
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const templates = {
    professional: {
      pending: {
        subject: "🔔 Novo Serviço Aguardando Validação",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Olá, ${recipientName}!</h2>
            <p>Você tem um novo serviço aguardando validação:</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>Cliente:</strong> ${clientName}<br>
              <strong>Serviço:</strong> ${serviceType}<br>
              <strong>Valor a receber:</strong> ${formatCurrency(amount)}
            </div>
            <p>Acesse seu painel para confirmar a realização do serviço e receber o pagamento.</p>
            <a href="${Deno.env.get('FRONTEND_URL')}/profissional" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acessar Painel
            </a>
          </div>
        `
      },
      approved: {
        subject: "✅ Pagamento Aprovado - Aguardando Transferência",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">Pagamento Aprovado!</h2>
            <p>Olá, ${recipientName}!</p>
            <p>Seu pagamento foi aprovado e será transferido em breve:</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <strong>Valor:</strong> ${formatCurrency(amount)}<br>
              <strong>Cliente:</strong> ${clientName}<br>
              <strong>Serviço:</strong> ${serviceType}
            </div>
            <p>O valor será creditado em sua conta em até 2 dias úteis.</p>
          </div>
        `
      },
      paid: {
        subject: "💰 Pagamento Realizado com Sucesso!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">Pagamento Realizado!</h2>
            <p>Olá, ${recipientName}!</p>
            <p>Seu pagamento foi processado com sucesso:</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <strong>Valor pago:</strong> ${formatCurrency(amount)}<br>
              <strong>Cliente:</strong> ${clientName}<br>
              <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
            </div>
            <p>O valor já foi creditado em sua conta. Obrigado por fazer parte da nossa rede!</p>
            <a href="${Deno.env.get('FRONTEND_URL')}/profissional" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Histórico
            </a>
          </div>
        `
      }
    },
    influencer: {
      pending: {
        subject: "🔔 Nova Comissão Gerada",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #7c3aed;">Nova Comissão Disponível!</h2>
            <p>Olá, ${recipientName}!</p>
            <p>Você ganhou uma nova comissão por indicação:</p>
            <div style="background: #faf5ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>Cliente indicado:</strong> ${clientName}<br>
              <strong>Comissão:</strong> ${formatCurrency(amount)} (25%)
            </div>
            <p>A comissão será processada e paga conforme nossos termos.</p>
            <a href="${Deno.env.get('FRONTEND_URL')}/influenciador" 
               style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acessar Dashboard
            </a>
          </div>
        `
      },
      approved: {
        subject: "✅ Comissão Aprovada para Pagamento",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">Comissão Aprovada!</h2>
            <p>Olá, ${recipientName}!</p>
            <p>Sua comissão foi aprovada para pagamento:</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <strong>Valor:</strong> ${formatCurrency(amount)}<br>
              <strong>Cliente:</strong> ${clientName}
            </div>
            <p>O pagamento será processado em até 7 dias úteis.</p>
          </div>
        `
      },
      paid: {
        subject: "💰 Comissão Paga com Sucesso!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">Comissão Paga!</h2>
            <p>Olá, ${recipientName}!</p>
            <p>Sua comissão foi paga com sucesso:</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <strong>Valor pago:</strong> ${formatCurrency(amount)}<br>
              <strong>Cliente:</strong> ${clientName}<br>
              <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
            </div>
            <p>Continue indicando e ganhe mais comissões!</p>
            <a href="${Deno.env.get('FRONTEND_URL')}/influenciador" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Comissões
            </a>
          </div>
        `
      }
    }
  };

  return templates[recipientType][notificationType];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const data: PaymentNotificationData = await req.json();

    console.log('Sending payment notification:', data);

    const emailTemplate = getEmailTemplate(data);

    // Registrar log da notificação
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert({
        payment_type: data.recipientType,
        recipient_id: data.paymentId,
        action: `email_${data.notificationType}`,
        amount: data.amount,
        details: {
          email: data.recipientEmail,
          template: `${data.recipientType}_${data.notificationType}`
        },
        admin_id: null
      });

    if (logError) {
      console.error('Error logging notification:', logError);
    }

    // Aqui você integraria com seu provedor de email (SendGrid, AWS SES, etc.)
    // Por agora, vamos simular o envio
    console.log(`Sending email to ${data.recipientEmail}:`, emailTemplate.subject);
    
    // Simular delay de envio de email
    await new Promise(resolve => setTimeout(resolve, 100));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email sent to ${data.recipientEmail}`,
        template: `${data.recipientType}_${data.notificationType}`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending payment notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});