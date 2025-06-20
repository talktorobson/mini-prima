
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCaseDocuments = (caseId: string) => {
  return useQuery({
    queryKey: ['case-documents', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('case_id', caseId)
        .order('upload_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!caseId,
  });
};

export const useAllDocuments = () => {
  return useQuery({
    queryKey: ['all-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          case:cases (
            case_title,
            case_number,
            counterparty_name,
            client:clients (
              company_name,
              contact_person
            )
          )
        `)
        .order('upload_date', { ascending: false });
      
      if (error) throw error;
      
      // Flatten client data structure for easier access
      const processedData = data?.map(doc => ({
        ...doc,
        client: doc.case?.client || null
      })) || [];
      
      console.log('useAllDocuments - Fetched documents:', processedData.length);
      return processedData;
    },
  });
};
