// 📎 Document Management Service
// D'Avila Reis Legal Practice Management System
// Complete document management with case attachment workflows
// SECURITY: Enhanced with role-based access controls and audit trails

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
  access_level?: 'public' | 'internal' | 'confidential' | 'attorney_client_privilege';
}

export interface UserPermissions {
  user_id: string;
  email: string;
  role: 'client' | 'staff' | 'admin';
  client_id?: string;
  staff_id?: string;
  assigned_cases?: string[];
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
  // SECURITY: Get current user permissions and role
  private async getCurrentUserPermissions(): Promise<UserPermissions | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }

      // Check if user is a client
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientData) {
        return {
          user_id: user.id,
          email: user.email || '',
          role: 'client',
          client_id: clientData.id
        };
      }

      // Check if user is staff
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, assigned_cases:staff_client_assignments(case_id)')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      if (staffData) {
        const assignedCases = staffData.assigned_cases?.map((a: any) => a.case_id) || [];
        return {
          user_id: user.id,
          email: user.email || '',
          role: 'staff',
          staff_id: staffData.id,
          assigned_cases: assignedCases
        };
      }

      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      if (adminData) {
        return {
          user_id: user.id,
          email: user.email || '',
          role: 'admin'
        };
      }

      console.error('User has no valid role assignments');
      return null;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return null;
    }
  }

  // SECURITY: Validate document access permissions
  private async validateDocumentAccess(
    documentId: string, 
    action: 'read' | 'write' | 'delete',
    userPermissions: UserPermissions
  ): Promise<boolean> {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) {
        return false;
      }

      // Admin can access all documents
      if (userPermissions.role === 'admin') {
        return true;
      }

      // Client can only access their own documents that are visible to them
      if (userPermissions.role === 'client') {
        const canAccess = document.client_id === userPermissions.client_id;
        const isVisible = document.is_visible_to_client || action === 'write';
        return canAccess && (isVisible || action === 'read');
      }

      // Staff can access documents for cases they're assigned to
      if (userPermissions.role === 'staff') {
        if (document.case_id && userPermissions.assigned_cases?.includes(document.case_id)) {
          return true;
        }
        // Staff can also access documents for clients they're assigned to
        if (document.client_id) {
          const { data: assignment } = await supabase
            .from('staff_client_assignments')
            .select('id')
            .eq('staff_id', userPermissions.staff_id)
            .eq('client_id', document.client_id)
            .eq('is_active', true)
            .maybeSingle();
          return !!assignment;
        }
      }

      return false;
    } catch (error) {
      console.error('Error validating document access:', error);
      return false;
    }
  }

  // SECURITY: Validate case assignment access
  private async validateCaseAccess(caseId: string, userPermissions: UserPermissions): Promise<boolean> {
    try {
      // Admin can access all cases
      if (userPermissions.role === 'admin') {
        return true;
      }

      // Client can access their own cases
      if (userPermissions.role === 'client') {
        const { data: caseData } = await supabase
          .from('cases')
          .select('client_id')
          .eq('id', caseId)
          .maybeSingle();
        return caseData?.client_id === userPermissions.client_id;
      }

      // Staff can access assigned cases
      if (userPermissions.role === 'staff') {
        return userPermissions.assigned_cases?.includes(caseId) || false;
      }

      return false;
    } catch (error) {
      console.error('Error validating case access:', error);
      return false;
    }
  }

  // Internal method to get document without security checks (for internal use)
  private async getDocumentById(documentId: string): Promise<Document | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching document:', error);
        throw new Error(`Erro ao buscar documento: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getDocumentById:', error);
      throw error;
    }
  }

  async uploadDocument(request: UploadDocumentRequest): Promise<Document> {
    try {
      // SECURITY: Get and validate user permissions
      const userPermissions = await this.getCurrentUserPermissions();
      if (!userPermissions) {
        throw new Error('Usuário não autenticado ou sem permissões');
      }

      // SECURITY: Validate client_id access
      if (request.client_id) {
        if (userPermissions.role === 'client' && userPermissions.client_id !== request.client_id) {
          throw new Error('Acesso negado: você só pode fazer upload de documentos para seu próprio perfil');
        }
        if (userPermissions.role === 'staff') {
          const hasClientAccess = await this.validateClientAccess(request.client_id, userPermissions);
          if (!hasClientAccess) {
            throw new Error('Acesso negado: você não tem permissão para este cliente');
          }
        }
      }

      // SECURITY: Validate case_id access if provided
      if (request.case_id) {
        const hasCaseAccess = await this.validateCaseAccess(request.case_id, userPermissions);
        if (!hasCaseAccess) {
          throw new Error('Acesso negado: você não tem permissão para este caso');
        }
      }

      // SECURITY: Set appropriate access level based on user role
      const accessLevel = request.access_level || this.determineDefaultAccessLevel(userPermissions);

      // Generate unique filename with security considerations
      const timestamp = Date.now();
      const sanitizedFilename = request.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}-${sanitizedFilename}`;
      const filePath = `documents/${request.client_id || 'general'}/${filename}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(filePath, request.file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('case-documents')
        .getPublicUrl(filePath);

      // SECURITY: Create document record with enhanced security fields
      const documentData: DocumentInsert = {
        client_id: request.client_id,
        case_id: request.case_id,
        document_name: request.document_name,
        document_type: request.document_type,
        document_category: request.document_category,
        original_filename: sanitizedFilename,
        file_path: filePath,
        file_url: urlData.publicUrl,
        file_size: request.file.size,
        is_visible_to_client: this.determineClientVisibility(request, userPermissions),
        signature_required: request.signature_required ?? false,
        notes: request.notes,
        tags: request.tags ? JSON.stringify(request.tags) : null,
        access_level: accessLevel,
        status: 'Draft',
        upload_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        uploaded_by: userPermissions.user_id
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) {
        console.error('Error creating document record:', error);
        // Clean up uploaded file
        await supabase.storage.from('case-documents').remove([filePath]);
        throw new Error(`Erro ao criar registro do documento: ${error.message}`);
      }

      // SECURITY: Enhanced audit logging
      await this.logDocumentAccess(
        data.id, 
        'upload', 
        userPermissions.user_id,
        {
          user_role: userPermissions.role,
          client_id: request.client_id,
          case_id: request.case_id,
          access_level: accessLevel,
          file_size: request.file.size,
          document_type: request.document_type
        }
      );

      return data;
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      throw error;
    }
  }

  async attachDocumentToCase(request: AttachDocumentToCaseRequest): Promise<Document> {
    try {
      // SECURITY: Get and validate user permissions
      const userPermissions = await this.getCurrentUserPermissions();
      if (!userPermissions) {
        throw new Error('Usuário não autenticado');
      }

      // SECURITY: Validate document access
      const hasDocumentAccess = await this.validateDocumentAccess(
        request.document_id, 
        'write', 
        userPermissions
      );
      if (!hasDocumentAccess) {
        throw new Error('Acesso negado: você não tem permissão para modificar este documento');
      }

      // SECURITY: Validate case access
      const hasCaseAccess = await this.validateCaseAccess(request.case_id, userPermissions);
      if (!hasCaseAccess) {
        throw new Error('Acesso negado: você não tem permissão para este caso');
      }

      const existingDocument = await this.getDocumentById(request.document_id);
      if (!existingDocument) {
        throw new Error('Documento não encontrado');
      }

      const { data, error } = await supabase
        .from('documents')
        .update({
          case_id: request.case_id,
          document_category: request.attachment_type || 'other',
          notes: request.notes ? 
            (existingDocument.notes || '') + '\n\n' + request.notes :
            existingDocument.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.document_id)
        .select()
        .single();

      if (error) {
        console.error('Error attaching document to case:', error);
        throw new Error(`Erro ao anexar documento ao caso: ${error.message}`);
      }

      // SECURITY: Create audited case update
      await this.createCaseDocumentUpdate(
        request.case_id, 
        request.document_id, 
        'attached',
        userPermissions
      );

      // SECURITY: Log document attachment
      await this.logDocumentAccess(
        request.document_id,
        'attach_to_case',
        userPermissions.user_id,
        {
          user_role: userPermissions.role,
          case_id: request.case_id,
          attachment_type: request.attachment_type
        }
      );

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
      // SECURITY: Get and validate user permissions
      const userPermissions = await this.getCurrentUserPermissions();
      if (!userPermissions) {
        throw new Error('Usuário não autenticado');
      }

      // SECURITY: Validate document access
      const hasAccess = await this.validateDocumentAccess(documentId, 'read', userPermissions);
      if (!hasAccess) {
        throw new Error('Acesso negado a este documento');
      }

      const data = await this.getDocumentById(documentId);
      
      if (data) {
        // SECURITY: Log document access
        await this.logDocumentAccess(
          documentId,
          'view',
          userPermissions.user_id,
          {
            user_role: userPermissions.role,
            access_level: data.access_level
          }
        );
      }

      return data;
    } catch (error) {
      console.error('Error in getDocument:', error);
      throw error;
    }
  }

  async getDocuments(filters?: DocumentFilters): Promise<Document[]> {
    try {
      // SECURITY: Get and validate user permissions
      const userPermissions = await this.getCurrentUserPermissions();
      if (!userPermissions) {
        throw new Error('Usuário não autenticado');
      }

      let query = supabase
        .from('documents')
        .select('*')
        .order('upload_date', { ascending: false });

      // SECURITY: Apply role-based filtering
      if (userPermissions.role === 'client') {
        // Clients can only see their own documents that are visible to them
        query = query
          .eq('client_id', userPermissions.client_id)
          .eq('is_visible_to_client', true);
      } else if (userPermissions.role === 'staff') {
        // Staff can see documents for their assigned cases and clients
        const assignedCaseIds = userPermissions.assigned_cases || [];
        if (assignedCaseIds.length > 0) {
          query = query.or(`case_id.in.(${assignedCaseIds.join(',')}),client_id.in.(select client_id from staff_client_assignments where staff_id='${userPermissions.staff_id}' and is_active=true)`);
        } else {
          // If no assigned cases, filter by client assignments only
          query = query.in('client_id', 
            supabase.from('staff_client_assignments')
              .select('client_id')
              .eq('staff_id', userPermissions.staff_id)
              .eq('is_active', true)
          );
        }
      }
      // Admin users have no additional filtering (can see all documents)

      // Apply filters with security validation
      if (filters?.client_id) {
        // SECURITY: Validate client access
        if (userPermissions.role === 'client' && userPermissions.client_id !== filters.client_id) {
          throw new Error('Acesso negado: você só pode ver seus próprios documentos');
        }
        if (userPermissions.role === 'staff') {
          const hasClientAccess = await this.validateClientAccess(filters.client_id, userPermissions);
          if (!hasClientAccess) {
            throw new Error('Acesso negado: você não tem permissão para este cliente');
          }
        }
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.case_id) {
        // SECURITY: Validate case access
        const hasCaseAccess = await this.validateCaseAccess(filters.case_id, userPermissions);
        if (!hasCaseAccess) {
          throw new Error('Acesso negado: você não tem permissão para este caso');
        }
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
      // SECURITY: Get and validate user permissions
      const userPermissions = await this.getCurrentUserPermissions();
      if (!userPermissions) {
        throw new Error('Usuário não autenticado');
      }

      // SECURITY: Validate document access using comprehensive security check
      const hasAccess = await this.validateDocumentAccess(documentId, 'read', userPermissions);
      if (!hasAccess) {
        throw new Error('Acesso negado a este documento');
      }

      const document = await this.getDocumentById(documentId);
      if (!document) {
        throw new Error('Documento não encontrado');
      }

      // SECURITY: Additional client-specific validation (legacy parameter support)
      if (clientId && userPermissions.role === 'client' && document.client_id !== clientId) {
        throw new Error('Acesso negado ao documento');
      }

      if (!document.file_path) {
        throw new Error('Arquivo não encontrado');
      }

      // Create signed URL for download
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        throw new Error(`Erro ao gerar URL de download: ${error.message}`);
      }

      // SECURITY: Enhanced audit logging for downloads
      await this.logDocumentAccess(
        documentId, 
        'download', 
        userPermissions.user_id,
        {
          user_role: userPermissions.role,
          client_id: document.client_id,
          case_id: document.case_id,
          access_level: document.access_level,
          file_size: document.file_size
        }
      );

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

  // SECURITY: Helper methods for access control
  private async validateClientAccess(clientId: string, userPermissions: UserPermissions): Promise<boolean> {
    if (userPermissions.role === 'admin') return true;
    if (userPermissions.role === 'client') return userPermissions.client_id === clientId;
    if (userPermissions.role === 'staff') {
      const { data: assignment } = await supabase
        .from('staff_client_assignments')
        .select('id')
        .eq('staff_id', userPermissions.staff_id)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle();
      return !!assignment;
    }
    return false;
  }

  private determineDefaultAccessLevel(userPermissions: UserPermissions): string {
    switch (userPermissions.role) {
      case 'client':
        return 'internal';
      case 'staff':
        return 'internal';
      case 'admin':
        return 'confidential';
      default:
        return 'internal';
    }
  }

  private determineClientVisibility(request: UploadDocumentRequest, userPermissions: UserPermissions): boolean {
    // If explicitly set, use that value
    if (request.is_visible_to_client !== undefined) {
      return request.is_visible_to_client;
    }
    // Default visibility based on user role and access level
    if (userPermissions.role === 'client') {
      return true; // Client uploads are visible to client by default
    }
    // Staff/admin uploads are not visible to client by default for security
    return false;
  }

  private async logDocumentAccess(
    documentId: string,
    action: 'view' | 'download' | 'upload' | 'update' | 'preview' | 'attach_to_case' | 'detach_from_case',
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // SECURITY: Enhanced audit logging with user details and metadata
      await supabase
        .from('document_access_logs')
        .insert({
          document_id: documentId,
          user_id: userId,
          action: action as any,
          access_timestamp: new Date().toISOString(),
          ip_address: null, // Would be populated by server-side logging
          user_agent: navigator.userAgent,
          metadata: metadata ? JSON.stringify(metadata) : null
        });
    } catch (error) {
      console.error('Error logging document access:', error);
      // Don't throw here as this is supplementary logging
    }
  }

  private async createCaseDocumentUpdate(
    caseId: string,
    documentId: string,
    action: 'attached' | 'detached' | 'deleted',
    userPermissions: UserPermissions
  ): Promise<void> {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) return;

      // SECURITY: Determine created_by based on user role
      let createdBy: string | null = null;
      if (userPermissions.role === 'staff' && userPermissions.staff_id) {
        createdBy = userPermissions.staff_id;
      } else if (userPermissions.role === 'admin') {
        // For admin users, try to find their staff record
        const { data: adminStaff } = await supabase
          .from('staff')
          .select('id')
          .eq('email', userPermissions.email)
          .maybeSingle();
        createdBy = adminStaff?.id || null;
      }

      if (!createdBy) {
        console.warn('Could not determine staff ID for case update');
        return;
      }

      const actionMessages = {
        attached: `Documento "${document.document_name}" anexado ao caso`,
        detached: `Documento "${document.document_name}" desanexado do caso`,
        deleted: `Documento "${document.document_name}" excluído do caso`
      };

      // SECURITY: Enhanced case update with proper attribution and metadata
      await supabase
        .from('case_updates')
        .insert({
          case_id: caseId,
          update_type: 'document_' + action,
          title: actionMessages[action],
          description: `Ação: ${action} - Documento: ${document.document_name} - Por: ${userPermissions.email}`,
          visibility: 'internal',
          created_by: createdBy,
          created_at: new Date().toISOString(),
          metadata: JSON.stringify({
            document_id: documentId,
            action: action,
            user_role: userPermissions.role,
            user_id: userPermissions.user_id,
            document_type: document.document_type,
            access_level: document.access_level
          })
        });
    } catch (error) {
      console.error('Error creating case document update:', error);
      // Don't throw here as this is supplementary audit logging
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