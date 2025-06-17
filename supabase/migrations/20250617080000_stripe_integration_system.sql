-- Stripe Integration & Payment System Migration
-- Brazilian payment compliance with subscription billing and case payments

-- Stripe configuration settings
CREATE TABLE stripe_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Stripe API configuration
    stripe_public_key TEXT,
    stripe_secret_key TEXT, -- Should be encrypted in production
    stripe_webhook_secret TEXT, -- Should be encrypted in production
    
    -- Environment settings
    environment VARCHAR(20) DEFAULT 'sandbox', -- 'sandbox', 'production'
    
    -- Brazilian payment settings
    accept_pix BOOLEAN DEFAULT true,
    accept_boleto BOOLEAN DEFAULT true,
    accept_credit_card BOOLEAN DEFAULT true,
    accept_bank_transfer BOOLEAN DEFAULT false,
    
    -- Default currency and locale
    default_currency VARCHAR(3) DEFAULT 'BRL',
    locale VARCHAR(10) DEFAULT 'pt-BR',
    
    -- Business settings
    company_name VARCHAR(255),
    company_tax_id VARCHAR(20), -- CNPJ
    
    -- Webhook and callback URLs
    success_url TEXT,
    cancel_url TEXT,
    webhook_endpoint TEXT,
    
    -- Compliance settings
    send_receipt_emails BOOLEAN DEFAULT true,
    collect_billing_address BOOLEAN DEFAULT true,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES admin_users(id)
);

-- Stripe products (subscription plans and one-time services)
CREATE TABLE stripe_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Stripe identifiers
    stripe_product_id VARCHAR(100) UNIQUE NOT NULL,
    stripe_price_id VARCHAR(100), -- For subscriptions
    
    -- Product information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    product_type VARCHAR(50) NOT NULL, -- 'subscription', 'one_time', 'consultation', 'document'
    
    -- Pricing
    price_amount INTEGER NOT NULL, -- in cents (centavos)
    currency VARCHAR(3) DEFAULT 'BRL',
    billing_interval VARCHAR(20), -- 'month', 'year', 'week', null for one-time
    billing_interval_count INTEGER DEFAULT 1,
    
    -- Legal service specifics
    service_category VARCHAR(100), -- 'legal_consulting', 'document_review', 'litigation_support'
    practice_area VARCHAR(100), -- 'labor', 'civil', 'commercial', 'criminal'
    
    -- Features and limits
    features JSONB DEFAULT '[]'::jsonb, -- ["unlimited_consultations", "document_templates", "priority_support"]
    limits JSONB DEFAULT '{}'::jsonb, -- {"consultations_per_month": 10, "documents_per_month": 5}
    
    -- Brazilian tax settings
    tax_rate DECIMAL(5,4) DEFAULT 0.0000, -- ISS rate for services
    tax_description VARCHAR(100),
    
    -- Status and organization
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id)
);

-- Customer payment methods and Stripe customers
CREATE TABLE stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Local references
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Stripe identifiers
    stripe_customer_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Customer information
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    
    -- Brazilian identification
    cpf_cnpj VARCHAR(20),
    customer_type VARCHAR(20) DEFAULT 'individual', -- 'individual', 'business'
    
    -- Billing address
    address_line1 TEXT,
    address_line2 TEXT,
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_postal_code VARCHAR(20),
    address_country VARCHAR(2) DEFAULT 'BR',
    
    -- Default payment method
    default_payment_method_id VARCHAR(100),
    
    -- Brazilian payment preferences
    preferred_payment_method VARCHAR(50), -- 'pix', 'boleto', 'credit_card', 'bank_transfer'
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions management
CREATE TABLE stripe_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Stripe identifiers
    stripe_subscription_id VARCHAR(100) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(100) NOT NULL,
    stripe_price_id VARCHAR(100) NOT NULL,
    
    -- Local references
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    product_id UUID REFERENCES stripe_products(id),
    
    -- Subscription details
    subscription_status VARCHAR(50) NOT NULL, -- 'active', 'past_due', 'canceled', 'unpaid', 'trialing'
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    
    -- Pricing
    amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(3) DEFAULT 'BRL',
    billing_interval VARCHAR(20) NOT NULL,
    billing_interval_count INTEGER DEFAULT 1,
    
    -- Payment collection
    collection_method VARCHAR(20) DEFAULT 'charge_automatically', -- 'charge_automatically', 'send_invoice'
    
    -- Brazilian specifics
    next_payment_date DATE,
    payment_method_types JSONB DEFAULT '["card", "pix", "boleto"]'::jsonb,
    
    -- Usage tracking
    usage_data JSONB DEFAULT '{}'::jsonb, -- Track usage for metered billing
    
    -- Discounts and adjustments
    discount_percent DECIMAL(5,2),
    discount_amount INTEGER, -- in cents
    discount_description VARCHAR(255),
    discount_end_date DATE,
    
    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason VARCHAR(100),
    cancellation_comment TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment intents and transactions
CREATE TABLE stripe_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Stripe identifiers
    stripe_payment_intent_id VARCHAR(100) UNIQUE NOT NULL,
    stripe_charge_id VARCHAR(100),
    stripe_customer_id VARCHAR(100),
    
    -- Local references
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES stripe_subscriptions(id) ON DELETE SET NULL,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    invoice_id UUID, -- Reference to internal invoicing system
    
    -- Payment details
    amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(3) DEFAULT 'BRL',
    payment_status VARCHAR(50) NOT NULL, -- 'succeeded', 'pending', 'failed', 'canceled'
    payment_method VARCHAR(50), -- 'pix', 'boleto', 'credit_card', 'bank_transfer'
    
    -- Brazilian payment specifics
    pix_qr_code TEXT, -- PIX QR code for manual payments
    pix_code TEXT, -- PIX copy-paste code
    boleto_url TEXT, -- Boleto PDF URL
    boleto_barcode TEXT, -- Boleto barcode
    boleto_due_date DATE, -- Boleto expiration date
    
    -- Payment timing
    payment_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_confirmed_at TIMESTAMP WITH TIME ZONE,
    payment_failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Fees and taxes
    stripe_fee INTEGER, -- Stripe fee in cents
    tax_amount INTEGER, -- Tax amount in cents (ISS)
    net_amount INTEGER, -- Net amount received
    
    -- Payment description
    description TEXT,
    payment_type VARCHAR(50), -- 'subscription', 'one_time', 'case_payment', 'consultation'
    
    -- Failure handling
    failure_code VARCHAR(100),
    failure_message TEXT,
    failure_reason VARCHAR(100),
    
    -- Receipt and documentation
    receipt_email VARCHAR(255),
    receipt_number VARCHAR(100),
    receipt_url TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events tracking
CREATE TABLE stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Stripe event details
    stripe_event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    
    -- Processing status
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_attempts INTEGER DEFAULT 0,
    last_processing_error TEXT,
    
    -- Event metadata
    api_version VARCHAR(20),
    request_id VARCHAR(100),
    
    -- Timestamps
    event_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brazilian tax documentation
CREATE TABLE payment_tax_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Payment reference
    payment_id UUID REFERENCES stripe_payments(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Document details
    document_type VARCHAR(50) NOT NULL, -- 'iss_invoice', 'service_receipt', 'tax_withholding'
    document_number VARCHAR(100),
    document_url TEXT,
    
    -- Tax information
    tax_amount INTEGER, -- in cents
    tax_rate DECIMAL(5,4),
    tax_description VARCHAR(255),
    withholding_amount INTEGER, -- in cents
    
    -- Brazilian compliance
    service_code VARCHAR(20), -- Código do serviço (ISS)
    issqn_amount INTEGER, -- ISSQN amount in cents
    
    -- Status
    issued_at TIMESTAMP WITH TIME ZONE,
    sent_to_client BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id)
);

-- Indexes for performance
CREATE INDEX idx_stripe_customers_client ON stripe_customers(client_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

CREATE INDEX idx_stripe_subscriptions_client ON stripe_subscriptions(client_id);
CREATE INDEX idx_stripe_subscriptions_stripe_id ON stripe_subscriptions(stripe_subscription_id);
CREATE INDEX idx_stripe_subscriptions_status ON stripe_subscriptions(subscription_status);
CREATE INDEX idx_stripe_subscriptions_period ON stripe_subscriptions(current_period_end);

CREATE INDEX idx_stripe_payments_client ON stripe_payments(client_id);
CREATE INDEX idx_stripe_payments_intent ON stripe_payments(stripe_payment_intent_id);
CREATE INDEX idx_stripe_payments_status ON stripe_payments(payment_status);
CREATE INDEX idx_stripe_payments_created ON stripe_payments(payment_created_at);
CREATE INDEX idx_stripe_payments_type ON stripe_payments(payment_type);

CREATE INDEX idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX idx_stripe_webhook_events_created ON stripe_webhook_events(event_created_at);

-- RLS Policies
ALTER TABLE stripe_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_tax_documents ENABLE ROW LEVEL SECURITY;

-- Admin access to all Stripe tables
CREATE POLICY "Admin access to stripe settings" ON stripe_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Admin access to stripe products" ON stripe_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Everyone can view active products" ON stripe_products
    FOR SELECT USING (is_active = true);

-- Customer access to their own data
CREATE POLICY "Customers can view own stripe data" ON stripe_customers
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM clients WHERE auth.uid() = ANY(
                SELECT unnest(ARRAY[auth.uid()])
            )
        ) OR
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Staff can view assigned clients stripe data" ON stripe_customers
    FOR SELECT USING (
        client_id IN (
            SELECT sca.client_id FROM staff_client_assignments sca
            WHERE sca.staff_id = auth.uid() AND sca.is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

-- Similar policies for subscriptions and payments
CREATE POLICY "Clients can view own subscriptions" ON stripe_subscriptions
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM clients WHERE auth.uid() = ANY(
                SELECT unnest(ARRAY[auth.uid()])
            )
        ) OR
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Staff can view assigned clients subscriptions" ON stripe_subscriptions
    FOR SELECT USING (
        client_id IN (
            SELECT sca.client_id FROM staff_client_assignments sca
            WHERE sca.staff_id = auth.uid() AND sca.is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Clients can view own payments" ON stripe_payments
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM clients WHERE auth.uid() = ANY(
                SELECT unnest(ARRAY[auth.uid()])
            )
        ) OR
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Staff can view assigned clients payments" ON stripe_payments
    FOR SELECT USING (
        client_id IN (
            SELECT sca.client_id FROM staff_client_assignments sca
            WHERE sca.staff_id = auth.uid() AND sca.is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

-- Admin only for webhook events and tax documents
CREATE POLICY "Admin access to webhook events" ON stripe_webhook_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Admin access to tax documents" ON payment_tax_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

-- Functions for Stripe integration
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update subscription status based on Stripe webhook
    NEW.updated_at := NOW();
    
    -- Handle subscription cancellation
    IF NEW.subscription_status = 'canceled' AND OLD.subscription_status != 'canceled' THEN
        NEW.canceled_at := NOW();
    END IF;
    
    -- Handle subscription reactivation
    IF NEW.subscription_status = 'active' AND OLD.subscription_status = 'canceled' THEN
        NEW.canceled_at := NULL;
        NEW.cancel_at_period_end := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_status_trigger
    BEFORE UPDATE ON stripe_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_status();

CREATE OR REPLACE FUNCTION process_payment_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update payment status and timing
    NEW.updated_at := NOW();
    
    -- Set confirmation timestamp
    IF NEW.payment_status = 'succeeded' AND OLD.payment_status != 'succeeded' THEN
        NEW.payment_confirmed_at := NOW();
        
        -- Calculate net amount (subtract fees and taxes)
        NEW.net_amount := NEW.amount - COALESCE(NEW.stripe_fee, 0) - COALESCE(NEW.tax_amount, 0);
    END IF;
    
    -- Set failure timestamp
    IF NEW.payment_status = 'failed' AND OLD.payment_status != 'failed' THEN
        NEW.payment_failed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_confirmation_trigger
    BEFORE UPDATE ON stripe_payments
    FOR EACH ROW
    EXECUTE FUNCTION process_payment_confirmation();

-- Function to get active subscription for client
CREATE OR REPLACE FUNCTION get_client_active_subscription(client_uuid UUID)
RETURNS TABLE(
    subscription_id UUID,
    stripe_subscription_id VARCHAR(100),
    product_name VARCHAR(255),
    amount INTEGER,
    current_period_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.id,
        ss.stripe_subscription_id,
        sp.name,
        ss.amount,
        ss.current_period_end,
        ss.subscription_status
    FROM stripe_subscriptions ss
    JOIN stripe_products sp ON ss.product_id = sp.id
    WHERE ss.client_id = client_uuid
    AND ss.subscription_status IN ('active', 'trialing', 'past_due')
    ORDER BY ss.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate monthly recurring revenue (MRR)
CREATE OR REPLACE FUNCTION calculate_mrr()
RETURNS DECIMAL AS $$
DECLARE
    total_mrr DECIMAL := 0;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN billing_interval = 'month' THEN amount / 100.0
            WHEN billing_interval = 'year' THEN (amount / 100.0) / 12
            WHEN billing_interval = 'week' THEN (amount / 100.0) * 4.33
            ELSE 0
        END
    ), 0) INTO total_mrr
    FROM stripe_subscriptions ss
    JOIN stripe_products sp ON ss.product_id = sp.id
    WHERE ss.subscription_status IN ('active', 'trialing');
    
    RETURN total_mrr;
END;
$$ LANGUAGE plpgsql;

-- Insert default Stripe settings
INSERT INTO stripe_settings (
    environment,
    default_currency,
    locale,
    accept_pix,
    accept_boleto,
    accept_credit_card,
    send_receipt_emails,
    collect_billing_address
) VALUES (
    'sandbox',
    'BRL',
    'pt-BR',
    true,
    true,
    true,
    true,
    true
);

-- Insert sample subscription products
INSERT INTO stripe_products (
    stripe_product_id,
    name,
    description,
    product_type,
    price_amount,
    billing_interval,
    service_category,
    practice_area,
    features,
    limits,
    created_by
) VALUES 
(
    'prod_consultoria_basica',
    'Consultoria Jurídica Básica',
    'Plano básico de consultoria jurídica mensal',
    'subscription',
    29900, -- R$ 299,00
    'month',
    'legal_consulting',
    'civil',
    '["consultations_unlimited", "email_support", "document_templates"]'::jsonb,
    '{"priority_support": false, "phone_support": false}'::jsonb,
    (SELECT id FROM admin_users LIMIT 1)
),
(
    'prod_consultoria_premium',
    'Consultoria Jurídica Premium',
    'Plano premium com suporte prioritário e consultoria especializada',
    'subscription',
    59900, -- R$ 599,00
    'month',
    'legal_consulting',
    'commercial',
    '["consultations_unlimited", "priority_support", "phone_support", "document_review", "contract_analysis"]'::jsonb,
    '{"response_time_hours": 4, "dedicated_lawyer": true}'::jsonb,
    (SELECT id FROM admin_users LIMIT 1)
),
(
    'prod_documento_unico',
    'Elaboração de Documento',
    'Serviço avulso para elaboração de documentos jurídicos',
    'one_time',
    15000, -- R$ 150,00
    NULL,
    'document_review',
    'civil',
    '["custom_document", "legal_review", "lawyer_signature"]'::jsonb,
    '{"revisions": 2, "delivery_days": 5}'::jsonb,
    (SELECT id FROM admin_users LIMIT 1)
);

COMMENT ON TABLE stripe_settings IS 'Stripe API configuration and Brazilian payment settings';
COMMENT ON TABLE stripe_products IS 'Subscription plans and one-time legal services';
COMMENT ON TABLE stripe_customers IS 'Stripe customer data linked to clients';
COMMENT ON TABLE stripe_subscriptions IS 'Active and historical subscription data';
COMMENT ON TABLE stripe_payments IS 'Payment transactions with Brazilian payment methods';
COMMENT ON TABLE stripe_webhook_events IS 'Stripe webhook event processing log';
COMMENT ON TABLE payment_tax_documents IS 'Brazilian tax compliance documentation';