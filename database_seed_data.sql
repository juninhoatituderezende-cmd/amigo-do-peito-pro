-- Seed data para testes do sistema MLM
-- Execute este script após configurar todas as tabelas principais

-- Limpar dados existentes (apenas em desenvolvimento)
DELETE FROM public.activity_logs;
DELETE FROM public.commissions;
DELETE FROM public.plan_participants;
DELETE FROM public.payments;
DELETE FROM public.custom_plans;
DELETE FROM public.profiles;

-- Criar usuários de teste
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@test.com', crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'pro@test.com', crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'influencer@test.com', crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'user@test.com', crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'user2@test.com', crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW());

-- Criar perfis
INSERT INTO public.profiles (id, email, full_name, role, phone, cpf, referral_code, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@test.com', 'Administrador Sistema', 'admin', '(11) 99999-0001', '111.111.111-11', 'ADMIN001', NOW()),
('22222222-2222-2222-2222-222222222222', 'pro@test.com', 'Dr. João Silva', 'professional', '(11) 99999-0002', '222.222.222-22', 'PRO001', NOW()),
('33333333-3333-3333-3333-333333333333', 'influencer@test.com', 'Maria Influencer', 'influencer', '(11) 99999-0003', '333.333.333-33', 'INF001', NOW()),
('44444444-4444-4444-4444-444444444444', 'user@test.com', 'Carlos Cliente', 'user', '(11) 99999-0004', '444.444.444-44', 'USER001', NOW()),
('55555555-5555-5555-5555-555555555555', 'user2@test.com', 'Ana Cliente', 'user', '(11) 99999-0005', '555.555.555-55', 'USER002', NOW());

-- Criar planos de teste
INSERT INTO public.custom_plans (
  id, 
  title, 
  description, 
  entry_value, 
  contemplation_value, 
  max_participants, 
  cycle_duration_months, 
  professional_id, 
  status, 
  created_at
) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fechamento de Braço', 'Cirurgia para fechamento de braço com acompanhamento completo', 400.00, 3600.00, 10, 6, '22222222-2222-2222-2222-222222222222', 'active', NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Prótese Dentária 10 Dentes', 'Prótese dentária completa com 10 dentes', 500.00, 4500.00, 9, 8, '22222222-2222-2222-2222-222222222222', 'active', NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Implante Capilar', 'Transplante capilar com técnica FUE', 800.00, 7200.00, 9, 10, '22222222-2222-2222-2222-222222222222', 'active', NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Cirurgia Plástica Facial', 'Rinoplastia e harmonização facial', 1200.00, 10800.00, 9, 12, '22222222-2222-2222-2222-222222222222', 'active', NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Tratamento Ortodôntico', 'Aparelho ortodôntico completo', 300.00, 2700.00, 9, 24, '22222222-2222-2222-2222-222222222222', 'active', NOW());

-- Criar participações em planos
INSERT INTO public.plan_participants (
  id,
  plan_id,
  user_id,
  payment_status,
  contemplated,
  entry_paid_at,
  created_at
) VALUES
('11111111-aaaa-aaaa-aaaa-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'paid', false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('22222222-bbbb-bbbb-bbbb-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'paid', false, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Criar pagamentos de teste
INSERT INTO public.payments (
  id,
  user_id,
  plan_id,
  amount,
  currency,
  status,
  payment_method,
  stripe_session_id,
  created_at
) VALUES
('pay11111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 400.00, 'BRL', 'paid', 'credit_card', 'cs_test_123456789', NOW() - INTERVAL '1 day'),
('pay22222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 500.00, 'BRL', 'paid', 'pix', NULL, NOW() - INTERVAL '2 days');

-- Criar comissões de teste
INSERT INTO public.commissions (
  id,
  influencer_id,
  plan_id,
  user_id,
  commission_amount,
  status,
  created_at
) VALUES
('com11111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 40.00, 'pending', NOW() - INTERVAL '1 day'),
('com22222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 50.00, 'pending', NOW() - INTERVAL '2 days');

-- Criar vouchers digitais de teste
INSERT INTO public.digital_vouchers (
  id,
  user_id,
  plan_id,
  voucher_code,
  qr_code_url,
  status,
  generated_at
) VALUES
('vouch111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VOUCHER-2024-001', 'https://api.qrserver.com/v1/create-qr-code/?data=VOUCHER-2024-001', 'active', NOW() - INTERVAL '1 day'),
('vouch222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'VOUCHER-2024-002', 'https://api.qrserver.com/v1/create-qr-code/?data=VOUCHER-2024-002', 'active', NOW() - INTERVAL '2 days');

-- Criar notificações de teste
INSERT INTO public.notifications (
  id,
  user_id,
  type,
  title,
  message,
  read,
  created_at
) VALUES
('notif111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'payment_confirmed', 'Pagamento Confirmado', 'Seu pagamento de R$ 400,00 foi confirmado com sucesso!', false, NOW() - INTERVAL '1 day'),
('notif222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'voucher_generated', 'Voucher Gerado', 'Seu voucher digital foi gerado. Código: VOUCHER-2024-002', false, NOW() - INTERVAL '2 days'),
('notif333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'commission_earned', 'Comissão Gerada', 'Você ganhou R$ 90,00 em comissões!', false, NOW() - INTERVAL '1 day');

-- Criar logs de atividade
INSERT INTO public.activity_logs (
  user_id,
  action,
  resource_type,
  resource_id,
  details,
  created_at
) VALUES
('44444444-4444-4444-4444-444444444444', 'user_registered', 'auth', '44444444-4444-4444-4444-444444444444', '{"plan_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', NOW() - INTERVAL '1 day'),
('44444444-4444-4444-4444-444444444444', 'payment_processed', 'payment', 'pay11111-1111-1111-1111-111111111111', '{"amount": 400.00, "method": "credit_card"}', NOW() - INTERVAL '1 day'),
('55555555-5555-5555-5555-555555555555', 'user_registered', 'auth', '55555555-5555-5555-5555-555555555555', '{"plan_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', NOW() - INTERVAL '2 days'),
('55555555-5555-5555-5555-555555555555', 'payment_processed', 'payment', 'pay22222-2222-2222-2222-222222222222', '{"amount": 500.00, "method": "pix"}', NOW() - INTERVAL '2 days');

-- Mostrar resumo dos dados criados
SELECT 'Dados de seed criados com sucesso!' as status;
SELECT 'Perfis criados: ' || COUNT(*) as profiles_count FROM public.profiles;
SELECT 'Planos criados: ' || COUNT(*) as plans_count FROM public.custom_plans;
SELECT 'Participações criadas: ' || COUNT(*) as participants_count FROM public.plan_participants;
SELECT 'Pagamentos criados: ' || COUNT(*) as payments_count FROM public.payments;
SELECT 'Comissões criadas: ' || COUNT(*) as commissions_count FROM public.commissions;