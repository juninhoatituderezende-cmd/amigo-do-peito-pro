-- Criar views e funções para painel admin MLM

-- Função para obter rede completa de um usuário (9 níveis)
CREATE OR REPLACE FUNCTION public.get_user_network(target_user_id UUID)
RETURNS TABLE(
  level INTEGER,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  referral_code TEXT,
  total_referrals INTEGER,
  active_referrals INTEGER,
  total_earnings NUMERIC,
  status TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE network_tree AS (
    -- Nível 1: usuário base
    SELECT 
      n.level,
      n.user_id,
      u.nome as user_name,
      u.email as user_email,
      n.referral_code,
      n.total_referrals,
      n.active_referrals,
      n.total_earnings,
      n.status,
      n.joined_at
    FROM public.mlm_network n
    LEFT JOIN public.users u ON u.id = n.user_id
    WHERE n.user_id = target_user_id
    
    UNION ALL
    
    -- Níveis 2-9: indicados diretos e indiretos
    SELECT 
      n.level,
      n.user_id,
      u.nome as user_name,
      u.email as user_email,
      n.referral_code,
      n.total_referrals,
      n.active_referrals,
      n.total_earnings,
      n.status,
      n.joined_at
    FROM public.mlm_network n
    LEFT JOIN public.users u ON u.id = n.user_id
    INNER JOIN network_tree nt ON nt.user_id = n.referred_by_user_id
    WHERE n.level <= 9
  )
  SELECT * FROM network_tree
  ORDER BY level, joined_at;
END;
$$;

-- Função para obter comissões de um usuário
CREATE OR REPLACE FUNCTION public.get_user_commissions(target_user_id UUID)
RETURNS TABLE(
  total_commissions NUMERIC,
  pending_commissions NUMERIC,
  paid_commissions NUMERIC,
  referral_commissions NUMERIC,
  bonus_commissions NUMERIC,
  override_commissions NUMERIC,
  commission_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_record RECORD;
BEGIN
  -- Calcular totais
  SELECT 
    COALESCE(SUM(c.amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.amount ELSE 0 END), 0) as pending_amount,
    COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END), 0) as paid_amount,
    COALESCE(SUM(CASE WHEN c.type = 'referral' THEN c.amount ELSE 0 END), 0) as referral_amount,
    COALESCE(SUM(CASE WHEN c.type = 'bonus' THEN c.amount ELSE 0 END), 0) as bonus_amount,
    COALESCE(SUM(CASE WHEN c.type = 'override' THEN c.amount ELSE 0 END), 0) as override_amount
  INTO result_record
  FROM public.mlm_commissions c
  WHERE c.user_id = target_user_id;
  
  -- Detalhes por nível
  total_commissions := result_record.total_amount;
  pending_commissions := result_record.pending_amount;
  paid_commissions := result_record.paid_amount;
  referral_commissions := result_record.referral_amount;
  bonus_commissions := result_record.bonus_amount;
  override_commissions := result_record.override_amount;
  
  -- JSON com detalhes por nível
  SELECT jsonb_agg(
    jsonb_build_object(
      'level', c.level,
      'amount', c.amount,
      'type', c.type,
      'status', c.status,
      'source_user_name', u.nome,
      'created_at', c.created_at
    )
  ) INTO commission_details
  FROM public.mlm_commissions c
  LEFT JOIN public.users u ON u.id = c.source_user_id
  WHERE c.user_id = target_user_id
  ORDER BY c.created_at DESC;
  
  RETURN NEXT;
END;
$$;

-- Função para obter indicações por status (para auditoria)
CREATE OR REPLACE FUNCTION public.get_referrals_by_status(filter_status TEXT DEFAULT 'all')
RETURNS TABLE(
  referral_id UUID,
  referrer_name TEXT,
  referrer_email TEXT,
  referred_name TEXT,
  referred_email TEXT,
  referral_code_used TEXT,
  commission_earned NUMERIC,
  commission_percentage NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as referral_id,
    u1.nome as referrer_name,
    u1.email as referrer_email,
    u2.nome as referred_name,
    u2.email as referred_email,
    r.referral_code_used,
    r.commission_earned,
    r.commission_percentage,
    r.status,
    r.created_at,
    r.confirmed_at,
    r.paid_at
  FROM public.mlm_referrals r
  LEFT JOIN public.users u1 ON u1.id = r.referrer_id
  LEFT JOIN public.users u2 ON u2.id = r.referred_id
  WHERE 
    CASE 
      WHEN filter_status = 'all' THEN true
      ELSE r.status = filter_status
    END
  ORDER BY r.created_at DESC;
END;
$$;

-- View para estatísticas gerais MLM
CREATE OR REPLACE VIEW public.mlm_statistics AS
SELECT 
  COUNT(DISTINCT mn.user_id) as total_users_in_network,
  COUNT(DISTINCT CASE WHEN mn.status = 'active' THEN mn.user_id END) as active_users,
  COUNT(DISTINCT CASE WHEN mn.level = 1 THEN mn.user_id END) as level_1_users,
  SUM(mn.total_referrals) as total_referrals_network,
  SUM(mn.total_earnings) as total_network_earnings,
  COUNT(DISTINCT mr.id) as total_referrals_processed,
  COUNT(DISTINCT CASE WHEN mr.status = 'confirmed' THEN mr.id END) as confirmed_referrals,
  COUNT(DISTINCT CASE WHEN mr.status = 'pending' THEN mr.id END) as pending_referrals,
  SUM(CASE WHEN mc.status = 'pending' THEN mc.amount ELSE 0 END) as pending_commissions_total,
  SUM(CASE WHEN mc.status = 'paid' THEN mc.amount ELSE 0 END) as paid_commissions_total
FROM public.mlm_network mn
LEFT JOIN public.mlm_referrals mr ON mn.user_id = mr.referrer_id OR mn.user_id = mr.referred_id
LEFT JOIN public.mlm_commissions mc ON mn.user_id = mc.user_id;

-- Função para alterar status de indicação (para admin)
CREATE OR REPLACE FUNCTION public.admin_update_referral_status(
  referral_id UUID,
  new_status TEXT,
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_status TEXT;
  referrer_id UUID;
  commission_amount NUMERIC;
BEGIN
  -- Verificar se é admin (usando função existente)
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar status de indicações';
  END IF;
  
  -- Obter dados da indicação
  SELECT status, referrer_id, commission_earned 
  INTO old_status, referrer_id, commission_amount
  FROM public.mlm_referrals 
  WHERE id = referral_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Atualizar status da indicação
  UPDATE public.mlm_referrals 
  SET 
    status = new_status,
    confirmed_at = CASE WHEN new_status = 'confirmed' THEN now() ELSE confirmed_at END,
    paid_at = CASE WHEN new_status = 'paid' THEN now() ELSE paid_at END
  WHERE id = referral_id;
  
  -- Se cancelando, ajustar contadores do referenciador
  IF old_status = 'confirmed' AND new_status = 'cancelled' THEN
    UPDATE public.mlm_network 
    SET 
      active_referrals = active_referrals - 1,
      total_earnings = total_earnings - commission_amount,
      updated_at = now()
    WHERE user_id = referrer_id;
  END IF;
  
  -- Se confirmando, ajustar contadores do referenciador
  IF old_status = 'pending' AND new_status = 'confirmed' THEN
    UPDATE public.mlm_network 
    SET 
      active_referrals = active_referrals + 1,
      total_earnings = total_earnings + commission_amount,
      updated_at = now()
    WHERE user_id = referrer_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Permitir acesso admin às novas funções
GRANT EXECUTE ON FUNCTION public.get_user_network(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_commissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referrals_by_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_referral_status(UUID, TEXT, TEXT) TO authenticated;