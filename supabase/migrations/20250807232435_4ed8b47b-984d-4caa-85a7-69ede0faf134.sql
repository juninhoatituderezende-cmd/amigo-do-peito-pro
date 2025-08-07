-- Corrigir view mlm_statistics removendo security definer
DROP VIEW IF EXISTS public.mlm_statistics;

-- Recriar view sem security definer
CREATE VIEW public.mlm_statistics AS
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

-- Permitir acesso à view para usuários autenticados
GRANT SELECT ON public.mlm_statistics TO authenticated;