-- =============================================
-- SISTEMA COMPLETO DE INDICAÇÕES E AGENDAMENTOS
-- =============================================

-- 1. Verificar se a extensão uuid está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Tabela de agendamentos (faltante no sistema atual)
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participation_id UUID REFERENCES public.group_participants(id) ON DELETE CASCADE,
    data_procedimento TIMESTAMP WITH TIME ZONE NOT NULL,
    profissional TEXT,
    status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado', 'concluido', 'cancelado')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de pagamentos específica (complementar às existentes)
CREATE TABLE IF NOT EXISTS public.pagamentos_participacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participation_id UUID REFERENCES public.group_participants(id) ON DELETE CASCADE,
    valor NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'estornado')),
    metodo TEXT CHECK (metodo IN ('pix', 'cartao', 'boleto', 'credito')),
    referencia_externa TEXT, -- ID do Asaas ou outro gateway
    data_vencimento TIMESTAMP WITH TIME ZONE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de referrals (sistema de indicações detalhado)
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    codigo_referencia TEXT UNIQUE NOT NULL,
    indicado_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'premiado')),
    bonus_valor NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_participation_id ON public.agendamentos(participation_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_procedimento ON public.agendamentos(data_procedimento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos(status);

CREATE INDEX IF NOT EXISTS idx_pagamentos_participation_id ON public.pagamentos_participacao(participation_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos_participacao(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_metodo ON public.pagamentos_participacao(metodo);

CREATE INDEX IF NOT EXISTS idx_referrals_usuario_id ON public.referrals(usuario_id);
CREATE INDEX IF NOT EXISTS idx_referrals_indicado_id ON public.referrals(indicado_id);
CREATE INDEX IF NOT EXISTS idx_referrals_codigo ON public.referrals(codigo_referencia);

-- 7. Triggers para updated_at
CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON public.agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at
    BEFORE UPDATE ON public.pagamentos_participacao
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Habilitar RLS em todas as tabelas
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_participacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS para agendamentos
CREATE POLICY "Users can view own agendamentos"
    ON public.agendamentos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_participants gp
            WHERE gp.id = agendamentos.participation_id
            AND gp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own agendamentos"
    ON public.agendamentos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_participants gp
            WHERE gp.id = participation_id
            AND gp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own agendamentos"
    ON public.agendamentos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.group_participants gp
            WHERE gp.id = agendamentos.participation_id
            AND gp.user_id = auth.uid()
        )
    );

-- 10. Políticas RLS para pagamentos
CREATE POLICY "Users can view own pagamentos"
    ON public.pagamentos_participacao FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_participants gp
            WHERE gp.id = pagamentos_participacao.participation_id
            AND gp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own pagamentos"
    ON public.pagamentos_participacao FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_participants gp
            WHERE gp.id = participation_id
            AND gp.user_id = auth.uid()
        )
    );

-- 11. Políticas RLS para referrals
CREATE POLICY "Users can view own referrals"
    ON public.referrals FOR SELECT
    USING (usuario_id = auth.uid() OR indicado_id = auth.uid());

CREATE POLICY "Users can create referrals"
    ON public.referrals FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can update own referrals"
    ON public.referrals FOR UPDATE
    USING (usuario_id = auth.uid());

-- 12. Política para service role (admin)
CREATE POLICY "Service role can manage all agendamentos"
    ON public.agendamentos FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all pagamentos"
    ON public.pagamentos_participacao FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all referrals"
    ON public.referrals FOR ALL
    USING (auth.role() = 'service_role');

-- 13. Função para gerar código de referência único
CREATE OR REPLACE FUNCTION public.generate_referral_code()
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
        FROM public.referrals 
        WHERE codigo_referencia = code;
        
        -- Se não existe, retornar o código
        IF exists_count = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Função para processar indicação quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.process_referral(referrer_code TEXT, new_user_id UUID)
RETURNS UUID AS $$
DECLARE
    referrer_profile_id UUID;
    referral_id UUID;
BEGIN
    -- Encontrar o usuário que fez a indicação
    SELECT id INTO referrer_profile_id
    FROM public.profiles
    WHERE referral_code = referrer_code;
    
    IF referrer_profile_id IS NOT NULL THEN
        -- Criar registro de referral
        INSERT INTO public.referrals (
            usuario_id,
            codigo_referencia,
            indicado_id,
            status
        ) VALUES (
            referrer_profile_id,
            referrer_code,
            new_user_id,
            'confirmado'
        ) RETURNING id INTO referral_id;
        
        -- Atualizar o campo referred_by na tabela profiles
        UPDATE public.profiles 
        SET referred_by = referrer_profile_id
        WHERE user_id = new_user_id;
        
        RETURN referral_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Comentários para documentação
COMMENT ON TABLE public.agendamentos IS 'Tabela para agendamentos de procedimentos dos usuários contemplados';
COMMENT ON TABLE public.pagamentos_participacao IS 'Tabela para controle específico de pagamentos de participações';
COMMENT ON TABLE public.referrals IS 'Tabela para sistema detalhado de indicações e referências';

COMMENT ON COLUMN public.agendamentos.participation_id IS 'Referência à participação no grupo';
COMMENT ON COLUMN public.agendamentos.data_procedimento IS 'Data e hora do procedimento agendado';
COMMENT ON COLUMN public.agendamentos.profissional IS 'Nome do profissional que realizará o procedimento';

COMMENT ON COLUMN public.pagamentos_participacao.referencia_externa IS 'ID de referência no gateway de pagamento (Asaas, etc)';
COMMENT ON COLUMN public.pagamentos_participacao.data_vencimento IS 'Data de vencimento do pagamento';

COMMENT ON COLUMN public.referrals.codigo_referencia IS 'Código único de referência do usuário';
COMMENT ON COLUMN public.referrals.bonus_valor IS 'Valor do bônus por indicação (se aplicável)';