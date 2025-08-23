-- Corrigir e configurar sistema de comissões 
-- Primeiro, vamos verificar e criar regras apenas para serviços existentes

-- Inserir regras de divisão para services (50% profissional)
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

-- Criar vendas de teste para verificar o sistema
-- Primeiro, vamos associar produtos com profissionais
UPDATE products SET professional_id = '22222222-2222-2222-2222-222222222222'::uuid WHERE professional_id IS NULL;

-- Inserir vendas de teste no marketplace
INSERT INTO marketplace_sales (
  id,
  buyer_id, 
  seller_id, 
  service_id,
  total_amount,
  credits_used,
  payment_method,
  status
) VALUES 
  (
    'aa111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid, -- comprador (user)
    '22222222-2222-2222-2222-222222222222'::uuid, -- vendedor (professional) 
    'a9669b4b-29aa-497a-87f0-f2192be5b538'::uuid, -- produto Kit Insumos
    450.00,
    450.00,
    'credits', 
    'pending'
  ),
  (
    'bb222222-2222-2222-2222-222222222222'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid, -- comprador (user)
    '22222222-2222-2222-2222-222222222222'::uuid, -- vendedor (professional)
    'd7c29359-582a-4e62-a55f-69e6daa71829'::uuid, -- produto Consultoria
    150.00,
    150.00,
    'credits',
    'pending' 
  ),
  (
    'cc333333-3333-3333-3333-333333333333'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid, -- comprador (user)
    '22222222-2222-2222-2222-222222222222'::uuid, -- vendedor (professional) 
    '31eb9ee4-172e-4abe-85ec-086264589a3e'::uuid, -- produto Curso Tattoo
    299.99,
    0, -- Pagamento com dinheiro real
    'pix',
    'pending'
  )
ON CONFLICT (id) DO NOTHING;

-- Agora vamos "processar" essas vendas para testar o sistema de comissões
UPDATE marketplace_sales 
SET status = 'completed', updated_at = NOW()
WHERE id IN (
  'aa111111-1111-1111-1111-111111111111'::uuid,
  'bb222222-2222-2222-2222-222222222222'::uuid,
  'cc333333-3333-3333-3333-333333333333'::uuid
);

-- Criar função para processar comissões de produtos (não apenas serviços)
CREATE OR REPLACE FUNCTION process_product_commission_payment(
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
  v_product_name TEXT;
BEGIN
  -- Buscar dados da venda 
  SELECT seller_id, referrer_id INTO v_seller_id, v_referrer_id
  FROM marketplace_sales 
  WHERE id = p_sale_id;
  
  -- Calcular valores (50% profissional, 30% plataforma, 20% referrer)
  v_professional_amount := (p_total_amount * 50 / 100);
  v_platform_amount := (p_total_amount * 30 / 100);
  v_referrer_amount := CASE 
    WHEN v_referrer_id IS NOT NULL THEN (p_total_amount * 20 / 100)
    ELSE 0 
  END;
  
  -- Buscar nome do produto para descrição
  SELECT COALESCE(p.name, cp.name, 'Produto') INTO v_product_name
  FROM marketplace_sales ms
  LEFT JOIN products p ON p.id = ms.service_id
  LEFT JOIN custom_plans cp ON cp.id = ms.service_id
  WHERE ms.id = p_sale_id;
  
  -- Creditar profissional
  INSERT INTO credit_transactions (
    user_id, type, amount, description, source_type, commission_rate, reference_id
  ) VALUES (
    v_seller_id, 
    'service_payment', 
    v_professional_amount,
    'Comissão por venda: ' || v_product_name,
    'marketplace_sale',
    50,
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
      'Comissão por indicação: ' || v_product_name,
      'referral',
      20,
      p_sale_id::text
    );
    
    INSERT INTO user_credits (user_id, total_credits, available_credits)
    VALUES (v_referrer_id, v_referrer_amount, v_referrer_amount)
    ON CONFLICT (user_id) DO UPDATE SET
      total_credits = user_credits.total_credits + v_referrer_amount,
      available_credits = user_credits.available_credits + v_referrer_amount,
      updated_at = NOW();
  END IF;
  
  -- Registrar divisão de pagamento para auditoria
  INSERT INTO payment_splits (
    payment_id, 
    service_id,
    professional_id,
    referrer_id,
    total_amount,
    professional_amount,
    platform_amount,
    referrer_amount,
    status
  ) VALUES (
    p_sale_id::text,
    (SELECT service_id FROM marketplace_sales WHERE id = p_sale_id),
    v_seller_id,
    v_referrer_id,
    p_total_amount,
    v_professional_amount,
    v_platform_amount,
    v_referrer_amount,
    'processed'
  );
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Processar as vendas de teste manualmente para demonstrar o funcionamento
SELECT process_product_commission_payment(
  'aa111111-1111-1111-1111-111111111111'::uuid,
  450.00
);

SELECT process_product_commission_payment(
  'bb222222-2222-2222-2222-222222222222'::uuid,
  150.00
);

SELECT process_product_commission_payment(
  'cc333333-3333-3333-3333-333333333333'::uuid,
  299.99
);

-- Atualizar trigger para usar a nova função
CREATE OR REPLACE FUNCTION trigger_process_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a venda mudou para status 'completed' 
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM process_product_commission_payment(NEW.id, NEW.total_amount);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;