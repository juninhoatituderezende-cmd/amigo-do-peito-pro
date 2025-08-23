-- CORREÇÃO URGENTE: Configurar sistema completo de comissões

-- 1. Criar profissional de exemplo
INSERT INTO profiles (user_id, full_name, email, role, referral_code, approved) VALUES
  (gen_random_uuid(), 'Dr. Carlos Tatuador', 'carlos.tattoo@profissional.com', 'professional', 'CARLOS50', true),
  (gen_random_uuid(), 'Dra. Ana Dentista', 'ana.dental@profissional.com', 'professional', 'ANA50', true)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Criar créditos iniciais para profissionais
INSERT INTO user_credits (user_id, total_credits, available_credits, pending_credits)
SELECT user_id, 0, 0, 0 FROM profiles WHERE role = 'professional'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Associar produtos aos profissionais
UPDATE products SET professional_id = (
  SELECT id FROM profiles WHERE role = 'professional' AND full_name LIKE '%Tatuador%' LIMIT 1
) WHERE category IN ('insumos', 'cursos', 'produtos-digitais');

UPDATE products SET professional_id = (
  SELECT id FROM profiles WHERE role = 'professional' AND full_name LIKE '%Dentista%' LIMIT 1  
) WHERE category = 'consultoria';

UPDATE custom_plans SET professional_id = (
  SELECT id FROM profiles WHERE role = 'professional' AND full_name LIKE '%Tatuador%' LIMIT 1
) WHERE category = 'tattoo';

UPDATE custom_plans SET professional_id = (
  SELECT id FROM profiles WHERE role = 'professional' AND full_name LIKE '%Dentista%' LIMIT 1
) WHERE category = 'dental';

-- 4. Configurar regras de comissão (50% profissional)
INSERT INTO payment_split_rules (service_id, professional_percentage, platform_percentage, referrer_percentage)
SELECT id, 50, 30, 20 FROM products
ON CONFLICT (service_id) DO UPDATE SET
  professional_percentage = 50, platform_percentage = 30, referrer_percentage = 20;

INSERT INTO payment_split_rules (service_id, professional_percentage, platform_percentage, referrer_percentage)  
SELECT id, 50, 30, 20 FROM services
ON CONFLICT (service_id) DO UPDATE SET
  professional_percentage = 50, platform_percentage = 30, referrer_percentage = 20;

INSERT INTO payment_split_rules (service_id, professional_percentage, platform_percentage, referrer_percentage)
SELECT id, 50, 30, 20 FROM custom_plans  
ON CONFLICT (service_id) DO UPDATE SET
  professional_percentage = 50, platform_percentage = 30, referrer_percentage = 20;

-- 5. Função para processar comissões automaticamente
CREATE OR REPLACE FUNCTION process_marketplace_commission(p_sale_id UUID, p_total_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_seller_id UUID;
  v_seller_user_id UUID;
  v_professional_amount NUMERIC := (p_total_amount * 50 / 100);
  v_platform_amount NUMERIC := (p_total_amount * 30 / 100);
  v_referrer_amount NUMERIC := (p_total_amount * 20 / 100);
  v_product_name TEXT;
BEGIN
  -- Buscar dados do vendedor
  SELECT ms.seller_id, p.user_id 
  INTO v_seller_id, v_seller_user_id
  FROM marketplace_sales ms
  JOIN profiles p ON p.id = ms.seller_id
  WHERE ms.id = p_sale_id;
  
  IF v_seller_user_id IS NULL THEN
    RAISE WARNING 'Vendedor não encontrado para venda %', p_sale_id;
    RETURN;
  END IF;
  
  -- Buscar nome do produto
  SELECT COALESCE(pr.name, s.name, cp.name, 'Produto') INTO v_product_name
  FROM marketplace_sales ms
  LEFT JOIN products pr ON pr.id = ms.service_id
  LEFT JOIN services s ON s.id = ms.service_id
  LEFT JOIN custom_plans cp ON cp.id = ms.service_id
  WHERE ms.id = p_sale_id;
  
  -- Creditar profissional (50%)
  INSERT INTO credit_transactions (
    user_id, type, amount, description, source_type, commission_rate, reference_id
  ) VALUES (
    v_seller_user_id, 
    'service_payment', 
    v_professional_amount,
    'Comissão por venda: ' || v_product_name || ' (50%)',
    'marketplace_sale',
    50,
    p_sale_id::text
  );
  
  -- Atualizar saldo do profissional
  UPDATE user_credits 
  SET 
    total_credits = total_credits + v_professional_amount,
    available_credits = available_credits + v_professional_amount,
    updated_at = NOW()
  WHERE user_id = v_seller_user_id;
    
  -- Registrar divisão de pagamento para auditoria
  INSERT INTO payment_splits (
    payment_id, service_id, professional_id, total_amount,
    professional_amount, platform_amount, referrer_amount, status
  ) VALUES (
    p_sale_id::text,
    (SELECT service_id FROM marketplace_sales WHERE id = p_sale_id),
    v_seller_id,
    NULL, -- referrer_id se houver
    p_total_amount,
    v_professional_amount,
    v_platform_amount, 
    v_referrer_amount,
    'processed'
  );
  
  -- Criar notificação para o profissional
  INSERT INTO notification_triggers (
    user_id, event_type, title, message, data
  ) VALUES (
    v_seller_user_id,
    'commission_received',
    'Nova Comissão Recebida!',
    'Você recebeu R$ ' || v_professional_amount::text || ' pela venda de ' || v_product_name,
    jsonb_build_object('amount', v_professional_amount, 'product', v_product_name, 'sale_id', p_sale_id)
  );
  
  RAISE NOTICE 'Comissão processada: % recebeu R$ % por %', v_seller_user_id, v_professional_amount, v_product_name;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para processar comissões automaticamente
DROP TRIGGER IF EXISTS marketplace_sales_commission_trigger ON marketplace_sales;

CREATE OR REPLACE FUNCTION trigger_process_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM process_marketplace_commission(NEW.id, NEW.total_amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_sales_commission_trigger
  AFTER UPDATE ON marketplace_sales
  FOR EACH ROW
  EXECUTE FUNCTION trigger_process_commission();

-- 7. Criar vendas de exemplo para testar o sistema
INSERT INTO marketplace_sales (
  buyer_id, seller_id, service_id, total_amount, credits_used, payment_method, status
) VALUES 
  -- Venda 1: Kit Tattoo
  (
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), -- comprador  
    (SELECT id FROM profiles WHERE role = 'professional' AND full_name LIKE '%Tatuador%' LIMIT 1), -- vendedor
    (SELECT id FROM products WHERE name LIKE '%Kit Insumos%' LIMIT 1), -- produto
    450.00, 450.00, 'credits', 'completed'
  ),
  -- Venda 2: Consultoria Dental
  (
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), -- comprador
    (SELECT id FROM profiles WHERE role = 'professional' AND full_name LIKE '%Dentista%' LIMIT 1), -- vendedor  
    (SELECT id FROM products WHERE name LIKE '%Consultoria%' LIMIT 1), -- produto
    150.00, 150.00, 'credits', 'completed'
  ),
  -- Venda 3: Curso de Tattoo
  (
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), -- comprador
    (SELECT id FROM profiles WHERE role = 'professional' AND full_name LIKE '%Tatuador%' LIMIT 1), -- vendedor
    (SELECT id FROM products WHERE name LIKE '%Curso%' LIMIT 1), -- produto  
    299.99, 0, 'pix', 'completed'
  );