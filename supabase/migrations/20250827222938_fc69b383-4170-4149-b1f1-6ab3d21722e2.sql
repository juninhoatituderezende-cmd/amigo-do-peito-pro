-- Adicionar campo de imagem à tabela custom_plans se não existir
ALTER TABLE custom_plans ADD COLUMN IF NOT EXISTS image_url text;

-- Criar bucket para imagens de planos se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('plan-images', 'plan-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de storage para imagens de planos
CREATE POLICY "Anyone can view plan images" ON storage.objects
FOR SELECT USING (bucket_id = 'plan-images');

CREATE POLICY "Admins can upload plan images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'plan-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update plan images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'plan-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete plan images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'plan-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);