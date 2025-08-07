-- Criar tabela de materiais para upload
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'pdf', 'document')),
  url TEXT NOT NULL,
  qr_code_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de planos customizados
CREATE TABLE public.custom_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT NOT NULL,
  total_price NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 9,
  professional_id UUID REFERENCES public.professionals(id),
  allow_professional_choice BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  benefits JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  public_enrollment BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de contemplações
CREATE TABLE public.contemplations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  contemplated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  service_type TEXT NOT NULL,
  professional_id UUID REFERENCES public.professionals(id),
  professional_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'revoked')),
  voucher_code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_commission NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de logs de pagamento para auditoria
CREATE TABLE public.payment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('professional', 'influencer')),
  payment_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  amount NUMERIC,
  user_id UUID REFERENCES auth.users(id),
  admin_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de grupos para planos customizados
CREATE TABLE public.plan_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.custom_plans(id) ON DELETE CASCADE,
  group_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'forming' CHECK (status IN ('forming', 'full', 'completed')),
  current_participants INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, group_number)
);

-- Criar tabela de participantes em grupos
CREATE TABLE public.plan_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.plan_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_id UUID NOT NULL REFERENCES public.custom_plans(id),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  contemplation_status TEXT NOT NULL DEFAULT 'waiting' CHECK (contemplation_status IN ('waiting', 'contemplated', 'expired')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contemplation_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contemplations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_participants ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para materials
CREATE POLICY "Admins can manage all materials" ON public.materials
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active materials" ON public.materials
  FOR SELECT USING (is_active = true);

-- Políticas RLS para custom_plans
CREATE POLICY "Admins can manage all custom plans" ON public.custom_plans
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active plans" ON public.custom_plans
  FOR SELECT USING (active = true AND public_enrollment = true);

-- Políticas RLS para contemplations
CREATE POLICY "Admins can manage all contemplations" ON public.contemplations
  FOR ALL USING (is_admin());

CREATE POLICY "Users can view their own contemplations" ON public.contemplations
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas RLS para payment_logs
CREATE POLICY "Admins can view all payment logs" ON public.payment_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "Service role can manage payment logs" ON public.payment_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas RLS para plan_groups
CREATE POLICY "Admins can manage all plan groups" ON public.plan_groups
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view plan groups" ON public.plan_groups
  FOR SELECT USING (true);

-- Políticas RLS para plan_participants
CREATE POLICY "Admins can manage all plan participants" ON public.plan_participants
  FOR ALL USING (is_admin());

CREATE POLICY "Users can view their own participation" ON public.plan_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own participation" ON public.plan_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Criar função para gerar código de plano
CREATE OR REPLACE FUNCTION generate_plan_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Gerar código aleatório de 6 caracteres
    code := 'PLAN' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM public.custom_plans WHERE plan_code = code) INTO exists_code;
    
    -- Se não existe, usar este código
    IF NOT exists_code THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Trigger para gerar código automático
CREATE OR REPLACE FUNCTION public.handle_plan_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_code IS NULL OR NEW.plan_code = '' THEN
    NEW.plan_code := generate_plan_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_plan_code
  BEFORE INSERT ON public.custom_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_plan_code();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_plans_updated_at
  BEFORE UPDATE ON public.custom_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contemplations_updated_at
  BEFORE UPDATE ON public.contemplations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_groups_updated_at
  BEFORE UPDATE ON public.plan_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_participants_updated_at
  BEFORE UPDATE ON public.plan_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();