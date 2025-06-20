-- MINI PRIMA DATABASE SEEDING SCRIPT (WORKING VERSION)
-- Comprehensive test data for E2E testing with realistic Brazilian legal practice data
-- This version uses the CORRECT column names from the actual database schema

-- =============================================================================
-- IMPORTANT NOTES
-- =============================================================================
-- 1. Create Supabase Auth users FIRST using the Supabase Dashboard or API
-- 2. Then update the admin_users table manually with real auth.users IDs
-- 3. This script uses the CORRECT column names: staff.full_name (not "name")
-- 4. All other data will be created successfully

-- Authentication users to create in Supabase Dashboard:
-- Email: admin@davilareisadvogados.com.br (Password: TestAdmin123!)
-- Email: lawyer1@davilareisadvogados.com.br (Password: TestLawyer123!)
-- Email: lawyer2@davilareisadvogados.com.br (Password: TestLawyer123!)
-- Email: staff1@davilareisadvogados.com.br (Password: TestStaff123!)
-- Email: client1@empresa.com.br (Password: TestClient123!)
-- Email: client2@corporacao.com.br (Password: TestClient123!)
-- Email: client3@startup.com.br (Password: TestClient123!)

-- =============================================================================
-- ADMIN USERS (MANUAL STEP REQUIRED)
-- =============================================================================
-- After creating Supabase auth users, run this manually with real user IDs:
-- 
-- INSERT INTO admin_users (user_id, role, permissions, is_active) VALUES
-- ('your-real-auth-user-id-1', 'admin', 
--  '["all_access", "user_management", "billing_management", "system_settings"]'::jsonb, true),
-- ('your-real-auth-user-id-2', 'admin', 
--  '["case_management", "billing_management", "client_management"]'::jsonb, true);

-- =============================================================================
-- STAFF MEMBERS (USING CORRECT COLUMN NAME: full_name)
-- =============================================================================
INSERT INTO staff (id, full_name, email, role, specialization, hourly_rate, oab_number, is_active, permissions, created_at) VALUES
(gen_random_uuid(), 'Dr. Carlos Eduardo Santos', 'lawyer1@davilareisadvogados.com.br', 'senior_lawyer', 'Direito Trabalhista', 250.00, 'OAB/SP 123456', true, 
 '["case_management", "client_access", "billing_access", "document_management"]'::jsonb, NOW()),
(gen_random_uuid(), 'Dra. Marina Oliveira', 'lawyer2@davilareisadvogados.com.br', 'lawyer', 'Direito Civil', 180.00, 'OAB/SP 234567', true,
 '["case_management", "client_access", "document_management"]'::jsonb, NOW()),
(gen_random_uuid(), 'Rafael Costa', 'staff1@davilareisadvogados.com.br', 'paralegal', 'Suporte Jurídico', 80.00, null, true,
 '["document_management", "client_support"]'::jsonb, NOW()),
(gen_random_uuid(), 'Patricia Lima', 'secretary@davilareisadvogados.com.br', 'secretary', 'Administração', 60.00, null, true,
 '["scheduling", "document_management"]'::jsonb, NOW());

-- =============================================================================
-- CLIENTS (COMPANIES)
-- =============================================================================
INSERT INTO clients (id, company_name, cnpj, email, phone, address, contact_person, 
                    subscription_status, portal_access, created_at, approved_at, status) VALUES
('11111111-1111-1111-1111-111111111111', 'TechStart Soluções Ltda', '12.345.678/0001-90', 'client1@empresa.com.br', 
 '(11) 99999-1111', 'Av. Paulista, 1000 - São Paulo/SP', 'João Silva', 'professional', true, NOW(), NOW(), 'approved'),
('22222222-2222-2222-2222-222222222222', 'Corporação Industrial S.A.', '23.456.789/0001-01', 'client2@corporacao.com.br', 
 '(11) 88888-2222', 'Rua Augusta, 500 - São Paulo/SP', 'Maria Santos', 'enterprise', true, NOW(), NOW(), 'approved'),
('33333333-3333-3333-3333-333333333333', 'Startup Inovação Ltda', '34.567.890/0001-12', 'client3@startup.com.br', 
 '(11) 77777-3333', 'Vila Madalena, 200 - São Paulo/SP', 'Pedro Costa', 'basic', true, NOW(), NOW(), 'approved'),
('44444444-4444-4444-4444-444444444444', 'Comércio & Varejo Ltda', '45.678.901/0001-23', 'contato@comercio.com.br', 
 '(11) 66666-4444', 'Centro, 300 - São Paulo/SP', 'Ana Oliveira', null, false, NOW(), null, 'pending'),
('55555555-5555-5555-5555-555555555555', 'Serviços Profissionais ME', '56.789.012/0001-34', 'info@servicos.com.br', 
 '(11) 55555-5555', 'Moema, 150 - São Paulo/SP', 'Carlos Lima', 'basic', true, NOW(), NOW(), 'approved');

-- =============================================================================
-- SUBSCRIPTION PLANS
-- =============================================================================
INSERT INTO subscription_plans (id, name, description, price, billing_cycle, features, is_active, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Básico', 'Consultoria jurídica básica mensal', 899.00, 'monthly',
 '["5 consultas/mês", "Análise de contratos", "Suporte por email"]'::jsonb, true, NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Profissional', 'Solução completa para empresas', 1899.00, 'monthly',
 '["15 consultas/mês", "Análise ilimitada", "Suporte prioritário", "WhatsApp direto"]'::jsonb, true, NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Empresarial', 'Para grandes corporações', 3499.00, 'monthly',
 '["Consultas ilimitadas", "Advogado dedicado", "SLA 2h", "Compliance empresarial"]'::jsonb, true, NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Anual Básico', 'Plano básico com desconto anual', 8990.00, 'yearly',
 '["5 consultas/mês", "Análise de contratos", "Suporte por email", "2 meses grátis"]'::jsonb, true, NOW());

-- =============================================================================
-- CLIENT SUBSCRIPTIONS
-- =============================================================================
INSERT INTO client_subscriptions (id, client_id, plan_id, start_date, end_date, status, 
                                 monthly_usage, quota_limit, auto_renew, created_at) VALUES
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'active', 2, 5, true, NOW()),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'active', 8, 15, true, NOW()),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'active', 25, 999, true, NOW());

-- =============================================================================
-- CASES (LEGAL MATTERS) - USING CORRECT COLUMN NAME: full_name for staff lookups
-- =============================================================================
INSERT INTO cases (id, client_id, case_number, title, description, case_type, status, 
                  priority, assigned_lawyer_id, estimated_value, success_fee_percentage,
                  billing_type, hourly_rate, created_at, updated_at) VALUES
-- Case 1: TechStart - Labor Law
('case0001-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'CASO-2025-001', 'Rescisão Contratual Trabalhista', 
 'Ação de rescisão indireta por descumprimento de obrigações trabalhistas do empregador.',
 'trabalhista', 'active', 'high',
 (SELECT id FROM staff WHERE full_name LIKE 'Dr. Carlos%' LIMIT 1),
 25000.00, 20.0, 'hourly', 250.00, NOW() - INTERVAL '15 days', NOW()),

-- Case 2: Corporação - Corporate Law
('case0002-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
 'CASO-2025-002', 'Revisão Contratual Fornecedores',
 'Análise e revisão de contratos com fornecedores internacionais.',
 'empresarial', 'active', 'medium',
 (SELECT id FROM staff WHERE full_name LIKE 'Dra. Marina%' LIMIT 1),
 150000.00, 15.0, 'fixed_fee', 0, NOW() - INTERVAL '8 days', NOW()),

-- Case 3: Startup - Corporate Law (Completed)
('case0003-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
 'CASO-2025-003', 'Constituição Societária',
 'Assessoria para alteração do contrato social e entrada de novos sócios investidores.',
 'empresarial', 'completed', 'medium',
 (SELECT id FROM staff WHERE full_name LIKE 'Dra. Marina%' LIMIT 1),
 50000.00, 10.0, 'fixed_fee', 0, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),

-- Case 4: TechStart - Regulatory
('case0004-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'CASO-2025-004', 'Defesa Administrativa CADE',
 'Defesa em processo administrativo no CADE por prática anticoncorrencial.',
 'regulatorio', 'active', 'high',
 (SELECT id FROM staff WHERE full_name LIKE 'Dr. Carlos%' LIMIT 1),
 500000.00, 25.0, 'percentage', 0, NOW() - INTERVAL '20 days', NOW()),

-- Case 5: Corporação - Labor Law (Critical)
('case0005-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
 'CASO-2025-005', 'Litígio Trabalhista Coletivo',
 'Defesa em ação civil pública trabalhista movida pelo Ministério Público.',
 'trabalhista', 'active', 'critical',
 (SELECT id FROM staff WHERE full_name LIKE 'Dr. Carlos%' LIMIT 1),
 1200000.00, 30.0, 'hybrid', 200.00, NOW() - INTERVAL '45 days', NOW());

-- =============================================================================
-- DOCUMENTS
-- =============================================================================
INSERT INTO documents (id, case_id, client_id, title, description, document_type, 
                      file_url, file_size, uploaded_by, is_confidential, created_at) VALUES
-- Case 1 Documents
(gen_random_uuid(), 'case0001-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'Contrato de Trabalho', 'Contrato de trabalho original do empregado',
 'contract', '/documents/caso-001/contrato-trabalho.pdf', 245760,
 (SELECT id FROM staff WHERE full_name LIKE 'Dr. Carlos%' LIMIT 1), true, NOW() - INTERVAL '14 days'),

(gen_random_uuid(), 'case0001-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'Recibos de Pagamento', 'Histórico de recibos salariais dos últimos 12 meses',
 'evidence', '/documents/caso-001/recibos-pagamento.pdf', 1024000,
 (SELECT id FROM staff WHERE full_name LIKE 'Dr. Carlos%' LIMIT 1), true, NOW() - INTERVAL '12 days'),

-- Case 2 Documents
(gen_random_uuid(), 'case0002-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
 'Contratos Fornecedores', 'Contratos atuais com fornecedores para revisão',
 'contract', '/documents/caso-002/contratos-fornecedores.pdf', 2048000,
 (SELECT id FROM staff WHERE full_name LIKE 'Dra. Marina%' LIMIT 1), false, NOW() - INTERVAL '7 days'),

-- Case 3 Documents  
(gen_random_uuid(), 'case0003-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
 'Contrato Social Atual', 'Última versão do contrato social registrada na Junta Comercial',
 'legal_document', '/documents/caso-003/contrato-social.pdf', 512000,
 (SELECT id FROM staff WHERE full_name LIKE 'Dra. Marina%' LIMIT 1), false, NOW() - INTERVAL '25 days'),

(gen_random_uuid(), 'case0003-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
 'Termo de Investimento', 'Acordo de investimento com os novos sócios',
 'contract', '/documents/caso-003/termo-investimento.pdf', 768000,
 (SELECT id FROM staff WHERE full_name LIKE 'Dra. Marina%' LIMIT 1), true, NOW() - INTERVAL '20 days');

-- =============================================================================
-- STAFF CLIENT ASSIGNMENTS
-- =============================================================================
INSERT INTO staff_client_assignments (id, staff_id, client_id, assignment_type, assigned_date, is_active) VALUES
-- Dr. Carlos assignments
(gen_random_uuid(),
 (SELECT id FROM staff WHERE full_name LIKE 'Dr. Carlos%'),
 '11111111-1111-1111-1111-111111111111',
 'primary', CURRENT_DATE, true),

(gen_random_uuid(),
 (SELECT id FROM staff WHERE full_name LIKE 'Dr. Carlos%'),
 '22222222-2222-2222-2222-222222222222',
 'primary', CURRENT_DATE, true),

-- Dra. Marina assignments
(gen_random_uuid(),
 (SELECT id FROM staff WHERE full_name LIKE 'Dra. Marina%'),
 '33333333-3333-3333-3333-333333333333',
 'primary', CURRENT_DATE, true),

(gen_random_uuid(),
 (SELECT id FROM staff WHERE full_name LIKE 'Dra. Marina%'),
 '22222222-2222-2222-2222-222222222222',
 'secondary', CURRENT_DATE, true),

-- Rafael (paralegal) support
(gen_random_uuid(),
 (SELECT id FROM staff WHERE full_name = 'Rafael Costa'),
 '11111111-1111-1111-1111-111111111111',
 'support', CURRENT_DATE, true);

-- =============================================================================
-- FINANCIAL DATA - SUPPLIERS
-- =============================================================================
INSERT INTO suppliers (id, name, contact_name, email, phone, address, tax_id, 
                      payment_terms, notifications_enabled, is_active, created_at) VALUES
('supplier1-1111-1111-1111-111111111111', 'Escritório Virtual Premium', 'Sandra Martins', 'contato@escritoriovirtual.com.br',
 '(11) 3333-4444', 'Av. Faria Lima, 1500 - São Paulo/SP', '11.222.333/0001-44', 30, true, true, NOW()),
('supplier2-2222-2222-2222-222222222222', 'TI Solutions Ltda', 'Roberto Silva', 'suporte@tisolutions.com.br',
 '(11) 4444-5555', 'Rua Teodoro Sampaio, 800 - São Paulo/SP', '22.333.444/0001-55', 15, true, true, NOW()),
('supplier3-3333-3333-3333-333333333333', 'Contabilidade D&A', 'Ana Contadora', 'ana@contabilidadeda.com.br',
 '(11) 5555-6666', 'Vila Olímpia, 600 - São Paulo/SP', '33.444.555/0001-66', 10, true, true, NOW()),
('supplier4-4444-4444-4444-444444444444', 'Segurança Empresarial', 'Carlos Segurança', 'carlos@segurancaemp.com.br',
 '(11) 6666-7777', 'Brooklin, 400 - São Paulo/SP', '44.555.666/0001-77', 30, true, true, NOW());

-- =============================================================================
-- EXPENSE CATEGORIES
-- =============================================================================
INSERT INTO expense_categories (id, name, description, is_active) VALUES
('expense1-1111-1111-1111-111111111111', 'Aluguel e Condomínio', 'Despesas com locação do escritório', true),
('expense2-2222-2222-2222-222222222222', 'Tecnologia e Software', 'Licenças de software, hardware, internet', true),
('expense3-3333-3333-3333-333333333333', 'Serviços Contábeis', 'Honorários contábeis e fiscais', true),
('expense4-4444-4444-4444-444444444444', 'Segurança e Limpeza', 'Serviços de segurança e limpeza', true),
('expense5-5555-5555-5555-555555555555', 'Marketing e Publicidade', 'Despesas com marketing jurídico', true),
('expense6-6666-6666-6666-666666666666', 'Deslocamentos', 'Viagens, combustível, estacionamento', true),
('expense7-7777-7777-7777-777777777777', 'Material de Escritório', 'Papelaria, suprimentos diversos', true);

-- =============================================================================
-- BILLS (ACCOUNTS PAYABLE)
-- =============================================================================
INSERT INTO bills (id, supplier_id, category_id, bill_number, description, amount, 
                  due_date, status, payment_type, created_by, created_at) VALUES
-- Escritório Virtual - Aluguel
('bill0001-1111-1111-1111-111111111111', 'supplier1-1111-1111-1111-111111111111', 'expense1-1111-1111-1111-111111111111',
 'EV-2025-001', 'Aluguel escritório Janeiro 2025', 8500.00,
 CURRENT_DATE + INTERVAL '5 days', 'pending', 'one_time',
 (SELECT id FROM staff WHERE role = 'paralegal' LIMIT 1), NOW()),

-- TI Solutions - Software
('bill0002-2222-2222-2222-222222222222', 'supplier2-2222-2222-2222-222222222222', 'expense2-2222-2222-2222-222222222222',
 'TI-2025-002', 'Licenças software jurídico - Janeiro', 2200.00,
 CURRENT_DATE + INTERVAL '10 days', 'pending', 'recurring',
 (SELECT id FROM staff WHERE role = 'paralegal' LIMIT 1), NOW()),

-- Contabilidade - Paid
('bill0003-3333-3333-3333-333333333333', 'supplier3-3333-3333-3333-333333333333', 'expense3-3333-3333-3333-333333333333',
 'DA-2024-012', 'Honorários contábeis Dezembro 2024', 1800.00,
 CURRENT_DATE - INTERVAL '5 days', 'paid', 'one_time',
 (SELECT id FROM staff WHERE role = 'paralegal' LIMIT 1), NOW() - INTERVAL '15 days'),

-- Segurança - Overdue
('bill0004-4444-4444-4444-444444444444', 'supplier4-4444-4444-4444-444444444444', 'expense4-4444-4444-4444-444444444444',
 'SE-2024-011', 'Serviços segurança Novembro 2024', 1200.00,
 CURRENT_DATE - INTERVAL '15 days', 'overdue', 'one_time',
 (SELECT id FROM staff WHERE role = 'paralegal' LIMIT 1), NOW() - INTERVAL '30 days');

-- =============================================================================
-- INVOICES (ACCOUNTS RECEIVABLE)
-- =============================================================================
INSERT INTO invoices (id, client_id, case_id, invoice_number, description, amount,
                     due_date, status, created_by, created_at) VALUES
-- TechStart - Pending Invoice  
('invoice1-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'case0001-1111-1111-1111-111111111111',
 'FAT-2025-001', 'Honorários advocatícios - Rescisão Trabalhista (40h)', 10000.00,
 CURRENT_DATE + INTERVAL '30 days', 'sent',
 (SELECT id FROM staff WHERE role IN ('senior_lawyer', 'lawyer') LIMIT 1), NOW()),

-- Corporação - Paid Invoice
('invoice2-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'case0002-2222-2222-2222-222222222222',
 'FAT-2025-002', 'Honorários advocatícios - Revisão Contratos', 15000.00,
 CURRENT_DATE - INTERVAL '5 days', 'paid',
 (SELECT id FROM staff WHERE role IN ('senior_lawyer', 'lawyer') LIMIT 1), NOW() - INTERVAL '35 days'),

-- Startup - Completed case (Paid)
('invoice3-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'case0003-3333-3333-3333-333333333333',
 'FAT-2024-015', 'Honorários advocatícios - Constituição Societária', 15000.00,
 CURRENT_DATE - INTERVAL '10 days', 'paid',
 (SELECT id FROM staff WHERE role IN ('senior_lawyer', 'lawyer') LIMIT 1), NOW() - INTERVAL '40 days');

-- =============================================================================
-- PAYMENT RECORDS
-- =============================================================================
INSERT INTO payments (id, type, reference_id, amount, payment_date, payment_method,
                     reference_number, created_by, created_at) VALUES
-- Payment for Corporação invoice
(gen_random_uuid(), 'receivable', 'invoice2-2222-2222-2222-222222222222',
 15000.00, CURRENT_DATE - INTERVAL '3 days', 'bank_transfer',
 'PAG-2025-001', (SELECT id FROM staff WHERE role = 'paralegal' LIMIT 1),
 NOW() - INTERVAL '3 days'),

-- Payment for Startup invoice  
(gen_random_uuid(), 'receivable', 'invoice3-3333-3333-3333-333333333333',
 15000.00, CURRENT_DATE - INTERVAL '8 days', 'pix',
 'PAG-2024-025', (SELECT id FROM staff WHERE role = 'paralegal' LIMIT 1),
 NOW() - INTERVAL '8 days'),

-- Payment for Contabilidade bill
(gen_random_uuid(), 'payable', 'bill0003-3333-3333-3333-333333333333',
 1800.00, CURRENT_DATE - INTERVAL '2 days', 'pix',
 'PAG-2025-002', (SELECT id FROM staff WHERE role = 'paralegal' LIMIT 1),
 NOW() - INTERVAL '2 days');

-- =============================================================================
-- TIME TRACKING DATA
-- =============================================================================
INSERT INTO time_entries (id, staff_id, case_id, description, hours_worked, 
                         hourly_rate, total_amount, entry_date, status, created_at) VALUES
-- Dr. Carlos entries
(gen_random_uuid(),
 (SELECT assigned_lawyer_id FROM cases WHERE case_number = 'CASO-2025-001'),
 'case0001-1111-1111-1111-111111111111',
 'Análise inicial do caso e estratégia jurídica', 4.5, 250.00, 1125.00,
 CURRENT_DATE - INTERVAL '3 days', 'approved', NOW() - INTERVAL '3 days'),

(gen_random_uuid(),
 (SELECT assigned_lawyer_id FROM cases WHERE case_number = 'CASO-2025-001'),
 'case0001-1111-1111-1111-111111111111',
 'Elaboração de petição inicial e juntada de documentos', 6.0, 250.00, 1500.00,
 CURRENT_DATE - INTERVAL '1 day', 'pending_approval', NOW() - INTERVAL '1 day'),

(gen_random_uuid(),
 (SELECT assigned_lawyer_id FROM cases WHERE case_number = 'CASO-2025-005'),
 'case0005-2222-2222-2222-222222222222',
 'Reunião com cliente e análise de documentação trabalhista', 3.0, 200.00, 600.00,
 CURRENT_DATE - INTERVAL '5 days', 'approved', NOW() - INTERVAL '5 days');

-- =============================================================================
-- PORTAL MESSAGES AND NOTIFICATIONS
-- =============================================================================
INSERT INTO portal_messages (id, sender_id, recipient_id, sender_type, recipient_type,
                            subject, message, is_read, created_at) VALUES
-- Client to Lawyer
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
 (SELECT id FROM staff WHERE full_name LIKE 'Dr. Carlos%'),
 'client', 'staff',
 'Dúvida sobre andamento do caso',
 'Dr. Carlos, gostaria de saber o andamento do processo trabalhista. Há previsão para a próxima audiência?',
 false, NOW() - INTERVAL '2 days'),

-- Lawyer to Client  
(gen_random_uuid(),
 (SELECT id FROM staff WHERE full_name LIKE 'Dr. Carlos%'),
 '11111111-1111-1111-1111-111111111111',
 'staff', 'client', 
 'Atualização do processo - CASO-2025-001',
 'Prezado João, informo que a citação foi realizada com sucesso. A contestação deve ser apresentada até 15 dias. Estamos preparando toda a documentação.',
 true, NOW() - INTERVAL '1 day'),

-- System notification
(gen_random_uuid(), gen_random_uuid(),
 '22222222-2222-2222-2222-222222222222',
 'system', 'client',
 'Novo documento disponível',
 'Um novo documento foi adicionado ao seu caso CASO-2025-002: Minutas dos contratos revisados.',
 false, NOW() - INTERVAL '6 hours');

-- Portal Notifications
INSERT INTO portal_notifications (id, user_id, user_type, title, message, 
                                 notification_type, is_read, created_at) VALUES
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
 'client', 'Prazo processual importante',
 'Atenção: Prazo para contestação expira em 10 dias. Caso CASO-2025-001.',
 'deadline_alert', false, NOW() - INTERVAL '5 hours'),

(gen_random_uuid(),
 (SELECT id FROM staff WHERE full_name LIKE 'Dr. Carlos%'),
 'staff', 'Nova mensagem de cliente',
 'Você recebeu uma nova mensagem de TechStart Soluções Ltda.',
 'message', true, NOW() - INTERVAL '2 days'),

(gen_random_uuid(), '22222222-2222-2222-2222-222222222222',
 'client', 'Fatura disponível',
 'Nova fatura disponível para pagamento: FAT-2025-002 - R$ 15.000,00',
 'billing', false, NOW() - INTERVAL '12 hours');

-- =============================================================================
-- SUBSCRIPTION USAGE TRACKING
-- =============================================================================
INSERT INTO subscription_usage (id, subscription_id, client_id, service_type, 
                               usage_count, usage_date, description, created_at) VALUES
-- TechStart usage (Basic plan)
(gen_random_uuid(),
 (SELECT id FROM client_subscriptions WHERE client_id = '11111111-1111-1111-1111-111111111111'),
 '11111111-1111-1111-1111-111111111111',
 'consultation', 2, CURRENT_DATE - INTERVAL '5 days',
 'Consultas sobre rescisão trabalhista e compliance', NOW()),

-- Corporação usage (Professional plan)  
(gen_random_uuid(),
 (SELECT id FROM client_subscriptions WHERE client_id = '22222222-2222-2222-2222-222222222222'),
 '22222222-2222-2222-2222-222222222222',
 'contract_review', 3, CURRENT_DATE - INTERVAL '3 days',
 'Revisão de contratos com fornecedores internacionais', NOW()),

-- Startup usage (Enterprise plan)
(gen_random_uuid(),
 (SELECT id FROM client_subscriptions WHERE client_id = '33333333-3333-3333-3333-333333333333'),
 '33333333-3333-3333-3333-333333333333',
 'consultation', 8, CURRENT_DATE - INTERVAL '1 day',
 'Consultoria intensiva para alteração societária', NOW());

-- =============================================================================
-- BRAZILIAN LEGAL COMPLIANCE DATA (if tables exist)
-- =============================================================================

-- Court Integrations (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'court_integrations') THEN
        INSERT INTO court_integrations (id, court_name, court_type, jurisdiction, api_endpoint, 
                                       is_active, last_sync, created_at) VALUES
        (gen_random_uuid(), 'TJSP - Tribunal de Justiça de São Paulo', 'estadual', 'São Paulo', 
         'https://www.tjsp.jus.br/api', true, NOW() - INTERVAL '1 hour', NOW()),
        (gen_random_uuid(), 'TRT 2ª Região - São Paulo', 'trabalhista', 'São Paulo', 
         'https://www.trt2.jus.br/api', true, NOW() - INTERVAL '2 hours', NOW()),
        (gen_random_uuid(), 'TRF 3ª Região', 'federal', 'São Paulo/Mato Grosso do Sul', 
         'https://www.trf3.jus.br/api', true, NOW() - INTERVAL '3 hours', NOW());
    END IF;
END $$;

-- Case Deadlines (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_deadlines') THEN
        INSERT INTO case_deadlines (id, case_id, deadline_type, description, due_date, 
                                   priority_level, court_id, notification_sent, created_at) VALUES
        (gen_random_uuid(), 'case0001-1111-1111-1111-111111111111',
         'contestacao', 'Prazo para apresentação de contestação', 
         CURRENT_DATE + INTERVAL '15 days', 'high',
         (SELECT id FROM court_integrations WHERE court_name LIKE 'TRT 2ª%' LIMIT 1),
         false, NOW()),

        (gen_random_uuid(), 'case0002-2222-2222-2222-222222222222',
         'recurso', 'Prazo para interposição de recurso', 
         CURRENT_DATE + INTERVAL '15 days', 'medium',
         (SELECT id FROM court_integrations WHERE court_name LIKE 'TJSP%' LIMIT 1),
         false, NOW()),

        (gen_random_uuid(), 'case0004-1111-1111-1111-111111111111',
         'defesa', 'Apresentação de defesa administrativa CADE', 
         CURRENT_DATE + INTERVAL '30 days', 'critical',
         null, false, NOW());
    END IF;
END $$;

-- OAB Compliance Checks (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oab_compliance_checks') THEN
        INSERT INTO oab_compliance_checks (id, staff_id, check_type, description, status, 
                                          compliance_score, last_checked, created_at) VALUES
        (gen_random_uuid(),
         (SELECT id FROM staff WHERE oab_number = 'OAB/SP 123456'),
         'anuidade', 'Verificação de anuidade 2025', 'compliant', 100,
         CURRENT_DATE - INTERVAL '30 days', NOW()),

        (gen_random_uuid(),
         (SELECT id FROM staff WHERE oab_number = 'OAB/SP 234567'),
         'educacao_continuada', 'Cursos de educação continuada obrigatórios', 'pending', 75,
         CURRENT_DATE - INTERVAL '15 days', NOW()),

        (gen_random_uuid(),
         (SELECT id FROM staff WHERE oab_number = 'OAB/SP 123456'),
         'conduta_profissional', 'Verificação de conduta profissional', 'compliant', 95,
         CURRENT_DATE - INTERVAL '7 days', NOW());
    END IF;
END $$;

-- Brazilian Holidays (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brazilian_holidays') THEN
        INSERT INTO brazilian_holidays (id, holiday_name, holiday_date, is_national, 
                                       state_uf, affects_deadlines, created_at) VALUES
        (gen_random_uuid(), 'Confraternização Universal', '2025-01-01', true, null, true, NOW()),
        (gen_random_uuid(), 'Tiradentes', '2025-04-21', true, null, true, NOW()),
        (gen_random_uuid(), 'Dia do Trabalhador', '2025-05-01', true, null, true, NOW()),
        (gen_random_uuid(), 'Independência do Brasil', '2025-09-07', true, null, true, NOW()),
        (gen_random_uuid(), 'Nossa Senhora Aparecida', '2025-10-12', true, null, true, NOW()),
        (gen_random_uuid(), 'Finados', '2025-11-02', true, null, true, NOW()),
        (gen_random_uuid(), 'Proclamação da República', '2025-11-15', true, null, true, NOW()),
        (gen_random_uuid(), 'Natal', '2025-12-25', true, null, true, NOW());
    END IF;
END $$;

-- Legal Templates (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legal_templates') THEN
        INSERT INTO legal_templates (id, template_name, category, description, variables, 
                                    content_preview, is_active, created_at) VALUES
        (gen_random_uuid(), 'Petição Inicial Trabalhista', 'trabalhista', 
         'Modelo padrão para petição inicial em ações trabalhistas',
         '["cliente_nome", "cliente_cpf", "empresa_reu", "empresa_cnpj", "valor_causa", "fatos", "pedidos"]'::jsonb,
         'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DO TRABALHO DA [vara_trabalho]...', true, NOW()),

        (gen_random_uuid(), 'Contestação Cível', 'civil', 
         'Modelo de contestação para ações cíveis', 
         '["cliente_nome", "autor_nome", "numero_processo", "argumentos_defesa", "provas"]'::jsonb,
         'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA [vara_civel]...', true, NOW()),

        (gen_random_uuid(), 'Contrato Social Simples', 'empresarial', 
         'Modelo básico de contrato social para empresas',
         '["empresa_nome", "socios", "capital_social", "objeto_social", "endereco"]'::jsonb,
         'CONTRATO SOCIAL DA [empresa_nome] LTDA...', true, NOW());
    END IF;
END $$;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'MINI PRIMA DATABASE SEEDING COMPLETED SUCCESSFULLY! (WORKING VERSION)';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'The following test data has been created:';
    RAISE NOTICE '• Staff Members: 4 (2 lawyers, 1 paralegal, 1 secretary) - FIXED COLUMN NAMES';
    RAISE NOTICE '• Clients: 5 companies (4 approved, 1 pending) with fixed UUIDs';
    RAISE NOTICE '• Cases: 5 legal matters (4 active, 1 completed)';
    RAISE NOTICE '• Documents: 5 case attachments';
    RAISE NOTICE '• Subscription Plans: 4 (basic, professional, enterprise, annual)';
    RAISE NOTICE '• Active Subscriptions: 3 client subscriptions';
    RAISE NOTICE '• Financial Records: 4 suppliers, 7 expense categories, 4 bills, 3 invoices';
    RAISE NOTICE '• Time Tracking: 3 time entries with approval workflow';
    RAISE NOTICE '• Portal Messages: 3 client-staff communications';
    RAISE NOTICE '• Notifications: 3 system notifications';
    RAISE NOTICE '• Usage Analytics: 3 subscription usage records';
    RAISE NOTICE '• Brazilian Legal: Optional tables (if they exist)';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'COLUMN NAME FIXES APPLIED:';
    RAISE NOTICE '• staff.name → staff.full_name ✅';
    RAISE NOTICE '• All staff lookups use full_name ✅';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'IMPORTANT NEXT STEPS:';
    RAISE NOTICE '1. Create Supabase Auth users with emails listed at top of file';
    RAISE NOTICE '2. Manually insert admin_users records with real auth.users IDs';
    RAISE NOTICE '3. Update client records with user_id if clients need portal access';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'DATABASE IS NOW READY FOR COMPREHENSIVE E2E TESTING!';
    RAISE NOTICE '=============================================================================';
END $$;