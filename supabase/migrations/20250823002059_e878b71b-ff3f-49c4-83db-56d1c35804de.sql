-- CORREÇÃO ALTERNATIVA: Usar usuário existente para o profissional

-- 1. Usar o user_id de um usuário existente para o profissional
UPDATE profiles 
SET user_id = '143ff4a2-c9bb-4d13-9c63-3d0592f9b7fa' -- CAUE BERTIN user_id
WHERE full_name = 'Dr. Carlos Tatuador Pro' AND user_id IS NULL;

-- 2. Atualizar CAUE BERTIN para ser o comprador ao invés do profissional
UPDATE profiles 
SET role = 'user', full_name = 'Caue Bertin - Comprador'
WHERE user_id = '143ff4a2-c9bb-4d13-9c63-3d0592f9b7fa';

-- 3. Criar créditos para o profissional
INSERT INTO user_credits (user_id, total_credits, available_credits, pending_credits)
VALUES ('143ff4a2-c9bb-4d13-9c63-3d0592f9b7fa', 0, 0, 0)
ON CONFLICT (user_id) DO UPDATE SET
  total_credits = 0, available_credits = 0, pending_credits = 0, updated_at = NOW();

-- 4. Reprocessar vendas com lógica correta
-- CENÁRIO 1: Venda COM referência (Kit R$ 500)
SELECT process_marketplace_commission('2314f127-14da-48c7-935e-a7c2fb972ceb'::uuid, 500.00);

-- CENÁRIO 2: Venda SEM referência (Consultoria R$ 200)
SELECT process_marketplace_commission('3c19ae33-7fab-42d0-a9ed-425294b66b04'::uuid, 200.00);