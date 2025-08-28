import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UnifiedPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  tipo_transacao: string;
  category: string;
  table_source: string;
  professional_id?: string | null;
  max_participants?: number;
  duration_months?: number;
  image_url?: string | null;
  target_audience?: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { category_filter = null, include_inactive = false, admin_view = false } = await req.json().catch(() => ({}))

    console.log('🔍 [UNIFIED-PLANS] Iniciando busca - Filtro:', category_filter, 'Inativos:', include_inactive, 'Admin:', admin_view)

    const allPlans: UnifiedPlan[] = []
    const errors: string[] = []

    try {
      // **1. BUSCAR PLANOS DE TATUAGEM**
      console.log('📝 [TATTOO] Buscando planos de tatuagem...')
      let tattooQuery = supabaseClient.from('planos_tatuador').select('*')
      if (!include_inactive) tattooQuery = tattooQuery.eq('active', true)
      
      const { data: tattooPlans, error: tattooError } = await tattooQuery
      
      if (tattooError) {
        console.error('❌ [TATTOO] Erro:', tattooError)
        errors.push(`Erro planos tatuagem: ${tattooError.message}`)
      } else {
        const formattedTattooPlans = (tattooPlans || []).map(plan => ({
          ...plan,
          category: 'tattoo',
          table_source: 'planos_tatuador',
          tipo_transacao: plan.tipo_transacao || 'servico',
          max_participants: plan.max_participants || 10,
          duration_months: 1
        }))
        allPlans.push(...formattedTattooPlans)
        console.log(`✅ [TATTOO] ${formattedTattooPlans.length} planos encontrados`)
      }

      // **2. BUSCAR PLANOS DENTISTAS**
      console.log('🦷 [DENTAL] Buscando planos dentistas...')
      let dentalQuery = supabaseClient.from('planos_dentista').select('*')
      if (!include_inactive) dentalQuery = dentalQuery.eq('active', true)
      
      const { data: dentalPlans, error: dentalError } = await dentalQuery
      
      if (dentalError) {
        console.error('❌ [DENTAL] Erro:', dentalError)
        errors.push(`Erro planos dental: ${dentalError.message}`)
      } else {
        const formattedDentalPlans = (dentalPlans || []).map(plan => ({
          ...plan,
          category: 'dental',
          table_source: 'planos_dentista',
          tipo_transacao: plan.tipo_transacao || 'servico',
          max_participants: plan.max_participants || 10,
          duration_months: 1
        }))
        allPlans.push(...formattedDentalPlans)
        console.log(`✅ [DENTAL] ${formattedDentalPlans.length} planos encontrados`)
      }

      // **3. BUSCAR PLANOS CUSTOMIZADOS**
      console.log('⚙️ [CUSTOM] Buscando planos customizados...')
      let customQuery = supabaseClient.from('custom_plans').select('*')
      if (!include_inactive) customQuery = customQuery.eq('active', true)
      
      const { data: customPlans, error: customError } = await customQuery
      
      if (customError) {
        console.error('❌ [CUSTOM] Erro:', customError)
        errors.push(`Erro planos custom: ${customError.message}`)
      } else {
        const formattedCustomPlans = (customPlans || []).map(plan => ({
          ...plan,
          category: plan.category || 'service',
          table_source: 'custom_plans',
          tipo_transacao: plan.tipo_transacao || 'servico',
          max_participants: plan.max_participants || 10,
          duration_months: plan.duration_months || 1
        }))
        allPlans.push(...formattedCustomPlans)
        console.log(`✅ [CUSTOM] ${formattedCustomPlans.length} planos encontrados`)
      }

      // **4. BUSCAR PRODUTOS MARKETPLACE**
      console.log('🛍️ [PRODUCTS] Buscando produtos do marketplace...')
      let productsQuery = supabaseClient.from('products').select('*')
      if (!include_inactive) productsQuery = productsQuery.eq('active', true)
      
      const { data: products, error: productsError } = await productsQuery
      
      if (productsError) {
        console.error('❌ [PRODUCTS] Erro:', productsError)
        errors.push(`Erro produtos: ${productsError.message}`)
      } else {
        const formattedProducts = (products || []).map(product => ({
          ...product,
          category: product.category || 'product',
          table_source: 'products',
          tipo_transacao: product.tipo_transacao || 'produto',
          max_participants: 1, // Produtos são individuais
          duration_months: 1
        }))
        allPlans.push(...formattedProducts)
        console.log(`✅ [PRODUCTS] ${formattedProducts.length} produtos encontrados`)
      }

    } catch (searchError) {
      console.error('💥 [UNIFIED-PLANS] Erro crítico durante busca:', searchError)
      errors.push(`Erro crítico: ${searchError.message}`)
    }

    // **VALIDAÇÃO DE INTEGRIDADE DE DADOS**
    console.log('🔍 [VALIDATION] Validando integridade dos planos...')
    const validPlans = allPlans.filter(plan => {
      const isValid = plan.id && plan.name && plan.price && typeof plan.active === 'boolean'
      if (!isValid) {
        console.warn(`⚠️ [VALIDATION] Plano inválido removido:`, plan)
        errors.push(`Plano inválido: ${plan.name || 'sem nome'} - campos obrigatórios faltando`)
      }
      return isValid
    })

    // **FILTROS APLICADOS**
    let filteredPlans = validPlans
    
    // Filtro por categoria
    if (category_filter) {
      filteredPlans = validPlans.filter(plan => plan.category === category_filter)
      console.log(`🔎 [FILTER] Categoria "${category_filter}": ${filteredPlans.length} planos`)
    }

    // **ORDENAÇÃO**
    filteredPlans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // **ESTATÍSTICAS DETALHADAS**
    const stats = {
      total_found: allPlans.length,
      total_valid: validPlans.length,
      total_filtered: filteredPlans.length,
      by_category: {
        tattoo: filteredPlans.filter(p => p.category === 'tattoo').length,
        dental: filteredPlans.filter(p => p.category === 'dental').length,
        service: filteredPlans.filter(p => p.category === 'service').length,
        product: filteredPlans.filter(p => p.category === 'product').length,
      },
      by_transaction_type: {
        servico: filteredPlans.filter(p => p.tipo_transacao === 'servico').length,
        produto: filteredPlans.filter(p => p.tipo_transacao === 'produto').length,
      },
      by_table_source: {
        planos_tatuador: filteredPlans.filter(p => p.table_source === 'planos_tatuador').length,
        planos_dentista: filteredPlans.filter(p => p.table_source === 'planos_dentista').length,
        custom_plans: filteredPlans.filter(p => p.table_source === 'custom_plans').length,
        products: filteredPlans.filter(p => p.table_source === 'products').length,
      },
      errors: errors
    }

    console.log('📊 [STATS] Estatísticas completas:', stats)

    const responseData = {
      success: true,
      plans: filteredPlans,
      stats: stats,
      errors: errors,
      timestamp: new Date().toISOString(),
      message: errors.length > 0 
        ? `${filteredPlans.length} planos retornados com ${errors.length} erros`
        : `${filteredPlans.length} planos carregados com sucesso`
    }

    console.log(`📤 [RESPONSE] Retornando ${filteredPlans.length} planos unificados`)

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('💥 [UNIFIED-PLANS] Erro crítico na função:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor',
        plans: [],
        stats: {
          total_found: 0,
          total_valid: 0,
          total_filtered: 0,
          errors: [`Erro crítico: ${error.message}`]
        },
        errors: [`Erro crítico: ${error.message}`],
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})