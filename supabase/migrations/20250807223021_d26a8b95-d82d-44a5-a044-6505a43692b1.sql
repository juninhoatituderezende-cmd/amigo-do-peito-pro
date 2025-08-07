-- Add the specific user to admin_configs table
INSERT INTO public.admin_configs (admin_email, is_active)
VALUES ('juninhoatitude@hotmail.com', true)
ON CONFLICT (admin_email) DO UPDATE SET is_active = true;