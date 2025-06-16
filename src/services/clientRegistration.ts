// 📋 Client Registration Service
// D'Avila Reis Legal Practice Management System
// Complete client registration approval workflow

import { supabase } from '@/integrations/supabase/client';

export interface ClientRegistrationData {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  cnpj?: string;
  address?: string;
  position?: string;
  industry?: string;
  company_size?: string;
  marketing_consent: boolean;
  data_processing_consent: boolean;
  preferred_contact_method: string;
  reference_source?: string;
  estimated_case_value?: number;
  urgency_level: string;
  registration_notes?: string;
}

export interface RegistrationApprovalData {
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  reason?: string;
  portal_access?: boolean;
  assigned_lawyer?: string;
  priority_level?: 'normal' | 'high' | 'urgent';
  follow_up_date?: string;
  internal_notes?: string;
}

export interface RegistrationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  under_review: number;
  this_month: number;
  avg_approval_time: number;
}

export const clientRegistrationService = {
  submitRegistration: async (data: ClientRegistrationData) => {
    console.log('Submitting client registration:', data);
    
    try {
      // Start a transaction
      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          ...data,
          registration_status: 'pending',
          registration_date: new Date().toISOString(),
          status: 'Active',
          client_since: new Date().toISOString(),
          portal_access: false // Disabled until approved
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting registration:', error);
        throw error;
      }

      // Create initial registration history entry
      await this.createRegistrationHistoryEntry(
        client.id,
        'pending',
        'Client registration submitted',
        'system'
      );

      console.log('Successfully submitted registration:', client);
      return client;
    } catch (error) {
      console.error('Registration service error:', error);
      throw error;
    }
  },

  updateRegistrationStatus: async (
    clientId: string, 
    approvalData: RegistrationApprovalData
  ) => {
    console.log('Updating registration status:', { clientId, approvalData });
    
    try {
      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      const currentUser = user?.email || 'system';

      // Update client record
      const updateData: any = {
        registration_status: approvalData.status,
        registration_notes: approvalData.reason,
        updated_at: new Date().toISOString()
      };

      // Additional updates for approved clients
      if (approvalData.status === 'approved') {
        updateData.portal_access = approvalData.portal_access ?? true;
        updateData.primary_lawyer = approvalData.assigned_lawyer;
        
        // Set initial consultation date if not already set
        const { data: existing } = await supabase
          .from('clients')
          .select('initial_consultation_date')
          .eq('id', clientId)
          .single();

        if (!existing?.initial_consultation_date) {
          updateData.initial_consultation_date = new Date().toISOString().split('T')[0];
        }
      }

      // If rejected, disable portal access
      if (approvalData.status === 'rejected') {
        updateData.portal_access = false;
      }

      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        console.error('Error updating registration status:', error);
        throw error;
      }

      // Create registration history entry
      await this.createRegistrationHistoryEntry(
        clientId,
        approvalData.status,
        approvalData.reason || `Status changed to ${approvalData.status}`,
        currentUser
      );

      // Send notification to client (if email notification system exists)
      await this.sendRegistrationStatusNotification(clientId, approvalData.status, approvalData.reason);

      console.log('Successfully updated registration status:', data);
      return data;
    } catch (error) {
      console.error('Registration status update error:', error);
      throw error;
    }
  },

  createRegistrationHistoryEntry: async (
    clientId: string,
    status: string,
    reason: string,
    changedBy: string
  ) => {
    try {
      const { error } = await supabase
        .from('client_registration_history')
        .insert({
          client_id: clientId,
          status: status as any,
          change_reason: reason,
          changed_by: changedBy,
          created_at: new Date().toISOString(),
          metadata: {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        });

      if (error) {
        console.error('Error creating registration history entry:', error);
        throw error;
      }
    } catch (error) {
      console.error('Registration history creation error:', error);
      // Don't throw here as this is supplementary
    }
  },

  sendRegistrationStatusNotification: async (
    clientId: string,
    status: string,
    reason?: string
  ) => {
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('company_name, contact_person, email')
        .eq('id', clientId)
        .single();

      if (!client) return;

      let title = '';
      let message = '';

      switch (status) {
        case 'approved':
          title = 'Cadastro Aprovado';
          message = `Olá ${client.contact_person}, seu cadastro da empresa ${client.company_name} foi aprovado! Você pode acessar o portal do cliente.`;
          break;
        case 'rejected':
          title = 'Cadastro Não Aprovado';
          message = `Olá ${client.contact_person}, infelizmente seu cadastro da empresa ${client.company_name} não foi aprovado. ${reason ? `Motivo: ${reason}` : ''}`;
          break;
        case 'under_review':
          title = 'Cadastro em Análise';
          message = `Olá ${client.contact_person}, seu cadastro da empresa ${client.company_name} está sendo analisado pela nossa equipe.`;
          break;
      }

      // Create notification in the system
      if (status === 'approved' || status === 'rejected') {
        await supabase
          .from('portal_notifications')
          .insert({
            client_id: clientId,
            title,
            message,
            type: status === 'approved' ? 'success' : 'info',
            created_at: new Date().toISOString()
          });
      }

      // Here you would integrate with email service (SendGrid, etc.)
      console.log('Registration status notification prepared:', { title, message });

    } catch (error) {
      console.error('Error sending registration notification:', error);
      // Don't throw here as this is supplementary
    }
  },

  getRegistrationHistory: async (clientId: string) => {
    console.log('Fetching registration history for client:', clientId);
    
    try {
      const { data, error } = await supabase
        .from('client_registration_history')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registration history:', error);
        throw error;
      }

      console.log('Successfully fetched registration history:', data);
      return data || [];
    } catch (error) {
      console.error('Registration history fetch error:', error);
      throw error;
    }
  },

  getRegistrationStats: async (): Promise<RegistrationStats> => {
    try {
      const { data: allRegistrations, error } = await supabase
        .from('clients')
        .select('registration_status, registration_date, created_at');

      if (error) {
        throw error;
      }

      const total = allRegistrations?.length || 0;
      const pending = allRegistrations?.filter(r => r.registration_status === 'pending').length || 0;
      const approved = allRegistrations?.filter(r => r.registration_status === 'approved').length || 0;
      const rejected = allRegistrations?.filter(r => r.registration_status === 'rejected').length || 0;
      const under_review = allRegistrations?.filter(r => r.registration_status === 'under_review').length || 0;

      // This month registrations
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const this_month = allRegistrations?.filter(r => 
        new Date(r.created_at) >= startOfMonth
      ).length || 0;

      // Average approval time (simplified calculation)
      const approvedWithDates = allRegistrations?.filter(r => 
        r.registration_status === 'approved' && r.registration_date
      ) || [];

      const avg_approval_time = approvedWithDates.length > 0
        ? Math.round(approvedWithDates.reduce((sum, r) => {
            const created = new Date(r.created_at);
            const approved = new Date(r.registration_date);
            return sum + (approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / approvedWithDates.length)
        : 0;

      return {
        total,
        pending,
        approved,
        rejected,
        under_review,
        this_month,
        avg_approval_time
      };
    } catch (error) {
      console.error('Error fetching registration stats:', error);
      throw error;
    }
  },

  bulkUpdateRegistrations: async (
    clientIds: string[],
    status: 'approved' | 'rejected' | 'under_review',
    reason: string
  ) => {
    try {
      const results = [];
      
      for (const clientId of clientIds) {
        try {
          const result = await this.updateRegistrationStatus(clientId, {
            status,
            reason
          });
          results.push({ clientId, success: true, data: result });
        } catch (error) {
          results.push({ clientId, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  },

  searchRegistrations: async (filters: {
    search_query?: string;
    status?: string;
    industry?: string;
    date_from?: string;
    date_to?: string;
    urgency_level?: string;
  }) => {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('registration_date', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('registration_status', filters.status);
      }
      
      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }
      
      if (filters.urgency_level) {
        query = query.eq('urgency_level', filters.urgency_level);
      }
      
      if (filters.date_from) {
        query = query.gte('registration_date', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.lte('registration_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Apply text search filter
      let filteredData = data || [];
      if (filters.search_query) {
        const searchTerm = filters.search_query.toLowerCase();
        filteredData = filteredData.filter(client => 
          client.company_name?.toLowerCase().includes(searchTerm) ||
          client.contact_person?.toLowerCase().includes(searchTerm) ||
          client.email?.toLowerCase().includes(searchTerm) ||
          client.cnpj?.includes(searchTerm)
        );
      }

      return filteredData;
    } catch (error) {
      console.error('Error searching registrations:', error);
      throw error;
    }
  }
};
