-- Ensure contemplations/service_history/reviews exist and wallet crediting on service completion

-- 1) Tables already defined in database_professional_system.sql; create idempotent safety
CREATE TABLE IF NOT EXISTS public.contemplations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'contemplated' CHECK (status IN ('contemplated', 'service_confirmed', 'completed')),
  service_confirmed BOOLEAN DEFAULT FALSE,
  before_photos TEXT[],
  after_photos TEXT[],
  confirmation_date TIMESTAMPTZ,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'released', 'paid')),
  service_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  service_date TIMESTAMPTZ NOT NULL,
  service_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'released', 'paid')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  before_photos TEXT[],
  after_photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.professional_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  service_type TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contemplations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;

-- Minimal policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contemplations' AND policyname='Professionals select contemplations'
  ) THEN
    CREATE POLICY "Professionals select contemplations" ON public.contemplations
      FOR SELECT TO authenticated USING (professional_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='service_history' AND policyname='Professionals select history'
  ) THEN
    CREATE POLICY "Professionals select history" ON public.service_history
      FOR SELECT TO authenticated USING (professional_id = auth.uid());
  END IF;
END $$;

-- 2) When service_confirmed=true, create pagamentos_profissionais if not exists and credit after release
CREATE TABLE IF NOT EXISTS public.pagamentos_profissionais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contemplation_id UUID REFERENCES public.contemplations(id) ON DELETE CASCADE,
  service_type TEXT,
  total_service_value DECIMAL(10,2),
  professional_percentage DECIMAL(5,2) DEFAULT 50.00,
  professional_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','awaiting_validation','released','paid')),
  release_date TIMESTAMPTZ,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pagamentos_profissionais ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pagamentos_profissionais_professional_id ON public.pagamentos_profissionais(professional_id);

-- Function to create professional payment on confirmation
CREATE OR REPLACE FUNCTION public.on_contemplation_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  v_amount DECIMAL(10,2);
  v_prof_amount DECIMAL(10,2);
BEGIN
  IF NEW.service_confirmed = TRUE AND (OLD.service_confirmed IS DISTINCT FROM TRUE) THEN
    v_amount := COALESCE(NEW.service_value, 0);
    v_prof_amount := v_amount * 0.50;

    INSERT INTO public.pagamentos_profissionais (
      professional_id, client_id, contemplation_id, service_type, total_service_value, professional_amount, status, release_date
    ) VALUES (
      NEW.professional_id, NEW.user_id, NEW.id, 'servico', v_amount, v_prof_amount, 'released', NOW()
    );

    -- Optionally also register in service_history
    INSERT INTO public.service_history (
      professional_id, client_name, service_date, service_type, amount, payment_status
    ) VALUES (
      NEW.professional_id, 'Cliente', NOW(), 'servico', v_amount, 'released'
    );
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_contemplation_confirmed ON public.contemplations;
CREATE TRIGGER trg_on_contemplation_confirmed
  AFTER UPDATE ON public.contemplations
  FOR EACH ROW
  EXECUTE PROCEDURE public.on_contemplation_confirmed();

-- 3) Ensure release_professional_payment exists (already in database_automatic_payments.sql)
-- 4) When pagamento marked paid, also create credit_transactions
CREATE OR REPLACE FUNCTION public.on_professional_payment_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    INSERT INTO public.credit_transactions (
      user_id, type, amount, description, source_type, commission_rate, reference_id
    ) VALUES (
      NEW.professional_id, 'earned', NEW.professional_amount, 'Pagamento de serviço liberado', 'professional_service', 50, NEW.id::text
    );
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_prof_payment_paid ON public.pagamentos_profissionais;
CREATE TRIGGER trg_on_prof_payment_paid
  AFTER UPDATE ON public.pagamentos_profissionais
  FOR EACH ROW
  EXECUTE PROCEDURE public.on_professional_payment_paid();

