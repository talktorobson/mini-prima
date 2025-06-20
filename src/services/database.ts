
import { supabase } from '@/integrations/supabase/client';
import { encryptMessage, decryptMessage, decryptMessages } from './encryptionService';

// Client service with enhanced security and full CRUD operations
export const clientService = {
  // Get current user's client profile (for portal users)
  getCurrentClient: async () => {
    console.log('Fetching current client data...');
    
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

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

  // Get all clients (for admin users)
  getAllClients: async (filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    console.log('Fetching all clients with filters:', filters);
    
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`company_name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data: clients, error } = await query;

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      console.log('Successfully fetched clients:', clients?.length || 0);
      return clients || [];
    } catch (error) {
      console.error('Get all clients error:', error);
      throw error;
    }
  },

  // Get client by ID (with proper authorization check)
  getClientById: async (clientId: string) => {
    console.log('Fetching client by ID:', clientId);
    
    try {
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching client:', error);
        throw error;
      }

      console.log('Successfully fetched client:', client);
      return client;
    } catch (error) {
      console.error('Get client by ID error:', error);
      throw error;
    }
  },

  // Create a new client
  createClient: async (clientData: {
    company_name: string;
    contact_person: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    cpf_cnpj?: string;
    status?: string;
    user_id?: string;
  }) => {
    console.log('Creating new client:', clientData);
    
    try {
      // Validate required fields
      if (!clientData.company_name || !clientData.contact_person || !clientData.email) {
        throw new Error('Required fields missing: company_name, contact_person, email');
      }

      // Set default status if not provided
      const clientToCreate = {
        ...clientData,
        status: clientData.status || 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: client, error } = await supabase
        .from('clients')
        .insert(clientToCreate)
        .select()
        .single();

      if (error) {
        console.error('Error creating client:', error);
        throw error;
      }

      console.log('Successfully created client:', client);
      return client;
    } catch (error) {
      console.error('Create client error:', error);
      throw error;
    }
  },

  // Update client (with proper WHERE clause)
  updateClient: async (clientId: string, clientData: any) => {
    console.log('Updating client:', { clientId, clientData });
    
    try {
      if (!clientId) {
        throw new Error('Client ID is required for update operation');
      }

      // Add updated timestamp
      const updateData = {
        ...clientData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId)
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
  },

  // Delete client (soft delete by setting status to Inactive)
  deleteClient: async (clientId: string, hardDelete: boolean = false) => {
    console.log('Deleting client:', { clientId, hardDelete });
    
    try {
      if (!clientId) {
        throw new Error('Client ID is required for delete operation');
      }

      if (hardDelete) {
        // Hard delete - permanently remove from database
        const { data, error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId)
          .select()
          .single();

        if (error) {
          console.error('Error hard deleting client:', error);
          throw error;
        }

        console.log('Successfully hard deleted client:', data);
        return data;
      } else {
        // Soft delete - set status to Inactive
        const { data, error } = await supabase
          .from('clients')
          .update({ 
            status: 'Inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', clientId)
          .select()
          .single();

        if (error) {
          console.error('Error soft deleting client:', error);
          throw error;
        }

        console.log('Successfully soft deleted client:', data);
        return data;
      }
    } catch (error) {
      console.error('Delete client error:', error);
      throw error;
    }
  },

  // Search clients with advanced filtering
  searchClients: async (searchQuery: string, filters?: {
    status?: string;
    city?: string;
    state?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }) => {
    console.log('Searching clients:', { searchQuery, filters });
    
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply text search
      if (searchQuery.trim()) {
        query = query.or(`company_name.ilike.%${searchQuery}%,contact_person.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,cpf_cnpj.ilike.%${searchQuery}%`);
      }

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.city) {
        query = query.eq('city', filters.city);
      }

      if (filters?.state) {
        query = query.eq('state', filters.state);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data: clients, error } = await query;

      if (error) {
        console.error('Error searching clients:', error);
        throw error;
      }

      console.log(`Successfully searched clients: ${clients?.length || 0} results`);
      return clients || [];
    } catch (error) {
      console.error('Search clients error:', error);
      throw error;
    }
  },

  // Get client statistics
  getClientStats: async () => {
    console.log('Fetching client statistics...');
    
    try {
      const { data: stats, error } = await supabase
        .rpc('get_client_statistics');

      if (error) {
        console.error('Error fetching client stats:', error);
        throw error;
      }

      console.log('Successfully fetched client stats:', stats);
      return stats;
    } catch (error) {
      console.error('Get client stats error:', error);
      // Return default stats on error
      return {
        total_clients: 0,
        active_clients: 0,
        inactive_clients: 0,
        new_this_month: 0
      };
    }
  },

  // Update client status
  updateClientStatus: async (clientId: string, status: 'Active' | 'Inactive' | 'Pending') => {
    console.log('Updating client status:', { clientId, status });
    
    try {
      if (!clientId || !status) {
        throw new Error('Client ID and status are required');
      }

      const { data, error } = await supabase
        .from('clients')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        console.error('Error updating client status:', error);
        throw error;
      }

      console.log('Successfully updated client status:', data);
      return data;
    } catch (error) {
      console.error('Update client status error:', error);
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

// Messages service with enhanced security and pagination
export const messagesService = {
  // Original method for compatibility (deprecated)
  getMessages: async () => {
    console.log('Fetching user messages (deprecated - use getPaginatedMessages)...');
    
    try {
      const { data: rawMessages, error } = await supabase
        .from('portal_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Add basic limit to prevent loading too many messages

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      // Handle both 'message' and 'content' column names for compatibility
      const messages = (rawMessages || []).map(msg => ({
        ...msg,
        content: msg.content || msg.message || '', // Ensure content field exists
        thread_id: msg.thread_id || crypto.randomUUID() // Fallback thread ID if missing
      }));

      // Decrypt message contents for legal confidentiality
      const decryptedMessages = await decryptMessages(
        messages.map(msg => ({ id: msg.id, content: msg.content }))
      );
      
      const finalMessages = messages.map(msg => {
        const decrypted = decryptedMessages.find(d => d.id === msg.id);
        return {
          ...msg,
          content: decrypted?.content || msg.content
        };
      });

      console.log('Successfully fetched and decrypted messages:', finalMessages.length);
      return finalMessages || [];
    } catch (error) {
      console.error('Messages service error:', error);
      throw error;
    }
  },

  // New paginated messages method with performance optimization
  getPaginatedMessages: async (page = 0, limit = 20, clientId?: string) => {
    console.log(`Fetching paginated messages - page: ${page}, limit: ${limit}, clientId: ${clientId}`);
    
    try {
      let query = supabase
        .from('portal_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      // Filter by client if provided
      if (clientId) {
        query = query.or(`sender_id.eq.${clientId},recipient_id.eq.${clientId}`);
      }

      const { data: rawMessages, error, count } = await query;

      if (error) {
        console.error('Error fetching paginated messages:', error);
        throw error;
      }

      // Handle both 'message' and 'content' column names for compatibility
      const messages = (rawMessages || []).map(msg => ({
        ...msg,
        content: msg.content || msg.message || '', // Ensure content field exists
        thread_id: msg.thread_id || crypto.randomUUID() // Fallback thread ID if missing
      }));

      // Decrypt message contents for legal confidentiality
      const decryptedMessages = await decryptMessages(
        messages.map(msg => ({ id: msg.id, content: msg.content }))
      );
      
      const finalMessages = messages.map(msg => {
        const decrypted = decryptedMessages.find(d => d.id === msg.id);
        return {
          ...msg,
          content: decrypted?.content || msg.content
        };
      });

      console.log(`Successfully fetched and decrypted ${finalMessages?.length || 0} messages for page ${page}`);
      return {
        messages: finalMessages || [],
        total: count || 0,
        hasMore: finalMessages && finalMessages.length === limit,
        page,
        limit
      };
    } catch (error) {
      console.error('Paginated messages service error:', error);
      throw error;
    }
  },

  // Get recent messages (for real-time updates)
  getRecentMessages: async (since: string, clientId?: string) => {
    console.log('Fetching recent messages since:', since);
    
    try {
      let query = supabase
        .from('portal_messages')
        .select('*')
        .gt('created_at', since)
        .order('created_at', { ascending: true });

      if (clientId) {
        query = query.or(`sender_id.eq.${clientId},recipient_id.eq.${clientId}`);
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error('Error fetching recent messages:', error);
        throw error;
      }

      // Decrypt message contents for legal confidentiality
      if (messages && messages.length > 0) {
        const decryptedMessages = await decryptMessages(
          messages.map(msg => ({ id: msg.id, content: msg.content }))
        );
        
        const finalMessages = messages.map(msg => {
          const decrypted = decryptedMessages.find(d => d.id === msg.id);
          return {
            ...msg,
            content: decrypted?.content || msg.content
          };
        });

        console.log(`Successfully fetched and decrypted ${finalMessages?.length || 0} recent messages`);
        return finalMessages || [];
      }

      console.log('No recent messages found');
      return [];
    } catch (error) {
      console.error('Recent messages service error:', error);
      throw error;
    }
  },

  markMessageAsRead: async (messageId: string) => {
    console.log('Marking message as read:', messageId);
    
    try {
      const { data, error } = await supabase
        .from('portal_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        console.error('Error marking message as read:', error);
        throw error;
      }

      console.log('Successfully marked message as read:', data);
      return data;
    } catch (error) {
      console.error('Mark message as read error:', error);
      throw error;
    }
  },

  markThreadAsRead: async (threadId: string, recipientId: string) => {
    console.log('Marking thread as read:', { threadId, recipientId });
    
    try {
      const { data, error } = await supabase
        .from('portal_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('thread_id', threadId)
        .eq('recipient_id', recipientId)
        .eq('is_read', false)
        .select();

      if (error) {
        console.error('Error marking thread as read:', error);
        throw error;
      }

      console.log('Successfully marked thread as read:', data);
      return data;
    } catch (error) {
      console.error('Mark thread as read error:', error);
      throw error;
    }
  },

  broadcastTyping: async (senderId: string, recipientId: string, threadId: string, isTyping: boolean) => {
    console.log('Broadcasting typing status:', { senderId, recipientId, threadId, isTyping });
    
    try {
      // Use Supabase real-time to broadcast typing status
      const channel = supabase.channel(`typing_${threadId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          senderId,
          recipientId,
          threadId,
          isTyping,
          timestamp: new Date().toISOString()
        }
      });

      console.log('Successfully broadcast typing status');
      return true;
    } catch (error) {
      console.error('Typing broadcast error:', error);
      throw error;
    }
  },

  getUnreadMessageCount: async (recipientId: string) => {
    console.log('Getting unread message count for:', recipientId);
    
    try {
      const { count, error } = await supabase
        .from('portal_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', recipientId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        throw error;
      }

      console.log('Unread message count:', count);
      return count || 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  },

  // Get or create thread ID for conversation between two participants
  getOrCreateThreadId: async (participant1: string, participant2: string): Promise<string> => {
    console.log('Getting or creating thread ID for:', { participant1, participant2 });
    
    try {
      // Check if there's an existing conversation thread between these participants
      const { data: existingThread, error: threadError } = await supabase
        .from('portal_messages')
        .select('thread_id')
        .or(`and(sender_id.eq.${participant1},recipient_id.eq.${participant2}),and(sender_id.eq.${participant2},recipient_id.eq.${participant1})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (threadError) {
        console.error('Error checking existing thread:', threadError);
        // On error, create new thread as fallback
        const newThreadId = crypto.randomUUID();
        console.log('Error fetching thread, creating new one:', newThreadId);
        return newThreadId;
      } 
      
      if (existingThread?.thread_id) {
        // Use existing thread
        console.log('Using existing thread:', existingThread.thread_id);
        return existingThread.thread_id;
      } else {
        // Create new thread - no existing conversation found
        const newThreadId = crypto.randomUUID();
        console.log('No existing thread found, creating new thread:', newThreadId);
        return newThreadId;
      }
    } catch (error) {
      console.error('Get or create thread ID error:', error);
      // Fallback to new thread ID
      const fallbackThreadId = crypto.randomUUID();
      console.log('Error in getOrCreateThreadId, using fallback:', fallbackThreadId);
      return fallbackThreadId;
    }
  },

  searchMessages: async (searchQuery: string, filters?: {
    clientId?: string;
    staffId?: string;
    messageType?: 'client' | 'staff';
    dateFrom?: string;
    dateTo?: string;
  }) => {
    console.log('Searching messages:', { searchQuery, filters });
    
    try {
      let query = supabase
        .from('portal_messages')
        .select(`
          *,
          client:sender_id!portal_messages_sender_id_fkey (
            company_name,
            contact_person
          ),
          case:cases!portal_messages_case_id_fkey (
            case_title,
            case_number
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.clientId) {
        query = query.or(`sender_id.eq.${filters.clientId},recipient_id.eq.${filters.clientId}`);
      }
      
      if (filters?.staffId) {
        query = query.or(`sender_id.eq.${filters.staffId},recipient_id.eq.${filters.staffId}`);
      }
      
      if (filters?.messageType) {
        query = query.eq('sender_type', filters.messageType);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching messages:', error);
        throw error;
      }

      // Decrypt messages first before searching (required for encrypted content)
      let messagesWithDecryptedContent = data || [];
      if (messagesWithDecryptedContent.length > 0) {
        console.log('Decrypting messages for search...');
        const decryptedMessages = await decryptMessages(
          messagesWithDecryptedContent.map(msg => ({ id: msg.id, content: msg.content }))
        );
        
        messagesWithDecryptedContent = messagesWithDecryptedContent.map(msg => {
          const decrypted = decryptedMessages.find(d => d.id === msg.id);
          return {
            ...msg,
            content: decrypted?.content || msg.content
          };
        });
      }

      // Apply text search filter on decrypted content
      let filteredData = messagesWithDecryptedContent;
      if (searchQuery.trim()) {
        console.log('Applying search filter on decrypted content...');
        const searchTerm = searchQuery.toLowerCase();
        filteredData = filteredData.filter(message => 
          message.content.toLowerCase().includes(searchTerm) ||
          (message.subject && message.subject.toLowerCase().includes(searchTerm)) ||
          (message.client?.company_name && message.client.company_name.toLowerCase().includes(searchTerm)) ||
          (message.client?.contact_person && message.client.contact_person.toLowerCase().includes(searchTerm)) ||
          (message.case?.case_title && message.case.case_title.toLowerCase().includes(searchTerm)) ||
          (message.case?.case_number && message.case.case_number.toLowerCase().includes(searchTerm))
        );
      }

      console.log(`Successfully searched and decrypted messages: ${filteredData.length} results`);
      return filteredData;
    } catch (error) {
      console.error('Message search error:', error);
      throw error;
    }
  },

  sendMessage: async (content: string, recipientId: string, clientId: string) => {
    console.log('Sending message:', { content, recipientId, clientId });
    
    try {
      // First, check if there's an existing conversation thread between client and staff
      const { data: existingThread, error: threadError } = await supabase
        .from('portal_messages')
        .select('thread_id')
        .or(`and(sender_id.eq.${clientId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${clientId})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let threadId: string;
      
      if (threadError) {
        console.error('Error checking existing thread:', threadError);
        // On error, create new thread as fallback
        threadId = crypto.randomUUID();
        console.log('Error fetching thread, creating new one:', threadId);
      } else if (existingThread?.thread_id) {
        // Use existing thread
        threadId = existingThread.thread_id;
        console.log('Using existing thread:', threadId);
      } else {
        // Create new thread - no existing conversation found
        threadId = crypto.randomUUID();
        console.log('No existing thread found, creating new thread:', threadId);
      }

      // Encrypt message content for legal confidentiality
      const encryptedContent = await encryptMessage(content);
      
      const { data, error } = await supabase
        .from('portal_messages')
        .insert({
          content: encryptedContent,
          sender_type: 'client',
          sender_id: clientId,
          recipient_type: 'staff',
          recipient_id: recipientId,
          thread_id: threadId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      // Return the message with decrypted content for immediate UI use
      const messageForDisplay = {
        ...data,
        content: content // Return original content for UI display
      };
      
      console.log('Successfully sent message:', data);
      return messageForDisplay;
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
