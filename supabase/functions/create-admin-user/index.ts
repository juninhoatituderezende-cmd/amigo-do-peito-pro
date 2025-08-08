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
    console.log("🚀 Iniciando cadastro de administrador");

    const { email, password, full_name, phone } = await req.json();

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false 
        } 
      }
    );

    console.log("✅ Cliente Supabase inicializado");

    // Verificar se o email já existe
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (existingUser && !checkError) {
      console.log("❌ Usuário já existe:", email);
      return new Response(JSON.stringify({
        success: false,
        error: "Usuário já existe com este email"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("✅ Email disponível, criando usuário...");

    // Criar usuário administrativo
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: full_name || "Administrador",
        role: "admin"
      }
    });

    if (createError) {
      console.error("❌ Erro ao criar usuário:", createError);
      throw createError;
    }

    if (!userData.user) {
      throw new Error("Falha ao criar usuário");
    }

    console.log("✅ Usuário criado:", userData.user.id);

    // Criar perfil admin
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userData.user.id,
        email: email,
        full_name: full_name || "Administrador",
        phone: phone || null,
        role: "admin"
      });

    if (profileError) {
      console.error("❌ Erro ao criar perfil:", profileError);
      // Tentar deletar usuário se perfil falhou
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      throw profileError;
    }

    console.log("✅ Perfil de administrador criado");

    // Criar entrada na rede MLM (obrigatório para o sistema)
    const { error: mlmError } = await supabaseAdmin
      .from("mlm_network")
      .upsert({
        user_id: userData.user.id,
        status: "active"
      });

    if (mlmError) {
      console.warn("⚠️ Aviso ao criar entrada MLM:", mlmError);
      // Não é crítico, continue
    }

    // Criar entrada de créditos
    const { error: creditsError } = await supabaseAdmin
      .from("user_credits")
      .upsert({
        user_id: userData.user.id,
        available_credits: 0,
        total_credits: 0
      });

    if (creditsError) {
      console.warn("⚠️ Aviso ao criar créditos:", creditsError);
      // Não é crítico, continue
    }

    console.log("🎉 Administrador cadastrado com sucesso!");

    const result = {
      success: true,
      message: "Administrador cadastrado com sucesso",
      user_id: userData.user.id,
      email: email,
      role: "admin",
      status: "ativo",
      permissions: [
        "Gerenciamento de usuários e profissionais",
        "Produtos e marketplace", 
        "Pagamentos e configurações de split",
        "Relatórios e auditoria do sistema"
      ],
      access_level: "total",
      created_at: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("💥 ERRO:", errorMessage);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: "Falha ao cadastrar administrador"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});