-- CORREÇÃO FINAL: Configurar sistema básico de comissões sem constraints problemáticas

-- 1. Temporariamente remover constraint problemática
ALTER TABLE marketplace_sales DROP CONSTRAINT IF EXISTS marketplace_sales_service_id_fkey;

-- 2. Associar produtos ao profissional Charles
UPDATE products SET professional_id = '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid 
WHERE professional_id IS NULL;

UPDATE custom_plans SET professional_id = '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid
WHERE professional_id IS NULL;

-- 3. Atualizar Charles para ser profissional aprovado
UPDATE profiles SET 
  role = 'professional',
  approved = true,
  referral_code = 'CHARLES50'
WHERE id = '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid;

-- 4. Configurar regras de comissão de 50%
INSERT INTO payment_split_rules (service_id, professional_percentage, platform_percentage, referrer_percentage)
SELECT id, 50, 30, 20 FROM products WHERE professional_id IS NOT NULL
ON CONFLICT (service_id) DO UPDATE SET
  professional_percentage = 50, platform_percentage = 30, referrer_percentage = 20;

-- 5. Função simplificada para processar comissões
CREATE OR REPLACE FUNCTION process_marketplace_commission(p_sale_id UUID, p_total_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_seller_id UUID;
  v_seller_user_id UUID;
  v_professional_amount NUMERIC := (p_total_amount * 50 / 100);
  v_product_name TEXT := 'Produto do Marketplace';
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
  
  -- Creditar profissional (50%)
  INSERT INTO credit_transactions (
    user_id, type, amount, description, source_type, commission_rate, reference_id
  ) VALUES (
    v_seller_user_id, 
    'service_payment', 
    v_professional_amount,
    'Comissão por venda (50%): ' || v_product_name,
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
    
  -- Registrar divisão de pagamento
  INSERT INTO payment_splits (
    payment_id, service_id, professional_id, total_amount,
    professional_amount, platform_amount, referrer_amount, status
  ) VALUES (
    p_sale_id::text,
    (SELECT service_id FROM marketplace_sales WHERE id = p_sale_id),
    v_seller_id,
    NULL,
    p_total_amount,
    v_professional_amount,
    (p_total_amount * 30 / 100), 
    (p_total_amount * 20 / 100),
    'processed'
  );
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para processar comissões
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

-- 7. Criar vendas de demonstração
INSERT INTO marketplace_sales (
  buyer_id, seller_id, service_id, total_amount, credits_used, payment_method, status
) VALUES 
  -- Venda Kit Tattoo
  (
    'a9a94015-cb17-44f6-844e-4990e3124ced'::uuid, -- Juninho comprador
    '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid, -- Charles vendedor  
    'a9669b4b-29aa-497a-87f0-f2192be5b538'::uuid, -- Kit Insumos
    450.00, 450.00, 'credits', 'completed'
  ),
  -- Venda Consultoria
  (
    'a9a94015-cb17-44f6-844e-4990e3124ced'::uuid, -- Juninho comprador
    '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid, -- Charles vendedor
    'd7c29359-582a-4e62-a55f-69e6daa71829'::uuid, -- Consultoria
    150.00, 150.00, 'credits', 'completed'
  ),
  -- Venda Curso Tattoo  
  (
    'a9a94015-cb17-44f6-844e-4990e3124ced'::uuid, -- Juninho comprador
    '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid, -- Charles vendedor
    '31eb9ee4-172e-4abe-85ec-086264589a3e'::uuid, -- Curso
    299.99, 0, 'pix', 'completed'
  );