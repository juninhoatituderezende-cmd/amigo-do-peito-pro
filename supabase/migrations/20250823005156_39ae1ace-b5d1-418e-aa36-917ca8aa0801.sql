-- 1. Adicionar constraint única para email + role na tabela profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS unique_email_role;
ALTER TABLE profiles ADD CONSTRAINT unique_email_role UNIQUE (email, role);

-- 2. Criar função para validar email único por tipo de conta
CREATE OR REPLACE FUNCTION validate_unique_email_by_role(check_email text, check_role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica se já existe email com esse role
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE email = check_email 
    AND role = check_role
  );
END;
$$;

-- 3. Criar função para verificar tipo de conta existente para um email
CREATE OR REPLACE FUNCTION get_existing_account_types(check_email text)
RETURNS TABLE(account_type user_role, account_id uuid, approved boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.role, p.id, p.approved
  FROM profiles p
  WHERE p.email = check_email;
END;
$$;

-- 4. Criar função para login com validação de tipo de conta
CREATE OR REPLACE FUNCTION login_with_account_type(login_email text, requested_role user_role)
RETURNS TABLE(
  profile_id uuid, 
  user_id uuid,
  email text, 
  full_name text, 
  role user_role,
  approved boolean,
  valid_login boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se existe conta com esse email e role
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.full_name,
    p.role,
    p.approved,
    CASE 
      WHEN p.role = requested_role THEN true
      ELSE false
    END as valid_login,
    CASE 
      WHEN p.role IS NULL THEN 'Email não encontrado'
      WHEN p.role != requested_role THEN 'Tipo de conta incorreto para este email'
      WHEN p.approved = false THEN 'Conta aguardando aprovação'
      ELSE 'Login válido'
    END as error_message
  FROM profiles p
  WHERE p.email = login_email
  LIMIT 1;
  
  -- Se não encontrou nenhum resultado, retornar erro
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      null::uuid, null::uuid, login_email, null::text, null::user_role, false, false, 
      'Email não encontrado no sistema'::text;
  END IF;
END;
$$;