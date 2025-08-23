-- SISTEMA DE COMISSÕES CONDICIONAIS - Profissional + Influenciador

-- 1. Atualizar função para processar comissões condicionais
CREATE OR REPLACE FUNCTION process_marketplace_commission(p_sale_id UUID, p_total_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_seller_id UUID;
  v_seller_user_id UUID;
  v_referrer_id UUID;
  v_referrer_user_id UUID;
  v_professional_amount NUMERIC;
  v_platform_amount NUMERIC;
  v_referrer_amount NUMERIC := 0;
  v_product_name TEXT;
  v_has_referrer BOOLEAN := false;
BEGIN
  -- Buscar dados da venda (seller e referrer)
  SELECT ms.seller_id, p_seller.user_id, ms.referrer_id, p_referrer.user_id
  INTO v_seller_id, v_seller_user_id, v_referrer_id, v_referrer_user_id
  FROM marketplace_sales ms
  LEFT JOIN profiles p_seller ON p_seller.id = ms.seller_id
  LEFT JOIN profiles p_referrer ON p_referrer.id = ms.referrer_id
  WHERE ms.id = p_sale_id;
  
  IF v_seller_user_id IS NULL THEN
    RAISE WARNING 'Vendedor não encontrado para venda %', p_sale_id;
    RETURN;
  END IF;
  
  -- Verificar se há referrer válido
  v_has_referrer := (v_referrer_id IS NOT NULL AND v_referrer_user_id IS NOT NULL);
  
  -- CENÁRIO 1: COM INFLUENCIADOR/REFERRAL (50% + 30% + 20%)
  IF v_has_referrer THEN
    v_professional_amount := (p_total_amount * 50 / 100);  -- 50% profissional
    v_platform_amount := (p_total_amount * 30 / 100);      -- 30% plataforma
    v_referrer_amount := (p_total_amount * 20 / 100);      -- 20% influenciador
    
  -- CENÁRIO 2: SEM INFLUENCIADOR - DIRETO (50% + 50% + 0%)
  ELSE
    v_professional_amount := (p_total_amount * 50 / 100);  -- 50% profissional
    v_platform_amount := (p_total_amount * 50 / 100);      -- 50% plataforma
    v_referrer_amount := 0;                                -- 0% influenciador
  END IF;
  
  -- Buscar nome do produto
  SELECT COALESCE(pr.name, s.name, cp.name, 'Produto') INTO v_product_name
  FROM marketplace_sales ms
  LEFT JOIN products pr ON pr.id = ms.service_id
  LEFT JOIN services s ON s.id = ms.service_id
  LEFT JOIN custom_plans cp ON cp.id = ms.service_id
  WHERE ms.id = p_sale_id;
  
  -- SEMPRE creditar profissional (50%)
  INSERT INTO credit_transactions (
    user_id, type, amount, description, source_type, commission_rate, reference_id
  ) VALUES (
    v_seller_user_id, 
    'service_payment', 
    v_professional_amount,
    'Comissão profissional: ' || v_product_name || ' (50%)',
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
  
  -- CONDICIONALMENTE creditar influenciador (SE existir referrer)
  IF v_has_referrer AND v_referrer_amount > 0 THEN
    INSERT INTO credit_transactions (
      user_id, type, amount, description, source_type, commission_rate, reference_id
    ) VALUES (
      v_referrer_user_id,
      'referral_commission',
      v_referrer_amount, 
      'Comissão de referência: ' || v_product_name || ' (20%)',
      'referral',
      20,
      p_sale_id::text
    );
    
    -- Atualizar saldo do influenciador
    UPDATE user_credits 
    SET 
      total_credits = total_credits + v_referrer_amount,
      available_credits = available_credits + v_referrer_amount,
      updated_at = NOW()
    WHERE user_id = v_referrer_user_id;
  END IF;
    
  -- Registrar divisão de pagamento para auditoria
  INSERT INTO payment_splits (
    payment_id, service_id, professional_id, referrer_id,
    total_amount, professional_amount, platform_amount, referrer_amount, status
  ) VALUES (
    p_sale_id::text,
    (SELECT service_id FROM marketplace_sales WHERE id = p_sale_id),
    v_seller_id,
    v_referrer_id, -- Pode ser NULL
    p_total_amount,
    v_professional_amount,
    v_platform_amount,
    v_referrer_amount,
    'processed'
  );
  
  -- NOTIFICAÇÃO PARA PROFISSIONAL (sempre)
  INSERT INTO notification_triggers (
    user_id, event_type, title, message, data
  ) VALUES (
    v_seller_user_id,
    'commission_received',
    'Comissão Profissional Creditada!',
    'Você recebeu R$ ' || v_professional_amount::text || ' pela venda de ' || v_product_name,
    jsonb_build_object(
      'amount', v_professional_amount, 
      'product', v_product_name, 
      'sale_id', p_sale_id,
      'type', 'professional_commission'
    )
  );
  
  -- NOTIFICAÇÃO PARA INFLUENCIADOR (somente se existir)
  IF v_has_referrer AND v_referrer_amount > 0 THEN
    INSERT INTO notification_triggers (
      user_id, event_type, title, message, data
    ) VALUES (
      v_referrer_user_id,
      'referral_commission_received',
      'Comissão de Referência Recebida!',
      'Você recebeu R$ ' || v_referrer_amount::text || ' pela indicação de ' || v_product_name,
      jsonb_build_object(
        'amount', v_referrer_amount,
        'product', v_product_name,
        'sale_id', p_sale_id,
        'type', 'referral_commission'
      )
    );
  END IF;
  
  -- NOTIFICAÇÃO PARA ADMIN/PLATAFORMA
  INSERT INTO notification_triggers (
    user_id, event_type, title, message, data
  ) VALUES (
    (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1),
    'sale_processed',
    CASE WHEN v_has_referrer 
         THEN 'Venda com Referência Processada'
         ELSE 'Venda Direta Processada' 
    END,
    'Venda de ' || v_product_name || ' no valor de R$ ' || p_total_amount::text || 
    CASE WHEN v_has_referrer 
         THEN ' (com comissão de referência)'
         ELSE ' (venda direta - sem referência)' 
    END,
    jsonb_build_object(
      'total_amount', p_total_amount,
      'professional_amount', v_professional_amount,
      'platform_amount', v_platform_amount,
      'referrer_amount', v_referrer_amount,
      'has_referrer', v_has_referrer,
      'product', v_product_name,
      'sale_id', p_sale_id
    )
  );
  
  RAISE NOTICE 'Comissão processada - Produto: % | Profissional: R$ % | Plataforma: R$ % | Referência: R$ %', 
    v_product_name, v_professional_amount, v_platform_amount, v_referrer_amount;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar função para simular venda COM referência (para teste)
CREATE OR REPLACE FUNCTION create_sale_with_referrer(
  buyer_profile_id UUID,
  seller_profile_id UUID,  
  referrer_profile_id UUID,
  service_id UUID,
  total_amount NUMERIC,
  payment_method TEXT DEFAULT 'credits'
)
RETURNS UUID AS $$
DECLARE
  sale_id UUID;
BEGIN
  INSERT INTO marketplace_sales (
    buyer_id, seller_id, referrer_id, service_id, 
    total_amount, credits_used, payment_method, status
  ) VALUES (
    buyer_profile_id,
    seller_profile_id, 
    referrer_profile_id,
    service_id,
    total_amount,
    CASE WHEN payment_method = 'credits' THEN total_amount ELSE 0 END,
    payment_method,
    'completed'
  ) RETURNING id INTO sale_id;
  
  RETURN sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar função para simular venda SEM referência (para teste)  
CREATE OR REPLACE FUNCTION create_sale_direct(
  buyer_profile_id UUID,
  seller_profile_id UUID,
  service_id UUID,
  total_amount NUMERIC,
  payment_method TEXT DEFAULT 'credits'
)
RETURNS UUID AS $$
DECLARE
  sale_id UUID;
BEGIN
  INSERT INTO marketplace_sales (
    buyer_id, seller_id, referrer_id, service_id,
    total_amount, credits_used, payment_method, status
  ) VALUES (
    buyer_profile_id,
    seller_profile_id,
    NULL, -- SEM referrer
    service_id,
    total_amount,
    CASE WHEN payment_method = 'credits' THEN total_amount ELSE 0 END,
    payment_method,
    'completed'
  ) RETURNING id INTO sale_id;
  
  RETURN sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar perfil influenciador para teste
UPDATE profiles SET 
  role = 'influencer',
  full_name = 'Ana Influencer Pro',
  approved = true,
  referral_code = 'ANA20'
WHERE full_name LIKE '%Juninho%';

-- Criar créditos para influenciador
INSERT INTO user_credits (user_id, total_credits, available_credits, pending_credits)
VALUES ((SELECT user_id FROM profiles WHERE role = 'influencer' LIMIT 1), 0, 0, 0)
ON CONFLICT (user_id) DO NOTHING;

-- 5. TESTAR CENÁRIO 1: Venda COM referência (50% + 30% + 20%)
SELECT create_sale_with_referrer(
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), -- comprador
  (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1), -- profissional vendedor
  (SELECT id FROM profiles WHERE role = 'influencer' LIMIT 1), -- influenciador referrer
  (SELECT id FROM products WHERE name LIKE '%Kit Insumos%' LIMIT 1), -- produto
  500.00, -- valor
  'credits' -- método
);

-- 6. TESTAR CENÁRIO 2: Venda SEM referência (50% + 50% + 0%)
SELECT create_sale_direct(
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), -- comprador  
  (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1), -- profissional vendedor
  (SELECT id FROM products WHERE name LIKE '%Consultoria%' LIMIT 1), -- produto
  200.00, -- valor
  'pix' -- método
);