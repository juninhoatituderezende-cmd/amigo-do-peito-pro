-- Sistema de Planos Customizados
-- Este sistema permite que administradores criem planos personalizados
-- e usuários se inscrevam através de links públicos com referência

-- Tabela de categorias de serviço
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Para ícones da interface
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de planos customizados
CREATE TABLE IF NOT EXISTS custom_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code VARCHAR(20) UNIQUE NOT NULL, -- Código único para o link
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES service_categories(id),
    
    -- Configurações financeiras
    total_price DECIMAL(10,2) NOT NULL,
    entry_price DECIMAL(10,2) NOT NULL,
    
    -- Configurações do grupo
    max_participants INTEGER NOT NULL DEFAULT 9,
    min_participants INTEGER DEFAULT 1,
    
    -- Profissional
    professional_id UUID REFERENCES profissionais(id), -- Pode ser NULL se escolhido depois
    allow_professional_choice BOOLEAN DEFAULT false,
    
    -- Configurações de ativação
    active BOOLEAN DEFAULT true,
    public_enrollment BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    
    -- Metadados
    created_by UUID REFERENCES administradores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Configurações de imagem/marketing
    image_url TEXT,
    terms_text TEXT,
    benefits TEXT[] -- Array de benefícios em JSON
);

-- Tabela de instâncias de grupos por plano
CREATE TABLE IF NOT EXISTS plan_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_plan_id UUID REFERENCES custom_plans(id) ON DELETE CASCADE,
    group_number INTEGER NOT NULL, -- 1, 2, 3... para o mesmo plano
    
    -- Status do grupo
    status VARCHAR(20) DEFAULT 'forming', -- forming, full, contemplating, completed
    current_participants INTEGER DEFAULT 0,
    contemplated_user_id UUID REFERENCES clientes(id), -- Quem foi contemplado
    contemplation_date TIMESTAMP WITH TIME ZONE,
    
    -- Profissional atribuído (pode ser diferente do plano base)
    assigned_professional_id UUID REFERENCES profissionais(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(custom_plan_id, group_number)
);

-- Tabela de participações nos planos
CREATE TABLE IF NOT EXISTS plan_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_group_id UUID REFERENCES plan_groups(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES clientes(id),
    
    -- Dados da inscrição
    entry_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_id VARCHAR(100), -- ID externo do pagamento
    
    -- Referência (quem indicou)
    referrer_id UUID REFERENCES clientes(id), -- Quem indicou este participante
    referrer_commission DECIMAL(10,2) DEFAULT 0,
    
    -- Posição no grupo
    position_number INTEGER, -- 1 a 9 (ou max_participants)
    
    -- Status
    active BOOLEAN DEFAULT true,
    contemplated BOOLEAN DEFAULT false,
    service_completed BOOLEAN DEFAULT false,
    service_completion_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(plan_group_id, participant_id),
    UNIQUE(plan_group_id, position_number)
);

-- Tabela de links de referência
CREATE TABLE IF NOT EXISTS plan_referral_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_plan_id UUID REFERENCES custom_plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES clientes(id),
    
    -- Link único
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    link_url TEXT NOT NULL,
    
    -- Estatísticas
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- NULL = sem expiração
);

-- Tabela de comissões por indicação nos planos customizados
CREATE TABLE IF NOT EXISTS plan_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_participation_id UUID REFERENCES plan_participations(id),
    referrer_id UUID REFERENCES clientes(id),
    referral_link_id UUID REFERENCES plan_referral_links(id),
    
    -- Valores
    participation_amount DECIMAL(10,2) NOT NULL,
    commission_percentage DECIMAL(5,2) DEFAULT 25.00,
    commission_amount DECIMAL(10,2) NOT NULL,
    
    -- Status do pagamento
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_proof_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Função para criar um novo plano
CREATE OR REPLACE FUNCTION create_custom_plan(
    p_name VARCHAR(200),
    p_description TEXT,
    p_category_id UUID,
    p_total_price DECIMAL(10,2),
    p_entry_price DECIMAL(10,2),
    p_max_participants INTEGER,
    p_professional_id UUID,
    p_allow_professional_choice BOOLEAN,
    p_admin_id UUID,
    p_image_url TEXT DEFAULT NULL,
    p_benefits TEXT[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    plan_id UUID;
    plan_code VARCHAR(20);
    result JSON;
BEGIN
    -- Gerar código único do plano
    plan_code := 'PLN' || UPPER(substr(md5(random()::text), 1, 8));
    
    -- Verificar se o código já existe (muito improvável, mas por segurança)
    WHILE EXISTS (SELECT 1 FROM custom_plans WHERE plan_code = plan_code) LOOP
        plan_code := 'PLN' || UPPER(substr(md5(random()::text), 1, 8));
    END LOOP;
    
    -- Inserir o plano
    INSERT INTO custom_plans (
        plan_code, name, description, category_id,
        total_price, entry_price, max_participants,
        professional_id, allow_professional_choice,
        created_by, image_url, benefits
    ) VALUES (
        plan_code, p_name, p_description, p_category_id,
        p_total_price, p_entry_price, p_max_participants,
        p_professional_id, p_allow_professional_choice,
        p_admin_id, p_image_url, p_benefits
    ) RETURNING id INTO plan_id;
    
    -- Criar o primeiro grupo automaticamente
    INSERT INTO plan_groups (
        custom_plan_id,
        group_number,
        assigned_professional_id
    ) VALUES (
        plan_id,
        1,
        p_professional_id
    );
    
    result := json_build_object(
        'success', true,
        'plan_id', plan_id,
        'plan_code', plan_code,
        'public_url', '/inscrever/' || plan_code
    );
    
    RETURN result;
END;
$$;

-- Função para gerar link de referência
CREATE OR REPLACE FUNCTION generate_referral_link(
    p_plan_id UUID,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    plan_code VARCHAR(20);
    referral_code VARCHAR(50);
    link_url TEXT;
    link_id UUID;
    result JSON;
BEGIN
    -- Buscar código do plano
    SELECT cp.plan_code INTO plan_code
    FROM custom_plans cp
    WHERE cp.id = p_plan_id AND cp.active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Plano não encontrado ou inativo');
    END IF;
    
    -- Verificar se já existe link para este usuário e plano
    SELECT id, referral_code INTO link_id, referral_code
    FROM plan_referral_links
    WHERE custom_plan_id = p_plan_id AND user_id = p_user_id AND active = true;
    
    -- Se não existe, criar novo
    IF NOT FOUND THEN
        referral_code := 'REF' || UPPER(substr(md5(p_user_id::text || p_plan_id::text), 1, 10));
        link_url := '/inscrever/' || plan_code || '?ref=' || referral_code;
        
        INSERT INTO plan_referral_links (
            custom_plan_id,
            user_id,
            referral_code,
            link_url
        ) VALUES (
            p_plan_id,
            p_user_id,
            referral_code,
            link_url
        ) RETURNING id INTO link_id;
    ELSE
        link_url := '/inscrever/' || plan_code || '?ref=' || referral_code;
    END IF;
    
    result := json_build_object(
        'success', true,
        'link_id', link_id,
        'referral_code', referral_code,
        'link_url', link_url,
        'full_url', current_setting('app.base_url', true) || link_url
    );
    
    RETURN result;
END;
$$;

-- Função para processar inscrição em plano
CREATE OR REPLACE FUNCTION process_plan_enrollment(
    p_plan_code VARCHAR(20),
    p_participant_id UUID,
    p_referral_code VARCHAR(50) DEFAULT NULL,
    p_professional_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    plan_data RECORD;
    group_data RECORD;
    referrer_data RECORD;
    position_num INTEGER;
    participation_id UUID;
    commission_id UUID;
    result JSON;
BEGIN
    -- Buscar dados do plano
    SELECT cp.*, sc.name as category_name
    INTO plan_data
    FROM custom_plans cp
    JOIN service_categories sc ON sc.id = cp.category_id
    WHERE cp.plan_code = p_plan_code AND cp.active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Plano não encontrado ou inativo');
    END IF;
    
    -- Verificar se o usuário já está inscrito neste plano
    IF EXISTS (
        SELECT 1 FROM plan_participations pp
        JOIN plan_groups pg ON pg.id = pp.plan_group_id
        WHERE pg.custom_plan_id = plan_data.id
        AND pp.participant_id = p_participant_id
        AND pp.active = true
    ) THEN
        RETURN json_build_object('error', 'Usuário já está inscrito neste plano');
    END IF;
    
    -- Buscar grupo ativo com vagas disponíveis
    SELECT pg.*
    INTO group_data
    FROM plan_groups pg
    WHERE pg.custom_plan_id = plan_data.id
    AND pg.status = 'forming'
    AND pg.current_participants < plan_data.max_participants
    ORDER BY pg.group_number
    LIMIT 1;
    
    -- Se não há grupo disponível, criar novo
    IF NOT FOUND THEN
        INSERT INTO plan_groups (
            custom_plan_id,
            group_number,
            assigned_professional_id
        )
        SELECT 
            plan_data.id,
            COALESCE(MAX(group_number), 0) + 1,
            COALESCE(p_professional_id, plan_data.professional_id)
        FROM plan_groups
        WHERE custom_plan_id = plan_data.id
        RETURNING * INTO group_data;
    END IF;
    
    -- Determinar próxima posição no grupo
    SELECT COALESCE(MAX(position_number), 0) + 1
    INTO position_num
    FROM plan_participations
    WHERE plan_group_id = group_data.id;
    
    -- Processar referência se fornecida
    IF p_referral_code IS NOT NULL THEN
        SELECT prl.user_id, c.nome
        INTO referrer_data
        FROM plan_referral_links prl
        JOIN clientes c ON c.id = prl.user_id
        WHERE prl.referral_code = p_referral_code
        AND prl.custom_plan_id = plan_data.id
        AND prl.active = true;
        
        -- Atualizar estatísticas do link
        UPDATE plan_referral_links
        SET conversions_count = conversions_count + 1,
            total_commission = total_commission + (plan_data.entry_price * 0.25)
        WHERE referral_code = p_referral_code;
    END IF;
    
    -- Criar participação
    INSERT INTO plan_participations (
        plan_group_id,
        participant_id,
        entry_amount,
        position_number,
        referrer_id
    ) VALUES (
        group_data.id,
        p_participant_id,
        plan_data.entry_price,
        position_num,
        referrer_data.user_id
    ) RETURNING id INTO participation_id;
    
    -- Criar comissão se há referência
    IF referrer_data.user_id IS NOT NULL THEN
        INSERT INTO plan_commissions (
            plan_participation_id,
            referrer_id,
            participation_amount,
            commission_amount
        ) VALUES (
            participation_id,
            referrer_data.user_id,
            plan_data.entry_price,
            plan_data.entry_price * 0.25
        ) RETURNING id INTO commission_id;
    END IF;
    
    -- Atualizar contador do grupo
    UPDATE plan_groups
    SET current_participants = current_participants + 1,
        status = CASE 
            WHEN current_participants + 1 >= plan_data.max_participants THEN 'full'
            ELSE 'forming'
        END,
        updated_at = NOW()
    WHERE id = group_data.id;
    
    result := json_build_object(
        'success', true,
        'participation_id', participation_id,
        'group_id', group_data.id,
        'position', position_num,
        'group_progress', group_data.current_participants + 1,
        'max_participants', plan_data.max_participants,
        'referrer_commission_id', commission_id,
        'entry_amount', plan_data.entry_price
    );
    
    RETURN result;
END;
$$;

-- View para dashboard de planos (admin)
CREATE OR REPLACE VIEW admin_plans_overview AS
SELECT 
    cp.id,
    cp.plan_code,
    cp.name,
    cp.description,
    sc.name as category_name,
    cp.total_price,
    cp.entry_price,
    cp.max_participants,
    cp.active,
    cp.public_enrollment,
    
    -- Estatísticas dos grupos
    COUNT(pg.id) as total_groups,
    COUNT(CASE WHEN pg.status = 'forming' THEN 1 END) as forming_groups,
    COUNT(CASE WHEN pg.status = 'full' THEN 1 END) as full_groups,
    COUNT(CASE WHEN pg.status = 'completed' THEN 1 END) as completed_groups,
    
    -- Estatísticas de participação
    COALESCE(SUM(pg.current_participants), 0) as total_participants,
    COALESCE(SUM(pg.current_participants * cp.entry_price), 0) as total_revenue,
    
    -- Dados do criador
    a.nome as created_by_name,
    cp.created_at
    
FROM custom_plans cp
LEFT JOIN service_categories sc ON sc.id = cp.category_id
LEFT JOIN plan_groups pg ON pg.custom_plan_id = cp.id
LEFT JOIN administradores a ON a.id = cp.created_by
GROUP BY cp.id, cp.plan_code, cp.name, cp.description, sc.name, 
         cp.total_price, cp.entry_price, cp.max_participants, 
         cp.active, cp.public_enrollment, a.nome, cp.created_at
ORDER BY cp.created_at DESC;

-- View para participante ver seu progresso
CREATE OR REPLACE VIEW user_plan_progress AS
SELECT 
    pp.id as participation_id,
    cp.plan_code,
    cp.name as plan_name,
    cp.description,
    sc.name as category_name,
    cp.total_price,
    pp.entry_amount,
    
    -- Progresso do grupo
    pg.group_number,
    pp.position_number,
    pg.current_participants,
    cp.max_participants,
    pg.status as group_status,
    
    -- Status pessoal
    pp.payment_status,
    pp.contemplated,
    pp.service_completed,
    
    -- Dados do profissional
    p.nome as professional_name,
    p.especialidade,
    p.local_atendimento,
    
    -- Datas importantes
    pp.created_at as enrollment_date,
    pg.contemplation_date,
    pp.service_completion_date
    
FROM plan_participations pp
JOIN plan_groups pg ON pg.id = pp.plan_group_id
JOIN custom_plans cp ON cp.id = pg.custom_plan_id
LEFT JOIN service_categories sc ON sc.id = cp.category_id
LEFT JOIN profissionais p ON p.id = pg.assigned_professional_id
WHERE pp.active = true
ORDER BY pp.created_at DESC;

-- Inserir categorias padrão
INSERT INTO service_categories (name, description, icon) VALUES
('Tatuagem', 'Serviços de tatuagem e arte corporal', 'Palette'),
('Estética', 'Tratamentos estéticos e de beleza', 'Sparkles'),
('Barbearia', 'Cortes de cabelo e cuidados masculinos', 'Scissors'),
('Micropigmentação', 'Micropigmentação de sobrancelhas e lábios', 'Eye'),
('Odontologia', 'Tratamentos odontológicos', 'Smile'),
('Fisioterapia', 'Fisioterapia e reabilitação', 'Activity')
ON CONFLICT DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_custom_plans_active ON custom_plans(active);
CREATE INDEX IF NOT EXISTS idx_custom_plans_code ON custom_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_plan_groups_status ON plan_groups(status);
CREATE INDEX IF NOT EXISTS idx_plan_participations_participant ON plan_participations(participant_id);
CREATE INDEX IF NOT EXISTS idx_plan_referral_links_code ON plan_referral_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_plan_commissions_referrer ON plan_commissions(referrer_id);

-- Triggers para atualização automática de timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_plans_updated_at BEFORE UPDATE ON custom_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_groups_updated_at BEFORE UPDATE ON plan_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE custom_plans IS 'Planos customizados criados pelos administradores';
COMMENT ON TABLE plan_groups IS 'Instâncias de grupos para cada plano';
COMMENT ON TABLE plan_participations IS 'Participações dos usuários nos grupos de planos';
COMMENT ON TABLE plan_referral_links IS 'Links de referência para indicação';
COMMENT ON TABLE plan_commissions IS 'Comissões geradas por indicações nos planos';
COMMENT ON FUNCTION create_custom_plan IS 'Cria um novo plano customizado';
COMMENT ON FUNCTION generate_referral_link IS 'Gera link de referência para usuário';
COMMENT ON FUNCTION process_plan_enrollment IS 'Processa inscrição de usuário em plano';