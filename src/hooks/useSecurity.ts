
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logActivity } from '@/services/database';

export const useSecurity = () => {
  const { user } = useAuth();

  // Check if user owns a specific case
  const useUserOwnsCase = (caseId?: string) => {
    return useQuery({
      queryKey: ['user-owns-case', caseId, user?.id],
      queryFn: async () => {
        if (!caseId) return false;
        
        console.log('Checking if user owns case:', caseId);
        
        const { data, error } = await supabase.rpc('user_owns_case', {
          case_id_param: caseId
        });

        if (error) {
          console.error('Error checking case ownership:', error);
          throw error;
        }

        console.log('Case ownership check result:', data);
        return data;
      },
      enabled: !!caseId && !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get current client ID
  const useCurrentClientId = () => {
    return useQuery({
      queryKey: ['current-client-id', user?.id],
      queryFn: async () => {
        console.log('Getting current client ID...');
        
        const { data, error } = await supabase.rpc('get_current_client_id');

        if (error) {
          console.error('Error getting client ID:', error);
          throw error;
        }

        console.log('Current client ID:', data);
        return data;
      },
      enabled: !!user,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Log security-related activities
  const logSecurityActivity = async (activity: string, details?: any) => {
    try {
      await logActivity('security', activity, {
        ...details,
        timestamp: new Date().toISOString(),
        user_id: user?.id
      });
    } catch (error) {
      console.error('Failed to log security activity:', error);
    }
  };

  // Check authentication status
  const isAuthenticated = !!user;

  return {
    useUserOwnsCase,
    useCurrentClientId,
    logSecurityActivity,
    isAuthenticated,
    user
  };
};
