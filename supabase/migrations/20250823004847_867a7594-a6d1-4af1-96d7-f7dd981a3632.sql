-- Converter juninhoatitude@hotmail.com para admin
UPDATE profiles 
SET 
  role = 'admin',
  full_name = 'Administrador Sistema',
  approved = true
WHERE email = 'juninhoatitude@hotmail.com';

-- Verificar se foi atualizado
SELECT id, email, role, full_name FROM profiles WHERE email = 'juninhoatitude@hotmail.com';