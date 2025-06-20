-- Migration 01: Time Tracking System (FIXED VERSION)
-- Critical Priority: Foundation for billing and revenue management
-- Fixed: Removed references to non-existent columns

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

-- FIXED RLS Policies - using only existing columns and tables

-- Time Entries Policies
CREATE POLICY "Staff can manage their own time entries" ON time_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.staff_id::uuid = time_entries.staff_id
        )
        OR EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid()
        )
    );

-- Active Timers Policies  
CREATE POLICY "Staff can manage their own active timers" ON active_timers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.staff_id::uuid = active_timers.staff_id
        )
        OR EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid()
        )
    );

-- Billing Rates Policies
CREATE POLICY "Admins can manage billing rates" ON billing_rates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Time Summaries Policies
CREATE POLICY "Admins can view time summaries" ON time_tracking_summaries
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

-- Trigger function for automatic duration calculation
CREATE OR REPLACE FUNCTION calculate_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate duration when end_time is set
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER / 60;
        
        -- Calculate billable hours (duration in hours)
        NEW.billable_hours := NEW.duration_minutes::DECIMAL / 60;
        
        -- Calculate total amount if billing rate is set
        IF NEW.billing_rate IS NOT NULL THEN
            NEW.total_amount := NEW.billable_hours * NEW.billing_rate;
        END IF;
    END IF;
    
    -- Update timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER time_entry_calculation_trigger
    BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_time_entry_duration();

-- Function to stop active timer and create time entry
CREATE OR REPLACE FUNCTION stop_active_timer(timer_id UUID, end_description TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    timer_record active_timers%ROWTYPE;
    new_entry_id UUID;
    billing_rate_value DECIMAL(10,2) := 350.00; -- Default rate
BEGIN
    -- Get the active timer
    SELECT * INTO timer_record FROM active_timers WHERE id = timer_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Timer not found';
    END IF;
    
    -- Try to get appropriate billing rate
    SELECT hourly_rate INTO billing_rate_value
    FROM billing_rates
    WHERE staff_id = timer_record.staff_id
    AND is_active = true
    AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
    ORDER BY effective_from DESC
    LIMIT 1;
    
    -- Create time entry
    INSERT INTO time_entries (
        staff_id, case_id, client_id, start_time, end_time,
        description, service_type, billing_rate, is_billable
    ) VALUES (
        timer_record.staff_id,
        timer_record.case_id,
        timer_record.client_id,
        timer_record.start_time,
        NOW(),
        COALESCE(end_description, timer_record.description),
        timer_record.service_type,
        COALESCE(billing_rate_value, 350.00),
        true
    ) RETURNING id INTO new_entry_id;
    
    -- Delete the active timer
    DELETE FROM active_timers WHERE id = timer_id;
    
    RETURN new_entry_id;
END;
$$ LANGUAGE plpgsql;

-- Add table comments for documentation
COMMENT ON TABLE time_entries IS 'Core time tracking with approval workflow for billable hours';
COMMENT ON TABLE active_timers IS 'Real-time timer management for staff members';
COMMENT ON TABLE billing_rates IS 'Flexible billing rate configuration by staff, service, and client';
COMMENT ON TABLE time_tracking_summaries IS 'Pre-calculated analytics for time tracking performance';

-- Migration completed
SELECT 'Time Tracking System migration completed successfully!' as result;