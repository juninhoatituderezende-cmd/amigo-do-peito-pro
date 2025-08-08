-- 1. Criar função segura para gerar referral codes
CREATE OR REPLACE FUNCTION public.generate_secure_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    attempt_count := attempt_count + 1;
    
    -- Se exceder tentativas máximas, usar timestamp como fallback
    IF attempt_count > max_attempts THEN
      code := 'MIN' || UPPER(SUBSTRING(MD5(EXTRACT(EPOCH FROM now())::TEXT) FROM 1 FOR 5));
      EXIT;
    END IF;
    
    -- Gerar código de 8 caracteres usando random() com salt temporal
    code := 'MIN' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || EXTRACT(MICROSECONDS FROM now())::TEXT) FROM 1 FOR 5));
    
    -- Verificar se já existe no MLM network
    SELECT EXISTS(SELECT 1 FROM public.mlm_network WHERE referral_code = code) INTO exists_code;
    
    -- Se não existe, usar este código
    IF NOT exists_code THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$function$;

-- 2. Recriar o trigger com a função segura
DROP TRIGGER IF EXISTS trigger_handle_mlm_referral_code ON public.mlm_network;

CREATE OR REPLACE FUNCTION public.handle_mlm_referral_code_secure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_secure_referral_code();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_handle_mlm_referral_code_secure
BEFORE INSERT ON public.mlm_network
FOR EACH ROW
EXECUTE FUNCTION public.handle_mlm_referral_code_secure();

-- 4. Criar tabela security_events
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Política: apenas admins podem ler eventos de segurança
CREATE POLICY "Admins can view all security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (is_admin());

-- Política: apenas service_role pode inserir eventos
CREATE POLICY "Service role can insert security events"
ON public.security_events
FOR INSERT
TO service_role
WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);

-- 5. Criar função para log de eventos de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  event_id UUID;
BEGIN
  -- Validar severity
  IF p_severity NOT IN ('low', 'medium', 'high', 'critical') THEN
    p_severity := 'info';
  END IF;

  -- Inserir evento de segurança
  INSERT INTO public.security_events (
    event_type,
    user_id,
    ip_address,
    user_agent,
    details,
    severity
  ) VALUES (
    p_event_type,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_details,
    p_severity
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$function$;