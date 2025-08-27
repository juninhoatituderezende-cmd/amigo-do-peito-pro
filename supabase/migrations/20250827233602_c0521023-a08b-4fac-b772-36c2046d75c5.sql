-- Criar tabelas específicas para cada tipo de serviço
CREATE TABLE public.planos_tatuador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  professional_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.planos_dentista (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  professional_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.planos_tatuador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_dentista ENABLE ROW LEVEL SECURITY;

-- Políticas para planos_tatuador
CREATE POLICY "Admins can manage tatuador plans" ON public.planos_tatuador
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Anyone can view active tatuador plans" ON public.planos_tatuador
FOR SELECT USING (active = true);

CREATE POLICY "Professionals can manage own tatuador plans" ON public.planos_tatuador
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = planos_tatuador.professional_id 
    AND profiles.role = 'professional'::user_role
  )
);

-- Políticas para planos_dentista
CREATE POLICY "Admins can manage dentista plans" ON public.planos_dentista
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Anyone can view active dentista plans" ON public.planos_dentista
FOR SELECT USING (active = true);

CREATE POLICY "Professionals can manage own dentista plans" ON public.planos_dentista
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = planos_dentista.professional_id 
    AND profiles.role = 'professional'::user_role
  )
);

-- Índices para performance
CREATE INDEX idx_planos_tatuador_active ON public.planos_tatuador(active);
CREATE INDEX idx_planos_tatuador_professional ON public.planos_tatuador(professional_id);
CREATE INDEX idx_planos_dentista_active ON public.planos_dentista(active);
CREATE INDEX idx_planos_dentista_professional ON public.planos_dentista(professional_id);

-- Triggers para updated_at
CREATE TRIGGER update_planos_tatuador_updated_at
  BEFORE UPDATE ON public.planos_tatuador
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planos_dentista_updated_at
  BEFORE UPDATE ON public.planos_dentista
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();