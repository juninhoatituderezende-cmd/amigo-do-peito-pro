-- Adicionar novos tipos de transação para o ecossistema completo
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'service_payment';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'referral_commission'; 
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'marketplace_commission';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'professional_earnings';

-- Adicionar campos extras na tabela credit_transactions para melhor rastreamento
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2);
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS related_user_id UUID;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_type ON credit_transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_source ON credit_transactions(source_type);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_status ON withdrawal_requests(user_id, status);

-- Inserir dados de exemplo para demonstrar o funcionamento
INSERT INTO user_credits (user_id, total_credits, available_credits, pending_credits) 
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 1250.00, 850.00, 200.00),
  ('00000000-0000-0000-0000-000000000002'::uuid, 2100.50, 1200.75, 150.00),
  ('00000000-0000-0000-0000-000000000003'::uuid, 750.25, 500.25, 0.00)
ON CONFLICT (user_id) DO NOTHING;

-- Inserir transações de exemplo
INSERT INTO credit_transactions (user_id, type, amount, description, source_type, commission_rate)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'service_payment', 300.00, 'Pagamento por consulta odontológica', 'professional_service', NULL),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'referral_commission', 75.00, 'Comissão por indicação de usuário', 'referral', 10.00),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'earned', 150.00, 'Crédito inicial do sistema', 'initial_bonus', NULL),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'marketplace_commission', 45.00, 'Comissão venda marketplace', 'marketplace', 15.00),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'withdrawal_request', -200.00, 'Saque via PIX', 'withdrawal', NULL)
ON CONFLICT DO NOTHING;

-- Inserir solicitações de saque de exemplo
INSERT INTO withdrawal_requests (user_id, amount, method, pix_key, status)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 500.00, 'pix', 'professional@email.com', 'pending'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 200.00, 'pix', '123.456.789-00', 'completed')
ON CONFLICT DO NOTHING;