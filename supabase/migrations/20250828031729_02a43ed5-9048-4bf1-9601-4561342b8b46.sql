-- Limpar todos os produtos fictícios/demo e manter apenas os produtos reais cadastrados
-- Esta query irá remover todos os produtos criados antes de hoje, mantendo apenas os produtos reais

-- Remover todos os produtos fictícios/de demonstração
-- (mantendo apenas produtos realmente cadastrados pelo admin)
DELETE FROM products 
WHERE created_at < '2025-08-23 00:00:00'::timestamp
OR name ILIKE '%demo%' 
OR name ILIKE '%teste%'
OR name ILIKE '%exemplo%'
OR description ILIKE '%demonstração%'
OR description ILIKE '%exemplo%';