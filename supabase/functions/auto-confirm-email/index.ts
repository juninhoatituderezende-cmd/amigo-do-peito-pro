import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      throw new Error('Email é obrigatório')
    }

    // Create service role client to confirm email
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the user by email
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      throw getUserError
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    // If already confirmed, return success
    if (user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email já estava confirmado',
          user_id: user.id 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Confirm the user's email
    const { data: updatedUser, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { 
        email_confirm: true,
        email_confirmed_at: new Date().toISOString()
      }
    )

    if (confirmError) {
      throw confirmError
    }

    console.log(`✅ Email confirmado automaticamente para: ${email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email confirmado com sucesso',
        user_id: updatedUser.user.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Erro ao confirmar email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})