
-- First, let's check the valid enum values for financial_type
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'financial_type'
);

-- Insert sample financial records for the current client with correct enum values
INSERT INTO public.financial_records (
  client_id,
  description,
  type,
  amount,
  status,
  due_date,
  payment_date,
  payment_method,
  invoice_number,
  category,
  notes
) VALUES 
-- Pending records
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'Honorários Advocatícios - Janeiro 2025',
  'Invoice',
  5500.00,
  'Pending',
  '2025-01-31T23:59:59',
  NULL,
  NULL,
  'INV-2025-001',
  'Legal Services',
  'Serviços prestados em janeiro de 2025'
),
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'Consultoria Tributária - Dezembro 2024',
  'Invoice',
  3200.00,
  'Pending',
  '2025-01-15T23:59:59',
  NULL,
  NULL,
  'INV-2024-012',
  'Tax Consulting',
  'Consultoria realizada em dezembro'
),
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'Taxa de Processo Judicial',
  'Expense',
  800.00,
  'Pending',
  '2025-02-10T23:59:59',
  NULL,
  NULL,
  'EXP-2025-003',
  'Court Fees',
  'Taxa referente ao processo trabalhista'
),
-- Paid records
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'Honorários Advocatícios - Dezembro 2024',
  'Invoice',
  4800.00,
  'Paid',
  '2024-12-31T23:59:59',
  '2024-12-28T10:30:00',
  'Transferência Bancária',
  'INV-2024-011',
  'Legal Services',
  'Pagamento realizado em 28/12/2024'
),
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'Elaboração de Contrato Comercial',
  'Invoice',
  2500.00,
  'Paid',
  '2024-11-30T23:59:59',
  '2024-11-25T14:15:00',
  'PIX',
  'INV-2024-010',
  'Contract Services',
  'Contrato de fornecimento - Empresa ABC'
),
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'Registro de Marca - INPI',
  'Expense',
  1200.00,
  'Paid',
  '2024-10-15T23:59:59',
  '2024-10-12T09:45:00',
  'Cartão de Crédito',
  'EXP-2024-008',
  'Intellectual Property',
  'Taxa paga diretamente ao INPI'
),
-- Overdue record
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'Consultoria Jurídica - Novembro 2024',
  'Invoice',
  1800.00,
  'Pending',
  '2024-12-15T23:59:59',
  NULL,
  NULL,
  'INV-2024-009',
  'Legal Consulting',
  'Vencimento em atraso - requer acompanhamento'
);
