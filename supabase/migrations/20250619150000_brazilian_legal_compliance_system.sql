-- Brazilian Legal Compliance & Case Automation System
-- D'Avila Reis Legal Practice Management System
-- Enhanced case workflows with Brazilian legal compliance

-- 1. Case Deadlines Table
CREATE TABLE IF NOT EXISTS case_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    deadline_type VARCHAR(50) NOT NULL, -- CIVIL_APPEAL, LABOR_RESPONSE, etc.
    due_date DATE NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
    notification_sent BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Deadline Notifications Table
CREATE TABLE IF NOT EXISTS deadline_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deadline_id UUID NOT NULL REFERENCES case_deadlines(id) ON DELETE CASCADE,
    notification_date TIMESTAMP WITH TIME ZONE NOT NULL,
    days_before INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed')),
    notification_type VARCHAR(20) DEFAULT 'email' CHECK (notification_type IN ('email', 'sms', 'whatsapp', 'system')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Court Integrations Table
CREATE TABLE IF NOT EXISTS court_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    court_code VARCHAR(20) NOT NULL, -- TJSP, STJ, TRT2, etc.
    process_number VARCHAR(100) NOT NULL,
    integration_data JSONB, -- Court-specific data
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'active' CHECK (sync_status IN ('active', 'inactive', 'error')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(case_id, court_code)
);

-- 4. Case Workflow Phases Table
CREATE TABLE IF NOT EXISTS case_workflow_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    phase_name VARCHAR(100) NOT NULL,
    phase_order INTEGER NOT NULL,
    procedure_type VARCHAR(50) NOT NULL, -- CIVIL_ORDINARY, LABOR_ORDINARY, etc.
    estimated_start_date DATE,
    actual_start_date DATE,
    estimated_end_date DATE,
    actual_end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
    description TEXT,
    required_documents TEXT[], -- Array of required document types
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. OAB Compliance Checks Table
CREATE TABLE IF NOT EXISTS oab_compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    check_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    compliance_score INTEGER NOT NULL CHECK (compliance_score >= 0 AND compliance_score <= 100),
    violations JSONB, -- Array of violation objects
    recommendations JSONB, -- Array of recommendation objects
    checked_by UUID REFERENCES staff(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Legal Templates Table
CREATE TABLE IF NOT EXISTS legal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- petition, contract, motion, etc.
    practice_area VARCHAR(50) NOT NULL, -- civil, labor, corporate
    court_type VARCHAR(50), -- TJSP, TRT, federal, etc.
    template_content TEXT NOT NULL,
    variables JSONB, -- Template variables for substitution
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Case Status History Table
CREATE TABLE IF NOT EXISTS case_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES staff(id),
    change_reason TEXT,
    automated_change BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Brazilian Holidays Table
CREATE TABLE IF NOT EXISTS brazilian_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(255) NOT NULL,
    holiday_type VARCHAR(20) NOT NULL CHECK (holiday_type IN ('national', 'state', 'municipal', 'judicial')),
    state_code VARCHAR(2), -- SP, RJ, etc.
    municipality VARCHAR(100),
    is_business_day_exclusion BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(holiday_date, holiday_type, state_code, municipality)
);

-- Add new columns to existing cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS procedure_type VARCHAR(50);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS estimated_duration_days INTEGER;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS workflow_automated BOOLEAN DEFAULT FALSE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS oab_compliance_score INTEGER;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS last_compliance_check TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_case_deadlines_case_id ON case_deadlines(case_id);
CREATE INDEX IF NOT EXISTS idx_case_deadlines_due_date ON case_deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_case_deadlines_status ON case_deadlines(status);
CREATE INDEX IF NOT EXISTS idx_case_deadlines_priority ON case_deadlines(priority);

CREATE INDEX IF NOT EXISTS idx_deadline_notifications_deadline_id ON deadline_notifications(deadline_id);
CREATE INDEX IF NOT EXISTS idx_deadline_notifications_date ON deadline_notifications(notification_date);
CREATE INDEX IF NOT EXISTS idx_deadline_notifications_status ON deadline_notifications(status);

CREATE INDEX IF NOT EXISTS idx_court_integrations_case_id ON court_integrations(case_id);
CREATE INDEX IF NOT EXISTS idx_court_integrations_court_code ON court_integrations(court_code);
CREATE INDEX IF NOT EXISTS idx_court_integrations_process_number ON court_integrations(process_number);

CREATE INDEX IF NOT EXISTS idx_case_workflow_phases_case_id ON case_workflow_phases(case_id);
CREATE INDEX IF NOT EXISTS idx_case_workflow_phases_status ON case_workflow_phases(status);
CREATE INDEX IF NOT EXISTS idx_case_workflow_phases_phase_order ON case_workflow_phases(phase_order);

CREATE INDEX IF NOT EXISTS idx_oab_compliance_case_id ON oab_compliance_checks(case_id);
CREATE INDEX IF NOT EXISTS idx_oab_compliance_score ON oab_compliance_checks(compliance_score);
CREATE INDEX IF NOT EXISTS idx_oab_compliance_status ON oab_compliance_checks(status);

CREATE INDEX IF NOT EXISTS idx_legal_templates_type ON legal_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_legal_templates_practice_area ON legal_templates(practice_area);
CREATE INDEX IF NOT EXISTS idx_legal_templates_active ON legal_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_case_status_history_case_id ON case_status_history(case_id);
CREATE INDEX IF NOT EXISTS idx_case_status_history_created_at ON case_status_history(created_at);

CREATE INDEX IF NOT EXISTS idx_brazilian_holidays_date ON brazilian_holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_brazilian_holidays_type ON brazilian_holidays(holiday_type);

-- Enable RLS on all new tables
ALTER TABLE case_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_workflow_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE oab_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE brazilian_holidays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_deadlines
CREATE POLICY "Staff can view deadlines for assigned cases" ON case_deadlines
    FOR SELECT USING (
        case_id IN (
            SELECT c.id FROM cases c
            JOIN staff_client_assignments sca ON c.client_id = sca.client_id
            JOIN staff s ON sca.staff_id = s.id
            WHERE s.email = auth.jwt() ->> 'email' AND sca.is_active = true
        )
    );

CREATE POLICY "Staff can manage deadlines for assigned cases" ON case_deadlines
    FOR ALL USING (
        case_id IN (
            SELECT c.id FROM cases c
            JOIN staff_client_assignments sca ON c.client_id = sca.client_id
            JOIN staff s ON sca.staff_id = s.id
            WHERE s.email = auth.jwt() ->> 'email' AND sca.is_active = true
        )
    );

-- RLS Policies for court_integrations
CREATE POLICY "Staff can view court integrations for assigned cases" ON court_integrations
    FOR SELECT USING (
        case_id IN (
            SELECT c.id FROM cases c
            JOIN staff_client_assignments sca ON c.client_id = sca.client_id
            JOIN staff s ON sca.staff_id = s.id
            WHERE s.email = auth.jwt() ->> 'email' AND sca.is_active = true
        )
    );

CREATE POLICY "Staff can manage court integrations for assigned cases" ON court_integrations
    FOR ALL USING (
        case_id IN (
            SELECT c.id FROM cases c
            JOIN staff_client_assignments sca ON c.client_id = sca.client_id
            JOIN staff s ON sca.staff_id = s.id
            WHERE s.email = auth.jwt() ->> 'email' AND sca.is_active = true
        )
    );

-- RLS Policies for workflow phases
CREATE POLICY "Staff can view workflow phases for assigned cases" ON case_workflow_phases
    FOR SELECT USING (
        case_id IN (
            SELECT c.id FROM cases c
            JOIN staff_client_assignments sca ON c.client_id = sca.client_id
            JOIN staff s ON sca.staff_id = s.id
            WHERE s.email = auth.jwt() ->> 'email' AND sca.is_active = true
        )
    );

CREATE POLICY "Staff can manage workflow phases for assigned cases" ON case_workflow_phases
    FOR ALL USING (
        case_id IN (
            SELECT c.id FROM cases c
            JOIN staff_client_assignments sca ON c.client_id = sca.client_id
            JOIN staff s ON sca.staff_id = s.id
            WHERE s.email = auth.jwt() ->> 'email' AND sca.is_active = true
        )
    );

-- RLS Policies for compliance checks
CREATE POLICY "Staff can view compliance checks for assigned cases" ON oab_compliance_checks
    FOR SELECT USING (
        case_id IN (
            SELECT c.id FROM cases c
            JOIN staff_client_assignments sca ON c.client_id = sca.client_id
            JOIN staff s ON sca.staff_id = s.id
            WHERE s.email = auth.jwt() ->> 'email' AND sca.is_active = true
        )
    );

CREATE POLICY "Staff can create compliance checks for assigned cases" ON oab_compliance_checks
    FOR INSERT WITH CHECK (
        case_id IN (
            SELECT c.id FROM cases c
            JOIN staff_client_assignments sca ON c.client_id = sca.client_id
            JOIN staff s ON sca.staff_id = s.id
            WHERE s.email = auth.jwt() ->> 'email' AND sca.is_active = true
        )
    );

-- RLS Policies for legal templates (all staff can view, only admins can modify)
CREATE POLICY "Staff can view active legal templates" ON legal_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage legal templates" ON legal_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.email = auth.jwt() ->> 'email'
        )
    );

-- RLS Policies for case status history
CREATE POLICY "Staff can view status history for assigned cases" ON case_status_history
    FOR SELECT USING (
        case_id IN (
            SELECT c.id FROM cases c
            JOIN staff_client_assignments sca ON c.client_id = sca.client_id
            JOIN staff s ON sca.staff_id = s.id
            WHERE s.email = auth.jwt() ->> 'email' AND sca.is_active = true
        )
    );

-- RLS Policies for Brazilian holidays (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view holidays" ON brazilian_holidays
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert Brazilian national holidays for 2024-2025
INSERT INTO brazilian_holidays (holiday_date, holiday_name, holiday_type) VALUES
('2024-01-01', 'Confraternização Universal', 'national'),
('2024-04-21', 'Tiradentes', 'national'),
('2024-05-01', 'Dia do Trabalhador', 'national'),
('2024-09-07', 'Independência do Brasil', 'national'),
('2024-10-12', 'Nossa Senhora Aparecida', 'national'),
('2024-11-02', 'Finados', 'national'),
('2024-11-15', 'Proclamação da República', 'national'),
('2024-12-25', 'Natal', 'national'),
('2025-01-01', 'Confraternização Universal', 'national'),
('2025-04-21', 'Tiradentes', 'national'),
('2025-05-01', 'Dia do Trabalhador', 'national'),
('2025-09-07', 'Independência do Brasil', 'national'),
('2025-10-12', 'Nossa Senhora Aparecida', 'national'),
('2025-11-02', 'Finados', 'national'),
('2025-11-15', 'Proclamação da República', 'national'),
('2025-12-25', 'Natal', 'national')
ON CONFLICT (holiday_date, holiday_type, state_code, municipality) DO NOTHING;

-- Insert São Paulo state holidays
INSERT INTO brazilian_holidays (holiday_date, holiday_name, holiday_type, state_code) VALUES
('2024-07-09', 'Revolução Constitucionalista', 'state', 'SP'),
('2025-07-09', 'Revolução Constitucionalista', 'state', 'SP')
ON CONFLICT (holiday_date, holiday_type, state_code, municipality) DO NOTHING;

-- Create trigger for updating case status history
CREATE OR REPLACE FUNCTION update_case_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO case_status_history (
            case_id,
            previous_status,
            new_status,
            automated_change
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            FALSE -- Assume manual change unless specified
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on cases table
DROP TRIGGER IF EXISTS trigger_case_status_history ON cases;
CREATE TRIGGER trigger_case_status_history
    AFTER UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_case_status_history();

-- Create function for automatic deadline priority updates
CREATE OR REPLACE FUNCTION update_deadline_priority()
RETURNS VOID AS $$
DECLARE
    deadline_record RECORD;
    new_priority VARCHAR(20);
    days_remaining INTEGER;
BEGIN
    FOR deadline_record IN 
        SELECT id, due_date, priority 
        FROM case_deadlines 
        WHERE status = 'pending'
    LOOP
        days_remaining := DATE_PART('day', deadline_record.due_date - CURRENT_DATE);
        
        IF days_remaining <= 1 THEN
            new_priority := 'critical';
        ELSIF days_remaining <= 3 THEN
            new_priority := 'high';
        ELSIF days_remaining <= 7 THEN
            new_priority := 'medium';
        ELSE
            new_priority := 'low';
        END IF;
        
        IF deadline_record.priority != new_priority THEN
            UPDATE case_deadlines 
            SET priority = new_priority, updated_at = NOW()
            WHERE id = deadline_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create some sample legal templates
INSERT INTO legal_templates (template_name, template_type, practice_area, court_type, template_content, variables) VALUES
(
    'Petição Inicial Trabalhista',
    'petition',
    'labor',
    'TRT',
    'EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DO TRABALHO DA {VARA} VARA DO TRABALHO DE {CIDADE}

    {NOME_CLIENTE}, {NACIONALIDADE}, {ESTADO_CIVIL}, {PROFISSAO}, portador do RG nº {RG} e CPF nº {CPF}, residente e domiciliado na {ENDERECO}, vem, por seu advogado que esta subscreve, com escritório profissional na {ENDERECO_ADVOGADO}, inscrito na OAB/SP sob o nº {OAB}, propor

    RECLAMAÇÃO TRABALHISTA

    em face de {NOME_EMPRESA}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {CNPJ}, com sede na {ENDERECO_EMPRESA}, pelos fatos e fundamentos que seguem:

    DOS FATOS
    
    {FATOS_CASO}

    DO DIREITO
    
    {FUNDAMENTOS_JURIDICOS}

    DOS PEDIDOS
    
    Diante do exposto, requer:
    
    {PEDIDOS}

    Dá-se à causa o valor de R$ {VALOR_CAUSA}.

    Termos em que pede deferimento.

    {CIDADE}, {DATA}.

    {NOME_ADVOGADO}
    OAB/SP {OAB}',
    '["VARA", "CIDADE", "NOME_CLIENTE", "NACIONALIDADE", "ESTADO_CIVIL", "PROFISSAO", "RG", "CPF", "ENDERECO", "ENDERECO_ADVOGADO", "OAB", "NOME_EMPRESA", "CNPJ", "ENDERECO_EMPRESA", "FATOS_CASO", "FUNDAMENTOS_JURIDICOS", "PEDIDOS", "VALOR_CAUSA", "NOME_ADVOGADO"]'::jsonb
),
(
    'Contestação Cível',
    'defense',
    'civil',
    'TJSP',
    'EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA {VARA} VARA CÍVEL DE {COMARCA}

    {NOME_REU}, já qualificado nos autos da Ação {TIPO_ACAO} que lhe move {NOME_AUTOR}, vem, por seu advogado que esta subscreve, apresentar

    CONTESTAÇÃO

    aos termos da inicial, pelos fatos e fundamentos que seguem:

    DA TEMPESTIVIDADE
    
    A presente contestação é tempestiva, conforme se verifica do prazo legal.

    DA PRELIMINAR
    
    {PRELIMINARES}

    DO MÉRITO
    
    {DEFESA_MERITO}

    DOS PEDIDOS
    
    Ante o exposto, requer:
    
    a) O acolhimento das preliminares arguidas;
    b) No mérito, a total improcedência dos pedidos;
    c) A condenação do autor ao pagamento das custas e honorários advocatícios.

    Protesta por todos os meios de prova em direito admitidos.

    Termos em que pede deferimento.

    {CIDADE}, {DATA}.

    {NOME_ADVOGADO}
    OAB/SP {OAB}',
    '["VARA", "COMARCA", "NOME_REU", "TIPO_ACAO", "NOME_AUTOR", "PRELIMINARES", "DEFESA_MERITO", "CIDADE", "DATA", "NOME_ADVOGADO", "OAB"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Add trigger to automatically mark overdue deadlines
CREATE OR REPLACE FUNCTION mark_overdue_deadlines()
RETURNS VOID AS $$
BEGIN
    UPDATE case_deadlines 
    SET status = 'overdue', updated_at = NOW()
    WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE case_deadlines IS 'Stores all legal deadlines for cases with Brazilian legal system compliance';
COMMENT ON TABLE court_integrations IS 'Integration data with Brazilian court systems (TJSP, TRT, STJ, etc.)';
COMMENT ON TABLE case_workflow_phases IS 'Automated workflow phases for different types of legal procedures';
COMMENT ON TABLE oab_compliance_checks IS 'OAB (Brazilian Bar Association) compliance monitoring and violations';
COMMENT ON TABLE legal_templates IS 'Brazilian legal document templates for different practice areas';
COMMENT ON TABLE brazilian_holidays IS 'Brazilian national, state, and municipal holidays for deadline calculations';