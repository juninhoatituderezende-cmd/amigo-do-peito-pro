-- CORREÇÃO FINAL: Remover view SECURITY DEFINER e substituir por função segura

-- 1. Remover a view problemática mlm_statistics
DROP VIEW IF EXISTS public.mlm_statistics;

-- 2. Criar função segura para estatísticas MLM que respeita RLS
CREATE OR REPLACE FUNCTION public.get_mlm_statistics(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  total_users bigint,
  active_users bigint,
  total_referrals bigint,
  total_commissions numeric,
  pending_commissions numeric,
  paid_commissions numeric,
  top_performers jsonb,
  recent_activity jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requesting_user_id uuid;
  is_admin_user boolean;
BEGIN
  -- Obter ID do usuário logado
  requesting_user_id := auth.uid();
  
  -- Verificar se é admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = requesting_user_id AND role = 'admin'
  ) INTO is_admin_user;
  
  -- Se não é admin e não especificou usuário próprio, negar acesso
  IF NOT is_admin_user AND (target_user_id IS NULL OR target_user_id != requesting_user_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem ver estatísticas gerais';
  END IF;
  
  -- Se é usuário normal, apenas suas próprias estatísticas
  IF NOT is_admin_user THEN
    target_user_id := requesting_user_id;
  END IF;
  
  -- Retornar estatísticas apropriadas
  IF is_admin_user AND target_user_id IS NULL THEN
    -- Estatísticas gerais para admin
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE status = 'active') as active_users,
      COALESCE(SUM(total_referrals), 0) as total_referrals,
      COALESCE(SUM(total_earnings), 0) as total_commissions,
      0::numeric as pending_commissions,
      0::numeric as paid_commissions,
      '[]'::jsonb as top_performers,
      '[]'::jsonb as recent_activity
    FROM public.mlm_network;
  ELSE
    -- Estatísticas específicas do usuário
    SELECT 
      1::bigint as total_users,
      1::bigint as active_users,
      COALESCE(n.total_referrals, 0)::bigint as total_referrals,
      COALESCE(n.total_earnings, 0) as total_commissions,
      0::numeric as pending_commissions,
      0::numeric as paid_commissions,
      '[]'::jsonb as top_performers,
      '[]'::jsonb as recent_activity
    FROM public.mlm_network n
    WHERE n.user_id = target_user_id;
  END IF;
  
  RETURN QUERY
  SELECT * FROM (VALUES (
    total_users, active_users, total_referrals, 
    total_commissions, pending_commissions, paid_commissions,
    top_performers, recent_activity
  )) as stats;
END;
$$;