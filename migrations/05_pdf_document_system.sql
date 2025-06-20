-- Migration 05: PDF Export & Document System
-- High Priority: Client deliverables and branded document generation
-- Apply fifth: Document management and branding system

-- 1. Business Settings Table - Customizable logos and branding
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'boolean', 'json', 'file', 'color', 'date')),
    category VARCHAR(100) DEFAULT 'general',
    display_name VARCHAR(255),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB,
    sort_order INTEGER DEFAULT 0,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_business_settings_updated_by FOREIGN KEY (updated_by) REFERENCES staff(id)
);

-- 2. Document Templates Table - Google Docs integration
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    google_doc_id VARCHAR(255),
    google_doc_url TEXT,
    template_content TEXT,
    variables JSONB DEFAULT '{}',
    styling JSONB DEFAULT '{}',
    header_content TEXT,
    footer_content TEXT,
    page_settings JSONB DEFAULT '{"pageSize": "A4", "margins": {"top": 72, "bottom": 72, "left": 72, "right": 72}}',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    parent_template_id UUID,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    access_level VARCHAR(50) DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'restricted', 'private')),
    requires_approval BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_document_templates_parent FOREIGN KEY (parent_template_id) REFERENCES document_templates(id),
    CONSTRAINT fk_document_templates_created_by FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- 3. Document Generations Table - PDF creation workflow tracking
CREATE TABLE IF NOT EXISTS document_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL,
    client_id UUID,
    case_id UUID,
    document_name VARCHAR(255) NOT NULL,
    generated_by UUID NOT NULL,
    generation_status VARCHAR(50) DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    template_data JSONB NOT NULL DEFAULT '{}',
    merged_content TEXT,
    pdf_url TEXT,
    pdf_size_bytes INTEGER,
    page_count INTEGER,
    generation_time_ms INTEGER,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    is_final_version BOOLEAN DEFAULT false,
    version_number INTEGER DEFAULT 1,
    watermark_text VARCHAR(255),
    password_protected BOOLEAN DEFAULT false,
    access_expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    last_downloaded TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_document_generations_template FOREIGN KEY (template_id) REFERENCES document_templates(id),
    CONSTRAINT fk_document_generations_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_document_generations_case FOREIGN KEY (case_id) REFERENCES cases(id),
    CONSTRAINT fk_document_generations_generated_by FOREIGN KEY (generated_by) REFERENCES staff(id)
);

-- 4. Business Files Table - Logo and asset management
CREATE TABLE IF NOT EXISTS business_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_category VARCHAR(100) DEFAULT 'general' CHECK (file_category IN ('logo', 'letterhead', 'signature', 'template', 'image', 'document', 'general')),
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT,
    thumbnail_url TEXT,
    dimensions JSONB, -- {"width": 1200, "height": 800}
    alt_text VARCHAR(255),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    usage_contexts TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    parent_file_id UUID,
    checksum VARCHAR(64),
    virus_scan_status VARCHAR(20) DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'failed')),
    virus_scan_date TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_business_files_parent FOREIGN KEY (parent_file_id) REFERENCES business_files(id),
    CONSTRAINT fk_business_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES staff(id)
);

-- 5. Google Auth Tokens Table - OAuth integration for Google Docs
CREATE TABLE IF NOT EXISTS google_auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    staff_id UUID,
    token_type VARCHAR(50) DEFAULT 'docs' CHECK (token_type IN ('docs', 'drive', 'sheets', 'gmail')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_refreshed TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_google_auth_tokens_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT fk_google_auth_tokens_staff FOREIGN KEY (staff_id) REFERENCES staff(id),
    UNIQUE(user_id, token_type)
);

-- 6. Template Variables Table - Document generation variables
CREATE TABLE IF NOT EXISTS template_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variable_name VARCHAR(100) NOT NULL,
    variable_type VARCHAR(50) NOT NULL CHECK (variable_type IN ('text', 'number', 'date', 'currency', 'email', 'phone', 'textarea', 'select', 'boolean')),
    category VARCHAR(100) DEFAULT 'general',
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    default_value TEXT,
    validation_rules JSONB,
    options JSONB, -- for select type variables
    is_required BOOLEAN DEFAULT false,
    is_system_variable BOOLEAN DEFAULT false,
    data_source VARCHAR(100), -- table.column for dynamic variables
    format_template VARCHAR(255), -- for formatting output
    sort_order INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_template_variables_created_by FOREIGN KEY (created_by) REFERENCES staff(id),
    UNIQUE(variable_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_settings_category ON business_settings(category, sort_order);
CREATE INDEX IF NOT EXISTS idx_business_settings_key ON business_settings(setting_key) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category, template_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_document_templates_usage ON document_templates(usage_count DESC, last_used DESC);
CREATE INDEX IF NOT EXISTS idx_document_generations_template ON document_generations(template_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_generations_client ON document_generations(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_generations_status ON document_generations(generation_status, created_at);
CREATE INDEX IF NOT EXISTS idx_business_files_category ON business_files(file_category, is_public);
CREATE INDEX IF NOT EXISTS idx_business_files_type ON business_files(file_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_auth_tokens_user ON google_auth_tokens(user_id, token_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_google_auth_tokens_expires ON google_auth_tokens(token_expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_template_variables_category ON template_variables(category, sort_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_template_variables_type ON template_variables(variable_type, category);

-- Enable Row Level Security
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Public business settings are viewable by all" ON business_settings
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all business settings" ON business_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can view active document templates" ON document_templates
    FOR SELECT USING (
        is_active = true 
        AND (access_level = 'public' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    );

CREATE POLICY "Staff can view their document generations" ON document_generations
    FOR SELECT USING (
        generated_by IN (
            SELECT id FROM staff WHERE id IN (
                SELECT staff_id::uuid FROM admin_users WHERE user_id = auth.uid()
            )
        )
        OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can view public business files" ON business_files
    FOR SELECT USING (
        is_public = true 
        OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage their own Google auth tokens" ON google_auth_tokens
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Staff can view active template variables" ON template_variables
    FOR SELECT USING (is_active = true);

-- Insert default business settings
INSERT INTO business_settings (setting_key, setting_value, setting_type, category, display_name, description, is_public, sort_order, created_at) VALUES
('company_name', 'D''Avila Reis Advogados', 'text', 'company', 'Nome da Empresa', 'Nome oficial da empresa para documentos', true, 1, NOW()),
('company_address', 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100', 'text', 'company', 'Endereço da Empresa', 'Endereço completo para correspondência', true, 2, NOW()),
('company_phone', '+55 11 3000-0000', 'text', 'company', 'Telefone Principal', 'Telefone principal da empresa', true, 3, NOW()),
('company_email', 'contato@davilareisadvogados.com.br', 'text', 'company', 'E-mail Principal', 'E-mail principal para contato', true, 4, NOW()),
('company_website', 'https://www.davilareisadvogados.com.br', 'text', 'company', 'Website', 'Website oficial da empresa', true, 5, NOW()),
('primary_color', '#1e40af', 'color', 'branding', 'Cor Primária', 'Cor principal da marca para documentos', false, 10, NOW()),
('secondary_color', '#64748b', 'color', 'branding', 'Cor Secundária', 'Cor secundária da marca', false, 11, NOW()),
('logo_url', '', 'file', 'branding', 'Logo Principal', 'Logo da empresa para documentos', false, 12, NOW()),
('letterhead_template', '', 'file', 'branding', 'Papel Timbrado', 'Template de papel timbrado', false, 13, NOW()),
('document_footer', 'D''Avila Reis Advogados - OAB/SP 123.456', 'text', 'documents', 'Rodapé de Documentos', 'Texto padrão para rodapé', false, 20, NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default document templates
INSERT INTO document_templates (name, template_type, category, description, template_content, variables, is_active, created_by, created_at)
SELECT 
    'Contrato de Prestação de Serviços Jurídicos',
    'contract',
    'contratos',
    'Template padrão para contratos de serviços jurídicos',
    'CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS

CONTRATANTE: {{NOME_CLIENTE}}
CNPJ: {{CNPJ_CLIENTE}}
Endereço: {{ENDERECO_CLIENTE}}

CONTRATADA: D''Avila Reis Advogados
CNPJ: 12.345.678/0001-90
Endereço: Av. Paulista, 1000 - São Paulo/SP

OBJETO: {{OBJETO_CONTRATO}}

VALOR: R$ {{VALOR_CONTRATO}}

PRAZO: {{PRAZO_CONTRATO}}

São Paulo, {{DATA_CONTRATO}}.

_________________________        _________________________
      CONTRATANTE                    CONTRATADA',
    '{
        "NOME_CLIENTE": {"type": "text", "required": true},
        "CNPJ_CLIENTE": {"type": "text", "required": true},
        "ENDERECO_CLIENTE": {"type": "textarea", "required": true},
        "OBJETO_CONTRATO": {"type": "textarea", "required": true},
        "VALOR_CONTRATO": {"type": "currency", "required": true},
        "PRAZO_CONTRATO": {"type": "text", "required": true},
        "DATA_CONTRATO": {"type": "date", "required": true}
    }',
    true,
    s.id,
    NOW()
FROM staff s
WHERE s.position = 'Partner'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert default template variables
INSERT INTO template_variables (variable_name, variable_type, category, display_name, description, is_system_variable, data_source, created_at) VALUES
('NOME_CLIENTE', 'text', 'client', 'Nome do Cliente', 'Nome ou razão social do cliente', true, 'clients.company_name', NOW()),
('CNPJ_CLIENTE', 'text', 'client', 'CNPJ/CPF do Cliente', 'Documento de identificação do cliente', true, 'clients.cnpj', NOW()),
('ENDERECO_CLIENTE', 'textarea', 'client', 'Endereço do Cliente', 'Endereço completo do cliente', true, 'clients.address', NOW()),
('EMAIL_CLIENTE', 'email', 'client', 'E-mail do Cliente', 'E-mail principal do cliente', true, 'clients.email', NOW()),
('TELEFONE_CLIENTE', 'phone', 'client', 'Telefone do Cliente', 'Telefone principal do cliente', true, 'clients.phone', NOW()),
('NUMERO_CASO', 'text', 'case', 'Número do Caso', 'Número identificador do caso', true, 'cases.case_number', NOW()),
('TITULO_CASO', 'text', 'case', 'Título do Caso', 'Título ou descrição do caso', true, 'cases.case_title', NOW()),
('ADVOGADO_RESPONSAVEL', 'text', 'case', 'Advogado Responsável', 'Nome do advogado responsável pelo caso', true, 'cases.assigned_lawyer', NOW()),
('DATA_ATUAL', 'date', 'system', 'Data Atual', 'Data atual do sistema', true, 'CURRENT_DATE', NOW()),
('NOME_EMPRESA', 'text', 'company', 'Nome da Empresa', 'Nome da empresa (D''Avila Reis Advogados)', true, 'business_settings.company_name', NOW())
ON CONFLICT (variable_name) DO NOTHING;

-- Add table comments for documentation
COMMENT ON TABLE business_settings IS 'Customizable business settings and branding configuration';
COMMENT ON TABLE document_templates IS 'Document templates with Google Docs integration and variable substitution';
COMMENT ON TABLE document_generations IS 'PDF generation workflow tracking with version control';
COMMENT ON TABLE business_files IS 'Asset management for logos, letterheads, and document resources';
COMMENT ON TABLE google_auth_tokens IS 'OAuth tokens for Google Docs API integration';
COMMENT ON TABLE template_variables IS 'Reusable variables for document template generation';

-- Migration completed
SELECT 'PDF Export & Document System migration completed successfully!' as result;