-- Create comprehensive marketplace system
-- 1. Products table for marketplace items
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  target_audience TEXT DEFAULT 'user' CHECK (target_audience IN ('user', 'professional', 'both')),
  external_link TEXT,
  visibility TEXT DEFAULT 'both' CHECK (visibility IN ('client', 'professional', 'both')),
  professional_id UUID REFERENCES profiles(id),
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT -1, -- -1 for unlimited
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Custom plans table for subscription/service plans
CREATE TABLE IF NOT EXISTS public.custom_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  duration_months INTEGER DEFAULT 1,
  features JSONB DEFAULT '[]',
  category TEXT DEFAULT 'service',
  active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 10,
  professional_id UUID REFERENCES profiles(id),
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. User purchases table for tracking purchases
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  product_id UUID REFERENCES products(id),
  plan_id UUID REFERENCES custom_plans(id),
  amount_paid NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'credits',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  purchase_type TEXT DEFAULT 'product' CHECK (purchase_type IN ('product', 'plan', 'service')),
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure either product_id or plan_id is set, but not both
  CONSTRAINT check_product_or_plan CHECK (
    (product_id IS NOT NULL AND plan_id IS NULL) OR 
    (product_id IS NULL AND plan_id IS NOT NULL)
  )
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (active = true);

CREATE POLICY "Professionals can manage own products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.id = products.professional_id)
  );

CREATE POLICY "Service role can manage all products" ON public.products
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for custom_plans
CREATE POLICY "Anyone can view active plans" ON public.custom_plans
  FOR SELECT USING (active = true);

CREATE POLICY "Professionals can manage own plans" ON public.custom_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.id = custom_plans.professional_id)
  );

CREATE POLICY "Service role can manage all plans" ON public.custom_plans
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for user_purchases
CREATE POLICY "Users can view own purchases" ON public.user_purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.id = user_purchases.user_id)
  );

CREATE POLICY "Users can create own purchases" ON public.user_purchases
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.id = user_purchases.user_id)
  );

CREATE POLICY "Service role can manage all purchases" ON public.user_purchases
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_professional ON public.products(professional_id);
CREATE INDEX IF NOT EXISTS idx_custom_plans_active ON public.custom_plans(active);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user ON public.user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_product ON public.user_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_plan ON public.user_purchases(plan_id);

-- Insert sample data for products
INSERT INTO public.products (name, description, price, category, target_audience, image_url) VALUES
('Curso de Tatuagem Básica', 'Aprenda os fundamentos da tatuagem com profissionais experientes', 299.99, 'cursos', 'user', '/lovable-uploads/course-tattoo.jpg'),
('Kit Insumos Tattoo Profissional', 'Kit completo com agulhas, tintas e equipamentos para tatuadores', 450.00, 'insumos', 'professional', '/lovable-uploads/tattoo-kit.jpg'),
('Consultoria Odontológica', 'Sessão de consultoria especializada em odontologia estética', 150.00, 'consultoria', 'both', '/lovable-uploads/dental-consult.jpg'),
('Produto Digital - eBook Técnicas Avançadas', 'Manual completo com técnicas avançadas de tatuagem', 49.99, 'produtos-digitais', 'user', '/lovable-uploads/ebook-tattoo.jpg')
ON CONFLICT DO NOTHING;

-- Insert sample data for custom plans
INSERT INTO public.custom_plans (name, description, price, duration_months, features, category) VALUES
('Plano Básico Tattoo', 'Acesso básico à plataforma e materiais', 99.99, 1, '["Acesso à biblioteca de designs", "Suporte básico", "1 consulta mensal"]', 'tattoo'),
('Plano Premium Tattoo', 'Acesso completo com benefícios extras', 199.99, 1, '["Acesso total", "Suporte prioritário", "Consultas ilimitadas", "Materiais exclusivos"]', 'tattoo'),
('Plano Dental Profissional', 'Para profissionais da área odontológica', 299.99, 3, '["Cursos especializados", "Certificações", "Networking profissional"]', 'dental')
ON CONFLICT DO NOTHING;

-- Update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_plans_updated_at BEFORE UPDATE ON public.custom_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();