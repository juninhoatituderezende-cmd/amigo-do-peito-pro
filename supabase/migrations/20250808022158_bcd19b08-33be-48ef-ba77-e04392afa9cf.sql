-- Create admin profile for existing admin user
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '6d28bc77-efbb-4ef7-91ac-4f275e26601c',
  'admin@amigodopeito.com',
  'Administrador',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = now();