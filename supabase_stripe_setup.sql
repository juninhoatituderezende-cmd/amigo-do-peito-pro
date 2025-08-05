-- Execute este SQL no Supabase Dashboard > SQL Editor
-- Adicionar tabelas para sistema de pagamentos Stripe Connect

-- Tabela para armazenar informações do Stripe Connect dos profissionais
CREATE TABLE public.stripe_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE UNIQUE,
  stripe_account_id text UNIQUE NOT NULL,
  charges_enabled boolean DEFAULT false,
  payouts_enabled boolean DEFAULT false,
  details_submitted boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  requirements_currently_due text[],
  requirements_eventually_due text[],
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela para pagamentos realizados
CREATE TABLE public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES public.influencers(id) ON DELETE SET NULL,
  stripe_payment_intent_id text UNIQUE NOT NULL,
  amount_total decimal NOT NULL, -- Valor total pago pelo cliente
  amount_professional decimal NOT NULL, -- Valor para o profissional (85%)
  amount_influencer decimal DEFAULT 0, -- Valor para influenciador (5% se houver)
  amount_platform decimal NOT NULL, -- Valor da plataforma (10% ou 15%)
  currency text DEFAULT 'brl',
  status text DEFAULT 'pending', -- pending, completed, failed, refunded
  metadata jsonb DEFAULT '{}',
  processed_at timestamp with time zone
);

-- Tabela para comissões dos influenciadores
CREATE TABLE public.commissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES public.influencers(id) ON DELETE CASCADE,
  amount decimal NOT NULL,
  status text DEFAULT 'pending', -- pending, paid, cancelled
  paid_at timestamp with time zone,
  pix_key text,
  transaction_id text
);

-- Tabela para repasses aos profissionais
CREATE TABLE public.payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL,
  amount decimal NOT NULL,
  status text DEFAULT 'pending', -- pending, in_transit, paid, failed
  stripe_transfer_id text,
  processed_at timestamp with time zone,
  expected_arrival_date timestamp with time zone
);

-- Relacionar pagamentos com repasses
CREATE TABLE public.payment_payouts (
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
  payout_id uuid REFERENCES public.payouts(id) ON DELETE CASCADE,
  PRIMARY KEY (payment_id, payout_id)
);

-- Enable RLS nas novas tabelas
ALTER TABLE public.stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_payouts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para stripe_accounts
CREATE POLICY "Professionals can view own stripe account" ON public.stripe_accounts
  FOR SELECT USING (professional_id IN (
    SELECT id FROM public.professionals WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "Service role can manage stripe accounts" ON public.stripe_accounts
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas RLS para payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = professional_id::text OR
    auth.uid()::text = influencer_id::text
  );

CREATE POLICY "Service role can manage payments" ON public.payments
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas RLS para commissions
CREATE POLICY "Influencers can view own commissions" ON public.commissions
  FOR SELECT USING (auth.uid()::text = influencer_id::text);

CREATE POLICY "Service role can manage commissions" ON public.commissions
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas RLS para payouts
CREATE POLICY "Professionals can view own payouts" ON public.payouts
  FOR SELECT USING (professional_id IN (
    SELECT id FROM public.professionals WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "Service role can manage payouts" ON public.payouts
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas RLS para payment_payouts
CREATE POLICY "Service role can manage payment payouts" ON public.payment_payouts
  FOR ALL USING (auth.role() = 'service_role');

-- Índices para performance
CREATE INDEX idx_stripe_accounts_professional_id ON public.stripe_accounts(professional_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_professional_id ON public.payments(professional_id);
CREATE INDEX idx_payments_influencer_id ON public.payments(influencer_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_commissions_influencer_id ON public.commissions(influencer_id);
CREATE INDEX idx_commissions_payment_id ON public.commissions(payment_id);
CREATE INDEX idx_payouts_professional_id ON public.payouts(professional_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);