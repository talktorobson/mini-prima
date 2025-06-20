-- Migration 06: Stripe Payment Integration System
-- High Priority: Payment processing with Brazilian compliance
-- Apply sixth: Complete payment processing infrastructure

-- 1. Stripe Settings Table - API configuration and payment methods
CREATE TABLE IF NOT EXISTS stripe_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text' CHECK (setting_type IN ('text', 'boolean', 'number', 'json', 'encrypted')),
    environment VARCHAR(20) DEFAULT 'test' CHECK (environment IN ('test', 'live')),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    last_updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_stripe_settings_updated_by FOREIGN KEY (last_updated_by) REFERENCES staff(id)
);

-- 2. Stripe Products Table - Subscription plans and one-time services
CREATE TABLE IF NOT EXISTS stripe_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_product_id VARCHAR(255) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    product_type VARCHAR(50) DEFAULT 'service' CHECK (product_type IN ('service', 'subscription', 'one_time')),
    service_category VARCHAR(100) CHECK (service_category IN ('labor_law', 'civil_law', 'corporate_law', 'consulting', 'document_review')),
    is_subscription BOOLEAN DEFAULT false,
    billing_interval VARCHAR(20) CHECK (billing_interval IN ('month', 'year', 'week', 'day')),
    billing_interval_count INTEGER DEFAULT 1,
    trial_period_days INTEGER DEFAULT 0,
    pricing_data JSONB NOT NULL, -- {currency, unit_amount, billing_scheme}
    metadata JSONB DEFAULT '{}',
    features JSONB DEFAULT '[]',
    usage_limits JSONB DEFAULT '{}', -- {consulting_hours, document_reviews, etc}
    tax_behavior VARCHAR(20) DEFAULT 'exclusive' CHECK (tax_behavior IN ('inclusive', 'exclusive', 'unspecified')),
    tax_code VARCHAR(50), -- Brazilian tax classification
    is_active BOOLEAN DEFAULT true,
    created_in_stripe_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_stripe_products_created_by FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- 3. Stripe Customers Table - Client payment profiles with Brazilian data
CREATE TABLE IF NOT EXISTS stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE,
    stripe_customer_id VARCHAR(255) NOT NULL UNIQUE,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address JSONB, -- {line1, line2, city, state, postal_code, country}
    tax_ids JSONB DEFAULT '[]', -- [{type: "br_cnpj", value: "12345678000190"}]
    payment_methods JSONB DEFAULT '[]', -- stored payment methods
    default_payment_method VARCHAR(255),
    invoice_settings JSONB DEFAULT '{}',
    preferred_locales JSONB DEFAULT '["pt-BR"]',
    currency VARCHAR(3) DEFAULT 'brl',
    balance INTEGER DEFAULT 0, -- in cents
    delinquent BOOLEAN DEFAULT false,
    tax_exempt VARCHAR(20) DEFAULT 'none' CHECK (tax_exempt IN ('none', 'exempt', 'reverse')),
    created_in_stripe_at TIMESTAMP WITH TIME ZONE,
    last_updated_in_stripe TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_stripe_customers_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 4. Stripe Subscriptions Table - Active subscription management
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_product_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
    billing_cycle_anchor TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancel_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancellation_details JSONB,
    collection_method VARCHAR(20) DEFAULT 'charge_automatically' CHECK (collection_method IN ('charge_automatically', 'send_invoice')),
    payment_behavior VARCHAR(30) DEFAULT 'default_incomplete' CHECK (payment_behavior IN ('allow_incomplete', 'default_incomplete', 'error_if_incomplete')),
    proration_behavior VARCHAR(20) DEFAULT 'create_prorations' CHECK (proration_behavior IN ('create_prorations', 'none', 'always_invoice')),
    billing_thresholds JSONB,
    days_until_due INTEGER,
    discount JSONB, -- applied discounts
    items JSONB NOT NULL, -- subscription items with pricing
    latest_invoice VARCHAR(255),
    pending_setup_intent VARCHAR(255),
    pending_update JSONB,
    schedule VARCHAR(255),
    usage_records JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_in_stripe_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_stripe_subscriptions_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_stripe_subscriptions_customer FOREIGN KEY (stripe_customer_id) REFERENCES stripe_customers(stripe_customer_id),
    CONSTRAINT fk_stripe_subscriptions_product FOREIGN KEY (stripe_product_id) REFERENCES stripe_products(stripe_product_id)
);

-- 5. Stripe Payments Table - Transaction processing with PIX/Boleto support
CREATE TABLE IF NOT EXISTS stripe_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID,
    case_id UUID,
    invoice_id UUID,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(3) DEFAULT 'brl',
    amount_received INTEGER DEFAULT 0,
    amount_capturable INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL CHECK (status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'canceled', 'succeeded')),
    payment_method_types TEXT[] DEFAULT '{"card"}',
    payment_method VARCHAR(255),
    payment_method_details JSONB,
    confirmation_method VARCHAR(20) DEFAULT 'automatic' CHECK (confirmation_method IN ('automatic', 'manual')),
    capture_method VARCHAR(20) DEFAULT 'automatic' CHECK (capture_method IN ('automatic', 'manual')),
    receipt_email VARCHAR(255),
    receipt_url TEXT,
    description TEXT,
    statement_descriptor VARCHAR(50),
    statement_descriptor_suffix VARCHAR(22),
    transfer_data JSONB,
    shipping JSONB,
    charges JSONB DEFAULT '[]',
    next_action JSONB,
    last_payment_error JSONB,
    automatic_payment_methods JSONB,
    cancellation_reason VARCHAR(50) CHECK (cancellation_reason IN ('duplicate', 'fraudulent', 'requested_by_customer', 'abandoned')),
    canceled_at TIMESTAMP WITH TIME ZONE,
    application_fee_amount INTEGER,
    transfer_group VARCHAR(255),
    on_behalf_of VARCHAR(255),
    review VARCHAR(255),
    outcome JSONB,
    source_transfer VARCHAR(255),
    transfer VARCHAR(255),
    application VARCHAR(255),
    refunds JSONB DEFAULT '[]',
    dispute VARCHAR(255),
    payment_intent_created_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_stripe_payments_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_stripe_payments_case FOREIGN KEY (case_id) REFERENCES cases(id),
    CONSTRAINT fk_stripe_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- 6. Stripe Webhook Events Table - Real-time payment notifications
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    api_version VARCHAR(20),
    created_timestamp INTEGER NOT NULL,
    livemode BOOLEAN NOT NULL,
    pending_webhooks INTEGER DEFAULT 0,
    request JSONB,
    event_data JSONB NOT NULL,
    object_id VARCHAR(255),
    object_type VARCHAR(50),
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_attempts INTEGER DEFAULT 0,
    processing_errors JSONB DEFAULT '[]',
    response_status INTEGER,
    response_headers JSONB,
    response_body TEXT,
    related_payment_id UUID,
    related_subscription_id UUID,
    related_customer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_stripe_webhook_events_payment FOREIGN KEY (related_payment_id) REFERENCES stripe_payments(id),
    CONSTRAINT fk_stripe_webhook_events_subscription FOREIGN KEY (related_subscription_id) REFERENCES stripe_subscriptions(id),
    CONSTRAINT fk_stripe_webhook_events_customer FOREIGN KEY (related_customer_id) REFERENCES stripe_customers(id)
);

-- 7. Payment Tax Documents Table - Brazilian tax compliance documentation
CREATE TABLE IF NOT EXISTS payment_tax_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID,
    subscription_id UUID,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('nfse', 'receipt', 'invoice', 'tax_withholding', 'pis_cofins', 'issqn')),
    document_number VARCHAR(100),
    issue_date DATE NOT NULL,
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(12,2),
    gross_amount DECIMAL(12,2) NOT NULL,
    net_amount DECIMAL(12,2) NOT NULL,
    service_code VARCHAR(20), -- Brazilian service classification code
    city_code VARCHAR(10), -- IBGE city code
    cnae_code VARCHAR(20), -- Economic activity classification
    retention_data JSONB, -- tax retention details
    document_url TEXT,
    electronic_signature VARCHAR(255),
    verification_code VARCHAR(100),
    issuer_data JSONB NOT NULL, -- issuer information
    recipient_data JSONB NOT NULL, -- recipient information
    service_description TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'canceled', 'replaced')),
    replaced_by_id UUID,
    cancellation_reason TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_payment_tax_documents_payment FOREIGN KEY (payment_id) REFERENCES stripe_payments(id),
    CONSTRAINT fk_payment_tax_documents_subscription FOREIGN KEY (subscription_id) REFERENCES stripe_subscriptions(id),
    CONSTRAINT fk_payment_tax_documents_replaced_by FOREIGN KEY (replaced_by_id) REFERENCES payment_tax_documents(id),
    CONSTRAINT fk_payment_tax_documents_created_by FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_settings_key ON stripe_settings(setting_key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stripe_products_type ON stripe_products(product_type, is_active);
CREATE INDEX IF NOT EXISTS idx_stripe_products_category ON stripe_products(service_category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stripe_customers_client ON stripe_customers(client_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_client ON stripe_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status, current_period_end);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_id ON stripe_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_client ON stripe_payments(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_case ON stripe_payments(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status ON stripe_payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_intent_id ON stripe_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(event_type, processed);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_object ON stripe_webhook_events(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed, processing_attempts);
CREATE INDEX IF NOT EXISTS idx_payment_tax_documents_payment ON payment_tax_documents(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_tax_documents_type ON payment_tax_documents(document_type, issue_date DESC);

-- Enable Row Level Security
ALTER TABLE stripe_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_tax_documents ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Admins can manage Stripe settings" ON stripe_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can view Stripe products" ON stripe_products
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients can view their Stripe customer data" ON stripe_customers
    FOR SELECT USING (
        client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients can view their subscriptions" ON stripe_subscriptions
    FOR SELECT USING (
        client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients can view their payments" ON stripe_payments
    FOR SELECT USING (
        client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage webhook events" ON stripe_webhook_events
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage tax documents" ON payment_tax_documents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Insert default Stripe settings
INSERT INTO stripe_settings (setting_key, setting_value, setting_type, environment, description, created_at) VALUES
('publishable_key_test', '', 'text', 'test', 'Stripe publishable key for test environment', NOW()),
('secret_key_test', '', 'encrypted', 'test', 'Stripe secret key for test environment', NOW()),
('publishable_key_live', '', 'text', 'live', 'Stripe publishable key for live environment', NOW()),
('secret_key_live', '', 'encrypted', 'live', 'Stripe secret key for live environment', NOW()),
('webhook_endpoint_secret', '', 'encrypted', 'test', 'Webhook endpoint secret for signature verification', NOW()),
('default_currency', 'brl', 'text', 'test', 'Default currency for payments', NOW()),
('payment_methods_enabled', '["card", "boleto", "pix"]', 'json', 'test', 'Enabled payment methods', NOW()),
('automatic_tax_enabled', 'false', 'boolean', 'test', 'Enable automatic tax calculation', NOW()),
('invoice_generation_enabled', 'true', 'boolean', 'test', 'Enable automatic invoice generation', NOW()),
('trial_period_days', '7', 'number', 'test', 'Default trial period for subscriptions in days', NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample legal service products
INSERT INTO stripe_products (stripe_product_id, product_name, product_description, product_type, service_category, is_subscription, billing_interval, pricing_data, features, usage_limits, is_active, created_at) VALUES
(
    'prod_labor_law_basic',
    'Consultoria Trabalhista Básica',
    'Plano básico de consultoria em direito trabalhista com suporte mensal',
    'subscription',
    'labor_law',
    true,
    'month',
    '{"currency": "brl", "unit_amount": 50000, "billing_scheme": "per_unit"}',
    '["Consultas ilimitadas por telefone/email", "Análise de documentos trabalhistas", "Orientações sobre CLT"]',
    '{"consulting_hours": 5, "document_reviews": 10}',
    true,
    NOW()
),
(
    'prod_civil_law_premium',
    'Consultoria Cível Premium',
    'Plano premium de consultoria em direito civil com atendimento prioritário',
    'subscription',
    'civil_law',
    true,
    'month',
    '{"currency": "brl", "unit_amount": 80000, "billing_scheme": "per_unit"}',
    '["Consultas ilimitadas", "Revisão de contratos", "Suporte jurídico especializado", "Atendimento prioritário"]',
    '{"consulting_hours": 10, "document_reviews": 20, "contract_reviews": 5}',
    true,
    NOW()
),
(
    'prod_document_review',
    'Revisão de Documento Avulsa',
    'Serviço avulso de revisão e análise de documentos jurídicos',
    'one_time',
    'document_review',
    false,
    null,
    '{"currency": "brl", "unit_amount": 15000, "billing_scheme": "per_unit"}',
    '["Análise jurídica detalhada", "Parecer escrito", "Sugestões de melhorias"]',
    '{}',
    true,
    NOW()
)
ON CONFLICT (stripe_product_id) DO NOTHING;

-- Add table comments for documentation
COMMENT ON TABLE stripe_settings IS 'Stripe API configuration and payment method settings';
COMMENT ON TABLE stripe_products IS 'Legal service products and subscription plans in Stripe';
COMMENT ON TABLE stripe_customers IS 'Client payment profiles with Brazilian tax information';
COMMENT ON TABLE stripe_subscriptions IS 'Active subscription management with Brazilian billing cycles';
COMMENT ON TABLE stripe_payments IS 'Payment processing with PIX, Boleto, and card support';
COMMENT ON TABLE stripe_webhook_events IS 'Real-time webhook event processing and logging';
COMMENT ON TABLE payment_tax_documents IS 'Brazilian tax compliance documents (NFSe, receipts, etc.)';

-- Migration completed
SELECT 'Stripe Payment Integration System migration completed successfully!' as result;