
import React, { useState, useMemo } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { useToast } from '@/hooks/useToast';
import DocumentsHeader from '@/components/DocumentsHeader';
import DocumentSearch from '@/components/DocumentSearch';
import DocumentsList from '@/components/DocumentsList';
import DocumentPreviewSheet from '@/components/DocumentPreviewSheet';
import GeneralDocumentUpload from '@/components/GeneralDocumentUpload';

interface SearchFilters {
  query: string;
  type: string;
  status: string;
  dateRange: string;
}

const PortalDocuments = () => {
  const { data: documents = [], isLoading, error, refetch } = useDocuments();
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    type: '',
    status: '',
    dateRange: ''
  });

  const {
    selectedDocument,
    previewUrl,
    isPreviewOpen,
    isLoadingPreview,
    handlePreview,
    handleDownload,
    closePreview
  } = useDocumentActions();

  // Mock documents for demo since the database might not have data
  const mockDocuments = [
    {
      id: 1,
      document_name: "Contrato de Prestação de Serviços.pdf",
      document_type: "Contrato",
      file_size: 2458112,
      upload_date: "2024-06-15T12:00:00Z",
      status: "Final",
      original_filename: "Contrato de Prestação de Serviços.pdf"
    },
    {
      id: 2,
      document_name: "Procuração Judicial.pdf",
      document_type: "Procuração",
      file_size: 1887436,
      upload_date: "2024-06-12T10:30:00Z",
      status: "Draft",
      original_filename: "Procuração Judicial.pdf"
    },
    {
      id: 3,
      document_name: "Relatório Parecer Técnico.pdf",
      document_type: "Relatório",
      file_size: 3355443,
      upload_date: "2024-06-10T14:15:00Z",
      status: "Final",
      original_filename: "Relatório Parecer Técnico.pdf"
    },
    {
      id: 4,
      document_name: "Documentos Identificação.zip",
      document_type: "Identificação",
      file_size: 5368709,
      upload_date: "2024-06-08T09:45:00Z",
      status: "Final",
      original_filename: "Documentos Identificação.zip"
    }
  ];

  // Use real documents if available, otherwise use mock data
  const allDocuments = documents.length > 0 ? documents : mockDocuments;

  // Helper functions
  function getStatusFromDocument(doc: any) {
    if (doc.status === 'Final') return 'Finalizado';
    if (doc.status === 'Draft') return 'Pendente Assinatura';
    return 'Processando';
  }

  function checkDateRange(uploadDate: string, range: string) {
    const docDate = new Date(uploadDate);
    const now = new Date();
    
    switch (range) {
      case 'today':
        return docDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return docDate >= weekAgo;
      case 'month':
        return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
      case 'year':
        return docDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  }

  // Filter documents based on search criteria
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter(doc => {
      const matchesQuery = searchFilters.query === '' || 
        doc.document_name.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
        doc.document_type.toLowerCase().includes(searchFilters.query.toLowerCase());

      const matchesType = searchFilters.type === '' || doc.document_type === searchFilters.type;

      const docStatus = getStatusFromDocument(doc);
      const matchesStatus = searchFilters.status === '' || docStatus === searchFilters.status;

      const matchesDate = searchFilters.dateRange === '' || checkDateRange(doc.upload_date, searchFilters.dateRange);

      return matchesQuery && matchesType && matchesStatus && matchesDate;
    });
  }, [allDocuments, searchFilters]);

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleBulkDownload = () => {
    toast({
      title: 'Download em lote iniciado',
      description: `Preparando download de ${filteredDocuments.length} documentos...`,
      variant: 'success'
    });
    
    // Simulate bulk download
    filteredDocuments.forEach((doc, index) => {
      setTimeout(() => {
        handleDownload(doc);
      }, index * 1000);
    });
  };

  const handleUploadComplete = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Carregando documentos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading documents:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DocumentsHeader
        filteredDocumentsCount={filteredDocuments.length}
        onUploadClick={() => setIsUploadOpen(true)}
        onBulkDownload={handleBulkDownload}
      />

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <DocumentSearch onSearch={handleSearch} />
        
        <DocumentsList
          documents={filteredDocuments}
          searchFilters={searchFilters}
          onPreview={handlePreview}
          onDownload={handleDownload}
          isLoadingPreview={isLoadingPreview}
          selectedDocumentId={selectedDocument?.id}
        />
      </main>

      <DocumentPreviewSheet
        isOpen={isPreviewOpen}
        onClose={closePreview}
        document={selectedDocument}
        previewUrl={previewUrl}
        onDownload={() => selectedDocument && handleDownload(selectedDocument)}
      />

      <GeneralDocumentUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
};

export default PortalDocuments;
