-- Influencer tracking: clicks, conversions, and credit postings

-- 1) Clicks table
CREATE TABLE IF NOT EXISTS public.influencer_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL,
  influencer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_hash TEXT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Conversions table
CREATE TABLE IF NOT EXISTS public.influencer_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL,
  influencer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_id TEXT,
  entry_value DECIMAL(10,2),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) RLS
ALTER TABLE public.influencer_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_conversions ENABLE ROW LEVEL SECURITY;

-- Influencers can read own events; service role can do all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'influencer_clicks' AND policyname = 'Influencer clicks select own'
  ) THEN
    CREATE POLICY "Influencer clicks select own" ON public.influencer_clicks
      FOR SELECT TO authenticated USING (influencer_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'influencer_conversions' AND policyname = 'Influencer conversions select own'
  ) THEN
    CREATE POLICY "Influencer conversions select own" ON public.influencer_conversions
      FOR SELECT TO authenticated USING (influencer_id = auth.uid());
  END IF;
END $$;

-- Allow inserts from service role
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'influencer_clicks' AND policyname = 'Service can insert clicks'
  ) THEN
    CREATE POLICY "Service can insert clicks" ON public.influencer_clicks
      FOR INSERT TO service_role WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'influencer_conversions' AND policyname = 'Service can insert conversions'
  ) THEN
    CREATE POLICY "Service can insert conversions" ON public.influencer_conversions
      FOR INSERT TO service_role WITH CHECK (true);
  END IF;
END $$;

-- 4) Convenience function to resolve influencer_id by referral_code
CREATE OR REPLACE FUNCTION public.resolve_influencer_by_code(p_referral_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try mlm_network first
  SELECT user_id INTO v_user_id FROM public.mlm_network WHERE referral_code = p_referral_code AND status = 'active' LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Fallback to profiles table
    SELECT user_id INTO v_user_id FROM public.profiles WHERE referral_code = p_referral_code LIMIT 1;
  END IF;

  RETURN v_user_id;
END;$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5) RPC to record a click
CREATE OR REPLACE FUNCTION public.record_influencer_click(
  p_referral_code TEXT,
  p_user_id UUID DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL,
  p_context JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_influencer_id UUID;
  v_id UUID;
BEGIN
  v_influencer_id := public.resolve_influencer_by_code(p_referral_code);

  INSERT INTO public.influencer_clicks (referral_code, influencer_id, user_id, user_agent, ip_hash, context)
  VALUES (p_referral_code, v_influencer_id, p_user_id, p_user_agent, p_ip_hash, p_context)
  RETURNING id INTO v_id;

  -- Optional: also update plan_referral_links click counters if present
  UPDATE public.plan_referral_links
    SET clicks_count = COALESCE(clicks_count, 0) + 1
  WHERE referral_code = p_referral_code;

  RETURN v_id;
END;$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6) RPC to record a conversion and create commission entry (pending)
CREATE OR REPLACE FUNCTION public.record_influencer_conversion(
  p_referral_code TEXT,
  p_client_id UUID,
  p_payment_id TEXT,
  p_entry_value DECIMAL(10,2),
  p_product_total_value DECIMAL(10,2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_influencer_id UUID;
  v_conv_id UUID;
  v_total_value DECIMAL(10,2);
BEGIN
  v_influencer_id := public.resolve_influencer_by_code(p_referral_code);

  INSERT INTO public.influencer_conversions (referral_code, influencer_id, client_id, payment_id, entry_value, metadata)
  VALUES (p_referral_code, v_influencer_id, p_client_id, p_payment_id, p_entry_value, jsonb_build_object('source','payment'))
  RETURNING id INTO v_conv_id;

  -- Try to create a pending commission using the standard logic (10% entry, 25% of entry)
  v_total_value := COALESCE(p_product_total_value, NULLIF(p_entry_value, 0) * 10.0);

  PERFORM public.process_influencer_commission(p_client_id, p_referral_code, v_total_value);

  -- Optional: update aggregated counters in plan_referral_links
  UPDATE public.plan_referral_links
    SET conversions_count = COALESCE(conversions_count, 0) + 1,
        total_commission = COALESCE(total_commission, 0) + (COALESCE(v_total_value, p_entry_value * 10.0) * 0.10 * 0.25)
  WHERE referral_code = p_referral_code;

  RETURN v_conv_id;
END;$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7) Indexes
CREATE INDEX IF NOT EXISTS idx_influencer_clicks_referral_code ON public.influencer_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_influencer_conversions_referral_code ON public.influencer_conversions(referral_code);
CREATE INDEX IF NOT EXISTS idx_influencer_conversions_influencer_id ON public.influencer_conversions(influencer_id);

-- 8) Mirror influencer_commissions into credit_transactions (pending)
CREATE OR REPLACE FUNCTION public.on_influencer_commission_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.credit_transactions (
    user_id, type, amount, description, source_type, commission_rate, reference_id
  ) VALUES (
    NEW.influencer_id,
    'earned',
    NEW.commission_amount,
    'Comissão de indicação pendente',
    'referral_bonus',
    NEW.commission_percentage,
    NEW.id::text
  );
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_influencer_commission_insert ON public.influencer_commissions;
CREATE TRIGGER trg_influencer_commission_insert
  AFTER INSERT ON public.influencer_commissions
  FOR EACH ROW
  EXECUTE PROCEDURE public.on_influencer_commission_insert();

