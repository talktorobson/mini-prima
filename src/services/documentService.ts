// 📎 Document Management Service
// D'Avila Reis Legal Practice Management System
// Complete document management with case attachment workflows

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

export interface UploadDocumentRequest {
  client_id?: string;
  case_id?: string;
  document_name: string;
  document_type: string;
  document_category?: string;
  file: File;
  is_visible_to_client?: boolean;
  signature_required?: boolean;
  notes?: string;
  tags?: string[];
  access_level?: string;
}

export interface AttachDocumentToCaseRequest {
  document_id: string;
  case_id: string;
  attachment_type?: 'evidence' | 'contract' | 'correspondence' | 'court_filing' | 'other';
  notes?: string;
}

export interface DocumentFilters {
  client_id?: string;
  case_id?: string;
  document_type?: string;
  document_category?: string;
  status?: string;
  is_visible_to_client?: boolean;
  signature_required?: boolean;
  search_query?: string;
  date_from?: string;
  date_to?: string;
}

class DocumentService {
  async uploadDocument(request: UploadDocumentRequest): Promise<Document> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${request.file.name}`;
      const filePath = `documents/${request.client_id || 'general'}/${filename}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, request.file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record
      const documentData: DocumentInsert = {
        client_id: request.client_id,
        case_id: request.case_id,
        document_name: request.document_name,
        document_type: request.document_type,
        document_category: request.document_category,
        original_filename: request.file.name,
        file_path: filePath,
        file_url: urlData.publicUrl,
        file_size: request.file.size,
        is_visible_to_client: request.is_visible_to_client ?? false,
        signature_required: request.signature_required ?? false,
        notes: request.notes,
        tags: request.tags ? JSON.stringify(request.tags) : null,
        access_level: request.access_level || 'internal',
        status: 'Draft',
        upload_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) {
        console.error('Error creating document record:', error);
        // Clean up uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(`Erro ao criar registro do documento: ${error.message}`);
      }

      // Log document access
      await this.logDocumentAccess(data.id, 'upload', request.client_id);

      return data;
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      throw error;
    }
  }

  async attachDocumentToCase(request: AttachDocumentToCaseRequest): Promise<Document> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          case_id: request.case_id,
          document_category: request.attachment_type || 'other',
          notes: request.notes ? 
            (await this.getDocument(request.document_id))?.notes + '\n\n' + request.notes :
            undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.document_id)
        .select()
        .single();

      if (error) {
        console.error('Error attaching document to case:', error);
        throw new Error(`Erro ao anexar documento ao caso: ${error.message}`);
      }

      // Create case update
      await this.createCaseDocumentUpdate(request.case_id, request.document_id, 'attached');

      return data;
    } catch (error) {
      console.error('Error in attachDocumentToCase:', error);
      throw error;
    }
  }

  async detachDocumentFromCase(documentId: string): Promise<Document> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Documento não encontrado');
      }

      const caseId = document.case_id;

      const { data, error } = await supabase
        .from('documents')
        .update({
          case_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        console.error('Error detaching document from case:', error);
        throw new Error(`Erro ao desanexar documento do caso: ${error.message}`);
      }

      // Create case update if it was attached to a case
      if (caseId) {
        await this.createCaseDocumentUpdate(caseId, documentId, 'detached');
      }

      return data;
    } catch (error) {
      console.error('Error in detachDocumentFromCase:', error);
      throw error;
    }
  }

  async getDocument(documentId: string): Promise<Document | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Document not found
        }
        console.error('Error fetching document:', error);
        throw new Error(`Erro ao buscar documento: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getDocument:', error);
      throw error;
    }
  }

  async getDocuments(filters?: DocumentFilters): Promise<Document[]> {
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .order('upload_date', { ascending: false });

      // Apply filters
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.case_id) {
        query = query.eq('case_id', filters.case_id);
      }
      if (filters?.document_type) {
        query = query.eq('document_type', filters.document_type);
      }
      if (filters?.document_category) {
        query = query.eq('document_category', filters.document_category);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.is_visible_to_client !== undefined) {
        query = query.eq('is_visible_to_client', filters.is_visible_to_client);
      }
      if (filters?.signature_required !== undefined) {
        query = query.eq('signature_required', filters.signature_required);
      }
      if (filters?.date_from) {
        query = query.gte('upload_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('upload_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching documents:', error);
        throw new Error(`Erro ao buscar documentos: ${error.message}`);
      }

      // Apply text search filter
      let filteredData = data || [];
      if (filters?.search_query) {
        const searchTerm = filters.search_query.toLowerCase();
        filteredData = filteredData.filter(doc => 
          doc.document_name?.toLowerCase().includes(searchTerm) ||
          doc.original_filename?.toLowerCase().includes(searchTerm) ||
          doc.notes?.toLowerCase().includes(searchTerm) ||
          doc.document_category?.toLowerCase().includes(searchTerm)
        );
      }

      return filteredData;
    } catch (error) {
      console.error('Error in getDocuments:', error);
      throw error;
    }
  }

  async getDocumentsByCase(caseId: string): Promise<Document[]> {
    return this.getDocuments({ case_id: caseId });
  }

  async getDocumentsByClient(clientId: string): Promise<Document[]> {
    return this.getDocuments({ client_id: clientId });
  }

  async updateDocument(documentId: string, updates: Partial<DocumentUpdate>): Promise<Document> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating document:', error);
        throw new Error(`Erro ao atualizar documento: ${error.message}`);
      }

      // Log document access
      await this.logDocumentAccess(documentId, 'update', updates.client_id);

      return data;
    } catch (error) {
      console.error('Error in updateDocument:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Documento não encontrado');
      }

      // Delete file from storage
      if (document.file_path) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([document.file_path]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with database deletion even if storage fails
        }
      }

      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Error deleting document record:', error);
        throw new Error(`Erro ao excluir documento: ${error.message}`);
      }

      // Create case update if it was attached to a case
      if (document.case_id) {
        await this.createCaseDocumentUpdate(document.case_id, documentId, 'deleted');
      }
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  }

  async getDocumentDownloadUrl(documentId: string, clientId?: string): Promise<string> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Documento não encontrado');
      }

      // Check access permissions
      if (clientId && document.client_id !== clientId) {
        throw new Error('Acesso negado ao documento');
      }

      if (!document.file_path) {
        throw new Error('Arquivo não encontrado');
      }

      // Create signed URL for download
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        throw new Error(`Erro ao gerar URL de download: ${error.message}`);
      }

      // Log document access
      await this.logDocumentAccess(documentId, 'download', clientId);

      return data.signedUrl;
    } catch (error) {
      console.error('Error in getDocumentDownloadUrl:', error);
      throw error;
    }
  }

  async setDocumentVisibility(documentId: string, isVisible: boolean): Promise<Document> {
    return this.updateDocument(documentId, { is_visible_to_client: isVisible });
  }

  async updateDocumentStatus(
    documentId: string, 
    status: 'Draft' | 'Under Review' | 'Approved' | 'Signed' | 'Expired' | 'Archived'
  ): Promise<Document> {
    return this.updateDocument(documentId, { status });
  }

  async bulkUpdateDocuments(
    documentIds: string[],
    updates: Partial<DocumentUpdate>
  ): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', documentIds)
        .select();

      if (error) {
        console.error('Error bulk updating documents:', error);
        throw new Error(`Erro ao atualizar documentos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in bulkUpdateDocuments:', error);
      throw error;
    }
  }

  private async logDocumentAccess(
    documentId: string,
    action: 'view' | 'download' | 'upload' | 'update' | 'preview',
    clientId?: string
  ): Promise<void> {
    try {
      if (!clientId) return; // Only log client access

      await supabase
        .from('document_access_logs')
        .insert({
          document_id: documentId,
          client_id: clientId,
          action: action as any,
          access_timestamp: new Date().toISOString(),
          ip_address: null, // Would be populated by server
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error logging document access:', error);
      // Don't throw here as this is supplementary
    }
  }

  private async createCaseDocumentUpdate(
    caseId: string,
    documentId: string,
    action: 'attached' | 'detached' | 'deleted'
  ): Promise<void> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) return;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get staff ID for the current user
      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!staff) return;

      const actionMessages = {
        attached: `Documento "${document.document_name}" anexado ao caso`,
        detached: `Documento "${document.document_name}" desanexado do caso`,
        deleted: `Documento "${document.document_name}" excluído do caso`
      };

      await supabase
        .from('case_updates')
        .insert({
          case_id: caseId,
          update_type: 'document_' + action,
          title: actionMessages[action],
          description: `Ação: ${action} - Documento: ${document.document_name}`,
          visibility: 'internal',
          created_by: staff.id,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error creating case document update:', error);
      // Don't throw here as this is supplementary
    }
  }

  async getDocumentStatistics(): Promise<{
    total: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
    recent_uploads: number;
    pending_signatures: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('document_type, status, signature_required, upload_date');

      if (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }

      const total = data?.length || 0;
      
      // Group by type
      const by_type: Record<string, number> = {};
      const by_status: Record<string, number> = {};
      
      data?.forEach(doc => {
        by_type[doc.document_type] = (by_type[doc.document_type] || 0) + 1;
        by_status[doc.status] = (by_status[doc.status] || 0) + 1;
      });

      // Recent uploads (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const recent_uploads = data?.filter(doc => 
        new Date(doc.upload_date) >= lastWeek
      ).length || 0;

      // Pending signatures
      const pending_signatures = data?.filter(doc => 
        doc.signature_required && doc.status !== 'Signed'
      ).length || 0;

      return {
        total,
        by_type,
        by_status,
        recent_uploads,
        pending_signatures
      };
    } catch (error) {
      console.error('Error in getDocumentStatistics:', error);
      throw error;
    }
  }
}

export const documentService = new DocumentService();
export default documentService;