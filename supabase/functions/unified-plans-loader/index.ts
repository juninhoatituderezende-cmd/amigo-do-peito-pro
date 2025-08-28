import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { category_filter = null, include_inactive = false } = await req.json().catch(() => ({}))

    console.log('🔍 Buscando planos unificados - filtro:', category_filter, 'incluir inativos:', include_inactive)

    // Array para armazenar todos os planos de todas as tabelas
    const allPlans: any[] = []

    try {
      // 1. Buscar planos de tatuagem
      console.log('📝 Buscando planos de tatuagem...')
      const { data: tattooPlans, error: tattooError } = await supabaseClient
        .from('planos_tatuador')
        .select('*')
        .eq('active', true)

      if (tattooError) {
        console.error('⚠️ Erro ao buscar planos de tatuagem:', tattooError)
      } else {
        const formattedTattooPlans = (tattooPlans || []).map(plan => ({
          ...plan,
          category: 'tattoo',
          table_source: 'planos_tatuador',
          tipo_transacao: plan.tipo_transacao || 'servico'
        }))
        allPlans.push(...formattedTattooPlans)
        console.log(`✅ ${formattedTattooPlans.length} planos de tatuagem encontrados`)
      }

      // 2. Buscar planos dentistas
      console.log('🦷 Buscando planos dentistas...')
      const { data: dentalPlans, error: dentalError } = await supabaseClient
        .from('planos_dentista')
        .select('*')
        .eq('active', true)

      if (dentalError) {
        console.error('⚠️ Erro ao buscar planos dentistas:', dentalError)
      } else {
        const formattedDentalPlans = (dentalPlans || []).map(plan => ({
          ...plan,
          category: 'dental',
          table_source: 'planos_dentista',
          tipo_transacao: plan.tipo_transacao || 'servico'
        }))
        allPlans.push(...formattedDentalPlans)
        console.log(`✅ ${formattedDentalPlans.length} planos dentistas encontrados`)
      }

      // 3. Buscar planos customizados (do admin)
      console.log('⚙️ Buscando planos customizados...')
      const { data: customPlans, error: customError } = await supabaseClient
        .from('custom_plans')
        .select('*')
        .eq('active', true)

      if (customError) {
        console.error('⚠️ Erro ao buscar planos customizados:', customError)
      } else {
        const formattedCustomPlans = (customPlans || []).map(plan => ({
          ...plan,
          category: plan.category || 'service',
          table_source: 'custom_plans',
          tipo_transacao: plan.tipo_transacao || 'servico'
        }))
        allPlans.push(...formattedCustomPlans)
        console.log(`✅ ${formattedCustomPlans.length} planos customizados encontrados`)
      }

      // 4. Buscar produtos do marketplace
      console.log('🛍️ Buscando produtos do marketplace...')
      const { data: products, error: productsError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('active', true)

      if (productsError) {
        console.error('⚠️ Erro ao buscar produtos:', productsError)
      } else {
        const formattedProducts = (products || []).map(product => ({
          ...product,
          category: 'product',
          table_source: 'products',
          tipo_transacao: product.tipo_transacao || 'produto',
          max_participants: 1 // Produtos não têm grupos
        }))
        allPlans.push(...formattedProducts)
        console.log(`✅ ${formattedProducts.length} produtos encontrados`)
      }

    } catch (searchError) {
      console.error('❌ Erro durante a busca de planos:', searchError)
      throw new Error('Erro ao buscar planos das tabelas')
    }

    // Aplicar filtro de categoria se especificado
    let filteredPlans = allPlans
    if (category_filter) {
      filteredPlans = allPlans.filter(plan => plan.category === category_filter)
      console.log(`🔎 Filtro aplicado para categoria "${category_filter}": ${filteredPlans.length} planos`)
    }

    // Ordenar por data de criação (mais recentes primeiro)
    filteredPlans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Estatísticas de retorno
    const stats = {
      total_plans: filteredPlans.length,
      by_category: {
        tattoo: filteredPlans.filter(p => p.category === 'tattoo').length,
        dental: filteredPlans.filter(p => p.category === 'dental').length,
        service: filteredPlans.filter(p => p.category === 'service').length,
        product: filteredPlans.filter(p => p.category === 'product').length,
      },
      by_transaction_type: {
        servico: filteredPlans.filter(p => p.tipo_transacao === 'servico').length,
        produto: filteredPlans.filter(p => p.tipo_transacao === 'produto').length,
      }
    }

    console.log('📊 Estatísticas dos planos encontrados:', stats)

    const responseData = {
      success: true,
      plans: filteredPlans,
      stats: stats,
      message: `${filteredPlans.length} planos encontrados com sucesso`
    }

    console.log('📤 Retornando', filteredPlans.length, 'planos unificados')

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Erro na função unified-plans-loader:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor',
        plans: [],
        stats: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})