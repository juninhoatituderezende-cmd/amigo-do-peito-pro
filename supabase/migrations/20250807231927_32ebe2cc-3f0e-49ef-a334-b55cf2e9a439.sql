-- Expandir sistema MLM (Min) com estrutura completa
-- Primeiro, vamos manter a tabela indicacoes existente e criar uma nova mais robusta

-- Criar tabela principal do sistema Min (rede MLM)
CREATE TABLE public.mlm_network (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 9),
  position_in_level INTEGER NOT NULL DEFAULT 1,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  active_referrals INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Criar tabela para histórico de indicações
CREATE TABLE public.mlm_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_used TEXT NOT NULL,
  commission_earned NUMERIC NOT NULL DEFAULT 0,
  commission_percentage NUMERIC NOT NULL DEFAULT 10.0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referrer_id, referred_id)
);

-- Criar tabela para comissões detalhadas
CREATE TABLE public.mlm_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.mlm_referrals(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 9),
  amount NUMERIC NOT NULL,
  percentage NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'referral' CHECK (type IN ('referral', 'bonus', 'override')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.mlm_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlm_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlm_commissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para mlm_network
CREATE POLICY "Users can view their own MLM data" ON public.mlm_network
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MLM data" ON public.mlm_network
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MLM data" ON public.mlm_network
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all MLM network data" ON public.mlm_network
  FOR ALL USING (is_admin());

-- Políticas RLS para mlm_referrals
CREATE POLICY "Users can view their referrals" ON public.mlm_referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals where they are the referrer" ON public.mlm_referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update their own referrals" ON public.mlm_referrals
  FOR UPDATE USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all referrals" ON public.mlm_referrals
  FOR ALL USING (is_admin());

-- Políticas RLS para mlm_commissions
CREATE POLICY "Users can view their own commissions" ON public.mlm_commissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all commissions" ON public.mlm_commissions
  FOR ALL USING (is_admin());

-- Função para gerar código de indicação único
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Gerar código de 8 caracteres: MIN + 5 caracteres aleatórios
    code := 'MIN' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM public.mlm_network WHERE referral_code = code) INTO exists_code;
    
    -- Se não existe, usar este código
    IF NOT exists_code THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Trigger para gerar código de indicação automático
CREATE OR REPLACE FUNCTION public.handle_mlm_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON public.mlm_network
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_mlm_referral_code();

-- Função para calcular nível do usuário na rede
CREATE OR REPLACE FUNCTION calculate_mlm_level(referred_by UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  parent_level INTEGER;
BEGIN
  -- Se não tem referenciador, é nível 1
  IF referred_by IS NULL THEN
    RETURN 1;
  END IF;
  
  -- Buscar nível do referenciador
  SELECT level INTO parent_level 
  FROM public.mlm_network 
  WHERE user_id = referred_by;
  
  -- Se não encontrar, assumir nível 1
  IF parent_level IS NULL THEN
    RETURN 1;
  END IF;
  
  -- Retornar nível do pai + 1 (máximo 9)
  RETURN LEAST(parent_level + 1, 9);
END;
$$;

-- Trigger para calcular nível automaticamente
CREATE OR REPLACE FUNCTION public.handle_mlm_level_calculation()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular nível baseado no referenciador
  NEW.level := calculate_mlm_level(NEW.referred_by_user_id);
  
  -- Calcular posição no nível (simplificado por agora)
  NEW.position_in_level := COALESCE(
    (SELECT COUNT(*) + 1 
     FROM public.mlm_network 
     WHERE level = NEW.level 
     AND created_at < NEW.created_at), 
    1
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_mlm_level
  BEFORE INSERT ON public.mlm_network
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_mlm_level_calculation();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_mlm_network_updated_at
  BEFORE UPDATE ON public.mlm_network
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para processar nova indicação
CREATE OR REPLACE FUNCTION public.process_mlm_referral(
  new_user_id UUID,
  referral_code_used TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_user_id UUID;
  commission_amount NUMERIC := 50.0; -- Comissão padrão
BEGIN
  -- Encontrar o referenciador pelo código
  SELECT user_id INTO referrer_user_id
  FROM public.mlm_network
  WHERE referral_code = referral_code_used
  AND status = 'active';
  
  -- Se não encontrar referenciador válido, falhar
  IF referrer_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Criar entrada na rede MLM para o novo usuário
  INSERT INTO public.mlm_network (
    user_id,
    referred_by_user_id,
    status
  ) VALUES (
    new_user_id,
    referrer_user_id,
    'active'
  );
  
  -- Criar registro de indicação
  INSERT INTO public.mlm_referrals (
    referrer_id,
    referred_id,
    referral_code_used,
    commission_earned,
    status
  ) VALUES (
    referrer_user_id,
    new_user_id,
    referral_code_used,
    commission_amount,
    'confirmed'
  );
  
  -- Atualizar contador de indicações do referenciador
  UPDATE public.mlm_network 
  SET 
    total_referrals = total_referrals + 1,
    active_referrals = active_referrals + 1,
    total_earnings = total_earnings + commission_amount,
    updated_at = now()
  WHERE user_id = referrer_user_id;
  
  RETURN TRUE;
END;
$$;