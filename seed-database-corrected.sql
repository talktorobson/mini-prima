-- MINI PRIMA DATABASE SEEDING SCRIPT (CORRECTED VERSION)
-- Comprehensive test data for E2E testing with realistic Brazilian legal practice data
-- This version is corrected to match the actual database schema

-- =============================================================================
-- AUTHENTICATION USERS (Supabase Auth)
-- =============================================================================
-- IMPORTANT: Create these users in Supabase Auth BEFORE running this script:
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
-- Note: admin_users table requires user_id from auth.users
-- For production: Replace gen_random_uuid() with actual auth.users IDs
INSERT INTO admin_users (user_id, role, permissions, is_active) VALUES
(gen_random_uuid(), 'admin', 
 '["all_access", "user_management", "billing_management", "system_settings"]'::jsonb, true),
(gen_random_uuid(), 'admin', 
 '["case_management", "billing_management", "client_management"]'::jsonb, true);

-- =============================================================================
-- STAFF MEMBERS
-- =============================================================================
-- Using actual column names from database schema
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
                  billing_type, hourly_rate, created_at, updated_at) 
SELECT 
  gen_random_uuid(),
  c.id,
  'CASO-2025-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Rescisão Contratual Trabalhista'
    WHEN 2 THEN 'Revisão Contratual Fornecedores'
    WHEN 3 THEN 'Constituição Societária'
    WHEN 4 THEN 'Defesa Administrativa CADE'
    WHEN 5 THEN 'Litígio Trabalhista Coletivo'
    ELSE 'Caso Geral'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Ação de rescisão indireta por descumprimento de obrigações trabalhistas do empregador.'
    WHEN 2 THEN 'Análise e revisão de contratos com fornecedores internacionais.'
    WHEN 3 THEN 'Assessoria para alteração do contrato social e entrada de novos sócios investidores.'
    WHEN 4 THEN 'Defesa em processo administrativo no CADE por prática anticoncorrencial.'
    WHEN 5 THEN 'Defesa em ação civil pública trabalhista movida pelo Ministério Público.'
    ELSE 'Descrição geral do caso'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'trabalhista'
    WHEN 2 THEN 'empresarial'
    WHEN 3 THEN 'empresarial'
    WHEN 4 THEN 'regulatorio'
    WHEN 5 THEN 'trabalhista'
    ELSE 'civil'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 3 THEN 'completed'
    ELSE 'active'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'high'
    WHEN 2 THEN 'medium'
    WHEN 3 THEN 'medium'
    WHEN 4 THEN 'high'
    WHEN 5 THEN 'critical'
    ELSE 'medium'
  END,
  (SELECT id FROM staff_data LIMIT 1 OFFSET (ROW_NUMBER() OVER() - 1) % 2),
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 25000.00
    WHEN 2 THEN 150000.00
    WHEN 3 THEN 50000.00
    WHEN 4 THEN 500000.00
    WHEN 5 THEN 1200000.00
    ELSE 100000.00
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 20.0
    WHEN 2 THEN 15.0
    WHEN 3 THEN 10.0
    WHEN 4 THEN 25.0
    WHEN 5 THEN 30.0
    ELSE 15.0
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'hourly'
    WHEN 2 THEN 'fixed_fee'
    WHEN 3 THEN 'fixed_fee'
    WHEN 4 THEN 'percentage'
    WHEN 5 THEN 'hybrid'
    ELSE 'hourly'
  END,
  CASE 
    WHEN ROW_NUMBER() OVER() IN (1, 5) THEN 250.00
    ELSE 0
  END,
  NOW() - INTERVAL (ROW_NUMBER() OVER() * 5)::text || ' days',
  NOW()
FROM client_data c;

-- =============================================================================
-- DOCUMENTS
-- =============================================================================
WITH case_data AS (
  SELECT id, case_number, client_id FROM cases LIMIT 5
),
staff_data AS (
  SELECT id FROM staff WHERE role IN ('senior_lawyer', 'lawyer') LIMIT 1
)
INSERT INTO documents (id, case_id, client_id, title, description, document_type, 
                      file_url, file_size, uploaded_by, is_confidential, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  c.client_id,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Contrato de Trabalho'
    WHEN 2 THEN 'Recibos de Pagamento'
    WHEN 3 THEN 'Contratos Fornecedores'
    WHEN 4 THEN 'Contrato Social Atual'
    WHEN 5 THEN 'Termo de Investimento'
    ELSE 'Documento ' || ROW_NUMBER() OVER()
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Contrato de trabalho original do empregado'
    WHEN 2 THEN 'Histórico de recibos salariais dos últimos 12 meses'
    WHEN 3 THEN 'Contratos atuais com fornecedores para revisão'
    WHEN 4 THEN 'Última versão do contrato social registrada na Junta Comercial'
    WHEN 5 THEN 'Acordo de investimento com os novos sócios'
    ELSE 'Descrição do documento'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'contract'
    WHEN 2 THEN 'evidence'
    WHEN 3 THEN 'contract'
    WHEN 4 THEN 'legal_document'
    WHEN 5 THEN 'contract'
    ELSE 'other'
  END,
  '/documents/caso-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0') || '/document.pdf',
  245760 + (ROW_NUMBER() OVER() * 100000),
  (SELECT id FROM staff_data),
  CASE ROW_NUMBER() OVER()
    WHEN 2 THEN false
    ELSE true
  END,
  NOW() - INTERVAL (ROW_NUMBER() OVER() * 2)::text || ' days'
FROM case_data c;

-- =============================================================================
-- STAFF CLIENT ASSIGNMENTS
-- =============================================================================
WITH assignments AS (
  SELECT 
    s.id as staff_id,
    c.id as client_id,
    CASE 
      WHEN s.role = 'senior_lawyer' THEN 'primary'
      WHEN s.role = 'lawyer' THEN 'secondary'
      ELSE 'support'
    END as assignment_type
  FROM staff s
  CROSS JOIN clients c
  WHERE s.role IN ('senior_lawyer', 'lawyer', 'paralegal') 
    AND c.status = 'approved'
    AND (s.id, c.id) IN (
      SELECT s2.id, c2.id 
      FROM staff s2, clients c2 
      WHERE c2.status = 'approved' 
      ORDER BY s2.id, c2.id 
      LIMIT 6
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
                  due_date, status, payment_type, created_by, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM supplier_data ORDER BY name LIMIT 1 OFFSET (ROW_NUMBER() OVER() - 1) % 4),
  (SELECT id FROM category_data ORDER BY name LIMIT 1 OFFSET (ROW_NUMBER() OVER() - 1) % 7),
  'BILL-2025-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Aluguel escritório Janeiro 2025'
    WHEN 2 THEN 'Licenças software jurídico - Janeiro'
    WHEN 3 THEN 'Honorários contábeis Dezembro 2024'
    WHEN 4 THEN 'Serviços segurança Novembro 2024'
    ELSE 'Despesa geral'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 8500.00
    WHEN 2 THEN 2200.00
    WHEN 3 THEN 1800.00
    WHEN 4 THEN 1200.00
    ELSE 1000.00
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN CURRENT_DATE + INTERVAL '5 days'
    WHEN 2 THEN CURRENT_DATE + INTERVAL '10 days'
    WHEN 3 THEN CURRENT_DATE - INTERVAL '5 days'
    WHEN 4 THEN CURRENT_DATE - INTERVAL '15 days'
    ELSE CURRENT_DATE + INTERVAL '30 days'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 3 THEN 'paid'
    WHEN 4 THEN 'overdue'
    ELSE 'pending'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 2 THEN 'recurring'
    ELSE 'one_time'
  END,
  (SELECT id FROM staff_data),
  NOW() - INTERVAL (ROW_NUMBER() OVER() * 2)::text || ' days'
FROM generate_series(1, 4);

-- =============================================================================
-- INVOICES (ACCOUNTS RECEIVABLE)
-- =============================================================================
WITH case_billing AS (
  SELECT 
    c.id as case_id,
    c.client_id,
    c.case_number,
    CASE c.billing_type
      WHEN 'hourly' THEN c.hourly_rate * 40
      WHEN 'fixed_fee' THEN 15000.00
      WHEN 'percentage' THEN c.estimated_value * 0.1
      ELSE 25000.00
    END as amount,
    c.billing_type
  FROM cases c 
  WHERE c.status IN ('active', 'completed')
  LIMIT 3
),
staff_data AS (
  SELECT id FROM staff WHERE role IN ('senior_lawyer', 'lawyer') LIMIT 1
)
INSERT INTO invoices (id, client_id, case_id, invoice_number, description, amount,
                     due_date, status, created_by, created_at)
SELECT 
  gen_random_uuid(),
  cb.client_id,
  cb.case_id,
  'FAT-2025-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  'Honorários advocatícios - ' || cb.case_number,
  cb.amount,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN CURRENT_DATE + INTERVAL '30 days'
    WHEN 2 THEN CURRENT_DATE - INTERVAL '5 days'
    WHEN 3 THEN CURRENT_DATE - INTERVAL '10 days'
    ELSE CURRENT_DATE + INTERVAL '15 days'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'sent'
    ELSE 'paid'
  END,
  (SELECT id FROM staff_data),
  NOW() - INTERVAL (ROW_NUMBER() OVER() * 10)::text || ' days'
FROM case_billing cb;

-- =============================================================================
-- PAYMENT RECORDS
-- =============================================================================
WITH payment_data AS (
  SELECT 
    i.id as reference_id,
    i.amount,
    'receivable' as type
  FROM invoices i 
  WHERE i.status = 'paid'
  UNION ALL
  SELECT 
    b.id as reference_id,
    b.amount,
    'payable' as type
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
  reference_id,
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
    COALESCE(c.hourly_rate, 200.00) as hourly_rate
  FROM cases c 
  WHERE c.status = 'active' AND c.billing_type IN ('hourly', 'hybrid')
  LIMIT 3
)
INSERT INTO time_entries (id, staff_id, case_id, description, hours_worked, 
                         hourly_rate, total_amount, entry_date, status, created_at)
SELECT 
  gen_random_uuid(),
  td.staff_id,
  td.case_id,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Análise inicial do caso e estratégia jurídica'
    WHEN 2 THEN 'Elaboração de petição inicial e juntada de documentos'
    WHEN 3 THEN 'Reunião com cliente e análise de documentação trabalhista'
    ELSE 'Trabalho jurídico geral'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 4.5
    WHEN 2 THEN 6.0
    WHEN 3 THEN 3.0
    ELSE 2.0
  END,
  td.hourly_rate,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 4.5 * td.hourly_rate
    WHEN 2 THEN 6.0 * td.hourly_rate
    WHEN 3 THEN 3.0 * td.hourly_rate
    ELSE 2.0 * td.hourly_rate
  END,
  CURRENT_DATE - INTERVAL (ROW_NUMBER() OVER() * 2)::text || ' days',
  CASE ROW_NUMBER() OVER()
    WHEN 2 THEN 'pending_approval'
    ELSE 'approved'
  END,
  NOW() - INTERVAL (ROW_NUMBER() OVER() * 2)::text || ' days'
FROM time_data td;

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
  LIMIT 3
)
INSERT INTO portal_messages (id, sender_id, recipient_id, sender_type, recipient_type,
                            subject, message, is_read, created_at)
SELECT 
  gen_random_uuid(),
  md.client_id,
  md.staff_id,
  'client',
  'staff',
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Dúvida sobre andamento do caso'
    WHEN 2 THEN 'Solicitação de reunião'
    WHEN 3 THEN 'Documentos adicionais'
    ELSE 'Assunto geral'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Gostaria de saber o andamento do processo. Há previsão para a próxima audiência?'
    WHEN 2 THEN 'Podemos agendar uma reunião para discutir a estratégia do caso?'
    WHEN 3 THEN 'Tenho alguns documentos adicionais que podem ser úteis para o caso.'
    ELSE 'Mensagem geral do cliente.'
  END,
  false,
  NOW() - INTERVAL (ROW_NUMBER() OVER())::text || ' days'
FROM messaging_data md;

-- Portal Notifications
WITH client_data AS (
  SELECT id FROM clients WHERE status = 'approved' LIMIT 3
)
INSERT INTO portal_notifications (id, user_id, user_type, title, message, 
                                 notification_type, is_read, created_at)
SELECT 
  gen_random_uuid(),
  cd.id,
  'client',
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Prazo processual importante'
    WHEN 2 THEN 'Nova mensagem disponível'
    WHEN 3 THEN 'Fatura disponível'
    ELSE 'Notificação geral'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Atenção: Prazo importante se aproxima em seu processo.'
    WHEN 2 THEN 'Você recebeu uma nova mensagem de seu advogado.'
    WHEN 3 THEN 'Nova fatura disponível para pagamento.'
    ELSE 'Notificação geral do sistema.'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'deadline_alert'
    WHEN 2 THEN 'message'
    WHEN 3 THEN 'billing'
    ELSE 'general'
  END,
  false,
  NOW() - INTERVAL (ROW_NUMBER() OVER() * 6)::text || ' hours'
FROM client_data cd;

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
                               usage_count, usage_date, description, created_at)
SELECT 
  gen_random_uuid(),
  ud.subscription_id,
  ud.client_id,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'consultation'
    WHEN 2 THEN 'contract_review'
    WHEN 3 THEN 'consultation'
    ELSE 'general'
  END,
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 2
    WHEN 2 THEN 3
    WHEN 3 THEN 8
    ELSE 1
  END,
  CURRENT_DATE - INTERVAL (ROW_NUMBER() OVER() * 2)::text || ' days',
  CASE ROW_NUMBER() OVER()
    WHEN 1 THEN 'Consultas sobre rescisão trabalhista e compliance'
    WHEN 2 THEN 'Revisão de contratos com fornecedores internacionais'
    WHEN 3 THEN 'Consultoria intensiva para alteração societária'
    ELSE 'Uso geral dos serviços'
  END,
  NOW()
FROM usage_data ud;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'MINI PRIMA DATABASE SEEDING COMPLETED SUCCESSFULLY! (CORRECTED VERSION)';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'The following test data has been created:';
    RAISE NOTICE '• Admin Users: 2 (placeholder records - update with real auth.users IDs)';
    RAISE NOTICE '• Staff Members: 4 (2 lawyers, 1 paralegal, 1 secretary)';
    RAISE NOTICE '• Clients: 5 companies (4 approved, 1 pending)';
    RAISE NOTICE '• Cases: 5 legal matters (4 active, 1 completed)';
    RAISE NOTICE '• Documents: 5 case attachments';
    RAISE NOTICE '• Subscription Plans: 4 (basic, professional, enterprise, annual)';
    RAISE NOTICE '• Active Subscriptions: 3 client subscriptions';
    RAISE NOTICE '• Financial Records: 4 suppliers, 7 expense categories, 4 bills, 3 invoices';
    RAISE NOTICE '• Time Tracking: 3 time entries with approval workflow';
    RAISE NOTICE '• Portal Messages: 3 client-staff communications';
    RAISE NOTICE '• Notifications: 3 system notifications';
    RAISE NOTICE '• Usage Analytics: 3 subscription usage records';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Create Supabase Auth users with the emails listed in comments';
    RAISE NOTICE '2. Update admin_users table with real auth.users IDs';
    RAISE NOTICE '3. Verify all tables exist before running (some Brazilian Legal tables may be optional)';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'DATABASE IS NOW READY FOR COMPREHENSIVE E2E TESTING!';
    RAISE NOTICE '=============================================================================';
END $$;