-- Marketplace Database Setup
-- Tables for products, sales, commissions and affiliate tracking

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  full_price DECIMAL(10,2) NOT NULL,
  down_payment DECIMAL(10,2) NOT NULL, -- 10% of full_price
  image_url TEXT,
  external_link TEXT, -- For dropshipping products
  visibility TEXT NOT NULL DEFAULT 'both' CHECK (visibility IN ('client', 'professional', 'both')),
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, cancelled
  referral_code TEXT, -- tracks which influencer/professional made the sale
  professional_id UUID REFERENCES auth.users(id),
  influencer_id UUID REFERENCES auth.users(id),
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Commissions table
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL, -- 'professional' or 'influencer'
  commission_rate DECIMAL(5,2) NOT NULL, -- 50.00 for professional, 25.00 for influencer
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, cancelled
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Affiliate links table
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product categories lookup table
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.product_categories (name, description) VALUES
('Produtos Gerais', 'Produtos para consumidores finais'),
('Insumos Técnicos', 'Materiais e equipamentos para profissionais'),
('Serviços Profissionais', 'Consultorias, cursos e serviços especializados'),
('Produtos Digitais', 'E-books, softwares e recursos digitais'),
('Cursos Online', 'Treinamentos e capacitações online'),
('Consultoria', 'Serviços de consultoria personalizados'),
('Eventos', 'Workshops, seminários e eventos'),
('Outros', 'Demais produtos e serviços');

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "select_products" ON public.products FOR SELECT USING (true);
CREATE POLICY "insert_products" ON public.products FOR INSERT WITH CHECK (professional_id = auth.uid());
CREATE POLICY "update_own_products" ON public.products FOR UPDATE USING (professional_id = auth.uid());
CREATE POLICY "delete_own_products" ON public.products FOR DELETE USING (professional_id = auth.uid());

-- Sales policies
CREATE POLICY "select_own_sales" ON public.sales FOR SELECT USING (
  professional_id = auth.uid() OR influencer_id = auth.uid()
);
CREATE POLICY "insert_sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "update_sales" ON public.sales FOR UPDATE USING (true);

-- Commissions policies
CREATE POLICY "select_own_commissions" ON public.commissions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_commissions" ON public.commissions FOR INSERT WITH CHECK (true);
CREATE POLICY "update_commissions" ON public.commissions FOR UPDATE USING (true);

-- Affiliate links policies
CREATE POLICY "select_own_affiliate_links" ON public.affiliate_links FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_affiliate_links" ON public.affiliate_links FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_affiliate_links" ON public.affiliate_links FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own_affiliate_links" ON public.affiliate_links FOR DELETE USING (user_id = auth.uid());

-- Categories policies
CREATE POLICY "select_categories" ON public.product_categories FOR SELECT USING (true);

-- Functions

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID, product_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  code := UPPER(SUBSTRING(MD5(user_id::TEXT || product_id::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT) FROM 1 FOR 8));
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Calculate commission amounts
CREATE OR REPLACE FUNCTION calculate_commission(sale_amount DECIMAL, user_type TEXT)
RETURNS DECIMAL AS $$
BEGIN
  CASE user_type
    WHEN 'professional' THEN RETURN sale_amount * 0.50; -- 50%
    WHEN 'influencer' THEN RETURN sale_amount * 0.25;   -- 25%
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create affiliate link when product is created
CREATE OR REPLACE FUNCTION create_affiliate_link_for_product()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.affiliate_links (user_id, product_id, referral_code)
  VALUES (NEW.professional_id, NEW.id, generate_referral_code(NEW.professional_id, NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_affiliate_link
AFTER INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION create_affiliate_link_for_product();

-- Trigger to create commissions when sale is made
CREATE OR REPLACE FUNCTION create_commissions_for_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create commissions for paid sales
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    
    -- Professional commission (50%)
    INSERT INTO public.commissions (sale_id, user_id, user_type, commission_rate, commission_amount)
    VALUES (
      NEW.id,
      NEW.professional_id,
      'professional',
      50.00,
      calculate_commission(NEW.amount_paid, 'professional')
    );
    
    -- Influencer commission (25%) if there's an influencer
    IF NEW.influencer_id IS NOT NULL THEN
      INSERT INTO public.commissions (sale_id, user_id, user_type, commission_rate, commission_amount)
      VALUES (
        NEW.id,
        NEW.influencer_id,
        'influencer',
        25.00,
        calculate_commission(NEW.amount_paid, 'influencer')
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_commissions
AFTER INSERT OR UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION create_commissions_for_sale();

-- Views for easier data access

-- Professional dashboard view
CREATE VIEW professional_dashboard AS
SELECT 
  p.id as professional_id,
  p.email as professional_email,
  COUNT(DISTINCT pr.id) as total_products,
  COUNT(DISTINCT s.id) as total_sales,
  COALESCE(SUM(c.commission_amount), 0) as total_commissions,
  COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.commission_amount ELSE 0 END), 0) as paid_commissions,
  COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.commission_amount ELSE 0 END), 0) as pending_commissions
FROM auth.users p
LEFT JOIN products pr ON pr.professional_id = p.id
LEFT JOIN sales s ON s.professional_id = p.id AND s.payment_status = 'paid'
LEFT JOIN commissions c ON c.user_id = p.id AND c.user_type = 'professional'
GROUP BY p.id, p.email;

-- Influencer dashboard view
CREATE VIEW influencer_dashboard AS
SELECT 
  u.id as influencer_id,
  u.email as influencer_email,
  COUNT(DISTINCT s.id) as total_sales,
  COALESCE(SUM(c.commission_amount), 0) as total_commissions,
  COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.commission_amount ELSE 0 END), 0) as paid_commissions,
  COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.commission_amount ELSE 0 END), 0) as pending_commissions,
  COUNT(DISTINCT al.id) as total_affiliate_links
FROM auth.users u
LEFT JOIN sales s ON s.influencer_id = u.id AND s.payment_status = 'paid'
LEFT JOIN commissions c ON c.user_id = u.id AND c.user_type = 'influencer'
LEFT JOIN affiliate_links al ON al.user_id = u.id
GROUP BY u.id, u.email;