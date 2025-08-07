-- Remove UNIQUE constraint do email na tabela users
-- O Supabase Auth já gerencia a unicidade de emails
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;