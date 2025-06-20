-- MINI PRIMA DATABASE SEEDING SCRIPT (SAFE VERSION)
-- Comprehensive test data for E2E testing with conflict handling
-- This version handles existing data and only inserts new records

-- =============================================================================
-- SAFE ADMIN USERS (WITH CONFLICT HANDLING)
-- =============================================================================
-- Insert admin users only if they don't exist
INSERT INTO admin_users (user_id, role, permissions, is_active) 
SELECT user_id::uuid, role::admin_role, permissions, is_active FROM (VALUES
    ('18625a22-61cd-48e2-9518-1a9827197bef', 'admin', 
     '["all_access", "user_management", "billing_management", "system_settings"]'::jsonb, true),
    ('d052ddde-47fe-44f9-8bf5-f9edbe134dde', 'admin', 
     '["case_management", "billing_management", "client_management"]'::jsonb, true)
) AS new_admin_users(user_id, role, permissions, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.user_id = new_admin_users.user_id::uuid
);

-- =============================================================================
-- SAFE STAFF MEMBERS (WITH CONFLICT HANDLING)
-- =============================================================================
-- Insert staff members only if they don't exist (based on email)
INSERT INTO staff (id, full_name, email, position, specialization, hourly_rate, oab_number, 
                   start_date, status, role, is_active, permissions, created_at) 
SELECT id, full_name, email, position, specialization, hourly_rate, oab_number, 
       start_date, status::staff_status, role, is_active, permissions, created_at FROM (VALUES
    (gen_random_uuid(), 'Dr. Carlos Eduardo Santos', 'lawyer1@davilareisadvogados.com.br', 'senior_lawyer', 
     '["Direito Trabalhista", "Direito Previdenciário"]'::jsonb, 250.00, 'OAB/SP 123456', 
     CURRENT_DATE - INTERVAL '2 years', 'Active', 'senior_lawyer', true, 
     '["case_management", "client_access", "billing_access", "document_management"]'::jsonb, NOW()),
    (gen_random_uuid(), 'Dra. Marina Oliveira', 'lawyer2@davilareisadvogados.com.br', 'lawyer', 
     '["Direito Civil", "Direito Empresarial"]'::jsonb, 180.00, 'OAB/SP 234567', 
     CURRENT_DATE - INTERVAL '1 year', 'Active', 'lawyer', true,
     '["case_management", "client_access", "document_management"]'::jsonb, NOW()),
    (gen_random_uuid(), 'Rafael Costa', 'staff1@davilareisadvogados.com.br', 'paralegal', 
     '["Suporte Jurídico", "Pesquisa Legal"]'::jsonb, 80.00, null, 
     CURRENT_DATE - INTERVAL '6 months', 'Active', 'paralegal', true,
     '["document_management", "client_support"]'::jsonb, NOW()),
    (gen_random_uuid(), 'Patricia Lima', 'secretary@davilareisadvogados.com.br', 'secretary', 
     '["Administração", "Atendimento ao Cliente"]'::jsonb, 60.00, null, 
     CURRENT_DATE - INTERVAL '3 months', 'Active', 'secretary', true,
     '["scheduling", "document_management"]'::jsonb, NOW())
) AS new_staff(id, full_name, email, position, specialization, hourly_rate, oab_number, 
               start_date, status, role, is_active, permissions, created_at)
WHERE NOT EXISTS (
    SELECT 1 FROM staff WHERE staff.email = new_staff.email
);

-- =============================================================================
-- SAFE CLIENTS (WITH CONFLICT HANDLING)
-- =============================================================================
-- Insert clients only if they don't exist (based on user_id or email)
INSERT INTO clients (id, user_id, company_name, cnpj, email, phone, address, contact_person, 
                    subscription_status, portal_access, created_at, approved_at, status) 
SELECT id::uuid, user_id::uuid, company_name, cnpj, email, phone, address, contact_person, 
       subscription_status, portal_access, created_at, approved_at, status::client_status FROM (VALUES
    ('11111111-1111-1111-1111-111111111111', '02c51375-adac-4e68-8129-8b0ec52f07b9', 'TechStart Soluções Ltda', '12.345.678/0001-90', 'client1@empresa.com.br', 
     '(11) 99999-1111', 'Av. Paulista, 1000 - São Paulo/SP', 'João Silva', 'professional', true, NOW(), NOW(), 'Active'),
    ('22222222-2222-2222-2222-222222222222', '3cf021fa-08a1-430d-ac2a-8b692ceab9cb', 'Corporação Industrial S.A.', '23.456.789/0001-01', 'client2@corporacao.com.br', 
     '(11) 88888-2222', 'Rua Augusta, 500 - São Paulo/SP', 'Maria Santos', 'enterprise', true, NOW(), NOW(), 'Active'),
    ('33333333-3333-3333-3333-333333333333', 'b0c045d2-ad49-4bb2-a6c1-362921580ff5', 'Startup Inovação Ltda', '34.567.890/0001-12', 'client3@startup.com.br', 
     '(11) 77777-3333', 'Vila Madalena, 200 - São Paulo/SP', 'Pedro Costa', 'basic', true, NOW(), NOW(), 'Active'),
    ('44444444-4444-4444-4444-444444444444', null, 'Comércio & Varejo Ltda', '45.678.901/0001-23', 'contato@comercio.com.br', 
     '(11) 66666-4444', 'Centro, 300 - São Paulo/SP', 'Ana Oliveira', null, false, NOW(), null, 'Inactive'),
    ('55555555-5555-5555-5555-555555555555', null, 'Serviços Profissionais ME', '56.789.012/0001-34', 'info@servicos.com.br', 
     '(11) 55555-5555', 'Moema, 150 - São Paulo/SP', 'Carlos Lima', 'basic', true, NOW(), NOW(), 'Active')
) AS new_clients(id, user_id, company_name, cnpj, email, phone, address, contact_person, 
                 subscription_status, portal_access, created_at, approved_at, status)
WHERE NOT EXISTS (
    SELECT 1 FROM clients 
    WHERE (clients.user_id = new_clients.user_id::uuid AND new_clients.user_id IS NOT NULL)
    OR clients.email = new_clients.email
    OR clients.id = new_clients.id::uuid
);

-- =============================================================================
-- SAFE SUBSCRIPTION PLANS (WITH CONFLICT HANDLING)
-- =============================================================================
-- Insert subscription plans only if they don't exist
INSERT INTO subscription_plans (id, name, tier, category, monthly_price, description, features, is_active, created_at) 
SELECT id::uuid, name, tier, category, monthly_price, description, features, is_active, created_at FROM (VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Básico', 'basic', 'labor_law', 899.00, 'Consultoria jurídica básica mensal',
     '["5 consultas/mês", "Análise de contratos", "Suporte por email"]'::jsonb, true, NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Profissional', 'professional', 'full_service', 1899.00, 'Solução completa para empresas',
     '["15 consultas/mês", "Análise ilimitada", "Suporte prioritário", "WhatsApp direto"]'::jsonb, true, NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Empresarial', 'enterprise', 'full_service', 3499.00, 'Para grandes corporações',
     '["Consultas ilimitadas", "Advogado dedicado", "SLA 2h", "Compliance empresarial"]'::jsonb, true, NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Anual Básico', 'basic', 'corporate_law', 8990.00, 'Plano básico com desconto anual',
     '["5 consultas/mês", "Análise de contratos", "Suporte por email", "2 meses grátis"]'::jsonb, true, NOW())
) AS new_plans(id, name, tier, category, monthly_price, description, features, is_active, created_at)
WHERE NOT EXISTS (
    SELECT 1 FROM subscription_plans WHERE subscription_plans.id = new_plans.id::uuid
);

-- =============================================================================
-- SAFE CLIENT SUBSCRIPTIONS (WITH CONFLICT HANDLING)
-- =============================================================================
-- Insert client subscriptions only for existing clients and plans
INSERT INTO client_subscriptions (id, client_id, plan_id, start_date, end_date, status, 
                                 monthly_usage, quota_limit, auto_renew, created_at)
SELECT gen_random_uuid(), client_id::uuid, plan_id::uuid, start_date, end_date, status, 
       monthly_usage, quota_limit, auto_renew, created_at FROM (VALUES
    ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'active', 2, 5, true, NOW()),
    ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'active', 8, 15, true, NOW()),
    ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
     CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'active', 25, 999, true, NOW())
) AS new_subscriptions(client_id, plan_id, start_date, end_date, status, monthly_usage, quota_limit, auto_renew, created_at)
WHERE EXISTS (SELECT 1 FROM clients WHERE clients.id = new_subscriptions.client_id::uuid)
AND EXISTS (SELECT 1 FROM subscription_plans WHERE subscription_plans.id = new_subscriptions.plan_id::uuid)
AND NOT EXISTS (
    SELECT 1 FROM client_subscriptions 
    WHERE client_subscriptions.client_id = new_subscriptions.client_id::uuid 
    AND client_subscriptions.plan_id = new_subscriptions.plan_id::uuid
);

-- =============================================================================
-- SAFE CASES (WITH CONFLICT HANDLING)
-- =============================================================================
-- Insert cases only if they don't exist and clients exist
INSERT INTO cases (id, client_id, case_number, case_title, description, case_type, status, 
                  priority, assigned_lawyer_id, estimated_value, success_fee_percentage,
                  billing_type, hourly_rate, created_at, updated_at)
SELECT id::uuid, client_id::uuid, case_number, case_title, description, case_type, status::case_status, 
       priority::priority, (SELECT id FROM staff WHERE full_name LIKE lawyer_name LIMIT 1),
       estimated_value, success_fee_percentage, billing_type, hourly_rate, created_at, updated_at
FROM (VALUES
    ('case0001-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
     'CASO-2025-001', 'Rescisão Contratual Trabalhista', 
     'Ação de rescisão indireta por descumprimento de obrigações trabalhistas do empregador.',
     'trabalhista', 'In Progress', 'High', 'Dr. Carlos%',
     25000.00, 20.0, 'hourly', 250.00, NOW() - INTERVAL '15 days', NOW()),
    ('case0002-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
     'CASO-2025-002', 'Revisão Contratual Fornecedores',
     'Análise e revisão de contratos com fornecedores internacionais.',
     'empresarial', 'In Progress', 'Medium', 'Dra. Marina%',
     150000.00, 15.0, 'fixed_fee', 0, NOW() - INTERVAL '8 days', NOW()),
    ('case0003-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
     'CASO-2025-003', 'Constituição Societária',
     'Assessoria para alteração do contrato social e entrada de novos sócios investidores.',
     'empresarial', 'Closed - Won', 'Medium', 'Dra. Marina%',
     50000.00, 10.0, 'fixed_fee', 0, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
    ('case0004-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
     'CASO-2025-004', 'Defesa Administrativa CADE',
     'Defesa em processo administrativo no CADE por prática anticoncorrencial.',
     'regulatorio', 'Waiting Court', 'High', 'Dr. Carlos%',
     500000.00, 25.0, 'percentage', 0, NOW() - INTERVAL '20 days', NOW()),
    ('case0005-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
     'CASO-2025-005', 'Litígio Trabalhista Coletivo',
     'Defesa em ação civil pública trabalhista movida pelo Ministério Público.',
     'trabalhista', 'Open', 'Urgent', 'Dr. Carlos%',
     1200000.00, 30.0, 'hybrid', 200.00, NOW() - INTERVAL '45 days', NOW())
) AS new_cases(id, client_id, case_number, case_title, description, case_type, status, 
               priority, lawyer_name, estimated_value, success_fee_percentage,
               billing_type, hourly_rate, created_at, updated_at)
WHERE EXISTS (SELECT 1 FROM clients WHERE clients.id = new_cases.client_id::uuid)
AND NOT EXISTS (SELECT 1 FROM cases WHERE cases.id = new_cases.id::uuid);

-- =============================================================================
-- SAFE SUPPLIERS (WITH CONFLICT HANDLING)
-- =============================================================================
INSERT INTO suppliers (id, name, contact_name, email, phone, address, tax_id, 
                      payment_terms, notifications_enabled, is_active, created_at) 
SELECT id::uuid, name, contact_name, email, phone, address, tax_id, 
       payment_terms, notifications_enabled, is_active, created_at FROM (VALUES
    ('11111111-2222-3333-4444-555555555555', 'Escritório Virtual Premium', 'Sandra Martins', 'contato@escritoriovirtual.com.br',
     '(11) 3333-4444', 'Av. Faria Lima, 1500 - São Paulo/SP', '11.222.333/0001-44', 30, true, true, NOW()),
    ('22222222-3333-4444-5555-666666666666', 'TI Solutions Ltda', 'Roberto Silva', 'suporte@tisolutions.com.br',
     '(11) 4444-5555', 'Rua Teodoro Sampaio, 800 - São Paulo/SP', '22.333.444/0001-55', 15, true, true, NOW()),
    ('33333333-4444-5555-6666-777777777777', 'Contabilidade D&A', 'Ana Contadora', 'ana@contabilidadeda.com.br',
     '(11) 5555-6666', 'Vila Olímpia, 600 - São Paulo/SP', '33.444.555/0001-66', 10, true, true, NOW()),
    ('44444444-5555-6666-7777-888888888888', 'Segurança Empresarial', 'Carlos Segurança', 'carlos@segurancaemp.com.br',
     '(11) 6666-7777', 'Brooklin, 400 - São Paulo/SP', '44.555.666/0001-77', 30, true, true, NOW())
) AS new_suppliers(id, name, contact_name, email, phone, address, tax_id, 
                   payment_terms, notifications_enabled, is_active, created_at)
WHERE NOT EXISTS (
    SELECT 1 FROM suppliers WHERE suppliers.id = new_suppliers.id::uuid
);

-- =============================================================================
-- SAFE EXPENSE CATEGORIES (WITH CONFLICT HANDLING)
-- =============================================================================
INSERT INTO expense_categories (id, name, description, is_active) 
SELECT id::uuid, name, description, is_active FROM (VALUES
    ('eeeeeeee-1111-2222-3333-444444444444', 'Aluguel e Condomínio', 'Despesas com locação do escritório', true),
    ('eeeeeeee-2222-3333-4444-555555555555', 'Tecnologia e Software', 'Licenças de software, hardware, internet', true),
    ('eeeeeeee-3333-4444-5555-666666666666', 'Serviços Contábeis', 'Honorários contábeis e fiscais', true),
    ('eeeeeeee-4444-5555-6666-777777777777', 'Segurança e Limpeza', 'Serviços de segurança e limpeza', true),
    ('eeeeeeee-5555-6666-7777-888888888888', 'Marketing e Publicidade', 'Despesas com marketing jurídico', true),
    ('eeeeeeee-6666-7777-8888-999999999999', 'Deslocamentos', 'Viagens, combustível, estacionamento', true),
    ('eeeeeeee-7777-8888-9999-aaaaaaaaaaaa', 'Material de Escritório', 'Papelaria, suprimentos diversos', true)
) AS new_categories(id, name, description, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM expense_categories WHERE expense_categories.id = new_categories.id::uuid
);

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
DO $$
DECLARE
    admin_count INTEGER;
    staff_count INTEGER;
    client_count INTEGER;
    case_count INTEGER;
    plan_count INTEGER;
    subscription_count INTEGER;
    supplier_count INTEGER;
    category_count INTEGER;
BEGIN
    -- Count inserted records
    SELECT COUNT(*) INTO admin_count FROM admin_users;
    SELECT COUNT(*) INTO staff_count FROM staff;
    SELECT COUNT(*) INTO client_count FROM clients;
    SELECT COUNT(*) INTO case_count FROM cases;
    SELECT COUNT(*) INTO plan_count FROM subscription_plans;
    SELECT COUNT(*) INTO subscription_count FROM client_subscriptions;
    SELECT COUNT(*) INTO supplier_count FROM suppliers;
    SELECT COUNT(*) INTO category_count FROM expense_categories;

    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '🎉 MINI PRIMA DATABASE SEEDING COMPLETED SUCCESSFULLY! (SAFE VERSION) 🎉';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Database now contains:';
    RAISE NOTICE '• ✅ Admin Users: % total (includes existing + new)', admin_count;
    RAISE NOTICE '• ✅ Staff Members: % total (includes existing + new)', staff_count;
    RAISE NOTICE '• ✅ Clients: % total (includes existing + new)', client_count;
    RAISE NOTICE '• ✅ Cases: % total (includes existing + new)', case_count;
    RAISE NOTICE '• ✅ Subscription Plans: % total (includes existing + new)', plan_count;
    RAISE NOTICE '• ✅ Active Subscriptions: % total (includes existing + new)', subscription_count;
    RAISE NOTICE '• ✅ Suppliers: % total (includes existing + new)', supplier_count;
    RAISE NOTICE '• ✅ Expense Categories: % total (includes existing + new)', category_count;
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '🔑 AUTHENTICATION READY (if users exist):';
    RAISE NOTICE '• Admin: admin@davilareisadvogados.com.br';
    RAISE NOTICE '• Lawyer: lawyer1@davilareisadvogados.com.br (also admin)';
    RAISE NOTICE '• Client 1: client1@empresa.com.br (TechStart)';
    RAISE NOTICE '• Client 2: client2@corporacao.com.br (Corporação)';
    RAISE NOTICE '• Client 3: client3@startup.com.br (Startup)';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '💡 SAFE SEEDING: Only new records were inserted, existing data preserved';
    RAISE NOTICE '🚀 DATABASE IS NOW READY FOR COMPREHENSIVE E2E TESTING!';
    RAISE NOTICE '=============================================================================';
END $$;