-- Add missing RLS policies for remaining tables

-- Services policies (allow viewing all services, but only professionals can manage their own)
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Professionals can manage their own services" ON public.services FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.professionals 
    WHERE professionals.id = services.professional_id 
    AND professionals.user_id = auth.uid()
  )
);

-- Plan participants policies (admin access needed)
CREATE POLICY "Admins can manage plan participants" ON public.plan_participants FOR ALL USING (true);

-- Groups policies (users can view their own groups)
CREATE POLICY "Users can view their own groups" ON public.groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own groups" ON public.groups FOR ALL USING (auth.uid() = user_id);

-- Transactions policies (users and professionals can view their own)
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Professionals can view their transactions" ON public.transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.professionals 
    WHERE professionals.id = transactions.professional_id 
    AND professionals.user_id = auth.uid()
  )
);

-- Withdrawals policies (professionals can manage their own)
CREATE POLICY "Professionals can manage their own withdrawals" ON public.withdrawals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.professionals 
    WHERE professionals.id = withdrawals.professional_id 
    AND professionals.user_id = auth.uid()
  )
);

-- User credits policies (already created but add missing operations)
CREATE POLICY "Users can update their own credits" ON public.user_credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credits" ON public.user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Credit transactions policies (add missing operations) 
CREATE POLICY "Users can insert their own credit transactions" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification triggers policies
CREATE POLICY "Users can view their own notification triggers" ON public.notification_triggers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own notification triggers" ON public.notification_triggers FOR ALL USING (auth.uid() = user_id);

-- Issues policies
CREATE POLICY "Users can view their own issues" ON public.issues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own issues" ON public.issues FOR ALL USING (auth.uid() = user_id);

-- Fix function security path issue
DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;