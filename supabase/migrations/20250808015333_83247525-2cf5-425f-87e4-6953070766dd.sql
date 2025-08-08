-- Corrigir lógica de cálculo de comissões de influenciadores
-- Atualmente calculando sobre valor total, mas deve calcular sobre valor de entrada (10%)

-- 1. Verificar se temos tabela comissoes_influenciadores
-- Se não existir, vamos criá-la com a lógica correta

-- Primeiro, vamos criar a tabela com a lógica correta se ela não existir
CREATE TABLE IF NOT EXISTS public.influencer_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.custom_plans(id),
  referral_code TEXT NOT NULL,
  product_total_value DECIMAL(10,2) NOT NULL,
  entry_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- 10% padrão
  entry_value DECIMAL(10,2) NOT NULL, -- Valor da entrada pago pelo cliente
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 25.00, -- 25% sobre entrada
  commission_amount DECIMAL(10,2) NOT NULL, -- Valor calculado: entry_value * (commission_percentage/100)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.influencer_commissions ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Influencers can view their own commissions" 
ON public.influencer_commissions
FOR SELECT 
TO authenticated
USING (auth.uid() = influencer_id);

CREATE POLICY "Admins can view all commissions" 
ON public.influencer_commissions
FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "System can insert commissions" 
ON public.influencer_commissions
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 2. Função para calcular comissão corretamente
CREATE OR REPLACE FUNCTION public.calculate_influencer_commission(
  p_product_total_value DECIMAL,
  p_entry_percentage DECIMAL DEFAULT 10.0,
  p_commission_percentage DECIMAL DEFAULT 25.0
)
RETURNS DECIMAL AS $$
DECLARE
  v_entry_value DECIMAL;
  v_commission_amount DECIMAL;
BEGIN
  -- Calcular valor de entrada (10% do valor total)
  v_entry_value := p_product_total_value * (p_entry_percentage / 100.0);
  
  -- Calcular comissão (25% do valor de entrada)
  v_commission_amount := v_entry_value * (p_commission_percentage / 100.0);
  
  RETURN v_commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 3. Função para criar comissão de influenciador
CREATE OR REPLACE FUNCTION public.create_influencer_commission(
  p_influencer_id UUID,
  p_client_id UUID,
  p_product_id UUID,
  p_referral_code TEXT,
  p_product_total_value DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_entry_value DECIMAL;
  v_commission_amount DECIMAL;
  v_commission_id UUID;
BEGIN
  -- Calcular valor de entrada (10% do total)
  v_entry_value := p_product_total_value * 0.10;
  
  -- Calcular comissão (25% da entrada)
  v_commission_amount := v_entry_value * 0.25;
  
  -- Inserir registro de comissão
  INSERT INTO public.influencer_commissions (
    influencer_id,
    client_id,
    product_id,
    referral_code,
    product_total_value,
    entry_value,
    commission_amount,
    status
  ) VALUES (
    p_influencer_id,
    p_client_id,
    p_product_id,
    p_referral_code,
    p_product_total_value,
    v_entry_value,
    v_commission_amount,
    'pending'
  ) RETURNING id INTO v_commission_id;
  
  -- Criar notificação para o influenciador
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    category
  ) VALUES (
    p_influencer_id,
    'success',
    'Nova Comissão Disponível!',
    format('Você recebeu uma comissão de R$ %.2f por sua indicação. Valor da entrada: R$ %.2f (10%% de R$ %.2f)', 
           v_commission_amount, v_entry_value, p_product_total_value),
    'commission'
  );
  
  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 4. Corrigir função do sistema automático de pagamentos se existir
-- Atualizar process_influencer_commission para usar a lógica correta
DROP FUNCTION IF EXISTS public.process_influencer_commission(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.process_influencer_commission(
  p_client_id UUID,
  p_referral_code TEXT,
  p_product_total_value DECIMAL
)
RETURNS VOID AS $$
DECLARE
  v_influencer_id UUID;
  v_entry_value DECIMAL;
  v_commission_amount DECIMAL;
BEGIN
  -- Encontrar influenciador pelo código de referral
  SELECT user_id INTO v_influencer_id
  FROM public.mlm_network
  WHERE referral_code = p_referral_code
  AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN; -- Nenhum influenciador encontrado, pular comissão
  END IF;
  
  -- Calcular valor de entrada (10% do total)
  v_entry_value := p_product_total_value * 0.10;
  
  -- Calcular comissão (25% da entrada)
  v_commission_amount := v_entry_value * 0.25;
  
  -- Inserir comissão de influenciador
  INSERT INTO public.influencer_commissions (
    influencer_id,
    client_id,
    referral_code,
    product_total_value,
    entry_value,
    commission_amount,
    status
  ) VALUES (
    v_influencer_id,
    p_client_id,
    p_referral_code,
    p_product_total_value,
    v_entry_value,
    v_commission_amount,
    'pending'
  );
  
  -- Criar notificação
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    category
  ) VALUES (
    v_influencer_id,
    'success',
    'Nova Comissão Disponível!',
    format('Você recebeu uma comissão de R$ %.2f por sua indicação. Comissão calculada sobre entrada de R$ %.2f', 
           v_commission_amount, v_entry_value),
    'commission'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_influencer_commissions_influencer_id 
ON public.influencer_commissions(influencer_id);

CREATE INDEX IF NOT EXISTS idx_influencer_commissions_status 
ON public.influencer_commissions(status);

CREATE INDEX IF NOT EXISTS idx_influencer_commissions_referral_code 
ON public.influencer_commissions(referral_code);

-- 6. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_influencer_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_influencer_commissions_updated_at
  BEFORE UPDATE ON public.influencer_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_influencer_commissions_updated_at();