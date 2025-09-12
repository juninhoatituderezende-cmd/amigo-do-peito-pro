-- Basic SQL asserts for constraints and idempotency behavior

-- 1) Unique provider_session_id
DO $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.orders (id, user_id, plan_id, provider_session_id, amount_cents, currency)
  VALUES (v_id, '00000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'prov_test', 100, 'BRL');
  BEGIN
    INSERT INTO public.orders (user_id, plan_id, provider_session_id, amount_cents, currency)
    VALUES ('00000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'prov_test', 100, 'BRL');
  EXCEPTION WHEN unique_violation THEN
    -- expected
    NULL;
  END;
END $$;

-- 2) Capacity check via function
DO $$
DECLARE
  g_id uuid;
  i int;
  join_ok boolean;
  new_sz int;
BEGIN
  INSERT INTO public.groups (leader_id, plan_id, capacity, current_size, status)
  VALUES ('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 0, 'active')
  RETURNING id INTO g_id;
  -- join leader
  SELECT joined, group_id, new_size INTO join_ok, g_id, new_sz FROM public.join_group_membership(g_id, '00000000-0000-0000-0000-000000000001', 'leader');
  -- join member
  PERFORM joined FROM public.join_group_membership(g_id, '00000000-0000-0000-0000-000000000003', 'member');
  -- attempt overflow
  PERFORM joined FROM public.join_group_membership(g_id, '00000000-0000-0000-0000-000000000002', 'member');
END $$;

-- 3) Idempotency table unique
DO $$
BEGIN
  INSERT INTO public.processed_payments (provider_event_id) VALUES ('asaas:test:123');
  BEGIN
    INSERT INTO public.processed_payments (provider_event_id) VALUES ('asaas:test:123');
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END $$;

