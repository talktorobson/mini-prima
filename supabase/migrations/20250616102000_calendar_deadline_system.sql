-- Calendar & Deadline Management System Migration
-- Brazilian legal compliance with court dates, deadlines, and statute of limitations

-- Calendar events table (court dates, appointments, deadlines)
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic event information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- 'court_hearing', 'deadline', 'appointment', 'reminder', 'task'
    
    -- Date and time
    start_date DATE NOT NULL,
    start_time TIME,
    end_date DATE,
    end_time TIME,
    all_day BOOLEAN DEFAULT false,
    
    -- Associations
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES staff(id),
    
    -- Brazilian legal specifics
    court_name VARCHAR(255), -- "TJSP 1ª Vara Cível", "TRT 2ª Região"
    court_address TEXT,
    process_number VARCHAR(100), -- Brazilian process number format
    
    -- Priority and status
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(30) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'postponed'
    
    -- Reminder settings
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_days_before INTEGER DEFAULT 7,
    reminder_hours_before INTEGER DEFAULT 24,
    email_reminder BOOLEAN DEFAULT true,
    sms_reminder BOOLEAN DEFAULT false,
    
    -- Legal deadline specifics
    is_legal_deadline BOOLEAN DEFAULT false,
    deadline_type VARCHAR(50), -- 'statute_limitations', 'appeal_deadline', 'response_deadline', 'filing_deadline'
    consequence_of_missing TEXT, -- What happens if deadline is missed
    can_be_extended BOOLEAN DEFAULT false,
    extension_criteria TEXT,
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB, -- {"type": "weekly", "interval": 1, "days": ["monday", "wednesday"]}
    recurrence_end_date DATE,
    
    -- Location and logistics
    location VARCHAR(255),
    location_address TEXT,
    travel_time_minutes INTEGER,
    requires_preparation BOOLEAN DEFAULT false,
    preparation_time_hours INTEGER,
    
    -- Document requirements
    required_documents JSONB, -- ["contract", "witness_list", "evidence"]
    documents_prepared BOOLEAN DEFAULT false,
    
    -- Notifications tracking
    notifications_sent JSONB DEFAULT '[]'::jsonb,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT valid_times CHECK (
        (all_day = true) OR 
        (start_time IS NOT NULL AND (end_time IS NULL OR end_time >= start_time))
    ),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'completed', 'cancelled', 'postponed', 'in_progress')),
    CONSTRAINT valid_event_type CHECK (event_type IN ('court_hearing', 'deadline', 'appointment', 'reminder', 'task', 'meeting'))
);

-- Brazilian legal deadlines template table
CREATE TABLE deadline_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    deadline_type VARCHAR(50) NOT NULL,
    
    -- Legal basis
    legal_basis TEXT, -- "Art. 525 CPC", "Lei 8.245/91"
    jurisdiction VARCHAR(50), -- 'federal', 'state', 'labor', 'civil', 'criminal'
    
    -- Timing
    days_from_trigger INTEGER NOT NULL, -- Days after trigger event
    business_days_only BOOLEAN DEFAULT true,
    exclude_holidays BOOLEAN DEFAULT true,
    
    -- Brazilian specific
    applicable_states JSONB, -- ["SP", "RJ", "MG"] or null for all states
    court_types JSONB, -- ["TJSP", "TRT", "TST"] or null for all
    
    -- Trigger conditions
    trigger_event VARCHAR(100) NOT NULL, -- 'case_filing', 'citation', 'judgment', 'appeal'
    auto_create BOOLEAN DEFAULT false, -- Automatically create when trigger occurs
    
    -- Risk assessment
    consequence_severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    consequence_description TEXT,
    can_request_extension BOOLEAN DEFAULT false,
    extension_max_days INTEGER,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_consequence_severity CHECK (consequence_severity IN ('low', 'medium', 'high', 'critical'))
);

-- Brazilian holidays and court calendars
CREATE TABLE brazilian_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Holiday information
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    year INTEGER NOT NULL,
    
    -- Scope
    holiday_type VARCHAR(30) NOT NULL, -- 'national', 'state', 'municipal', 'court'
    state_code VARCHAR(2), -- 'SP', 'RJ', 'MG', etc.
    city_code VARCHAR(10), -- IBGE city code
    court_code VARCHAR(20), -- 'TJSP', 'TRT02', etc.
    
    -- Impact on deadlines
    affects_deadlines BOOLEAN DEFAULT true,
    affects_court_sessions BOOLEAN DEFAULT true,
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(100), -- "every year", "first monday of month", etc.
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, holiday_type, state_code, city_code, court_code)
);

-- Statute of limitations tracking
CREATE TABLE statute_limitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Case association
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    
    -- Legal basis
    claim_type VARCHAR(100) NOT NULL, -- 'contractual', 'tort', 'labor', 'tax', 'criminal'
    legal_basis TEXT NOT NULL, -- "Art. 205 CC", "Art. 7º XXIX CF"
    
    -- Timing
    limitation_period_years INTEGER,
    limitation_period_months INTEGER,
    limitation_period_days INTEGER,
    
    -- Trigger and calculation
    trigger_event VARCHAR(100) NOT NULL, -- 'contract_breach', 'damage_occurrence', 'knowledge_of_damage'
    trigger_date DATE NOT NULL,
    calculated_deadline DATE NOT NULL,
    
    -- Interruption and suspension
    interruptions JSONB DEFAULT '[]'::jsonb, -- [{"date": "2024-01-15", "reason": "lawsuit_filed", "days_added": 0}]
    suspensions JSONB DEFAULT '[]'::jsonb, -- [{"start": "2024-01-01", "end": "2024-01-31", "reason": "negotiation"}]
    
    -- Current status
    status VARCHAR(30) DEFAULT 'active', -- 'active', 'interrupted', 'suspended', 'expired', 'satisfied'
    days_remaining INTEGER,
    risk_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Monitoring
    monitoring_enabled BOOLEAN DEFAULT true,
    alert_days_before INTEGER DEFAULT 90, -- Alert when 90 days remaining
    critical_alert_days INTEGER DEFAULT 30, -- Critical alert at 30 days
    
    -- Notes
    notes TEXT,
    legal_advice TEXT,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('active', 'interrupted', 'suspended', 'expired', 'satisfied')),
    CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
);

-- Calendar views and permissions
CREATE TABLE calendar_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User and calendar
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    calendar_type VARCHAR(30) NOT NULL, -- 'personal', 'team', 'court', 'client'
    calendar_owner_id UUID, -- staff_id for personal, client_id for client calendars
    
    -- Permissions
    can_view BOOLEAN DEFAULT true,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(staff_id, calendar_type, calendar_owner_id)
);

-- Indexes for performance
CREATE INDEX idx_calendar_events_date_range ON calendar_events(start_date, end_date);
CREATE INDEX idx_calendar_events_staff ON calendar_events(staff_id) WHERE staff_id IS NOT NULL;
CREATE INDEX idx_calendar_events_case ON calendar_events(case_id) WHERE case_id IS NOT NULL;
CREATE INDEX idx_calendar_events_client ON calendar_events(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_deadline ON calendar_events(is_legal_deadline) WHERE is_legal_deadline = true;
CREATE INDEX idx_calendar_events_reminders ON calendar_events(reminder_enabled, start_date) WHERE reminder_enabled = true;

CREATE INDEX idx_brazilian_holidays_date ON brazilian_holidays(date);
CREATE INDEX idx_brazilian_holidays_year ON brazilian_holidays(year);
CREATE INDEX idx_brazilian_holidays_scope ON brazilian_holidays(holiday_type, state_code);

CREATE INDEX idx_statute_limitations_case ON statute_limitations(case_id);
CREATE INDEX idx_statute_limitations_deadline ON statute_limitations(calculated_deadline);
CREATE INDEX idx_statute_limitations_status ON statute_limitations(status);

-- RLS Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE brazilian_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE statute_limitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_permissions ENABLE ROW LEVEL SECURITY;

-- Calendar events policies
CREATE POLICY "Staff can view calendar events" ON calendar_events
    FOR SELECT USING (
        staff_id = auth.uid() OR
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM staff_client_assignments sca
            WHERE sca.staff_id = auth.uid() 
            AND sca.client_id = calendar_events.client_id
            AND sca.is_active = true
        )
    );

CREATE POLICY "Staff can create calendar events" ON calendar_events
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Staff can update own calendar events" ON calendar_events
    FOR UPDATE USING (
        created_by = auth.uid() OR
        staff_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM staff s
            WHERE s.id = auth.uid() 
            AND s.role IN ('admin', 'partner', 'senior_lawyer')
        )
    );

-- Admin access to all tables
CREATE POLICY "Admin access to calendar events" ON calendar_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Admin access to deadline templates" ON deadline_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Everyone can view holidays" ON brazilian_holidays
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage holidays" ON brazilian_holidays
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Staff can view statute limitations" ON statute_limitations
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM cases c
            JOIN staff_client_assignments sca ON sca.client_id = c.client_id
            WHERE c.id = statute_limitations.case_id
            AND sca.staff_id = auth.uid()
            AND sca.is_active = true
        )
    );

-- Functions for calendar calculations
CREATE OR REPLACE FUNCTION calculate_business_days(start_date DATE, days INTEGER)
RETURNS DATE AS $$
DECLARE
    current_date DATE := start_date;
    days_added INTEGER := 0;
    target_days INTEGER := days;
BEGIN
    WHILE days_added < target_days LOOP
        current_date := current_date + INTERVAL '1 day';
        
        -- Skip weekends
        IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
            -- Check if it's not a holiday
            IF NOT EXISTS (
                SELECT 1 FROM brazilian_holidays 
                WHERE date = current_date 
                AND affects_deadlines = true
                AND (holiday_type = 'national' OR state_code IS NULL)
            ) THEN
                days_added := days_added + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN current_date;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_statute_limitations_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate days remaining
    NEW.days_remaining := (NEW.calculated_deadline - CURRENT_DATE);
    
    -- Update risk level based on days remaining
    IF NEW.days_remaining <= 30 THEN
        NEW.risk_level := 'critical';
    ELSIF NEW.days_remaining <= 90 THEN
        NEW.risk_level := 'high';
    ELSIF NEW.days_remaining <= 180 THEN
        NEW.risk_level := 'medium';
    ELSE
        NEW.risk_level := 'low';
    END IF;
    
    -- Update status if expired
    IF NEW.days_remaining <= 0 AND NEW.status = 'active' THEN
        NEW.status := 'expired';
    END IF;
    
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER statute_limitations_update_trigger
    BEFORE INSERT OR UPDATE ON statute_limitations
    FOR EACH ROW
    EXECUTE FUNCTION update_statute_limitations_status();

-- Function to create deadline from template
CREATE OR REPLACE FUNCTION create_deadline_from_template(
    template_id UUID,
    trigger_date DATE,
    case_id UUID,
    staff_id UUID
) RETURNS UUID AS $$
DECLARE
    template_record deadline_templates%ROWTYPE;
    deadline_date DATE;
    new_event_id UUID;
BEGIN
    -- Get template
    SELECT * INTO template_record FROM deadline_templates WHERE id = template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    -- Calculate deadline date
    IF template_record.business_days_only THEN
        deadline_date := calculate_business_days(trigger_date, template_record.days_from_trigger);
    ELSE
        deadline_date := trigger_date + template_record.days_from_trigger;
    END IF;
    
    -- Create calendar event
    INSERT INTO calendar_events (
        title,
        description,
        event_type,
        start_date,
        all_day,
        case_id,
        staff_id,
        created_by,
        is_legal_deadline,
        deadline_type,
        consequence_of_missing,
        priority
    ) VALUES (
        template_record.name,
        template_record.description,
        'deadline',
        deadline_date,
        true,
        case_id,
        staff_id,
        staff_id,
        true,
        template_record.deadline_type,
        template_record.consequence_description,
        CASE template_record.consequence_severity
            WHEN 'critical' THEN 'critical'
            WHEN 'high' THEN 'high'
            ELSE 'medium'
        END
    ) RETURNING id INTO new_event_id;
    
    RETURN new_event_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default Brazilian deadline templates
INSERT INTO deadline_templates (name, description, deadline_type, legal_basis, jurisdiction, days_from_trigger, business_days_only, trigger_event, consequence_severity, consequence_description) VALUES
('Prazo para Contestação', 'Prazo para apresentar contestação em processo civil', 'response_deadline', 'Art. 335 CPC', 'civil', 15, true, 'citation', 'high', 'Revelia e presunção de veracidade dos fatos alegados'),
('Prazo Recursal - Apelação', 'Prazo para interposição de recurso de apelação', 'appeal_deadline', 'Art. 1.003 CPC', 'civil', 15, true, 'judgment', 'critical', 'Perda do direito de recorrer - trânsito em julgado'),
('Prazo para Embargos de Declaração', 'Prazo para oposição de embargos de declaração', 'appeal_deadline', 'Art. 1.023 CPC', 'civil', 5, true, 'judgment', 'high', 'Perda da oportunidade de esclarecer obscuridades'),
('Prazo Trabalhista - Defesa', 'Prazo para apresentar defesa na Justiça do Trabalho', 'response_deadline', 'Art. 847 CLT', 'labor', 15, true, 'citation', 'high', 'Revelia e confissão ficta'),
('Prazo Recursal Trabalhista', 'Prazo para recurso ordinário na Justiça do Trabalho', 'appeal_deadline', 'Art. 895 CLT', 'labor', 8, true, 'judgment', 'critical', 'Perda do direito de recorrer'),
('Prazo para Impugnação - Execução', 'Prazo para impugnação em execução civil', 'response_deadline', 'Art. 525 CPC', 'civil', 15, true, 'citation', 'medium', 'Perda da oportunidade de defesa na execução');

-- Insert major Brazilian holidays
INSERT INTO brazilian_holidays (name, date, year, holiday_type, affects_deadlines, is_recurring, recurrence_rule) VALUES
('Ano Novo', '2025-01-01', 2025, 'national', true, true, 'every year'),
('Tiradentes', '2025-04-21', 2025, 'national', true, true, 'every year'),
('Dia do Trabalhador', '2025-05-01', 2025, 'national', true, true, 'every year'),
('Independência do Brasil', '2025-09-07', 2025, 'national', true, true, 'every year'),
('Nossa Senhora Aparecida', '2025-10-12', 2025, 'national', true, true, 'every year'),
('Finados', '2025-11-02', 2025, 'national', true, true, 'every year'),
('Proclamação da República', '2025-11-15', 2025, 'national', true, true, 'every year'),
('Natal', '2025-12-25', 2025, 'national', true, true, 'every year');

COMMENT ON TABLE calendar_events IS 'Calendar events including court dates, deadlines, and appointments';
COMMENT ON TABLE deadline_templates IS 'Templates for Brazilian legal deadlines';
COMMENT ON TABLE brazilian_holidays IS 'Brazilian national, state, and court holidays affecting deadlines';
COMMENT ON TABLE statute_limitations IS 'Statute of limitations tracking for legal claims';