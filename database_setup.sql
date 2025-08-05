-- Execute este SQL no Supabase Dashboard > SQL Editor

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create professionals table
CREATE TABLE public.professionals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  category text NOT NULL,
  location text NOT NULL,
  cep text NOT NULL,
  instagram text NOT NULL,
  cpf text NOT NULL,
  approved boolean DEFAULT false,
  description text,
  experience text,
  id_document_url text,
  video_url text
);

-- Create users table
CREATE TABLE public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  referral_code text UNIQUE NOT NULL,
  referred_by text
);

-- Create influencers table
CREATE TABLE public.influencers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  instagram text NOT NULL,
  followers text NOT NULL,
  approved boolean DEFAULT false
);

-- Create services table
CREATE TABLE public.services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  price decimal NOT NULL,
  duration text NOT NULL,
  category text NOT NULL
);

-- Create groups table
CREATE TABLE public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  discount_percentage integer DEFAULT 10
);

-- Create transactions table
CREATE TABLE public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  amount decimal NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'pending',
  description text NOT NULL
);

-- Create withdrawals table
CREATE TABLE public.withdrawals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  amount decimal NOT NULL,
  pix_key text NOT NULL,
  status text DEFAULT 'pending',
  processed_at timestamp with time zone
);

-- Enable Row Level Security on all tables
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Professionals policies
CREATE POLICY "Professionals can view own data" ON public.professionals
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Professionals can update own data" ON public.professionals
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can insert professionals" ON public.professionals
  FOR INSERT WITH CHECK (true);

-- Users policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Influencers policies
CREATE POLICY "Influencers can view own data" ON public.influencers
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Influencers can update own data" ON public.influencers
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can insert influencers" ON public.influencers
  FOR INSERT WITH CHECK (true);

-- Services policies
CREATE POLICY "Anyone can view services" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Professionals can insert own services" ON public.services
  FOR INSERT WITH CHECK (auth.uid()::text = professional_id::text);

CREATE POLICY "Professionals can update own services" ON public.services
  FOR UPDATE USING (auth.uid()::text = professional_id::text);

-- Groups policies
CREATE POLICY "Users can view own groups" ON public.groups
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid()::text = professional_id::text);

CREATE POLICY "Anyone can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (true);

-- Withdrawals policies
CREATE POLICY "Professionals can view own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid()::text = professional_id::text);

CREATE POLICY "Professionals can insert own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid()::text = professional_id::text);

-- Insert some sample data for testing
INSERT INTO public.professionals (full_name, email, phone, category, location, cep, instagram, cpf, approved) VALUES
('Charles Ferreira', 'charles@email.com', '11999999999', 'tatuador', 'São Paulo, SP', '01310-100', '@charlesferreira', '123.456.789-00', true),
('Dr. Ana Silva', 'ana@email.com', '11888888888', 'dentista', 'Rio de Janeiro, RJ', '20040-020', '@dra.anasilva', '987.654.321-00', false);

INSERT INTO public.users (full_name, email, phone, referral_code) VALUES
('João Silva', 'joao@email.com', '11777777777', 'JOAO2024'),
('Maria Santos', 'maria@email.com', '11666666666', 'MARIA2024');

INSERT INTO public.influencers (full_name, email, phone, instagram, followers, approved) VALUES
('Influencer Top', 'influencer@email.com', '11555555555', '@influencertop', '100K', true);