import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  template_type?: 'welcome' | 'payment_confirmation' | 'contemplation' | 'general';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, template_type = 'general' }: EmailRequest = await req.json();

    const sendGridKey = Deno.env.get("SENDGRID_API_KEY");
    if (!sendGridKey) {
      throw new Error("SendGrid API key not configured");
    }

    // Email templates based on type
    const getTemplate = (type: string, content: string) => {
      const baseTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #6366f1; font-size: 24px; font-weight: bold; }
            .content { line-height: 1.6; color: #333; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">MLM System</div>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>Este é um email automático do sistema MLM.</p>
              <p>© 2024 MLM System. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      return baseTemplate;
    };

    const emailData = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject,
        },
      ],
      from: {
        email: "noreply@mlmsystem.com",
        name: "MLM System",
      },
      content: [
        {
          type: "text/html",
          value: getTemplate(template_type, html),
        },
      ],
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendGridKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid error: ${response.status} - ${errorText}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email enviado com sucesso" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Email sending error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});