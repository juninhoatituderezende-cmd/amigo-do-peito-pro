-- Ajustar estrutura do banco para sistema completo de grupos e indicações

-- 1. Garantir que temos tabela de grupo de planos adequada
ALTER TABLE plan_groups ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. Criar função para gerar código de referência único para grupos
CREATE OR REPLACE FUNCTION generate_group_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Gerar código de 8 caracteres alfanuméricos
        code := UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8));
        
        -- Verificar se já existe
        SELECT COUNT(*) INTO exists_count 
        FROM plan_groups 
        WHERE referral_code = code;
        
        -- Se não existe, retornar o código
        IF exists_count = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir que group_participants tem campo referrer_code
ALTER TABLE group_participants ADD COLUMN IF NOT EXISTS referrer_code TEXT;

-- 4. Criar trigger para gerar referral_code automaticamente para novos grupos
CREATE OR REPLACE FUNCTION auto_generate_group_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_group_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_group_referral_code ON plan_groups;
CREATE TRIGGER trigger_auto_generate_group_referral_code
    BEFORE INSERT ON plan_groups
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_group_referral_code();

-- 5. Função para criar um grupo automaticamente quando usuário escolhe um plano
CREATE OR REPLACE FUNCTION create_user_plan_group(
    user_uuid UUID,
    plan_uuid UUID,
    entry_amount NUMERIC
) RETURNS UUID AS $$
DECLARE
    group_uuid UUID;
    plan_data RECORD;
BEGIN
    -- Buscar dados do plano
    SELECT * INTO plan_data FROM custom_plans WHERE id = plan_uuid AND active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plano não encontrado ou inativo';
    END IF;
    
    -- Criar novo grupo
    INSERT INTO plan_groups (
        service_id, 
        max_participants, 
        target_amount, 
        current_participants, 
        current_amount,
        status,
        group_number
    ) VALUES (
        plan_uuid,
        plan_data.max_participants,
        plan_data.price,
        1, -- Começar com 1 participante (o criador)
        entry_amount,
        'forming',
        COALESCE((SELECT MAX(group_number) FROM plan_groups WHERE service_id = plan_uuid), 0) + 1
    ) RETURNING id INTO group_uuid;
    
    -- Adicionar usuário como primeiro participante
    INSERT INTO group_participants (
        user_id,
        group_id, 
        amount_paid,
        status,
        joined_at
    ) VALUES (
        user_uuid,
        group_uuid,
        entry_amount,
        'active',
        NOW()
    );
    
    RETURN group_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para adicionar participante via código de referência
CREATE OR REPLACE FUNCTION join_group_by_referral(
    user_uuid UUID,
    referral_code_param TEXT,
    entry_amount NUMERIC
) RETURNS UUID AS $$
DECLARE
    group_uuid UUID;
    current_count INTEGER;
    max_count INTEGER;
    plan_price NUMERIC;
BEGIN
    -- Encontrar grupo pelo código de referência
    SELECT pg.id, pg.current_participants, pg.max_participants, cp.price
    INTO group_uuid, current_count, max_count, plan_price
    FROM plan_groups pg
    JOIN custom_plans cp ON cp.id = pg.service_id
    WHERE pg.referral_code = referral_code_param 
    AND pg.status = 'forming';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Código de referência inválido ou grupo já completo';
    END IF;
    
    -- Verificar se grupo não está cheio
    IF current_count >= max_count THEN
        RAISE EXCEPTION 'Grupo já está completo';
    END IF;
    
    -- Verificar se usuário já está no grupo
    IF EXISTS (SELECT 1 FROM group_participants WHERE user_id = user_uuid AND group_id = group_uuid) THEN
        RAISE EXCEPTION 'Usuário já está neste grupo';
    END IF;
    
    -- Adicionar participante
    INSERT INTO group_participants (
        user_id,
        group_id,
        amount_paid,
        status,
        joined_at,
        referrer_code
    ) VALUES (
        user_uuid,
        group_uuid,
        entry_amount,
        'active',
        NOW(),
        referral_code_param
    );
    
    -- Atualizar contador do grupo
    UPDATE plan_groups 
    SET 
        current_participants = current_participants + 1,
        current_amount = current_amount + entry_amount,
        updated_at = NOW()
    WHERE id = group_uuid;
    
    -- Verificar se grupo ficou completo
    SELECT current_participants INTO current_count 
    FROM plan_groups WHERE id = group_uuid;
    
    IF current_count >= max_count THEN
        UPDATE plan_groups 
        SET status = 'complete', contemplated_at = NOW()
        WHERE id = group_uuid;
        
        -- Notificar todos os participantes
        INSERT INTO notification_triggers (
            user_id, event_type, title, message, data
        )
        SELECT 
            gp.user_id,
            'group_completed',
            'Grupo Completo!',
            'Seu grupo foi completado e você já pode agendar seu serviço!',
            jsonb_build_object(
                'group_id', group_uuid,
                'referral_code', referral_code_param
            )
        FROM group_participants gp
        WHERE gp.group_id = group_uuid;
    END IF;
    
    RETURN group_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Atualizar políticas RLS para permitir operações necessárias
DROP POLICY IF EXISTS "Users can join groups via referral" ON group_participants;
CREATE POLICY "Users can join groups via referral" 
ON group_participants FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_plan_groups_referral_code ON plan_groups(referral_code);
CREATE INDEX IF NOT EXISTS idx_plan_groups_service_status ON plan_groups(service_id, status);
CREATE INDEX IF NOT EXISTS idx_group_participants_user_group ON group_participants(user_id, group_id);

-- 9. Função para verificar se usuário tem plano ativo obrigatório
CREATE OR REPLACE FUNCTION user_has_active_plan(user_uuid UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM group_participants gp
        JOIN plan_groups pg ON pg.id = gp.group_id
        WHERE gp.user_id = user_uuid 
        AND gp.status = 'active'
        AND pg.status IN ('forming', 'complete')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;