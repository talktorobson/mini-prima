
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

// Hook for getting current user's client data
export const useClientData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['current-client', user?.id],
    queryFn: clientService.getCurrentClient,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Hook for getting all clients (admin only)
export const useAllClients = (filters?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['all-clients', filters],
    queryFn: () => clientService.getAllClients(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for getting client by ID
export const useClientById = (clientId: string) => {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getClientById(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for creating a client
export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clientService.createClient,
    onSuccess: () => {
      // Invalidate and refetch client queries
      queryClient.invalidateQueries({ queryKey: ['all-clients'] });
      queryClient.invalidateQueries({ queryKey: ['current-client'] });
    },
  });
};

// Hook for updating a client
export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clientId, clientData }: { clientId: string; clientData: any }) =>
      clientService.updateClient(clientId, clientData),
    onSuccess: (_, { clientId }) => {
      // Invalidate and refetch client queries
      queryClient.invalidateQueries({ queryKey: ['all-clients'] });
      queryClient.invalidateQueries({ queryKey: ['current-client'] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
    },
  });
};

// Hook for deleting a client
export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clientId, hardDelete }: { clientId: string; hardDelete?: boolean }) =>
      clientService.deleteClient(clientId, hardDelete),
    onSuccess: () => {
      // Invalidate and refetch client queries
      queryClient.invalidateQueries({ queryKey: ['all-clients'] });
      queryClient.invalidateQueries({ queryKey: ['current-client'] });
    },
  });
};

// Hook for searching clients
export const useSearchClients = (searchQuery: string, filters?: {
  status?: string;
  city?: string;
  state?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['search-clients', searchQuery, filters],
    queryFn: () => clientService.searchClients(searchQuery, filters),
    enabled: !!searchQuery.trim(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook for getting client statistics
export const useClientStats = () => {
  return useQuery({
    queryKey: ['client-stats'],
    queryFn: clientService.getClientStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for updating client status
export const useUpdateClientStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clientId, status }: { clientId: string; status: 'Active' | 'Inactive' | 'Pending' }) =>
      clientService.updateClientStatus(clientId, status),
    onSuccess: () => {
      // Invalidate and refetch client queries
      queryClient.invalidateQueries({ queryKey: ['all-clients'] });
      queryClient.invalidateQueries({ queryKey: ['current-client'] });
      queryClient.invalidateQueries({ queryKey: ['client-stats'] });
    },
  });
};
