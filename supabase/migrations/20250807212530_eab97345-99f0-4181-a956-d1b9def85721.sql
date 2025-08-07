-- Habilitar RLS nas tabelas críticas
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela indicacoes
CREATE POLICY "Users can view their own referrals" ON public.indicacoes
  FOR SELECT USING (
    auth.uid() = indicado_por_id OR 
    auth.uid() = indicado_id
  );

CREATE POLICY "Users can create referrals where they are the referrer" ON public.indicacoes
  FOR INSERT WITH CHECK (auth.uid() = indicado_por_id);

-- Políticas para tabela participacoes
CREATE POLICY "Users can view their own participations" ON public.participacoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own participations" ON public.participacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participations" ON public.participacoes
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para tabela users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas administrativas (para usuários com role admin)
-- Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'admin@amigodopeito.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas administrativas para todas as tabelas
CREATE POLICY "Admins can view all indicacoes" ON public.indicacoes
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage all participacoes" ON public.participacoes
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());