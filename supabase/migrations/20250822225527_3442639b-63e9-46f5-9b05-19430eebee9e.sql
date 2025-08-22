-- Atualizar o perfil existente para admin
UPDATE profiles 
SET role = 'admin', full_name = 'Admin Juninho'
WHERE email = 'juninhoatitude@hotmail.com';