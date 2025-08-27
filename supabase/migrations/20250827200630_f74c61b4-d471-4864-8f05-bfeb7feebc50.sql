-- Corrigir perfis com user_id NULL
-- Primeiro, vamos identificar e corrigir manualmente os perfis órfãos

-- Verificar quantos perfis têm user_id NULL
UPDATE profiles 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = profiles.email 
  LIMIT 1
)
WHERE user_id IS NULL 
AND email IS NOT NULL;

-- Garantir que a função handle_new_user está funcionando corretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Log para debug
  RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
  
  INSERT INTO public.profiles (user_id, full_name, email, referral_code, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::user_role
  );
  
  -- Create initial credit balance
  INSERT INTO public.user_credits (user_id, total_credits, available_credits)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;