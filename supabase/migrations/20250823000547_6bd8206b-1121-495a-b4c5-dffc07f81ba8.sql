-- Configurar sistema de comissões com UUID válido
-- Primeiro, vamos criar um perfil profissional para testes
DO $$
DECLARE 
    prof_user_id UUID := gen_random_uuid();
    prof_profile_id UUID;
BEGIN
    -- Inserir perfil profissional
    INSERT INTO profiles (user_id, full_name, email, role, referral_code, approved) 
    VALUES (prof_user_id, 'Dr. João Profissional', 'joao.pro@teste.com', 'professional', 'JOAOPRO', true)
    RETURNING id INTO prof_profile_id;
    
    -- Criar créditos iniciais para o profissional
    INSERT INTO user_credits (user_id, total_credits, available_credits, pending_credits) 
    VALUES (prof_user_id, 0, 0, 0);
    
    -- Atualizar produtos existentes para associar ao profissional de teste
    UPDATE products 
    SET professional_id = prof_profile_id
    WHERE professional_id IS NULL;
    
    -- Criar vendas de teste usando IDs reais
    INSERT INTO marketplace_sales (
      id, buyer_id, seller_id, service_id, total_amount, credits_used, payment_method, status
    ) VALUES 
      (
        gen_random_uuid(),
        '36c02a4c-032c-487c-8938-a6b6d1270fd6'::uuid, -- CAUE BERTIN (comprador)
        prof_profile_id, -- profissional (vendedor) 
        'a9669b4b-29aa-497a-87f0-f2192be5b538'::uuid, -- produto Kit Insumos
        450.00, 450.00, 'credits', 'completed'
      ),
      (
        gen_random_uuid(),
        'e726f9b9-d309-40e0-b8f8-7cae2652d976'::uuid, -- Maria laura (compradora)
        prof_profile_id, -- profissional (vendedor)
        'd7c29359-582a-4e62-a55f-69e6daa71829'::uuid, -- produto Consultoria
        150.00, 150.00, 'credits', 'completed' 
      ),
      (
        gen_random_uuid(),
        '36c02a4c-032c-487c-8938-a6b6d1270fd6'::uuid, -- CAUE BERTIN (comprador)
        prof_profile_id, -- profissional (vendedor) 
        '31eb9ee4-172e-4abe-85ec-086264589a3e'::uuid, -- produto Curso Tattoo
        299.99, 0, 'pix', 'completed'
      );
    
    -- Processar comissões manualmente para as vendas de teste
    FOR sale IN (SELECT id, total_amount FROM marketplace_sales WHERE seller_id = prof_profile_id)
    LOOP
        -- Calcular comissão de 50%
        INSERT INTO credit_transactions (
            user_id, type, amount, description, source_type, commission_rate, reference_id
        ) VALUES (
            prof_user_id,
            'service_payment',
            (sale.total_amount * 50 / 100),
            'Comissão por venda no marketplace (50%)',
            'marketplace_sale',
            50,
            sale.id::text
        );
        
        -- Atualizar saldo do profissional
        UPDATE user_credits 
        SET 
            total_credits = total_credits + (sale.total_amount * 50 / 100),
            available_credits = available_credits + (sale.total_amount * 50 / 100),
            updated_at = NOW()
        WHERE user_id = prof_user_id;
        
        -- Registrar split de pagamento
        INSERT INTO payment_splits (
            payment_id, service_id, professional_id, total_amount,
            professional_amount, platform_amount, referrer_amount, status
        ) VALUES (
            sale.id::text,
            (SELECT service_id FROM marketplace_sales WHERE id = sale.id),
            prof_profile_id,
            sale.total_amount,
            (sale.total_amount * 50 / 100), -- 50% profissional
            (sale.total_amount * 30 / 100), -- 30% plataforma  
            (sale.total_amount * 20 / 100), -- 20% reservado para referrer
            'processed'
        );
    END LOOP;
    
    RAISE NOTICE 'Sistema de comissões configurado com sucesso. Profissional ID: %', prof_profile_id;
    
END $$;

-- Função para automatizar comissões futuras
CREATE OR REPLACE FUNCTION process_marketplace_commission(
  p_sale_id UUID,
  p_total_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_seller_id UUID; -- profile.id do vendedor
  v_seller_user_id UUID; -- user_id do vendedor 
  v_referrer_id UUID;
  v_professional_amount NUMERIC := (p_total_amount * 50 / 100);
  v_platform_amount NUMERIC := (p_total_amount * 30 / 100);
  v_referrer_amount NUMERIC := (p_total_amount * 20 / 100);
  v_product_name TEXT;
BEGIN
  -- Buscar dados da venda
  SELECT ms.seller_id, p.user_id, ms.referrer_id 
  INTO v_seller_id, v_seller_user_id, v_referrer_id
  FROM marketplace_sales ms
  LEFT JOIN profiles p ON p.id = ms.seller_id
  WHERE ms.id = p_sale_id;
  
  IF v_seller_user_id IS NULL THEN
    RAISE WARNING 'Vendedor não encontrado para venda %', p_sale_id;
    RETURN;
  END IF;
  
  -- Buscar nome do produto
  SELECT COALESCE(p.name, cp.name, 'Produto') INTO v_product_name
  FROM marketplace_sales ms
  LEFT JOIN products p ON p.id = ms.service_id
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
    
  -- Registrar divisão de pagamento
  INSERT INTO payment_splits (
    payment_id, service_id, professional_id, referrer_id,
    total_amount, professional_amount, platform_amount, referrer_amount, status
  ) VALUES (
    p_sale_id::text,
    (SELECT service_id FROM marketplace_sales WHERE id = p_sale_id),
    v_seller_id, v_referrer_id,
    p_total_amount, v_professional_amount, v_platform_amount, v_referrer_amount,
    'processed'
  );
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para processar automaticamente comissões futuras
CREATE OR REPLACE FUNCTION trigger_process_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM process_marketplace_commission(NEW.id, NEW.total_amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;