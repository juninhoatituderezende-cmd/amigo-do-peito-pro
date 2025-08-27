-- Função para buscar planos de uma tabela específica
CREATE OR REPLACE FUNCTION get_service_plans(table_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result JSON;
BEGIN
    -- Validar nome da tabela
    IF table_name NOT IN ('planos_tatuador', 'planos_dentista', 'planos_cabelo', 'planos_barba', 'planos_implante_capilar') THEN
        RAISE EXCEPTION 'Nome de tabela inválido: %', table_name;
    END IF;
    
    -- Executar query dinâmica
    EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM %I ORDER BY created_at DESC) t', table_name) INTO result;
    
    RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- Função para inserir plano em tabela específica
CREATE OR REPLACE FUNCTION insert_service_plan(
    table_name TEXT,
    plan_name TEXT,
    plan_description TEXT,
    plan_price NUMERIC,
    plan_max_participants INTEGER,
    plan_image_url TEXT,
    plan_active BOOLEAN,
    plan_professional_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result JSON;
    new_id UUID;
BEGIN
    -- Validar nome da tabela
    IF table_name NOT IN ('planos_tatuador', 'planos_dentista', 'planos_cabelo', 'planos_barba', 'planos_implante_capilar') THEN
        RAISE EXCEPTION 'Nome de tabela inválido: %', table_name;
    END IF;
    
    -- Gerar novo ID
    new_id := gen_random_uuid();
    
    -- Executar insert dinâmico
    EXECUTE format('INSERT INTO %I (id, name, description, price, max_participants, image_url, active, professional_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', table_name) 
    USING new_id, plan_name, plan_description, plan_price, plan_max_participants, plan_image_url, plan_active, plan_professional_id;
    
    -- Retornar o novo registro
    EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM %I WHERE id = $1) t', table_name) INTO result USING new_id;
    
    RETURN result;
END;
$$;

-- Função para atualizar plano em tabela específica
CREATE OR REPLACE FUNCTION update_service_plan(
    table_name TEXT,
    plan_id UUID,
    plan_name TEXT,
    plan_description TEXT,
    plan_price NUMERIC,
    plan_max_participants INTEGER,
    plan_image_url TEXT,
    plan_active BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result JSON;
BEGIN
    -- Validar nome da tabela
    IF table_name NOT IN ('planos_tatuador', 'planos_dentista', 'planos_cabelo', 'planos_barba', 'planos_implante_capilar') THEN
        RAISE EXCEPTION 'Nome de tabela inválido: %', table_name;
    END IF;
    
    -- Executar update dinâmico
    EXECUTE format('UPDATE %I SET name = $2, description = $3, price = $4, max_participants = $5, image_url = $6, active = $7, updated_at = NOW() WHERE id = $1', table_name) 
    USING plan_id, plan_name, plan_description, plan_price, plan_max_participants, plan_image_url, plan_active;
    
    -- Verificar se o registro foi encontrado
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plano não encontrado: %', plan_id;
    END IF;
    
    -- Retornar o registro atualizado
    EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM %I WHERE id = $1) t', table_name) INTO result USING plan_id;
    
    RETURN result;
END;
$$;

-- Função para deletar plano de tabela específica
CREATE OR REPLACE FUNCTION delete_service_plan(
    table_name TEXT,
    plan_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Validar nome da tabela
    IF table_name NOT IN ('planos_tatuador', 'planos_dentista', 'planos_cabelo', 'planos_barba', 'planos_implante_capilar') THEN
        RAISE EXCEPTION 'Nome de tabela inválido: %', table_name;
    END IF;
    
    -- Executar delete dinâmico
    EXECUTE format('DELETE FROM %I WHERE id = $1', table_name) USING plan_id;
    
    -- Verificar se o registro foi encontrado
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plano não encontrado: %', plan_id;
    END IF;
    
    RETURN TRUE;
END;
$$;