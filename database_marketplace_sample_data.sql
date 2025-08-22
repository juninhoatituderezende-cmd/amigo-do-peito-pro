-- Inserir produtos de exemplo no marketplace
INSERT INTO marketplace_products (
  name, 
  description, 
  category, 
  valor_total, 
  percentual_entrada, 
  image_url, 
  ativo, 
  approved, 
  target_audience,
  created_by
) VALUES 
(
  'Curso de Marketing Digital',
  'Aprenda as melhores estratégias de marketing digital para seu negócio. Conteúdo prático e atualizado com as últimas tendências do mercado.',
  'cursos-online',
  497.00,
  20.0,
  'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=500',
  true,
  true,
  'user',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Consultoria em Gestão Empresarial',
  'Consultoria personalizada para otimizar processos e aumentar a eficiência da sua empresa.',
  'consultoria',
  1500.00,
  30.0,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
  true,
  true,
  'both',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Kit de Ferramentas Profissionais',
  'Kit completo com as melhores ferramentas para profissionais da área técnica.',
  'insumos-tecnicos',
  299.00,
  15.0,
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500',
  true,
  true,
  'professional',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'E-book: Guia Completo de Vendas',
  'Manual completo com estratégias comprovadas para aumentar suas vendas.',
  'produtos-digitais',
  97.00,
  100.0,
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
  true,
  true,
  'user',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Workshop de Produtividade',
  'Evento presencial para aprender técnicas avançadas de produtividade pessoal e profissional.',
  'eventos',
  350.00,
  25.0,
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500',
  true,
  true,
  'both',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Software de Gestão Comercial',
  'Solução completa para gestão de vendas, clientes e relatórios financeiros.',
  'produtos-digitais',
  890.00,
  40.0,
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500',
  true,
  true,
  'professional',
  (SELECT id FROM auth.users LIMIT 1)
);