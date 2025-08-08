-- Sistema completo de subcontas ASAAS para split de pagamentos

-- Tabela para subcontas ASAAS dos profissionais
CREATE TABLE public.asaas_subaccounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  asaas_account_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked', 'rejected')),
  cpf_cnpj TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_date DATE,
  company_type TEXT CHECK (company_type IN ('MEI', 'EI', 'EIRELI', 'LTDA', 'SA') OR company_type IS NULL),
  address_street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_complement TEXT,
  address_district TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  address_postal_code TEXT NOT NULL,
  bank_account_type TEXT CHECK (bank_account_type IN ('CONTA_CORRENTE', 'CONTA_POUPANCA')),
  bank_code TEXT,
  bank_account_number TEXT,
  bank_account_digit TEXT,
  bank_agency TEXT,
  pix_key TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_notes TEXT,
  documents_uploaded BOOLEAN NOT NULL DEFAULT false,
  kyc_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- Tabela para split rules dos produtos/serviços
CREATE TABLE public.payment_split_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.marketplace_products(id),
  service_id UUID REFERENCES public.services(id),
  professional_percentage NUMERIC NOT NULL DEFAULT 70.0 CHECK (professional_percentage >= 0 AND professional_percentage <= 100),
  platform_percentage NUMERIC NOT NULL DEFAULT 30.0 CHECK (platform_percentage >= 0 AND platform_percentage <= 100),
  influencer_percentage NUMERIC NOT NULL DEFAULT 10.0 CHECK (influencer_percentage >= 0 AND influencer_percentage <= 100),
  fixed_platform_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((product_id IS NOT NULL AND service_id IS NULL) OR (product_id IS NULL AND service_id IS NOT NULL)),
  CHECK (professional_percentage + platform_percentage + influencer_percentage <= 100)
);

-- Tabela para histórico de splits executados
CREATE TABLE public.payment_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id),
  asaas_payment_id TEXT NOT NULL,
  professional_id UUID REFERENCES public.professionals(id),
  influencer_id UUID REFERENCES public.influencers(id),
  total_amount NUMERIC NOT NULL,
  professional_amount NUMERIC NOT NULL DEFAULT 0,
  platform_amount NUMERIC NOT NULL DEFAULT 0,
  influencer_amount NUMERIC NOT NULL DEFAULT 0,
  split_executed BOOLEAN NOT NULL DEFAULT false,
  split_executed_at TIMESTAMPTZ,
  split_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes para performance
CREATE INDEX idx_asaas_subaccounts_professional ON public.asaas_subaccounts(professional_id);
CREATE INDEX idx_asaas_subaccounts_status ON public.asaas_subaccounts(status);
CREATE INDEX idx_asaas_subaccounts_asaas_id ON public.asaas_subaccounts(asaas_account_id);
CREATE INDEX idx_payment_split_rules_product ON public.payment_split_rules(product_id);
CREATE INDEX idx_payment_split_rules_service ON public.payment_split_rules(service_id);
CREATE INDEX idx_payment_splits_payment ON public.payment_splits(payment_id);
CREATE INDEX idx_payment_splits_asaas_payment ON public.payment_splits(asaas_payment_id);

-- RLS Policies
ALTER TABLE public.asaas_subaccounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_split_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;

-- Policies para asaas_subaccounts
CREATE POLICY "Admins can manage all subaccounts" ON public.asaas_subaccounts
  FOR ALL USING (is_user_admin());

CREATE POLICY "Professionals can view their own subaccount" ON public.asaas_subaccounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.professionals p 
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can insert their own subaccount" ON public.asaas_subaccounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professionals p 
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- Policies para payment_split_rules
CREATE POLICY "Admins can manage split rules" ON public.payment_split_rules
  FOR ALL USING (is_user_admin());

CREATE POLICY "Authenticated users can view split rules" ON public.payment_split_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies para payment_splits
CREATE POLICY "Admins can view all payment splits" ON public.payment_splits
  FOR SELECT USING (is_user_admin());

CREATE POLICY "Service role can manage payment splits" ON public.payment_splits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Professionals can view splits of their payments" ON public.payment_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.professionals p 
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_asaas_subaccounts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_asaas_subaccounts_updated_at
  BEFORE UPDATE ON public.asaas_subaccounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_asaas_subaccounts();

CREATE TRIGGER trigger_update_payment_split_rules_updated_at
  BEFORE UPDATE ON public.payment_split_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para validar CPF/CNPJ
CREATE OR REPLACE FUNCTION validate_cpf_cnpj(document TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remove caracteres não numéricos
  document := regexp_replace(document, '[^0-9]', '', 'g');
  
  -- Verifica se é CPF (11 dígitos) ou CNPJ (14 dígitos)
  IF length(document) NOT IN (11, 14) THEN
    RETURN FALSE;
  END IF;
  
  -- Validação básica para documentos inválidos conhecidos
  IF document ~ '^(.)\1*$' THEN
    RETURN FALSE; -- Todos os dígitos iguais
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar split rules
CREATE OR REPLACE FUNCTION get_split_rules(p_product_id UUID DEFAULT NULL, p_service_id UUID DEFAULT NULL)
RETURNS TABLE(
  professional_percentage NUMERIC,
  platform_percentage NUMERIC,
  influencer_percentage NUMERIC,
  fixed_platform_fee NUMERIC
) AS $$
BEGIN
  -- Buscar regras específicas primeiro
  IF p_product_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      r.professional_percentage,
      r.platform_percentage,
      r.influencer_percentage,
      r.fixed_platform_fee
    FROM public.payment_split_rules r
    WHERE r.product_id = p_product_id
    LIMIT 1;
    
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  IF p_service_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      r.professional_percentage,
      r.platform_percentage,
      r.influencer_percentage,
      r.fixed_platform_fee
    FROM public.payment_split_rules r
    WHERE r.service_id = p_service_id
    LIMIT 1;
    
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  -- Retorna valores padrão se não encontrar regras específicas
  RETURN QUERY
  SELECT 
    70.0::NUMERIC as professional_percentage,
    20.0::NUMERIC as platform_percentage,
    10.0::NUMERIC as influencer_percentage,
    0.0::NUMERIC as fixed_platform_fee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;