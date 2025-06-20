// 📎 Enhanced Document Management Hook
// D'Avila Reis Legal Practice Management System
// Comprehensive document search, upload, and management operations

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { documentService } from '@/services/documentService';
import { useToast } from '@/hooks/use-toast';

export interface DocumentSearchFilters {
  query?: string;
  type?: string;
  status?: string;
  dateRange?: string;
  clientId?: string;
  caseId?: string;
  category?: string;
  isVisibleToClient?: boolean;
}

export interface DocumentManagementState {
  selectedDocuments: string[];
  searchFilters: DocumentSearchFilters;
  sortBy: 'name' | 'date' | 'type' | 'size';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid';
}

export const useDocumentManagement = (initialFilters?: DocumentSearchFilters) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<DocumentManagementState>({
    selectedDocuments: [],
    searchFilters: initialFilters || {},
    sortBy: 'date',
    sortOrder: 'desc',
    viewMode: 'list'
  });

  // Fetch documents with comprehensive filtering
  const {
    data: documents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents', state.searchFilters],
    queryFn: async () => {
      try {
        // Convert search filters to service format
        const serviceFilters = {
          client_id: state.searchFilters.clientId,
          case_id: state.searchFilters.caseId,
          document_type: state.searchFilters.type,
          document_category: state.searchFilters.category,
          status: state.searchFilters.status,
          is_visible_to_client: state.searchFilters.isVisibleToClient,
          search_query: state.searchFilters.query,
          date_from: getDateFromRange(state.searchFilters.dateRange, 'from'),
          date_to: getDateFromRange(state.searchFilters.dateRange, 'to')
        };

        const result = await documentService.getDocuments(serviceFilters);
        
        // Apply sorting
        return sortDocuments(result, state.sortBy, state.sortOrder);
      } catch (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
    },
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: documentService.uploadDocument,
    onSuccess: (data) => {
      toast({
        title: "Upload Concluído",
        description: `Documento "${data.document_name}" enviado com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no Upload",
        description: error.message || "Erro ao enviar documento.",
        variant: "destructive"
      });
    }
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: documentService.deleteDocument,
    onSuccess: () => {
      toast({
        title: "Documento Excluído",
        description: "Documento excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir documento.",
        variant: "destructive"
      });
    }
  });

  // Update document mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      documentService.updateDocument(id, updates),
    onSuccess: () => {
      toast({
        title: "Documento Atualizado",
        description: "Documento atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar documento.",
        variant: "destructive"
      });
    }
  });

  // Bulk operations mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: any }) => 
      documentService.bulkUpdateDocuments(ids, updates),
    onSuccess: (data) => {
      toast({
        title: "Atualização em Lote",
        description: `${data.length} documentos atualizados com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setState(prev => ({ ...prev, selectedDocuments: [] }));
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro na atualização em lote.",
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const updateSearchFilters = useCallback((filters: Partial<DocumentSearchFilters>) => {
    setState(prev => ({
      ...prev,
      searchFilters: { ...prev.searchFilters, ...filters }
    }));
  }, []);

  const clearSearchFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchFilters: {}
    }));
  }, []);

  const updateSorting = useCallback((sortBy: DocumentManagementState['sortBy'], sortOrder: DocumentManagementState['sortOrder']) => {
    setState(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const toggleDocumentSelection = useCallback((documentId: string) => {
    setState(prev => ({
      ...prev,
      selectedDocuments: prev.selectedDocuments.includes(documentId)
        ? prev.selectedDocuments.filter(id => id !== documentId)
        : [...prev.selectedDocuments, documentId]
    }));
  }, []);

  const selectAllDocuments = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedDocuments: documents.map(doc => doc.id)
    }));
  }, [documents]);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedDocuments: []
    }));
  }, []);

  const downloadDocument = useCallback(async (documentId: string) => {
    try {
      const url = await documentService.getDocumentDownloadUrl(documentId);
      const link = document.createElement('a');
      link.href = url;
      link.download = '';
      link.click();
      
      toast({
        title: "Download Iniciado",
        description: "Download do documento iniciado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao baixar documento.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const bulkDownload = useCallback(async () => {
    if (state.selectedDocuments.length === 0) {
      toast({
        title: "Seleção Vazia",
        description: "Selecione documentos para download.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Download em Lote",
      description: `Iniciando download de ${state.selectedDocuments.length} documentos...`,
    });

    for (const documentId of state.selectedDocuments) {
      try {
        await downloadDocument(documentId);
        // Add delay between downloads to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error downloading document ${documentId}:`, error);
      }
    }
  }, [state.selectedDocuments, downloadDocument, toast]);

  return {
    // Data
    documents,
    isLoading,
    error,
    state,
    
    // Mutations
    uploadDocument: uploadMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    updateDocument: updateMutation.mutate,
    bulkUpdate: bulkUpdateMutation.mutate,
    
    // Loading states
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
    
    // Actions
    refetch,
    updateSearchFilters,
    clearSearchFilters,
    updateSorting,
    toggleDocumentSelection,
    selectAllDocuments,
    clearSelection,
    downloadDocument,
    bulkDownload,
    
    // Utilities
    getSelectedDocuments: () => documents.filter(doc => state.selectedDocuments.includes(doc.id)),
    hasSelection: state.selectedDocuments.length > 0,
    selectionCount: state.selectedDocuments.length
  };
};

// Helper functions
function getDateFromRange(range?: string, type: 'from' | 'to'): string | undefined {
  if (!range) return undefined;
  
  const now = new Date();
  let date: Date;
  
  switch (range) {
    case 'today':
      date = new Date(now);
      break;
    case 'week':
      date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      date = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      date = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return undefined;
  }
  
  if (type === 'from') {
    return date.toISOString();
  } else {
    return now.toISOString();
  }
}

function sortDocuments(documents: any[], sortBy: string, sortOrder: string) {
  return [...documents].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = (a.document_name || a.original_filename || '').toLowerCase();
        bValue = (b.document_name || b.original_filename || '').toLowerCase();
        break;
      case 'date':
        aValue = new Date(a.upload_date || a.created_at);
        bValue = new Date(b.upload_date || b.created_at);
        break;
      case 'type':
        aValue = (a.document_type || '').toLowerCase();
        bValue = (b.document_type || '').toLowerCase();
        break;
      case 'size':
        aValue = a.file_size || 0;
        bValue = b.file_size || 0;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

export default useDocumentManagement;