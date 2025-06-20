-- Migration 02: Calendar & Deadline Management System
-- Critical Priority: Legal compliance and Brazilian court integration
-- Apply second: Depends on time tracking for scheduling

-- 1. Court Dates Table - Brazilian court calendar integration
CREATE TABLE IF NOT EXISTS court_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID,
    court_name VARCHAR(255) NOT NULL,
    court_code VARCHAR(20),
    hearing_type VARCHAR(100) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    estimated_duration INTEGER, -- minutes
    location TEXT,
    judge_name VARCHAR(255),
    case_number_external VARCHAR(100),
    hearing_status VARCHAR(20) DEFAULT 'scheduled' CHECK (hearing_status IN ('scheduled', 'confirmed', 'postponed', 'cancelled', 'completed')),
    preparation_required BOOLEAN DEFAULT true,
    preparation_deadline DATE,
    staff_assigned UUID[],
    client_notification_sent BOOLEAN DEFAULT false,
    reminder_notifications JSONB DEFAULT '[]',
    notes TEXT,
    outcome TEXT,
    next_hearing_date DATE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_court_dates_case FOREIGN KEY (case_id) REFERENCES cases(id),
    CONSTRAINT fk_court_dates_created_by FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- 2. Legal Deadlines Table - Statute of limitations and legal deadlines
CREATE TABLE IF NOT EXISTS legal_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    deadline_type VARCHAR(100) NOT NULL,
    legal_basis TEXT,
    due_date DATE NOT NULL,
    calculation_method VARCHAR(50) DEFAULT 'dias_corridos' CHECK (calculation_method IN ('dias_corridos', 'dias_uteis', 'meses', 'anos')),
    business_days_only BOOLEAN DEFAULT false,
    exclude_holidays BOOLEAN DEFAULT true,
    original_event_date DATE,
    days_to_deadline INTEGER,
    priority VARCHAR(20) DEFAULT 'high' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
    completion_date DATE,
    responsible_staff UUID,
    backup_staff UUID,
    notification_schedule JSONB DEFAULT '[7, 3, 1]', -- days before deadline
    last_notification_sent DATE,
    extension_requested BOOLEAN DEFAULT false,
    extension_granted_until DATE,
    court_granted_extension BOOLEAN DEFAULT false,
    notes TEXT,
    compliance_verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_legal_deadlines_case FOREIGN KEY (case_id) REFERENCES cases(id),
    CONSTRAINT fk_legal_deadlines_staff FOREIGN KEY (responsible_staff) REFERENCES staff(id),
    CONSTRAINT fk_legal_deadlines_backup FOREIGN KEY (backup_staff) REFERENCES staff(id),
    CONSTRAINT fk_legal_deadlines_verified_by FOREIGN KEY (verified_by) REFERENCES staff(id)
);

-- 3. Deadline Notifications Table - Automated compliance alerts
CREATE TABLE IF NOT EXISTS deadline_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deadline_id UUID NOT NULL,
    court_date_id UUID,
    notification_type VARCHAR(20) DEFAULT 'deadline' CHECK (notification_type IN ('deadline', 'court_date', 'preparation', 'followup')),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME DEFAULT '09:00:00',
    days_before INTEGER NOT NULL,
    notification_method VARCHAR(20) DEFAULT 'email' CHECK (notification_method IN ('email', 'sms', 'whatsapp', 'system', 'all')),
    recipient_staff UUID,
    recipient_client UUID,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'delivered', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    message_template VARCHAR(100),
    custom_message TEXT,
    urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_deadline_notifications_deadline FOREIGN KEY (deadline_id) REFERENCES legal_deadlines(id) ON DELETE CASCADE,
    CONSTRAINT fk_deadline_notifications_court_date FOREIGN KEY (court_date_id) REFERENCES court_dates(id) ON DELETE CASCADE,
    CONSTRAINT fk_deadline_notifications_staff FOREIGN KEY (recipient_staff) REFERENCES staff(id),
    CONSTRAINT fk_deadline_notifications_client FOREIGN KEY (recipient_client) REFERENCES clients(id)
);

-- 4. Calendar Events Table - Integrated scheduling system
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'consultation', 'court_hearing', 'deadline', 'reminder', 'vacation', 'training', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    all_day BOOLEAN DEFAULT false,
    location TEXT,
    case_id UUID,
    client_id UUID,
    organizer_staff UUID,
    attendee_staff UUID[],
    attendee_clients UUID[],
    external_attendees TEXT[],
    event_status VARCHAR(20) DEFAULT 'tentative' CHECK (event_status IN ('tentative', 'confirmed', 'cancelled', 'completed')),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'internal', 'client_visible', 'public')),
    recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    parent_event_id UUID,
    reminder_minutes INTEGER[] DEFAULT ARRAY[15, 60],
    preparation_time_minutes INTEGER DEFAULT 0,
    travel_time_minutes INTEGER DEFAULT 0,
    video_meeting_url TEXT,
    meeting_notes TEXT,
    outcome TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    billing_category VARCHAR(100),
    billable_time_minutes INTEGER,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_calendar_events_case FOREIGN KEY (case_id) REFERENCES cases(id),
    CONSTRAINT fk_calendar_events_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_calendar_events_organizer FOREIGN KEY (organizer_staff) REFERENCES staff(id),
    CONSTRAINT fk_calendar_events_parent FOREIGN KEY (parent_event_id) REFERENCES calendar_events(id),
    CONSTRAINT fk_calendar_events_created_by FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_court_dates_scheduled ON court_dates(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_court_dates_case ON court_dates(case_id);
CREATE INDEX IF NOT EXISTS idx_court_dates_status ON court_dates(hearing_status);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_due_date ON legal_deadlines(due_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_case ON legal_deadlines(case_id);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_priority ON legal_deadlines(priority, due_date);
CREATE INDEX IF NOT EXISTS idx_deadline_notifications_scheduled ON deadline_notifications(scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_deadline_notifications_deadline ON deadline_notifications(deadline_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_staff ON calendar_events USING GIN(attendee_staff);
CREATE INDEX IF NOT EXISTS idx_calendar_events_case ON calendar_events(case_id);

-- Enable Row Level Security
ALTER TABLE court_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Staff can view court dates for assigned cases" ON court_dates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_client_assignments sca
            JOIN cases c ON c.client_id = sca.client_id
            JOIN admin_users au ON au.staff_id::uuid = sca.staff_id
            WHERE c.id = court_dates.case_id AND au.user_id = auth.uid() AND sca.is_active = true
        )
        OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can view legal deadlines for assigned cases" ON legal_deadlines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_client_assignments sca
            JOIN cases c ON c.client_id = sca.client_id
            JOIN admin_users au ON au.staff_id::uuid = sca.staff_id
            WHERE c.id = legal_deadlines.case_id AND au.user_id = auth.uid() AND sca.is_active = true
        )
        OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can view their deadline notifications" ON deadline_notifications
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE staff_id::uuid = deadline_notifications.recipient_staff
            UNION
            SELECT auth.uid() FROM admin_users
        )
    );

CREATE POLICY "Staff can view calendar events where they are organizer or attendee" ON calendar_events
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE staff_id::uuid = calendar_events.organizer_staff
        )
        OR EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.staff_id::uuid = ANY(calendar_events.attendee_staff)
        )
        OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Insert sample Brazilian holidays for 2025
INSERT INTO court_dates (court_name, court_code, hearing_type, scheduled_date, hearing_status, notes, created_at) VALUES
('Tribunal de Justiça de São Paulo', 'TJSP', 'Audiência de Instrução', '2025-07-15', 'scheduled', 'Sample court hearing for testing', NOW()),
('Tribunal Regional do Trabalho 2ª Região', 'TRT2', 'Audiência Inicial', '2025-08-10', 'scheduled', 'Labor law hearing example', NOW())
ON CONFLICT DO NOTHING;

-- Insert sample legal deadline types
INSERT INTO legal_deadlines (case_id, deadline_type, legal_basis, due_date, calculation_method, priority, status, notes, created_at)
SELECT 
    c.id,
    'Contestação',
    'CPC Art. 335 - Prazo de 15 dias para contestação',
    CURRENT_DATE + INTERVAL '15 days',
    'dias_uteis',
    'critical',
    'active',
    'Prazo para apresentação de contestação em processo civil',
    NOW()
FROM cases c 
WHERE c.service_type = 'Civil Law'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add table comments for documentation
COMMENT ON TABLE court_dates IS 'Brazilian court calendar integration with hearing management';
COMMENT ON TABLE legal_deadlines IS 'Legal deadline tracking with Brazilian calendar compliance';
COMMENT ON TABLE deadline_notifications IS 'Automated notification system for legal deadlines';
COMMENT ON TABLE calendar_events IS 'Integrated calendar system for staff and client scheduling';

-- Migration completed
SELECT 'Calendar & Deadline Management System migration completed successfully!' as result;