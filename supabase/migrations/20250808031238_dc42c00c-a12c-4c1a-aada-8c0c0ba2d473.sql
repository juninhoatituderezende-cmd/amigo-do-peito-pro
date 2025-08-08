-- Criar tabelas para produtos e vendas do sistema (corrigindo ambiguidade)

-- 1. Tabela de produtos do marketplace
CREATE TABLE public.marketplace_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  valor_total NUMERIC NOT NULL,
  percentual_entrada NUMERIC NOT NULL DEFAULT 10.0,
  image_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  professional_id UUID REFERENCES public.professionals(id),
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de vendas realizadas
CREATE TABLE public.marketplace_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  valor_total NUMERIC NOT NULL,
  valor_entrada_pago NUMERIC NOT NULL,
  influencer_code TEXT,
  influencer_id UUID REFERENCES auth.users(id),
  comissao_influencer NUMERIC DEFAULT 0,
  comissao_profissional NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies para products
CREATE POLICY "Admins can manage all products" ON public.marketplace_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Professionals can view their own products" ON public.marketplace_products
  FOR SELECT USING (
    professional_id IN (SELECT professionals.id FROM public.professionals WHERE professionals.user_id = auth.uid())
  );

CREATE POLICY "Professionals can create products" ON public.marketplace_products
  FOR INSERT WITH CHECK (
    professional_id IN (SELECT professionals.id FROM public.professionals WHERE professionals.user_id = auth.uid())
  );

CREATE POLICY "Users can view approved products" ON public.marketplace_products
  FOR SELECT USING (approved = true AND ativo = true);

-- RLS Policies para sales
CREATE POLICY "Admins can view all sales" ON public.marketplace_sales
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Users can view their own purchases" ON public.marketplace_sales
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Professionals can view sales of their products" ON public.marketplace_sales
  FOR SELECT USING (
    product_id IN (
      SELECT p.id FROM public.marketplace_products p 
      JOIN public.professionals prof ON p.professional_id = prof.id 
      WHERE prof.user_id = auth.uid()
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_marketplace_products_updated_at
  BEFORE UPDATE ON public.marketplace_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_sales_updated_at
  BEFORE UPDATE ON public.marketplace_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();