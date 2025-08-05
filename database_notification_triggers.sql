-- Create notification_triggers table to manage automated triggers
CREATE TABLE public.notification_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('15_days', '30_days', '60_days', '90_days', '180_days')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed BOOLEAN NOT NULL DEFAULT false,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_activity_log table to track user engagement
CREATE TABLE public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'login', 'group_creation', 'referral_shared', 'marketplace_purchase', etc.
  activity_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_notification_triggers_user_id ON public.notification_triggers(user_id);
CREATE INDEX idx_notification_triggers_scheduled ON public.notification_triggers(scheduled_for);
CREATE INDEX idx_notification_triggers_executed ON public.notification_triggers(executed);
CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at);

-- Enable Row Level Security
ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_triggers
CREATE POLICY "Users can view their own triggers" ON public.notification_triggers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all triggers" ON public.notification_triggers
  FOR ALL USING (true);

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view their own activity" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all activity" ON public.user_activity_log
  FOR ALL USING (true);

-- Function to automatically create triggers when a group is created
CREATE OR REPLACE FUNCTION public.create_notification_triggers()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification triggers for the new group
  INSERT INTO public.notification_triggers (user_id, group_id, trigger_type, scheduled_for)
  VALUES 
    (NEW.user_id, NEW.id, '15_days', NEW.created_at + INTERVAL '15 days'),
    (NEW.user_id, NEW.id, '30_days', NEW.created_at + INTERVAL '30 days'),
    (NEW.user_id, NEW.id, '60_days', NEW.created_at + INTERVAL '60 days'),
    (NEW.user_id, NEW.id, '90_days', NEW.created_at + INTERVAL '90 days'),
    (NEW.user_id, NEW.id, '180_days', NEW.created_at + INTERVAL '180 days');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create notification triggers
CREATE TRIGGER trigger_create_notification_triggers
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notification_triggers();

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, activity_type, activity_data)
  VALUES (p_user_id, p_activity_type, p_activity_data);
END;
$$ LANGUAGE plpgsql;

-- Function to get inactive users for triggers
CREATE OR REPLACE FUNCTION public.get_users_for_triggers()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  group_id UUID,
  days_since_creation INTEGER,
  referral_count INTEGER,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    g.user_id,
    u.email,
    u.full_name,
    g.id as group_id,
    EXTRACT(DAY FROM NOW() - g.created_at)::INTEGER as days_since_creation,
    COALESCE(
      (SELECT COUNT(*) FROM group_members gm WHERE gm.referred_by = g.user_id),
      0
    )::INTEGER as referral_count,
    COALESCE(
      (SELECT MAX(created_at) FROM user_activity_log ual WHERE ual.user_id = g.user_id),
      g.created_at
    ) as last_activity
  FROM groups g
  JOIN users u ON u.id = g.user_id
  WHERE g.status = 'forming'
  AND g.created_at < NOW() - INTERVAL '15 days'
  ORDER BY days_since_creation DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark trigger as executed
CREATE OR REPLACE FUNCTION public.mark_trigger_executed(
  p_user_id UUID,
  p_group_id UUID,
  p_trigger_type TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE public.notification_triggers
  SET 
    executed = true,
    executed_at = NOW()
  WHERE 
    user_id = p_user_id 
    AND group_id = p_group_id 
    AND trigger_type = p_trigger_type
    AND executed = false;
END;
$$ LANGUAGE plpgsql;