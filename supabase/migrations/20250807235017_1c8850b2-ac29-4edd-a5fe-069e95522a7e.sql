-- Create payments table if not exists
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  payment_method TEXT NOT NULL DEFAULT 'credit_card',
  status TEXT NOT NULL DEFAULT 'pending',
  pix_code TEXT NULL,
  stripe_session_id TEXT NULL,
  influencer_code TEXT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;

-- Create RLS policies for payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payments" 
ON public.payments 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON public.payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_pix_code ON public.payments(pix_code);
CREATE INDEX IF NOT EXISTS idx_payments_method ON public.payments(payment_method);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payments_updated_at_trigger ON public.payments;
CREATE TRIGGER update_payments_updated_at_trigger
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();