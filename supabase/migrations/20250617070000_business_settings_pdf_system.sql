-- Business Settings & PDF Export System Migration
-- Customizable branding, Google Docs integration, and legal templates

-- Business settings table for company branding and configuration
CREATE TABLE business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Company branding
    company_name VARCHAR(255) DEFAULT 'D''Avila Reis Advogados',
    company_logo_url TEXT, -- URL to uploaded logo file
    company_letterhead_url TEXT, -- URL to letterhead template
    company_favicon_url TEXT, -- URL to favicon
    
    -- Company information
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    company_website VARCHAR(255),
    oab_registration VARCHAR(100), -- Brazilian Bar Association number
    cnpj VARCHAR(20),
    
    -- PDF branding settings
    pdf_header_color VARCHAR(7) DEFAULT '#dc2626', -- Hex color for PDF headers
    pdf_footer_text TEXT DEFAULT 'Documento gerado automaticamente pelo sistema',
    pdf_watermark_text VARCHAR(100),
    pdf_font_family VARCHAR(50) DEFAULT 'Arial',
    
    -- Google Docs integration settings
    google_docs_enabled BOOLEAN DEFAULT false,
    google_client_id TEXT,
    google_client_secret TEXT,
    google_service_account_key JSONB, -- Service account credentials
    google_drive_folder_id VARCHAR(100), -- Folder for templates
    
    -- System settings
    default_language VARCHAR(5) DEFAULT 'pt-BR',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    currency VARCHAR(3) DEFAULT 'BRL',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES admin_users(id)
);

-- Legal document templates table
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'contract', 'petition', 'notice', 'invoice', 'report'
    template_type VARCHAR(50) DEFAULT 'google_docs', -- 'google_docs', 'pdf', 'html'
    
    -- Google Docs integration
    google_doc_id VARCHAR(100), -- Google Docs document ID
    google_doc_url TEXT,
    google_doc_template_url TEXT, -- Template copy URL
    
    -- Template variables configuration
    variables JSONB DEFAULT '[]'::jsonb, -- [{name: "client_name", label: "Nome do Cliente", type: "text", required: true}]
    default_values JSONB DEFAULT '{}'::jsonb, -- {client_name: "", case_number: ""}
    
    -- Legal specifics
    practice_area VARCHAR(100), -- 'labor', 'civil', 'commercial', 'criminal'
    jurisdiction VARCHAR(50), -- 'federal', 'state', 'municipal'
    legal_basis TEXT, -- Article references
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Status and organization
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false, -- Available to all staff
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document generation history
CREATE TABLE document_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    template_id UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    generated_by UUID NOT NULL REFERENCES staff(id),
    
    -- Document details
    document_name VARCHAR(255) NOT NULL,
    variable_values JSONB NOT NULL, -- Actual values used for generation
    
    -- Google Docs workflow
    google_doc_copy_id VARCHAR(100), -- ID of the generated document copy
    google_doc_copy_url TEXT,
    google_doc_edit_url TEXT,
    
    -- File outputs
    pdf_file_url TEXT, -- Final PDF file URL
    original_doc_url TEXT, -- Original document URL
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'editing', 'review', 'finalized', 'delivered'
    workflow_stage VARCHAR(50) DEFAULT 'created', -- 'created', 'variables_filled', 'doc_generated', 'staff_editing', 'pdf_exported'
    
    -- Collaboration
    shared_with JSONB DEFAULT '[]'::jsonb, -- Array of staff IDs with access
    editing_permissions JSONB DEFAULT '{}'::jsonb, -- {staff_id: "edit|view|comment"}
    
    -- Notes and tracking
    generation_notes TEXT,
    staff_notes TEXT,
    client_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalized_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- File uploads for branding assets
CREATE TABLE business_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File information
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'logo', 'letterhead', 'favicon', 'template', 'asset'
    mime_type VARCHAR(100),
    file_size INTEGER,
    file_url TEXT NOT NULL,
    
    -- Usage
    is_active BOOLEAN DEFAULT true,
    usage_context VARCHAR(100), -- 'pdf_header', 'email_signature', 'letterhead', 'favicon'
    
    -- Metadata
    uploaded_by UUID NOT NULL REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google Docs API tokens (encrypted storage)
CREATE TABLE google_auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User association
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    
    -- Token data (should be encrypted in production)
    access_token TEXT,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(staff_id)
);

-- Indexes for performance
CREATE INDEX idx_document_templates_category ON document_templates(category);
CREATE INDEX idx_document_templates_active ON document_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_document_templates_practice_area ON document_templates(practice_area);

CREATE INDEX idx_document_generations_template ON document_generations(template_id);
CREATE INDEX idx_document_generations_case ON document_generations(case_id) WHERE case_id IS NOT NULL;
CREATE INDEX idx_document_generations_client ON document_generations(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_document_generations_status ON document_generations(status);
CREATE INDEX idx_document_generations_created_by ON document_generations(generated_by);

CREATE INDEX idx_business_files_type ON business_files(file_type);
CREATE INDEX idx_business_files_active ON business_files(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_auth_tokens ENABLE ROW LEVEL SECURITY;

-- Admin access to business settings
CREATE POLICY "Admin access to business settings" ON business_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

-- Document templates access
CREATE POLICY "Staff can view public templates" ON document_templates
    FOR SELECT USING (
        is_active = true AND (
            is_public = true OR 
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM admin_users au
                WHERE au.id = auth.uid()
            )
        )
    );

CREATE POLICY "Admin can manage all templates" ON document_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Staff can create templates" ON document_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Document generations access
CREATE POLICY "Staff can view own generations" ON document_generations
    FOR SELECT USING (
        generated_by = auth.uid() OR
        auth.uid() = ANY(SELECT jsonb_array_elements_text(shared_with)::uuid) OR
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

CREATE POLICY "Staff can create generations" ON document_generations
    FOR INSERT WITH CHECK (generated_by = auth.uid());

CREATE POLICY "Staff can update own generations" ON document_generations
    FOR UPDATE USING (
        generated_by = auth.uid() OR
        auth.uid() = ANY(SELECT jsonb_array_elements_text(shared_with)::uuid)
    );

-- Business files access
CREATE POLICY "Staff can view business files" ON business_files
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage business files" ON business_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
        )
    );

-- Google auth tokens access
CREATE POLICY "Staff can manage own tokens" ON google_auth_tokens
    FOR ALL USING (staff_id = auth.uid());

-- Functions for business settings
CREATE OR REPLACE FUNCTION get_business_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    EXECUTE 'SELECT ' || quote_ident(setting_key) || ' FROM business_settings LIMIT 1' 
    INTO setting_value;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE document_templates 
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update document generation status
CREATE OR REPLACE FUNCTION update_generation_status(
    generation_id UUID,
    new_status TEXT,
    new_stage TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE document_generations 
    SET 
        status = new_status,
        workflow_stage = COALESCE(new_stage, workflow_stage),
        updated_at = NOW(),
        finalized_at = CASE WHEN new_status = 'finalized' THEN NOW() ELSE finalized_at END,
        delivered_at = CASE WHEN new_status = 'delivered' THEN NOW() ELSE delivered_at END
    WHERE id = generation_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default business settings
INSERT INTO business_settings (
    company_name,
    company_address,
    company_phone,
    company_email,
    oab_registration,
    pdf_footer_text
) VALUES (
    'D''Avila Reis Advogados',
    'São Paulo, SP - Brasil',
    '+55 (11) 99999-9999',
    'contato@davilareis.adv.br',
    'OAB/SP 999.999',
    'Documento gerado automaticamente pelo sistema D''Avila Reis Advogados'
);

-- Insert sample document templates
INSERT INTO document_templates (
    name,
    description,
    category,
    practice_area,
    variables,
    created_by
) VALUES 
(
    'Contrato de Prestação de Serviços Advocatícios',
    'Modelo padrão para contratos de prestação de serviços legais',
    'contract',
    'civil',
    '[
        {"name": "client_name", "label": "Nome do Cliente", "type": "text", "required": true},
        {"name": "client_document", "label": "CPF/CNPJ", "type": "text", "required": true},
        {"name": "client_address", "label": "Endereço do Cliente", "type": "textarea", "required": true},
        {"name": "service_description", "label": "Descrição dos Serviços", "type": "textarea", "required": true},
        {"name": "contract_value", "label": "Valor do Contrato", "type": "currency", "required": true},
        {"name": "payment_terms", "label": "Condições de Pagamento", "type": "textarea", "required": true},
        {"name": "contract_date", "label": "Data do Contrato", "type": "date", "required": true}
    ]'::jsonb,
    (SELECT id FROM admin_users LIMIT 1)
),
(
    'Petição Inicial Trabalhista',
    'Modelo para petições iniciais na Justiça do Trabalho',
    'petition',
    'labor',
    '[
        {"name": "author_name", "label": "Nome do Requerente", "type": "text", "required": true},
        {"name": "author_document", "label": "CPF", "type": "text", "required": true},
        {"name": "defendant_name", "label": "Nome do Requerido", "type": "text", "required": true},
        {"name": "defendant_cnpj", "label": "CNPJ do Requerido", "type": "text", "required": true},
        {"name": "employment_period", "label": "Período de Trabalho", "type": "text", "required": true},
        {"name": "job_title", "label": "Cargo/Função", "type": "text", "required": true},
        {"name": "salary", "label": "Último Salário", "type": "currency", "required": true},
        {"name": "claims", "label": "Pedidos", "type": "textarea", "required": true},
        {"name": "facts", "label": "Dos Fatos", "type": "textarea", "required": true}
    ]'::jsonb,
    (SELECT id FROM admin_users LIMIT 1)
),
(
    'Fatura de Honorários',
    'Modelo para faturas de cobrança de honorários advocatícios',
    'invoice',
    'commercial',
    '[
        {"name": "invoice_number", "label": "Número da Fatura", "type": "text", "required": true},
        {"name": "issue_date", "label": "Data de Emissão", "type": "date", "required": true},
        {"name": "due_date", "label": "Data de Vencimento", "type": "date", "required": true},
        {"name": "client_name", "label": "Nome do Cliente", "type": "text", "required": true},
        {"name": "services_performed", "label": "Serviços Prestados", "type": "textarea", "required": true},
        {"name": "period", "label": "Período de Referência", "type": "text", "required": true},
        {"name": "total_amount", "label": "Valor Total", "type": "currency", "required": true},
        {"name": "payment_instructions", "label": "Instruções de Pagamento", "type": "textarea", "required": false}
    ]'::jsonb,
    (SELECT id FROM admin_users LIMIT 1)
);

COMMENT ON TABLE business_settings IS 'Business configuration and branding settings';
COMMENT ON TABLE document_templates IS 'Legal document templates with Google Docs integration';
COMMENT ON TABLE document_generations IS 'History of generated documents with workflow tracking';
COMMENT ON TABLE business_files IS 'Uploaded files for branding and templates';
COMMENT ON TABLE google_auth_tokens IS 'Google API authentication tokens for staff members';