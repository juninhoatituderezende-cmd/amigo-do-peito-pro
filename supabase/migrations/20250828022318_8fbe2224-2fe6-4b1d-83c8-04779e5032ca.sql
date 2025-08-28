-- Criar tabela de transações com separação de serviços e produtos
CREATE TABLE IF NOT EXISTS public.transacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  plano_id UUID,
  produto_id UUID,
  valor NUMERIC(10,2) NOT NULL,
  tipo_transacao TEXT CHECK (tipo_transacao IN ('servico', 'produto')) NOT NULL,
  status TEXT DEFAULT 'pendente'::text,
  asaas_payment_id TEXT,
  payment_method TEXT,
  iss_percentual NUMERIC(5,2) DEFAULT NULL, -- Para serviços
  icms_percentual NUMERIC(5,2) DEFAULT NULL, -- Para produtos
  pis_cofins_percentual NUMERIC(5,2) DEFAULT NULL, -- Para produtos
  valor_impostos NUMERIC(10,2) DEFAULT 0,
  valor_liquido NUMERIC(10,2) DEFAULT 0,
  municipio_iss TEXT, -- Para cálculo ISS
  regime_tributario TEXT DEFAULT 'simples_nacional',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own transactions" 
ON public.transacoes FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Service role can manage all transactions" 
ON public.transacoes FOR ALL 
USING (auth.role() = 'service_role');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_id ON public.transacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes(tipo_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON public.transacoes(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_transacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transacoes_updated_at
    BEFORE UPDATE ON public.transacoes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_transacoes_updated_at();

-- Adicionar campo tipo_transacao nas tabelas de planos existentes
ALTER TABLE public.custom_plans 
ADD COLUMN IF NOT EXISTS tipo_transacao TEXT DEFAULT 'servico' CHECK (tipo_transacao IN ('servico', 'produto'));

ALTER TABLE public.planos_tatuador 
ADD COLUMN IF NOT EXISTS tipo_transacao TEXT DEFAULT 'servico' CHECK (tipo_transacao IN ('servico', 'produto'));

ALTER TABLE public.planos_dentista 
ADD COLUMN IF NOT EXISTS tipo_transacao TEXT DEFAULT 'servico' CHECK (tipo_transacao IN ('servico', 'produto'));

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS tipo_transacao TEXT DEFAULT 'produto' CHECK (tipo_transacao IN ('servico', 'produto'));

-- Função para calcular impostos
CREATE OR REPLACE FUNCTION public.calcular_impostos(
  valor_base NUMERIC,
  tipo TEXT,
  municipio TEXT DEFAULT 'sao_paulo',
  regime TEXT DEFAULT 'simples_nacional'
)
RETURNS JSON AS $$
DECLARE
  iss_perc NUMERIC := 0;
  icms_perc NUMERIC := 0;
  pis_cofins_perc NUMERIC := 0;
  valor_iss NUMERIC := 0;
  valor_icms NUMERIC := 0;
  valor_pis_cofins NUMERIC := 0;
  total_impostos NUMERIC := 0;
  valor_liquido NUMERIC := 0;
BEGIN
  IF tipo = 'servico' THEN
    -- ISS varia por município (2% a 5%)
    CASE municipio
      WHEN 'sao_paulo' THEN iss_perc := 3.0;
      WHEN 'rio_de_janeiro' THEN iss_perc := 5.0;
      WHEN 'belo_horizonte' THEN iss_perc := 2.0;
      ELSE iss_perc := 3.0; -- Default 3%
    END CASE;
    
    valor_iss := (valor_base * iss_perc / 100);
    total_impostos := valor_iss;
    
  ELSIF tipo = 'produto' THEN
    IF regime = 'simples_nacional' THEN
      icms_perc := 7.0; -- ICMS Simples Nacional
      pis_cofins_perc := 3.65; -- PIS/COFINS Simples Nacional
    ELSE
      icms_perc := 18.0; -- ICMS Lucro Presumido/Real
      pis_cofins_perc := 9.25; -- PIS/COFINS Lucro Presumido/Real
    END IF;
    
    valor_icms := (valor_base * icms_perc / 100);
    valor_pis_cofins := (valor_base * pis_cofins_perc / 100);
    total_impostos := valor_icms + valor_pis_cofins;
  END IF;
  
  valor_liquido := valor_base - total_impostos;
  
  RETURN json_build_object(
    'valor_base', valor_base,
    'tipo_transacao', tipo,
    'iss_percentual', iss_perc,
    'icms_percentual', icms_perc,
    'pis_cofins_percentual', pis_cofins_perc,
    'valor_iss', valor_iss,
    'valor_icms', valor_icms,
    'valor_pis_cofins', valor_pis_cofins,
    'total_impostos', total_impostos,
    'valor_liquido', valor_liquido
  );
END;
$$ LANGUAGE plpgsql;