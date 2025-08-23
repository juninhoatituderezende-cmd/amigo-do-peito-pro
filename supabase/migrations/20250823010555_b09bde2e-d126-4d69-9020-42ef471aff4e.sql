-- Criar bucket para imagens de produtos se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir que todos vejam as imagens
CREATE POLICY "Public product images accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- Política para permitir upload de imagens por usuários autenticados
CREATE POLICY "Authenticated users upload product images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Política para permitir que usuários atualizem suas próprias imagens
CREATE POLICY "Users update own product images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Política para permitir que usuários deletem suas próprias imagens
CREATE POLICY "Users delete own product images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');