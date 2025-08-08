-- Função para criar administrador
CREATE OR REPLACE FUNCTION create_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT 'Administrador',
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  new_user_id UUID;
  salt TEXT;
  encrypted_password TEXT;
  result JSON;
BEGIN
  -- Verificar se o email já existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário já existe com este email'
    );
  END IF;

  -- Gerar novo UUID para o usuário
  new_user_id := gen_random_uuid();
  
  -- Gerar salt e criptografar senha (método simplificado)
  salt := encode(gen_random_bytes(16), 'hex');
  encrypted_password := crypt(p_password, salt);

  -- Inserir usuário na tabela auth.users (usando service role)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    role,
    aud
  ) VALUES (
    new_user_id,
    p_email,
    encrypted_password,
    now(),
    now(),
    now(),
    json_build_object('full_name', p_full_name, 'role', 'admin'),
    'authenticated',
    'authenticated'
  );

  -- Inserir na tabela profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    p_email,
    p_full_name,
    p_phone,
    'admin',
    now(),
    now()
  );

  -- Inserir na rede MLM (obrigatório)
  INSERT INTO public.mlm_network (
    user_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'active',
    now(),
    now()
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Inserir créditos do usuário
  INSERT INTO public.user_credits (
    user_id,
    available_credits,
    total_credits,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    0,
    0,
    now(),
    now()
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Retornar resultado de sucesso
  result := json_build_object(
    'success', true,
    'message', 'Administrador cadastrado com sucesso',
    'user_id', new_user_id,
    'email', p_email,
    'role', 'admin',
    'status', 'ativo',
    'permissions', json_build_array(
      'Gerenciamento de usuários e profissionais',
      'Produtos e marketplace',
      'Pagamentos e configurações de split',
      'Relatórios e auditoria do sistema'
    ),
    'access_level', 'total',
    'created_at', now()
  );

  RETURN result;

EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'details', 'Falha ao cadastrar administrador'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION create_admin_user TO service_role;

-- Criar o administrador
SELECT create_admin_user(
  'charlesink1996@gmail.com',
  'Arthur123#',
  'Charles Administrador',
  NULL
) as result;