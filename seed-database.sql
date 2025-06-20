-- MINI PRIMA DATABASE SEEDING SCRIPT
-- Comprehensive test data for E2E testing with realistic Brazilian legal practice data
-- Run this script against your Supabase database for full testing capabilities

-- =============================================================================
-- AUTHENTICATION USERS (Supabase Auth)
-- =============================================================================
-- Note: These users must be created through Supabase Auth interface or API
-- Email: admin@davilareisadvogados.com.br (Password: TestAdmin123!)
-- Email: lawyer1@davilareisadvogados.com.br (Password: TestLawyer123!)
-- Email: lawyer2@davilareisadvogados.com.br (Password: TestLawyer123!)
-- Email: staff1@davilareisadvogados.com.br (Password: TestStaff123!)
-- Email: client1@empresa.com.br (Password: TestClient123!)
-- Email: client2@corporacao.com.br (Password: TestClient123!)
-- Email: client3@startup.com.br (Password: TestClient123!)

-- =============================================================================
-- ADMIN USERS
-- =============================================================================
-- Note: These admin records reference Supabase auth users that must be created first
-- The user_id values below are examples - replace with actual auth.users IDs after creating users

-- Example admin user inserts (replace UUIDs with actual auth.users IDs):
-- INSERT INTO admin_users (user_id, role, permissions, is_active) VALUES
-- ('auth-user-uuid-for-admin', 'admin', 
--  '["all_access", "user_management", "billing_management", "system_settings"]'::jsonb, true),
-- ('auth-user-uuid-for-staff', 'admin', 
--  '["case_management", "billing_management", "client_management"]'::jsonb, true);

-- For testing purposes, we'll create placeholder records that can be updated later
INSERT INTO admin_users (user_id, role, permissions, is_active, created_at) VALUES
(gen_random_uuid(), 'admin', 
 '["all_access", "user_management", "billing_management", "system_settings"]'::jsonb, true, NOW()),
(gen_random_uuid(), 'admin', 
 '["case_management", "billing_management", "client_management"]'::jsonb, true, NOW());

-- =============================================================================
-- STAFF MEMBERS
-- =============================================================================
INSERT INTO staff (id, name, email, role, specialization, hourly_rate, oab_number, is_active, permissions, created_at) VALUES
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
(gen_random_uuid(), 'TechStart Soluções Ltda', '12.345.678/0001-90', 'client1@empresa.com.br', 
 '(11) 99999-1111', 'Av. Paulista, 1000 - São Paulo/SP', 'João Silva', 'professional', true, NOW(), NOW(), 'approved'),
(gen_random_uuid(), 'Corporação Industrial S.A.', '23.456.789/0001-01', 'client2@corporacao.com.br', 
 '(11) 88888-2222', 'Rua Augusta, 500 - São Paulo/SP', 'Maria Santos', 'enterprise', true, NOW(), NOW(), 'approved'),
(gen_random_uuid(), 'Startup Inovação Ltda', '34.567.890/0001-12', 'client3@startup.com.br', 
 '(11) 77777-3333', 'Vila Madalena, 200 - São Paulo/SP', 'Pedro Costa', 'basic', true, NOW(), NOW(), 'approved'),
(gen_random_uuid(), 'Comércio & Varejo Ltda', '45.678.901/0001-23', 'contato@comercio.com.br', 
 '(11) 66666-4444', 'Centro, 300 - São Paulo/SP', 'Ana Oliveira', null, false, NOW(), null, 'pending'),
(gen_random_uuid(), 'Serviços Profissionais ME', '56.789.012/0001-34', 'info@servicos.com.br', 
 '(11) 55555-5555', 'Moema, 150 - São Paulo/SP', 'Carlos Lima', 'basic', true, NOW(), NOW(), 'approved');

-- =============================================================================
-- SUBSCRIPTION PLANS
-- =============================================================================
INSERT INTO subscription_plans (id, name, description, price, billing_cycle, features, is_active, created_at) VALUES
(gen_random_uuid(), 'Básico', 'Consultoria jurídica básica mensal', 899.00, 'monthly',
 '["5 consultas/mês", "Análise de contratos", "Suporte por email"]'::jsonb, true, NOW()),
(gen_random_uuid(), 'Profissional', 'Solução completa para empresas', 1899.00, 'monthly',
 '["15 consultas/mês", "Análise ilimitada", "Suporte prioritário", "WhatsApp direto"]'::jsonb, true, NOW()),
(gen_random_uuid(), 'Empresarial', 'Para grandes corporações', 3499.00, 'monthly',
 '["Consultas ilimitadas", "Advogado dedicado", "SLA 2h", "Compliance empresarial"]'::jsonb, true, NOW()),
(gen_random_uuid(), 'Anual Básico', 'Plano básico com desconto anual', 8990.00, 'yearly',
 '["5 consultas/mês", "Análise de contratos", "Suporte por email", "2 meses grátis"]'::jsonb, true, NOW());

-- =============================================================================
-- CLIENT SUBSCRIPTIONS
-- =============================================================================
WITH client_ids AS (
  SELECT id, company_name FROM clients WHERE status = 'approved' LIMIT 3
),
plan_ids AS (
  SELECT id, name FROM subscription_plans WHERE name IN ('Básico', 'Profissional', 'Empresarial')
)
INSERT INTO client_subscriptions (id, client_id, plan_id, start_date, end_date, status, 
                                 monthly_usage, quota_limit, auto_renew, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  p.id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 month',
  'active',
  CASE 
    WHEN p.name = 'Básico' THEN 2
    WHEN p.name = 'Profissional' THEN 8
    ELSE 25
  END,
  CASE 
    WHEN p.name = 'Básico' THEN 5
    WHEN p.name = 'Profissional' THEN 15
    ELSE 999
  END,
  true,
  NOW()
FROM (SELECT id, company_name, ROW_NUMBER() OVER () as rn FROM client_ids) c
JOIN (SELECT id, name, ROW_NUMBER() OVER () as rn FROM plan_ids) p ON c.rn = p.rn;

-- =============================================================================
-- CASES (LEGAL MATTERS)
-- =============================================================================
WITH client_data AS (
  SELECT id, company_name FROM clients WHERE status = 'approved' LIMIT 5
),
staff_data AS (
  SELECT id, name FROM staff WHERE role IN ('senior_lawyer', 'lawyer') LIMIT 2
)
INSERT INTO cases (id, client_id, case_number, title, description, case_type, status, 
                  priority, assigned_lawyer_id, estimated_value, success_fee_percentage,
                  billing_type, hourly_rate, created_at, updated_at) VALUES
-- TechStart Cases
((SELECT id FROM client_data WHERE company_name = 'TechStart Soluções Ltda'), 
 (SELECT id FROM client_data WHERE company_name = 'TechStart Soluções Ltda'),
 'CASO-2025-001', 'Rescisão Contratual Trabalhista', 
 'Ação de rescisão indireta por descumprimento de obrigações trabalhistas do empregador.',
 'trabalhista', 'active', 'high',
 (SELECT id FROM staff_data WHERE name LIKE 'Dr. Carlos%' LIMIT 1),
 25000.00, 20.0, 'hourly', 250.00, NOW() - INTERVAL '15 days', NOW()),

-- Corporação Cases  
((SELECT id FROM client_data WHERE company_name = 'Corporação Industrial S.A.'),
 (SELECT id FROM client_data WHERE company_name = 'Corporação Industrial S.A.'),
 'CASO-2025-002', 'Revisão Contratual Fornecedores',
 'Análise e revisão de contratos com fornecedores internacionais.',
 'empresarial', 'active', 'medium',
 (SELECT id FROM staff_data WHERE name LIKE 'Dra. Marina%' LIMIT 1),
 150000.00, 15.0, 'fixed_fee', 0, NOW() - INTERVAL '8 days', NOW()),

-- Startup Cases
((SELECT id FROM client_data WHERE company_name = 'Startup Inovação Ltda'),
 (SELECT id FROM client_data WHERE company_name = 'Startup Inovação Ltda'),
 'CASO-2025-003', 'Constituição Societária',
 'Assessoria para alteração do contrato social e entrada de novos sócios investidores.',
 'empresarial', 'completed', 'medium',
 (SELECT id FROM staff_data WHERE name LIKE 'Dra. Marina%' LIMIT 1),
 50000.00, 10.0, 'fixed_fee', 0, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),

-- Additional Cases
((SELECT id FROM client_data WHERE company_name = 'TechStart Soluções Ltda'),
 (SELECT id FROM client_data WHERE company_name = 'TechStart Soluções Ltda'),
 'CASO-2025-004', 'Defesa Administrativa CADE',
 'Defesa em processo administrativo no CADE por prática anticoncorrencial.',
 'regulatorio', 'active', 'high',
 (SELECT id FROM staff_data WHERE name LIKE 'Dr. Carlos%' LIMIT 1),
 500000.00, 25.0, 'percentage', 0, NOW() - INTERVAL '20 days', NOW()),

((SELECT id FROM client_data WHERE company_name = 'Corporação Industrial S.A.'),
 (SELECT id FROM client_data WHERE company_name = 'Corporação Industrial S.A.'),
 'CASO-2025-005', 'Litígio Trabalhista Coletivo',
 'Defesa em ação civil pública trabalhista movida pelo Ministério Público.',
 'trabalhista', 'active', 'critical',
 (SELECT id FROM staff_data WHERE name LIKE 'Dr. Carlos%' LIMIT 1),
 1200000.00, 30.0, 'hybrid', 200.00, NOW() - INTERVAL '45 days', NOW());

-- =============================================================================
-- DOCUMENTS
-- =============================================================================
WITH case_data AS (
  SELECT id, case_number FROM cases LIMIT 5
)
INSERT INTO documents (id, case_id, client_id, title, description, document_type, 
                      file_url, file_size, uploaded_by, is_confidential, created_at) VALUES
-- Case 1 Documents
((SELECT id FROM case_data WHERE case_number = 'CASO-2025-001'),
 (SELECT client_id FROM cases WHERE case_number = 'CASO-2025-001'),
 'Contrato de Trabalho', 'Contrato de trabalho original do empregado',
 'contract', '/documents/caso-001/contrato-trabalho.pdf', 245760,
 (SELECT id FROM staff WHERE name LIKE 'Dr. Carlos%' LIMIT 1), true, NOW() - INTERVAL '14 days'),

((SELECT id FROM case_data WHERE case_number = 'CASO-2025-001'),
 (SELECT client_id FROM cases WHERE case_number = 'CASO-2025-001'),
 'Recibos de Pagamento', 'Histórico de recibos salariais dos últimos 12 meses',
 'evidence', '/documents/caso-001/recibos-pagamento.pdf', 1024000,
 (SELECT id FROM staff WHERE name LIKE 'Dr. Carlos%' LIMIT 1), true, NOW() - INTERVAL '12 days'),

-- Case 2 Documents
((SELECT id FROM case_data WHERE case_number = 'CASO-2025-002'),
 (SELECT client_id FROM cases WHERE case_number = 'CASO-2025-002'),
 'Contratos Fornecedores', 'Contratos atuais com fornecedores para revisão',
 'contract', '/documents/caso-002/contratos-fornecedores.pdf', 2048000,
 (SELECT id FROM staff WHERE name LIKE 'Dra. Marina%' LIMIT 1), false, NOW() - INTERVAL '7 days'),

-- Case 3 Documents  
((SELECT id FROM case_data WHERE case_number = 'CASO-2025-003'),
 (SELECT client_id FROM cases WHERE case_number = 'CASO-2025-003'),
 'Contrato Social Atual', 'Última versão do contrato social registrada na Junta Comercial',
 'legal_document', '/documents/caso-003/contrato-social.pdf', 512000,
 (SELECT id FROM staff WHERE name LIKE 'Dra. Marina%' LIMIT 1), false, NOW() - INTERVAL '25 days'),

((SELECT id FROM case_data WHERE case_number = 'CASO-2025-003'),
 (SELECT client_id FROM cases WHERE case_number = 'CASO-2025-003'),
 'Termo de Investimento', 'Acordo de investimento com os novos sócios',
 'contract', '/documents/caso-003/termo-investimento.pdf', 768000,
 (SELECT id FROM staff WHERE name LIKE 'Dra. Marina%' LIMIT 1), true, NOW() - INTERVAL '20 days');

-- =============================================================================
-- STAFF CLIENT ASSIGNMENTS
-- =============================================================================
WITH assignments AS (
  SELECT 
    s.id as staff_id,
    c.id as client_id,
    CASE 
      WHEN s.name LIKE 'Dr. Carlos%' THEN 'primary'
      WHEN s.name LIKE 'Dra. Marina%' THEN 'secondary'
      ELSE 'support'
    END as assignment_type
  FROM staff s
  CROSS JOIN clients c
  WHERE s.role IN ('senior_lawyer', 'lawyer', 'paralegal') 
    AND c.status = 'approved'
    AND (
      (s.name LIKE 'Dr. Carlos%' AND c.company_name IN ('TechStart Soluções Ltda', 'Corporação Industrial S.A.'))
      OR (s.name LIKE 'Dra. Marina%' AND c.company_name IN ('Startup Inovação Ltda', 'Corporação Industrial S.A.'))
      OR (s.name LIKE 'Rafael%' AND c.company_name = 'TechStart Soluções Ltda')
    )
)
INSERT INTO staff_client_assignments (id, staff_id, client_id, assignment_type, assigned_date, is_active)
SELECT gen_random_uuid(), staff_id, client_id, assignment_type, CURRENT_DATE, true
FROM assignments;

-- =============================================================================
-- FINANCIAL DATA - SUPPLIERS
-- =============================================================================
INSERT INTO suppliers (id, name, contact_name, email, phone, address, tax_id, 
                      payment_terms, notifications_enabled, is_active, created_at) VALUES
(gen_random_uuid(), 'Escritório Virtual Premium', 'Sandra Martins', 'contato@escritoriovirtual.com.br',
 '(11) 3333-4444', 'Av. Faria Lima, 1500 - São Paulo/SP', '11.222.333/0001-44', 30, true, true, NOW()),
(gen_random_uuid(), 'TI Solutions Ltda', 'Roberto Silva', 'suporte@tisolutions.com.br',
 '(11) 4444-5555', 'Rua Teodoro Sampaio, 800 - São Paulo/SP', '22.333.444/0001-55', 15, true, true, NOW()),
(gen_random_uuid(), 'Contabilidade D&A', 'Ana Contadora', 'ana@contabilidadeda.com.br',
 '(11) 5555-6666', 'Vila Olímpia, 600 - São Paulo/SP', '33.444.555/0001-66', 10, true, true, NOW()),
(gen_random_uuid(), 'Segurança Empresarial', 'Carlos Segurança', 'carlos@segurancaemp.com.br',
 '(11) 6666-7777', 'Brooklin, 400 - São Paulo/SP', '44.555.666/0001-77', 30, true, true, NOW());

-- =============================================================================
-- EXPENSE CATEGORIES
-- =============================================================================
INSERT INTO expense_categories (id, name, description, is_active) VALUES
(gen_random_uuid(), 'Aluguel e Condomínio', 'Despesas com locação do escritório', true),
(gen_random_uuid(), 'Tecnologia e Software', 'Licenças de software, hardware, internet', true),
(gen_random_uuid(), 'Serviços Contábeis', 'Honorários contábeis e fiscais', true),
(gen_random_uuid(), 'Segurança e Limpeza', 'Serviços de segurança e limpeza', true),
(gen_random_uuid(), 'Marketing e Publicidade', 'Despesas com marketing jurídico', true),
(gen_random_uuid(), 'Deslocamentos', 'Viagens, combustível, estacionamento', true),
(gen_random_uuid(), 'Material de Escritório', 'Papelaria, suprimentos diversos', true);

-- =============================================================================
-- BILLS (ACCOUNTS PAYABLE)
-- =============================================================================
WITH supplier_data AS (
  SELECT id, name FROM suppliers
),
category_data AS (
  SELECT id, name FROM expense_categories
),
staff_data AS (
  SELECT id FROM staff WHERE role = 'paralegal' LIMIT 1
)
INSERT INTO bills (id, supplier_id, category_id, bill_number, description, amount, 
                  due_date, status, payment_type, created_by, created_at) VALUES
-- Escritório Virtual - Aluguel
(gen_random_uuid(),
 (SELECT id FROM supplier_data WHERE name = 'Escritório Virtual Premium'),
 (SELECT id FROM category_data WHERE name = 'Aluguel e Condomínio'),
 'EV-2025-001', 'Aluguel escritório Janeiro 2025', 8500.00,
 CURRENT_DATE + INTERVAL '5 days', 'pending', 'one_time',
 (SELECT id FROM staff_data), NOW()),

-- TI Solutions - Software
(gen_random_uuid(),
 (SELECT id FROM supplier_data WHERE name = 'TI Solutions Ltda'),
 (SELECT id FROM category_data WHERE name = 'Tecnologia e Software'),
 'TI-2025-002', 'Licenças software jurídico - Janeiro', 2200.00,
 CURRENT_DATE + INTERVAL '10 days', 'pending', 'recurring',
 (SELECT id FROM staff_data), NOW()),

-- Contabilidade - Paid
(gen_random_uuid(),
 (SELECT id FROM supplier_data WHERE name = 'Contabilidade D&A'),
 (SELECT id FROM category_data WHERE name = 'Serviços Contábeis'),
 'DA-2024-012', 'Honorários contábeis Dezembro 2024', 1800.00,
 CURRENT_DATE - INTERVAL '5 days', 'paid', 'one_time',
 (SELECT id FROM staff_data), NOW() - INTERVAL '15 days'),

-- Segurança - Overdue
(gen_random_uuid(),
 (SELECT id FROM supplier_data WHERE name = 'Segurança Empresarial'),
 (SELECT id FROM category_data WHERE name = 'Segurança e Limpeza'),
 'SE-2024-011', 'Serviços segurança Novembro 2024', 1200.00,
 CURRENT_DATE - INTERVAL '15 days', 'overdue', 'one_time',
 (SELECT id FROM staff_data), NOW() - INTERVAL '30 days');

-- =============================================================================
-- INVOICES (ACCOUNTS RECEIVABLE)
-- =============================================================================
WITH case_billing AS (
  SELECT 
    c.id as case_id,
    c.client_id,
    c.case_number,
    CASE c.billing_type
      WHEN 'hourly' THEN c.hourly_rate * 40 -- 40 hours
      WHEN 'fixed_fee' THEN 15000.00
      WHEN 'percentage' THEN c.estimated_value * 0.1
      ELSE 25000.00
    END as amount,
    c.billing_type
  FROM cases c 
  WHERE c.status IN ('active', 'completed')
),
staff_data AS (
  SELECT id FROM staff WHERE role IN ('senior_lawyer', 'lawyer') LIMIT 1
)
INSERT INTO invoices (id, client_id, case_id, invoice_number, description, amount,
                     due_date, status, created_by, created_at) VALUES
-- TechStart - Paid Invoice  
(gen_random_uuid(),
 (SELECT client_id FROM case_billing WHERE case_number = 'CASO-2025-001'),
 (SELECT case_id FROM case_billing WHERE case_number = 'CASO-2025-001'),
 'FAT-2025-001', 'Honorários advocatícios - Rescisão Trabalhista (40h)',
 (SELECT amount FROM case_billing WHERE case_number = 'CASO-2025-001'),
 CURRENT_DATE + INTERVAL '30 days', 'sent',
 (SELECT id FROM staff_data), NOW()),

-- Corporação - Paid Invoice
(gen_random_uuid(),
 (SELECT client_id FROM case_billing WHERE case_number = 'CASO-2025-002'),
 (SELECT case_id FROM case_billing WHERE case_number = 'CASO-2025-002'),
 'FAT-2025-002', 'Honorários advocatícios - Revisão Contratos (Taxa Fixa)',
 (SELECT amount FROM case_billing WHERE case_number = 'CASO-2025-002'),
 CURRENT_DATE - INTERVAL '5 days', 'paid',
 (SELECT id FROM staff_data), NOW() - INTERVAL '35 days'),

-- Startup - Completed case
(gen_random_uuid(),
 (SELECT client_id FROM case_billing WHERE case_number = 'CASO-2025-003'),
 (SELECT case_id FROM case_billing WHERE case_number = 'CASO-2025-003'),
 'FAT-2024-015', 'Honorários advocatícios - Constituição Societária (Concluído)',
 (SELECT amount FROM case_billing WHERE case_number = 'CASO-2025-003'),
 CURRENT_DATE - INTERVAL '10 days', 'paid',
 (SELECT id FROM staff_data), NOW() - INTERVAL '40 days');

-- =============================================================================
-- PAYMENT RECORDS
-- =============================================================================
WITH payment_data AS (
  SELECT 
    i.id as invoice_id,
    i.amount,
    'receivable' as type,
    i.client_id as payer_id
  FROM invoices i 
  WHERE i.status = 'paid'
  UNION ALL
  SELECT 
    b.id as bill_id,
    b.amount,
    'payable' as type,
    b.supplier_id as payer_id
  FROM bills b 
  WHERE b.status = 'paid'
),
staff_data AS (
  SELECT id FROM staff WHERE role = 'paralegal' LIMIT 1
)
INSERT INTO payments (id, type, reference_id, amount, payment_date, payment_method,
                     reference_number, created_by, created_at)
SELECT 
  gen_random_uuid(),
  type,
  invoice_id,
  amount,
  CURRENT_DATE - INTERVAL '3 days',
  CASE type 
    WHEN 'receivable' THEN 'bank_transfer'
    ELSE 'pix'
  END,
  'PAG-' || TO_CHAR(NOW(), 'YYYY-MM-DD-') || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  (SELECT id FROM staff_data),
  NOW() - INTERVAL '3 days'
FROM payment_data;

-- =============================================================================
-- TIME TRACKING DATA
-- =============================================================================
WITH time_data AS (
  SELECT 
    c.id as case_id,
    c.assigned_lawyer_id as staff_id,
    c.hourly_rate
  FROM cases c 
  WHERE c.status = 'active' AND c.billing_type IN ('hourly', 'hybrid')
)
INSERT INTO time_entries (id, staff_id, case_id, description, hours_worked, 
                         hourly_rate, total_amount, entry_date, status, created_at) VALUES
-- Dr. Carlos entries
(gen_random_uuid(),
 (SELECT staff_id FROM time_data WHERE case_id = (SELECT id FROM cases WHERE case_number = 'CASO-2025-001')),
 (SELECT case_id FROM time_data WHERE case_id = (SELECT id FROM cases WHERE case_number = 'CASO-2025-001')),
 'Análise inicial do caso e estratégia jurídica', 4.5, 250.00, 1125.00,
 CURRENT_DATE - INTERVAL '3 days', 'approved', NOW() - INTERVAL '3 days'),

(gen_random_uuid(),
 (SELECT staff_id FROM time_data WHERE case_id = (SELECT id FROM cases WHERE case_number = 'CASO-2025-001')),
 (SELECT case_id FROM time_data WHERE case_id = (SELECT id FROM cases WHERE case_number = 'CASO-2025-001')),
 'Elaboração de petição inicial e juntada de documentos', 6.0, 250.00, 1500.00,
 CURRENT_DATE - INTERVAL '1 day', 'pending_approval', NOW() - INTERVAL '1 day'),

(gen_random_uuid(),
 (SELECT staff_id FROM time_data WHERE case_id = (SELECT id FROM cases WHERE case_number = 'CASO-2025-005')),
 (SELECT case_id FROM time_data WHERE case_id = (SELECT id FROM cases WHERE case_number = 'CASO-2025-005')),
 'Reunião com cliente e análise de documentação trabalhista', 3.0, 200.00, 600.00,
 CURRENT_DATE - INTERVAL '5 days', 'approved', NOW() - INTERVAL '5 days');

-- =============================================================================
-- BRAZILIAN LEGAL COMPLIANCE DATA
-- =============================================================================

-- Court Integrations
INSERT INTO court_integrations (id, court_name, court_type, jurisdiction, api_endpoint, 
                               is_active, last_sync, created_at) VALUES
(gen_random_uuid(), 'TJSP - Tribunal de Justiça de São Paulo', 'estadual', 'São Paulo', 
 'https://www.tjsp.jus.br/api', true, NOW() - INTERVAL '1 hour', NOW()),
(gen_random_uuid(), 'TRT 2ª Região - São Paulo', 'trabalhista', 'São Paulo', 
 'https://www.trt2.jus.br/api', true, NOW() - INTERVAL '2 hours', NOW()),
(gen_random_uuid(), 'TRF 3ª Região', 'federal', 'São Paulo/Mato Grosso do Sul', 
 'https://www.trf3.jus.br/api', true, NOW() - INTERVAL '3 hours', NOW());

-- Case Deadlines with Brazilian Legal Calendar
INSERT INTO case_deadlines (id, case_id, deadline_type, description, due_date, 
                           priority_level, court_id, notification_sent, created_at) VALUES
(gen_random_uuid(),
 (SELECT id FROM cases WHERE case_number = 'CASO-2025-001'),
 'contestacao', 'Prazo para apresentação de contestação', 
 CURRENT_DATE + INTERVAL '15 days', 'high',
 (SELECT id FROM court_integrations WHERE court_name LIKE 'TRT 2ª%' LIMIT 1),
 false, NOW()),

(gen_random_uuid(),
 (SELECT id FROM cases WHERE case_number = 'CASO-2025-002'),
 'recurso', 'Prazo para interposição de recurso', 
 CURRENT_DATE + INTERVAL '15 days', 'medium',
 (SELECT id FROM court_integrations WHERE court_name LIKE 'TJSP%' LIMIT 1),
 false, NOW()),

(gen_random_uuid(),
 (SELECT id FROM cases WHERE case_number = 'CASO-2025-004'),
 'defesa', 'Apresentação de defesa administrativa CADE', 
 CURRENT_DATE + INTERVAL '30 days', 'critical',
 null, false, NOW());

-- OAB Compliance Checks
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

-- Case Workflow Phases
INSERT INTO case_workflow_phases (id, case_id, phase_name, description, status, 
                                 expected_duration_days, started_at, created_at) VALUES
(gen_random_uuid(),
 (SELECT id FROM cases WHERE case_number = 'CASO-2025-001'),
 'peticion_inicial', 'Elaboração e protocolo da petição inicial', 'completed', 7,
 NOW() - INTERVAL '15 days', NOW()),

(gen_random_uuid(),
 (SELECT id FROM cases WHERE case_number = 'CASO-2025-001'),
 'citacao', 'Aguardando citação da parte ré', 'in_progress', 30,
 NOW() - INTERVAL '8 days', NOW()),

(gen_random_uuid(),
 (SELECT id FROM cases WHERE case_number = 'CASO-2025-002'),
 'analise_contratos', 'Análise detalhada dos contratos atuais', 'completed', 14,
 NOW() - INTERVAL '8 days', NOW()),

(gen_random_uuid(),
 (SELECT id FROM cases WHERE case_number = 'CASO-2025-002'),
 'elaboracao_revisao', 'Elaboração de minutas revisadas', 'in_progress', 21,
 NOW() - INTERVAL '3 days', NOW());

-- Brazilian Holidays
INSERT INTO brazilian_holidays (id, holiday_name, holiday_date, is_national, 
                               state_uf, affects_deadlines, created_at) VALUES
(gen_random_uuid(), 'Confraternização Universal', '2025-01-01', true, null, true, NOW()),
(gen_random_uuid(), 'Tiradentes', '2025-04-21', true, null, true, NOW()),
(gen_random_uuid(), 'Dia do Trabalhador', '2025-05-01', true, null, true, NOW()),
(gen_random_uuid(), 'Independência do Brasil', '2025-09-07', true, null, true, NOW()),
(gen_random_uuid(), 'Nossa Senhora Aparecida', '2025-10-12', true, null, true, NOW()),
(gen_random_uuid(), 'Finados', '2025-11-02', true, null, true, NOW()),
(gen_random_uuid(), 'Proclamação da República', '2025-11-15', true, null, true, NOW()),
(gen_random_uuid(), 'Natal', '2025-12-25', true, null, true, NOW()),
(gen_random_uuid(), 'Consciência Negra', '2025-11-20', false, 'SP', true, NOW()),
(gen_random_uuid(), 'São Jorge', '2025-04-23', false, 'RJ', true, NOW());

-- Legal Templates
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

-- =============================================================================
-- PORTAL MESSAGES AND NOTIFICATIONS
-- =============================================================================
WITH messaging_data AS (
  SELECT 
    c.id as client_id,
    s.id as staff_id,
    c.company_name
  FROM clients c
  JOIN staff_client_assignments sca ON sca.client_id = c.id
  JOIN staff s ON s.id = sca.staff_id
  WHERE c.status = 'approved' AND sca.is_active = true
  LIMIT 5
)
INSERT INTO portal_messages (id, sender_id, recipient_id, sender_type, recipient_type,
                            subject, message, is_read, created_at) VALUES
-- Client to Lawyer
(gen_random_uuid(),
 (SELECT client_id FROM messaging_data WHERE company_name = 'TechStart Soluções Ltda' LIMIT 1),
 (SELECT staff_id FROM messaging_data WHERE company_name = 'TechStart Soluções Ltda' LIMIT 1),
 'client', 'staff',
 'Dúvida sobre andamento do caso',
 'Dr. Carlos, gostaria de saber o andamento do processo trabalhista. Há previsão para a próxima audiência?',
 false, NOW() - INTERVAL '2 days'),

-- Lawyer to Client  
(gen_random_uuid(),
 (SELECT staff_id FROM messaging_data WHERE company_name = 'TechStart Soluções Ltda' LIMIT 1),
 (SELECT client_id FROM messaging_data WHERE company_name = 'TechStart Soluções Ltda' LIMIT 1),
 'staff', 'client', 
 'Atualização do processo - CASO-2025-001',
 'Prezado João, informo que a citação foi realizada com sucesso. A contestação deve ser apresentada até 15 dias. Estamos preparando toda a documentação.',
 true, NOW() - INTERVAL '1 day'),

-- System notification
(gen_random_uuid(),
 gen_random_uuid(), -- system
 (SELECT client_id FROM messaging_data WHERE company_name = 'Corporação Industrial S.A.' LIMIT 1),
 'system', 'client',
 'Novo documento disponível',
 'Um novo documento foi adicionado ao seu caso CASO-2025-002: Minutas dos contratos revisados.',
 false, NOW() - INTERVAL '6 hours');

-- Portal Notifications
INSERT INTO portal_notifications (id, user_id, user_type, title, message, 
                                 notification_type, is_read, created_at) VALUES
(gen_random_uuid(),
 (SELECT client_id FROM messaging_data WHERE company_name = 'TechStart Soluções Ltda' LIMIT 1),
 'client', 'Prazo processual importante',
 'Atenção: Prazo para contestação expira em 10 dias. Caso CASO-2025-001.',
 'deadline_alert', false, NOW() - INTERVAL '5 hours'),

(gen_random_uuid(),
 (SELECT staff_id FROM messaging_data WHERE company_name = 'TechStart Soluções Ltda' LIMIT 1),
 'staff', 'Nova mensagem de cliente',
 'Você recebeu uma nova mensagem de TechStart Soluções Ltda.',
 'message', true, NOW() - INTERVAL '2 days'),

(gen_random_uuid(),
 (SELECT client_id FROM messaging_data WHERE company_name = 'Corporação Industrial S.A.' LIMIT 1),
 'client', 'Fatura disponível',
 'Nova fatura disponível para pagamento: FAT-2025-002 - R$ 15.000,00',
 'billing', false, NOW() - INTERVAL '12 hours');

-- =============================================================================
-- SUBSCRIPTION USAGE TRACKING
-- =============================================================================
WITH usage_data AS (
  SELECT 
    cs.id as subscription_id,
    cs.client_id,
    sp.name as plan_name
  FROM client_subscriptions cs
  JOIN subscription_plans sp ON sp.id = cs.plan_id
  WHERE cs.status = 'active'
)
INSERT INTO subscription_usage (id, subscription_id, client_id, service_type, 
                               usage_count, usage_date, description, created_at) VALUES
-- TechStart usage (Básico plan)
(gen_random_uuid(),
 (SELECT subscription_id FROM usage_data WHERE plan_name = 'Básico' LIMIT 1),
 (SELECT client_id FROM usage_data WHERE plan_name = 'Básico' LIMIT 1),
 'consultation', 2, CURRENT_DATE - INTERVAL '5 days',
 'Consultas sobre rescisão trabalhista e compliance', NOW()),

-- Corporação usage (Profissional plan)  
(gen_random_uuid(),
 (SELECT subscription_id FROM usage_data WHERE plan_name = 'Profissional' LIMIT 1),
 (SELECT client_id FROM usage_data WHERE plan_name = 'Profissional' LIMIT 1),
 'contract_review', 3, CURRENT_DATE - INTERVAL '3 days',
 'Revisão de contratos com fornecedores internacionais', NOW()),

-- Startup usage (Empresarial plan)
(gen_random_uuid(),
 (SELECT subscription_id FROM usage_data WHERE plan_name = 'Empresarial' LIMIT 1),
 (SELECT client_id FROM usage_data WHERE plan_name = 'Empresarial' LIMIT 1),
 'consultation', 8, CURRENT_DATE - INTERVAL '1 day',
 'Consultoria intensiva para alteração societária', NOW());

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'MINI PRIMA DATABASE SEEDING COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'The following test data has been created:';
    RAISE NOTICE '• Admin Users: 2 (super_admin, admin)';
    RAISE NOTICE '• Staff Members: 4 (2 lawyers, 1 paralegal, 1 secretary)';
    RAISE NOTICE '• Clients: 5 companies (4 approved, 1 pending)';
    RAISE NOTICE '• Cases: 5 legal matters (4 active, 1 completed)';
    RAISE NOTICE '• Documents: 5 case attachments';
    RAISE NOTICE '• Subscription Plans: 4 (basic, professional, enterprise, annual)';
    RAISE NOTICE '• Active Subscriptions: 3 client subscriptions';
    RAISE NOTICE '• Financial Records: 4 suppliers, 7 expense categories, 4 bills, 3 invoices';
    RAISE NOTICE '• Time Tracking: 3 time entries with approval workflow';
    RAISE NOTICE '• Brazilian Legal: Court integrations, deadlines, OAB compliance, templates';
    RAISE NOTICE '• Communications: Portal messages and notifications';
    RAISE NOTICE '• Usage Analytics: Subscription usage tracking';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'AUTHENTICATION USERS TO CREATE IN SUPABASE:';
    RAISE NOTICE '• admin@davilareisadvogados.com.br (Password: TestAdmin123!)';
    RAISE NOTICE '• lawyer1@davilareisadvogados.com.br (Password: TestLawyer123!)';
    RAISE NOTICE '• lawyer2@davilareisadvogados.com.br (Password: TestLawyer123!)';
    RAISE NOTICE '• staff1@davilareisadvogados.com.br (Password: TestStaff123!)';
    RAISE NOTICE '• client1@empresa.com.br (Password: TestClient123!)';
    RAISE NOTICE '• client2@corporacao.com.br (Password: TestClient123!)';
    RAISE NOTICE '• client3@startup.com.br (Password: TestClient123!)';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'DATABASE IS NOW READY FOR COMPREHENSIVE E2E TESTING!';
    RAISE NOTICE '=============================================================================';
END $$;