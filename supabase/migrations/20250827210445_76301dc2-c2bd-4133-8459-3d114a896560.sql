-- =============================================
-- CORREÇÕES DE SEGURANÇA - SEARCH PATH
-- =============================================

-- Corrigir função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Corrigir função generate_referral_code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    code TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Gerar código de 8 caracteres alfanuméricos
        code := UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8));
        
        -- Verificar se já existe
        SELECT COUNT(*) INTO exists_count 
        FROM public.referrals 
        WHERE codigo_referencia = code;
        
        -- Se não existe, retornar o código
        IF exists_count = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$;

-- Corrigir função process_referral
CREATE OR REPLACE FUNCTION public.process_referral(referrer_code TEXT, new_user_id UUID)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    referrer_profile_id UUID;
    referral_id UUID;
BEGIN
    -- Encontrar o usuário que fez a indicação
    SELECT id INTO referrer_profile_id
    FROM public.profiles
    WHERE referral_code = referrer_code;
    
    IF referrer_profile_id IS NOT NULL THEN
        -- Criar registro de referral
        INSERT INTO public.referrals (
            usuario_id,
            codigo_referencia,
            indicado_id,
            status
        ) VALUES (
            referrer_profile_id,
            referrer_code,
            new_user_id,
            'confirmado'
        ) RETURNING id INTO referral_id;
        
        -- Atualizar o campo referred_by na tabela profiles
        UPDATE public.profiles 
        SET referred_by = referrer_profile_id
        WHERE user_id = new_user_id;
        
        RETURN referral_id;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Corrigir função handle_new_user existente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, referral_code, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::user_role
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create initial credit balance
  INSERT INTO public.user_credits (user_id, total_credits, available_credits)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;