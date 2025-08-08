-- Update marketplace structure to support the official application design
-- We need to distinguish between 3 types of products/plans:
-- 1. Service Plans (for users) - from custom_plans table
-- 2. User Marketplace Products (for users to buy)  
-- 3. Professional Marketplace Products (for professionals to buy)

-- Add 'target_audience' field to marketplace_products to distinguish user vs professional products
ALTER TABLE marketplace_products 
ADD COLUMN target_audience TEXT NOT NULL DEFAULT 'user' CHECK (target_audience IN ('user', 'professional'));

-- Add comment for clarity
COMMENT ON COLUMN marketplace_products.target_audience IS 'Defines whether this product is for users or professionals';

-- Update RLS policies to reflect that only admin manages products
DROP POLICY IF EXISTS "Professionals can create products" ON marketplace_products;
DROP POLICY IF EXISTS "Professionals can view their own products" ON marketplace_products;

-- Only admin can create/manage all marketplace products
CREATE POLICY "Only admins can create marketplace products" 
ON marketplace_products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Only admins can update marketplace products" 
ON marketplace_products 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Users can view products targeted for them (approved and active)
CREATE POLICY "Users can view products targeted for them" 
ON marketplace_products 
FOR SELECT 
USING (
  target_audience = 'user' AND approved = true AND ativo = true
);

-- Professionals can view products targeted for them (approved and active)
CREATE POLICY "Professionals can view products targeted for them" 
ON marketplace_products 
FOR SELECT 
USING (
  target_audience = 'professional' AND approved = true AND ativo = true
);

-- Update existing marketplace_products to be user-targeted by default
UPDATE marketplace_products SET target_audience = 'user' WHERE target_audience IS NULL;