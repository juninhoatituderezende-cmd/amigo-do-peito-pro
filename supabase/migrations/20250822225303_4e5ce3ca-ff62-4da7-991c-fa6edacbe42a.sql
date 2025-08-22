-- Primeiro, vamos verificar se os usuários existem na tabela auth
-- e criar os perfis admin necessários

-- Inserir perfil admin para charlesink1996@gmail.com se não existir
INSERT INTO profiles (id, email, full_name, role) 
SELECT 
  gen_random_uuid(),
  'charlesink1996@gmail.com',
  'Admin Charles',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'charlesink1996@gmail.com'
);

-- Inserir perfil admin para juninhoatitude@hotmail.com se não existir  
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  gen_random_uuid(),
  'juninhoatitude@hotmail.com', 
  'Admin Juninho',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'juninhoatitude@hotmail.com'
);

-- Para permitir que o sistema funcione sem usuários auth existentes,
-- vamos criar uma função que faz login apenas validando o email/senha na tabela profiles
CREATE OR REPLACE FUNCTION public.admin_login_validation(
  login_email text,
  login_password text
)
RETURNS TABLE(
  profile_id uuid,
  profile_email text,
  profile_name text,
  profile_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Para demonstração, vamos aceitar senhas específicas para os admins
  IF (login_email = 'charlesink1996@gmail.com' AND login_password = 'Arthur1234!') OR
     (login_email = 'juninhoatitude@hotmail.com' AND login_password = 'Atitude2025@') THEN
    
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.role::text
    FROM profiles p
    WHERE p.email = login_email AND p.role = 'admin';
    
  END IF;
END;
$$;