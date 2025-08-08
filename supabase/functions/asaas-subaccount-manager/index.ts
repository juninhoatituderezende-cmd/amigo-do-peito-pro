import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASAAS-SUBACCOUNT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { action, ...data } = await req.json();
    logStep("Request data received", { action, dataKeys: Object.keys(data) });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // ASAAS API configuration
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      throw new Error("ASAAS_API_KEY não configurada");
    }

    const asaasHeaders = {
      "access_token": asaasApiKey,
      "Content-Type": "application/json",
    };

    let result;

    switch (action) {
      case "create_subaccount":
        result = await createSubaccount(supabaseClient, user.id, data, asaasHeaders);
        break;
      
      case "update_subaccount":
        result = await updateSubaccount(supabaseClient, user.id, data, asaasHeaders);
        break;
      
      case "get_subaccount_status":
        result = await getSubaccountStatus(supabaseClient, user.id, data.professional_id);
        break;
      
      case "upload_documents":
        result = await uploadDocuments(supabaseClient, user.id, data, asaasHeaders);
        break;
      
      default:
        throw new Error(`Ação não reconhecida: ${action}`);
    }

    logStep("Operation completed successfully", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in asaas-subaccount-manager", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Criar subconta no ASAAS
async function createSubaccount(supabaseClient: any, userId: string, data: any, asaasHeaders: any) {
  logStep("Creating ASAAS subaccount", data);

  // Verificar se o usuário é o dono do profissional
  const { data: professional, error: profError } = await supabaseClient
    .from("professionals")
    .select("*")
    .eq("id", data.professional_id)
    .eq("user_id", userId)
    .single();

  if (profError || !professional) {
    throw new Error("Profissional não encontrado ou acesso negado");
  }

  // Verificar se já existe subconta
  const { data: existingSubaccount } = await supabaseClient
    .from("asaas_subaccounts")
    .select("*")
    .eq("professional_id", data.professional_id)
    .single();

  if (existingSubaccount) {
    throw new Error("Subconta já existe para este profissional");
  }

  // Payload para criação da subconta no ASAAS
  const asaasPayload = {
    name: data.name,
    email: data.email,
    cpfCnpj: data.cpf_cnpj.replace(/[^0-9]/g, ''),
    phone: data.phone.replace(/[^0-9]/g, ''),
    mobilePhone: data.phone.replace(/[^0-9]/g, ''),
    address: data.address_street,
    addressNumber: data.address_number,
    complement: data.address_complement || "",
    province: data.address_district,
    city: data.address_city,
    state: data.address_state,
    postalCode: data.address_postal_code.replace(/[^0-9]/g, ''),
    birthDate: data.birth_date,
    companyType: data.company_type || null
  };

  logStep("Sending to ASAAS API", asaasPayload);

  // Criar subconta no ASAAS
  const asaasResponse = await fetch("https://www.asaas.com/api/v3/accounts", {
    method: "POST",
    headers: asaasHeaders,
    body: JSON.stringify(asaasPayload),
  });

  if (!asaasResponse.ok) {
    const errorText = await asaasResponse.text();
    logStep("ASAAS API error", { status: asaasResponse.status, error: errorText });
    throw new Error(`Erro na API ASAAS: ${asaasResponse.status} - ${errorText}`);
  }

  const asaasData = await asaasResponse.json();
  logStep("ASAAS subaccount created", asaasData);

  // Salvar subconta no banco de dados
  const { data: subaccount, error: subaccountError } = await supabaseClient
    .from("asaas_subaccounts")
    .insert({
      professional_id: data.professional_id,
      asaas_account_id: asaasData.id,
      status: asaasData.status || 'pending',
      cpf_cnpj: data.cpf_cnpj,
      name: data.name,
      email: data.email,
      phone: data.phone,
      birth_date: data.birth_date,
      company_type: data.company_type,
      address_street: data.address_street,
      address_number: data.address_number,
      address_complement: data.address_complement,
      address_district: data.address_district,
      address_city: data.address_city,
      address_state: data.address_state,
      address_postal_code: data.address_postal_code,
      bank_account_type: data.bank_account_type,
      bank_code: data.bank_code,
      bank_account_number: data.bank_account_number,
      bank_account_digit: data.bank_account_digit,
      bank_agency: data.bank_agency,
      pix_key: data.pix_key
    })
    .select()
    .single();

  if (subaccountError) {
    logStep("Error saving subaccount", subaccountError);
    throw new Error("Erro ao salvar subconta no banco de dados");
  }

  return {
    success: true,
    subaccount_id: subaccount.id,
    asaas_account_id: asaasData.id,
    status: asaasData.status,
    message: "Subconta criada com sucesso"
  };
}

// Atualizar subconta
async function updateSubaccount(supabaseClient: any, userId: string, data: any, asaasHeaders: any) {
  logStep("Updating ASAAS subaccount", data);

  // Verificar se o usuário é o dono da subconta
  const { data: subaccount, error: subaccountError } = await supabaseClient
    .from("asaas_subaccounts")
    .select("*, professionals!inner(user_id)")
    .eq("id", data.subaccount_id)
    .single();

  if (subaccountError || !subaccount || subaccount.professionals.user_id !== userId) {
    throw new Error("Subconta não encontrada ou acesso negado");
  }

  // Atualizar dados bancários no ASAAS se fornecidos
  if (data.bank_data) {
    const bankPayload = {
      bankAccount: {
        bank: {
          code: data.bank_data.bank_code
        },
        accountName: subaccount.name,
        ownerName: subaccount.name,
        ownerBirthDate: subaccount.birth_date,
        cpfCnpj: subaccount.cpf_cnpj.replace(/[^0-9]/g, ''),
        agency: data.bank_data.bank_agency,
        account: data.bank_data.bank_account_number,
        accountDigit: data.bank_data.bank_account_digit,
        bankAccountType: data.bank_data.bank_account_type
      }
    };

    const bankResponse = await fetch(`https://www.asaas.com/api/v3/accounts/${subaccount.asaas_account_id}/bankAccount`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify(bankPayload),
    });

    if (!bankResponse.ok) {
      const errorText = await bankResponse.text();
      throw new Error(`Erro ao atualizar dados bancários: ${errorText}`);
    }
  }

  // Atualizar no banco local
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (data.bank_data) {
    updateData.bank_account_type = data.bank_data.bank_account_type;
    updateData.bank_code = data.bank_data.bank_code;
    updateData.bank_account_number = data.bank_data.bank_account_number;
    updateData.bank_account_digit = data.bank_data.bank_account_digit;
    updateData.bank_agency = data.bank_data.bank_agency;
  }

  if (data.pix_key) {
    updateData.pix_key = data.pix_key;
  }

  const { error: updateError } = await supabaseClient
    .from("asaas_subaccounts")
    .update(updateData)
    .eq("id", data.subaccount_id);

  if (updateError) {
    throw new Error("Erro ao atualizar subconta no banco de dados");
  }

  return {
    success: true,
    message: "Subconta atualizada com sucesso"
  };
}

// Obter status da subconta
async function getSubaccountStatus(supabaseClient: any, userId: string, professionalId: string) {
  const { data: subaccount, error } = await supabaseClient
    .from("asaas_subaccounts")
    .select("*, professionals!inner(user_id)")
    .eq("professional_id", professionalId)
    .single();

  if (error || !subaccount) {
    return {
      success: true,
      exists: false,
      message: "Subconta não encontrada"
    };
  }

  if (subaccount.professionals.user_id !== userId) {
    throw new Error("Acesso negado");
  }

  return {
    success: true,
    exists: true,
    status: subaccount.status,
    verification_status: subaccount.verification_status,
    kyc_completed: subaccount.kyc_completed,
    documents_uploaded: subaccount.documents_uploaded,
    can_receive_payments: subaccount.status === 'active' && subaccount.verification_status === 'approved'
  };
}

// Upload de documentos (placeholder - implementar conforme necessário)
async function uploadDocuments(supabaseClient: any, userId: string, data: any, asaasHeaders: any) {
  // Esta função seria implementada para fazer upload de documentos para o ASAAS
  // Por enquanto, apenas marcar como documentos enviados
  
  const { error } = await supabaseClient
    .from("asaas_subaccounts")
    .update({
      documents_uploaded: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", data.subaccount_id);

  if (error) {
    throw new Error("Erro ao atualizar status dos documentos");
  }

  return {
    success: true,
    message: "Documentos marcados como enviados"
  };
}