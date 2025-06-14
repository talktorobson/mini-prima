
import { supabase } from '@/integrations/supabase/client';

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

  async sendMessage(content: string, threadId: string, senderId: string, recipientId: string) {
    const { data, error } = await supabase
      .from('portal_messages')
      .insert({
        content,
        thread_id: threadId,
        sender_id: senderId,
        sender_type: 'client',
        recipient_id: recipientId,
        recipient_type: 'staff'
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    return data;
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
    const client = await clientService.getCurrentClient();
    if (!client) throw new Error('No client found');

    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getCaseById(caseId: string) {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Documents service
export const documentsService = {
  async getDocuments() {
    const client = await clientService.getCurrentClient();
    if (!client) throw new Error('No client found');

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', client.id)
      .order('upload_date', { ascending: false });
    
    if (error) throw error;
    return data;
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
    const client = await clientService.getCurrentClient();
    if (!client) throw new Error('No client found');

    const { data, error } = await supabase
      .from('portal_notifications')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('portal_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
