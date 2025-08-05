-- Digital Wallet and Group Validation System
-- Tables for digital wallet, group tracking and referral validation

-- Digital wallet table
CREATE TABLE public.digital_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  available_balance DECIMAL(10,2) DEFAULT 0.00,
  pending_balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
  pix_key TEXT,
  pix_key_type TEXT, -- email, cpf, phone, random
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.digital_wallet(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- credit, debit, withdrawal, commission, conversion
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id TEXT, -- can reference groups, sales, etc
  status TEXT DEFAULT 'completed', -- pending, completed, failed, cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group members tracking (for the 9 referrals validation)
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES auth.users(id), -- who referred this member
  position INTEGER, -- 1-9 position in the group
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_validated BOOLEAN DEFAULT false,
  validated_at TIMESTAMPTZ,
  UNIQUE(group_id, user_id),
  UNIQUE(group_id, position)
);

-- Group validation milestones
CREATE TABLE public.group_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- 3_members, 6_members, 9_members, completed
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reward_amount DECIMAL(10,2),
  reward_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referral validation tracking
CREATE TABLE public.referral_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  validation_step INTEGER, -- 1-9 representing the 9 required referrals
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reward_amount DECIMAL(10,2),
  reward_status TEXT DEFAULT 'pending', -- pending, credited, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.digital_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_validations ENABLE ROW LEVEL SECURITY;

-- Digital wallet policies
CREATE POLICY "select_own_wallet" ON public.digital_wallet FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_wallet" ON public.digital_wallet FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_wallet" ON public.digital_wallet FOR UPDATE USING (user_id = auth.uid());

-- Wallet transactions policies
CREATE POLICY "select_own_transactions" ON public.wallet_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "update_transactions" ON public.wallet_transactions FOR UPDATE USING (true);

-- Group members policies
CREATE POLICY "select_group_members" ON public.group_members FOR SELECT USING (
  user_id = auth.uid() OR 
  referrer_id = auth.uid() OR
  group_id IN (SELECT id FROM groups WHERE user_id = auth.uid())
);
CREATE POLICY "insert_group_members" ON public.group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "update_group_members" ON public.group_members FOR UPDATE USING (true);

-- Group milestones policies
CREATE POLICY "select_group_milestones" ON public.group_milestones FOR SELECT USING (
  group_id IN (SELECT id FROM groups WHERE user_id = auth.uid()) OR
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "insert_milestones" ON public.group_milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "update_milestones" ON public.group_milestones FOR UPDATE USING (true);

-- Referral validations policies
CREATE POLICY "select_own_referrals" ON public.referral_validations FOR SELECT USING (
  referrer_id = auth.uid() OR referred_id = auth.uid()
);
CREATE POLICY "insert_referrals" ON public.referral_validations FOR INSERT WITH CHECK (true);
CREATE POLICY "update_referrals" ON public.referral_validations FOR UPDATE USING (true);

-- Functions

-- Create digital wallet for new user
CREATE OR REPLACE FUNCTION create_digital_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.digital_wallet (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_wallet
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_digital_wallet();

-- Add member to group and validate referral chain
CREATE OR REPLACE FUNCTION add_group_member(
  p_group_id UUID,
  p_user_id UUID,
  p_referrer_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  member_count INTEGER;
  new_position INTEGER;
  milestone_reward DECIMAL(10,2);
  result JSON;
BEGIN
  -- Get current member count
  SELECT COUNT(*) INTO member_count
  FROM group_members
  WHERE group_id = p_group_id;
  
  -- Calculate new position
  new_position := member_count + 1;
  
  -- Insert new member
  INSERT INTO group_members (group_id, user_id, referrer_id, position)
  VALUES (p_group_id, p_user_id, p_referrer_id, new_position);
  
  -- Check for milestones and apply rewards
  IF new_position = 3 THEN
    milestone_reward := 50.00;
    INSERT INTO group_milestones (group_id, milestone_type, reward_amount)
    VALUES (p_group_id, '3_members', milestone_reward);
  ELSIF new_position = 6 THEN
    milestone_reward := 100.00;
    INSERT INTO group_milestones (group_id, milestone_type, reward_amount)
    VALUES (p_group_id, '6_members', milestone_reward);
  ELSIF new_position = 9 THEN
    milestone_reward := 200.00;
    INSERT INTO group_milestones (group_id, milestone_type, reward_amount)
    VALUES (p_group_id, '9_members', milestone_reward);
    
    -- Mark group as completed
    UPDATE groups SET status = 'completed', completed_at = NOW()
    WHERE id = p_group_id;
  END IF;
  
  -- Create referral validation if there's a referrer
  IF p_referrer_id IS NOT NULL THEN
    INSERT INTO referral_validations (
      referrer_id, referred_id, group_id, validation_step, reward_amount
    )
    VALUES (p_referrer_id, p_user_id, p_group_id, new_position, 25.00);
  END IF;
  
  result := json_build_object(
    'success', true,
    'position', new_position,
    'milestone_reached', CASE WHEN new_position IN (3,6,9) THEN true ELSE false END,
    'milestone_reward', COALESCE(milestone_reward, 0),
    'group_completed', CASE WHEN new_position = 9 THEN true ELSE false END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Credit wallet function
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'credit'
)
RETURNS BOOLEAN AS $$
DECLARE
  wallet_id UUID;
BEGIN
  -- Get or create wallet
  SELECT id INTO wallet_id
  FROM digital_wallet
  WHERE user_id = p_user_id;
  
  IF wallet_id IS NULL THEN
    INSERT INTO digital_wallet (user_id)
    VALUES (p_user_id)
    RETURNING id INTO wallet_id;
  END IF;
  
  -- Update wallet balance
  UPDATE digital_wallet
  SET 
    available_balance = available_balance + p_amount,
    total_earned = total_earned + p_amount,
    updated_at = NOW()
  WHERE id = wallet_id;
  
  -- Record transaction
  INSERT INTO wallet_transactions (
    wallet_id, user_id, type, amount, description, reference_id
  )
  VALUES (wallet_id, p_user_id, p_type, p_amount, p_description, p_reference_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Debit wallet function
CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'debit'
)
RETURNS BOOLEAN AS $$
DECLARE
  wallet_id UUID;
  current_balance DECIMAL(10,2);
BEGIN
  -- Get wallet and check balance
  SELECT id, available_balance INTO wallet_id, current_balance
  FROM digital_wallet
  WHERE user_id = p_user_id;
  
  IF wallet_id IS NULL OR current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Update wallet balance
  UPDATE digital_wallet
  SET 
    available_balance = available_balance - p_amount,
    updated_at = NOW()
  WHERE id = wallet_id;
  
  -- Record transaction
  INSERT INTO wallet_transactions (
    wallet_id, user_id, type, amount, description, reference_id
  )
  VALUES (wallet_id, p_user_id, p_type, p_amount, p_description, p_reference_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Process group completion rewards
CREATE OR REPLACE FUNCTION process_group_completion_rewards(p_group_id UUID)
RETURNS VOID AS $$
DECLARE
  group_owner_id UUID;
  member_record RECORD;
BEGIN
  -- Get group owner
  SELECT user_id INTO group_owner_id
  FROM groups
  WHERE id = p_group_id;
  
  -- Credit main completion reward to group owner
  PERFORM credit_wallet(
    group_owner_id,
    500.00,
    'Recompensa por completar grupo de 9 membros',
    p_group_id::TEXT,
    'completion_reward'
  );
  
  -- Credit referral rewards
  FOR member_record IN 
    SELECT referrer_id, COUNT(*) as referral_count
    FROM group_members 
    WHERE group_id = p_group_id AND referrer_id IS NOT NULL
    GROUP BY referrer_id
  LOOP
    PERFORM credit_wallet(
      member_record.referrer_id,
      (member_record.referral_count * 25.00),
      FORMAT('Recompensa por %s indicações no grupo', member_record.referral_count),
      p_group_id::TEXT,
      'referral_reward'
    );
  END LOOP;
  
  -- Mark all referral validations as credited
  UPDATE referral_validations
  SET reward_status = 'credited'
  WHERE group_id = p_group_id AND reward_status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Views for easier data access

-- User wallet summary
CREATE VIEW user_wallet_summary AS
SELECT 
  u.id as user_id,
  u.email,
  COALESCE(dw.available_balance, 0) as available_balance,
  COALESCE(dw.pending_balance, 0) as pending_balance,
  COALESCE(dw.total_earned, 0) as total_earned,
  COALESCE(dw.total_withdrawn, 0) as total_withdrawn,
  dw.pix_key,
  dw.pix_key_type,
  COUNT(DISTINCT g.id) as total_groups,
  COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as completed_groups,
  COUNT(DISTINCT gm.id) as total_referrals
FROM auth.users u
LEFT JOIN digital_wallet dw ON dw.user_id = u.id
LEFT JOIN groups g ON g.user_id = u.id
LEFT JOIN group_members gm ON gm.referrer_id = u.id
GROUP BY u.id, u.email, dw.available_balance, dw.pending_balance, 
         dw.total_earned, dw.total_withdrawn, dw.pix_key, dw.pix_key_type;

-- Group progress view
CREATE VIEW group_progress AS
SELECT 
  g.id as group_id,
  g.user_id as owner_id,
  g.status,
  g.created_at,
  g.completed_at,
  COUNT(gm.id) as current_members,
  ARRAY_AGG(
    json_build_object(
      'user_id', gm.user_id,
      'position', gm.position,
      'referrer_id', gm.referrer_id,
      'joined_at', gm.joined_at,
      'is_validated', gm.is_validated
    ) ORDER BY gm.position
  ) as members,
  CASE 
    WHEN COUNT(gm.id) >= 9 THEN 'Completo'
    WHEN COUNT(gm.id) >= 6 THEN 'Quase lá! Faltam ' || (9 - COUNT(gm.id)) || ' membros'
    WHEN COUNT(gm.id) >= 3 THEN 'No meio do caminho! Faltam ' || (9 - COUNT(gm.id)) || ' membros'
    ELSE 'Começando! Faltam ' || (9 - COUNT(gm.id)) || ' membros'
  END as progress_message
FROM groups g
LEFT JOIN group_members gm ON gm.group_id = g.id
GROUP BY g.id, g.user_id, g.status, g.created_at, g.completed_at;