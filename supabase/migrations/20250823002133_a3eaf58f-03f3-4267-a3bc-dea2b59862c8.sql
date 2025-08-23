-- CORREÇÃO SIMPLES: Usar Maria Laura como profissional

-- 1. Converter Maria Laura para profissional
UPDATE profiles 
SET 
  role = 'professional',
  full_name = 'Dra. Maria Profissional',
  approved = true,
  referral_code = 'MARIA50'
WHERE user_id = '94e10050-3a14-4ccd-a02a-8dc2504fe9ad';

-- 2. Atualizar produtos para usar Maria como profissional
UPDATE products SET professional_id = 'e726f9b9-d309-40e0-b8f8-7cae2652d976';
UPDATE custom_plans SET professional_id = 'e726f9b9-d309-40e0-b8f8-7cae2652d976';

-- 3. Atualizar vendas para usar Maria como vendedora
UPDATE marketplace_sales 
SET seller_id = 'e726f9b9-d309-40e0-b8f8-7cae2652d976'
WHERE id IN ('2314f127-14da-48c7-935e-a7c2fb972ceb', '3c19ae33-7fab-42d0-a9ed-425294b66b04');

-- 4. Remover perfil duplicado do Dr. Carlos
DELETE FROM profiles WHERE full_name = 'Dr. Carlos Tatuador Pro';

-- 5. Resetar créditos da Maria  
UPDATE user_credits 
SET total_credits = 0, available_credits = 0, pending_credits = 0, updated_at = NOW()
WHERE user_id = '94e10050-3a14-4ccd-a02a-8dc2504fe9ad';

-- 6. Processar vendas com a nova configuração
-- CENÁRIO 1: COM referência (50% + 30% + 20%)
SELECT process_marketplace_commission('2314f127-14da-48c7-935e-a7c2fb972ceb'::uuid, 500.00);

-- CENÁRIO 2: SEM referência (50% + 50% + 0%)  
SELECT process_marketplace_commission('3c19ae33-7fab-42d0-a9ed-425294b66b04'::uuid, 200.00);