import { supabase } from '@/integrations/supabase/client';

// Initialize storage bucket - simplified version that doesn't try to create buckets
export const initializeStorage = async () => {
  try {
    // Just check if bucket exists, don't try to create it
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking storage buckets:', error);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'case-documents');
    
    if (bucketExists) {
      console.log('Storage bucket case-documents already exists');
    } else {
      console.log('Storage bucket case-documents does not exist - it should be created via SQL migration');
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// Add a debug function to check notification types
export const debugService = {
  async checkNotificationTypes() {
    try {
      // Fallback: try to get existing notification types from the table
      const { data: existingNotifications, error: notifError } = await supabase
        .from('portal_notifications')
        .select('type')
        .limit(10);
      
      if (notifError) {
        console.error('Error getting existing notifications:', notifError);
        return null;
      }
      
      const uniqueTypes = [...new Set(existingNotifications?.map(n => n.type) || [])];
      console.log('Existing notification types found:', uniqueTypes);
      return uniqueTypes;
    } catch (error) {
      console.error('Error in checkNotificationTypes:', error);
      return null;
    }
  },

  async insertSampleNotifications(clientId: string) {
    try {
      console.log('Inserting sample notifications for client:', clientId);
      
      // Use basic notification types that should exist based on the enum
      const sampleNotifications = [
        {
          client_id: clientId,
          title: 'Novo documento disponível',
          message: 'Um novo documento foi adicionado ao seu caso #12345.',
          type: 'document_upload' as const,
          is_read: false
        },
        {
          client_id: clientId,
          title: 'Atualização do caso',
          message: 'Seu processo teve uma atualização de status para "Em Andamento".',
          type: 'case_update' as const,
          is_read: false
        },
        {
          client_id: clientId,
          title: 'Lembrete importante',
          message: 'Prazo para envio de documentos é amanhã.',
          type: 'reminder' as const,
          is_read: true,
          read_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          client_id: clientId,
          title: 'Nova mensagem',
          message: 'Você recebeu uma nova mensagem da equipe jurídica.',
          type: 'message' as const,
          is_read: false
        }
      ];

      const { data, error } = await supabase
        .from('portal_notifications')
        .insert(sampleNotifications)
        .select();

      if (error) {
        console.error('Error inserting sample notifications:', error);
        throw error;
      }

      console.log('Sample notifications inserted successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in insertSampleNotifications:', error);
      throw error;
    }
  }
};

// Messages service
export const messagesService = {
  async getMessages(clientId: string) {
    const { data, error } = await supabase
      .from('portal_messages')
      .select('*')
      .or(`sender_id.eq.${clientId},recipient_id.eq.${clientId}`)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async sendMessage(content: string, threadId: string, senderId: string, recipientType: 'staff' | 'client' = 'staff') {
    // Generate a proper UUID for thread_id - using a default thread UUID
    const defaultThreadId = '550e8400-e29b-41d4-a716-446655440000';
    // Generate a temporary staff ID for now - in a real implementation, 
    // you'd want to determine which specific staff member to send to
    const tempStaffId = '00000000-0000-0000-0000-000000000000';
    
    const { data, error } = await supabase
      .from('portal_messages')
      .insert({
        content,
        thread_id: defaultThreadId,
        sender_id: senderId,
        sender_type: 'client',
        recipient_id: tempStaffId,
        recipient_type: recipientType
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Client service
export const clientService = {
  async getCurrentClient() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      console.log('Fetching client for user:', user.id);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching client:', error);
        throw error;
      }
      
      console.log('Client data:', data);
      return data;
    } catch (error) {
      console.error('Error in getCurrentClient:', error);
      throw error;
    }
  },

  async updateClient(updates: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Cases service
export const casesService = {
  async getCases() {
    try {
      console.log('Starting getCases...');
      const client = await clientService.getCurrentClient();
      
      if (!client) {
        console.log('No client found, returning empty array');
        return [];
      }

      console.log('Fetching cases for client:', client.id);
      
      // Try a simpler query first to test the basic connection
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching cases:', error);
        throw error;
      }
      
      console.log('Cases data:', data);
      return data || [];
    } catch (error) {
      console.error('Error in getCases:', error);
      throw error;
    }
  },

  async getCaseById(caseId: string) {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        documents(*),
        case_updates(*)
      `)
      .eq('id', caseId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCase(caseId: string, updates: any) {
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', caseId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Documents service
export const documentsService = {
  async getDocuments() {
    try {
      const client = await clientService.getCurrentClient();
      if (!client) {
        console.log('No client found for documents');
        return [];
      }

      console.log('Fetching documents for client:', client.id);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_visible_to_client', true)
        .order('upload_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
      
      console.log('Documents data:', data);
      return data || [];
    } catch (error) {
      console.error('Error in getDocuments:', error);
      throw error;
    }
  },

  async getCaseDocuments(caseId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', caseId)
      .eq('is_visible_to_client', true)
      .order('upload_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async uploadDocument(file: File, caseId: string, metadata: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Upload file to storage
    const fileName = `${user.id}/${caseId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('case-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Create document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        document_name: file.name,
        original_filename: file.name,
        file_path: fileName,
        file_size: file.size,
        case_id: caseId,
        ...metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDocumentPreviewUrl(documentId: string) {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      if (!document.file_path) {
        throw new Error('Document has no file path');
      }

      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (urlError) throw urlError;

      return signedUrl.signedUrl;
    } catch (error) {
      console.error('Error getting document preview URL:', error);
      throw error;
    }
  },

  async downloadDocument(documentId: string) {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select('file_path, document_name')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      if (!document.file_path) {
        throw new Error('Document has no file path');
      }

      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(document.file_path, 60); // 1 minute for download

      if (urlError) throw urlError;

      // Log the download for audit purposes
      await supabase
        .from('document_access_logs')
        .insert({
          document_id: documentId,
          action: 'download',
          client_id: (await clientService.getCurrentClient())?.id
        });

      return {
        url: signedUrl.signedUrl,
        filename: document.document_name
      };
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }
};

// Financial records service
export const financialService = {
  async getFinancialRecords() {
    const client = await clientService.getCurrentClient();
    if (!client) throw new Error('No client found');

    const { data, error } = await supabase
      .from('financial_records')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Notifications service
export const notificationsService = {
  async getNotifications() {
    try {
      console.log('Starting getNotifications...');
      const client = await clientService.getCurrentClient();
      
      if (!client || !client.id) {
        console.log('No client found or no client ID for notifications');
        return [];
      }

      console.log('Fetching notifications for client:', client.id);
      
      const { data, error } = await supabase
        .from('portal_notifications')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      
      console.log('Notifications data fetched:', data);
      return data || [];
    } catch (error) {
      console.error('Error in getNotifications:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('portal_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single();
      
      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      throw error;
    }
  }
};
