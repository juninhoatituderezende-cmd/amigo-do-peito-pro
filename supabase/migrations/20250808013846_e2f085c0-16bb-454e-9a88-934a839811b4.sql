-- Corrigir políticas RLS para garantir que apenas usuários autenticados acessem dados

-- 1. Corrigir todas as políticas que permitem acesso anônimo
-- Remover políticas que permitem 'anon' ou qualquer acesso não autenticado

-- Tabela profiles - garantir acesso apenas autenticado
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. Corrigir políticas de outras tabelas críticas
-- MLM Network
DROP POLICY IF EXISTS "Users can view their MLM network" ON public.mlm_network;
CREATE POLICY "Authenticated users can view their MLM network"
ON public.mlm_network
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- User Credits
DROP POLICY IF EXISTS "Users can view their credits" ON public.user_credits;
CREATE POLICY "Authenticated users can view their credits"
ON public.user_credits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Authenticated users can view their notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Adicionar função para verificar administradores com base na nova estrutura
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$function$;

-- 4. Atualizar políticas administrativas para usar a nova função
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin_user());

-- 5. Garantir que dados de teste antigos não retornem
-- Verificar se há dados sem referência para usuários autenticados
DELETE FROM public.mlm_network WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.user_credits WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.notifications WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 6. Corrigir função is_admin() para usar a nova estrutura
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$function$;