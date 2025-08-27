-- ===== AUDITORIA E LIMPEZA DO BANCO DE DADOS =====

-- 1️⃣ REMOVER TABELAS DUPLICADAS/OBSOLETAS
-- Tabelas identificadas como não utilizadas (0 registros e sem uso no código ativo):

-- Tabela referrals: Substituída pelo sistema de referred_by na tabela profiles
DROP TABLE IF EXISTS referrals CASCADE;

-- Tabela user_purchases: Funcionalidade duplicada - marketplace_sales já faz esse controle  
DROP TABLE IF EXISTS user_purchases CASCADE;

-- Tabela pagamentos_participacao: Sistema de pagamento simplificado, não está sendo usado
DROP TABLE IF EXISTS pagamentos_participacao CASCADE;

-- Tabela services: Substituída pelas tabelas específicas (planos_tatuador, planos_dentista, etc.)
DROP TABLE IF EXISTS services CASCADE;

-- 2️⃣ MANTER TABELAS ATIVAS E FUNCIONAIS
-- As seguintes tabelas serão mantidas por estarem em uso ativo:

-- CORE SYSTEM (Usuários e Perfis)
-- ✅ profiles - Perfis de usuários (ATIVA - 5+ registros)
-- ✅ user_credits - Saldos de créditos (ATIVA - 5 registros)

-- MLM SYSTEM (Sistema de Grupos)  
-- ✅ custom_plans - Planos customizados antigos (MANTER para migração)
-- ✅ plan_groups - Grupos MLM (ATIVA - estrutura funcional)
-- ✅ group_participants - Participantes dos grupos (ATIVA - estrutura funcional)

-- NEW PLAN SYSTEM (Planos Separados por Categoria)
-- ✅ planos_tatuador - Planos de tatuagem (NOVA - recém criada)
-- ✅ planos_dentista - Planos odontológicos (NOVA - recém criada)

-- MARKETPLACE SYSTEM
-- ✅ products - Produtos do marketplace (ATIVA - 4 registros)
-- ✅ marketplace_sales - Vendas realizadas (ATIVA - 8 registros)
-- ✅ product_categories - Categorias de produtos (FUNCIONAL)

-- FINANCIAL SYSTEM
-- ✅ credit_transactions - Transações financeiras (ATIVA - 3 registros)
-- ✅ payment_splits - Divisão de pagamentos (FUNCIONAL)
-- ✅ payment_split_rules - Regras de divisão (4 registros - ATIVA)
-- ✅ withdrawal_requests - Solicitações de saque (FUNCIONAL)

-- INTEGRATION SYSTEM
-- ✅ asaas_integration - Integração Asaas (FUNCIONAL)
-- ✅ asaas_subaccounts - Subcontas Asaas (FUNCIONAL)

-- NOTIFICATION SYSTEM
-- ✅ notification_triggers - Sistema de notificações (FUNCIONAL)

-- SCHEDULING SYSTEM (em desenvolvimento)
-- ✅ agendamentos - Sistema de agendamento (ESTRUTURA PRONTA)

-- 3️⃣ COMENTÁRIO DE AUDITORIA
-- Esta limpeza remove 4 tabelas obsoletas/duplicadas:
-- - referrals (substituída por profiles.referred_by)
-- - user_purchases (duplicada - marketplace_sales faz o mesmo)
-- - pagamentos_participacao (não utilizada)
-- - services (substituída pelas tabelas específicas de planos)

-- 4️⃣ RESULTADO: 18 tabelas ativas e organizadas por função
-- Sistema mais limpo, organizado e sem duplicações