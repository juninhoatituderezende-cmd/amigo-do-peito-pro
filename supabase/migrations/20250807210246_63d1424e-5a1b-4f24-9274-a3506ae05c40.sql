-- Criar tabelas de diagnóstico e logs
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  component VARCHAR(255),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  url VARCHAR(500),
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  severity VARCHAR(20) DEFAULT 'error',
  additional_data JSONB
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action VARCHAR(255) NOT NULL,
  component VARCHAR(255),
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_ms INTEGER
);

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  page_route VARCHAR(255),
  load_time_ms INTEGER,
  component_render_time_ms INTEGER,
  database_query_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  additional_metrics JSONB
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON public.error_logs(component);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp DESC);

-- Ativar RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policies para error_logs
CREATE POLICY "Users can insert error logs" ON public.error_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own error logs" ON public.error_logs
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Policies para activity_logs  
CREATE POLICY "Users can insert activity logs" ON public.activity_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Policies para performance_metrics
CREATE POLICY "Users can insert performance metrics" ON public.performance_metrics
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own performance metrics" ON public.performance_metrics
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Função para limpar logs antigos (manter apenas últimos 30 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.error_logs WHERE timestamp < now() - INTERVAL '30 days';
  DELETE FROM public.activity_logs WHERE timestamp < now() - INTERVAL '30 days';
  DELETE FROM public.performance_metrics WHERE timestamp < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;