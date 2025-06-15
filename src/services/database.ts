
import { supabase } from '@/integrations/supabase/client';

// Client service with enhanced security
export const clientService = {
  getCurrentClient: async () => {
    console.log('Fetching current client data...');
    
    try {
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching current client:', error);
        throw error;
      }

      console.log('Successfully fetched client:', client);
      return client;
    } catch (error) {
      console.error('Client service error:', error);
      throw error;
    }
  },

  updateClient: async (clientData: any) => {
    console.log('Updating client data:', clientData);
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .select()
        .single();

      if (error) {
        console.error('Error updating client:', error);
        throw error;
      }

      console.log('Successfully updated client:', data);
      return data;
    } catch (error) {
      console.error('Client update error:', error);
      throw error;
    }
  }
};

// Cases service with enhanced security
export const casesService = {
  getCases: async () => {
    console.log('Fetching user cases...');
    
    try {
      const { data: cases, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cases:', error);
        throw error;
      }

      console.log('Successfully fetched cases:', cases);
      return cases || [];
    } catch (error) {
      console.error('Cases service error:', error);
      throw error;
    }
  },

  getCaseById: async (caseId: string) => {
    console.log('Fetching case by ID:', caseId);
    
    try {
      const { data: caseData, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching case:', error);
        throw error;
      }

      console.log('Successfully fetched case:', caseData);
      return caseData;
    } catch (error) {
      console.error('Case fetch error:', error);
      throw error;
    }
  }
};

// Documents service with enhanced security
export const documentsService = {
  getDocuments: async () => {
    console.log('Fetching user documents...');
    
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }

      console.log('Successfully fetched documents:', documents);
      return documents || [];
    } catch (error) {
      console.error('Documents service error:', error);
      throw error;
    }
  },

  getDocumentById: async (documentId: string) => {
    console.log('Fetching document by ID:', documentId);
    
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching document:', error);
        throw error;
      }

      console.log('Successfully fetched document:', document);
      return document;
    } catch (error) {
      console.error('Document fetch error:', error);
      throw error;
    }
  }
};

// Financial records service with enhanced security
export const financialService = {
  getFinancialRecords: async () => {
    console.log('Fetching user financial records...');
    
    try {
      const { data: records, error } = await supabase
        .from('financial_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching financial records:', error);
        throw error;
      }

      console.log('Successfully fetched financial records:', records);
      return records || [];
    } catch (error) {
      console.error('Financial service error:', error);
      throw error;
    }
  }
};

// Notifications service with enhanced security
export const notificationsService = {
  getNotifications: async () => {
    console.log('Fetching user notifications...');
    
    try {
      const { data: notifications, error } = await supabase
        .from('portal_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      console.log('Successfully fetched notifications:', notifications);
      return notifications || [];
    } catch (error) {
      console.error('Notifications service error:', error);
      throw error;
    }
  },

  markAsRead: async (notificationId: string) => {
    console.log('Marking notification as read:', notificationId);
    
    try {
      const { data, error } = await supabase
        .from('portal_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      console.log('Successfully marked notification as read:', data);
      return data;
    } catch (error) {
      console.error('Notification update error:', error);
      throw error;
    }
  }
};

// Messages service with enhanced security
export const messagesService = {
  getMessages: async () => {
    console.log('Fetching user messages...');
    
    try {
      const { data: messages, error } = await supabase
        .from('portal_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      console.log('Successfully fetched messages:', messages);
      return messages || [];
    } catch (error) {
      console.error('Messages service error:', error);
      throw error;
    }
  },

  sendMessage: async (content: string, recipientId: string, clientId: string) => {
    console.log('Sending message:', { content, recipientId, clientId });
    
    try {
      const { data, error } = await supabase
        .from('portal_messages')
        .insert({
          content,
          sender_type: 'client',
          sender_id: clientId,
          recipient_type: 'staff',
          recipient_id: recipientId,
          thread_id: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      console.log('Successfully sent message:', data);
      return data;
    } catch (error) {
      console.error('Message send error:', error);
      throw error;
    }
  }
};

// Settings service with enhanced security
export const settingsService = {
  getSettings: async () => {
    console.log('Fetching user settings...');
    
    try {
      const { data: settings, error } = await supabase
        .from('portal_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }

      console.log('Successfully fetched settings:', settings);
      return settings;
    } catch (error) {
      console.error('Settings service error:', error);
      throw error;
    }
  },

  updateSettings: async (settingsData: any) => {
    console.log('Updating user settings:', settingsData);
    
    try {
      const { data, error } = await supabase
        .from('portal_settings')
        .upsert(settingsData)
        .select()
        .single();

      if (error) {
        console.error('Error updating settings:', error);
        throw error;
      }

      console.log('Successfully updated settings:', data);
      return data;
    } catch (error) {
      console.error('Settings update error:', error);
      throw error;
    }
  }
};

// Activity logging utility
export const logActivity = async (activityType: string, description?: string, metadata?: any) => {
  console.log('Logging activity:', { activityType, description, metadata });
  
  try {
    const { error } = await supabase.rpc('log_client_activity', {
      activity_type_param: activityType,
      description_param: description || null,
      metadata_param: metadata || {}
    });

    if (error) {
      console.error('Error logging activity:', error);
      // Don't throw here - activity logging should not break the main flow
    } else {
      console.log('Successfully logged activity');
    }
  } catch (error) {
    console.error('Activity logging error:', error);
    // Don't throw here - activity logging should not break the main flow
  }
};
