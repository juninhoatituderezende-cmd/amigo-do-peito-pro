-- CORREÇÃO: Ajustar perfil profissional e reprocessar comissões

-- 1. Corrigir perfil do profissional (dar um user_id válido)
UPDATE profiles 
SET user_id = gen_random_uuid()
WHERE full_name = 'Dr. Carlos Tatuador Pro' AND user_id IS NULL;

-- 2. Criar créditos para o profissional
INSERT INTO user_credits (user_id, total_credits, available_credits, pending_credits)
SELECT user_id, 0, 0, 0 
FROM profiles 
WHERE full_name = 'Dr. Carlos Tatuador Pro'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Limpar transações antigas para reprocessar corretamente
DELETE FROM credit_transactions WHERE created_at > NOW() - INTERVAL '10 minutes';
DELETE FROM payment_splits WHERE created_at > NOW() - INTERVAL '10 minutes';
DELETE FROM notification_triggers WHERE created_at > NOW() - INTERVAL '10 minutes';

-- 4. Reprocessar vendas com lógica correta
-- CENÁRIO 1: Venda COM referência (Kit R$ 500) - deve ser 50% prof + 20% influencer + 30% plataforma
SELECT process_marketplace_commission('2314f127-14da-48c7-935e-a7c2fb972ceb'::uuid, 500.00);

-- CENÁRIO 2: Venda SEM referência (Consultoria R$ 200) - deve ser 50% prof + 50% plataforma + 0% influencer
SELECT process_marketplace_commission('3c19ae33-7fab-42d0-a9ed-425294b66b04'::uuid, 200.00);