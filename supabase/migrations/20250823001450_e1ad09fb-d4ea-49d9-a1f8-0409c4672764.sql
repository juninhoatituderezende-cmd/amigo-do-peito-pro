-- CORREÇÃO SIMPLES: Sistema básico de comissões funcionando

-- 1. Primeiro, vamos configurar os profissionais existentes
UPDATE profiles SET 
  role = 'professional',
  full_name = 'Dr. Carlos Tatuador Pro',
  approved = true,
  referral_code = 'CARLOS50'
WHERE full_name LIKE '%Charles%';

-- 2. Associar produtos aos profissionais
UPDATE products SET professional_id = (
  SELECT id FROM profiles WHERE full_name LIKE '%Carlos%' LIMIT 1
);

UPDATE custom_plans SET professional_id = (
  SELECT id FROM profiles WHERE full_name LIKE '%Carlos%' LIMIT 1
);

-- 3. Configurar regras de comissão para produtos
INSERT INTO payment_split_rules (service_id, professional_percentage, platform_percentage, referrer_percentage)
SELECT id, 50, 30, 20 FROM products
ON CONFLICT (service_id) DO UPDATE SET
  professional_percentage = 50, platform_percentage = 30, referrer_percentage = 20;

-- 4. Função simplificada para processar comissões
CREATE OR REPLACE FUNCTION simple_commission_process(
  seller_profile_id UUID,
  total_amount NUMERIC,
  product_name TEXT DEFAULT 'Produto'
)
RETURNS VOID AS $$
DECLARE
  v_seller_user_id UUID;
  v_commission_amount NUMERIC := (total_amount * 50 / 100);
BEGIN
  -- Buscar user_id do vendedor
  SELECT user_id INTO v_seller_user_id
  FROM profiles 
  WHERE id = seller_profile_id;
  
  IF v_seller_user_id IS NULL THEN
    RAISE WARNING 'Vendedor não encontrado';
    RETURN;
  END IF;
  
  -- Creditar profissional (50%)
  INSERT INTO credit_transactions (
    user_id, type, amount, description, source_type, commission_rate
  ) VALUES (
    v_seller_user_id, 
    'service_payment', 
    v_commission_amount,
    'Comissão por venda: ' || product_name || ' (50%)',
    'marketplace_sale',
    50
  );
  
  -- Atualizar saldo do profissional
  UPDATE user_credits 
  SET 
    total_credits = total_credits + v_commission_amount,
    available_credits = available_credits + v_commission_amount,
    updated_at = NOW()
  WHERE user_id = v_seller_user_id;
  
  -- Criar notificação
  INSERT INTO notification_triggers (
    user_id, event_type, title, message
  ) VALUES (
    v_seller_user_id,
    'commission_received',
    'Nova Comissão Recebida!',
    'Você recebeu R$ ' || v_commission_amount::text || ' pela venda de ' || product_name
  );
  
  RAISE NOTICE 'Comissão de R$ % processada para %', v_commission_amount, product_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Processar algumas comissões de exemplo manualmente
SELECT simple_commission_process(
  (SELECT id FROM profiles WHERE full_name LIKE '%Carlos%' LIMIT 1),
  450.00,
  'Kit Insumos Tattoo Profissional'
);

SELECT simple_commission_process(
  (SELECT id FROM profiles WHERE full_name LIKE '%Carlos%' LIMIT 1),
  150.00,
  'Consultoria Odontológica'
);

SELECT simple_commission_process(
  (SELECT id FROM profiles WHERE full_name LIKE '%Carlos%' LIMIT 1),
  299.99,
  'Curso de Tatuagem Básica'
);

-- 6. Criar algumas vendas diretas na tabela (sem foreign key problemas)
INSERT INTO marketplace_sales (
  buyer_id, seller_id, total_amount, credits_used, payment_method, status, created_at
) VALUES 
  (
    (SELECT id FROM profiles WHERE full_name LIKE '%Juninho%' LIMIT 1), -- comprador  
    (SELECT id FROM profiles WHERE full_name LIKE '%Carlos%' LIMIT 1), -- vendedor
    450.00, 450.00, 'credits', 'completed', NOW()
  ),
  (
    (SELECT id FROM profiles WHERE full_name LIKE '%Juninho%' LIMIT 1), -- comprador
    (SELECT id FROM profiles WHERE full_name LIKE '%Carlos%' LIMIT 1), -- vendedor  
    150.00, 150.00, 'credits', 'completed', NOW()
  ),
  (
    (SELECT id FROM profiles WHERE full_name LIKE '%Juninho%' LIMIT 1), -- comprador
    (SELECT id FROM profiles WHERE full_name LIKE '%Carlos%' LIMIT 1), -- vendedor
    299.99, 0, 'pix', 'completed', NOW()
  );

-- 7. Criar solicitação de saque de exemplo
INSERT INTO withdrawal_requests (
  user_id, amount, method, pix_key, status
) VALUES (
  (SELECT user_id FROM profiles WHERE full_name LIKE '%Carlos%' LIMIT 1),
  200.00,
  'pix',
  'carlos.tattoo@profissional.com',
  'pending'
);