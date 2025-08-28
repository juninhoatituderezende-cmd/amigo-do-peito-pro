-- Garantir que todos os planos tenham active = true por padrão
UPDATE planos_tatuador SET active = true WHERE active IS NULL;
UPDATE planos_dentista SET active = true WHERE active IS NULL;

-- Alterar os defaults das tabelas para garantir que novos planos sejam ativos
ALTER TABLE planos_tatuador ALTER COLUMN active SET DEFAULT true;
ALTER TABLE planos_dentista ALTER COLUMN active SET DEFAULT true;