-- Migration 04: Financial Management System
-- High Priority: Revenue management and accounts payable/receivable
-- Apply fourth: Financial operations and business intelligence

-- 1. Suppliers Table - Vendor and service provider management
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(50), -- CNPJ/CPF
    payment_terms INTEGER DEFAULT 30, -- days
    category VARCHAR(100),
    bank_details JSONB,
    preferred_payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    notifications_enabled BOOLEAN DEFAULT true,
    credit_limit DECIMAL(12,2),
    payment_history_rating INTEGER CHECK (payment_history_rating >= 1 AND payment_history_rating <= 5),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_suppliers_created_by FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- 2. Expense Categories Table - Cost classification system
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_type VARCHAR(50) DEFAULT 'operational' CHECK (category_type IN ('operational', 'administrative', 'marketing', 'legal', 'technology', 'other')),
    parent_category_id UUID,
    account_code VARCHAR(20),
    is_tax_deductible BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    approval_limit DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_expense_categories_parent FOREIGN KEY (parent_category_id) REFERENCES expense_categories(id)
);

-- 3. Bills Table - Accounts payable management with approval workflow
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID,
    category_id UUID,
    bill_number VARCHAR(100),
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    payment_terms VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'overdue', 'cancelled')),
    payment_type VARCHAR(50) DEFAULT 'one_time' CHECK (payment_type IN ('one_time', 'installments', 'recurring')),
    installments INTEGER DEFAULT 1,
    recurring_period VARCHAR(50) CHECK (recurring_period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    next_recurrence_date DATE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    payment_proof_url TEXT,
    payment_date DATE,
    paid_amount DECIMAL(12,2),
    approval_workflow JSONB DEFAULT '[]',
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    late_fees DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    tags TEXT[],
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_bills_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_bills_category FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    CONSTRAINT fk_bills_approved_by FOREIGN KEY (approved_by) REFERENCES staff(id),
    CONSTRAINT fk_bills_created_by FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- 4. Payments Table - Unified payment tracking system
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('bill_payment', 'invoice_payment', 'refund', 'advance', 'expense_reimbursement')),
    reference_id UUID NOT NULL, -- can reference bills, invoices, etc.
    reference_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'pix', 'boleto', 'credit_card', 'debit_card', 'cash', 'check')),
    transaction_id VARCHAR(255),
    bank_account VARCHAR(100),
    reference_number VARCHAR(100),
    description TEXT,
    fees DECIMAL(10,2) DEFAULT 0,
    exchange_rate DECIMAL(10,6) DEFAULT 1.0,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    failure_reason TEXT,
    reconciliation_status VARCHAR(20) DEFAULT 'pending' CHECK (reconciliation_status IN ('pending', 'matched', 'unmatched', 'disputed')),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    reconciled_by UUID,
    proof_of_payment_url TEXT,
    tax_withheld DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_payments_reconciled_by FOREIGN KEY (reconciled_by) REFERENCES staff(id),
    CONSTRAINT fk_payments_created_by FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- 5. Financial Analytics Table - Business intelligence and reporting
CREATE TABLE IF NOT EXISTS financial_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    net_profit DECIMAL(15,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    accounts_payable DECIMAL(15,2) DEFAULT 0,
    accounts_receivable DECIMAL(15,2) DEFAULT 0,
    cash_flow DECIMAL(15,2) DEFAULT 0,
    operating_expenses DECIMAL(15,2) DEFAULT 0,
    billable_hours DECIMAL(10,2) DEFAULT 0,
    average_hourly_rate DECIMAL(10,2) DEFAULT 0,
    client_acquisition_cost DECIMAL(10,2) DEFAULT 0,
    customer_lifetime_value DECIMAL(15,2) DEFAULT 0,
    monthly_recurring_revenue DECIMAL(15,2) DEFAULT 0,
    churn_rate DECIMAL(5,2) DEFAULT 0,
    growth_rate DECIMAL(5,2) DEFAULT 0,
    expense_breakdown JSONB DEFAULT '{}',
    revenue_breakdown JSONB DEFAULT '{}',
    top_clients_by_revenue JSONB DEFAULT '[]',
    top_expense_categories JSONB DEFAULT '[]',
    key_metrics JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(period_type, period_start, period_end)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active, name);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_expense_categories_type ON expense_categories(category_type, is_active);
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_bills_supplier ON bills(supplier_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date, status);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status, due_date);
CREATE INDEX IF NOT EXISTS idx_bills_approval ON bills(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_reconciliation ON payments(reconciliation_status) WHERE reconciliation_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_financial_analytics_period ON financial_analytics(period_type, period_start, period_end);

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_analytics ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Admins can manage suppliers" ON suppliers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can view expense categories" ON expense_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can view bills for approval or creation" ON bills
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
        OR created_by IN (SELECT id FROM staff WHERE id IN (
            SELECT staff_id::uuid FROM admin_users WHERE user_id = auth.uid()
        ))
    );

CREATE POLICY "Admins can manage payments" ON payments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can view financial analytics" ON financial_analytics
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Insert default expense categories
INSERT INTO expense_categories (name, description, category_type, is_tax_deductible, created_at) VALUES
('Aluguel e Condomínio', 'Despesas com aluguel do escritório e taxas condominiais', 'operational', true, NOW()),
('Salários e Encargos', 'Folha de pagamento e encargos trabalhistas', 'operational', true, NOW()),
('Tecnologia', 'Software, hardware e serviços de TI', 'technology', true, NOW()),
('Marketing Digital', 'Anúncios online, SEO, redes sociais', 'marketing', true, NOW()),
('Consultorias Jurídicas', 'Pareceres externos e consultorias especializadas', 'legal', true, NOW()),
('Material de Escritório', 'Papelaria, suprimentos e materiais diversos', 'administrative', true, NOW()),
('Telecomunicações', 'Internet, telefone e comunicações', 'operational', true, NOW()),
('Seguros', 'Seguro do escritório, responsabilidade civil profissional', 'operational', true, NOW()),
('Treinamento e Capacitação', 'Cursos, seminários e desenvolvimento profissional', 'operational', true, NOW()),
('Cartório e Taxas', 'Custas judiciais, cartoriais e taxas oficiais', 'legal', true, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_name, email, phone, category, payment_terms, is_active, created_at) VALUES
('Google Workspace', 'Suporte Google', 'billing@google.com', '+55 11 0000-0000', 'Tecnologia', 30, true, NOW()),
('Microsoft Office 365', 'Suporte Microsoft', 'billing@microsoft.com', '+55 11 0000-0001', 'Tecnologia', 30, true, NOW()),
('Imobiliária São Paulo', 'João Silva', 'joao@imobiliaria.com.br', '+55 11 9999-0001', 'Imobiliário', 10, true, NOW()),
('Papelaria Central', 'Maria Santos', 'vendas@papelaria.com.br', '+55 11 8888-0001', 'Material de Escritório', 15, true, NOW()),
('Telecomunicações Brasil', 'Pedro Costa', 'comercial@telecom.com.br', '+55 11 7777-0001', 'Telecomunicações', 30, true, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample bills for demonstration
INSERT INTO bills (supplier_id, category_id, bill_number, description, amount, total_amount, due_date, status, created_by, created_at)
SELECT 
    s.id,
    ec.id,
    'BILL-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(EXTRACT(MONTH FROM NOW())::text, 2, '0') || '-001',
    'Fatura mensal - ' || s.name,
    1500.00,
    1500.00,
    CURRENT_DATE + INTERVAL '30 days',
    'pending',
    staff.id,
    NOW()
FROM suppliers s
JOIN expense_categories ec ON ec.name = 'Tecnologia'
JOIN staff ON staff.position = 'Partner'
WHERE s.name = 'Google Workspace'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add table comments for documentation
COMMENT ON TABLE suppliers IS 'Vendor and service provider management with payment terms';
COMMENT ON TABLE expense_categories IS 'Hierarchical cost classification system for expense tracking';
COMMENT ON TABLE bills IS 'Accounts payable management with approval workflow and payment tracking';
COMMENT ON TABLE payments IS 'Unified payment tracking system for all types of outgoing payments';
COMMENT ON TABLE financial_analytics IS 'Pre-calculated business intelligence metrics and financial KPIs';

-- Migration completed
SELECT 'Financial Management System migration completed successfully!' as result;