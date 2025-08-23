-- Primeiro, criar a tabela product_categories se ela não existir
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Atualizar a tabela products para suportar os dois tipos de marketplace
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'consumer' CHECK (target_audience IN ('professional', 'consumer', 'both'));

-- Adicionar campo para link externo (dropshipping)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Adicionar campo para URL da imagem
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Adicionar campo para indicar se é destaque
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Adicionar campo para controle de estoque (opcional, -1 = ilimitado)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT -1;

-- Inserir as categorias
INSERT INTO product_categories (name, description) VALUES 
('tatuagem', 'Produtos e serviços relacionados a tatuagem'),
('cabelo-barba', 'Produtos e serviços para cabelo e barba'),
('implante-dentario', 'Produtos e serviços de implante dentário'),
('cirurgia-plastica', 'Produtos e serviços de cirurgia plástica'),
('harmonizacao-facial', 'Produtos e serviços de harmonização facial'),
('insumos-tecnicos', 'Insumos técnicos para profissionais'),
('materiais-consumo', 'Materiais de consumo para profissionais'),
('equipamentos', 'Equipamentos profissionais'),
('cursos-treinamentos', 'Cursos e treinamentos profissionais'),
('produtos-gerais', 'Produtos gerais'),
('servicos-profissionais', 'Serviços profissionais'),
('produtos-digitais', 'Produtos digitais'),
('cursos-online', 'Cursos online'),
('consultoria', 'Consultoria'),
('eventos', 'Eventos'),
('outros', 'Outros')
ON CONFLICT (name) DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_target_audience ON products(target_audience);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- Habilitar RLS na tabela de categorias
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos vejam as categorias
CREATE POLICY "Anyone can view categories" ON product_categories
FOR SELECT USING (true);

-- Apenas admins podem gerenciar categorias
CREATE POLICY "Admins can manage categories" ON product_categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);