-- CRITICAL SECURITY FIXES

-- 1. Fix admin authentication - remove email-based admin checks
-- Update is_admin function to be secure and only check admin_configs table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  -- Only check admin_configs table, no email checks
  SELECT EXISTS (
    SELECT 1 FROM public.admin_configs 
    WHERE admin_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) 
    AND is_active = true
  ) INTO admin_exists;
  
  RETURN COALESCE(admin_exists, false);
END;
$$;

-- 2. Create secure admin invitation system
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on admin invitations
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only existing admins can manage invitations
CREATE POLICY "Admins can manage invitations" ON public.admin_invitations
  FOR ALL USING (is_admin());

-- 3. Fix PIX payment security - add proper payment validation table
CREATE TABLE IF NOT EXISTS public.payment_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id),
  asaas_payment_id TEXT NOT NULL,
  webhook_signature TEXT,
  amount_verified BOOLEAN NOT NULL DEFAULT false,
  signature_verified BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(payment_id, asaas_payment_id)
);

-- Enable RLS on payment validations
ALTER TABLE public.payment_validations ENABLE ROW LEVEL SECURITY;

-- Only service role can manage payment validations
CREATE POLICY "Service role can manage payment validations" ON public.payment_validations
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Add payment amount validation function
CREATE OR REPLACE FUNCTION public.validate_payment_amount(
  payment_id UUID,
  received_amount NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  expected_amount NUMERIC;
  plan_amount NUMERIC;
BEGIN
  -- Get payment amount
  SELECT amount INTO expected_amount
  FROM public.payments
  WHERE id = payment_id;
  
  -- Verify amounts match (allowing for small rounding differences)
  RETURN ABS(expected_amount - received_amount) < 0.01;
END;
$$;

-- 5. Secure referral code generation - make it truly random
CREATE OR REPLACE FUNCTION public.generate_secure_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate truly random code with more entropy
    code := 'REF' || UPPER(encode(gen_random_bytes(8), 'hex'));
    
    -- Check if already exists
    SELECT EXISTS(SELECT 1 FROM public.mlm_network WHERE referral_code = code) INTO exists_code;
    
    -- Increment attempt counter
    attempt_count := attempt_count + 1;
    
    -- If not exists or max attempts reached, exit
    IF NOT exists_code OR attempt_count >= max_attempts THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- If max attempts reached and still collision, add timestamp
  IF exists_code THEN
    code := code || extract(epoch from now())::bigint;
  END IF;
  
  RETURN code;
END;
$$;

-- Update existing referral code trigger to use secure function
DROP TRIGGER IF EXISTS handle_mlm_referral_code ON public.mlm_network;
CREATE OR REPLACE FUNCTION public.handle_secure_mlm_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_secure_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_secure_mlm_referral_code
  BEFORE INSERT ON public.mlm_network
  FOR EACH ROW
  EXECUTE FUNCTION handle_secure_mlm_referral_code();

-- 6. Fix RLS policies - remove anonymous access from sensitive tables
-- Update materials table to require authentication
DROP POLICY IF EXISTS "Anyone can view active materials" ON public.materials;
CREATE POLICY "Authenticated users can view active materials" ON public.materials
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Update custom_plans to require authentication
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.custom_plans;
CREATE POLICY "Authenticated users can view active plans" ON public.custom_plans
  FOR SELECT
  TO authenticated
  USING (active = true AND public_enrollment = true);

-- Update plan_groups to require authentication
DROP POLICY IF EXISTS "Anyone can view plan groups" ON public.plan_groups;
CREATE POLICY "Authenticated users can view plan groups" ON public.plan_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Update services to require authentication
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
CREATE POLICY "Authenticated users can view services" ON public.services
  FOR SELECT
  TO authenticated
  USING (true);

-- 7. Add rate limiting table for security events
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events" ON public.security_events
  FOR SELECT
  USING (is_admin());

-- Only service role can insert security events
CREATE POLICY "Service role can insert security events" ON public.security_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 8. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  user_id UUID DEFAULT NULL,
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  details JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    ip_address,
    user_agent,
    details
  ) VALUES (
    event_type,
    COALESCE(user_id, auth.uid()),
    ip_address,
    user_agent,
    details
  );
END;
$$;