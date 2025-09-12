-- Fix conflicting index name and ensure membership-level uniqueness for leader role

-- Drop erroneous groups-level index if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_single_leader_per_group'
  ) THEN
    EXECUTE 'DROP INDEX public.uq_single_leader_per_group';
  END IF;
END $$;

-- Create a properly named unique index on group_memberships for single active leader per group
CREATE UNIQUE INDEX IF NOT EXISTS uq_single_leader_per_group_membership
ON public.group_memberships(group_id)
WHERE role = 'leader' AND status = 'active';

