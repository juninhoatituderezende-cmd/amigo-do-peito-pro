-- Inserir o usuário na tabela users
INSERT INTO public.users (id, email, nome) 
VALUES ('16cb1a57-a224-481a-8186-b9cfc39b2f64', 'juninhoatitude@hotmail.com', 'Usuário')
ON CONFLICT (id) DO NOTHING;