-- Remover produto de teste
DELETE FROM marketplace_products WHERE name = 'Produto Teste Admin';

-- Atualizar função is_user_admin com search_path para segurança
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;