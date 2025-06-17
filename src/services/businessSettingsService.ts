import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type BusinessSettings = Database['public']['Tables']['business_settings']['Row'];
type BusinessSettingsInsert = Database['public']['Tables']['business_settings']['Insert'];
type BusinessSettingsUpdate = Database['public']['Tables']['business_settings']['Update'];
type BusinessFile = Database['public']['Tables']['business_files']['Row'];
type BusinessFileInsert = Database['public']['Tables']['business_files']['Insert'];

export interface BusinessSettingsWithFiles extends BusinessSettings {
  logo_file?: BusinessFile;
  letterhead_file?: BusinessFile;
  favicon_file?: BusinessFile;
}

export interface FileUploadResult {
  url: string;
  file_path: string;
  public_url: string;
}

export const businessSettingsService = {
  // Business Settings Management
  async getBusinessSettings(): Promise<BusinessSettingsWithFiles | null> {
    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is acceptable
      throw error;
    }

    if (!settings) return null;

    // Get associated files
    const { data: files } = await supabase
      .from('business_files')
      .select('*')
      .eq('is_active', true)
      .in('file_type', ['logo', 'letterhead', 'favicon']);

    const result: BusinessSettingsWithFiles = {
      ...settings,
      logo_file: files?.find(f => f.file_type === 'logo'),
      letterhead_file: files?.find(f => f.file_type === 'letterhead'),
      favicon_file: files?.find(f => f.file_type === 'favicon'),
    };

    return result;
  },

  async updateBusinessSettings(data: BusinessSettingsUpdate): Promise<BusinessSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Check if settings exist, create or update accordingly
    const existing = await this.getBusinessSettings();
    
    if (existing) {
      const { data: settings, error } = await supabase
        .from('business_settings')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return settings;
    } else {
      const { data: settings, error } = await supabase
        .from('business_settings')
        .insert({
          ...data,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return settings;
    }
  },

  // File Upload Management
  async uploadBusinessFile(
    file: File, 
    fileType: 'logo' | 'letterhead' | 'favicon' | 'template' | 'asset',
    usageContext?: string
  ): Promise<FileUploadResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${fileType}_${Date.now()}.${fileExt}`;
    const filePath = `business/${fileType}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Deactivate previous files of the same type
    await supabase
      .from('business_files')
      .update({ is_active: false })
      .eq('file_type', fileType)
      .eq('is_active', true);

    // Save file record
    const { data: fileRecord, error: recordError } = await supabase
      .from('business_files')
      .insert({
        file_name: file.name,
        file_type: fileType,
        mime_type: file.type,
        file_size: file.size,
        file_url: publicUrl,
        usage_context: usageContext,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (recordError) throw recordError;

    // Update business settings if applicable
    if (fileType === 'logo') {
      await this.updateBusinessSettings({ company_logo_url: publicUrl });
    } else if (fileType === 'letterhead') {
      await this.updateBusinessSettings({ company_letterhead_url: publicUrl });
    } else if (fileType === 'favicon') {
      await this.updateBusinessSettings({ company_favicon_url: publicUrl });
    }

    return {
      url: publicUrl,
      file_path: filePath,
      public_url: publicUrl,
    };
  },

  async getBusinessFiles(fileType?: string): Promise<BusinessFile[]> {
    let query = supabase
      .from('business_files')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fileType) {
      query = query.eq('file_type', fileType);
    }

    const { data: files, error } = await query;

    if (error) throw error;
    return files || [];
  },

  async deleteBusinessFile(fileId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Get file record
    const { data: file, error: fetchError } = await supabase
      .from('business_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const filePath = file.file_url.split('/').pop();
    if (filePath) {
      await supabase.storage
        .from('documents')
        .remove([`business/${file.file_type}/${filePath}`]);
    }

    // Mark as inactive
    const { error: deleteError } = await supabase
      .from('business_files')
      .update({ is_active: false })
      .eq('id', fileId);

    if (deleteError) throw deleteError;
  },

  // Google Docs Integration Settings
  async updateGoogleDocsSettings(settings: {
    google_docs_enabled: boolean;
    google_client_id?: string;
    google_client_secret?: string;
    google_service_account_key?: any;
    google_drive_folder_id?: string;
  }): Promise<BusinessSettings> {
    return this.updateBusinessSettings(settings);
  },

  async getGoogleDocsSettings(): Promise<{
    enabled: boolean;
    client_id?: string;
    drive_folder_id?: string;
    has_credentials: boolean;
  }> {
    const settings = await this.getBusinessSettings();
    
    return {
      enabled: settings?.google_docs_enabled || false,
      client_id: settings?.google_client_id || undefined,
      drive_folder_id: settings?.google_drive_folder_id || undefined,
      has_credentials: !!(settings?.google_client_id && settings?.google_client_secret),
    };
  },

  // Utility Functions
  async getCompanyBranding(): Promise<{
    company_name: string;
    logo_url?: string;
    letterhead_url?: string;
    favicon_url?: string;
    primary_color: string;
    footer_text: string;
  }> {
    const settings = await this.getBusinessSettings();
    
    return {
      company_name: settings?.company_name || 'D\'Avila Reis Advogados',
      logo_url: settings?.company_logo_url || undefined,
      letterhead_url: settings?.company_letterhead_url || undefined,
      favicon_url: settings?.company_favicon_url || undefined,
      primary_color: settings?.pdf_header_color || '#dc2626',
      footer_text: settings?.pdf_footer_text || 'Documento gerado automaticamente',
    };
  },

  async getBusinessSetting(key: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('get_business_setting', {
      setting_key: key
    });

    if (error) throw error;
    return data;
  },

  // PDF Branding Configuration
  async getPDFBrandingConfig(): Promise<{
    header_color: string;
    footer_text: string;
    watermark_text?: string;
    font_family: string;
    company_info: {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
      oab_registration?: string;
      cnpj?: string;
    };
  }> {
    const settings = await this.getBusinessSettings();
    
    return {
      header_color: settings?.pdf_header_color || '#dc2626',
      footer_text: settings?.pdf_footer_text || 'Documento gerado automaticamente',
      watermark_text: settings?.pdf_watermark_text || undefined,
      font_family: settings?.pdf_font_family || 'Arial',
      company_info: {
        name: settings?.company_name || 'D\'Avila Reis Advogados',
        address: settings?.company_address || undefined,
        phone: settings?.company_phone || undefined,
        email: settings?.company_email || undefined,
        oab_registration: settings?.oab_registration || undefined,
        cnpj: settings?.cnpj || undefined,
      },
    };
  },

  // Validation Helpers
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de arquivo não suportado. Use JPG, PNG, GIF ou SVG.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Arquivo muito grande. Máximo 5MB.',
      };
    }

    return { valid: true };
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};