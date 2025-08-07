-- Corrigir problemas de segurança das funções MLM
-- Definir search_path nas funções para segurança

-- Recriar função generate_referral_code com search_path
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Gerar código de 8 caracteres: MIN + 5 caracteres aleatórios
    code := 'MIN' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM public.mlm_network WHERE referral_code = code) INTO exists_code;
    
    -- Se não existe, usar este código
    IF NOT exists_code THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Recriar função handle_mlm_referral_code com search_path
CREATE OR REPLACE FUNCTION public.handle_mlm_referral_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Recriar função calculate_mlm_level com search_path
CREATE OR REPLACE FUNCTION calculate_mlm_level(referred_by UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_level INTEGER;
BEGIN
  -- Se não tem referenciador, é nível 1
  IF referred_by IS NULL THEN
    RETURN 1;
  END IF;
  
  -- Buscar nível do referenciador
  SELECT level INTO parent_level 
  FROM public.mlm_network 
  WHERE user_id = referred_by;
  
  -- Se não encontrar, assumir nível 1
  IF parent_level IS NULL THEN
    RETURN 1;
  END IF;
  
  -- Retornar nível do pai + 1 (máximo 9)
  RETURN LEAST(parent_level + 1, 9);
END;
$$;

-- Recriar função handle_mlm_level_calculation com search_path
CREATE OR REPLACE FUNCTION public.handle_mlm_level_calculation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calcular nível baseado no referenciador
  NEW.level := calculate_mlm_level(NEW.referred_by_user_id);
  
  -- Calcular posição no nível (simplificado por agora)
  NEW.position_in_level := COALESCE(
    (SELECT COUNT(*) + 1 
     FROM public.mlm_network 
     WHERE level = NEW.level 
     AND created_at < NEW.created_at), 
    1
  );
  
  RETURN NEW;
END;
$$;

-- Recriar função process_mlm_referral com search_path
CREATE OR REPLACE FUNCTION public.process_mlm_referral(
  new_user_id UUID,
  referral_code_used TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_user_id UUID;
  commission_amount NUMERIC := 50.0; -- Comissão padrão
BEGIN
  -- Encontrar o referenciador pelo código
  SELECT user_id INTO referrer_user_id
  FROM public.mlm_network
  WHERE referral_code = referral_code_used
  AND status = 'active';
  
  -- Se não encontrar referenciador válido, falhar
  IF referrer_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Criar entrada na rede MLM para o novo usuário
  INSERT INTO public.mlm_network (
    user_id,
    referred_by_user_id,
    status
  ) VALUES (
    new_user_id,
    referrer_user_id,
    'active'
  );
  
  -- Criar registro de indicação
  INSERT INTO public.mlm_referrals (
    referrer_id,
    referred_id,
    referral_code_used,
    commission_earned,
    status
  ) VALUES (
    referrer_user_id,
    new_user_id,
    referral_code_used,
    commission_amount,
    'confirmed'
  );
  
  -- Atualizar contador de indicações do referenciador
  UPDATE public.mlm_network 
  SET 
    total_referrals = total_referrals + 1,
    active_referrals = active_referrals + 1,
    total_earnings = total_earnings + commission_amount,
    updated_at = now()
  WHERE user_id = referrer_user_id;
  
  RETURN TRUE;
END;
$$;