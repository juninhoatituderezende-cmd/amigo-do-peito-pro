-- Criar usuário admin para acesso ao sistema
INSERT INTO auth.users (
  id, 
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'juninhoatitude@hotmail.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  ''
);

-- Criar perfil para o admin
INSERT INTO profiles (
  id,
  user_id, 
  email,
  full_name,
  role,
  approved,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'juninhoatitude@hotmail.com',
  'Administrador Sistema',
  'admin',
  true,
  now(),
  now()
);

-- Criar entrada na rede MLM
INSERT INTO mlm_network (
  id,
  user_id,
  referrer_id,
  level,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  null,
  1,
  now()
);

-- Criar créditos para o admin
INSERT INTO user_credits (
  id,
  user_id,
  total_credits,
  available_credits,
  pending_credits,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  0,
  0,
  0,
  now(),
  now()
);