-- Time Tracking System Migration
-- Comprehensive billable hours tracking with approval workflow

-- Time tracking entries table
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Time tracking details
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER, -- calculated field
    billable_minutes INTEGER, -- may differ from duration
    
    -- Task description
    description TEXT NOT NULL,
    task_type VARCHAR(100) NOT NULL, -- 'consultation', 'research', 'document_prep', 'court_appearance', 'admin'
    
    -- Billing information
    hourly_rate DECIMAL(10,2) NOT NULL,
    billable_amount DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE 
            WHEN billable_minutes IS NOT NULL THEN (billable_minutes::DECIMAL / 60) * hourly_rate
            ELSE 0
        END
    ) STORED,
    
    -- Status and approval
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected', 'billed'
    is_billable BOOLEAN DEFAULT true,
    
    -- Approval workflow
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by UUID REFERENCES staff(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES staff(id),
    approval_notes TEXT,
    
    -- Invoice integration
    invoice_id UUID REFERENCES invoices(id),
    billed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time IS NULL OR end_time > start_time),
    CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    CONSTRAINT valid_billable_minutes CHECK (billable_minutes IS NULL OR billable_minutes >= 0),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'billed'))
);

-- Active timers table (for ongoing time tracking)
CREATE TABLE active_timers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    description TEXT NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(staff_id) -- One active timer per staff member
);

-- Billing rates configuration
CREATE TABLE billing_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    
    -- Rate configuration
    default_hourly_rate DECIMAL(10,2) NOT NULL,
    task_type VARCHAR(100),
    custom_rate DECIMAL(10,2),
    
    -- Client-specific rates
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    client_rate DECIMAL(10,2),
    
    -- Effective period
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_rate_period CHECK (effective_until IS NULL OR effective_until > effective_from)
);

-- Time tracking summaries (for reporting)
CREATE TABLE time_tracking_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Summary period
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Scope
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    
    -- Metrics
    total_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    billable_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    billed_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Entry counts
    total_entries INTEGER NOT NULL DEFAULT 0,
    draft_entries INTEGER NOT NULL DEFAULT 0,
    submitted_entries INTEGER NOT NULL DEFAULT 0,
    approved_entries INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(period_type, period_start, period_end, staff_id, client_id, case_id)
);

-- Indexes for performance
CREATE INDEX idx_time_entries_staff_date ON time_entries(staff_id, start_time);
CREATE INDEX idx_time_entries_case ON time_entries(case_id) WHERE case_id IS NOT NULL;
CREATE INDEX idx_time_entries_client ON time_entries(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_billable ON time_entries(is_billable) WHERE is_billable = true;
CREATE INDEX idx_time_entries_approval ON time_entries(approved_by, approved_at) WHERE approved_by IS NOT NULL;

CREATE INDEX idx_active_timers_staff ON active_timers(staff_id);
CREATE INDEX idx_billing_rates_staff ON billing_rates(staff_id, is_active);
CREATE INDEX idx_billing_rates_client ON billing_rates(client_id, is_active) WHERE client_id IS NOT NULL;

-- RLS Policies for time_entries
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Staff can view their own entries and entries for their assigned clients
CREATE POLICY "Staff can view own time entries" ON time_entries
    FOR SELECT USING (
        staff_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM staff_client_assignments sca
            WHERE sca.staff_id = auth.uid() 
            AND sca.client_id = time_entries.client_id
            AND sca.is_active = true
        )
    );

-- Staff can insert their own time entries
CREATE POLICY "Staff can create time entries" ON time_entries
    FOR INSERT WITH CHECK (staff_id = auth.uid());

-- Staff can update their own draft entries
CREATE POLICY "Staff can update own draft entries" ON time_entries
    FOR UPDATE USING (
        staff_id = auth.uid() AND status = 'draft'
    );

-- Supervisors can approve time entries
CREATE POLICY "Supervisors can approve time entries" ON time_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM staff s
            WHERE s.id = auth.uid() 
            AND s.role IN ('admin', 'partner', 'senior_lawyer')
        )
    );

-- Admin users can see all entries
CREATE POLICY "Admin users can manage all time entries" ON time_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

-- RLS Policies for active_timers
ALTER TABLE active_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage own active timers" ON active_timers
    FOR ALL USING (staff_id = auth.uid());

-- RLS Policies for billing_rates
ALTER TABLE billing_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view billing rates" ON billing_rates
    FOR SELECT USING (
        staff_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM staff s
            WHERE s.id = auth.uid() 
            AND s.role IN ('admin', 'partner', 'senior_lawyer')
        )
    );

CREATE POLICY "Admin can manage billing rates" ON billing_rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM staff s
            WHERE s.id = auth.uid() 
            AND s.role IN ('admin', 'partner')
        )
    );

-- Functions for time tracking calculations
CREATE OR REPLACE FUNCTION calculate_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate duration when end_time is set
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER / 60;
        
        -- Default billable_minutes to duration_minutes if not set
        IF NEW.billable_minutes IS NULL THEN
            NEW.billable_minutes := NEW.duration_minutes;
        END IF;
    END IF;
    
    -- Update timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_entry_calculation_trigger
    BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_time_entry_duration();

-- Function to stop active timer and create time entry
CREATE OR REPLACE FUNCTION stop_active_timer(timer_id UUID, description TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    timer_record active_timers%ROWTYPE;
    new_entry_id UUID;
BEGIN
    -- Get the active timer
    SELECT * INTO timer_record FROM active_timers WHERE id = timer_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Timer not found';
    END IF;
    
    -- Create time entry
    INSERT INTO time_entries (
        staff_id, case_id, client_id, start_time, end_time,
        description, task_type, hourly_rate, is_billable
    ) VALUES (
        timer_record.staff_id,
        timer_record.case_id,
        timer_record.client_id,
        timer_record.started_at,
        NOW(),
        COALESCE(description, timer_record.description),
        timer_record.task_type,
        timer_record.hourly_rate,
        true
    ) RETURNING id INTO new_entry_id;
    
    -- Delete the active timer
    DELETE FROM active_timers WHERE id = timer_id;
    
    RETURN new_entry_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get staff billing rate
CREATE OR REPLACE FUNCTION get_staff_billing_rate(
    p_staff_id UUID,
    p_client_id UUID DEFAULT NULL,
    p_task_type VARCHAR DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
    rate DECIMAL(10,2);
BEGIN
    -- Try to find client-specific rate first
    IF p_client_id IS NOT NULL THEN
        SELECT client_rate INTO rate
        FROM billing_rates
        WHERE staff_id = p_staff_id 
        AND client_id = p_client_id
        AND is_active = true
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
        ORDER BY effective_from DESC
        LIMIT 1;
        
        IF rate IS NOT NULL THEN
            RETURN rate;
        END IF;
    END IF;
    
    -- Try to find task-specific rate
    IF p_task_type IS NOT NULL THEN
        SELECT custom_rate INTO rate
        FROM billing_rates
        WHERE staff_id = p_staff_id 
        AND task_type = p_task_type
        AND client_id IS NULL
        AND is_active = true
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
        ORDER BY effective_from DESC
        LIMIT 1;
        
        IF rate IS NOT NULL THEN
            RETURN rate;
        END IF;
    END IF;
    
    -- Fall back to default rate
    SELECT default_hourly_rate INTO rate
    FROM billing_rates
    WHERE staff_id = p_staff_id 
    AND task_type IS NULL
    AND client_id IS NULL
    AND is_active = true
    AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
    ORDER BY effective_from DESC
    LIMIT 1;
    
    RETURN COALESCE(rate, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE time_entries IS 'Billable hours tracking with approval workflow';
COMMENT ON TABLE active_timers IS 'Currently running timers for staff members';
COMMENT ON TABLE billing_rates IS 'Configurable billing rates per staff, task type, and client';
COMMENT ON TABLE time_tracking_summaries IS 'Pre-calculated time tracking metrics for reporting';