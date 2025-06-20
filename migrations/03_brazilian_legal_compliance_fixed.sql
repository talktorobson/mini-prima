-- Migration 03: Brazilian Legal Compliance System (Phase 3) - FIXED VERSION
-- Critical Priority: Core legal operations and OAB compliance
-- Fixed: Resolved naming conflicts and column mismatches

-- 1. Case Deadlines Table - Legal deadline tracking with priority levels
CREATE TABLE IF NOT EXISTS case_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    deadline_type VARCHAR(50) NOT NULL,
    due_date DATE NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
    notification_sent BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_case_deadlines_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 2. Case Deadline Notifications Table - Automated alert scheduling (renamed to avoid conflicts)
CREATE TABLE IF NOT EXISTS case_deadline_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deadline_id UUID NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    days_before INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed')),
    notification_type VARCHAR(20) DEFAULT 'email' CHECK (notification_type IN ('email', 'sms', 'whatsapp', 'system')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_case_deadline_notifications_deadline FOREIGN KEY (deadline_id) REFERENCES case_deadlines(id) ON DELETE CASCADE
);

-- 3. Court Integrations Table - Brazilian court system connections
CREATE TABLE IF NOT EXISTS court_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    court_code VARCHAR(20) NOT NULL,
    process_number VARCHAR(100) NOT NULL,
    integration_data JSONB,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'active' CHECK (sync_status IN ('active', 'inactive', 'error')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_court_integrations_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    UNIQUE(case_id, court_code)
);

-- 4. Case Workflow Phases Table - Automated procedure phase management
CREATE TABLE IF NOT EXISTS case_workflow_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    workflow_type VARCHAR(50) NOT NULL,
    phase_name VARCHAR(100) NOT NULL,
    phase_order INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    estimated_start_date DATE,
    actual_start_date DATE,
    estimated_end_date DATE,
    actual_end_date DATE,
    required_documents JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_case_workflow_phases_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 5. OAB Compliance Checks Table - Professional compliance monitoring
CREATE TABLE IF NOT EXISTS oab_compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    compliance_rule VARCHAR(100) NOT NULL,
    check_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_compliant BOOLEAN NOT NULL,
    violation_details TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_oab_compliance_checks_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 6. Legal Templates Table - Document template library
CREATE TABLE IF NOT EXISTS legal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    practice_area VARCHAR(100) NOT NULL,
    court_type VARCHAR(50),
    content TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_legal_templates_created_by FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- 7. Case Status History Table - Case status change tracking
CREATE TABLE IF NOT EXISTS case_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_case_status_history_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    CONSTRAINT fk_case_status_history_changed_by FOREIGN KEY (changed_by) REFERENCES staff(id)
);

-- 8. Brazilian Holidays Table - National and state holiday calendar
CREATE TABLE IF NOT EXISTS brazilian_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_national BOOLEAN DEFAULT TRUE,
    state_code VARCHAR(2),
    city_code VARCHAR(10),
    is_court_holiday BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(holiday_date, state_code, city_code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_case_deadlines_case_id ON case_deadlines(case_id);
CREATE INDEX IF NOT EXISTS idx_case_deadlines_due_date ON case_deadlines(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_case_deadlines_priority ON case_deadlines(priority, due_date);
CREATE INDEX IF NOT EXISTS idx_case_deadline_notifications_scheduled ON case_deadline_notifications(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_case_deadline_notifications_deadline ON case_deadline_notifications(deadline_id);
CREATE INDEX IF NOT EXISTS idx_court_integrations_case_id ON court_integrations(case_id);
CREATE INDEX IF NOT EXISTS idx_court_integrations_court_code ON court_integrations(court_code);
CREATE INDEX IF NOT EXISTS idx_case_workflow_phases_case_id ON case_workflow_phases(case_id);
CREATE INDEX IF NOT EXISTS idx_case_workflow_phases_status ON case_workflow_phases(status, phase_order);
CREATE INDEX IF NOT EXISTS idx_oab_compliance_checks_case_id ON oab_compliance_checks(case_id);
CREATE INDEX IF NOT EXISTS idx_oab_compliance_checks_compliant ON oab_compliance_checks(is_compliant, severity);
CREATE INDEX IF NOT EXISTS idx_legal_templates_practice_area ON legal_templates(practice_area, template_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_case_status_history_case_id ON case_status_history(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brazilian_holidays_date ON brazilian_holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_brazilian_holidays_state ON brazilian_holidays(state_code, holiday_date) WHERE is_court_holiday = true;

-- Enable Row Level Security
ALTER TABLE case_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_deadline_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_workflow_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE oab_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE brazilian_holidays ENABLE ROW LEVEL SECURITY;

-- FIXED RLS Policies - using only existing columns and tables
CREATE POLICY "Users can view legal templates" ON legal_templates FOR SELECT USING (true);
CREATE POLICY "Users can view Brazilian holidays" ON brazilian_holidays FOR SELECT USING (true);

CREATE POLICY "Admins can view case deadlines" ON case_deadlines
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can view court integrations" ON court_integrations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can view case workflow phases" ON case_workflow_phases
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can view OAB compliance checks" ON oab_compliance_checks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can view case status history" ON case_status_history
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can view case deadline notifications" ON case_deadline_notifications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Insert sample Brazilian holidays for 2025 (fixed column order)
INSERT INTO brazilian_holidays (holiday_date, name, is_national, state_code, is_court_holiday) VALUES
('2025-01-01', 'Confraternização Universal', TRUE, NULL, TRUE),
('2025-04-21', 'Tiradentes', TRUE, NULL, TRUE),
('2025-09-07', 'Independência do Brasil', TRUE, NULL, TRUE),
('2025-10-12', 'Nossa Senhora Aparecida', TRUE, NULL, TRUE),
('2025-11-02', 'Finados', TRUE, NULL, TRUE),
('2025-11-15', 'Proclamação da República', TRUE, NULL, TRUE),
('2025-12-25', 'Natal', TRUE, NULL, TRUE),
-- São Paulo state holidays
('2025-02-13', 'Carnaval', FALSE, 'SP', TRUE),
('2025-02-14', 'Carnaval', FALSE, 'SP', TRUE),
('2025-04-18', 'Sexta-feira Santa', FALSE, 'SP', TRUE),
('2025-05-01', 'Dia do Trabalhador', FALSE, 'SP', TRUE),
('2025-06-19', 'Corpus Christi', FALSE, 'SP', TRUE)
ON CONFLICT (holiday_date, state_code, city_code) DO NOTHING;

-- Insert sample legal templates for Brazilian legal practice (only if staff exists)
DO $$
DECLARE
    staff_exists BOOLEAN;
    sample_staff_id UUID;
BEGIN
    -- Check if any staff exists
    SELECT EXISTS(SELECT 1 FROM staff LIMIT 1) INTO staff_exists;
    
    IF staff_exists THEN
        SELECT id INTO sample_staff_id FROM staff LIMIT 1;
        
        INSERT INTO legal_templates (name, template_type, practice_area, court_type, content, variables, is_active, version, created_by, created_at) VALUES
        (
            'Petição Inicial Trabalhista',
            'petition',
            'Labor Law',
            'TRT',
            'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DO TRABALHO DA VARA DO TRABALHO DE {{CIDADE}}

{{NOME_AUTOR}}, {{QUALIFICACAO_AUTOR}}, por meio de seu(sua) advogado(a) que esta subscreve, vem respeitosamente perante Vossa Excelência propor

RECLAMAÇÃO TRABALHISTA

em face de {{NOME_REU}}, {{QUALIFICACAO_REU}}, pelos motivos de fato e de direito a seguir expostos:

I - DOS FATOS
{{RELATO_FATOS}}

II - DO DIREITO
{{FUNDAMENTACAO_JURIDICA}}

III - DOS PEDIDOS
Diante do exposto, requer-se:
{{PEDIDOS}}

IV - DO VALOR DA CAUSA
Atribui-se à presente causa o valor de R$ {{VALOR_CAUSA}}.

{{CIDADE}}, {{DATA}}.

{{NOME_ADVOGADO}}
OAB/{{ESTADO}} {{NUMERO_OAB}}',
            '{"CIDADE": "text", "NOME_AUTOR": "text", "QUALIFICACAO_AUTOR": "text", "NOME_REU": "text", "QUALIFICACAO_REU": "text", "RELATO_FATOS": "textarea", "FUNDAMENTACAO_JURIDICA": "textarea", "PEDIDOS": "textarea", "VALOR_CAUSA": "currency", "DATA": "date", "NOME_ADVOGADO": "text", "ESTADO": "text", "NUMERO_OAB": "text"}',
            true,
            1,
            sample_staff_id,
            NOW()
        ),
        (
            'Contestação Cível',
            'defense',
            'Civil Law', 
            'TJSP',
            'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{VARA}} VARA CÍVEL DE {{COMARCA}}

{{NOME_REU}}, {{QUALIFICACAO_REU}}, já qualificado nos autos da ação {{TIPO_ACAO}} que lhe move {{NOME_AUTOR}}, vem, por seu advogado signatário, tempestivamente, apresentar

CONTESTAÇÃO

pelos motivos de fato e de direito que passa a expor:

I - PRELIMINARES
{{PRELIMINARES}}

II - DO MÉRITO
{{MERITO}}

III - DOS PEDIDOS
Diante do exposto, requer-se:
a) O acolhimento das preliminares arguidas;
b) No mérito, a total improcedência dos pedidos autorais;
{{PEDIDOS_ADICIONAIS}}

{{CIDADE}}, {{DATA}}.

{{NOME_ADVOGADO}}
OAB/{{ESTADO}} {{NUMERO_OAB}}',
            '{"VARA": "text", "COMARCA": "text", "NOME_REU": "text", "QUALIFICACAO_REU": "text", "TIPO_ACAO": "text", "NOME_AUTOR": "text", "PRELIMINARES": "textarea", "MERITO": "textarea", "PEDIDOS_ADICIONAIS": "textarea", "CIDADE": "text", "DATA": "date", "NOME_ADVOGADO": "text", "ESTADO": "text", "NUMERO_OAB": "text"}',
            true,
            1,
            sample_staff_id,
            NOW()
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert sample case workflow phases (only if cases exist)
DO $$
DECLARE
    case_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM cases WHERE service_type = 'Labor Law' LIMIT 1) INTO case_exists;
    
    IF case_exists THEN
        INSERT INTO case_workflow_phases (case_id, workflow_type, phase_name, phase_order, status, estimated_start_date, notes, created_at)
        SELECT 
            c.id,
            'labor_law_standard',
            phase_data.phase_name,
            phase_data.phase_order,
            'pending',
            CURRENT_DATE + (phase_data.phase_order * INTERVAL '7 days'),
            phase_data.notes,
            NOW()
        FROM cases c
        CROSS JOIN (
            VALUES 
                ('Análise Preliminar do Caso', 1, 'Análise inicial da documentação e viabilidade da ação'),
                ('Elaboração da Petição Inicial', 2, 'Redação da petição inicial trabalhista'),
                ('Protocolo da Ação', 3, 'Protocolo eletrônico no sistema do TRT'),
                ('Acompanhamento da Citação', 4, 'Verificação da citação válida da parte ré'),
                ('Análise da Contestação', 5, 'Estudo da defesa apresentada pela parte ré'),
                ('Audiência de Instrução', 6, 'Participação na audiência de instrução e julgamento'),
                ('Sentença', 7, 'Análise da sentença proferida pelo juízo'),
                ('Recursos (se aplicável)', 8, 'Interposição de recursos se necessário')
        ) AS phase_data(phase_name, phase_order, notes)
        WHERE c.service_type = 'Labor Law'
        LIMIT 3
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert sample OAB compliance rules (only if cases exist)
DO $$
DECLARE
    case_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM cases WHERE service_type IN ('Civil Law', 'Labor Law') LIMIT 1) INTO case_exists;
    
    IF case_exists THEN
        INSERT INTO oab_compliance_checks (case_id, compliance_rule, is_compliant, violation_details, severity, notes, created_at)
        SELECT 
            c.id,
            'Prazo para Contestação',
            true,
            NULL,
            'medium',
            'Verificação automática de cumprimento dos prazos processuais',
            NOW()
        FROM cases c
        WHERE c.service_type IN ('Civil Law', 'Labor Law')
        LIMIT 2
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Add table comments for documentation
COMMENT ON TABLE case_deadlines IS 'Brazilian legal deadline tracking with priority levels';
COMMENT ON TABLE case_deadline_notifications IS 'Automated alert scheduling for legal deadlines (renamed to avoid conflicts)';
COMMENT ON TABLE court_integrations IS 'Integration with Brazilian court systems (TJSP, TRT, STJ, etc.)';
COMMENT ON TABLE case_workflow_phases IS 'Automated procedure phase management for Brazilian legal cases';
COMMENT ON TABLE oab_compliance_checks IS 'Professional compliance monitoring aligned with OAB standards';
COMMENT ON TABLE legal_templates IS 'Professional Brazilian legal document templates';
COMMENT ON TABLE case_status_history IS 'Audit trail for case status changes';
COMMENT ON TABLE brazilian_holidays IS 'Brazilian national and state holidays for legal calendar calculations';

-- Migration completed
SELECT 'Brazilian Legal Compliance System (Phase 3) migration completed successfully!' as result;