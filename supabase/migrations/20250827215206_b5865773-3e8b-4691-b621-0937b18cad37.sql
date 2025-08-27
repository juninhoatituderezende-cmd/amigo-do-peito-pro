-- Adicionar coluna avatar_url na tabela profiles para suportar fotos de perfil
ALTER TABLE public.profiles 
ADD COLUMN avatar_url TEXT;

-- Comentário sobre o uso
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da foto de perfil do usuário (pode ser do storage do Supabase ou URL externa)';