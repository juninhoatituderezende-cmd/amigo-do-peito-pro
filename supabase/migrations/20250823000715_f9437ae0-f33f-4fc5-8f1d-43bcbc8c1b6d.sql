-- Configurar sistema de comissões - versão simplificada
-- Inserir um profissional de teste
WITH new_prof AS (
  INSERT INTO profiles (user_id, full_name, email, role, referral_code, approved) 
  VALUES (gen_random_uuid(), 'Dr. João Profissional', 'joao.pro@teste.com', 'professional', 'JOAOPRO', true)
  RETURNING id, user_id
)
INSERT INTO user_credits (user_id, total_credits, available_credits, pending_credits)
SELECT user_id, 0, 0, 0 FROM new_prof;

-- Atualizar produtos para associar ao profissional
UPDATE products 
SET professional_id = (SELECT id FROM profiles WHERE role = 'professional' AND full_name = 'Dr. João Profissional' LIMIT 1)
WHERE professional_id IS NULL;

-- Criar vendas de teste
INSERT INTO marketplace_sales (buyer_id, seller_id, service_id, total_amount, credits_used, payment_method, status) VALUES 
  (
    '36c02a4c-032c-487c-8938-a6b6d1270fd6'::uuid, -- CAUE BERTIN (comprador)
    (SELECT id FROM profiles WHERE role = 'professional' AND full_name = 'Dr. João Profissional' LIMIT 1), -- profissional (vendedor) 
    'a9669b4b-29aa-497a-87f0-f2192be5b538'::uuid, -- produto Kit Insumos
    450.00, 450.00, 'credits', 'completed'
  ),
  (
    'e726f9b9-d309-40e0-b8f8-7cae2652d976'::uuid, -- Maria laura (compradora)
    (SELECT id FROM profiles WHERE role = 'professional' AND full_name = 'Dr. João Profissional' LIMIT 1), -- profissional (vendedor)
    'd7c29359-582a-4e62-a55f-69e6daa71829'::uuid, -- produto Consultoria
    150.00, 150.00, 'credits', 'completed' 
  ),
  (
    '36c02a4c-032c-487c-8938-a6b6d1270fd6'::uuid, -- CAUE BERTIN (comprador)
    (SELECT id FROM profiles WHERE role = 'professional' AND full_name = 'Dr. João Profissional' LIMIT 1), -- profissional (vendedor) 
    '31eb9ee4-172e-4abe-85ec-086264589a3e'::uuid, -- produto Curso Tattoo
    299.99, 0, 'pix', 'completed'
  );

-- Processar comissões de 50% para as vendas de teste
INSERT INTO credit_transactions (user_id, type, amount, description, source_type, commission_rate, reference_id)
SELECT 
  p.user_id,
  'service_payment',
  (ms.total_amount * 50 / 100),
  'Comissão por venda: Kit Insumos (50%)',
  'marketplace_sale',
  50,
  ms.id::text
FROM marketplace_sales ms
JOIN profiles p ON p.id = ms.seller_id
WHERE ms.service_id = 'a9669b4b-29aa-497a-87f0-f2192be5b538'::uuid;

INSERT INTO credit_transactions (user_id, type, amount, description, source_type, commission_rate, reference_id)
SELECT 
  p.user_id,
  'service_payment',
  (ms.total_amount * 50 / 100),
  'Comissão por venda: Consultoria (50%)',
  'marketplace_sale',
  50,
  ms.id::text
FROM marketplace_sales ms
JOIN profiles p ON p.id = ms.seller_id
WHERE ms.service_id = 'd7c29359-582a-4e62-a55f-69e6daa71829'::uuid;

INSERT INTO credit_transactions (user_id, type, amount, description, source_type, commission_rate, reference_id)
SELECT 
  p.user_id,
  'service_payment',
  (ms.total_amount * 50 / 100),
  'Comissão por venda: Curso Tattoo (50%)',
  'marketplace_sale',
  50,
  ms.id::text
FROM marketplace_sales ms
JOIN profiles p ON p.id = ms.seller_id
WHERE ms.service_id = '31eb9ee4-172e-4abe-85ec-086264589a3e'::uuid;

-- Atualizar saldo do profissional com as comissões
UPDATE user_credits 
SET 
  total_credits = total_credits + (450.00 * 50 / 100) + (150.00 * 50 / 100) + (299.99 * 50 / 100),
  available_credits = available_credits + (450.00 * 50 / 100) + (150.00 * 50 / 100) + (299.99 * 50 / 100),
  updated_at = NOW()
WHERE user_id = (SELECT user_id FROM profiles WHERE role = 'professional' AND full_name = 'Dr. João Profissional' LIMIT 1);

-- Registrar divisões de pagamento para auditoria
INSERT INTO payment_splits (payment_id, service_id, professional_id, total_amount, professional_amount, platform_amount, referrer_amount, status)
SELECT 
  ms.id::text,
  ms.service_id,
  ms.seller_id,
  ms.total_amount,
  (ms.total_amount * 50 / 100),
  (ms.total_amount * 30 / 100),
  (ms.total_amount * 20 / 100),
  'processed'
FROM marketplace_sales ms
WHERE ms.seller_id = (SELECT id FROM profiles WHERE role = 'professional' AND full_name = 'Dr. João Profissional' LIMIT 1);

-- Função para processar comissões futuras
CREATE OR REPLACE FUNCTION process_marketplace_commission(p_sale_id UUID, p_total_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_seller_id UUID;
  v_seller_user_id UUID;
  v_professional_amount NUMERIC := (p_total_amount * 50 / 100);
BEGIN
  -- Buscar dados do vendedor
  SELECT ms.seller_id, p.user_id 
  INTO v_seller_id, v_seller_user_id
  FROM marketplace_sales ms
  JOIN profiles p ON p.id = ms.seller_id
  WHERE ms.id = p_sale_id;
  
  IF v_seller_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Creditar profissional
  INSERT INTO credit_transactions (user_id, type, amount, description, source_type, commission_rate, reference_id)
  VALUES (v_seller_user_id, 'service_payment', v_professional_amount, 'Comissão por venda (50%)', 'marketplace_sale', 50, p_sale_id::text);
  
  -- Atualizar saldo
  UPDATE user_credits 
  SET total_credits = total_credits + v_professional_amount, available_credits = available_credits + v_professional_amount, updated_at = NOW()
  WHERE user_id = v_seller_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para automatizar comissões
CREATE OR REPLACE FUNCTION trigger_process_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM process_marketplace_commission(NEW.id, NEW.total_amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;