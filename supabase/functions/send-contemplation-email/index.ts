import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_email, user_name, status, voucher_code, service_type } = await req.json();

    // Email templates based on status
    const getEmailContent = (status: string, userName: string, voucherCode: string, serviceType: string) => {
      const baseUrl = req.headers.get("origin") || "https://your-app.com";
      
      if (status === 'confirmed') {
        return {
          subject: "🎉 Contemplação Confirmada - Seu Voucher está Pronto!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #16a34a; margin-bottom: 10px;">🎉 Parabéns ${userName}!</h1>
                <h2 style="color: #333; font-weight: normal;">Sua contemplação foi confirmada!</h2>
              </div>
              
              <div style="background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; font-size: 24px;">Seu Voucher Digital</h3>
                <div style="background: white; color: #333; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px;">
                  ${voucherCode}
                </div>
                <p style="margin: 15px 0 0 0; opacity: 0.9;">Código do Voucher</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
                <h3 style="color: #333; margin-top: 0;">📋 Detalhes da Contemplação</h3>
                <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                  <li><strong>Serviço:</strong> ${serviceType}</li>
                  <li><strong>Status:</strong> Confirmado ✅</li>
                  <li><strong>Código do Voucher:</strong> ${voucherCode}</li>
                  <li><strong>Data de Confirmação:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
                </ul>
              </div>
              
              <div style="background: #e7f3ff; border-left: 4px solid #0ea5e9; padding: 20px; margin-bottom: 25px;">
                <h3 style="color: #0369a1; margin-top: 0;">📞 Próximos Passos</h3>
                <p style="color: #0369a1; margin-bottom: 15px;">Para agendar seu serviço:</p>
                <ol style="color: #0369a1; line-height: 1.6; padding-left: 20px;">
                  <li>Entre em contato com o profissional escolhido</li>
                  <li>Apresente este voucher (código: <strong>${voucherCode}</strong>)</li>
                  <li>Agende seu atendimento conforme disponibilidade</li>
                  <li>Aproveite seu serviço contemplado!</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; margin-bottom: 15px;">Acesse sua conta para mais detalhes:</p>
                <a href="${baseUrl}/usuario/dashboard" style="display: inline-block; background: #16a34a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Dashboard</a>
              </div>
              
              <div style="text-align: center; margin-top: 25px; color: #888; font-size: 14px;">
                <p>Obrigado por fazer parte do Amigo do Peito! 💚</p>
                <p>Em caso de dúvidas, entre em contato conosco.</p>
              </div>
            </div>
          `
        };
      } else if (status === 'revoked') {
        return {
          subject: "⚠️ Contemplação Revogada - Informações Importantes",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #dc2626; margin-bottom: 10px;">⚠️ Contemplação Revogada</h1>
                <h2 style="color: #333; font-weight: normal;">Olá ${userName},</h2>
              </div>
              
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                <h3 style="color: #dc2626; margin-top: 0;">📋 Informações da Revogação</h3>
                <ul style="color: #991b1b; line-height: 1.8; padding-left: 20px;">
                  <li><strong>Código do Voucher:</strong> ${voucherCode}</li>
                  <li><strong>Serviço:</strong> ${serviceType}</li>
                  <li><strong>Data da Revogação:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
                  <li><strong>Status:</strong> Revogado</li>
                </ul>
              </div>
              
              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin-bottom: 25px;">
                <h3 style="color: #0369a1; margin-top: 0;">💡 O que isso significa?</h3>
                <p style="color: #0369a1; line-height: 1.6;">
                  Sua contemplação foi revista e temporariamente revogada. Isso pode acontecer por diversos motivos, 
                  como verificação de dados ou revisão do processo de indicações.
                </p>
              </div>
              
              <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                <h3 style="color: #333; margin-top: 0;">📞 Próximos Passos</h3>
                <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                  Para esclarecer esta situação:
                </p>
                <ol style="color: #666; line-height: 1.6; padding-left: 20px;">
                  <li>Entre em contato com nossa equipe de suporte</li>
                  <li>Tenha em mãos o código do voucher: <strong>${voucherCode}</strong></li>
                  <li>Aguarde a reavaliação do seu caso</li>
                  <li>Acompanhe as atualizações no seu dashboard</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; margin-bottom: 15px;">Acesse sua conta para acompanhar o status:</p>
                <a href="${baseUrl}/usuario/dashboard" style="display: inline-block; background: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Dashboard</a>
              </div>
              
              <div style="text-align: center; margin-top: 25px; color: #888; font-size: 14px;">
                <p>Estamos aqui para ajudar! Entre em contato se tiver dúvidas.</p>
              </div>
            </div>
          `
        };
      } else {
        return {
          subject: "⏳ Contemplação Pendente - Aguardando Validação",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #eab308; margin-bottom: 10px;">⏳ Contemplação Pendente</h1>
                <h2 style="color: #333; font-weight: normal;">Olá ${userName},</h2>
              </div>
              
              <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                <h3 style="color: #d97706; margin-top: 0;">📋 Status da Contemplação</h3>
                <ul style="color: #92400e; line-height: 1.8; padding-left: 20px;">
                  <li><strong>Código do Voucher:</strong> ${voucherCode}</li>
                  <li><strong>Serviço:</strong> ${serviceType}</li>
                  <li><strong>Status:</strong> Aguardando Validação</li>
                  <li><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
                </ul>
              </div>
              
              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin-bottom: 25px;">
                <h3 style="color: #0369a1; margin-top: 0;">💡 O que acontece agora?</h3>
                <p style="color: #0369a1; line-height: 1.6;">
                  Sua contemplação está sendo validada pela nossa equipe. Este processo pode levar até 48 horas úteis. 
                  Você receberá um novo email assim que a validação for concluída.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; margin-bottom: 15px;">Acompanhe o status no seu dashboard:</p>
                <a href="${baseUrl}/usuario/dashboard" style="display: inline-block; background: #eab308; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Dashboard</a>
              </div>
              
              <div style="text-align: center; margin-top: 25px; color: #888; font-size: 14px;">
                <p>Obrigado pela paciência! 🙏</p>
              </div>
            </div>
          `
        };
      }
    };

    const emailContent = getEmailContent(status, user_name, voucher_code, service_type);

    // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll simulate the email sending
    console.log(`Sending email to ${user_email}:`, emailContent.subject);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email sent to ${user_email}`,
        subject: emailContent.subject
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending contemplation email:', error);
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