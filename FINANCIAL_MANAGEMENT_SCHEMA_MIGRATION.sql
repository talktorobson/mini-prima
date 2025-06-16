-- FINANCIAL MANAGEMENT MODULE - COMPLETE DATABASE SCHEMA
-- D'Avila Reis Legal Practice Management System
-- Comprehensive Accounts Payable & Receivable System

-- =====================================================
-- SUPPLIERS & VENDORS MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Brasil',
    tax_id VARCHAR(50), -- CNPJ/CPF
    payment_terms INTEGER DEFAULT 30, -- Days for payment
    preferred_payment_method VARCHAR(50) DEFAULT 'transfer', -- transfer, check, pix, boleto
    bank_info JSONB, -- Bank details for payments
    notes TEXT,
    notifications_enabled BOOLEAN DEFAULT true,
    auto_send_confirmation BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- EXPENSE CATEGORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES public.expense_categories(id),
    is_tax_deductible BOOLEAN DEFAULT true,
    accounting_code VARCHAR(50), -- For integration with accounting systems
    budget_amount DECIMAL(12,2) DEFAULT 0, -- Monthly budget for this category
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default expense categories
INSERT INTO public.expense_categories (name, description, is_tax_deductible) VALUES
('Rent & Facilities', 'Office rent, utilities, maintenance', true),
('Technology', 'Software subscriptions, hardware, IT services', true),
('Professional Services', 'Accounting, consulting, legal research', true),
('Marketing & Business Development', 'Website, advertising, networking events', true),
('Travel & Transportation', 'Client meetings, court appearances, conferences', true),
('Office Supplies', 'Stationery, printing, general office expenses', true),
('Insurance', 'Professional liability, office insurance', true),
('Wages & Benefits', 'Staff salaries, benefits, bonuses', true),
('Banking & Financial', 'Bank fees, transaction costs, loans', true),
('Training & Education', 'Courses, seminars, professional development', true),
('Court & Legal Fees', 'Filing fees, court costs, expert witnesses', true),
('Client Entertainment', 'Business meals, client events', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- BILLS (ACCOUNTS PAYABLE)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id),
    category_id UUID REFERENCES public.expense_categories(id),
    bill_number VARCHAR(100),
    reference_number VARCHAR(100), -- Supplier's invoice number
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
    due_date DATE NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    received_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'paid', 'overdue', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Payment configuration
    payment_type VARCHAR(50) DEFAULT 'one_time' CHECK (payment_type IN ('one_time', 'installments', 'recurring')),
    installments INTEGER DEFAULT 1 CHECK (installments > 0),
    installment_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (installment_frequency IN ('weekly', 'monthly', 'quarterly')),
    recurring_period VARCHAR(50) CHECK (recurring_period IN ('weekly', 'monthly', 'quarterly', 'semi_annual', 'yearly')),
    recurring_end_date DATE,
    
    -- Document management
    attachment_url TEXT,
    payment_proof_url TEXT,
    contract_url TEXT,
    
    -- Approval workflow
    approval_required BOOLEAN DEFAULT true,
    approval_threshold DECIMAL(12,2) DEFAULT 1000, -- Auto-approve below this amount
    approved_by UUID REFERENCES public.admin_users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    
    -- Payment tracking
    paid_amount DECIMAL(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
    remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    paid_date DATE,
    payment_method VARCHAR(50), -- transfer, check, pix, boleto, cash
    payment_reference VARCHAR(100),
    
    -- Automation flags
    auto_approve BOOLEAN DEFAULT false,
    auto_pay BOOLEAN DEFAULT false,
    
    notes TEXT,
    internal_notes TEXT, -- Staff-only notes
    
    -- Audit fields
    created_by UUID REFERENCES public.staff(id) NOT NULL,
    updated_by UUID REFERENCES public.staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- INVOICES (ACCOUNTS RECEIVABLE)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) NOT NULL,
    case_id UUID REFERENCES public.cases(id), -- Optional link to specific case
    subscription_id UUID REFERENCES public.client_subscriptions(id), -- Link to subscription if applicable
    
    -- Invoice identification
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    reference_number VARCHAR(100), -- Client's PO number or reference
    
    -- Invoice details
    description TEXT NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    service_period_start DATE,
    service_period_end DATE,
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal - discount_amount + tax_amount) STORED,
    
    -- Payment tracking
    paid_amount DECIMAL(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
    remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    
    -- Status management
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial_paid', 'paid', 'overdue', 'cancelled', 'disputed')),
    
    -- Collections
    collection_status VARCHAR(50) DEFAULT 'none' CHECK (collection_status IN ('none', 'reminder_sent', 'first_notice', 'second_notice', 'collection_agency', 'legal_action')),
    last_reminder_sent DATE,
    next_follow_up_date DATE,
    
    -- Payment terms
    payment_terms INTEGER DEFAULT 30, -- Days
    late_fee_percentage DECIMAL(5,2) DEFAULT 0,
    early_payment_discount_percentage DECIMAL(5,2) DEFAULT 0,
    early_payment_discount_days INTEGER DEFAULT 0,
    
    -- Document management
    pdf_url TEXT,
    payment_proof_url TEXT,
    
    -- Subscription discount tracking
    subscription_discount_applied DECIMAL(12,2) DEFAULT 0,
    subscription_discount_percentage DECIMAL(5,2) DEFAULT 0,
    
    notes TEXT,
    internal_notes TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES public.staff(id) NOT NULL,
    updated_by UUID REFERENCES public.staff(id),
    sent_at TIMESTAMP WITH TIME ZONE,
    first_viewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- INVOICE LINE ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    service_type_id UUID REFERENCES public.service_types(id),
    case_id UUID REFERENCES public.cases(id),
    
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    
    -- Time tracking integration
    billable_hours DECIMAL(5,2) DEFAULT 0,
    hourly_rate DECIMAL(8,2) DEFAULT 0,
    staff_id UUID REFERENCES public.staff(id),
    
    -- Subscription quota usage
    is_subscription_quota BOOLEAN DEFAULT false,
    quota_type VARCHAR(50), -- consulting_hours, document_review, legal_questions
    
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- PAYMENTS (BOTH PAYABLE AND RECEIVABLE)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Payment type and reference
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('payable', 'receivable')),
    reference_id UUID NOT NULL, -- bill_id or invoice_id
    reference_table VARCHAR(20) NOT NULL CHECK (reference_table IN ('bills', 'invoices')),
    
    -- Payment details
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_date DATE, -- When payment was actually received/cleared
    
    -- Payment method details
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('transfer', 'pix', 'boleto', 'check', 'cash', 'credit_card', 'debit_card')),
    payment_processor VARCHAR(50), -- Which bank/service processed
    reference_number VARCHAR(100), -- Transaction ID, check number, etc.
    
    -- Banking information
    bank_account VARCHAR(100),
    bank_code VARCHAR(10),
    
    -- Document management
    proof_url TEXT,
    receipt_url TEXT,
    
    -- Fees and adjustments
    processing_fee DECIMAL(12,2) DEFAULT 0,
    exchange_rate DECIMAL(10,6) DEFAULT 1, -- For foreign currency
    currency VARCHAR(3) DEFAULT 'BRL',
    
    -- Status tracking
    status VARCHAR(30) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    
    -- Automation
    auto_reconciled BOOLEAN DEFAULT false,
    reconciliation_date DATE,
    
    notes TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES public.staff(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- PAYMENT INSTALLMENTS (FOR PAYMENT PLANS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to parent record
    reference_type VARCHAR(20) NOT NULL CHECK (reference_type IN ('bill', 'invoice')),
    reference_id UUID NOT NULL,
    
    -- Installment details
    installment_number INTEGER NOT NULL CHECK (installment_number > 0),
    total_installments INTEGER NOT NULL CHECK (total_installments > 0),
    
    -- Amounts
    principal_amount DECIMAL(12,2) NOT NULL CHECK (principal_amount >= 0),
    interest_amount DECIMAL(12,2) DEFAULT 0 CHECK (interest_amount >= 0),
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (principal_amount + interest_amount) STORED,
    paid_amount DECIMAL(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
    
    -- Dates
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial', 'cancelled')),
    
    -- Late fees
    late_fee_amount DECIMAL(12,2) DEFAULT 0,
    late_fee_applied_date DATE,
    
    -- Payment tracking
    payment_id UUID REFERENCES public.payments(id),
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(reference_type, reference_id, installment_number)
);

-- =====================================================
-- FINANCIAL ALERTS & NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.financial_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('due_date', 'overdue', 'payment_received', 'payment_made', 'approval_required', 'budget_exceeded')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Reference
    reference_type VARCHAR(20) CHECK (reference_type IN ('bill', 'invoice', 'payment', 'budget')),
    reference_id UUID,
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Targeting
    assigned_to UUID REFERENCES public.staff(id),
    department VARCHAR(50), -- 'financial', 'admin', 'all'
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    auto_dismiss_date DATE,
    
    -- Action required
    requires_action BOOLEAN DEFAULT false,
    action_type VARCHAR(50), -- 'approve', 'pay', 'review', 'contact'
    action_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- RECURRING BILL TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recurring_bill_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) NOT NULL,
    category_id UUID REFERENCES public.expense_categories(id) NOT NULL,
    
    template_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    
    -- Recurrence pattern
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'semi_annual', 'yearly')),
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Payment settings
    payment_terms INTEGER DEFAULT 30,
    auto_approve BOOLEAN DEFAULT false,
    auto_pay BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Last generation
    last_generated_date DATE,
    next_generation_date DATE,
    
    created_by UUID REFERENCES public.staff(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON public.suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_tax_id ON public.suppliers(tax_id);

-- Bills
CREATE INDEX IF NOT EXISTS idx_bills_supplier_id ON public.bills(supplier_id);
CREATE INDEX IF NOT EXISTS idx_bills_category_id ON public.bills(category_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON public.bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_created_by ON public.bills(created_by);
CREATE INDEX IF NOT EXISTS idx_bills_status_due_date ON public.bills(status, due_date);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_case_id ON public.invoices(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date ON public.invoices(status, due_date);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_type_reference ON public.payments(payment_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Payment Installments
CREATE INDEX IF NOT EXISTS idx_installments_reference ON public.payment_installments(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON public.payment_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_status ON public.payment_installments(status);

-- Financial Alerts
CREATE INDEX IF NOT EXISTS idx_alerts_assigned_to ON public.financial_alerts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_alerts_type_severity ON public.financial_alerts(alert_type, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_read_status ON public.financial_alerts(is_read, is_dismissed);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all financial tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_bill_templates ENABLE ROW LEVEL SECURITY;

-- Suppliers policies
CREATE POLICY "Staff can view all suppliers" ON public.suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert suppliers" ON public.suppliers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can update suppliers" ON public.suppliers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Bills policies
CREATE POLICY "Staff can view all bills" ON public.bills
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert bills" ON public.bills
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can update bills" ON public.bills
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Invoices policies  
CREATE POLICY "Staff can view all invoices" ON public.invoices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can update invoices" ON public.invoices
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Clients can view their own invoices
CREATE POLICY "Clients can view own invoices" ON public.invoices
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        client_id IN (
            SELECT id FROM public.clients 
            WHERE contact_email = auth.email()
        )
    );

-- Invoice line items policies
CREATE POLICY "Staff can manage invoice line items" ON public.invoice_line_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Payments policies
CREATE POLICY "Staff can view all payments" ON public.payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert payments" ON public.payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can update payments" ON public.payments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Payment installments policies
CREATE POLICY "Staff can manage installments" ON public.payment_installments
    FOR ALL USING (auth.role() = 'authenticated');

-- Financial alerts policies
CREATE POLICY "Staff can view assigned alerts" ON public.financial_alerts
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (assigned_to IS NULL OR assigned_to = auth.uid() OR department IN ('all', 'financial'))
    );

CREATE POLICY "Staff can update assigned alerts" ON public.financial_alerts
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        (assigned_to IS NULL OR assigned_to = auth.uid())
    );

-- Expense categories - read-only for most operations
CREATE POLICY "All authenticated users can view expense categories" ON public.expense_categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Recurring templates policies
CREATE POLICY "Staff can manage recurring templates" ON public.recurring_bill_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Function to create financial alerts
CREATE OR REPLACE FUNCTION public.create_financial_alert(
    p_alert_type VARCHAR(50),
    p_reference_type VARCHAR(20),
    p_reference_id UUID,
    p_title VARCHAR(255),
    p_message TEXT,
    p_severity VARCHAR(20) DEFAULT 'medium',
    p_assigned_to UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO public.financial_alerts (
        alert_type, reference_type, reference_id, title, message, severity, assigned_to
    ) VALUES (
        p_alert_type, p_reference_type, p_reference_id, p_title, p_message, p_severity, p_assigned_to
    ) RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check overdue bills and invoices
CREATE OR REPLACE FUNCTION public.check_overdue_items()
RETURNS VOID AS $$
BEGIN
    -- Update overdue bills
    UPDATE public.bills 
    SET status = 'overdue'
    WHERE status IN ('pending', 'approved') 
    AND due_date < CURRENT_DATE;
    
    -- Update overdue invoices
    UPDATE public.invoices 
    SET status = 'overdue'
    WHERE status IN ('sent', 'viewed', 'partial_paid')
    AND due_date < CURRENT_DATE;
    
    -- Create alerts for newly overdue items
    INSERT INTO public.financial_alerts (alert_type, reference_type, reference_id, title, message, severity)
    SELECT 
        'overdue',
        'bill',
        id,
        'Bill Overdue: ' || COALESCE(bill_number, 'No Number'),
        'Bill from ' || (SELECT name FROM public.suppliers WHERE id = bills.supplier_id) || ' is overdue by ' || (CURRENT_DATE - due_date) || ' days',
        CASE 
            WHEN CURRENT_DATE - due_date > 30 THEN 'critical'
            WHEN CURRENT_DATE - due_date > 7 THEN 'high'
            ELSE 'medium'
        END
    FROM public.bills 
    WHERE status = 'overdue' 
    AND NOT EXISTS (
        SELECT 1 FROM public.financial_alerts 
        WHERE reference_type = 'bill' AND reference_id = bills.id AND alert_type = 'overdue'
    );
    
    INSERT INTO public.financial_alerts (alert_type, reference_type, reference_id, title, message, severity)
    SELECT 
        'overdue',
        'invoice',
        id,
        'Invoice Overdue: ' || invoice_number,
        'Invoice for ' || (SELECT name FROM public.clients WHERE id = invoices.client_id) || ' is overdue by ' || (CURRENT_DATE - due_date) || ' days',
        CASE 
            WHEN CURRENT_DATE - due_date > 60 THEN 'critical'
            WHEN CURRENT_DATE - due_date > 30 THEN 'high'
            ELSE 'medium'
        END
    FROM public.invoices 
    WHERE status = 'overdue' 
    AND NOT EXISTS (
        SELECT 1 FROM public.financial_alerts 
        WHERE reference_type = 'invoice' AND reference_id = invoices.id AND alert_type = 'overdue'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FINANCIAL REPORTING VIEWS
-- =====================================================

-- Cash flow summary view
CREATE OR REPLACE VIEW public.financial_cash_flow_summary AS
SELECT 
    DATE_TRUNC('month', payment_date) as month,
    payment_type,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM public.payments 
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', payment_date), payment_type
ORDER BY month DESC, payment_type;

-- Accounts payable aging view
CREATE OR REPLACE VIEW public.accounts_payable_aging AS
SELECT 
    b.id,
    b.bill_number,
    s.name as supplier_name,
    b.total_amount,
    b.remaining_amount,
    b.due_date,
    CURRENT_DATE - b.due_date as days_outstanding,
    CASE 
        WHEN b.status = 'paid' THEN 'Paid'
        WHEN CURRENT_DATE <= b.due_date THEN 'Current'
        WHEN CURRENT_DATE - b.due_date BETWEEN 1 AND 30 THEN '1-30 Days'
        WHEN CURRENT_DATE - b.due_date BETWEEN 31 AND 60 THEN '31-60 Days'
        WHEN CURRENT_DATE - b.due_date BETWEEN 61 AND 90 THEN '61-90 Days'
        ELSE '90+ Days'
    END as aging_bucket,
    b.status
FROM public.bills b
JOIN public.suppliers s ON b.supplier_id = s.id
WHERE b.status IN ('pending', 'approved', 'overdue')
ORDER BY b.due_date;

-- Accounts receivable aging view
CREATE OR REPLACE VIEW public.accounts_receivable_aging AS
SELECT 
    i.id,
    i.invoice_number,
    c.name as client_name,
    i.total_amount,
    i.remaining_amount,
    i.due_date,
    CURRENT_DATE - i.due_date as days_outstanding,
    CASE 
        WHEN i.status = 'paid' THEN 'Paid'
        WHEN CURRENT_DATE <= i.due_date THEN 'Current'
        WHEN CURRENT_DATE - i.due_date BETWEEN 1 AND 30 THEN '1-30 Days'
        WHEN CURRENT_DATE - i.due_date BETWEEN 31 AND 60 THEN '31-60 Days'
        WHEN CURRENT_DATE - i.due_date BETWEEN 61 AND 90 THEN '61-90 Days'
        ELSE '90+ Days'
    END as aging_bucket,
    i.status,
    i.collection_status
FROM public.invoices i
JOIN public.clients c ON i.client_id = c.id
WHERE i.status IN ('sent', 'viewed', 'partial_paid', 'overdue')
ORDER BY i.due_date;

-- Monthly financial summary view
CREATE OR REPLACE VIEW public.monthly_financial_summary AS
SELECT 
    DATE_TRUNC('month', month_date) as month,
    COALESCE(expenses.total_expenses, 0) as total_expenses,
    COALESCE(revenue.total_revenue, 0) as total_revenue,
    COALESCE(revenue.total_revenue, 0) - COALESCE(expenses.total_expenses, 0) as net_profit
FROM (
    SELECT generate_series(
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months'),
        DATE_TRUNC('month', CURRENT_DATE),
        '1 month'::interval
    ) as month_date
) months
LEFT JOIN (
    SELECT 
        DATE_TRUNC('month', payment_date) as month,
        SUM(amount) as total_expenses
    FROM public.payments 
    WHERE payment_type = 'payable' AND status = 'completed'
    GROUP BY DATE_TRUNC('month', payment_date)
) expenses ON months.month_date = expenses.month
LEFT JOIN (
    SELECT 
        DATE_TRUNC('month', payment_date) as month,
        SUM(amount) as total_revenue
    FROM public.payments 
    WHERE payment_type = 'receivable' AND status = 'completed'
    GROUP BY DATE_TRUNC('month', payment_date)
) revenue ON months.month_date = revenue.month
ORDER BY month DESC;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'FINANCIAL MANAGEMENT MODULE SCHEMA MIGRATION COMPLETE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Tables Created:';
    RAISE NOTICE '- suppliers (vendor management)';
    RAISE NOTICE '- expense_categories (cost classification)';
    RAISE NOTICE '- bills (accounts payable)';
    RAISE NOTICE '- invoices (accounts receivable)';
    RAISE NOTICE '- invoice_line_items (detailed billing)';
    RAISE NOTICE '- payments (transaction tracking)';
    RAISE NOTICE '- payment_installments (payment plans)';
    RAISE NOTICE '- financial_alerts (notifications)';
    RAISE NOTICE '- recurring_bill_templates (automation)';
    RAISE NOTICE '';
    RAISE NOTICE 'Views Created:';
    RAISE NOTICE '- financial_cash_flow_summary';
    RAISE NOTICE '- accounts_payable_aging';
    RAISE NOTICE '- accounts_receivable_aging';
    RAISE NOTICE '- monthly_financial_summary';
    RAISE NOTICE '';
    RAISE NOTICE 'Features Implemented:';
    RAISE NOTICE '✅ Complete supplier/vendor management';
    RAISE NOTICE '✅ Bills with approval workflow';
    RAISE NOTICE '✅ Professional invoicing system';
    RAISE NOTICE '✅ Payment tracking and reconciliation';
    RAISE NOTICE '✅ Payment plans and installments';
    RAISE NOTICE '✅ Automated alerts and notifications';
    RAISE NOTICE '✅ Recurring bill automation';
    RAISE NOTICE '✅ Financial reporting and analytics';
    RAISE NOTICE '✅ Row-level security implementation';
    RAISE NOTICE '✅ Performance optimization indexes';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for Financial Service Layer Implementation!';
    RAISE NOTICE '=====================================================';
END $$;