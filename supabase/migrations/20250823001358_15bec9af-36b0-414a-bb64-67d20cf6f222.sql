-- Processar manualmente as comissões das vendas existentes
-- Inserir comissões para as 3 vendas

-- Venda 1: Kit Insumos (R$ 450,00) -> Comissão R$ 225,00
INSERT INTO credit_transactions (
    user_id, type, amount, description, source_type, commission_rate, reference_id
) VALUES (
    '7ec1ca22-df8b-4fb8-9821-cad3889efef6'::uuid, -- Juninho (fallback)
    'service_payment',
    225.00, -- 50% de 450
    'Comissão por venda: Kit Insumos Tattoo (50%)',
    'marketplace_sale',
    50,
    (SELECT id::text FROM marketplace_sales WHERE total_amount = 450.00 LIMIT 1)
);

-- Venda 2: Consultoria (R$ 150,00) -> Comissão R$ 75,00
INSERT INTO credit_transactions (
    user_id, type, amount, description, source_type, commission_rate, reference_id
) VALUES (
    '7ec1ca22-df8b-4fb8-9821-cad3889efef6'::uuid, -- Juninho (fallback)
    'service_payment',
    75.00, -- 50% de 150
    'Comissão por venda: Consultoria Odontológica (50%)',
    'marketplace_sale',
    50,
    (SELECT id::text FROM marketplace_sales WHERE total_amount = 150.00 LIMIT 1)
);

-- Venda 3: Curso Tattoo (R$ 299,99) -> Comissão R$ 149,995
INSERT INTO credit_transactions (
    user_id, type, amount, description, source_type, commission_rate, reference_id
) VALUES (
    '7ec1ca22-df8b-4fb8-9821-cad3889efef6'::uuid, -- Juninho (fallback)
    'service_payment',
    149.995, -- 50% de 299.99
    'Comissão por venda: Curso de Tatuagem Básica (50%)',
    'marketplace_sale',
    50,
    (SELECT id::text FROM marketplace_sales WHERE total_amount = 299.99 LIMIT 1)
);

-- Atualizar saldo total do profissional
UPDATE user_credits 
SET 
    total_credits = total_credits + 225.00 + 75.00 + 149.995,
    available_credits = available_credits + 225.00 + 75.00 + 149.995,
    updated_at = NOW()
WHERE user_id = '7ec1ca22-df8b-4fb8-9821-cad3889efef6'::uuid;

-- Registrar splits de pagamento para auditoria
INSERT INTO payment_splits (payment_id, professional_id, total_amount, professional_amount, platform_amount, referrer_amount, status)
SELECT 
    ms.id::text,
    ms.seller_id,
    ms.total_amount,
    (ms.total_amount * 50 / 100), -- 50% profissional
    (ms.total_amount * 30 / 100), -- 30% plataforma
    (ms.total_amount * 20 / 100), -- 20% referrer
    'processed'
FROM marketplace_sales ms
WHERE ms.status = 'completed';

-- Criar notificações para demonstrar sistema funcionando
INSERT INTO notification_triggers (user_id, event_type, title, message, data, sent)
VALUES 
    (
        '7ec1ca22-df8b-4fb8-9821-cad3889efef6'::uuid,
        'commission_received',
        'Comissões Processadas!',
        'Você recebeu R$ 449,99 em comissões por vendas no marketplace',
        jsonb_build_object('total_amount', 449.99, 'sales_count', 3),
        false
    );