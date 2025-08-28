import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_ids, force_delete = false } = await req.json();

    if (!user_ids || !Array.isArray(user_ids)) {
      throw new Error('User IDs array required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🗑️ Iniciando exclusão forçada de ${user_ids.length} usuários`);

    const results = [];

    for (const user_id of user_ids) {
      try {
        console.log(`👤 Processando usuário: ${user_id}`);

        // 1. Buscar perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user_id)
          .single();

        if (!profile) {
          console.log(`⚠️ Perfil não encontrado para: ${user_id}`);
          results.push({
            user_id,
            success: false,
            error: 'Profile not found'
          });
          continue;
        }

        console.log(`📋 Perfil encontrado: ${profile.full_name} (${profile.id})`);

        // 2. Verificar vendas onde é referenciador
        const { data: sales } = await supabase
          .from('marketplace_sales')
          .select('id, buyer_id, seller_id')
          .eq('referrer_id', profile.id);

        console.log(`💰 Vendas como referenciador: ${sales?.length || 0}`);

        // 3. Remover referência do usuário nas vendas (ANTES de tentar excluir)
        if (sales && sales.length > 0) {
          const { error: updateError } = await supabase
            .from('marketplace_sales')
            .update({ referrer_id: null })
            .eq('referrer_id', profile.id);

          if (updateError) {
            console.error(`❌ Erro ao remover referências: ${updateError.message}`);
            throw updateError;
          }

          console.log(`✅ Removidas ${sales.length} referências de vendas`);
        }

        // 4. Remover outras referências (participações, grupos, etc.)
        // Remover participações em grupos
        const { error: partError } = await supabase
          .from('group_participants')
          .delete()
          .eq('user_id', user_id);

        if (partError) {
          console.error(`❌ Erro ao remover participações: ${partError.message}`);
        }

        // Remover créditos
        const { error: creditsError } = await supabase
          .from('user_credits')
          .delete()
          .eq('user_id', user_id);

        if (creditsError) {
          console.error(`❌ Erro ao remover créditos: ${creditsError.message}`);
        }

        // Remover transações de crédito
        const { error: transError } = await supabase
          .from('credit_transactions')
          .delete()
          .eq('user_id', user_id);

        if (transError) {
          console.error(`❌ Erro ao remover transações: ${transError.message}`);
        }

        // Remover notificações
        const { error: notifError } = await supabase
          .from('notification_triggers')
          .delete()
          .eq('user_id', user_id);

        if (notifError) {
          console.error(`❌ Erro ao remover notificações: ${notifError.message}`);
        }

        // Remover solicitações de saque
        const { error: withdrawError } = await supabase
          .from('withdrawal_requests')
          .delete()
          .eq('user_id', user_id);

        if (withdrawError) {
          console.error(`❌ Erro ao remover saques: ${withdrawError.message}`);
        }

        console.log(`✅ Dados relacionados removidos para: ${profile.full_name}`);

        // 5. Tentar excluir o perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', user_id);

        if (profileError) {
          console.error(`❌ Erro ao excluir perfil: ${profileError.message}`);
          throw profileError;
        }

        console.log(`✅ Perfil excluído: ${profile.full_name}`);

        // 6. Excluir usuário da autenticação (se forçado)
        if (force_delete) {
          try {
            const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
            if (authError) {
              console.error(`❌ Erro ao excluir usuário auth: ${authError.message}`);
            } else {
              console.log(`🔐 Usuário auth excluído: ${user_id}`);
            }
          } catch (authErr) {
            console.error(`❌ Erro auth deletion: ${authErr.message}`);
          }
        }

        results.push({
          user_id,
          profile_name: profile.full_name,
          success: true,
          sales_updated: sales?.length || 0
        });

      } catch (error) {
        console.error(`❌ Erro ao processar usuário ${user_id}:`, error);
        results.push({
          user_id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.log(`🎉 Processamento concluído: ${successCount} sucessos, ${errorCount} erros`);

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        summary: {
          total: user_ids.length,
          successful: successCount,
          failed: errorCount
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Erro na exclusão de usuários:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});