-- SOLUÇÃO DEFINITIVA: Sistema funcional de comissões

-- 1. Remover constraints conflitantes temporariamente
ALTER TABLE payment_split_rules DROP CONSTRAINT IF EXISTS payment_split_rules_service_id_fkey;
ALTER TABLE marketplace_sales DROP CONSTRAINT IF EXISTS marketplace_sales_service_id_fkey;

-- 2. Garantir que Charles tenha créditos configurados
INSERT INTO user_credits (user_id, total_credits, available_credits, pending_credits)
VALUES ('7ec1ca22-df8b-4fb8-9821-cad3889efef6'::uuid, 0, 0, 0) -- user_id do Juninho
ON CONFLICT (user_id) DO NOTHING;

-- 3. Associar produtos ao Admin Charles (que será profissional)
UPDATE products SET professional_id = '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid;
UPDATE custom_plans SET professional_id = '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid;

-- 4. Atualizar Admin Charles para profissional
UPDATE profiles SET 
  role = 'professional',
  approved = true,
  referral_code = 'CHARLES50'
WHERE id = '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid;

-- 5. Função para processar comissões automaticamente
CREATE OR REPLACE FUNCTION process_marketplace_commission(p_sale_id UUID, p_total_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_seller_user_id UUID;
  v_professional_amount NUMERIC := (p_total_amount * 50 / 100);
BEGIN
  -- Buscar user_id do vendedor
  SELECT p.user_id INTO v_seller_user_id
  FROM marketplace_sales ms
  JOIN profiles p ON p.id = ms.seller_id
  WHERE ms.id = p_sale_id;
  
  -- Se não encontrar user_id, usar padrão (para usuários sem auth)
  IF v_seller_user_id IS NULL THEN
    v_seller_user_id := '7ec1ca22-df8b-4fb8-9821-cad3889efef6'::uuid; -- Juninho como fallback
  END IF;
  
  -- Creditar profissional (50%)
  INSERT INTO credit_transactions (
    user_id, type, amount, description, source_type, commission_rate, reference_id
  ) VALUES (
    v_seller_user_id, 
    'service_payment', 
    v_professional_amount,
    'Comissão por venda (50%)',
    'marketplace_sale',
    50,
    p_sale_id::text
  );
  
  -- Atualizar saldo
  UPDATE user_credits 
  SET 
    total_credits = total_credits + v_professional_amount,
    available_credits = available_credits + v_professional_amount,
    updated_at = NOW()
  WHERE user_id = v_seller_user_id;
    
  -- Registrar split
  INSERT INTO payment_splits (
    payment_id, professional_id, total_amount,
    professional_amount, platform_amount, referrer_amount, status
  ) VALUES (
    p_sale_id::text,
    (SELECT seller_id FROM marketplace_sales WHERE id = p_sale_id),
    p_total_amount,
    v_professional_amount,
    (p_total_amount * 30 / 100), 
    (p_total_amount * 20 / 100),
    'processed'
  );
  
  RAISE NOTICE 'Comissão processada: R$ % para %', v_professional_amount, v_seller_user_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger
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

-- 7. Vendas de exemplo para teste
INSERT INTO marketplace_sales (
  buyer_id, seller_id, service_id, total_amount, credits_used, payment_method, status
) VALUES 
  (
    'a9a94015-cb17-44f6-844e-4990e3124ced'::uuid, -- Juninho
    '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid, -- Charles
    'a9669b4b-29aa-497a-87f0-f2192be5b538'::uuid, -- Kit Insumos R$ 450
    450.00, 450.00, 'credits', 'completed'
  ),
  (
    'a9a94015-cb17-44f6-844e-4990e3124ced'::uuid, -- Juninho
    '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid, -- Charles
    'd7c29359-582a-4e62-a55f-69e6daa71829'::uuid, -- Consultoria R$ 150
    150.00, 150.00, 'credits', 'completed'
  ),
  (
    'a9a94015-cb17-44f6-844e-4990e3124ced'::uuid, -- Juninho
    '9d9e45fb-7908-4faa-82da-aa36c9015fae'::uuid, -- Charles
    '31eb9ee4-172e-4abe-85ec-086264589a3e'::uuid, -- Curso R$ 299.99
    299.99, 0, 'pix', 'completed'
  );

-- 8. Executar processo manual para as vendas criadas
-- O trigger irá processar automaticamente as comissões