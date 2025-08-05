-- Add PIX support to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS pix_code TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Create indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON public.payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_pix_code ON public.payments(pix_code);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);

-- Update payments table to support new payment methods
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit_card' CHECK (payment_method IN ('credit_card', 'pix', 'boleto'));

-- Function to handle payment confirmation
CREATE OR REPLACE FUNCTION confirm_payment(
  p_payment_id UUID,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  payment_record RECORD;
  plan_record RECORD;
  result JSON;
BEGIN
  -- Get payment details
  SELECT * INTO payment_record FROM public.payments WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payment not found');
  END IF;
  
  -- Get plan details
  SELECT * INTO plan_record FROM public.custom_plans WHERE id = payment_record.plan_id;
  
  -- Update payment status
  UPDATE public.payments 
  SET 
    status = 'paid',
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = p_payment_id;
  
  -- Add user to plan participants
  INSERT INTO public.plan_participants (
    plan_id,
    user_id,
    payment_status,
    entry_paid_at
  ) VALUES (
    payment_record.plan_id,
    payment_record.user_id,
    'paid',
    NOW()
  ) ON CONFLICT (plan_id, user_id) DO UPDATE SET
    payment_status = 'paid',
    entry_paid_at = NOW();
    
  -- Create commission if influencer involved
  IF payment_record.influencer_code IS NOT NULL THEN
    INSERT INTO public.commissions (
      influencer_id,
      plan_id,
      user_id,
      commission_amount,
      status
    ) 
    SELECT 
      p.id,
      payment_record.plan_id,
      payment_record.user_id,
      payment_record.amount * 0.10, -- 10% commission
      'pending'
    FROM public.profiles p 
    WHERE p.referral_code = payment_record.influencer_code;
  END IF;
  
  -- Log activity
  INSERT INTO public.activity_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    COALESCE(p_admin_id, payment_record.user_id),
    'payment_confirmed',
    'payment',
    p_payment_id::TEXT,
    json_build_object(
      'amount', payment_record.amount,
      'method', payment_record.payment_method,
      'plan_id', payment_record.plan_id
    )
  );
  
  RETURN json_build_object(
    'success', true, 
    'payment_id', p_payment_id,
    'amount', payment_record.amount,
    'plan_title', plan_record.title
  );
  
EXCEPTION WHEN others THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION confirm_payment TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_payment TO service_role;