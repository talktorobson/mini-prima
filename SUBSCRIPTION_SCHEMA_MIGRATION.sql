-- 🚀 LEGAL-AS-A-SERVICE SUBSCRIPTION MANAGEMENT SCHEMA
-- Migration for Hybrid Billing & Subscription System
-- Apply this in Supabase SQL Editor

BEGIN;

-- =====================================================
-- A) SUBSCRIPTION PLANS CONFIGURATION
-- =====================================================

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- 'Basic Labor Law', 'Professional Corporate', etc.
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('basic', 'professional', 'enterprise')),
    category VARCHAR(100) NOT NULL CHECK (category IN ('labor_law', 'corporate_law', 'full_service')),
    monthly_price DECIMAL(10,2) NOT NULL,
    yearly_price DECIMAL(10,2), -- Optional yearly discount
    description TEXT,
    features JSONB DEFAULT '{}', -- Plan features and quotas
    consulting_hours_quota INTEGER DEFAULT 0, -- Monthly consulting hours included
    document_review_quota INTEGER DEFAULT 0, -- Monthly documents included
    legal_questions_quota INTEGER DEFAULT 0, -- Monthly questions via chat/email
    litigation_discount_percentage DECIMAL(5,2) DEFAULT 0, -- Discount on litigation services
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, tier, category, monthly_price, yearly_price, description, consulting_hours_quota, document_review_quota, legal_questions_quota, litigation_discount_percentage, features) VALUES
('Básico Trabalhista', 'basic', 'labor_law', 899.00, 9590.00, 'Consultoria básica em direito trabalhista com desconto em litígios', 2, 5, 10, 15.00, '{"compliance_alerts": true, "basic_templates": true, "email_support": true}'),
('Profissional Trabalhista', 'professional', 'labor_law', 1899.00, 20290.00, 'Consultoria avançada em direito trabalhista com maior desconto', 5, 15, 25, 25.00, '{"compliance_alerts": true, "premium_templates": true, "priority_support": true, "monthly_reports": true}'),
('Básico Empresarial', 'basic', 'corporate_law', 1299.00, 13890.00, 'Consultoria básica em direito empresarial', 3, 8, 15, 15.00, '{"contract_templates": true, "basic_compliance": true, "email_support": true}'),
('Profissional Empresarial', 'professional', 'corporate_law', 2499.00, 26990.00, 'Consultoria avançada em direito empresarial', 8, 20, 40, 25.00, '{"advanced_templates": true, "compliance_monitoring": true, "priority_support": true, "legal_updates": true}'),
('Empresarial Completo', 'enterprise', 'full_service', 4999.00, 53990.00, 'Serviço jurídico completo com máximo desconto em litígios', 20, 50, 100, 30.00, '{"full_legal_support": true, "dedicated_lawyer": true, "24h_support": true, "custom_contracts": true, "litigation_support": true}');

-- =====================================================
-- B) CLIENT SUBSCRIPTIONS MANAGEMENT
-- =====================================================

-- Client Subscriptions Table
CREATE TABLE IF NOT EXISTS public.client_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'paused', 'trial')),
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    next_billing_date DATE,
    subscription_start_date DATE DEFAULT CURRENT_DATE,
    cancellation_date DATE,
    cancellation_reason TEXT,
    stripe_subscription_id VARCHAR(255), -- For payment processing
    stripe_customer_id VARCHAR(255), -- Stripe customer reference
    monthly_amount DECIMAL(10,2) NOT NULL,
    yearly_amount DECIMAL(10,2),
    usage_tracking JSONB DEFAULT '{"consulting_hours_used": 0, "documents_reviewed": 0, "questions_asked": 0}',
    auto_renew BOOLEAN DEFAULT TRUE,
    trial_end_date DATE,
    discount_applied DECIMAL(5,2) DEFAULT 0, -- Any additional discounts
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(client_id, plan_id, status) -- Prevent duplicate active subscriptions
);

-- =====================================================
-- C) USAGE TRACKING FOR SUBSCRIPTIONS
-- =====================================================

-- Subscription Usage Tracking
CREATE TABLE IF NOT EXISTS public.subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.client_subscriptions(id) ON DELETE CASCADE,
    usage_type VARCHAR(50) NOT NULL CHECK (usage_type IN ('consulting_hours', 'document_review', 'legal_questions', 'template_access')),
    usage_date DATE DEFAULT CURRENT_DATE,
    quantity_used DECIMAL(8,2) NOT NULL DEFAULT 1,
    staff_id UUID REFERENCES public.staff(id), -- Who provided the service
    case_id UUID REFERENCES public.cases(id), -- If related to a case
    description TEXT,
    billable_separately BOOLEAN DEFAULT FALSE, -- If this usage should be billed extra
    hourly_rate DECIMAL(10,2), -- Rate if billable separately
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}' -- Additional usage metadata
);

-- =====================================================
-- D) ENHANCED CASE BILLING WITH PAYMENT PLANS
-- =====================================================

-- Enhanced Service Types with Payment Plan Support
CREATE TABLE IF NOT EXISTS public.service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'trabalhista', 'civil', 'empresarial', 'consultoria'
    litigation_type VARCHAR(100), -- 'labor_litigation', 'corporate_litigation', etc.
    description TEXT,
    minimum_fee DECIMAL(10,2) DEFAULT 0,
    default_hourly_rate DECIMAL(10,2),
    default_percentage_rate DECIMAL(5,2),
    default_fixed_fee DECIMAL(10,2),
    success_fee_percentage DECIMAL(5,2) DEFAULT 0,
    success_fee_minimum DECIMAL(10,2) DEFAULT 0,
    success_fee_maximum DECIMAL(10,2),
    allows_payment_plans BOOLEAN DEFAULT TRUE,
    max_installments INTEGER DEFAULT 12,
    min_amount_for_payment_plan DECIMAL(10,2) DEFAULT 5000,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default service types
INSERT INTO public.service_types (name, category, litigation_type, minimum_fee, default_hourly_rate, default_percentage_rate, success_fee_percentage, allows_payment_plans) VALUES
('Ação Trabalhista', 'trabalhista', 'labor_litigation', 3000.00, 350.00, 15.00, 20.00, true),
('Defesa Trabalhista', 'trabalhista', 'labor_litigation', 5000.00, 350.00, 10.00, 15.00, true),
('Ação Cível', 'civil', 'civil_litigation', 5000.00, 400.00, 12.00, 20.00, true),
('Consultoria Empresarial', 'empresarial', NULL, 1500.00, 450.00, NULL, 0.00, false),
('Litígio Empresarial', 'empresarial', 'corporate_litigation', 8000.00, 500.00, 8.00, 15.00, true);

-- Enhanced Case Billing Configuration
CREATE TABLE IF NOT EXISTS public.case_billing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    service_type_id UUID REFERENCES public.service_types(id),
    billing_method VARCHAR(50) DEFAULT 'fixed' CHECK (billing_method IN ('hourly', 'percentage', 'fixed', 'hybrid')),
    hourly_rate DECIMAL(10,2),
    percentage_rate DECIMAL(5,2),
    fixed_fee DECIMAL(10,2),
    minimum_fee DECIMAL(10,2),
    case_value DECIMAL(15,2), -- Total estimated case value
    success_fee_percentage DECIMAL(5,2) DEFAULT 0,
    success_fee_applied BOOLEAN DEFAULT FALSE,
    final_recovery_amount DECIMAL(15,2), -- Actual amount recovered
    
    -- Payment Plan Configuration
    payment_plan_enabled BOOLEAN DEFAULT FALSE,
    number_of_installments INTEGER,
    installment_amount DECIMAL(10,2),
    interest_rate DECIMAL(5,2) DEFAULT 0, -- Monthly interest rate
    down_payment DECIMAL(10,2) DEFAULT 0,
    
    -- Subscription Discounts
    subscription_discount_applied DECIMAL(5,2) DEFAULT 0, -- Percentage discount from subscription
    original_amount DECIMAL(10,2), -- Amount before discount
    discounted_amount DECIMAL(10,2), -- Amount after discount
    discount_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(case_id) -- One billing config per case
);

-- =====================================================
-- E) PAYMENT PLAN INSTALLMENTS MANAGEMENT
-- =====================================================

-- Payment Installments Table
CREATE TABLE IF NOT EXISTS public.payment_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_billing_id UUID NOT NULL REFERENCES public.case_billing_config(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL, -- Principal amount
    interest_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL, -- Principal + Interest
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'defaulted', 'cancelled')),
    paid_date DATE,
    paid_amount DECIMAL(10,2),
    payment_method VARCHAR(100),
    stripe_payment_intent_id VARCHAR(255),
    late_fee_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- F) RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_billing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (readable by all, manageable by staff)
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (public.is_staff_user());

-- RLS Policies for client_subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.client_subscriptions
  FOR SELECT USING (
    client_id = public.get_user_client_id() OR public.is_staff_user()
  );

CREATE POLICY "Staff can manage client subscriptions" ON public.client_subscriptions
  FOR ALL USING (public.is_staff_user());

-- RLS Policies for subscription_usage
CREATE POLICY "Users can view own subscription usage" ON public.subscription_usage
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM public.client_subscriptions 
      WHERE client_id = public.get_user_client_id()
    ) OR public.is_staff_user()
  );

CREATE POLICY "Staff can manage subscription usage" ON public.subscription_usage
  FOR ALL USING (public.is_staff_user());

-- RLS Policies for service_types (readable by all, manageable by staff)
CREATE POLICY "Anyone can view service types" ON public.service_types
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage service types" ON public.service_types
  FOR ALL USING (public.is_staff_user());

-- RLS Policies for case_billing_config
CREATE POLICY "Users can view own case billing" ON public.case_billing_config
  FOR SELECT USING (
    case_id IN (
      SELECT id FROM public.cases 
      WHERE client_id = public.get_user_client_id()
    ) OR public.is_staff_user()
  );

CREATE POLICY "Staff can manage case billing" ON public.case_billing_config
  FOR ALL USING (public.is_staff_user());

-- RLS Policies for payment_installments
CREATE POLICY "Users can view own payment installments" ON public.payment_installments
  FOR SELECT USING (
    case_billing_id IN (
      SELECT cbc.id FROM public.case_billing_config cbc
      JOIN public.cases c ON c.id = cbc.case_id
      WHERE c.client_id = public.get_user_client_id()
    ) OR public.is_staff_user()
  );

CREATE POLICY "Staff can manage payment installments" ON public.payment_installments
  FOR ALL USING (public.is_staff_user());

-- =====================================================
-- G) TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Updated timestamp trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_subscriptions_updated_at
    BEFORE UPDATE ON public.client_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_types_updated_at
    BEFORE UPDATE ON public.service_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_billing_config_updated_at
    BEFORE UPDATE ON public.case_billing_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_installments_updated_at
    BEFORE UPDATE ON public.payment_installments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- H) INDEXES FOR PERFORMANCE
-- =====================================================

-- Subscription Plans indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier_category ON public.subscription_plans(tier, category);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);

-- Client Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_client_id ON public.client_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_plan_id ON public.client_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_status ON public.client_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_billing_date ON public.client_subscriptions(next_billing_date);

-- Subscription Usage indexes
CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON public.subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_date ON public.subscription_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_type ON public.subscription_usage(usage_type);

-- Case Billing indexes
CREATE INDEX IF NOT EXISTS idx_case_billing_config_case_id ON public.case_billing_config(case_id);
CREATE INDEX IF NOT EXISTS idx_case_billing_config_service_type ON public.case_billing_config(service_type_id);

-- Payment Installments indexes
CREATE INDEX IF NOT EXISTS idx_payment_installments_case_billing_id ON public.payment_installments(case_billing_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_due_date ON public.payment_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_installments_status ON public.payment_installments(payment_status);

-- =====================================================
-- I) GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT SELECT ON public.client_subscriptions TO anon, authenticated;
GRANT SELECT ON public.subscription_usage TO anon, authenticated;
GRANT SELECT ON public.service_types TO anon, authenticated;
GRANT SELECT ON public.case_billing_config TO anon, authenticated;
GRANT SELECT ON public.payment_installments TO anon, authenticated;

COMMIT;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
SELECT 'SUBSCRIPTION MANAGEMENT SCHEMA MIGRATION COMPLETE! 🚀' AS status,
       COUNT(*) AS subscription_plans_created
FROM public.subscription_plans;