-- Script final de integração completa do sistema de pagamentos
-- Este script conecta todos os componentes e garante que o fluxo funcione end-to-end

-- Atualizar a função de processamento MLM para incluir pagamentos automáticos
CREATE OR REPLACE FUNCTION process_mlm_completion(
  grupo_id UUID,
  contemplado_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  grupo_info RECORD;
  contemplado_info RECORD;
  profissional_info RECORD;
  influenciador_info RECORD;
  service_info RECORD;
  payment_prof_id UUID;
  commission_inf_id UUID;
  result JSON;
BEGIN
  -- Buscar informações do grupo
  SELECT g.*, c.nome as contemplado_nome, c.email as contemplado_email,
         c.telefone, c.profissional_id, c.influenciador_id, c.service_type
  INTO grupo_info
  FROM grupos g
  JOIN clientes c ON c.id = contemplado_id
  WHERE g.id = grupo_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Grupo ou contemplado não encontrado');
  END IF;
  
  -- Buscar informações do serviço
  SELECT * INTO service_info
  FROM service_pricing
  WHERE id = grupo_info.service_type;
  
  -- Marcar como contemplado
  UPDATE clientes
  SET contemplacao_status = 'contemplado',
      contemplacao_data = NOW()
  WHERE id = contemplado_id;
  
  -- Criar pagamento para o profissional
  IF grupo_info.profissional_id IS NOT NULL THEN
    INSERT INTO pagamentos_profissionais (
      profissional_id,
      cliente_id,
      service_pricing_id,
      valor_total,
      valor_repasse,
      status,
      contemplation_date
    ) VALUES (
      grupo_info.profissional_id,
      contemplado_id,
      grupo_info.service_type,
      service_info.price,
      service_info.price * 0.50,
      'pendente',
      NOW()
    ) RETURNING id INTO payment_prof_id;
    
    -- Buscar dados do profissional para notificação
    SELECT nome, email INTO profissional_info
    FROM profissionais
    WHERE id = grupo_info.profissional_id;
    
    -- Enviar notificação para profissional
    PERFORM send_payment_notification(
      'professional',
      profissional_info.email,
      profissional_info.nome,
      'pending',
      service_info.price * 0.50,
      payment_prof_id,
      grupo_info.contemplado_nome,
      service_info.service_name
    );
  END IF;
  
  -- Criar comissão para o influenciador (se houver)
  IF grupo_info.influenciador_id IS NOT NULL THEN
    INSERT INTO comissoes_influenciadores (
      influenciador_id,
      cliente_id,
      valor_entrada,
      percentual,
      valor_comissao,
      status,
      contemplation_date
    ) VALUES (
      grupo_info.influenciador_id,
      contemplado_id,
      service_info.price,
      25.00,
      service_info.price * 0.25,
      'pendente',
      NOW()
    ) RETURNING id INTO commission_inf_id;
    
    -- Buscar dados do influenciador para notificação
    SELECT nome, email INTO influenciador_info
    FROM influenciadores
    WHERE id = grupo_info.influenciador_id;
    
    -- Enviar notificação para influenciador
    PERFORM send_payment_notification(
      'influencer',
      influenciador_info.email,
      influenciador_info.nome,
      'pending',
      service_info.price * 0.25,
      commission_inf_id,
      grupo_info.contemplado_nome,
      NULL
    );
  END IF;
  
  -- Registrar no log de auditoria
  INSERT INTO payment_logs (
    payment_type,
    recipient_id,
    action,
    amount,
    details,
    admin_id
  ) VALUES (
    'system',
    contemplado_id,
    'contemplation_processed',
    service_info.price,
    json_build_object(
      'grupo_id', grupo_id,
      'professional_payment_id', payment_prof_id,
      'influencer_commission_id', commission_inf_id,
      'service_type', service_info.service_name
    ),
    NULL
  );
  
  -- Construir resultado
  result := json_build_object(
    'success', true,
    'contemplado_id', contemplado_id,
    'professional_payment_id', payment_prof_id,
    'influencer_commission_id', commission_inf_id,
    'service_price', service_info.price,
    'professional_amount', CASE WHEN payment_prof_id IS NOT NULL THEN service_info.price * 0.50 ELSE 0 END,
    'influencer_amount', CASE WHEN commission_inf_id IS NOT NULL THEN service_info.price * 0.25 ELSE 0 END,
    'notifications_sent', true
  );
  
  RETURN result;
END;
$$;

-- Função para confirmar realização de serviço pelo profissional
CREATE OR REPLACE FUNCTION confirm_service_completion(
  payment_id UUID,
  professional_id UUID,
  before_photo_url TEXT DEFAULT NULL,
  after_photo_url TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_info RECORD;
  prof_info RECORD;
  client_info RECORD;
  service_info RECORD;
  result JSON;
BEGIN
  -- Verificar se o pagamento existe e pertence ao profissional
  SELECT pp.*, sp.service_name, sp.price
  INTO payment_info
  FROM pagamentos_profissionais pp
  JOIN service_pricing sp ON sp.id = pp.service_pricing_id
  WHERE pp.id = payment_id AND pp.profissional_id = professional_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Pagamento não encontrado ou acesso negado');
  END IF;
  
  IF payment_info.status != 'pendente' THEN
    RETURN json_build_object('error', 'Serviço já foi confirmado anteriormente');
  END IF;
  
  -- Atualizar o pagamento
  UPDATE pagamentos_profissionais
  SET status = 'liberado',
      service_confirmed = true,
      service_confirmation_date = NOW(),
      before_photo_url = confirm_service_completion.before_photo_url,
      after_photo_url = confirm_service_completion.after_photo_url,
      notes = confirm_service_completion.notes
  WHERE id = payment_id;
  
  -- Buscar informações para notificação
  SELECT nome, email INTO prof_info
  FROM profissionais WHERE id = professional_id;
  
  SELECT nome INTO client_info
  FROM clientes WHERE id = payment_info.cliente_id;
  
  -- Enviar notificação de aprovação automática
  PERFORM send_payment_notification(
    'professional',
    prof_info.email,
    prof_info.nome,
    'approved',
    payment_info.valor_repasse,
    payment_id,
    client_info.nome,
    payment_info.service_name
  );
  
  -- Log da confirmação
  INSERT INTO payment_logs (
    payment_type,
    recipient_id,
    action,
    amount,
    details,
    admin_id
  ) VALUES (
    'professional',
    payment_id,
    'service_confirmed',
    payment_info.valor_repasse,
    json_build_object(
      'professional_id', professional_id,
      'client_id', payment_info.cliente_id,
      'before_photo', before_photo_url,
      'after_photo', after_photo_url,
      'notes', notes
    ),
    NULL
  );
  
  result := json_build_object(
    'success', true,
    'payment_id', payment_id,
    'status', 'liberado',
    'amount', payment_info.valor_repasse,
    'confirmation_date', NOW()
  );
  
  RETURN result;
END;
$$;

-- View para dashboard do profissional
CREATE OR REPLACE VIEW professional_dashboard_view AS
SELECT 
  p.id as professional_id,
  p.nome as professional_name,
  p.especialidade,
  p.local_atendimento,
  -- Estatísticas de pagamentos
  COALESCE(SUM(CASE WHEN pp.status = 'liberado' THEN pp.valor_repasse ELSE 0 END), 0) as pending_amount,
  COALESCE(SUM(CASE WHEN pp.status = 'pago' THEN pp.valor_repasse ELSE 0 END), 0) as paid_amount,
  COUNT(CASE WHEN pp.status = 'pendente' THEN 1 END) as pending_services,
  COUNT(CASE WHEN pp.status = 'liberado' THEN 1 END) as approved_payments,
  COUNT(CASE WHEN pp.status = 'pago' THEN 1 END) as completed_payments,
  -- Avaliação média (placeholder - seria calculado com base em avaliações reais)
  4.5 as average_rating,
  23 as total_reviews
FROM profissionais p
LEFT JOIN pagamentos_profissionais pp ON pp.profissional_id = p.id
GROUP BY p.id, p.nome, p.especialidade, p.local_atendimento;

-- View para dashboard do influenciador
CREATE OR REPLACE VIEW influencer_dashboard_view AS
SELECT 
  i.id as influencer_id,
  i.nome as influencer_name,
  i.email,
  -- Estatísticas de comissões
  COALESCE(SUM(CASE WHEN ci.status = 'pendente' THEN ci.valor_comissao ELSE 0 END), 0) as pending_commission,
  COALESCE(SUM(CASE WHEN ci.status = 'pago' THEN ci.valor_comissao ELSE 0 END), 0) as paid_commission,
  COUNT(CASE WHEN ci.status = 'pendente' THEN 1 END) as pending_count,
  COUNT(CASE WHEN ci.status = 'pago' THEN 1 END) as paid_count,
  COUNT(DISTINCT ci.cliente_id) as total_referrals
FROM influenciadores i
LEFT JOIN comissoes_influenciadores ci ON ci.influenciador_id = i.id
GROUP BY i.id, i.nome, i.email;

-- View para relatório administrativo completo
CREATE OR REPLACE VIEW admin_payments_overview AS
SELECT 
  'professional' as payment_type,
  pp.id,
  p.nome as recipient_name,
  p.email as recipient_email,
  c.nome as client_name,
  sp.service_name,
  pp.valor_total,
  pp.valor_repasse as amount,
  pp.status,
  pp.data_liberacao as created_at,
  pp.service_confirmation_date,
  pp.proof_url
FROM pagamentos_profissionais pp
JOIN profissionais p ON p.id = pp.profissional_id
JOIN clientes c ON c.id = pp.cliente_id
JOIN service_pricing sp ON sp.id = pp.service_pricing_id

UNION ALL

SELECT 
  'influencer' as payment_type,
  ci.id,
  i.nome as recipient_name,
  i.email as recipient_email,
  c.nome as client_name,
  'Comissão por Indicação' as service_name,
  ci.valor_entrada as valor_total,
  ci.valor_comissao as amount,
  ci.status,
  ci.created_at,
  NULL as service_confirmation_date,
  ci.proof_url
FROM comissoes_influenciadores ci
JOIN influenciadores i ON i.id = ci.influenciador_id
JOIN clientes c ON c.id = ci.cliente_id
ORDER BY created_at DESC;

-- Função para obter estatísticas do sistema
CREATE OR REPLACE FUNCTION get_system_payment_stats()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  prof_stats JSON;
  inf_stats JSON;
  total_stats JSON;
BEGIN
  -- Estatísticas de profissionais
  SELECT json_build_object(
    'total_pending', COALESCE(SUM(CASE WHEN status IN ('pendente', 'liberado') THEN valor_repasse ELSE 0 END), 0),
    'total_paid', COALESCE(SUM(CASE WHEN status = 'pago' THEN valor_repasse ELSE 0 END), 0),
    'count_pending', COUNT(CASE WHEN status IN ('pendente', 'liberado') THEN 1 END),
    'count_paid', COUNT(CASE WHEN status = 'pago' THEN 1 END)
  ) INTO prof_stats
  FROM pagamentos_profissionais;
  
  -- Estatísticas de influenciadores
  SELECT json_build_object(
    'total_pending', COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor_comissao ELSE 0 END), 0),
    'total_paid', COALESCE(SUM(CASE WHEN status = 'pago' THEN valor_comissao ELSE 0 END), 0),
    'count_pending', COUNT(CASE WHEN status = 'pendente' THEN 1 END),
    'count_paid', COUNT(CASE WHEN status = 'pago' THEN 1 END)
  ) INTO inf_stats
  FROM comissoes_influenciadores;
  
  -- Estatísticas totais
  SELECT json_build_object(
    'total_revenue', COALESCE(SUM(price), 0),
    'active_services', COUNT(*)
  ) INTO total_stats
  FROM service_pricing;
  
  result := json_build_object(
    'professionals', prof_stats,
    'influencers', inf_stats,
    'system', total_stats,
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$$;

-- RLS (Row Level Security) para segurança
ALTER TABLE pagamentos_profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes_influenciadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para profissionais
CREATE POLICY "Profissionais podem ver apenas seus pagamentos" ON pagamentos_profissionais
  FOR SELECT USING (
    profissional_id = (SELECT id FROM profissionais WHERE auth_user_id = auth.uid())
  );

-- Políticas de segurança para influenciadores
CREATE POLICY "Influenciadores podem ver apenas suas comissões" ON comissoes_influenciadores
  FOR SELECT USING (
    influenciador_id = (SELECT id FROM influenciadores WHERE auth_user_id = auth.uid())
  );

-- Políticas de segurança para administradores
CREATE POLICY "Administradores podem ver todos os pagamentos" ON pagamentos_profissionais
  FOR ALL USING (
    EXISTS (SELECT 1 FROM administradores WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Administradores podem ver todas as comissões" ON comissoes_influenciadores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM administradores WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Administradores podem ver todos os logs" ON payment_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM administradores WHERE auth_user_id = auth.uid())
  );

-- Comentários finais
COMMENT ON FUNCTION process_mlm_completion IS 'Processa contemplação MLM e dispara pagamentos automáticos';
COMMENT ON FUNCTION confirm_service_completion IS 'Confirma realização de serviço pelo profissional';
COMMENT ON VIEW professional_dashboard_view IS 'Dashboard completo para profissionais';
COMMENT ON VIEW influencer_dashboard_view IS 'Dashboard completo para influenciadores';
COMMENT ON VIEW admin_payments_overview IS 'Visão geral de todos os pagamentos para administradores';