-- Create user_credits table to track user credit balances
CREATE TABLE public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_credits DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  available_credits DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pending_withdrawal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create credit_transactions table to track all credit movements
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  source TEXT NOT NULL CHECK (source IN ('initial_payment', 'referral_bonus', 'marketplace_purchase', 'withdrawal', 'admin_adjustment')),
  description TEXT NOT NULL,
  related_order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create withdrawal_requests table for withdrawal management
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  admin_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at);
CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- Enable Row Level Security
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits" ON public.user_credits
  FOR ALL USING (true);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all transactions" ON public.credit_transactions
  FOR ALL USING (true);

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all withdrawal requests" ON public.withdrawal_requests
  FOR ALL USING (true);

-- Function to update updated_at on user_credits
CREATE OR REPLACE FUNCTION public.handle_updated_at_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_user_credits();

-- Function to automatically convert payment to credits after 180 days
CREATE OR REPLACE FUNCTION public.auto_convert_expired_payments()
RETURNS void AS $$
DECLARE
  expired_payment RECORD;
BEGIN
  -- Find groups that haven't been completed after 180 days
  FOR expired_payment IN 
    SELECT DISTINCT 
      g.user_id,
      g.paid_amount,
      g.id as group_id
    FROM groups g
    WHERE g.status = 'forming'
    AND g.created_at < NOW() - INTERVAL '180 days'
    AND NOT EXISTS (
      SELECT 1 FROM credit_transactions ct 
      WHERE ct.user_id = g.user_id 
      AND ct.source = 'initial_payment'
      AND ct.related_order_id = g.id::text
    )
  LOOP
    -- Add credits for the user
    INSERT INTO credit_transactions (
      user_id,
      amount,
      type,
      source,
      description,
      related_order_id
    ) VALUES (
      expired_payment.user_id,
      expired_payment.paid_amount,
      'credit',
      'initial_payment',
      'Conversão automática de pagamento após 180 dias - Grupo #' || expired_payment.group_id,
      expired_payment.group_id::text
    );

    -- Update user credits balance
    INSERT INTO user_credits (user_id, total_credits, available_credits)
    VALUES (expired_payment.user_id, expired_payment.paid_amount, expired_payment.paid_amount)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_credits = user_credits.total_credits + expired_payment.paid_amount,
      available_credits = user_credits.available_credits + expired_payment.paid_amount,
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the auto conversion (this would need to be set up in Supabase dashboard)
-- SELECT cron.schedule('auto-convert-expired-payments', '0 2 * * *', 'SELECT public.auto_convert_expired_payments();');