-- ============================================================================
-- Consolidated idempotent schema for Supabase (PostgreSQL)
-- Order: tables -> indexes/constraints -> RLS -> functions/triggers -> seeds
-- Safe to run multiple times.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Types (idempotent via DO block)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('user', 'professional', 'admin', 'influencer');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_status') THEN
    CREATE TYPE public.group_status AS ENUM ('forming', 'complete', 'contemplated', 'cancelled');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE public.transaction_type AS ENUM ('earned', 'spent', 'refund', 'withdrawal_request', 'withdrawal_completed');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Core tables (public schema)
-- ---------------------------------------------------------------------------

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  cpf TEXT UNIQUE,
  role public.user_role DEFAULT 'user',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Professionals
CREATE TABLE IF NOT EXISTS public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT,
  location TEXT,
  cep TEXT,
  instagram TEXT,
  cpf TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  experience TEXT,
  id_document_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Influencers
CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  instagram TEXT NOT NULL,
  followers TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Services (referencing profiles as professionals)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketplace products and sales (variant used across migrations)
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  valor_total NUMERIC,
  percentual_entrada NUMERIC DEFAULT 10.0,
  image_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  professional_id UUID REFERENCES public.professionals(id),
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.marketplace_products(id),
  buyer_id UUID REFERENCES auth.users(id),
  buyer_name TEXT,
  buyer_email TEXT,
  valor_total NUMERIC,
  valor_entrada_pago NUMERIC,
  influencer_code TEXT,
  influencer_id UUID REFERENCES auth.users(id),
  comissao_influencer NUMERIC DEFAULT 0,
  comissao_profissional NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Alternate products and plans used by some features
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  target_audience TEXT DEFAULT 'user' CHECK (target_audience IN ('user', 'professional', 'both')),
  external_link TEXT,
  visibility TEXT DEFAULT 'both' CHECK (visibility IN ('client', 'professional', 'both')),
  professional_id UUID REFERENCES public.profiles(id),
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custom_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  duration_months INTEGER DEFAULT 1,
  features JSONB DEFAULT '[]',
  category TEXT,
  active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 10,
  professional_id UUID REFERENCES public.profiles(id),
  stripe_price_id TEXT,
  allow_professional_choice BOOLEAN DEFAULT false,
  public_enrollment BOOLEAN DEFAULT true,
  benefits JSONB,
  tipo_transacao TEXT DEFAULT 'servico' CHECK (tipo_transacao IN ('servico','produto')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  product_id UUID REFERENCES public.products(id),
  plan_id UUID REFERENCES public.custom_plans(id),
  amount_paid NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'credits',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending','completed','cancelled','refunded')),
  purchase_type TEXT DEFAULT 'product' CHECK (purchase_type IN ('product','plan','service')),
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_product_or_plan CHECK (
    (product_id IS NOT NULL AND plan_id IS NULL) OR
    (product_id IS NULL AND plan_id IS NOT NULL)
  )
);

-- MLM groups
CREATE TABLE IF NOT EXISTS public.plan_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  group_number INTEGER,
  target_amount DECIMAL(10,2),
  current_amount DECIMAL(10,2) DEFAULT 0,
  current_participants INTEGER DEFAULT 0,
  max_participants INTEGER DEFAULT 10,
  status public.group_status DEFAULT 'forming',
  winner_id UUID REFERENCES auth.users(id),
  contemplated_at TIMESTAMPTZ,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.plan_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL,
  referrer_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT now(),
  referrer_code TEXT,
  UNIQUE(group_id, user_id)
);

-- Payments and related entities
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID,
  asaas_payment_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  payment_url TEXT,
  plan_name TEXT,
  customer_id TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  external_reference TEXT
);

CREATE TABLE IF NOT EXISTS public.payment_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id),
  asaas_payment_id TEXT NOT NULL,
  webhook_signature TEXT,
  amount_verified BOOLEAN NOT NULL DEFAULT false,
  signature_verified BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(payment_id, asaas_payment_id)
);

CREATE TABLE IF NOT EXISTS public.asaas_subaccounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  asaas_account_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','blocked','rejected')),
  cpf_cnpj TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  company_type TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_district TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  bank_account_type TEXT,
  bank_code TEXT,
  bank_account_number TEXT,
  bank_account_digit TEXT,
  bank_agency TEXT,
  pix_key TEXT,
  verification_status TEXT DEFAULT 'pending',
  verification_notes TEXT,
  documents_uploaded BOOLEAN DEFAULT false,
  kyc_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.payment_split_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.marketplace_products(id),
  service_id UUID REFERENCES public.services(id),
  professional_percentage NUMERIC DEFAULT 70.0 CHECK (professional_percentage >= 0 AND professional_percentage <= 100),
  platform_percentage NUMERIC DEFAULT 20.0 CHECK (platform_percentage >= 0 AND platform_percentage <= 100),
  influencer_percentage NUMERIC DEFAULT 10.0 CHECK (influencer_percentage >= 0 AND influencer_percentage <= 100),
  fixed_platform_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK ((product_id IS NOT NULL AND service_id IS NULL) OR (product_id IS NULL AND service_id IS NOT NULL)),
  CHECK (professional_percentage + platform_percentage + influencer_percentage <= 100)
);

CREATE TABLE IF NOT EXISTS public.payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id),
  asaas_payment_id TEXT NOT NULL,
  professional_id UUID REFERENCES public.professionals(id),
  influencer_id UUID REFERENCES public.influencers(id),
  total_amount NUMERIC NOT NULL,
  professional_amount NUMERIC NOT NULL DEFAULT 0,
  platform_amount NUMERIC NOT NULL DEFAULT 0,
  influencer_amount NUMERIC NOT NULL DEFAULT 0,
  split_executed BOOLEAN NOT NULL DEFAULT false,
  split_executed_at TIMESTAMPTZ,
  split_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications and admin config
CREATE TABLE IF NOT EXISTS public.notification_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  action_text TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Logs and metrics
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  component VARCHAR(255),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  url VARCHAR(500),
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  severity VARCHAR(20) DEFAULT 'error',
  additional_data JSONB
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(255) NOT NULL,
  component VARCHAR(255),
  details JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER
);

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  page_route VARCHAR(255),
  load_time_ms INTEGER,
  component_render_time_ms INTEGER,
  database_query_time_ms INTEGER,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  additional_metrics JSONB
);

-- Materials and related domain tables
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image','video','pdf','document')),
  url TEXT NOT NULL,
  qr_code_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contemplations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  contemplated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  service_type TEXT NOT NULL,
  professional_id UUID REFERENCES public.professionals(id),
  professional_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed','pending','revoked')),
  voucher_code TEXT UNIQUE,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_commission NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('professional','influencer')),
  payment_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  amount NUMERIC,
  user_id UUID REFERENCES auth.users(id),
  admin_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User credits system
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_credits DECIMAL(10,2) DEFAULT 0,
  available_credits DECIMAL(10,2) DEFAULT 0,
  pending_credits DECIMAL(10,2) DEFAULT 0,
  pending_withdrawal DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id TEXT,
  reference_table TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  pix_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT DEFAULT 'pix',
  pix_key TEXT,
  bank_account JSONB,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Security events (newer structure with severity)
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('low','medium','high','critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Diagnostics/log helpers
COMMENT ON TABLE public.agendamentos IS 'Tabela para agendamentos de procedimentos (se criada mais abaixo)';

-- Domain-specific: scheduling, payments participation, referrals
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participation_id UUID REFERENCES public.group_participants(id) ON DELETE CASCADE,
  data_procedimento TIMESTAMPTZ NOT NULL,
  profissional TEXT,
  status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado','concluido','cancelado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pagamentos_participacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participation_id UUID REFERENCES public.group_participants(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado','estornado')),
  metodo TEXT CHECK (metodo IN ('pix','cartao','boleto','credito')),
  referencia_externa TEXT,
  data_vencimento TIMESTAMPTZ,
  data_pagamento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  codigo_referencia TEXT UNIQUE NOT NULL,
  indicado_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','confirmado','premiado')),
  bonus_valor NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Influencer commissions
CREATE TABLE IF NOT EXISTS public.influencer_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.custom_plans(id),
  referral_code TEXT NOT NULL,
  product_total_value DECIMAL(10,2) NOT NULL,
  entry_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  entry_value DECIMAL(10,2) NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 25.00,
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  payment_date TIMESTAMPTZ,
  payment_proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alternative plans by domain
CREATE TABLE IF NOT EXISTS public.planos_tatuador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  professional_id UUID,
  tipo_transacao TEXT DEFAULT 'servico' CHECK (tipo_transacao IN ('servico','produto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planos_dentista (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  professional_id UUID,
  tipo_transacao TEXT DEFAULT 'servico' CHECK (tipo_transacao IN ('servico','produto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions (servico/produto) and taxes
CREATE TABLE IF NOT EXISTS public.transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  plano_id UUID,
  produto_id UUID,
  valor NUMERIC(10,2) NOT NULL,
  tipo_transacao TEXT CHECK (tipo_transacao IN ('servico','produto')) NOT NULL,
  status TEXT DEFAULT 'pendente',
  asaas_payment_id TEXT,
  payment_method TEXT,
  iss_percentual NUMERIC(5,2),
  icms_percentual NUMERIC(5,2),
  pis_cofins_percentual NUMERIC(5,2),
  valor_impostos NUMERIC(10,2) DEFAULT 0,
  valor_liquido NUMERIC(10,2) DEFAULT 0,
  municipio_iss TEXT,
  regime_tributario TEXT DEFAULT 'simples_nacional',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes (CREATE INDEX IF NOT EXISTS)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_services_professional_id ON public.services(professional_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sales_buyer_id ON public.marketplace_sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sales_payment_id ON public.marketplace_sales(payment_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_professional ON public.products(professional_id);
CREATE INDEX IF NOT EXISTS idx_custom_plans_active ON public.custom_plans(active);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user ON public.user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_product ON public.user_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_plan ON public.user_purchases(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_groups_status ON public.plan_groups(status);
CREATE INDEX IF NOT EXISTS idx_plan_groups_referral_code ON public.plan_groups(referral_code);
CREATE INDEX IF NOT EXISTS idx_plan_groups_service_status ON public.plan_groups(service_id, status);
CREATE INDEX IF NOT EXISTS idx_group_participants_group_id ON public.group_participants(group_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user_id ON public.group_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user_group ON public.group_participants(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_id ON public.payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_asaas_subaccounts_professional ON public.asaas_subaccounts(professional_id);
CREATE INDEX IF NOT EXISTS idx_asaas_subaccounts_status ON public.asaas_subaccounts(status);
CREATE INDEX IF NOT EXISTS idx_asaas_subaccounts_asaas_id ON public.asaas_subaccounts(asaas_account_id);
CREATE INDEX IF NOT EXISTS idx_payment_split_rules_product ON public.payment_split_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_split_rules_service ON public.payment_split_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_payment ON public.payment_splits(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_asaas_payment ON public.payment_splits(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_notification_triggers_user_id ON public.notification_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_triggers_sent ON public.notification_triggers(sent);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON public.error_logs(component);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agendamentos_participation_id ON public.agendamentos(participation_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_procedimento ON public.agendamentos(data_procedimento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_participation_id ON public.pagamentos_participacao(participation_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos_participacao(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_metodo ON public.pagamentos_participacao(metodo);
CREATE INDEX IF NOT EXISTS idx_referrals_usuario_id ON public.referrals(usuario_id);
CREATE INDEX IF NOT EXISTS idx_referrals_indicado_id ON public.referrals(indicado_id);
CREATE INDEX IF NOT EXISTS idx_referrals_codigo ON public.referrals(codigo_referencia);
CREATE INDEX IF NOT EXISTS idx_influencer_commissions_influencer_id ON public.influencer_commissions(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_commissions_status ON public.influencer_commissions(status);
CREATE INDEX IF NOT EXISTS idx_influencer_commissions_referral_code ON public.influencer_commissions(referral_code);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);

-- ---------------------------------------------------------------------------
-- Enable RLS (idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_subaccounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_split_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contemplations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_participacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_tatuador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_dentista ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Policies (drop-if-exists then create for idempotency)
-- ---------------------------------------------------------------------------

-- Profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Professionals
DROP POLICY IF EXISTS "Users can view their own professional data" ON public.professionals;
CREATE POLICY "Users can view their own professional data" ON public.professionals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own professional data" ON public.professionals;
CREATE POLICY "Users can update their own professional data" ON public.professionals FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own professional data" ON public.professionals;
CREATE POLICY "Users can insert their own professional data" ON public.professionals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Influencers
DROP POLICY IF EXISTS "Users can view their own influencer data" ON public.influencers;
CREATE POLICY "Users can view their own influencer data" ON public.influencers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own influencer data" ON public.influencers;
CREATE POLICY "Users can update their own influencer data" ON public.influencers FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own influencer data" ON public.influencers;
CREATE POLICY "Users can insert their own influencer data" ON public.influencers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Services and marketplace
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Authenticated users can view services" ON public.services FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Professionals can manage own services" ON public.services;
CREATE POLICY "Professionals can manage own services" ON public.services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.id = services.professional_id)
);

DROP POLICY IF EXISTS "Admins can manage all products" ON public.marketplace_products;
CREATE POLICY "Admins can manage all products" ON public.marketplace_products FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Professionals can view their own products" ON public.marketplace_products;
CREATE POLICY "Professionals can view their own products" ON public.marketplace_products FOR SELECT USING (
  professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Professionals can create products" ON public.marketplace_products;
CREATE POLICY "Professionals can create products" ON public.marketplace_products FOR INSERT WITH CHECK (
  professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can view approved products" ON public.marketplace_products;
CREATE POLICY "Users can view approved products" ON public.marketplace_products FOR SELECT USING (approved = true AND ativo = true);

DROP POLICY IF EXISTS "Admins can view all sales" ON public.marketplace_sales;
CREATE POLICY "Admins can view all sales" ON public.marketplace_sales FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Users can view their own purchases_marketplace" ON public.marketplace_sales;
CREATE POLICY "Users can view their own purchases_marketplace" ON public.marketplace_sales FOR SELECT USING (buyer_id = auth.uid());
DROP POLICY IF EXISTS "Professionals can view sales of their products" ON public.marketplace_sales;
CREATE POLICY "Professionals can view sales of their products" ON public.marketplace_sales FOR SELECT USING (
  product_id IN (
    SELECT p.id FROM public.marketplace_products p
    JOIN public.professionals prof ON p.professional_id = prof.id
    WHERE prof.user_id = auth.uid()
  )
);

-- Products/custom plans/user purchases
DROP POLICY IF EXISTS "Anyone can view active products_simple" ON public.products;
CREATE POLICY "Anyone can view active products_simple" ON public.products FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Professionals can manage own products_simple" ON public.products;
CREATE POLICY "Professionals can manage own products_simple" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.id = products.professional_id)
);
DROP POLICY IF EXISTS "Service role can manage all products_simple" ON public.products;
CREATE POLICY "Service role can manage all products_simple" ON public.products FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can view active plans" ON public.custom_plans;
CREATE POLICY "Authenticated users can view active plans" ON public.custom_plans FOR SELECT TO authenticated USING (active = true AND public_enrollment = true);
DROP POLICY IF EXISTS "Professionals can manage own plans" ON public.custom_plans;
CREATE POLICY "Professionals can manage own plans" ON public.custom_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.id = custom_plans.professional_id)
);
DROP POLICY IF EXISTS "Service role can manage all plans" ON public.custom_plans;
CREATE POLICY "Service role can manage all plans" ON public.custom_plans FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_purchases;
CREATE POLICY "Users can view own purchases" ON public.user_purchases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.id = user_purchases.user_id)
);
DROP POLICY IF EXISTS "Users can create own purchases" ON public.user_purchases;
CREATE POLICY "Users can create own purchases" ON public.user_purchases FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.id = user_purchases.user_id)
);
DROP POLICY IF EXISTS "Service role can manage all purchases" ON public.user_purchases;
CREATE POLICY "Service role can manage all purchases" ON public.user_purchases FOR ALL USING (auth.role() = 'service_role');

-- Plan groups and participants
DROP POLICY IF EXISTS "Anyone can view groups" ON public.plan_groups;
CREATE POLICY "Anyone can view groups" ON public.plan_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage groups" ON public.plan_groups;
CREATE POLICY "Service role can manage groups" ON public.plan_groups FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can join groups via referral" ON public.group_participants;
CREATE POLICY "Users can join groups via referral" ON public.group_participants FOR INSERT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anyone can view participants count" ON public.group_participants;
CREATE POLICY "Anyone can view participants count" ON public.group_participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage participants" ON public.group_participants;
CREATE POLICY "Service role can manage participants" ON public.group_participants FOR ALL USING (auth.role() = 'service_role');

-- Payments and validations
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid()::text = user_id::text);
DROP POLICY IF EXISTS "Service role can manage all payments" ON public.payments;
CREATE POLICY "Service role can manage all payments" ON public.payments FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage payment validations" ON public.payment_validations;
CREATE POLICY "Service role can manage payment validations" ON public.payment_validations FOR ALL USING (auth.role() = 'service_role');

-- ASAAS and split rules
DROP POLICY IF EXISTS "Admins can manage all subaccounts" ON public.asaas_subaccounts;
CREATE POLICY "Admins can manage all subaccounts" ON public.asaas_subaccounts FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Professionals can view their own subaccount" ON public.asaas_subaccounts;
CREATE POLICY "Professionals can view their own subaccount" ON public.asaas_subaccounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Professionals can insert their own subaccount" ON public.asaas_subaccounts;
CREATE POLICY "Professionals can insert their own subaccount" ON public.asaas_subaccounts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage split rules" ON public.payment_split_rules;
CREATE POLICY "Admins can manage split rules" ON public.payment_split_rules FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Authenticated users can view split rules" ON public.payment_split_rules;
CREATE POLICY "Authenticated users can view split rules" ON public.payment_split_rules FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can view all payment splits" ON public.payment_splits;
CREATE POLICY "Admins can view all payment splits" ON public.payment_splits FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Service role can manage payment splits" ON public.payment_splits;
CREATE POLICY "Service role can manage payment splits" ON public.payment_splits FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Professionals can view splits of their payments" ON public.payment_splits;
CREATE POLICY "Professionals can view splits of their payments" ON public.payment_splits FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()
  )
);

-- Logs and diagnostics
DROP POLICY IF EXISTS "Users can insert error logs" ON public.error_logs;
CREATE POLICY "Users can insert error logs" ON public.error_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view their own error logs" ON public.error_logs;
CREATE POLICY "Users can view their own error logs" ON public.error_logs FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert activity logs" ON public.activity_logs;
CREATE POLICY "Users can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert performance metrics" ON public.performance_metrics;
CREATE POLICY "Users can insert performance metrics" ON public.performance_metrics FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view their own performance metrics" ON public.performance_metrics;
CREATE POLICY "Users can view their own performance metrics" ON public.performance_metrics FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Materials and plans domain
DROP POLICY IF EXISTS "Admins can manage all materials" ON public.materials;
CREATE POLICY "Admins can manage all materials" ON public.materials FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Authenticated users can view active materials" ON public.materials;
CREATE POLICY "Authenticated users can view active materials" ON public.materials FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all contemplations" ON public.contemplations;
CREATE POLICY "Admins can manage all contemplations" ON public.contemplations FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Users can view their own contemplations" ON public.contemplations;
CREATE POLICY "Users can view their own contemplations" ON public.contemplations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payment logs" ON public.payment_logs;
CREATE POLICY "Admins can view all payment logs" ON public.payment_logs FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Service role can manage payment logs" ON public.payment_logs;
CREATE POLICY "Service role can manage payment logs" ON public.payment_logs FOR ALL USING (auth.role() = 'service_role');

-- Credits
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
CREATE POLICY "Users can view own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role can manage credits" ON public.user_credits;
CREATE POLICY "Service role can manage credits" ON public.user_credits FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can view their own credit transactions" ON public.credit_transactions;
CREATE POLICY "Authenticated users can view their own credit transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated users can insert their own credit transactions" ON public.credit_transactions;
CREATE POLICY "Authenticated users can insert their own credit transactions" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own notifications triggers" ON public.notification_triggers;
CREATE POLICY "Users can view own notifications triggers" ON public.notification_triggers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notification_triggers;
CREATE POLICY "Service role can manage notifications" ON public.notification_triggers FOR ALL USING (auth.role() = 'service_role');

-- Withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users can create own withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role can manage withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Service role can manage withdrawals" ON public.withdrawal_requests FOR ALL USING (auth.role() = 'service_role');

-- Security events
DROP POLICY IF EXISTS "Admins can view all security events" ON public.security_events;
CREATE POLICY "Admins can view all security events" ON public.security_events FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Service role can insert security events" ON public.security_events;
CREATE POLICY "Service role can insert security events" ON public.security_events FOR INSERT TO service_role WITH CHECK (true);

-- Scheduling and referrals
DROP POLICY IF EXISTS "Users can view own agendamentos" ON public.agendamentos;
CREATE POLICY "Users can view own agendamentos" ON public.agendamentos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_participants gp
    WHERE gp.id = agendamentos.participation_id AND gp.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can insert own agendamentos" ON public.agendamentos;
CREATE POLICY "Users can insert own agendamentos" ON public.agendamentos FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_participants gp
    WHERE gp.id = participation_id AND gp.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can update own agendamentos" ON public.agendamentos;
CREATE POLICY "Users can update own agendamentos" ON public.agendamentos FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.group_participants gp
    WHERE gp.id = agendamentos.participation_id AND gp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view own pagamentos" ON public.pagamentos_participacao;
CREATE POLICY "Users can view own pagamentos" ON public.pagamentos_participacao FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_participants gp
    WHERE gp.id = pagamentos_participacao.participation_id AND gp.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can insert own pagamentos" ON public.pagamentos_participacao;
CREATE POLICY "Users can insert own pagamentos" ON public.pagamentos_participacao FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_participants gp
    WHERE gp.id = participation_id AND gp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (usuario_id = auth.uid() OR indicado_id = auth.uid());
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own referrals" ON public.referrals;
CREATE POLICY "Users can update own referrals" ON public.referrals FOR UPDATE USING (usuario_id = auth.uid());

-- Influencer commissions
DROP POLICY IF EXISTS "Influencers can view their own commissions" ON public.influencer_commissions;
CREATE POLICY "Influencers can view their own commissions" ON public.influencer_commissions FOR SELECT TO authenticated USING (auth.uid() = influencer_id);
DROP POLICY IF EXISTS "Admins can view all commissions" ON public.influencer_commissions;
CREATE POLICY "Admins can view all commissions" ON public.influencer_commissions FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "System can insert commissions" ON public.influencer_commissions;
CREATE POLICY "System can insert commissions" ON public.influencer_commissions FOR INSERT TO authenticated WITH CHECK (true);

-- Domain plans
DROP POLICY IF EXISTS "Admins can manage tatuador plans" ON public.planos_tatuador;
CREATE POLICY "Admins can manage tatuador plans" ON public.planos_tatuador FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'::public.user_role)
);
DROP POLICY IF EXISTS "Anyone can view active tatuador plans" ON public.planos_tatuador;
CREATE POLICY "Anyone can view active tatuador plans" ON public.planos_tatuador FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Professionals can manage own tatuador plans" ON public.planos_tatuador;
CREATE POLICY "Professionals can manage own tatuador plans" ON public.planos_tatuador FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.id = planos_tatuador.professional_id AND profiles.role = 'professional'::public.user_role)
);

DROP POLICY IF EXISTS "Admins can manage dentista plans" ON public.planos_dentista;
CREATE POLICY "Admins can manage dentista plans" ON public.planos_dentista FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'::public.user_role)
);
DROP POLICY IF EXISTS "Anyone can view active dentista plans" ON public.planos_dentista;
CREATE POLICY "Anyone can view active dentista plans" ON public.planos_dentista FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Professionals can manage own dentista plans" ON public.planos_dentista;
CREATE POLICY "Professionals can manage own dentista plans" ON public.planos_dentista FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.id = planos_dentista.professional_id AND profiles.role = 'professional'::public.user_role)
);

-- ---------------------------------------------------------------------------
-- Functions (CREATE OR REPLACE) and helper routines
-- ---------------------------------------------------------------------------

-- Update updated_at utility
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admin_configs 
    WHERE admin_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND is_active = true
  ) INTO admin_exists;
  RETURN COALESCE(admin_exists, false);
END;
$$;

-- Handle profile creation on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8))
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_credits (user_id, total_credits, available_credits)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Group referral code
CREATE OR REPLACE FUNCTION public.generate_group_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8));
    SELECT COUNT(*) INTO exists_count FROM public.plan_groups WHERE referral_code = code;
    IF exists_count = 0 THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auto_generate_group_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_group_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create group for plan
CREATE OR REPLACE FUNCTION public.create_user_plan_group(user_uuid UUID, plan_uuid UUID, entry_amount NUMERIC)
RETURNS UUID AS $$
DECLARE
  group_uuid UUID;
  plan_max INTEGER;
  plan_price NUMERIC;
BEGIN
  SELECT max_participants, price INTO plan_max, plan_price FROM public.custom_plans WHERE id = plan_uuid AND active = true;
  IF plan_max IS NULL THEN RAISE EXCEPTION 'Plano não encontrado ou inativo'; END IF;

  INSERT INTO public.plan_groups (service_id, max_participants, target_amount, current_participants, current_amount, status, group_number)
  VALUES (plan_uuid, plan_max, plan_price, 1, entry_amount, 'forming', COALESCE((SELECT MAX(group_number) FROM public.plan_groups WHERE service_id = plan_uuid), 0) + 1)
  RETURNING id INTO group_uuid;

  INSERT INTO public.group_participants (user_id, group_id, amount_paid, status, joined_at)
  VALUES (user_uuid, group_uuid, entry_amount, 'active', now());
  RETURN group_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Join group by referral
CREATE OR REPLACE FUNCTION public.join_group_by_referral(user_uuid UUID, referral_code_param TEXT, entry_amount NUMERIC)
RETURNS UUID AS $$
DECLARE
  group_uuid UUID;
  current_count INTEGER;
  max_count INTEGER;
  plan_price NUMERIC;
BEGIN
  SELECT pg.id, pg.current_participants, pg.max_participants, cp.price
  INTO group_uuid, current_count, max_count, plan_price
  FROM public.plan_groups pg
  JOIN public.custom_plans cp ON cp.id = pg.service_id
  WHERE pg.referral_code = referral_code_param AND pg.status = 'forming';

  IF NOT FOUND THEN RAISE EXCEPTION 'Código de referência inválido ou grupo já completo'; END IF;
  IF current_count >= max_count THEN RAISE EXCEPTION 'Grupo já está completo'; END IF;
  IF EXISTS (SELECT 1 FROM public.group_participants WHERE user_id = user_uuid AND group_id = group_uuid) THEN RAISE EXCEPTION 'Usuário já está neste grupo'; END IF;

  INSERT INTO public.group_participants (user_id, group_id, amount_paid, status, joined_at, referrer_code)
  VALUES (user_uuid, group_uuid, entry_amount, 'active', now(), referral_code_param);

  UPDATE public.plan_groups SET current_participants = current_participants + 1, current_amount = current_amount + entry_amount, updated_at = now() WHERE id = group_uuid;

  SELECT current_participants INTO current_count FROM public.plan_groups WHERE id = group_uuid;
  IF current_count >= max_count THEN
    UPDATE public.plan_groups SET status = 'complete', contemplated_at = now() WHERE id = group_uuid;
    INSERT INTO public.notification_triggers (user_id, event_type, title, message, data)
    SELECT gp.user_id, 'group_completed', 'Grupo Completo!', 'Seu grupo foi completado e você já pode agendar seu serviço!', jsonb_build_object('group_id', group_uuid, 'referral_code', referral_code_param)
    FROM public.group_participants gp WHERE gp.group_id = group_uuid;
  END IF;
  RETURN group_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Taxes calculation for transacoes
CREATE OR REPLACE FUNCTION public.calcular_impostos(
  valor_base NUMERIC,
  tipo TEXT,
  municipio TEXT DEFAULT 'sao_paulo',
  regime TEXT DEFAULT 'simples_nacional'
) RETURNS JSON AS $$
DECLARE
  iss_perc NUMERIC := 0;
  icms_perc NUMERIC := 0;
  pis_cofins_perc NUMERIC := 0;
  valor_iss NUMERIC := 0;
  valor_icms NUMERIC := 0;
  valor_pis_cofins NUMERIC := 0;
  total_impostos NUMERIC := 0;
  valor_liquido NUMERIC := 0;
BEGIN
  IF tipo = 'servico' THEN
    CASE municipio
      WHEN 'sao_paulo' THEN iss_perc := 3.0;
      WHEN 'rio_de_janeiro' THEN iss_perc := 5.0;
      WHEN 'belo_horizonte' THEN iss_perc := 2.0;
      ELSE iss_perc := 3.0;
    END CASE;
    valor_iss := (valor_base * iss_perc / 100);
    total_impostos := valor_iss;
  ELSIF tipo = 'produto' THEN
    IF regime = 'simples_nacional' THEN
      icms_perc := 7.0;
      pis_cofins_perc := 3.65;
    ELSE
      icms_perc := 18.0;
      pis_cofins_perc := 9.25;
    END IF;
    valor_icms := (valor_base * icms_perc / 100);
    valor_pis_cofins := (valor_base * pis_cofins_perc / 100);
    total_impostos := valor_icms + valor_pis_cofins;
  END IF;
  valor_liquido := valor_base - total_impostos;
  RETURN json_build_object(
    'valor_base', valor_base,
    'tipo_transacao', tipo,
    'iss_percentual', iss_perc,
    'icms_percentual', icms_perc,
    'pis_cofins_percentual', pis_cofins_perc,
    'valor_iss', valor_iss,
    'valor_icms', valor_icms,
    'valor_pis_cofins', valor_pis_cofins,
    'total_impostos', total_impostos,
    'valor_liquido', valor_liquido
  );
END;
$$ LANGUAGE plpgsql;

-- Referral code generation (secure)
CREATE OR REPLACE FUNCTION public.generate_secure_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    code := 'REF' || UPPER(encode(gen_random_bytes(8), 'hex'));
    SELECT EXISTS(SELECT 1 FROM public.mlm_network WHERE referral_code = code) INTO exists_code;
    attempt_count := attempt_count + 1;
    IF NOT exists_code OR attempt_count >= max_attempts THEN
      EXIT;
    END IF;
  END LOOP;
  IF exists_code THEN
    code := code || extract(epoch from now())::bigint;
  END IF;
  RETURN code;
END;
$$;

-- MLM network & helpers
CREATE TABLE IF NOT EXISTS public.mlm_network (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 9),
  position_in_level INTEGER NOT NULL DEFAULT 1,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  active_referrals INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.mlm_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_used TEXT NOT NULL,
  commission_earned NUMERIC NOT NULL DEFAULT 0,
  commission_percentage NUMERIC NOT NULL DEFAULT 10.0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','paid','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  UNIQUE(referrer_id, referred_id)
);

CREATE TABLE IF NOT EXISTS public.mlm_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.mlm_referrals(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 9),
  amount NUMERIC NOT NULL,
  percentage NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'referral' CHECK (type IN ('referral','bonus','override')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

ALTER TABLE public.mlm_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlm_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlm_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own MLM data" ON public.mlm_network;
CREATE POLICY "Users can view their own MLM data" ON public.mlm_network FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own MLM data" ON public.mlm_network;
CREATE POLICY "Users can insert their own MLM data" ON public.mlm_network FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own MLM data" ON public.mlm_network;
CREATE POLICY "Users can update their own MLM data" ON public.mlm_network FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all MLM network data" ON public.mlm_network;
CREATE POLICY "Admins can manage all MLM network data" ON public.mlm_network FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view their referrals" ON public.mlm_referrals;
CREATE POLICY "Users can view their referrals" ON public.mlm_referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
DROP POLICY IF EXISTS "Users can create referrals where they are the referrer" ON public.mlm_referrals;
CREATE POLICY "Users can create referrals where they are the referrer" ON public.mlm_referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);
DROP POLICY IF EXISTS "Users can update their own referrals" ON public.mlm_referrals;
CREATE POLICY "Users can update their own referrals" ON public.mlm_referrals FOR UPDATE USING (auth.uid() = referrer_id);
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.mlm_referrals;
CREATE POLICY "Admins can manage all referrals" ON public.mlm_referrals FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view their own commissions_mlm" ON public.mlm_commissions;
CREATE POLICY "Users can view their own commissions_mlm" ON public.mlm_commissions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all commissions_mlm" ON public.mlm_commissions;
CREATE POLICY "Admins can manage all commissions_mlm" ON public.mlm_commissions FOR ALL USING (public.is_admin());

-- MLM referral code handlers
CREATE OR REPLACE FUNCTION public.handle_mlm_referral_code_secure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_secure_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_mlm_level(referred_by UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  parent_level INTEGER;
BEGIN
  IF referred_by IS NULL THEN RETURN 1; END IF;
  SELECT level INTO parent_level FROM public.mlm_network WHERE user_id = referred_by;
  IF parent_level IS NULL THEN RETURN 1; END IF;
  RETURN LEAST(parent_level + 1, 9);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_mlm_level_calculation()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := public.calculate_mlm_level(NEW.referred_by_user_id);
  NEW.position_in_level := COALESCE((SELECT COUNT(*) + 1 FROM public.mlm_network WHERE level = NEW.level AND created_at < NEW.created_at), 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.process_mlm_referral(new_user_id UUID, referral_code_used TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_user_id UUID;
  commission_amount NUMERIC := 50.0;
BEGIN
  SELECT user_id INTO referrer_user_id FROM public.mlm_network WHERE referral_code = referral_code_used AND status = 'active';
  IF referrer_user_id IS NULL THEN RETURN FALSE; END IF;

  INSERT INTO public.mlm_network (user_id, referred_by_user_id, status)
  VALUES (new_user_id, referrer_user_id, 'active')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.mlm_referrals (referrer_id, referred_id, referral_code_used, commission_earned, status)
  VALUES (referrer_user_id, new_user_id, referral_code_used, commission_amount, 'confirmed')
  ON CONFLICT DO NOTHING;

  UPDATE public.mlm_network 
  SET total_referrals = total_referrals + 1,
      active_referrals = active_referrals + 1,
      total_earnings = total_earnings + commission_amount,
      updated_at = now()
  WHERE user_id = referrer_user_id;
  RETURN TRUE;
END;
$$;

-- Influencer commission helpers
CREATE OR REPLACE FUNCTION public.calculate_influencer_commission(
  p_product_total_value DECIMAL,
  p_entry_percentage DECIMAL DEFAULT 10.0,
  p_commission_percentage DECIMAL DEFAULT 25.0
) RETURNS DECIMAL AS $$
DECLARE
  v_entry_value DECIMAL;
  v_commission_amount DECIMAL;
BEGIN
  v_entry_value := p_product_total_value * (p_entry_percentage / 100.0);
  v_commission_amount := v_entry_value * (p_commission_percentage / 100.0);
  RETURN v_commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.create_influencer_commission(
  p_influencer_id UUID,
  p_client_id UUID,
  p_product_id UUID,
  p_referral_code TEXT,
  p_product_total_value DECIMAL
) RETURNS UUID AS $$
DECLARE
  v_entry_value DECIMAL;
  v_commission_amount DECIMAL;
  v_commission_id UUID;
BEGIN
  v_entry_value := p_product_total_value * 0.10;
  v_commission_amount := v_entry_value * 0.25;
  INSERT INTO public.influencer_commissions (
    influencer_id, client_id, product_id, referral_code, product_total_value,
    entry_value, commission_amount, status
  ) VALUES (
    p_influencer_id, p_client_id, p_product_id, p_referral_code, p_product_total_value,
    v_entry_value, v_commission_amount, 'pending'
  ) RETURNING id INTO v_commission_id;

  INSERT INTO public.notifications (user_id, type, title, message, category)
  VALUES (
    p_influencer_id,
    'success',
    'Nova Comissão Disponível!',
    format('Você recebeu uma comissão de R$ %.2f por sua indicação. Valor da entrada: R$ %.2f (10%% de R$ %.2f)', v_commission_amount, v_entry_value, p_product_total_value),
    'commission'
  );
  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.process_influencer_commission(
  p_client_id UUID,
  p_referral_code TEXT,
  p_product_total_value DECIMAL
) RETURNS VOID AS $$
DECLARE
  v_influencer_id UUID;
  v_entry_value DECIMAL;
  v_commission_amount DECIMAL;
BEGIN
  SELECT user_id INTO v_influencer_id FROM public.mlm_network WHERE referral_code = p_referral_code AND status = 'active';
  IF NOT FOUND THEN RETURN; END IF;
  v_entry_value := p_product_total_value * 0.10;
  v_commission_amount := v_entry_value * 0.25;
  INSERT INTO public.influencer_commissions (
    influencer_id, client_id, referral_code, product_total_value, entry_value, commission_amount, status
  ) VALUES (
    v_influencer_id, p_client_id, p_referral_code, p_product_total_value, v_entry_value, v_commission_amount, 'pending'
  );

  INSERT INTO public.notifications (user_id, type, title, message, category)
  VALUES (
    v_influencer_id,
    'success',
    'Nova Comissão Disponível!',
    format('Você recebeu uma comissão de R$ %.2f por sua indicação. Comissão calculada sobre entrada de R$ %.2f', v_commission_amount, v_entry_value),
    'commission'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Payment helpers
CREATE OR REPLACE FUNCTION public.update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_transacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_influencer_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_asaas_subaccounts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Payment amount validation
CREATE OR REPLACE FUNCTION public.validate_payment_amount(payment_id UUID, received_amount NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  expected_amount NUMERIC;
BEGIN
  SELECT amount INTO expected_amount FROM public.payments WHERE id = payment_id;
  RETURN ABS(expected_amount - received_amount) < 0.01;
END;
$$;

-- Validate CPF/CNPJ (basic)
CREATE OR REPLACE FUNCTION public.validate_cpf_cnpj(document TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  document := regexp_replace(document, '[^0-9]', '', 'g');
  IF length(document) NOT IN (11, 14) THEN RETURN FALSE; END IF;
  IF document ~ '^(.)\1*$' THEN RETURN FALSE; END IF;
  RETURN TRUE;
END; $$ LANGUAGE plpgsql;

-- Fetch split rules
CREATE OR REPLACE FUNCTION public.get_split_rules(p_product_id UUID DEFAULT NULL, p_service_id UUID DEFAULT NULL)
RETURNS TABLE(
  professional_percentage NUMERIC,
  platform_percentage NUMERIC,
  influencer_percentage NUMERIC,
  fixed_platform_fee NUMERIC
) AS $$
BEGIN
  IF p_product_id IS NOT NULL THEN
    RETURN QUERY SELECT r.professional_percentage, r.platform_percentage, r.influencer_percentage, r.fixed_platform_fee
    FROM public.payment_split_rules r WHERE r.product_id = p_product_id LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  IF p_service_id IS NOT NULL THEN
    RETURN QUERY SELECT r.professional_percentage, r.platform_percentage, r.influencer_percentage, r.fixed_platform_fee
    FROM public.payment_split_rules r WHERE r.service_id = p_service_id LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  RETURN QUERY SELECT 70.0::NUMERIC, 20.0::NUMERIC, 10.0::NUMERIC, 0.0::NUMERIC;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security event logger
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  event_id UUID;
BEGIN
  IF p_severity NOT IN ('low','medium','high','critical') THEN p_severity := 'info'; END IF;
  INSERT INTO public.security_events (event_type, user_id, ip_address, user_agent, details, severity)
  VALUES (p_event_type, p_user_id, p_ip_address, p_user_agent, p_details, p_severity)
  RETURNING id INTO event_id;
  RETURN event_id;
END;
$$;

-- Cleanup logs utility
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.error_logs WHERE timestamp < now() - INTERVAL '30 days';
  DELETE FROM public.activity_logs WHERE timestamp < now() - INTERVAL '30 days';
  DELETE FROM public.performance_metrics WHERE timestamp < now() - INTERVAL '30 days';
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Triggers (drop-if-exists then create)
-- ---------------------------------------------------------------------------

-- Updated_at triggers (generic)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_professionals_updated_at ON public.professionals;
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_influencers_updated_at ON public.influencers;
CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON public.influencers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_plans_updated_at ON public.custom_plans;
CREATE TRIGGER update_custom_plans_updated_at BEFORE UPDATE ON public.custom_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_groups_updated_at ON public.plan_groups;
CREATE TRIGGER update_plan_groups_updated_at BEFORE UPDATE ON public.plan_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_group_participants_updated_at ON public.group_participants;
CREATE TRIGGER update_group_participants_updated_at BEFORE UPDATE ON public.group_participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_payments_updated_at();

DROP TRIGGER IF EXISTS trigger_update_transacoes_updated_at ON public.transacoes;
CREATE TRIGGER trigger_update_transacoes_updated_at BEFORE UPDATE ON public.transacoes FOR EACH ROW EXECUTE FUNCTION public.update_transacoes_updated_at();

DROP TRIGGER IF EXISTS trigger_update_asaas_subaccounts_updated_at ON public.asaas_subaccounts;
CREATE TRIGGER trigger_update_asaas_subaccounts_updated_at BEFORE UPDATE ON public.asaas_subaccounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_asaas_subaccounts();

DROP TRIGGER IF EXISTS update_influencer_commissions_updated_at ON public.influencer_commissions;
CREATE TRIGGER update_influencer_commissions_updated_at BEFORE UPDATE ON public.influencer_commissions FOR EACH ROW EXECUTE FUNCTION public.update_influencer_commissions_updated_at();

DROP TRIGGER IF EXISTS update_marketplace_products_updated_at ON public.marketplace_products;
CREATE TRIGGER update_marketplace_products_updated_at BEFORE UPDATE ON public.marketplace_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_sales_updated_at ON public.marketplace_sales;
CREATE TRIGGER update_marketplace_sales_updated_at BEFORE UPDATE ON public.marketplace_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Group referral/triggers
DROP TRIGGER IF EXISTS trigger_auto_generate_group_referral_code ON public.plan_groups;
CREATE TRIGGER trigger_auto_generate_group_referral_code BEFORE INSERT ON public.plan_groups FOR EACH ROW EXECUTE FUNCTION public.auto_generate_group_referral_code();

-- Auth hook
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- MLM triggers
DROP TRIGGER IF EXISTS trigger_handle_mlm_referral_code_secure ON public.mlm_network;
CREATE TRIGGER trigger_handle_mlm_referral_code_secure BEFORE INSERT ON public.mlm_network FOR EACH ROW EXECUTE FUNCTION public.handle_mlm_referral_code_secure();

DROP TRIGGER IF EXISTS trigger_calculate_mlm_level ON public.mlm_network;
CREATE TRIGGER trigger_calculate_mlm_level BEFORE INSERT ON public.mlm_network FOR EACH ROW EXECUTE FUNCTION public.handle_mlm_level_calculation();

-- Scheduling/referrals updated_at
DROP TRIGGER IF EXISTS update_agendamentos_updated_at ON public.agendamentos;
CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pagamentos_updated_at ON public.pagamentos_participacao;
CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON public.pagamentos_participacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_referrals_updated_at ON public.referrals;
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Seeds (minimal, safe, idempotent)
-- ---------------------------------------------------------------------------

-- Seed admin config
INSERT INTO public.admin_configs (admin_email)
VALUES ('admin@amigodopeito.com')
ON CONFLICT (admin_email) DO NOTHING;

-- Sample products and plans
INSERT INTO public.products (name, description, price, category, target_audience, image_url)
VALUES
('Curso de Tatuagem Básica', 'Aprenda os fundamentos da tatuagem com profissionais experientes', 299.99, 'cursos', 'user', '/lovable-uploads/course-tattoo.jpg'),
('Kit Insumos Tattoo Profissional', 'Kit completo com agulhas, tintas e equipamentos para tatuadores', 450.00, 'insumos', 'professional', '/lovable-uploads/tattoo-kit.jpg')
ON CONFLICT DO NOTHING;

INSERT INTO public.custom_plans (name, description, price, duration_months, features, category)
VALUES
('Plano Básico Tattoo', 'Acesso básico à plataforma e materiais', 99.99, 1, '["Acesso à biblioteca de designs", "Suporte básico", "1 consulta mensal"]'::jsonb, 'tattoo'),
('Plano Premium Tattoo', 'Acesso completo com benefícios extras', 199.99, 1, '["Acesso total", "Suporte prioritário", "Consultas ilimitadas", "Materiais exclusivos"]'::jsonb, 'tattoo'),
('Plano Dental Profissional', 'Para profissionais da área odontológica', 299.99, 3, '["Cursos especializados", "Certificações", "Networking profissional"]'::jsonb, 'dental')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- How to run
-- ---------------------------------------------------------------------------
-- Option A) Using psql (local or remote Postgres/Supabase database URL)
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f schema.sql
--
-- Option B) Using Supabase CLI (local dev)
--   supabase start
--   supabase db reset --use-migra --db-url "$DATABASE_URL" --file schema.sql
--   # or simply:
--   supabase db execute --file schema.sql
--
-- Notes:
-- - This script is idempotent: safe to re-run; it drops/recreates policies and triggers as needed,
--   uses IF NOT EXISTS guards for tables, indexes, extensions, and OR REPLACE for functions.
-- - Execution order is already dependency-safe: tables -> indexes -> RLS -> policies -> functions -> triggers -> seeds.
-- - Seeding auth.users is intentionally omitted for Supabase compatibility. Create users via Supabase Auth API/CLI.

