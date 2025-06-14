
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

export const useClientData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['current-client', user?.id],
    queryFn: clientService.getCurrentClient,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
