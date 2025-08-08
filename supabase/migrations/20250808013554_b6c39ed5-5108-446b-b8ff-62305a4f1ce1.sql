-- 1. LIMPEZA DE DADOS DE TESTE
-- Remover usuário de teste específico identificado
DELETE FROM public.users WHERE nome = 'João da Silva' AND email = 'joao@email.com';

-- Remover outros possíveis dados de teste
DELETE FROM public.users WHERE 
  nome ILIKE '%test%' OR 
  nome ILIKE '%demo%' OR 
  email ILIKE '%test%' OR 
  email ILIKE '%demo%' OR
  email ILIKE '%example%';

-- Limpar dados órfãos relacionados
DELETE FROM public.professionals WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.influencers WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.mlm_network WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.user_credits WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 2. CRIAR SISTEMA DE PERFIS CENTRALIZADO
-- Criar tabela de perfis principal se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'professional', 'influencer', 'user')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS PARA PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 4. TRIGGER PARA CRIAÇÃO AUTOMÁTICA DE PERFIL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Criar perfil básico na tabela profiles
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  
  -- Criar entrada no MLM network para todos os usuários
  INSERT INTO public.mlm_network (user_id, status)
  VALUES (NEW.id, 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Criar entrada de créditos
  INSERT INTO public.user_credits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. CORRIGIR RLS EM TABELAS RELACIONADAS
-- Garantir que MLM network está com RLS correto
DROP POLICY IF EXISTS "Users can view their MLM network" ON public.mlm_network;
CREATE POLICY "Users can view their MLM network"
ON public.mlm_network
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Garantir que créditos estão com RLS correto  
DROP POLICY IF EXISTS "Users can view their credits" ON public.user_credits;
CREATE POLICY "Users can view their credits"
ON public.user_credits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 6. FUNÇÃO PARA OBTER ROLE DO USUÁRIO ATUAL
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;