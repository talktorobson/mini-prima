
import { useQuery } from '@tanstack/react-query';
import { documentsService } from '@/services/database';

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: documentsService.getDocuments,
  });
};
