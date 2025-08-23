-- Primeiro, vamos atualizar a tabela products para suportar os dois tipos de marketplace
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

-- Atualizar as categorias existentes para incluir as novas
INSERT INTO product_categories (name, description) VALUES 
('tatuagem', 'Produtos e serviços relacionados a tatuagem'),
('cabelo-barba', 'Produtos e serviços para cabelo e barba'),
('implante-dentario', 'Produtos e serviços de implante dentário'),
('cirurgia-plastica', 'Produtos e serviços de cirurgia plástica'),
('harmonizacao-facial', 'Produtos e serviços de harmonização facial'),
('insumos-tecnicos', 'Insumos técnicos para profissionais'),
('materiais-consumo', 'Materiais de consumo para profissionais'),
('equipamentos', 'Equipamentos profissionais'),
('cursos-treinamentos', 'Cursos e treinamentos profissionais')
ON CONFLICT (name) DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_target_audience ON products(target_audience);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);