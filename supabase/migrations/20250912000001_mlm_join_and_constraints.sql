-- Add unique leader-per-group partial index and atomic join function

-- Ensure only one active leader membership per group
CREATE UNIQUE INDEX IF NOT EXISTS uq_single_leader_per_group
ON public.group_memberships(group_id)
WHERE role = 'leader' AND status = 'active';

-- Atomic join function: inserts membership and increments group size under capacity
CREATE OR REPLACE FUNCTION public.join_group_membership(
  p_group_id UUID,
  p_user_profile_id UUID,
  p_role TEXT DEFAULT 'member'
)
RETURNS TABLE(joined BOOLEAN, group_id UUID, new_size INTEGER) AS $$
DECLARE
  v_capacity INTEGER;
  v_size INTEGER;
  v_inserted_id UUID;
BEGIN
  SELECT capacity, current_size INTO v_capacity, v_size
  FROM public.groups
  WHERE id = p_group_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, p_group_id, NULL::INTEGER;
    RETURN;
  END IF;

  IF v_size >= v_capacity THEN
    RETURN QUERY SELECT FALSE, p_group_id, v_size;
    RETURN;
  END IF;

  -- Attempt to insert membership (will respect uq_single_leader_per_group via unique partial index)
  INSERT INTO public.group_memberships (group_id, user_id, role, status)
  VALUES (p_group_id, p_user_profile_id, COALESCE(p_role, 'member'), 'active')
  ON CONFLICT (group_id, user_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    -- Already member; do not increment size
    RETURN QUERY SELECT TRUE, p_group_id, v_size;
    RETURN;
  END IF;

  -- Increment group size
  UPDATE public.groups
  SET current_size = current_size + 1, updated_at = now()
  WHERE id = p_group_id
  RETURNING current_size INTO v_size;

  RETURN QUERY SELECT TRUE, p_group_id, v_size;
END;
$$ LANGUAGE plpgsql;

