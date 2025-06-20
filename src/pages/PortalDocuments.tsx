import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ArrowLeft, Download, Eye, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAllDocuments } from '@/hooks/useCaseDocuments';
import DocumentSearch from '@/components/DocumentSearch';
import DocumentPreviewSheet from '@/components/DocumentPreviewSheet';
import DocumentUploadManager from '@/components/DocumentUploadManager';
import { getDocumentPreviewUrl, downloadDocument } from '@/services/documentPreview';
import { getDocumentTypeDisplayLabel } from '@/lib/documentUtils';
import { useToast } from '@/hooks/useToast';

interface SearchFilters {
  query: string;
  type: string;
  status: string;
  dateRange: string;
}

const PortalDocuments = () => {
  const navigate = useNavigate();
  const { data: documents = [], isLoading, error, refetch } = useAllDocuments();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    type: '',
    status: '',
    dateRange: ''
  });

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  // Ensure we always use the real documents from the database
  const allDocuments = documents || [];
  
  // Debug logging to track data sources
  console.log('PortalDocuments - Raw documents from hook:', documents?.length || 0);
  console.log('PortalDocuments - Processing documents:', allDocuments?.length || 0);

  // Helper functions defined before they are used
  function getStatusFromDocument(doc: any) {
    const status = doc.status || 'unknown';
    
    // Handle database status values
    if (status === 'Approved' || status === 'Final') return 'Finalizado';
    if (status === 'Draft' || status === 'Review') return 'Pendente Assinatura';
    if (status === 'Rejected') return 'Rejeitado';
    if (status === 'Processing') return 'Processando';
    
    // Default fallback
    return 'Em Análise';
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

  // Helper function to get display label for document type (override imported version)
  function getLocalDocumentTypeDisplayLabel(docType: string) {
    if (docType === 'General Document') return 'Documento Escritório';
    if (docType === 'Case Document') return 'Documento Processo';
    return docType; // Return original type for other cases
  }

  // Filter documents based on search criteria - consistent data source usage
  const filteredDocuments = useMemo(() => {
    if (!allDocuments || allDocuments.length === 0) {
      return [];
    }

    console.log('Filtering documents, total count:', allDocuments.length);
    console.log('Current search filters:', searchFilters);

    return allDocuments.filter(doc => {
      // Use consistent field names from database
      const docName = doc.document_name || doc.original_filename || '';
      const docType = doc.document_type || doc.document_category || '';
      const docStatus = doc.status || 'unknown';
      const uploadDate = doc.upload_date || doc.created_at || '';

      // Query search - comprehensive search across all relevant fields
      const searchQuery = searchFilters.query.toLowerCase().trim();
      const matchesQuery = searchFilters.query === '' || 
        docName.toLowerCase().includes(searchQuery) ||
        docType.toLowerCase().includes(searchQuery) ||
        (doc.case?.case_title || '').toLowerCase().includes(searchQuery) ||
        (doc.case?.case_number || '').toLowerCase().includes(searchQuery) ||
        (doc.case?.counterparty_name || '').toLowerCase().includes(searchQuery) ||
        (doc.client?.company_name || '').toLowerCase().includes(searchQuery) ||
        (doc.client?.contact_person || '').toLowerCase().includes(searchQuery) ||
        (doc.description || '').toLowerCase().includes(searchQuery);

      // Type filter
      const matchesType = searchFilters.type === '' || docType === searchFilters.type;

      // Status filter - handle both database and legacy status formats
      const normalizedStatus = getStatusFromDocument(doc);
      const matchesStatus = searchFilters.status === '' || normalizedStatus === searchFilters.status;

      // Date range filter
      const matchesDate = searchFilters.dateRange === '' || checkDateRange(uploadDate, searchFilters.dateRange);

      const matches = matchesQuery && matchesType && matchesStatus && matchesDate;
      
      // Debug individual document filtering
      if (searchFilters.query && !matches) {
        console.log('Document filtered out:', {
          name: docName,
          type: docType,
          status: normalizedStatus,
          searchFilters
        });
      }
      
      return matches;
    });
    
    console.log('Filtered documents count:', filtered.length);
    return filtered;
  }, [allDocuments, searchFilters]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handlePreview = async (document: any) => {
    console.log('Previewing document:', document.document_name);
    setSelectedDocument(document);
    setIsLoadingPreview(true);
    setIsPreviewOpen(true);
    
    try {
      const url = await getDocumentPreviewUrl(document);
      setPreviewUrl(url);
      console.log('Preview URL generated:', url);
    } catch (error) {
      console.error('Error generating preview URL:', error);
      toast({
        title: 'Erro na visualização',
        description: 'Não foi possível gerar a visualização do documento.',
        variant: 'destructive'
      });
      setPreviewUrl('');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDownload = async (document: any) => {
    console.log('Starting download for:', document.document_name);
    try {
      await downloadDocument(document);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o documento. Tente novamente.',
        variant: 'destructive'
      });
    }
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
      }, index * 1000); // Delay each download by 1 second
    });
  };

  const handleUploadComplete = () => {
    refetch(); // Refresh the documents list
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao carregar documentos
            </h3>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro ao buscar seus documentos. Tente novamente.
            </p>
            <Button 
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-16 py-4 sm:py-0 gap-4 sm:gap-0">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/portal')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 p-2 sm:p-3"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar ao Portal</span>
                <span className="sm:hidden">Voltar</span>
              </Button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Documentos</h1>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                size="sm" 
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm w-full sm:w-auto"
                onClick={() => setIsUploadOpen(true)}
              >
                <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Gerenciar Documentos</span>
                <span className="sm:hidden">Gerenciar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <DocumentSearch onSearch={handleSearch} />
        
        {filteredDocuments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {allDocuments.length === 0 ? "Nenhum documento disponível" : "Nenhum documento encontrado"}
              </h3>
              <p className="text-gray-600 mb-4">
                {allDocuments.length === 0 
                  ? "Seus documentos aparecerão aqui quando forem adicionados aos seus casos pelo escritório."
                  : "Tente ajustar os filtros de busca para encontrar os documentos desejados."}
              </p>
              {allDocuments.length === 0 && (
                <Button 
                  onClick={() => setIsUploadOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Solicitar Upload de Documentos
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-start sm:items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-xs sm:text-sm break-words leading-tight">
                          {doc.document_name || doc.original_filename || 'Documento sem nome'}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-gray-600 mt-1 space-y-1 sm:space-y-0">
                          <span>{getLocalDocumentTypeDisplayLabel(doc.document_type || doc.document_category || 'Documento')}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : 'N/A'}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{new Date(doc.upload_date || doc.created_at || Date.now()).toLocaleDateString('pt-BR')}</span>
                          {doc.case && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="font-medium text-blue-600">
                                {doc.case.case_title || doc.case.counterparty_name || `Caso ${doc.case.case_number}`}
                              </span>
                            </>
                          )}
                          {doc.client && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="font-medium text-purple-600">
                                {doc.client.company_name || doc.client.contact_person}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                        getStatusFromDocument(doc) === 'Finalizado' 
                          ? 'bg-green-100 text-green-800' 
                          : getStatusFromDocument(doc) === 'Rejeitado'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusFromDocument(doc)}
                      </span>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-blue-500 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none text-xs"
                          onClick={() => handlePreview(doc)}
                          disabled={isLoadingPreview}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {isLoadingPreview && selectedDocument?.id === doc.id ? 'Carregando...' : 'Ver'}
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none text-xs"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Download</span>
                          <span className="sm:hidden">Baixar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <DocumentPreviewSheet
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedDocument(null);
          setPreviewUrl('');
        }}
        document={selectedDocument}
        previewUrl={previewUrl}
        onDownload={() => selectedDocument && handleDownload(selectedDocument)}
      />

      <DocumentUploadManager
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
};

export default PortalDocuments;
