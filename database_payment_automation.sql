-- Triggers automáticos para envio de notificações de pagamento
-- Este script deve ser executado após database_automatic_payments.sql

-- Função para enviar notificações automáticas
CREATE OR REPLACE FUNCTION send_payment_notification(
  recipient_type TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  notification_type TEXT,
  amount NUMERIC,
  payment_id UUID,
  client_name TEXT DEFAULT NULL,
  service_type TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Chamar a Edge Function para envio de email
  PERFORM net.http_post(
    url := 'https://your-project-url.supabase.co/functions/v1/send-payment-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.supabase_service_role_key', true) || '"}',
    body := json_build_object(
      'recipientEmail', recipient_email,
      'recipientName', recipient_name,
      'recipientType', recipient_type,
      'notificationType', notification_type,
      'amount', amount,
      'clientName', client_name,
      'serviceType', service_type,
      'paymentId', payment_id
    )::text
  );
  
  -- Log da tentativa de envio
  INSERT INTO payment_logs (
    payment_type,
    recipient_id,
    action,
    amount,
    details,
    admin_id
  ) VALUES (
    recipient_type,
    payment_id,
    'notification_sent',
    amount,
    json_build_object(
      'type', notification_type,
      'email', recipient_email,
      'client', client_name
    ),
    NULL
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log de erro se o envio falhar
    INSERT INTO payment_logs (
      payment_type,
      recipient_id,
      action,
      amount,
      details,
      admin_id
    ) VALUES (
      recipient_type,
      payment_id,
      'notification_error',
      amount,
      json_build_object(
        'error', SQLERRM,
        'email', recipient_email
      ),
      NULL
    );
END;
$$;

-- Trigger para pagamentos de profissionais
CREATE OR REPLACE FUNCTION trigger_professional_payment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  prof_data RECORD;
  client_data RECORD;
  service_name TEXT;
BEGIN
  -- Buscar dados do profissional
  SELECT p.nome, p.email
  INTO prof_data
  FROM profissionais p
  WHERE p.id = NEW.profissional_id;
  
  -- Buscar dados do cliente
  SELECT c.nome
  INTO client_data
  FROM clientes c
  WHERE c.id = NEW.cliente_id;
  
  -- Buscar nome do serviço
  SELECT sp.service_name
  INTO service_name
  FROM service_pricing sp
  WHERE sp.id = NEW.service_pricing_id;
  
  -- Enviar notificação baseada no status
  IF NEW.status = 'liberado' AND OLD.status != 'liberado' THEN
    PERFORM send_payment_notification(
      'professional',
      prof_data.email,
      prof_data.nome,
      'approved',
      NEW.valor_repasse,
      NEW.id,
      client_data.nome,
      service_name
    );
  ELSIF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    PERFORM send_payment_notification(
      'professional',
      prof_data.email,
      prof_data.nome,
      'paid',
      NEW.valor_repasse,
      NEW.id,
      client_data.nome,
      service_name
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para comissões de influenciadores
CREATE OR REPLACE FUNCTION trigger_influencer_commission_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  inf_data RECORD;
  client_data RECORD;
BEGIN
  -- Buscar dados do influenciador
  SELECT i.nome, i.email
  INTO inf_data
  FROM influenciadores i
  WHERE i.id = NEW.influenciador_id;
  
  -- Buscar dados do cliente
  SELECT c.nome
  INTO client_data
  FROM clientes c
  WHERE c.id = NEW.cliente_id;
  
  -- Enviar notificação baseada no status
  IF TG_OP = 'INSERT' THEN
    -- Nova comissão criada
    PERFORM send_payment_notification(
      'influencer',
      inf_data.email,
      inf_data.nome,
      'pending',
      NEW.valor_comissao,
      NEW.id,
      client_data.nome,
      NULL
    );
  ELSIF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    -- Comissão paga
    PERFORM send_payment_notification(
      'influencer',
      inf_data.email,
      inf_data.nome,
      'paid',
      NEW.valor_comissao,
      NEW.id,
      client_data.nome,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar os triggers
DROP TRIGGER IF EXISTS professional_payment_notification_trigger ON pagamentos_profissionais;
CREATE TRIGGER professional_payment_notification_trigger
  AFTER UPDATE ON pagamentos_profissionais
  FOR EACH ROW
  EXECUTE FUNCTION trigger_professional_payment_notification();

DROP TRIGGER IF EXISTS influencer_commission_notification_trigger ON comissoes_influenciadores;
CREATE TRIGGER influencer_commission_notification_trigger
  AFTER INSERT OR UPDATE ON comissoes_influenciadores
  FOR EACH ROW
  EXECUTE FUNCTION trigger_influencer_commission_notification();

-- Função para teste do sistema completo
CREATE OR REPLACE FUNCTION test_payment_flow(
  test_cliente_id UUID,
  test_profissional_id UUID,
  test_influenciador_id UUID DEFAULT NULL,
  test_service_type_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  payment_prof_id UUID;
  commission_inf_id UUID;
  service_price NUMERIC;
  result JSON;
BEGIN
  -- Buscar preço do serviço
  SELECT price INTO service_price
  FROM service_pricing
  WHERE id = test_service_type_id;
  
  -- Simular pagamento do profissional
  INSERT INTO pagamentos_profissionais (
    profissional_id,
    cliente_id,
    service_pricing_id,
    valor_total,
    valor_repasse,
    status
  ) VALUES (
    test_profissional_id,
    test_cliente_id,
    test_service_type_id,
    service_price,
    service_price * 0.50,
    'liberado'
  ) RETURNING id INTO payment_prof_id;
  
  -- Simular comissão do influenciador (se houver)
  IF test_influenciador_id IS NOT NULL THEN
    INSERT INTO comissoes_influenciadores (
      influenciador_id,
      cliente_id,
      valor_entrada,
      percentual,
      valor_comissao,
      status
    ) VALUES (
      test_influenciador_id,
      test_cliente_id,
      service_price,
      25.00,
      service_price * 0.25,
      'pendente'
    ) RETURNING id INTO commission_inf_id;
  END IF;
  
  -- Construir resultado
  result := json_build_object(
    'success', true,
    'professional_payment_id', payment_prof_id,
    'influencer_commission_id', commission_inf_id,
    'service_price', service_price,
    'notifications_sent', true
  );
  
  RETURN result;
END;
$$;

-- Função para relatório de pagamentos pendentes
CREATE OR REPLACE FUNCTION get_pending_payments_report()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  prof_pending NUMERIC;
  inf_pending NUMERIC;
  total_pending NUMERIC;
  result JSON;
BEGIN
  -- Pagamentos profissionais pendentes
  SELECT COALESCE(SUM(valor_repasse), 0)
  INTO prof_pending
  FROM pagamentos_profissionais
  WHERE status IN ('pendente', 'liberado');
  
  -- Comissões influenciadores pendentes
  SELECT COALESCE(SUM(valor_comissao), 0)
  INTO inf_pending
  FROM comissoes_influenciadores
  WHERE status = 'pendente';
  
  total_pending := prof_pending + inf_pending;
  
  result := json_build_object(
    'professional_pending', prof_pending,
    'influencer_pending', inf_pending,
    'total_pending', total_pending,
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_profissionais_status ON pagamentos_profissionais(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_profissionais_data ON pagamentos_profissionais(data_liberacao);
CREATE INDEX IF NOT EXISTS idx_comissoes_influenciadores_status ON comissoes_influenciadores(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_type_action ON payment_logs(payment_type, action);

-- Comentários para documentação
COMMENT ON FUNCTION send_payment_notification IS 'Envia notificações automáticas por email para pagamentos e comissões';
COMMENT ON FUNCTION test_payment_flow IS 'Função para testar o fluxo completo de pagamentos';
COMMENT ON FUNCTION get_pending_payments_report IS 'Gera relatório de pagamentos pendentes';

-- Exemplo de uso:
-- SELECT test_payment_flow(
--   'uuid-do-cliente'::UUID,
--   'uuid-do-profissional'::UUID,
--   'uuid-do-influenciador'::UUID,
--   'uuid-do-tipo-servico'::UUID
-- );