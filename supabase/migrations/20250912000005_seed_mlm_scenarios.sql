-- Seed script for basic scenarios: without referral (own group) and with referral (join leader)

-- Create two sample profiles if not exist
INSERT INTO public.profiles (id, user_id, full_name, email)
VALUES
  ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Líder Exemplo', 'leader@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, user_id, full_name, email)
VALUES
  ('00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Comprador Sem Ref', 'buyer1@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, user_id, full_name, email)
VALUES
  ('00000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Comprador Com Ref', 'buyer2@example.com')
ON CONFLICT (id) DO NOTHING;

-- Ensure a custom plan exists
INSERT INTO public.custom_plans (id, name, description, price, entry_price, max_participants, active)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Plano Demo', 'Plano de teste', 1000, 100, 10, true)
ON CONFLICT (id) DO NOTHING;

-- Leader has active group
INSERT INTO public.groups (leader_id, plan_id, capacity, current_size, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 10, 1, 'active')
ON CONFLICT DO NOTHING;

