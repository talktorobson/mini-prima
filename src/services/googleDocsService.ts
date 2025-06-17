import { supabase } from '@/integrations/supabase/client';
import { businessSettingsService } from './businessSettingsService';

export interface GoogleDocsCredentials {
  client_id: string;
  client_secret: string;
  service_account_key?: any;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  google_doc_id?: string;
  google_doc_url?: string;
  variables: TemplateVariable[];
  default_values: Record<string, any>;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'currency' | 'number' | 'select';
  required: boolean;
  options?: string[]; // For select type
  placeholder?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface DocumentGeneration {
  id: string;
  template_id: string;
  template_name: string;
  document_name: string;
  variable_values: Record<string, any>;
  google_doc_copy_id?: string;
  google_doc_copy_url?: string;
  google_doc_edit_url?: string;
  pdf_file_url?: string;
  status: 'draft' | 'editing' | 'review' | 'finalized' | 'delivered';
  workflow_stage: 'created' | 'variables_filled' | 'doc_generated' | 'staff_editing' | 'pdf_exported';
  case_id?: string;
  client_id?: string;
  generated_by: string;
  created_at: string;
  updated_at: string;
}

export const googleDocsService = {
  // Authentication & Setup
  async isGoogleDocsEnabled(): Promise<boolean> {
    const settings = await businessSettingsService.getGoogleDocsSettings();
    return settings.enabled && settings.has_credentials;
  },

  async getGoogleAuthUrl(): Promise<string> {
    const settings = await businessSettingsService.getGoogleDocsSettings();
    
    if (!settings.client_id) {
      throw new Error('Google Docs integration não configurado');
    }

    const scopes = [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: settings.client_id,
      redirect_uri: `${window.location.origin}/admin/google-auth-callback`,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async handleAuthCallback(code: string): Promise<boolean> {
    try {
      // In a real implementation, this would exchange the code for tokens
      // For now, we'll simulate the process
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Store mock tokens (in production, you'd call Google's token endpoint)
      const { error } = await supabase
        .from('google_auth_tokens')
        .upsert({
          staff_id: user.id,
          access_token: 'mock_access_token_' + Date.now(),
          refresh_token: 'mock_refresh_token_' + Date.now(),
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          scope: 'documents drive',
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error handling Google auth callback:', error);
      return false;
    }
  },

  async hasValidToken(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: token } = await supabase
      .from('google_auth_tokens')
      .select('expires_at')
      .eq('staff_id', user.id)
      .single();

    if (!token) return false;

    return new Date(token.expires_at) > new Date();
  },

  // Template Management
  async getDocumentTemplates(category?: string): Promise<DocumentTemplate[]> {
    let query = supabase
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query;

    if (error) throw error;

    return (templates || []).map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || '',
      category: template.category,
      google_doc_id: template.google_doc_id || undefined,
      google_doc_url: template.google_doc_url || undefined,
      variables: template.variables as TemplateVariable[] || [],
      default_values: template.default_values as Record<string, any> || {},
    }));
  },

  async createTemplate(templateData: {
    name: string;
    description: string;
    category: string;
    practice_area?: string;
    variables: TemplateVariable[];
    google_doc_url?: string;
  }): Promise<DocumentTemplate> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    let google_doc_id: string | undefined;
    
    // Extract Google Doc ID from URL if provided
    if (templateData.google_doc_url) {
      const match = templateData.google_doc_url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
      google_doc_id = match ? match[1] : undefined;
    }

    const { data: template, error } = await supabase
      .from('document_templates')
      .insert({
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        practice_area: templateData.practice_area,
        google_doc_id,
        google_doc_url: templateData.google_doc_url,
        variables: templateData.variables,
        default_values: {},
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: template.id,
      name: template.name,
      description: template.description || '',
      category: template.category,
      google_doc_id: template.google_doc_id || undefined,
      google_doc_url: template.google_doc_url || undefined,
      variables: template.variables as TemplateVariable[] || [],
      default_values: template.default_values as Record<string, any> || {},
    };
  },

  async updateTemplate(templateId: string, updates: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const { data: template, error } = await supabase
      .from('document_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: template.id,
      name: template.name,
      description: template.description || '',
      category: template.category,
      google_doc_id: template.google_doc_id || undefined,
      google_doc_url: template.google_doc_url || undefined,
      variables: template.variables as TemplateVariable[] || [],
      default_values: template.default_values as Record<string, any> || {},
    };
  },

  async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('document_templates')
      .update({ is_active: false })
      .eq('id', templateId);

    if (error) throw error;
  },

  // Document Generation
  async generateDocument(templateId: string, variableValues: Record<string, any>, options?: {
    document_name?: string;
    case_id?: string;
    client_id?: string;
  }): Promise<DocumentGeneration> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Increment template usage
    await supabase.rpc('increment_template_usage', { template_id: templateId });

    // Create document generation record
    const documentName = options?.document_name || 
      `${template.name} - ${new Date().toLocaleDateString('pt-BR')}`;

    const { data: generation, error: generationError } = await supabase
      .from('document_generations')
      .insert({
        template_id: templateId,
        case_id: options?.case_id,
        client_id: options?.client_id,
        document_name: documentName,
        variable_values: variableValues,
        generated_by: user.id,
        status: 'draft',
        workflow_stage: 'variables_filled',
      })
      .select(`
        *,
        template:document_templates(name)
      `)
      .single();

    if (generationError) throw generationError;

    // Simulate Google Docs document creation
    if (template.google_doc_id) {
      await this.createGoogleDocCopy(generation.id, template.google_doc_id, variableValues);
    }

    return {
      id: generation.id,
      template_id: generation.template_id,
      template_name: generation.template?.name || template.name,
      document_name: generation.document_name,
      variable_values: generation.variable_values as Record<string, any>,
      google_doc_copy_id: generation.google_doc_copy_id || undefined,
      google_doc_copy_url: generation.google_doc_copy_url || undefined,
      google_doc_edit_url: generation.google_doc_edit_url || undefined,
      pdf_file_url: generation.pdf_file_url || undefined,
      status: generation.status as any,
      workflow_stage: generation.workflow_stage as any,
      case_id: generation.case_id || undefined,
      client_id: generation.client_id || undefined,
      generated_by: generation.generated_by,
      created_at: generation.created_at,
      updated_at: generation.updated_at,
    };
  },

  async createGoogleDocCopy(generationId: string, templateDocId: string, variables: Record<string, any>): Promise<void> {
    // In a real implementation, this would:
    // 1. Make a copy of the Google Doc template
    // 2. Replace variables in the copy
    // 3. Update the generation record with the new document URLs

    // For now, we'll simulate this process
    const mockDocId = 'mock_doc_' + Date.now();
    const mockCopyUrl = `https://docs.google.com/document/d/${mockDocId}/edit`;
    const mockViewUrl = `https://docs.google.com/document/d/${mockDocId}/view`;

    const { error } = await supabase
      .from('document_generations')
      .update({
        google_doc_copy_id: mockDocId,
        google_doc_copy_url: mockViewUrl,
        google_doc_edit_url: mockCopyUrl,
        workflow_stage: 'doc_generated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', generationId);

    if (error) throw error;
  },

  async getDocumentGenerations(filters?: {
    status?: string;
    case_id?: string;
    client_id?: string;
    generated_by?: string;
  }): Promise<DocumentGeneration[]> {
    let query = supabase
      .from('document_generations')
      .select(`
        *,
        template:document_templates(name),
        case:cases(case_number, title),
        client:clients(company_name),
        staff:staff(name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.case_id) {
      query = query.eq('case_id', filters.case_id);
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters?.generated_by) {
      query = query.eq('generated_by', filters.generated_by);
    }

    const { data: generations, error } = await query;

    if (error) throw error;

    return (generations || []).map(gen => ({
      id: gen.id,
      template_id: gen.template_id,
      template_name: gen.template?.name || 'Template não encontrado',
      document_name: gen.document_name,
      variable_values: gen.variable_values as Record<string, any>,
      google_doc_copy_id: gen.google_doc_copy_id || undefined,
      google_doc_copy_url: gen.google_doc_copy_url || undefined,
      google_doc_edit_url: gen.google_doc_edit_url || undefined,
      pdf_file_url: gen.pdf_file_url || undefined,
      status: gen.status as any,
      workflow_stage: gen.workflow_stage as any,
      case_id: gen.case_id || undefined,
      client_id: gen.client_id || undefined,
      generated_by: gen.generated_by,
      created_at: gen.created_at,
      updated_at: gen.updated_at,
    }));
  },

  async updateGenerationStatus(generationId: string, status: string, stage?: string): Promise<void> {
    const { error } = await supabase.rpc('update_generation_status', {
      generation_id: generationId,
      new_status: status,
      new_stage: stage,
    });

    if (error) throw error;
  },

  // PDF Export
  async exportToPDF(generationId: string): Promise<string> {
    // In a real implementation, this would:
    // 1. Get the Google Doc content
    // 2. Apply business branding
    // 3. Generate PDF using a service like Puppeteer or Google Docs API
    // 4. Upload to storage
    // 5. Return the PDF URL

    // For now, we'll simulate this process
    const mockPdfUrl = `https://storage.example.com/pdfs/document_${generationId}_${Date.now()}.pdf`;

    const { error } = await supabase
      .from('document_generations')
      .update({
        pdf_file_url: mockPdfUrl,
        workflow_stage: 'pdf_exported',
        updated_at: new Date().toISOString(),
      })
      .eq('id', generationId);

    if (error) throw error;

    return mockPdfUrl;
  },

  // Utility Functions
  getTemplateCategories(): Array<{ value: string; label: string }> {
    return [
      { value: 'contract', label: 'Contratos' },
      { value: 'petition', label: 'Petições' },
      { value: 'notice', label: 'Notificações' },
      { value: 'invoice', label: 'Faturas' },
      { value: 'report', label: 'Relatórios' },
      { value: 'correspondence', label: 'Correspondências' },
      { value: 'legal_opinion', label: 'Pareceres Jurídicos' },
      { value: 'power_of_attorney', label: 'Procurações' },
    ];
  },

  getPracticeAreas(): Array<{ value: string; label: string }> {
    return [
      { value: 'labor', label: 'Direito Trabalhista' },
      { value: 'civil', label: 'Direito Civil' },
      { value: 'commercial', label: 'Direito Empresarial' },
      { value: 'criminal', label: 'Direito Penal' },
      { value: 'tax', label: 'Direito Tributário' },
      { value: 'administrative', label: 'Direito Administrativo' },
      { value: 'constitutional', label: 'Direito Constitucional' },
      { value: 'consumer', label: 'Direito do Consumidor' },
    ];
  },

  validateVariableValue(variable: TemplateVariable, value: any): { valid: boolean; error?: string } {
    if (variable.required && (!value || value.toString().trim() === '')) {
      return { valid: false, error: `${variable.label} é obrigatório` };
    }

    if (!value) return { valid: true };

    switch (variable.type) {
      case 'currency':
        if (isNaN(parseFloat(value))) {
          return { valid: false, error: `${variable.label} deve ser um valor monetário válido` };
        }
        break;
      case 'number':
        if (isNaN(Number(value))) {
          return { valid: false, error: `${variable.label} deve ser um número válido` };
        }
        if (variable.validation?.min && Number(value) < variable.validation.min) {
          return { valid: false, error: `${variable.label} deve ser maior que ${variable.validation.min}` };
        }
        if (variable.validation?.max && Number(value) > variable.validation.max) {
          return { valid: false, error: `${variable.label} deve ser menor que ${variable.validation.max}` };
        }
        break;
      case 'date':
        if (isNaN(Date.parse(value))) {
          return { valid: false, error: `${variable.label} deve ser uma data válida` };
        }
        break;
      case 'text':
      case 'textarea':
        if (variable.validation?.pattern) {
          const regex = new RegExp(variable.validation.pattern);
          if (!regex.test(value)) {
            return { valid: false, error: `${variable.label} não atende ao formato esperado` };
          }
        }
        break;
    }

    return { valid: true };
  },
};