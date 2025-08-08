-- CORREÇÃO FINAL PARA PERMITIR PUBLICAÇÃO

-- 1. Corrigir as últimas funções sem search_path
CREATE OR REPLACE FUNCTION public.handle_mlm_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_mlm_level_calculation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.level := calculate_mlm_level(NEW.referred_by_user_id);
  NEW.position_in_level := COALESCE(
    (SELECT COUNT(*) + 1 
     FROM public.mlm_network 
     WHERE level = NEW.level 
     AND created_at <= NEW.created_at), 1);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_secure_mlm_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_secure_referral_code();
  END IF;
  RETURN NEW;
END;
$$;