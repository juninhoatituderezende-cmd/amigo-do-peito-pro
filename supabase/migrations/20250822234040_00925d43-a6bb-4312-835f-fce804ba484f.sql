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