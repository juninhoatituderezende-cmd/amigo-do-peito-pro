-- Create asaas_integration table to store API keys and settings
CREATE TABLE IF NOT EXISTS public.asaas_integration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_encrypted TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add asaas_product_id to products and custom_plans tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS asaas_product_id TEXT;
ALTER TABLE public.custom_plans ADD COLUMN IF NOT EXISTS asaas_product_id TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_asaas_id ON public.products(asaas_product_id);
CREATE INDEX IF NOT EXISTS idx_custom_plans_asaas_id ON public.custom_plans(asaas_product_id);

-- Enable RLS
ALTER TABLE public.asaas_integration ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for asaas_integration
CREATE POLICY "Admins can manage asaas integration" 
ON public.asaas_integration 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create function to update timestamps
CREATE TRIGGER update_asaas_integration_updated_at
BEFORE UPDATE ON public.asaas_integration
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();