-- Migration 01: Time Tracking System
-- Critical Priority: Foundation for billing and revenue management
-- Apply first: Required by other modules

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Time Entries Table - Core billable hours tracking
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    client_id UUID,
    case_id UUID,
    service_type VARCHAR(100),
    description TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    billable_hours DECIMAL(5,2),
    billing_rate DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    entry_type VARCHAR(20) DEFAULT 'manual' CHECK (entry_type IN ('manual', 'timer', 'imported')),
    approval_status VARCHAR(20) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'submitted', 'approved', 'rejected')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    is_billable BOOLEAN DEFAULT true,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_time_entries_staff FOREIGN KEY (staff_id) REFERENCES staff(id),
    CONSTRAINT fk_time_entries_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_time_entries_case FOREIGN KEY (case_id) REFERENCES cases(id),
    CONSTRAINT fk_time_entries_approved_by FOREIGN KEY (approved_by) REFERENCES staff(id)
);

-- 2. Active Timers Table - Real-time timer management
CREATE TABLE IF NOT EXISTS active_timers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL UNIQUE,
    client_id UUID,
    case_id UUID,
    service_type VARCHAR(100),
    description TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_duration_minutes INTEGER DEFAULT 0,
    is_paused BOOLEAN DEFAULT false,
    pause_start_time TIMESTAMP WITH TIME ZONE,
    pause_duration_minutes INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_active_timers_staff FOREIGN KEY (staff_id) REFERENCES staff(id),
    CONSTRAINT fk_active_timers_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_active_timers_case FOREIGN KEY (case_id) REFERENCES cases(id)
);

-- 3. Billing Rates Table - Flexible rate configuration
CREATE TABLE IF NOT EXISTS billing_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_name VARCHAR(100) NOT NULL,
    rate_type VARCHAR(20) DEFAULT 'standard' CHECK (rate_type IN ('standard', 'premium', 'partner', 'junior', 'expert')),
    staff_id UUID,
    service_type VARCHAR(100),
    client_id UUID,
    case_type VARCHAR(100),
    hourly_rate DECIMAL(10,2) NOT NULL,
    minimum_hours DECIMAL(3,2) DEFAULT 0.25,
    rounding_method VARCHAR(20) DEFAULT 'quarter' CHECK (rounding_method IN ('none', 'quarter', 'half', 'hour')),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    is_active BOOLEAN DEFAULT true,
    approval_required BOOLEAN DEFAULT false,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_billing_rates_staff FOREIGN KEY (staff_id) REFERENCES staff(id),
    CONSTRAINT fk_billing_rates_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_billing_rates_created_by FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- 4. Time Tracking Summaries Table - Analytics and reporting
CREATE TABLE IF NOT EXISTS time_tracking_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID,
    client_id UUID,
    case_id UUID,
    period_type VARCHAR(20) DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_hours DECIMAL(8,2) DEFAULT 0,
    billable_hours DECIMAL(8,2) DEFAULT 0,
    non_billable_hours DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    entry_count INTEGER DEFAULT 0,
    average_hourly_rate DECIMAL(10,2),
    utilization_percentage DECIMAL(5,2),
    approval_status_breakdown JSONB DEFAULT '{}',
    top_services JSONB DEFAULT '[]',
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_time_summaries_staff FOREIGN KEY (staff_id) REFERENCES staff(id),
    CONSTRAINT fk_time_summaries_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_time_summaries_case FOREIGN KEY (case_id) REFERENCES cases(id),
    UNIQUE(staff_id, client_id, case_id, period_type, period_start)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_staff_date ON time_entries(staff_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_client_date ON time_entries(client_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_case_date ON time_entries(case_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_approval_status ON time_entries(approval_status);
CREATE INDEX IF NOT EXISTS idx_active_timers_staff ON active_timers(staff_id);
CREATE INDEX IF NOT EXISTS idx_billing_rates_effective ON billing_rates(effective_from, effective_until) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_time_summaries_period ON time_tracking_summaries(period_type, period_start, period_end);

-- Enable Row Level Security
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_summaries ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (can be enhanced later)
CREATE POLICY "Staff can manage their own time entries" ON time_entries
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE staff_id::uuid = time_entries.staff_id
            UNION
            SELECT auth.uid()
        )
    );

CREATE POLICY "Staff can manage their own active timers" ON active_timers
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE staff_id::uuid = active_timers.staff_id
            UNION
            SELECT auth.uid()
        )
    );

CREATE POLICY "Admins can view all billing rates" ON billing_rates
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can view all time summaries" ON time_tracking_summaries
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Insert default billing rates
INSERT INTO billing_rates (rate_name, rate_type, hourly_rate, description, created_at) VALUES
('Standard Lawyer Rate', 'standard', 350.00, 'Default hourly rate for qualified lawyers', NOW()),
('Senior Partner Rate', 'premium', 500.00, 'Premium rate for senior partners', NOW()),
('Junior Associate Rate', 'junior', 250.00, 'Rate for junior associates and trainees', NOW()),
('Expert Consultation Rate', 'expert', 650.00, 'Specialized consultation rate for complex matters', NOW())
ON CONFLICT DO NOTHING;

-- Add table comments for documentation
COMMENT ON TABLE time_entries IS 'Core time tracking with approval workflow for billable hours';
COMMENT ON TABLE active_timers IS 'Real-time timer management for staff members';
COMMENT ON TABLE billing_rates IS 'Flexible billing rate configuration by staff, service, and client';
COMMENT ON TABLE time_tracking_summaries IS 'Pre-calculated analytics for time tracking performance';

-- Migration completed
SELECT 'Time Tracking System migration completed successfully!' as result;