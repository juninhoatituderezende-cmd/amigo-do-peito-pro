-- Performance optimizations and additional indexes

-- Optimize profiles table queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Optimize custom_plans table queries
CREATE INDEX IF NOT EXISTS idx_custom_plans_status ON public.custom_plans(status);
CREATE INDEX IF NOT EXISTS idx_custom_plans_professional_id ON public.custom_plans(professional_id);
CREATE INDEX IF NOT EXISTS idx_custom_plans_created_at ON public.custom_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_plans_entry_value ON public.custom_plans(entry_value);

-- Optimize plan_participants table queries
CREATE INDEX IF NOT EXISTS idx_plan_participants_plan_id ON public.plan_participants(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_participants_user_id ON public.plan_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_participants_status ON public.plan_participants(payment_status);
CREATE INDEX IF NOT EXISTS idx_plan_participants_contemplated ON public.plan_participants(contemplated);
CREATE INDEX IF NOT EXISTS idx_plan_participants_created_at ON public.plan_participants(created_at DESC);

-- Optimize payments table queries  
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_plan_id ON public.payments(plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON public.payments(amount);

-- Optimize commissions table queries
CREATE INDEX IF NOT EXISTS idx_commissions_influencer_id ON public.commissions(influencer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_plan_id ON public.commissions(plan_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON public.commissions(created_at DESC);

-- Optimize notifications table queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Optimize digital_vouchers table queries
CREATE INDEX IF NOT EXISTS idx_digital_vouchers_user_id ON public.digital_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_vouchers_code ON public.digital_vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_digital_vouchers_status ON public.digital_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_digital_vouchers_created_at ON public.digital_vouchers(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_plan_participants_plan_status ON public.plan_participants(plan_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_influencer_status ON public.commissions(influencer_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- Partial indexes for common filtered queries
CREATE INDEX IF NOT EXISTS idx_plan_participants_paid ON public.plan_participants(plan_id) 
WHERE payment_status = 'paid';

CREATE INDEX IF NOT EXISTS idx_plan_participants_contemplated_true ON public.plan_participants(plan_id) 
WHERE contemplated = true;

CREATE INDEX IF NOT EXISTS idx_payments_pending ON public.payments(created_at DESC) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_commissions_pending ON public.commissions(influencer_id) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, created_at DESC) 
WHERE read = false;

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance()
RETURNS TABLE(
  schemaname text,
  tablename text,
  attname text,
  n_distinct real,
  correlation real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.schemaname::text,
    s.tablename::text,
    s.attname::text,
    s.n_distinct,
    s.correlation
  FROM pg_stats s
  WHERE s.schemaname = 'public'
  ORDER BY s.tablename, s.attname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE(
  query text,
  calls bigint,
  total_time double precision,
  mean_time double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pss.query::text,
    pss.calls,
    pss.total_time,
    pss.mean_time
  FROM pg_stat_statements pss
  WHERE pss.mean_time > 100 -- queries taking more than 100ms on average
  ORDER BY pss.mean_time DESC
  LIMIT 20;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'pg_stat_statements extension not available';
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update table statistics
ANALYZE public.profiles;
ANALYZE public.custom_plans;
ANALYZE public.plan_participants;
ANALYZE public.payments;
ANALYZE public.commissions;
ANALYZE public.notifications;
ANALYZE public.digital_vouchers;