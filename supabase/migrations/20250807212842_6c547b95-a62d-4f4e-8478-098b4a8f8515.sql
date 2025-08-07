-- Corrigir função clean_old_logs para ser mais segura
CREATE OR REPLACE FUNCTION public.clean_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.error_logs WHERE created_at < now() - interval '90 days';
  DELETE FROM public.activity_logs WHERE created_at < now() - interval '90 days';
  DELETE FROM public.performance_metrics WHERE created_at < now() - interval '90 days';
END;
$$;