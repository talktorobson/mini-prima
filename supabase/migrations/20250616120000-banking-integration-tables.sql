-- Banking Integration Tables Migration
-- Add comprehensive banking tables for PIX and Boleto integration
-- Created: 2025-06-16

-- PIX Transactions Table
CREATE TABLE public.pix_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    
    -- PIX Transaction Details
    txid VARCHAR(35) UNIQUE NOT NULL,                     -- Santander transaction ID
    end_to_end_id VARCHAR(32),                           -- E2E identification
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    
    -- PIX Key Information
    pix_key VARCHAR(77),                                 -- PIX key used
    pix_key_type VARCHAR(20),                           -- phone, email, cpf, cnpj, random
    
    -- QR Code Information
    qr_code TEXT,                                        -- Base64 QR code image
    qr_code_text TEXT,                                   -- PIX copy/paste code
    br_code TEXT,                                        -- PIX payload
    
    -- Status and Timing
    status VARCHAR(20) DEFAULT 'pending',                -- pending, paid, expired, cancelled
    expiration_date TIMESTAMP WITH TIME ZONE,
    
    -- Payment Information
    paid_at TIMESTAMP WITH TIME ZONE,
    payer_name VARCHAR(255),
    payer_document VARCHAR(18),
    payer_bank VARCHAR(3),                               -- ISPB code
    
    -- Webhook Data
    webhook_received_at TIMESTAMP WITH TIME ZONE,
    webhook_data JSONB,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Boletos Table
CREATE TABLE public.boletos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    
    -- Boleto Identification
    nosso_numero VARCHAR(20) UNIQUE NOT NULL,            -- Our number (Santander)
    document_number VARCHAR(100) NOT NULL,               -- Document number
    
    -- Payment Details
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    
    -- Payer Information
    payer_name VARCHAR(255) NOT NULL,
    payer_document VARCHAR(18) NOT NULL,
    payer_address JSONB NOT NULL,                        -- Complete address object
    
    -- Boleto Configuration
    accept VARCHAR(1) DEFAULT 'S',                       -- S or N
    species VARCHAR(2) DEFAULT 'DM',                     -- Document species
    instructions TEXT[],                                 -- Instructions array
    demonstration TEXT[],                                -- Demonstration array
    
    -- Interest and Fees
    interest_config JSONB,                               -- Interest configuration
    fine_config JSONB,                                   -- Fine configuration  
    discount_config JSONB,                               -- Discount configuration
    
    -- Boleto Codes
    barcode VARCHAR(44) NOT NULL,                        -- Barcode
    digitable_line VARCHAR(54) NOT NULL,                 -- Digitable line
    
    -- Status and URLs
    status VARCHAR(20) DEFAULT 'registered',             -- registered, paid, cancelled, expired
    pdf_url TEXT,                                        -- PDF download URL
    
    -- Payment Information
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_amount DECIMAL(12,2),
    payment_method VARCHAR(50),
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment Reconciliation Table
CREATE TABLE public.payment_reconciliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Payment Reference
    payment_type VARCHAR(10) NOT NULL,                   -- 'pix' or 'boleto'
    payment_id UUID NOT NULL,                            -- References pix_transactions.id or boletos.id
    
    -- Invoice/Financial Record Linking
    invoice_id UUID REFERENCES public.invoices(id),
    financial_record_id UUID REFERENCES public.financial_records(id),
    
    -- Reconciliation Details
    reconciliation_status VARCHAR(20) DEFAULT 'pending', -- pending, matched, manual, failed
    matched_amount DECIMAL(12,2),
    difference_amount DECIMAL(12,2),
    
    -- Matching Information
    matched_by UUID REFERENCES auth.users(id),
    matched_at TIMESTAMP WITH TIME ZONE,
    matching_method VARCHAR(50),                         -- auto, manual, partial
    
    -- Notes and Metadata
    reconciliation_notes TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Banking Webhooks Table
CREATE TABLE public.banking_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Webhook Details
    webhook_type VARCHAR(20) NOT NULL,                   -- 'pix', 'boleto'
    source VARCHAR(50) NOT NULL,                         -- 'santander'
    
    -- Request Information
    webhook_id VARCHAR(100),                             -- External webhook ID
    signature VARCHAR(500),                              -- Webhook signature
    headers JSONB,                                       -- Request headers
    payload JSONB NOT NULL,                              -- Full payload
    
    -- Processing Status
    status VARCHAR(20) DEFAULT 'received',               -- received, processed, failed, ignored
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Related Records
    transaction_id UUID,                                 -- pix_transactions.id or boletos.id
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment Methods Table
CREATE TABLE public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Method Details
    method_type VARCHAR(20) NOT NULL,                    -- 'pix', 'boleto', 'credit_card', 'bank_transfer'
    method_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Configuration
    configuration JSONB,                                 -- Method-specific settings
    fees JSONB,                                          -- Fee structure
    
    -- Limits and Rules
    min_amount DECIMAL(12,2),
    max_amount DECIMAL(12,2),
    processing_time VARCHAR(100),                        -- Human readable time
    
    -- Display Information
    display_name VARCHAR(100),
    description TEXT,
    icon_url TEXT,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transaction Logs Table
CREATE TABLE public.transaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction Reference
    transaction_type VARCHAR(20) NOT NULL,               -- 'pix', 'boleto'
    transaction_id UUID NOT NULL,
    
    -- Log Entry Details
    action VARCHAR(50) NOT NULL,                         -- created, updated, paid, cancelled, etc.
    status_from VARCHAR(20),
    status_to VARCHAR(20),
    
    -- Context Information
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    
    -- Data Changes
    changes JSONB,                                       -- What changed
    metadata JSONB,                                      -- Additional context
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for PIX Transactions
CREATE POLICY "Users can view their own PIX transactions" ON public.pix_transactions
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM public.clients WHERE id = client_id) OR
        public.is_admin_or_staff()
    );

CREATE POLICY "Staff can create PIX transactions" ON public.pix_transactions
    FOR INSERT WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "Staff can update PIX transactions" ON public.pix_transactions
    FOR UPDATE USING (public.is_admin_or_staff());

-- RLS Policies for Boletos
CREATE POLICY "Users can view their own boletos" ON public.boletos
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM public.clients WHERE id = client_id) OR
        public.is_admin_or_staff()
    );

CREATE POLICY "Staff can create boletos" ON public.boletos
    FOR INSERT WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "Staff can update boletos" ON public.boletos
    FOR UPDATE USING (public.is_admin_or_staff());

-- RLS Policies for Payment Reconciliation (Admin/Staff only)
CREATE POLICY "Admin and staff can manage reconciliation" ON public.payment_reconciliation
    FOR ALL USING (public.is_admin_or_staff());

-- RLS Policies for Banking Webhooks (Admin only)
CREATE POLICY "Admin can view banking webhooks" ON public.banking_webhooks
    FOR ALL USING (public.is_admin_user());

-- RLS Policies for Payment Methods (Public read, Admin write)
CREATE POLICY "Everyone can view active payment methods" ON public.payment_methods
    FOR SELECT USING (is_active = true OR public.is_admin_or_staff());

CREATE POLICY "Admin can manage payment methods" ON public.payment_methods
    FOR ALL USING (public.is_admin_user());

-- RLS Policies for Transaction Logs (Admin/Staff read only)
CREATE POLICY "Admin and staff can view transaction logs" ON public.transaction_logs
    FOR SELECT USING (public.is_admin_or_staff());

-- Indexes for Performance
CREATE INDEX idx_pix_transactions_client_id ON public.pix_transactions(client_id);
CREATE INDEX idx_pix_transactions_txid ON public.pix_transactions(txid);
CREATE INDEX idx_pix_transactions_status ON public.pix_transactions(status);
CREATE INDEX idx_pix_transactions_created_at ON public.pix_transactions(created_at);

CREATE INDEX idx_boletos_client_id ON public.boletos(client_id);
CREATE INDEX idx_boletos_nosso_numero ON public.boletos(nosso_numero);
CREATE INDEX idx_boletos_status ON public.boletos(status);
CREATE INDEX idx_boletos_due_date ON public.boletos(due_date);

CREATE INDEX idx_payment_reconciliation_payment_type ON public.payment_reconciliation(payment_type, payment_id);
CREATE INDEX idx_payment_reconciliation_status ON public.payment_reconciliation(reconciliation_status);

CREATE INDEX idx_banking_webhooks_type ON public.banking_webhooks(webhook_type);
CREATE INDEX idx_banking_webhooks_status ON public.banking_webhooks(status);
CREATE INDEX idx_banking_webhooks_created_at ON public.banking_webhooks(created_at);

CREATE INDEX idx_transaction_logs_transaction ON public.transaction_logs(transaction_type, transaction_id);
CREATE INDEX idx_transaction_logs_created_at ON public.transaction_logs(created_at);

-- Triggers for Updated_at
CREATE TRIGGER update_pix_transactions_updated_at
    BEFORE UPDATE ON public.pix_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_boletos_updated_at
    BEFORE UPDATE ON public.boletos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_reconciliation_updated_at
    BEFORE UPDATE ON public.payment_reconciliation
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Default Payment Methods
INSERT INTO public.payment_methods (method_type, method_name, display_name, description, min_amount, max_amount, processing_time, sort_order, configuration) VALUES
('pix', 'pix_instant', 'PIX', 'Pagamento instantâneo disponível 24h', 0.01, 999999.99, 'Instantâneo', 1, '{"instant": true, "available_24h": true}'),
('boleto', 'boleto_bancario', 'Boleto Bancário', 'Boleto tradicional com vencimento', 1.00, 999999.99, '1-3 dias úteis', 2, '{"due_days": 30, "instructions_enabled": true}');

-- Functions for Banking Operations

-- Function to create PIX transaction log
CREATE OR REPLACE FUNCTION public.log_pix_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transaction_logs (
        transaction_type,
        transaction_id,
        action,
        status_from,
        status_to,
        user_id,
        changes
    ) VALUES (
        'pix',
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN TG_OP = 'UPDATE' THEN 'updated'
            WHEN TG_OP = 'DELETE' THEN 'deleted'
        END,
        OLD.status,
        NEW.status,
        auth.uid(),
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create Boleto transaction log
CREATE OR REPLACE FUNCTION public.log_boleto_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transaction_logs (
        transaction_type,
        transaction_id,
        action,
        status_from,
        status_to,
        user_id,
        changes
    ) VALUES (
        'boleto',
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN TG_OP = 'UPDATE' THEN 'updated'
            WHEN TG_OP = 'DELETE' THEN 'deleted'
        END,
        OLD.status,
        NEW.status,
        auth.uid(),
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for transaction logging
CREATE TRIGGER trigger_log_pix_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.pix_transactions
    FOR EACH ROW EXECUTE FUNCTION public.log_pix_transaction_change();

CREATE TRIGGER trigger_log_boleto_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.boletos
    FOR EACH ROW EXECUTE FUNCTION public.log_boleto_change();

-- Function to automatically reconcile payments
CREATE OR REPLACE FUNCTION public.auto_reconcile_payment(
    p_payment_type VARCHAR(10),
    p_payment_id UUID,
    p_amount DECIMAL(12,2),
    p_client_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_invoice_id UUID;
    v_reconciliation_id UUID;
BEGIN
    -- Find matching invoice by client and amount
    SELECT id INTO v_invoice_id
    FROM public.invoices
    WHERE client_id = p_client_id
    AND amount = p_amount
    AND status = 'sent'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Create reconciliation record
    INSERT INTO public.payment_reconciliation (
        payment_type,
        payment_id,
        invoice_id,
        reconciliation_status,
        matched_amount,
        difference_amount,
        matching_method,
        matched_by,
        matched_at
    ) VALUES (
        p_payment_type,
        p_payment_id,
        v_invoice_id,
        CASE WHEN v_invoice_id IS NOT NULL THEN 'matched' ELSE 'pending' END,
        p_amount,
        0,
        'auto',
        auth.uid(),
        now()
    ) RETURNING id INTO v_reconciliation_id;
    
    -- Update invoice status if matched
    IF v_invoice_id IS NOT NULL THEN
        UPDATE public.invoices 
        SET status = 'paid', paid_date = CURRENT_DATE
        WHERE id = v_invoice_id;
    END IF;
    
    RETURN v_reconciliation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on tables
COMMENT ON TABLE public.pix_transactions IS 'PIX instant payment transactions with Santander integration';
COMMENT ON TABLE public.boletos IS 'Traditional Brazilian boleto payments with barcode generation';
COMMENT ON TABLE public.payment_reconciliation IS 'Automatic and manual payment reconciliation with invoices';
COMMENT ON TABLE public.banking_webhooks IS 'Banking webhook events from external payment providers';
COMMENT ON TABLE public.payment_methods IS 'Available payment methods and their configurations';
COMMENT ON TABLE public.transaction_logs IS 'Comprehensive audit log for all payment transactions';