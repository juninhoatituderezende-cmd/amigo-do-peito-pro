-- FASE 3: CORREÇÃO FINAL DE SEGURANÇA - POLÍTICAS RLS RESTANTES (CORRIGIDO)

-- 1. Atualizar funções sem search_path configurado
CREATE OR REPLACE FUNCTION public.generate_plan_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    code := 'PLAN' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.custom_plans WHERE plan_code = code) INTO exists_code;
    IF NOT exists_code THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_plan_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan_code IS NULL OR NEW.plan_code = '' THEN
    NEW.plan_code := generate_plan_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_secure_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 2. Remover políticas problemáticas que permitem acesso anônimo desnecessário
DROP POLICY IF EXISTS "Authenticated users can view active plans" ON public.custom_plans;

-- 3. Corrigir políticas específicas sem criar duplicatas
-- Melhorar política de credit_transactions para verificação mais rigorosa
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can insert their own credit transactions" ON public.credit_transactions;

CREATE POLICY "Authenticated users can view their own credit transactions" 
ON public.credit_transactions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own credit transactions" 
ON public.credit_transactions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4. Garantir que todas as tabelas críticas tenham RLS habilitado
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contemplations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlm_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlm_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;