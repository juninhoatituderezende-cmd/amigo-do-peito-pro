-- Atualizar função handle_new_user para usar a estrutura correta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar perfil de usuário
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    referral_code,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::user_role
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Criar saldo inicial de créditos
  INSERT INTO public.user_credits (
    user_id,
    total_credits,
    available_credits
  )
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;