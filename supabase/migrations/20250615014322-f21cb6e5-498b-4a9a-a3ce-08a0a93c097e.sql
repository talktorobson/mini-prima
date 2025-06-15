
-- First, let's get the client_id for teste@exemplo.com
-- Then insert 10 example cases for this client with proper enum casting

INSERT INTO cases (
  client_id,
  case_number,
  case_title,
  service_type,
  description,
  status,
  priority,
  assigned_lawyer,
  start_date,
  expected_close_date,
  progress_percentage,
  total_value,
  fixed_fee,
  hourly_rate,
  court_agency,
  counterparty_name,
  created_at
) 
SELECT 
  c.id as client_id,
  'CASE-2024-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0') as case_number,
  case_titles.title,
  case_titles.service_type,
  case_titles.description,
  case_titles.status::case_status,
  case_titles.priority::priority,
  case_titles.assigned_lawyer,
  case_titles.start_date::timestamp,
  case_titles.expected_close_date::timestamp,
  case_titles.progress_percentage,
  case_titles.total_value,
  case_titles.fixed_fee,
  case_titles.hourly_rate,
  case_titles.court_agency,
  case_titles.counterparty_name,
  NOW() - INTERVAL '1 day' * (ROW_NUMBER() OVER())
FROM clients c
CROSS JOIN (
  VALUES 
    ('Revisão de Contrato Comercial', 'Direito Empresarial', 'Análise e revisão de contrato de fornecimento com cláusulas específicas', 'In Progress', 'High', 'Dr. Silva', '2024-01-15', '2024-03-15', 75, 25000.00, 15000.00, 350.00, 'Tribunal de Justiça de SP', 'Fornecedora ABC Ltda'),
    ('Processo Trabalhista - Reclamação', 'Direito Trabalhista', 'Defesa em processo trabalhista movido por ex-funcionário', 'Waiting Court', 'Medium', 'Dra. Santos', '2024-02-01', '2024-06-01', 60, 18000.00, 12000.00, 400.00, '15ª Vara do Trabalho', 'João Silva'),
    ('Registro de Marca', 'Propriedade Intelectual', 'Processo de registro de marca no INPI', 'Open', 'Medium', 'Dr. Costa', '2024-03-01', '2024-08-01', 30, 8000.00, 6000.00, 300.00, 'INPI', NULL),
    ('Ação de Cobrança', 'Direito Civil', 'Cobrança de débitos em atraso de cliente inadimplente', 'In Progress', 'High', 'Dr. Silva', '2024-01-20', '2024-04-20', 85, 45000.00, 20000.00, 380.00, '2ª Vara Cível', 'Empresa XYZ S/A'),
    ('Consultoria Tributária', 'Direito Tributário', 'Consultoria para planejamento tributário e otimização fiscal', 'Closed - Won', 'Low', 'Dra. Oliveira', '2023-11-01', '2024-01-01', 100, 30000.00, 25000.00, 450.00, NULL, NULL),
    ('Dissolução Societária', 'Direito Empresarial', 'Processo de dissolução e liquidação de sociedade', 'Waiting Client', 'Medium', 'Dr. Costa', '2024-02-15', '2024-05-15', 40, 22000.00, 18000.00, 420.00, 'Junta Comercial', 'Sócio Minoritário'),
    ('Mandado de Segurança', 'Direito Administrativo', 'Impetração de mandado de segurança contra ato administrativo', 'In Progress', 'High', 'Dra. Santos', '2024-03-10', '2024-05-10', 50, 15000.00, 12000.00, 500.00, 'TRF 3ª Região', 'Prefeitura Municipal'),
    ('Divórcio Consensual', 'Direito de Família', 'Processo de divórcio consensual com partilha de bens', 'Closed - Won', 'Low', 'Dr. Silva', '2023-12-01', '2024-02-01', 100, 8000.00, 6000.00, 280.00, '1ª Vara de Família', NULL),
    ('Contrato de Locação', 'Direito Imobiliário', 'Elaboração de contrato de locação comercial', 'Open', 'Low', 'Dra. Oliveira', '2024-03-20', '2024-04-20', 20, 5000.00, 4000.00, 250.00, NULL, 'Locatário Comercial'),
    ('Ação de Despejo', 'Direito Imobiliário', 'Ação de despejo por falta de pagamento', 'Waiting Court', 'Medium', 'Dr. Costa', '2024-02-28', '2024-06-28', 35, 12000.00, 8000.00, 320.00, '3ª Vara Cível', 'Inquilino Inadimplente')
) AS case_titles(title, service_type, description, status, priority, assigned_lawyer, start_date, expected_close_date, progress_percentage, total_value, fixed_fee, hourly_rate, court_agency, counterparty_name)
WHERE c.email = 'teste@exemplo.com';
