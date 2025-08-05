-- MLM System Database Setup
-- This creates all tables needed for the MLM group system

-- 1. Products table (maps to Stripe products)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  full_value INTEGER NOT NULL, -- valor cheio em centavos (ex: 400000 = R$4000)
  entry_value INTEGER NOT NULL, -- valor entrada em centavos (ex: 40000 = R$400)
  product_code TEXT UNIQUE NOT NULL, -- código identificador
  category TEXT NOT NULL, -- 'tattoo' ou 'dental'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Groups table (grupos de 10 pessoas)
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) NOT NULL, -- comprador inicial
  current_count INTEGER DEFAULT 1, -- começa com 1 (o comprador)
  max_count INTEGER DEFAULT 10, -- máximo 10 pessoas
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  referral_code TEXT UNIQUE NOT NULL, -- código único para indicações
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Group members table (membros do grupo)
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  referred_by UUID REFERENCES auth.users(id), -- quem indicou (NULL para o comprador inicial)
  position INTEGER NOT NULL, -- posição no grupo (1-10)
  payment_id UUID, -- referência ao pagamento do Stripe
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id),
  UNIQUE(group_id, position)
);

-- 4. Referrals table (indicações)
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) NOT NULL, -- quem indicou
  referred_id UUID REFERENCES auth.users(id) NOT NULL, -- quem foi indicado
  group_id UUID REFERENCES public.groups(id) NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'expired')),
  clicked_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  UNIQUE(referred_id, group_id) -- uma pessoa só pode entrar uma vez no mesmo grupo
);

-- 5. User purchases table (compras dos usuários)
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  group_id UUID REFERENCES public.groups(id) NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_paid INTEGER NOT NULL, -- valor pago em centavos
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'contemplated')),
  is_contemplated BOOLEAN DEFAULT false, -- true quando o grupo completa
  contemplated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir os produtos fixos
INSERT INTO public.products (stripe_product_id, stripe_price_id, name, full_value, entry_value, product_code, category) VALUES
-- Tatuagem
('prod_tattoo_arm', 'price_tattoo_arm', 'Fechamento de Braço', 400000, 40000, 'TATTOO_ARM', 'tattoo'),
('prod_tattoo_leg', 'price_tattoo_leg', 'Fechamento de Perna', 600000, 60000, 'TATTOO_LEG', 'tattoo'),
('prod_tattoo_back', 'price_tattoo_back', 'Fechamento de Costas', 800000, 80000, 'TATTOO_BACK', 'tattoo'),
-- Dental
('prod_dental_10', 'price_dental_10', 'Prótese 10 Dentes (Superior)', 500000, 50000, 'DENTAL_10', 'dental'),
('prod_dental_20', 'price_dental_20', 'Prótese 20 Dentes (Superior + Inferior)', 900000, 90000, 'DENTAL_20', 'dental');

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Products (público para leitura)
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT TO authenticated, anon
  USING (active = true);

-- Groups (usuário pode ver seus próprios grupos e grupos onde é membro)
CREATE POLICY "groups_select_own" ON public.groups
  FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid() OR 
    id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "groups_update_own" ON public.groups
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid());

-- Group members (pode ver membros dos grupos onde participa)
CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    group_id IN (SELECT id FROM public.groups WHERE buyer_id = auth.uid()) OR
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

-- Referrals (pode ver suas próprias indicações)
CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- User purchases (pode ver suas próprias compras)
CREATE POLICY "user_purchases_select_own" ON public.user_purchases
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_purchases_update_own" ON public.user_purchases
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Policies para service role (edge functions)
CREATE POLICY "service_role_all_groups" ON public.groups
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "service_role_all_group_members" ON public.group_members
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "service_role_all_referrals" ON public.referrals
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "service_role_all_purchases" ON public.user_purchases
  FOR ALL TO service_role
  USING (true);

-- Indexes para performance
CREATE INDEX idx_groups_buyer_id ON public.groups(buyer_id);
CREATE INDEX idx_groups_referral_code ON public.groups(referral_code);
CREATE INDEX idx_groups_status ON public.groups(status);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX idx_user_purchases_user_id ON public.user_purchases(user_id);
CREATE INDEX idx_user_purchases_group_id ON public.user_purchases(group_id);

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check and complete groups
CREATE OR REPLACE FUNCTION check_group_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se o grupo atingiu 10 membros
  IF (SELECT current_count FROM public.groups WHERE id = NEW.group_id) >= 10 THEN
    -- Marca o grupo como completo
    UPDATE public.groups 
    SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE id = NEW.group_id;
    
    -- Marca todas as compras do grupo como contempladas
    UPDATE public.user_purchases 
    SET status = 'contemplated', is_contemplated = true, contemplated_at = now(), updated_at = now()
    WHERE group_id = NEW.group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar conclusão de grupos
CREATE TRIGGER trigger_check_group_completion
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION check_group_completion();

-- Function to update group count
CREATE OR REPLACE FUNCTION update_group_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups 
    SET current_count = current_count + 1, updated_at = now()
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups 
    SET current_count = current_count - 1, updated_at = now()
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contagem de membros
CREATE TRIGGER trigger_update_group_count
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_count();