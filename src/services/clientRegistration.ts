
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

export const clientRegistrationService = {
  submitRegistration: async (data: ClientRegistrationData) => {
    console.log('Submitting client registration:', data);
    
    try {
      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          ...data,
          registration_status: 'pending',
          registration_date: new Date().toISOString(),
          status: 'Active',
          client_since: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting registration:', error);
        throw error;
      }

      console.log('Successfully submitted registration:', client);
      return client;
    } catch (error) {
      console.error('Registration service error:', error);
      throw error;
    }
  },

  updateRegistrationStatus: async (clientId: string, status: string, reason?: string) => {
    console.log('Updating registration status:', { clientId, status, reason });
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({ 
          registration_status: status,
          registration_notes: reason 
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        console.error('Error updating registration status:', error);
        throw error;
      }

      console.log('Successfully updated registration status:', data);
      return data;
    } catch (error) {
      console.error('Registration status update error:', error);
      throw error;
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
  }
};
