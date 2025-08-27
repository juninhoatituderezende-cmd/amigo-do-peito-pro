-- Corrigir o perfil órfão específico
UPDATE profiles 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'charlesink1996@gmail.com' 
  AND id NOT IN (
    SELECT user_id FROM profiles 
    WHERE user_id IS NOT NULL AND email = 'charlesink1996@gmail.com'
  )
  LIMIT 1
)
WHERE id = '9d9e45fb-7908-4faa-82da-aa36c9015fae'
AND user_id IS NULL;

-- Atualizar a função handle_new_user para tratar duplicatas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;