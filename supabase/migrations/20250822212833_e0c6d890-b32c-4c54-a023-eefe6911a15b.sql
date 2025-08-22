-- Criar usuário admin diretamente no banco
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'admin@amigodopeito.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Administrador"}'::jsonb
);

-- Criar perfil admin
INSERT INTO profiles (user_id, full_name, email, role, approved, referral_code)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@amigodopeito.com'),
  'Administrador',
  'admin@amigodopeito.com',
  'admin',
  true,
  'ADMIN001'
);