-- Create admin profile for juninhoatitude@hotmail.com
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '16cb1a57-a224-481a-8186-b9cfc39b2f64',
  'juninhoatitude@hotmail.com',
  'Administrador',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = now();