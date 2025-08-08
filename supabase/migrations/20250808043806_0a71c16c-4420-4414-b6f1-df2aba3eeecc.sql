-- Método alternativo para criar administrador usando função simples
CREATE OR REPLACE FUNCTION create_admin_simple()
RETURNS void AS $$
DECLARE
  new_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; -- UUID fixo para este admin
BEGIN
  -- Inserir diretamente na tabela profiles
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
    'charlesink1996@gmail.com',
    'Charles Administrador',
    NULL,
    'admin',
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();

  -- Inserir na rede MLM
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

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar função
SELECT create_admin_simple();