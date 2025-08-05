-- Sistema de logs de email e vouchers digitais
-- Este script adiciona funcionalidades de logging e controle de vouchers

-- Tabela para logs de emails enviados
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'voucher_delivery', 'payment_notification', etc.
    
    -- Dados específicos do voucher (quando aplicável)
    voucher_code VARCHAR(50),
    voucher_id UUID,
    
    -- Status e controle
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, bounced
    attempts INTEGER DEFAULT 1,
    sent_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Metadados adicionais
    metadata JSONB, -- Dados extras flexíveis
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para controle de vouchers digitais
CREATE TABLE IF NOT EXISTS digital_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Dados do beneficiário
    user_id UUID NOT NULL, -- Referência ao cliente
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    
    -- Dados do serviço
    service_type VARCHAR(100) NOT NULL,
    service_price DECIMAL(10,2) NOT NULL,
    
    -- Profissional atribuído (se houver)
    professional_id UUID REFERENCES profissionais(id),
    professional_name VARCHAR(255),
    professional_location VARCHAR(255),
    
    -- Controle de validade
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status do voucher
    status VARCHAR(20) DEFAULT 'active', -- active, used, expired, cancelled
    used_at TIMESTAMP WITH TIME ZONE,
    used_by VARCHAR(255), -- Quem validou o uso
    
    -- Verificação
    verification_url TEXT,
    qr_code_data TEXT,
    
    -- Email
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Auditoria
    created_by UUID, -- Admin que gerou
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para gerar voucher digital
CREATE OR REPLACE FUNCTION generate_digital_voucher(
    p_user_id UUID,
    p_user_name VARCHAR(255),
    p_user_email VARCHAR(255),
    p_service_type VARCHAR(100),
    p_service_price DECIMAL(10,2),
    p_professional_id UUID DEFAULT NULL,
    p_validity_months INTEGER DEFAULT 6,
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    voucher_code VARCHAR(50);
    voucher_id UUID;
    expiry_date TIMESTAMP WITH TIME ZONE;
    professional_data RECORD;
    verification_url TEXT;
    result JSON;
BEGIN
    -- Gerar código único do voucher
    voucher_code := 'VCH' || UPPER(substr(md5(random()::text || p_user_id::text), 1, 8));
    
    -- Verificar se o código já existe (muito improvável)
    WHILE EXISTS (SELECT 1 FROM digital_vouchers WHERE voucher_code = voucher_code) LOOP
        voucher_code := 'VCH' || UPPER(substr(md5(random()::text || p_user_id::text), 1, 8));
    END LOOP;
    
    -- Calcular data de expiração
    expiry_date := NOW() + (p_validity_months || ' months')::INTERVAL;
    
    -- Buscar dados do profissional se fornecido
    IF p_professional_id IS NOT NULL THEN
        SELECT nome, local_atendimento
        INTO professional_data
        FROM profissionais
        WHERE id = p_professional_id;
    END IF;
    
    -- Gerar URL de verificação
    verification_url := current_setting('app.base_url', true) || '/verificar-voucher/' || voucher_code;
    
    -- Inserir voucher
    INSERT INTO digital_vouchers (
        voucher_code,
        user_id,
        user_name,
        user_email,
        service_type,
        service_price,
        professional_id,
        professional_name,
        professional_location,
        expires_at,
        verification_url,
        qr_code_data,
        created_by
    ) VALUES (
        voucher_code,
        p_user_id,
        p_user_name,
        p_user_email,
        p_service_type,
        p_service_price,
        p_professional_id,
        professional_data.nome,
        professional_data.local_atendimento,
        expiry_date,
        verification_url,
        verification_url, -- QR code contém a URL de verificação
        p_admin_id
    ) RETURNING id INTO voucher_id;
    
    -- Registrar evento no log
    INSERT INTO email_logs (
        recipient_email,
        subject,
        template_type,
        voucher_code,
        voucher_id,
        status,
        metadata
    ) VALUES (
        p_user_email,
        'Voucher Digital Gerado',
        'voucher_generation',
        voucher_code,
        voucher_id,
        'pending',
        json_build_object(
            'service_type', p_service_type,
            'service_price', p_service_price,
            'professional_name', professional_data.nome
        )
    );
    
    result := json_build_object(
        'success', true,
        'voucher_id', voucher_id,
        'voucher_code', voucher_code,
        'verification_url', verification_url,
        'expires_at', expiry_date,
        'professional_name', professional_data.nome
    );
    
    RETURN result;
END;
$$;

-- Função para verificar voucher
CREATE OR REPLACE FUNCTION verify_voucher(
    p_voucher_code VARCHAR(50)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    voucher_data RECORD;
    result JSON;
    is_valid BOOLEAN;
    status_message TEXT;
BEGIN
    -- Buscar voucher
    SELECT * INTO voucher_data
    FROM digital_vouchers
    WHERE voucher_code = p_voucher_code;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'valid', false,
            'message', 'Voucher não encontrado',
            'error_code', 'NOT_FOUND'
        );
        RETURN result;
    END IF;
    
    -- Verificar validade
    is_valid := true;
    status_message := 'Voucher válido';
    
    IF voucher_data.status = 'used' THEN
        is_valid := false;
        status_message := 'Voucher já foi utilizado em ' || voucher_data.used_at::DATE;
    ELSIF voucher_data.status = 'expired' OR voucher_data.expires_at < NOW() THEN
        is_valid := false;
        status_message := 'Voucher expirado';
    ELSIF voucher_data.status = 'cancelled' THEN
        is_valid := false;
        status_message := 'Voucher cancelado';
    END IF;
    
    result := json_build_object(
        'valid', is_valid,
        'message', status_message,
        'voucher_data', json_build_object(
            'code', voucher_data.voucher_code,
            'user_name', voucher_data.user_name,
            'service_type', voucher_data.service_type,
            'service_price', voucher_data.service_price,
            'professional_name', voucher_data.professional_name,
            'issued_at', voucher_data.issued_at,
            'expires_at', voucher_data.expires_at,
            'status', voucher_data.status
        )
    );
    
    RETURN result;
END;
$$;

-- Função para marcar voucher como usado
CREATE OR REPLACE FUNCTION use_voucher(
    p_voucher_code VARCHAR(50),
    p_used_by VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    voucher_id UUID;
    current_status VARCHAR(20);
    result JSON;
BEGIN
    -- Verificar se voucher existe e está válido
    SELECT id, status INTO voucher_id, current_status
    FROM digital_vouchers
    WHERE voucher_code = p_voucher_code
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'message', 'Voucher não encontrado ou expirado'
        );
        RETURN result;
    END IF;
    
    IF current_status != 'active' THEN
        result := json_build_object(
            'success', false,
            'message', 'Voucher não está ativo (status: ' || current_status || ')'
        );
        RETURN result;
    END IF;
    
    -- Marcar como usado
    UPDATE digital_vouchers
    SET status = 'used',
        used_at = NOW(),
        used_by = p_used_by,
        updated_at = NOW()
    WHERE id = voucher_id;
    
    -- Registrar uso no log
    INSERT INTO email_logs (
        recipient_email,
        subject,
        template_type,
        voucher_code,
        voucher_id,
        status,
        metadata
    ) VALUES (
        (SELECT user_email FROM digital_vouchers WHERE id = voucher_id),
        'Voucher Utilizado',
        'voucher_usage',
        p_voucher_code,
        voucher_id,
        'sent',
        json_build_object(
            'used_by', p_used_by,
            'used_at', NOW()
        )
    );
    
    result := json_build_object(
        'success', true,
        'message', 'Voucher marcado como usado com sucesso',
        'used_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- View para relatório de vouchers
CREATE OR REPLACE VIEW vouchers_report AS
SELECT 
    dv.id,
    dv.voucher_code,
    dv.user_name,
    dv.user_email,
    dv.service_type,
    dv.service_price,
    dv.professional_name,
    dv.status,
    dv.issued_at,
    dv.expires_at,
    dv.used_at,
    dv.used_by,
    dv.email_sent,
    dv.email_sent_at,
    
    -- Calcular dias para expiração
    CASE 
        WHEN dv.expires_at < NOW() THEN 'Expirado'
        WHEN dv.status = 'used' THEN 'Usado'
        WHEN dv.expires_at - NOW() <= INTERVAL '30 days' THEN 'Expira em breve'
        ELSE 'Ativo'
    END as validity_status,
    
    -- Dados do email
    el.sent_at as last_email_sent,
    el.status as email_status
    
FROM digital_vouchers dv
LEFT JOIN email_logs el ON el.voucher_id = dv.id AND el.template_type = 'voucher_delivery'
ORDER BY dv.created_at DESC;

-- View para dashboard de emails
CREATE OR REPLACE VIEW email_dashboard AS
SELECT 
    template_type,
    status,
    COUNT(*) as total_emails,
    COUNT(CASE WHEN sent_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
    COUNT(CASE WHEN sent_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_week,
    AVG(CASE WHEN status = 'sent' THEN 1.0 ELSE 0.0 END) * 100 as success_rate
FROM email_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY template_type, status
ORDER BY template_type, status;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_digital_vouchers_code ON digital_vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_digital_vouchers_user ON digital_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_vouchers_status ON digital_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_digital_vouchers_expires ON digital_vouchers(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_voucher ON email_logs(voucher_id);

-- Trigger para auto-expirar vouchers
CREATE OR REPLACE FUNCTION auto_expire_vouchers()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE digital_vouchers
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
    AND expires_at < NOW();
END;
$$;

-- Função para estatísticas de vouchers
CREATE OR REPLACE FUNCTION get_voucher_stats()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
    total_vouchers INTEGER;
    active_vouchers INTEGER;
    used_vouchers INTEGER;
    expired_vouchers INTEGER;
    emails_sent INTEGER;
    total_value DECIMAL(10,2);
BEGIN
    -- Contar vouchers por status
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'active' AND expires_at > NOW() THEN 1 END),
        COUNT(CASE WHEN status = 'used' THEN 1 END),
        COUNT(CASE WHEN status = 'expired' OR expires_at <= NOW() THEN 1 END),
        COUNT(CASE WHEN email_sent = true THEN 1 END),
        COALESCE(SUM(service_price), 0)
    INTO total_vouchers, active_vouchers, used_vouchers, expired_vouchers, emails_sent, total_value
    FROM digital_vouchers;
    
    result := json_build_object(
        'total_vouchers', total_vouchers,
        'active_vouchers', active_vouchers,
        'used_vouchers', used_vouchers,
        'expired_vouchers', expired_vouchers,
        'emails_sent', emails_sent,
        'total_value', total_value,
        'usage_rate', CASE WHEN total_vouchers > 0 THEN (used_vouchers::DECIMAL / total_vouchers) * 100 ELSE 0 END
    );
    
    RETURN result;
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE email_logs IS 'Log de todos os emails enviados pelo sistema';
COMMENT ON TABLE digital_vouchers IS 'Controle de vouchers digitais emitidos';
COMMENT ON FUNCTION generate_digital_voucher IS 'Gera um novo voucher digital';
COMMENT ON FUNCTION verify_voucher IS 'Verifica validade de um voucher';
COMMENT ON FUNCTION use_voucher IS 'Marca voucher como utilizado';
COMMENT ON VIEW vouchers_report IS 'Relatório completo de vouchers para administradores';

-- Exemplo de uso:
-- SELECT generate_digital_voucher(
--   'user-uuid'::UUID,
--   'João Silva',
--   'joao@email.com',
--   'Tatuagem Braço Completo',
--   1500.00,
--   'prof-uuid'::UUID,
--   6,
--   'admin-uuid'::UUID
-- );