-- Ensure explicit FK names for orders table for easier joins
DO $$
BEGIN
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
  ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_plan_id_fkey;
  ALTER TABLE public.orders ADD CONSTRAINT orders_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.custom_plans(id) ON DELETE RESTRICT;

  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_intended_leader_id_fkey;
  ALTER TABLE public.orders ADD CONSTRAINT orders_intended_leader_id_fkey FOREIGN KEY (intended_leader_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
END $$;

