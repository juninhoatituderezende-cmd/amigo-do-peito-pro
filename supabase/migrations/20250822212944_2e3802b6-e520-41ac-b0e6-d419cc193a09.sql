-- Primeiro verificar se existe algum usuário
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Gerar um UUID fixo para o admin
    admin_user_id := '00000000-0000-0000-0000-000000000001';
    
    -- Inserir perfil admin diretamente
    INSERT INTO profiles (
        id,
        user_id, 
        full_name, 
        email, 
        role, 
        approved, 
        referral_code,
        created_at,
        updated_at
    ) 
    VALUES (
        gen_random_uuid(),
        admin_user_id,
        'Administrador Principal',
        'admin@system.com',
        'admin',
        true,
        'ADMIN001',
        now(),
        now()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Inserir créditos para o admin
    INSERT INTO user_credits (
        user_id,
        total_credits,
        available_credits
    )
    VALUES (
        admin_user_id,
        1000,
        1000
    )
    ON CONFLICT (user_id) DO NOTHING;
    
END $$;