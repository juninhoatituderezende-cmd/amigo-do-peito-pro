-- Professional System Database Setup
-- This file contains the database structure for the professional dashboard system

-- Table for storing contemplations that are assigned to professionals
CREATE TABLE IF NOT EXISTS contemplations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'contemplated' CHECK (status IN ('contemplated', 'service_confirmed', 'completed')),
  service_confirmed BOOLEAN DEFAULT FALSE,
  before_photos TEXT[],
  after_photos TEXT[],
  confirmation_date TIMESTAMP WITH TIME ZONE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'released', 'paid')),
  service_value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for service history tracking
CREATE TABLE IF NOT EXISTS service_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  service_date TIMESTAMP WITH TIME ZONE NOT NULL,
  service_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'released', 'paid')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  before_photos TEXT[],
  after_photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for professional notifications
CREATE TABLE IF NOT EXISTS professional_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('contemplation', 'payment', 'review', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for professional ratings and reviews
CREATE TABLE IF NOT EXISTS professional_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  service_type TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update professionals table to include additional fields
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS specialty TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_services INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bank_data JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contemplations_professional_id ON contemplations(professional_id);
CREATE INDEX IF NOT EXISTS idx_contemplations_user_id ON contemplations(user_id);
CREATE INDEX IF NOT EXISTS idx_service_history_professional_id ON service_history(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_notifications_professional_id ON professional_notifications(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_professional_id ON professional_reviews(professional_id);

-- RLS Policies for contemplations
ALTER TABLE contemplations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contemplations" ON contemplations
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = professional_id);

CREATE POLICY "Professionals can update their contemplations" ON contemplations
  FOR UPDATE USING (auth.uid() = professional_id);

CREATE POLICY "System can insert contemplations" ON contemplations
  FOR INSERT WITH CHECK (true);

-- RLS Policies for service_history
ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their service history" ON service_history
  FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Professionals can insert their service history" ON service_history
  FOR INSERT WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals can update their service history" ON service_history
  FOR UPDATE USING (auth.uid() = professional_id);

-- RLS Policies for professional_notifications
ALTER TABLE professional_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their notifications" ON professional_notifications
  FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Professionals can update their notifications" ON professional_notifications
  FOR UPDATE USING (auth.uid() = professional_id);

CREATE POLICY "System can insert notifications" ON professional_notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for professional_reviews
ALTER TABLE professional_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view professional reviews" ON professional_reviews
  FOR SELECT USING (true);

CREATE POLICY "System can insert reviews" ON professional_reviews
  FOR INSERT WITH CHECK (true);

-- Function to update professional rating
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE professionals 
  SET rating = (
    SELECT AVG(rating)::DECIMAL(3,2)
    FROM professional_reviews 
    WHERE professional_id = NEW.professional_id
  )
  WHERE id = NEW.professional_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update rating when a new review is added
CREATE TRIGGER update_professional_rating_trigger
  AFTER INSERT ON professional_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_rating();

-- Function to update professional earnings
CREATE OR REPLACE FUNCTION update_professional_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    UPDATE professionals 
    SET 
      total_earnings = total_earnings + NEW.amount,
      total_services = total_services + 1
    WHERE id = NEW.professional_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update earnings when payment status changes
CREATE TRIGGER update_professional_earnings_trigger
  AFTER UPDATE ON service_history
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_earnings();