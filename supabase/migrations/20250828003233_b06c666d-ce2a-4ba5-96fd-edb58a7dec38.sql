-- Verificar e criar bucket para imagens de planos se não existir
INSERT INTO storage.buckets (id, name, public)
SELECT 'plan-images', 'plan-images', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'plan-images'
);

-- Política para visualizar imagens de planos
DROP POLICY IF EXISTS "Anyone can view plan images" ON storage.objects;
CREATE POLICY "Anyone can view plan images"
ON storage.objects FOR SELECT
USING (bucket_id = 'plan-images');

-- Política para upload de imagens de planos (admin)
DROP POLICY IF EXISTS "Admins can upload plan images" ON storage.objects;
CREATE POLICY "Admins can upload plan images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'plan-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para atualizar imagens de planos (admin)
DROP POLICY IF EXISTS "Admins can update plan images" ON storage.objects;
CREATE POLICY "Admins can update plan images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'plan-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);