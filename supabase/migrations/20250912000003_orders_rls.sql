-- Enable RLS and add simple policies for orders and group_memberships

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view own orders by profile id mapping
CREATE POLICY IF NOT EXISTS orders_select_own ON public.orders
FOR SELECT USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Service role can manage orders
CREATE POLICY IF NOT EXISTS orders_manage_service ON public.orders
FOR ALL USING (auth.role() = 'service_role');

-- Service role manages memberships; users can view membership they belong to
CREATE POLICY IF NOT EXISTS memberships_select_own ON public.group_memberships
FOR SELECT USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY IF NOT EXISTS memberships_manage_service ON public.group_memberships
FOR ALL USING (auth.role() = 'service_role');

