-- Complete Automatic Payment System
-- This connects to the existing wallet system and adds automatic payment logic

-- Table for Professional Payments
CREATE TABLE IF NOT EXISTS pagamentos_profissionais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contemplation_id UUID REFERENCES contemplations(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  total_service_value DECIMAL(10,2) NOT NULL,
  professional_percentage DECIMAL(5,2) DEFAULT 50.00,
  professional_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_validation', 'released', 'paid')),
  release_date TIMESTAMP WITH TIME ZONE,
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Influencer Commissions
CREATE TABLE IF NOT EXISTS comissoes_influenciadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  entry_value DECIMAL(10,2) NOT NULL,
  commission_percentage DECIMAL(5,2) DEFAULT 25.00,
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service pricing table
CREATE TABLE IF NOT EXISTS service_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT UNIQUE NOT NULL,
  entry_value DECIMAL(10,2) NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default service pricing
INSERT INTO service_pricing (service_type, entry_value, total_value, description) VALUES
('fechamento_braco', 500.00, 2500.00, 'Fechamento de Braço'),
('fechamento_perna', 600.00, 3000.00, 'Fechamento de Perna'),
('fechamento_costas', 800.00, 4000.00, 'Fechamento de Costas'),
('protese_parcial', 1000.00, 5000.00, 'Prótese Parcial'),
('protese_total', 1500.00, 7500.00, 'Prótese Total')
ON CONFLICT (service_type) DO NOTHING;

-- Payment logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('professional', 'influencer')),
  payment_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  amount DECIMAL(10,2),
  user_id UUID REFERENCES auth.users(id),
  admin_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pagamentos_profissionais_professional_id ON pagamentos_profissionais(professional_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_profissionais_status ON pagamentos_profissionais(status);
CREATE INDEX IF NOT EXISTS idx_comissoes_influenciadores_influencer_id ON comissoes_influenciadores(influencer_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_influenciadores_status ON comissoes_influenciadores(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_type ON payment_logs(payment_type, payment_id);

-- RLS Policies
ALTER TABLE pagamentos_profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes_influenciadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Professional payments policies
CREATE POLICY "Professionals can view their payments" ON pagamentos_profissionais
  FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Admins can view all professional payments" ON pagamentos_profissionais
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can insert professional payments" ON pagamentos_profissionais
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update professional payments" ON pagamentos_profissionais
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Influencer commissions policies
CREATE POLICY "Influencers can view their commissions" ON comissoes_influenciadores
  FOR SELECT USING (auth.uid() = influencer_id);

CREATE POLICY "Admins can view all influencer commissions" ON comissoes_influenciadores
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can insert influencer commissions" ON comissoes_influenciadores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update influencer commissions" ON comissoes_influenciadores
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Service pricing policies
CREATE POLICY "Everyone can view service pricing" ON service_pricing
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage service pricing" ON service_pricing
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Payment logs policies
CREATE POLICY "Admins can view all payment logs" ON payment_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can insert payment logs" ON payment_logs
  FOR INSERT WITH CHECK (true);

-- Function to process professional payment
CREATE OR REPLACE FUNCTION process_professional_payment(
  p_contemplation_id UUID,
  p_service_type TEXT
)
RETURNS VOID AS $$
DECLARE
  v_contemplation contemplations%ROWTYPE;
  v_service_pricing service_pricing%ROWTYPE;
  v_professional_amount DECIMAL(10,2);
BEGIN
  -- Get contemplation details
  SELECT * INTO v_contemplation
  FROM contemplations
  WHERE id = p_contemplation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contemplation not found';
  END IF;

  -- Get service pricing
  SELECT * INTO v_service_pricing
  FROM service_pricing
  WHERE service_type = p_service_type AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service pricing not found for type: %', p_service_type;
  END IF;

  -- Calculate professional amount (50%)
  v_professional_amount := v_service_pricing.total_value * 0.50;

  -- Insert professional payment
  INSERT INTO pagamentos_profissionais (
    professional_id,
    client_id,
    contemplation_id,
    service_type,
    total_service_value,
    professional_amount,
    status
  ) VALUES (
    v_contemplation.professional_id,
    v_contemplation.user_id,
    p_contemplation_id,
    p_service_type,
    v_service_pricing.total_value,
    v_professional_amount,
    'awaiting_validation'
  );

  -- Log the action
  INSERT INTO payment_logs (
    payment_type,
    payment_id,
    action,
    new_status,
    amount,
    user_id
  ) VALUES (
    'professional',
    (SELECT id FROM pagamentos_profissionais WHERE contemplation_id = p_contemplation_id),
    'created',
    'awaiting_validation',
    v_professional_amount,
    v_contemplation.professional_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to process influencer commission
CREATE OR REPLACE FUNCTION process_influencer_commission(
  p_client_id UUID,
  p_referral_code TEXT,
  p_service_type TEXT
)
RETURNS VOID AS $$
DECLARE
  v_influencer_id UUID;
  v_service_pricing service_pricing%ROWTYPE;
  v_commission_amount DECIMAL(10,2);
BEGIN
  -- Find influencer by referral code
  SELECT user_id INTO v_influencer_id
  FROM referral_links
  WHERE referral_code = p_referral_code;

  IF NOT FOUND THEN
    RETURN; -- No influencer, skip commission
  END IF;

  -- Get service pricing
  SELECT * INTO v_service_pricing
  FROM service_pricing
  WHERE service_type = p_service_type AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service pricing not found for type: %', p_service_type;
  END IF;

  -- Calculate commission amount (25% of entry value)
  v_commission_amount := v_service_pricing.entry_value * 0.25;

  -- Insert influencer commission
  INSERT INTO comissoes_influenciadores (
    influencer_id,
    client_id,
    referral_code,
    entry_value,
    commission_amount,
    status
  ) VALUES (
    v_influencer_id,
    p_client_id,
    p_referral_code,
    v_service_pricing.entry_value,
    v_commission_amount,
    'pending'
  );

  -- Log the action
  INSERT INTO payment_logs (
    payment_type,
    payment_id,
    action,
    new_status,
    amount,
    user_id
  ) VALUES (
    'influencer',
    (SELECT id FROM comissoes_influenciadores 
     WHERE client_id = p_client_id AND referral_code = p_referral_code
     ORDER BY created_at DESC LIMIT 1),
    'created',
    'pending',
    v_commission_amount,
    v_influencer_id
  );

  -- Create notification for influencer
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message
  ) VALUES (
    v_influencer_id,
    'commission',
    'Nova Comissão Disponível!',
    format('Você recebeu uma comissão de R$ %.2f por indicação.', v_commission_amount)
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically process payments when service is confirmed
CREATE OR REPLACE FUNCTION trigger_automatic_payments()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if service was just confirmed
  IF OLD.service_confirmed = false AND NEW.service_confirmed = true THEN
    -- Process professional payment
    PERFORM process_professional_payment(NEW.id, 'fechamento_braco'); -- Default, should be dynamic
    
    -- Process influencer commission if there's a referral code
    IF NEW.referral_code IS NOT NULL THEN
      PERFORM process_influencer_commission(NEW.user_id, NEW.referral_code, 'fechamento_braco');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER automatic_payments_trigger
  AFTER UPDATE ON contemplations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_automatic_payments();

-- Function to release professional payment (admin action)
CREATE OR REPLACE FUNCTION release_professional_payment(
  p_payment_id UUID,
  p_admin_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE pagamentos_profissionais
  SET 
    status = 'released',
    release_date = NOW(),
    updated_at = NOW()
  WHERE id = p_payment_id;

  -- Log the action
  INSERT INTO payment_logs (
    payment_type,
    payment_id,
    action,
    old_status,
    new_status,
    admin_id
  ) VALUES (
    'professional',
    p_payment_id,
    'released',
    'awaiting_validation',
    'released',
    p_admin_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark payment as paid
CREATE OR REPLACE FUNCTION mark_payment_as_paid(
  p_payment_type TEXT,
  p_payment_id UUID,
  p_proof_url TEXT,
  p_admin_id UUID
)
RETURNS VOID AS $$
BEGIN
  IF p_payment_type = 'professional' THEN
    UPDATE pagamentos_profissionais
    SET 
      status = 'paid',
      payment_date = NOW(),
      payment_proof_url = p_proof_url,
      updated_at = NOW()
    WHERE id = p_payment_id;
  ELSIF p_payment_type = 'influencer' THEN
    UPDATE comissoes_influenciadores
    SET 
      status = 'paid',
      payment_date = NOW(),
      payment_proof_url = p_proof_url
    WHERE id = p_payment_id;
  END IF;

  -- Log the action
  INSERT INTO payment_logs (
    payment_type,
    payment_id,
    action,
    old_status,
    new_status,
    admin_id
  ) VALUES (
    p_payment_type,
    p_payment_id,
    'marked_paid',
    CASE p_payment_type 
      WHEN 'professional' THEN 'released'
      WHEN 'influencer' THEN 'pending'
    END,
    'paid',
    p_admin_id
  );
END;
$$ LANGUAGE plpgsql;