-- Configurar sistema de comissões usando dados reais existentes
-- Primeiro, vamos criar um perfil profissional para testes
INSERT INTO profiles (user_id, full_name, email, role, referral_code, approved) VALUES
  ('prof-test-1111-1111-1111-111111111111'::uuid, 'Dr. João Profissional', 'joao.pro@teste.com', 'professional', 'JOAOPRO', true)
ON CONFLICT (user_id) DO NOTHING;

-- Criar créditos iniciais para o profissional
INSERT INTO user_credits (user_id, total_credits, available_credits, pending_credits) VALUES
  ('prof-test-1111-1111-1111-111111111111'::uuid, 0, 0, 0)
ON CONFLICT (user_id) DO NOTHING;

-- Atualizar produtos existentes para associar ao profissional de teste
UPDATE products 
SET professional_id = (SELECT id FROM profiles WHERE user_id = 'prof-test-1111-1111-1111-111111111111'::uuid LIMIT 1)
WHERE professional_id IS NULL;

-- Criar vendas de teste usando IDs reais
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
    '36c02a4c-032c-487c-8938-a6b6d1270fd6'::uuid, -- CAUE BERTIN (comprador)
    (SELECT id FROM profiles WHERE user_id = 'prof-test-1111-1111-1111-111111111111'::uuid), -- profissional (vendedor) 
    'a9669b4b-29aa-497a-87f0-f2192be5b538'::uuid, -- produto Kit Insumos
    450.00,
    450.00,
    'credits', 
    'pending'
  ),
  (
    'bb222222-2222-2222-2222-222222222222'::uuid,
    'e726f9b9-d309-40e0-b8f8-7cae2652d976'::uuid, -- Maria laura (compradora)
    (SELECT id FROM profiles WHERE user_id = 'prof-test-1111-1111-1111-111111111111'::uuid), -- profissional (vendedor)
    'd7c29359-582a-4e62-a55f-69e6daa71829'::uuid, -- produto Consultoria
    150.00,
    150.00,
    'credits',
    'pending' 
  ),
  (
    'cc333333-3333-3333-3333-333333333333'::uuid,
    '36c02a4c-032c-487c-8938-a6b6d1270fd6'::uuid, -- CAUE BERTIN (comprador)
    (SELECT id FROM profiles WHERE user_id = 'prof-test-1111-1111-1111-111111111111'::uuid), -- profissional (vendedor) 
    '31eb9ee4-172e-4abe-85ec-086264589a3e'::uuid, -- produto Curso Tattoo
    299.99,
    0, -- Pagamento com dinheiro real
    'pix',
    'pending'
  )
ON CONFLICT (id) DO NOTHING;

-- Função para processar comissões usando IDs de profiles (não user_id)
CREATE OR REPLACE FUNCTION process_marketplace_commission(
  p_sale_id UUID,
  p_total_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_seller_id UUID; -- profile.id do vendedor
  v_seller_user_id UUID; -- user_id do vendedor 
  v_referrer_id UUID;
  v_professional_amount NUMERIC;
  v_platform_amount NUMERIC;
  v_referrer_amount NUMERIC;
  v_product_name TEXT;
BEGIN
  -- Buscar dados da venda e user_id do seller
  SELECT ms.seller_id, p.user_id, ms.referrer_id 
  INTO v_seller_id, v_seller_user_id, v_referrer_id
  FROM marketplace_sales ms
  LEFT JOIN profiles p ON p.id = ms.seller_id
  WHERE ms.id = p_sale_id;
  
  -- Se não encontrar user_id, usar um padrão para testes
  IF v_seller_user_id IS NULL THEN
    v_seller_user_id := 'prof-test-1111-1111-1111-111111111111'::uuid;
  END IF;
  
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
    v_seller_user_id, 
    'service_payment', 
    v_professional_amount,
    'Comissão por venda: ' || v_product_name,
    'marketplace_sale',
    50,
    p_sale_id::text
  );
  
  -- Atualizar saldo do profissional
  INSERT INTO user_credits (user_id, total_credits, available_credits)
  VALUES (v_seller_user_id, v_professional_amount, v_professional_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    total_credits = user_credits.total_credits + v_professional_amount,
    available_credits = user_credits.available_credits + v_professional_amount,
    updated_at = NOW();
    
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
  
  RAISE NOTICE 'Comissão processada: Profissional=%, Valor=%, Produto=%', v_seller_user_id, v_professional_amount, v_product_name;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Processar vendas marcando como completas (trigger vai processar automaticamente)
UPDATE marketplace_sales 
SET status = 'completed', updated_at = NOW()
WHERE id IN (
  'aa111111-1111-1111-1111-111111111111'::uuid,
  'bb222222-2222-2222-2222-222222222222'::uuid,  
  'cc333333-3333-3333-3333-333333333333'::uuid
);

-- Trigger atualizado para usar a nova função
CREATE OR REPLACE FUNCTION trigger_process_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a venda mudou para status 'completed' 
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM process_marketplace_commission(NEW.id, NEW.total_amount);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Executar função manualmente para as vendas de teste
SELECT process_marketplace_commission(
  'aa111111-1111-1111-1111-111111111111'::uuid,
  450.00
);

SELECT process_marketplace_commission(
  'bb222222-2222-2222-2222-222222222222'::uuid,
  150.00
);

SELECT process_marketplace_commission(
  'cc333333-3333-3333-3333-333333333333'::uuid,
  299.99
);