-- ============================================================================
-- COMPLETE DATABASE SETUP - MLM SYSTEM
-- Execute este arquivo para criar toda a estrutura do banco
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE user_role AS ENUM ('user', 'professional', 'admin', 'influencer');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE group_status AS ENUM ('forming', 'complete', 'contemplated', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('earned', 'spent', 'refund', 'withdrawal_request', 'withdrawal_completed');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    cpf TEXT UNIQUE,
    role user_role DEFAULT 'user',
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES profiles(id),
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Services table (produtos/serviços do marketplace)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace sales
CREATE TABLE IF NOT EXISTS marketplace_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    credits_used DECIMAL(10,2) DEFAULT 0,
    payment_id TEXT,
    status payment_status DEFAULT 'pending',
    referrer_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User credits system
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_credits DECIMAL(10,2) DEFAULT 0,
    available_credits DECIMAL(10,2) DEFAULT 0,
    pending_credits DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id TEXT,
    reference_table TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MLM SYSTEM TABLES
-- ============================================================================

-- Plan groups (grupos de 10 pessoas)
CREATE TABLE IF NOT EXISTS plan_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    group_number INTEGER NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    current_participants INTEGER DEFAULT 0,
    max_participants INTEGER DEFAULT 10,
    status group_status DEFAULT 'forming',
    winner_id UUID REFERENCES auth.users(id),
    contemplated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group participants
CREATE TABLE IF NOT EXISTS group_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES plan_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_paid DECIMAL(10,2) NOT NULL,
    referrer_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'active',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

-- Payment split rules
CREATE TABLE IF NOT EXISTS payment_split_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    professional_percentage INTEGER DEFAULT 70,
    platform_percentage INTEGER DEFAULT 20,
    referrer_percentage INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(service_id)
);

-- Payment splits (registro dos splits executados)
CREATE TABLE IF NOT EXISTS payment_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id TEXT NOT NULL,
    service_id UUID REFERENCES services(id),
    professional_id UUID REFERENCES profiles(id),
    referrer_id UUID REFERENCES profiles(id),
    total_amount DECIMAL(10,2) NOT NULL,
    professional_amount DECIMAL(10,2) NOT NULL,
    platform_amount DECIMAL(10,2) NOT NULL,
    referrer_amount DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'processed',
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ASAAS INTEGRATION
-- ============================================================================

-- Asaas subaccounts
CREATE TABLE IF NOT EXISTS asaas_subaccounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subaccount_id TEXT UNIQUE NOT NULL,
    wallet_id TEXT,
    access_token TEXT,
    account_number TEXT,
    agency TEXT,
    account_key TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Notification triggers
CREATE TABLE IF NOT EXISTS notification_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WITHDRAWAL SYSTEM
-- ============================================================================

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    method TEXT DEFAULT 'pix',
    pix_key TEXT,
    bank_account JSONB,
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_split_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_subaccounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE POLICIES
-- ============================================================================

-- PROFILES POLICIES
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SERVICES POLICIES  
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (active = true);
CREATE POLICY "Professionals can manage own services" ON services FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.id = services.professional_id)
);

-- MARKETPLACE SALES POLICIES
CREATE POLICY "Users can view own sales" ON marketplace_sales FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND (profiles.id = marketplace_sales.buyer_id OR profiles.id = marketplace_sales.seller_id))
);
CREATE POLICY "Users can create sales as buyers" ON marketplace_sales FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.id = marketplace_sales.buyer_id)
);

-- USER CREDITS POLICIES
CREATE POLICY "Users can view own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage credits" ON user_credits FOR ALL USING (auth.role() = 'service_role');

-- CREDIT TRANSACTIONS POLICIES
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage transactions" ON credit_transactions FOR ALL USING (auth.role() = 'service_role');

-- PLAN GROUPS POLICIES
CREATE POLICY "Anyone can view groups" ON plan_groups FOR SELECT USING (true);
CREATE POLICY "Service role can manage groups" ON plan_groups FOR ALL USING (auth.role() = 'service_role');

-- GROUP PARTICIPANTS POLICIES  
CREATE POLICY "Users can view own participations" ON group_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view participants count" ON group_participants FOR SELECT USING (true);
CREATE POLICY "Service role can manage participants" ON group_participants FOR ALL USING (auth.role() = 'service_role');

-- OTHER POLICIES
CREATE POLICY "Anyone can view split rules" ON payment_split_rules FOR SELECT USING (true);
CREATE POLICY "Service role can manage splits" ON payment_splits FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage subaccounts" ON asaas_subaccounts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view own notifications" ON notification_triggers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage notifications" ON notification_triggers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view own withdrawals" ON withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own withdrawals" ON withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage withdrawals" ON withdrawal_requests FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_services_professional_id ON services(professional_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sales_buyer_id ON marketplace_sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sales_seller_id ON marketplace_sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sales_payment_id ON marketplace_sales(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_groups_status ON plan_groups(status);
CREATE INDEX IF NOT EXISTS idx_group_participants_group_id ON group_participants(group_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user_id ON group_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_triggers_user_id ON notification_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_triggers_sent ON notification_triggers(sent);

-- ============================================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_sales_updated_at ON marketplace_sales;
CREATE TRIGGER update_marketplace_sales_updated_at BEFORE UPDATE ON marketplace_sales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_groups_updated_at ON plan_groups;
CREATE TRIGGER update_plan_groups_updated_at BEFORE UPDATE ON plan_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8))
  );
  
  -- Create initial credit balance
  INSERT INTO public.user_credits (user_id, total_credits, available_credits)
  VALUES (NEW.id, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();