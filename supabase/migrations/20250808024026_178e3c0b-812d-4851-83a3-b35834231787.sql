-- FASE 1: CORREÇÃO CRÍTICA DE SEGURANÇA - FUNÇÕES E VIEWS

-- 1. Corrigir search_path em todas as funções de segurança
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Corrigir função de log de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text, 
  user_id uuid DEFAULT NULL::uuid, 
  ip_address inet DEFAULT NULL::inet, 
  user_agent text DEFAULT NULL::text, 
  details jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    ip_address,
    user_agent,
    details
  ) VALUES (
    event_type,
    COALESCE(user_id, auth.uid()),
    ip_address,
    user_agent,
    details
  );
END;
$$;

-- 3. Corrigir função de rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  identifier text, 
  action_type text, 
  max_requests integer DEFAULT 10, 
  window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Verificar se o usuário está autenticado para operações sensíveis
  IF auth.uid() IS NULL AND action_type IN ('payment', 'withdrawal', 'admin_action') THEN
    RETURN false;
  END IF;
  
  -- Count requests in the time window
  SELECT COUNT(*) INTO request_count
  FROM public.security_events
  WHERE event_type = action_type 
    AND details->>'identifier' = identifier
    AND created_at > now() - (window_minutes || ' minutes')::interval;
  
  -- Log this security check with additional context
  INSERT INTO public.security_events (event_type, user_id, details)
  VALUES ('rate_limit_check', auth.uid(), jsonb_build_object(
    'identifier', identifier,
    'action_type', action_type,
    'request_count', request_count,
    'max_requests', max_requests,
    'user_authenticated', auth.uid() IS NOT NULL
  ));
  
  RETURN request_count < max_requests;
END;
$$;