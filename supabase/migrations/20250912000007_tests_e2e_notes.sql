-- E2E Scenarios (manual notes / seed helpers)
-- 1) Webhook duplicado: inserir 2x em processed_payments deve violar unique e ignorar
-- 2) Corrida simultânea: usar join_group_membership para impedir overflow
-- 3) Sem ref: intended_leader_id NULL cria grupo próprio e membership líder
-- 4) Com ref: intended leader recebe membros até 10/10 e completa
-- 5) Divergência de amount vs entry_price: webhook retorna 422
-- 6) Fallback: intended leader sem grupo ativo → cria próprio

