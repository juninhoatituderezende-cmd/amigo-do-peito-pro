-- Migration: Align schema to model "1 líder ⇒ 9 indicados"
-- Changes:
-- - Use profiles(id) as FK instead of auth.users(id)
-- - Introduce orders and processed_payments tables
-- - Introduce group_memberships table
-- - Update groups table to support leader, plan and capacity
-- - Constraints, checks and indexes per spec

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Groups adjustments (if table exists in any form)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'groups'
  ) THEN
    -- Add leader_id, plan_id, capacity, current_size, status if missing
    ALTER TABLE public.groups 
      ADD COLUMN IF NOT EXISTS leader_id UUID,
      ADD COLUMN IF NOT EXISTS plan_id UUID,
      ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS current_size INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

    -- Drop old columns that conflict, if they exist
    -- Safe drops are wrapped in individual blocks
    BEGIN
      ALTER TABLE public.groups DROP COLUMN IF EXISTS max_count;
    EXCEPTION WHEN undefined_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.groups DROP COLUMN IF EXISTS current_count;
    EXCEPTION WHEN undefined_column THEN NULL; END;

    -- Ensure FKs point to profiles(id)
    -- Buyer/leader semantics: leader_id is the group owner
    BEGIN
      ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_buyer_id_fkey;
    EXCEPTION WHEN undefined_object THEN NULL; END;

    BEGIN
      ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_leader_id_fkey;
    EXCEPTION WHEN undefined_object THEN NULL; END;

    ALTER TABLE public.groups 
      ADD CONSTRAINT groups_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- Plan FK: plans might come from multiple sources; use custom_plans as canonical for MLM
    BEGIN
      ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_plan_id_fkey;
    EXCEPTION WHEN undefined_object THEN NULL; END;

    ALTER TABLE public.groups
      ADD CONSTRAINT groups_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.custom_plans(id) ON DELETE RESTRICT;

    -- Checks
    ALTER TABLE public.groups 
      ADD CONSTRAINT chk_groups_sizes CHECK (current_size BETWEEN 0 AND capacity) NOT VALID;

    -- Unique: one active leader per group (uq_single_leader_per_group)
    -- Enforce only one membership with role='leader' per group in group_memberships table, but also keep a unique on leader_id,status at group-level for active
    DROP INDEX IF EXISTS ix_groups_leader_status;
    CREATE UNIQUE INDEX IF NOT EXISTS uq_single_leader_per_group ON public.groups(leader_id, id) WHERE status = 'active';

    -- Optional: one active group per (leader, plan)
    CREATE UNIQUE INDEX IF NOT EXISTS uq_active_group_per_leader_plan ON public.groups(leader_id, plan_id) WHERE status = 'active';

    -- Status normalization
    -- Map previous statuses to new domain if needed (no-op if same)
  ELSE
    -- Create groups table when absent (minimal set to satisfy requirements)
    CREATE TABLE public.groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      leader_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      plan_id UUID REFERENCES public.custom_plans(id) ON DELETE RESTRICT,
      referral_code TEXT UNIQUE,
      capacity INTEGER NOT NULL DEFAULT 10,
      current_size INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      contemplated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT chk_groups_sizes CHECK (current_size BETWEEN 0 AND capacity)
    );

    -- Uniques and indexes
    CREATE UNIQUE INDEX IF NOT EXISTS uq_single_leader_per_group ON public.groups(leader_id, id) WHERE status = 'active';
    CREATE UNIQUE INDEX IF NOT EXISTS uq_active_group_per_leader_plan ON public.groups(leader_id, plan_id) WHERE status = 'active';
  END IF;
END$$;

-- 2) Group memberships table (user roles within groups)
CREATE TABLE IF NOT EXISTS public.group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'leader' | 'member'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'left' | 'removed'
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Index to query active members per group
DROP INDEX IF EXISTS ix_memberships_group;
CREATE INDEX ix_memberships_group ON public.group_memberships(group_id) WHERE status = 'active';

-- 3) Orders table (checkout intent before payment)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.custom_plans(id) ON DELETE RESTRICT,
  intended_leader_id UUID REFERENCES public.profiles(id), -- NULL when creating own group
  provider_session_id TEXT UNIQUE NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'cancelled'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique provider session
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_provider_session ON public.orders(provider_session_id);

-- 4) Processed payments idempotency table
CREATE TABLE IF NOT EXISTS public.processed_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_event_id TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for processed payment lookups
CREATE INDEX IF NOT EXISTS ix_processed_order ON public.processed_payments(order_id);

-- 5) Additional indexes for groups and orders
CREATE INDEX IF NOT EXISTS ix_groups_leader_status ON public.groups(leader_id, status);
CREATE INDEX IF NOT EXISTS ix_groups_plan_status ON public.groups(plan_id, status);

-- 6) Trigger helpers to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_set_updated_at ON public.orders;
CREATE TRIGGER trg_orders_set_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_groups_set_updated_at ON public.groups;
CREATE TRIGGER trg_groups_set_updated_at BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7) Optional helper function to safely increment group size under capacity
CREATE OR REPLACE FUNCTION public.try_join_group(p_group_id UUID)
RETURNS TABLE(new_size INTEGER) AS $$
DECLARE
  v_capacity INTEGER;
  v_size INTEGER;
BEGIN
  SELECT capacity, current_size INTO v_capacity, v_size FROM public.groups WHERE id = p_group_id FOR UPDATE;
  IF v_size < v_capacity THEN
    UPDATE public.groups SET current_size = current_size + 1, updated_at = now() WHERE id = p_group_id RETURNING current_size INTO v_size;
    RETURN QUERY SELECT v_size;
  ELSE
    RETURN QUERY SELECT v_size; -- unchanged, signals overflow
  END IF;
END;
$$ LANGUAGE plpgsql;

