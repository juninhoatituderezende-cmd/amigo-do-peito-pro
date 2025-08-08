-- Teste de inserção de produto para verificar se as políticas RLS estão funcionando
-- Este é apenas um teste, o produto será removido após confirmação

INSERT INTO marketplace_products (
  name,
  description,
  category,
  valor_total,
  percentual_entrada,
  target_audience,
  approved,
  ativo,
  created_by,
  approved_by,
  approved_at
) VALUES (
  'Produto Teste Admin',
  'Produto criado para testar persistência de dados',
  'Teste',
  100.00,
  10.0,
  'user',
  true,
  true,
  '6d28bc77-efbb-4ef7-91ac-4f275e26601c',
  '6d28bc77-efbb-4ef7-91ac-4f275e26601c',
  NOW()
);

-- Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Atualizar políticas RLS para serem mais específicas
DROP POLICY IF EXISTS "Admins can manage all products" ON marketplace_products;
DROP POLICY IF EXISTS "Only admins can create marketplace products" ON marketplace_products;
DROP POLICY IF EXISTS "Only admins can update marketplace products" ON marketplace_products;

-- Criar novas políticas mais robustas
CREATE POLICY "Admin full access to marketplace products"
ON marketplace_products
FOR ALL
TO authenticated
USING (is_user_admin())
WITH CHECK (is_user_admin());

-- Política para permitir que qualquer usuário autenticado veja produtos aprovados e ativos
CREATE POLICY "Anyone can view active approved products"
ON marketplace_products
FOR SELECT
TO authenticated
USING (approved = true AND ativo = true);