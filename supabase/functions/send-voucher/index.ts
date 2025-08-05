import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VoucherData {
  id: string;
  user_name: string;
  user_email: string;
  service_type: string;
  service_price: number;
  voucher_code: string;
  expiry_date: string;
  professional_name?: string;
  professional_location?: string;
  created_at: string;
}

interface EmailRequest {
  voucher_data: VoucherData;
  pdf_base64: string;
  verification_url: string;
}

const getEmailTemplate = (voucherData: VoucherData, verificationUrl: string) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('pt-BR');

  return {
    subject: `🎉 Seu Voucher Digital está pronto! - ${voucherData.service_type}`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seu Voucher Digital</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
          }
          .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
          }
          .badge {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin-top: 10px;
          }
          .voucher-details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e9ecef;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: 600;
            color: #495057;
          }
          .detail-value {
            color: #212529;
          }
          .instructions {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .instructions h3 {
            margin: 0 0 10px 0;
            color: #1976d2;
          }
          .instructions ul {
            margin: 0;
            padding-left: 20px;
          }
          .cta-button {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
          .qr-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Parabéns!</h1>
            <p>Seu voucher digital está pronto</p>
            <div class="badge">${voucherData.voucher_code}</div>
          </div>

          <p>Olá <strong>${voucherData.user_name}</strong>,</p>
          
          <p>Temos o prazer de informar que seu voucher digital foi gerado com sucesso! Você agora pode agendar e realizar seu serviço.</p>

          <div class="voucher-details">
            <h3 style="margin-top: 0; color: #2563eb;">Detalhes do Voucher</h3>
            
            <div class="detail-row">
              <span class="detail-label">Beneficiário:</span>
              <span class="detail-value">${voucherData.user_name}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Serviço:</span>
              <span class="detail-value">${voucherData.service_type}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Valor:</span>
              <span class="detail-value">${formatCurrency(voucherData.service_price)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Código:</span>
              <span class="detail-value"><strong>${voucherData.voucher_code}</strong></span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Válido até:</span>
              <span class="detail-value">${formatDate(voucherData.expiry_date)}</span>
            </div>
            
            ${voucherData.professional_name ? `
            <div class="detail-row">
              <span class="detail-label">Profissional:</span>
              <span class="detail-value">${voucherData.professional_name}</span>
            </div>
            ` : ''}
          </div>

          <div class="qr-info">
            <h4 style="margin: 0 0 10px 0;">📱 QR Code de Verificação</h4>
            <p style="margin: 0; font-size: 14px;">
              Use o QR Code no voucher em anexo para verificação de autenticidade
            </p>
          </div>

          <div class="instructions">
            <h3>Como usar seu voucher:</h3>
            <ul>
              <li>Apresente o voucher PDF em anexo ao profissional</li>
              <li>O QR Code pode ser escaneado para verificação</li>
              <li>Válido até ${formatDate(voucherData.expiry_date)}</li>
              <li>Em caso de dúvidas, entre em contato conosco</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${verificationUrl}" class="cta-button">
              Verificar Voucher Online
            </a>
          </div>

          <div class="footer">
            <p><strong>Amigo do Peito</strong></p>
            <p>Este voucher é válido e foi emitido pelo nosso sistema</p>
            <p style="font-size: 12px; color: #adb5bd;">
              Código de verificação: ${voucherData.id}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Parabéns ${voucherData.user_name}!
      
      Seu voucher digital está pronto.
      
      Detalhes:
      - Serviço: ${voucherData.service_type}
      - Valor: ${formatCurrency(voucherData.service_price)}
      - Código: ${voucherData.voucher_code}
      - Válido até: ${formatDate(voucherData.expiry_date)}
      
      Apresente o voucher PDF em anexo ao profissional.
      
      Link de verificação: ${verificationUrl}
      
      Amigo do Peito
    `
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { voucher_data, pdf_base64, verification_url }: EmailRequest = await req.json();

    console.log('Sending voucher email:', { 
      recipient: voucher_data.user_email, 
      voucher_code: voucher_data.voucher_code 
    });

    const emailTemplate = getEmailTemplate(voucher_data, verification_url);

    // Registrar na tabela de logs de email
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient_email: voucher_data.user_email,
        subject: emailTemplate.subject,
        template_type: 'voucher_delivery',
        voucher_code: voucher_data.voucher_code,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          voucher_id: voucher_data.id,
          service_type: voucher_data.service_type,
          has_attachment: true
        }
      });

    if (logError) {
      console.error('Error logging email:', logError);
    }

    // Aqui você integraria com seu provedor de email real
    // Exemplo: SendGrid, Resend, AWS SES, etc.
    /*
    const emailProvider = new EmailProvider();
    await emailProvider.send({
      to: voucher_data.user_email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      attachments: [{
        filename: `voucher-${voucher_data.voucher_code}.pdf`,
        content: pdf_base64,
        type: 'application/pdf',
        disposition: 'attachment'
      }]
    });
    */

    // Por agora, simular o envio
    console.log(`Email simulado enviado para ${voucher_data.user_email}`);
    console.log(`Subject: ${emailTemplate.subject}`);
    console.log(`PDF size: ${pdf_base64.length} characters`);

    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Voucher enviado para ${voucher_data.user_email}`,
        voucher_code: voucher_data.voucher_code,
        email_logged: !logError
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending voucher email:', error);
    
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