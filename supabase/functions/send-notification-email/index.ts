import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  userId: string;
  type: 'group_complete' | 'referral_success' | 'payment_processed' | 'achievement_unlocked';
  templateData: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, templateData }: EmailNotificationRequest = await req.json();

    // Inicializar Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new Error("Usuário não encontrado");
    }

    // Preparar conteúdo do email baseado no tipo
    let subject = "";
    let htmlContent = "";

    switch (type) {
      case 'group_complete':
        subject = "🎉 Seu grupo está completo!";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Grupo Completo!</h2>
            <p>Olá ${userData.full_name},</p>
            <p>Temos uma ótima notícia! O grupo <strong>${templateData.groupName}</strong> atingiu o número máximo de participantes.</p>
            <p>Em breve você receberá mais informações sobre o agendamento do seu serviço.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Detalhes do Grupo:</h3>
              <ul>
                <li><strong>Plano:</strong> ${templateData.planName}</li>
                <li><strong>Valor pago:</strong> R$ ${templateData.paidAmount}</li>
                <li><strong>Total de participantes:</strong> ${templateData.totalMembers}</li>
              </ul>
            </div>
            <p>Obrigado por fazer parte do Amigo do Peito!</p>
          </div>
        `;
        break;

      case 'referral_success':
        subject = "💰 Nova indicação convertida!";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Indicação Convertida!</h2>
            <p>Olá ${userData.full_name},</p>
            <p>Parabéns! Uma das suas indicações se converteu em venda.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <h3>Detalhes da Comissão:</h3>
              <ul>
                <li><strong>Indicado:</strong> ${templateData.referredName}</li>
                <li><strong>Comissão:</strong> R$ ${templateData.commission}</li>
                <li><strong>Plano:</strong> ${templateData.planName}</li>
              </ul>
            </div>
            <p>Continue compartilhando seus links para ganhar ainda mais!</p>
          </div>
        `;
        break;

      case 'payment_processed':
        subject = templateData.type === 'withdrawal' ? "💳 Saque processado" : "💰 Comissão recebida";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">${templateData.type === 'withdrawal' ? 'Saque Processado' : 'Comissão Recebida'}!</h2>
            <p>Olá ${userData.full_name},</p>
            <p>${templateData.type === 'withdrawal' 
              ? `Seu saque de R$ ${templateData.amount} foi processado com sucesso!`
              : `Você recebeu uma nova comissão de R$ ${templateData.amount}!`
            }</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Detalhes:</h3>
              <ul>
                <li><strong>Valor:</strong> R$ ${templateData.amount}</li>
                <li><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
                ${templateData.method ? `<li><strong>Método:</strong> ${templateData.method}</li>` : ''}
              </ul>
            </div>
          </div>
        `;
        break;

      case 'achievement_unlocked':
        subject = "🏆 Nova conquista desbloqueada!";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Conquista Desbloqueada!</h2>
            <p>Olá ${userData.full_name},</p>
            <p>Parabéns! Você desbloqueou uma nova conquista: <strong>${templateData.achievementName}</strong></p>
            ${templateData.bonus ? `
              <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
                <h3>Bônus Especial!</h3>
                <p>Você ganhou R$ ${templateData.bonus} de bônus por esta conquista!</p>
              </div>
            ` : ''}
            <p>Continue assim e desbloqueie ainda mais conquistas!</p>
          </div>
        `;
        break;
    }

    // Aqui você integraria com seu provedor de email (SendGrid, Resend, etc.)
    // Por agora, vamos apenas logar o email que seria enviado
    console.log('Email would be sent:', {
      to: userData.email,
      subject,
      html: htmlContent
    });

    // Registrar notificação no banco
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        title: subject,
        message: `Email enviado: ${subject}`,
        type: 'info',
        read: false,
        category: 'system'
      });

    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email notification processed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao processar notificação por email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});