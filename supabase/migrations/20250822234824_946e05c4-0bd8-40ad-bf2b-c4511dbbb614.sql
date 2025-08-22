-- Inserir dados de demonstração para testar o sistema completo
-- Primeiro, vamos criar usuários de teste se não existirem

-- Inserir perfis de teste
INSERT INTO profiles (user_id, full_name, email, role, referral_code, approved) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'João Silva', 'joao@teste.com', 'user', 'JOAO123', true),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Maria Santos', 'maria@teste.com', 'professional', 'MARIA456', true),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Ana Costa', 'ana@teste.com', 'influencer', 'ANA789', true)
ON CONFLICT (user_id) DO NOTHING;

-- Inserir créditos para os usuários de teste
INSERT INTO user_credits (user_id, total_credits, available_credits, pending_credits) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 850.00, 320.75, 50.00),
  ('22222222-2222-2222-2222-222222222222'::uuid, 1200.50, 800.25, 150.00),
  ('33333333-3333-3333-3333-333333333333'::uuid, 650.25, 500.00, 0.00)
ON CONFLICT (user_id) DO UPDATE SET
  total_credits = EXCLUDED.total_credits,
  available_credits = EXCLUDED.available_credits,
  pending_credits = EXCLUDED.pending_credits;

-- Inserir transações de exemplo
INSERT INTO credit_transactions (user_id, type, amount, description, source_type, commission_rate) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'earned', 300.00, 'Pagamento inicial do plano', 'initial_payment', NULL),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'spent', -50.00, 'Compra no marketplace - Kit Insumos', 'marketplace_purchase', NULL),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'service_payment', 450.00, 'Receita por consulta odontológica', 'professional_service', NULL),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'referral_commission', 75.00, 'Comissão por indicação', 'referral', 10.00),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'withdrawal_request', -150.00, 'Saque PIX solicitado', 'withdrawal', NULL)
ON CONFLICT DO NOTHING;

-- Inserir solicitações de saque
INSERT INTO withdrawal_requests (user_id, amount, method, pix_key, status) VALUES
  ('22222222-2222-2222-2222-222222222222'::uuid, 300.00, 'pix', 'maria@teste.com', 'pending'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 150.00, 'pix', '123.456.789-00', 'completed')
ON CONFLICT DO NOTHING;

-- Inserir participações em grupos  
INSERT INTO group_participants (user_id, group_id, amount_paid, status) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 150.00, 'active'),
  ('11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 200.00, 'contemplated')
ON CONFLICT DO NOTHING;

-- Inserir vendas no marketplace
INSERT INTO marketplace_sales (buyer_id, seller_id, service_id, payment_method, total_amount, credits_used, status) VALUES
  ('11111111-1111-1111-1111-111111111-11'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'a9669b4b-29aa-497a-87f0-f2192be5b538'::uuid, 'credits', 450.00, 450.00, 'completed')
ON CONFLICT DO NOTHING;