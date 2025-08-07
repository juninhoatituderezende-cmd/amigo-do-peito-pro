-- Create comprehensive logging tables for diagnostics
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_id TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  component_stack TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  url TEXT,
  client_ip TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on logging tables
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for error_logs
CREATE POLICY "Service role can manage error logs" 
ON public.error_logs 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view error logs" 
ON public.error_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = auth.uid() 
  AND auth.users.email LIKE '%admin%'
));

-- Policies for activity_logs
CREATE POLICY "Service role can manage activity logs" 
ON public.activity_logs 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own activity" 
ON public.activity_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = auth.uid() 
  AND auth.users.email LIKE '%admin%'
));

-- Policies for performance_metrics
CREATE POLICY "Service role can manage performance metrics" 
ON public.performance_metrics 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = auth.uid() 
  AND auth.users.email LIKE '%admin%'
));

-- Create indexes for better performance
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX idx_error_logs_error_id ON public.error_logs(error_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics(created_at);

-- Function to clean old logs (keep only 90 days)
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.error_logs WHERE created_at < now() - interval '90 days';
  DELETE FROM public.activity_logs WHERE created_at < now() - interval '90 days';
  DELETE FROM public.performance_metrics WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;