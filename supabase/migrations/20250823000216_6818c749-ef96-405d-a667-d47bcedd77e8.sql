-- Configurar regras padrão de divisão de comissões (50% profissional)
INSERT INTO payment_split_rules (
  service_id, 
  professional_percentage, 
  platform_percentage, 
  referrer_percentage
) 
SELECT 
  id,
  50, -- 50% para o profissional
  30, -- 30% para a plataforma
  20  -- 20% para influenciador/indicação
FROM products
WHERE active = true
ON CONFLICT (service_id) DO UPDATE SET
  professional_percentage = 50,
  platform_percentage = 30, 
  referrer_percentage = 20;

INSERT INTO payment_split_rules (
  service_id,
  professional_percentage,
  platform_percentage, 
  referrer_percentage
)
SELECT 
  id,
  50, -- 50% para o profissional
  30, -- 30% para a plataforma  
  20  -- 20% para influenciador/indicação
FROM services
WHERE active = true
ON CONFLICT (service_id) DO UPDATE SET
  professional_percentage = 50,
  platform_percentage = 30,
  referrer_percentage = 20;

INSERT INTO payment_split_rules (
  service_id,
  professional_percentage, 
  platform_percentage,
  referrer_percentage
)
SELECT 
  id,
  50, -- 50% para o profissional
  30, -- 30% para a plataforma
  20  -- 20% para influenciador/indicação  
FROM custom_plans
WHERE active = true
ON CONFLICT (service_id) DO UPDATE SET
  professional_percentage = 50,
  platform_percentage = 30,
  referrer_percentage = 20;

-- Criar função para processamento automático de comissões
CREATE OR REPLACE FUNCTION process_commission_payment(
  p_sale_id UUID,
  p_total_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_seller_id UUID;
  v_referrer_id UUID;
  v_professional_amount NUMERIC;
  v_platform_amount NUMERIC;
  v_referrer_amount NUMERIC;
  v_split_rule RECORD;
BEGIN
  -- Buscar dados da venda
  SELECT seller_id, referrer_id INTO v_seller_id, v_referrer_id
  FROM marketplace_sales 
  WHERE id = p_sale_id;
  
  -- Buscar regra de divisão (assumir padrão 50/30/20 se não encontrar)
  SELECT professional_percentage, platform_percentage, referrer_percentage
  INTO v_split_rule
  FROM payment_split_rules 
  LIMIT 1;
  
  IF NOT FOUND THEN
    v_split_rule.professional_percentage := 50;
    v_split_rule.platform_percentage := 30; 
    v_split_rule.referrer_percentage := 20;
  END IF;
  
  -- Calcular valores
  v_professional_amount := (p_total_amount * v_split_rule.professional_percentage / 100);
  v_platform_amount := (p_total_amount * v_split_rule.platform_percentage / 100);
  v_referrer_amount := CASE 
    WHEN v_referrer_id IS NOT NULL THEN (p_total_amount * v_split_rule.referrer_percentage / 100)
    ELSE 0 
  END;
  
  -- Creditar profissional
  INSERT INTO credit_transactions (
    user_id, type, amount, description, source_type, commission_rate, reference_id
  ) VALUES (
    v_seller_id, 
    'service_payment', 
    v_professional_amount,
    'Comissão por venda no marketplace',
    'marketplace_sale',
    v_split_rule.professional_percentage,
    p_sale_id::text
  );
  
  -- Atualizar saldo do profissional
  INSERT INTO user_credits (user_id, total_credits, available_credits)
  VALUES (v_seller_id, v_professional_amount, v_professional_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    total_credits = user_credits.total_credits + v_professional_amount,
    available_credits = user_credits.available_credits + v_professional_amount,
    updated_at = NOW();
    
  -- Creditar referrer se existir
  IF v_referrer_id IS NOT NULL AND v_referrer_amount > 0 THEN
    INSERT INTO credit_transactions (
      user_id, type, amount, description, source_type, commission_rate, reference_id
    ) VALUES (
      v_referrer_id,
      'referral_commission',
      v_referrer_amount, 
      'Comissão por indicação de venda',
      'referral',
      v_split_rule.referrer_percentage,
      p_sale_id::text
    );
    
    INSERT INTO user_credits (user_id, total_credits, available_credits)
    VALUES (v_referrer_id, v_referrer_amount, v_referrer_amount)
    ON CONFLICT (user_id) DO UPDATE SET
      total_credits = user_credits.total_credits + v_referrer_amount,
      available_credits = user_credits.available_credits + v_referrer_amount,
      updated_at = NOW();
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para processar comissões automaticamente quando venda for paga
CREATE OR REPLACE FUNCTION trigger_process_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a venda mudou para status 'completed' 
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM process_commission_payment(NEW.id, NEW.total_amount);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS marketplace_sales_commission_trigger ON marketplace_sales;
CREATE TRIGGER marketplace_sales_commission_trigger
  AFTER UPDATE ON marketplace_sales
  FOR EACH ROW
  EXECUTE FUNCTION trigger_process_commission();