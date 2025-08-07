-- Inserir usuário admin diretamente no Supabase Auth
-- IMPORTANTE: Esta é uma abordagem temporária. 
-- Idealmente, o admin deve ser criado através da interface de auth do Supabase

-- Nota: Como não podemos inserir diretamente em auth.users via SQL,
-- vamos criar um trigger que detecta quando um usuário admin faz login pela primeira vez
-- e automaticamente concede permissões admin

-- Criar tabela para armazenar configurações de admin
CREATE TABLE IF NOT EXISTS public.admin_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Inserir email de admin permitido
INSERT INTO public.admin_configs (admin_email) 
VALUES ('admin@amigodopeito.com')
ON CONFLICT (admin_email) DO NOTHING;

-- Habilitar RLS na tabela admin_configs
ALTER TABLE public.admin_configs ENABLE ROW LEVEL SECURITY;

-- Permitir que apenas admins vejam as configurações
CREATE POLICY "Only admins can view admin configs" ON public.admin_configs
  FOR SELECT USING (public.is_admin());

-- Atualizar função is_admin para usar a tabela de configurações
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Obter email do usuário atual
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Verificar se o email está na lista de admins ativos
  RETURN EXISTS (
    SELECT 1 FROM public.admin_configs 
    WHERE admin_email = user_email 
    AND is_active = true
  );
END;
$$;