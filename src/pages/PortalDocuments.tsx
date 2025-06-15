
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ArrowLeft, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '@/hooks/useDocuments';
import DocumentSearch from '@/components/DocumentSearch';
import DocumentPreviewSheet from '@/components/DocumentPreviewSheet';
import { getDocumentPreviewUrl, downloadDocument } from '@/services/documentPreview';
import { useToast } from '@/hooks/useToast';

interface SearchFilters {
  query: string;
  type: string;
  status: string;
  dateRange: string;
}

const PortalDocuments = () => {
  const navigate = useNavigate();
  const { data: documents = [], isLoading, error } = useDocuments();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const { toast } = useToast();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    type: '',
    status: '',
    dateRange: ''
  });

  // Mock documents for demo since the database might not have data
  const mockDocuments = [
    {
      id: 1,
      document_name: "Contrato de Prestação de Serviços.pdf",
      document_type: "Contrato",
      file_size: 2458112, // 2.4 MB
      upload_date: "2024-06-15T12:00:00Z",
      status: "Final",
      original_filename: "Contrato de Prestação de Serviços.pdf"
    },
    {
      id: 2,
      document_name: "Procuração Judicial.pdf",
      document_type: "Procuração",
      file_size: 1887436, // 1.8 MB
      upload_date: "2024-06-12T10:30:00Z",
      status: "Draft",
      original_filename: "Procuração Judicial.pdf"
    },
    {
      id: 3,
      document_name: "Relatório Parecer Técnico.pdf",
      document_type: "Relatório",
      file_size: 3355443, // 3.2 MB
      upload_date: "2024-06-10T14:15:00Z",
      status: "Final",
      original_filename: "Relatório Parecer Técnico.pdf"
    },
    {
      id: 4,
      document_name: "Documentos Identificação.zip",
      document_type: "Identificação",
      file_size: 5368709, // 5.1 MB
      upload_date: "2024-06-08T09:45:00Z",
      status: "Final",
      original_filename: "Documentos Identificação.zip"
    }
  ];

  // Use real documents if available, otherwise use mock data
  const allDocuments = documents.length > 0 ? documents : mockDocuments;

  // Helper functions defined before they are used
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
      }, index * 1000); // Delay each download by 1 second
    });
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
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                onClick={handleBulkDownload}
                disabled={filteredDocuments.length === 0}
              >
                <Download className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Download em Lote ({filteredDocuments.length})</span>
                <span className="sm:hidden">Download ({filteredDocuments.length})</span>
              </Button>
              <Button size="sm" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs sm:text-sm">
                Acesso Seguro
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
                {searchFilters.query || searchFilters.type || searchFilters.status || searchFilters.dateRange 
                  ? 'Nenhum documento encontrado' 
                  : 'Nenhum documento disponível'}
              </h3>
              <p className="text-gray-600">
                {searchFilters.query || searchFilters.type || searchFilters.status || searchFilters.dateRange 
                  ? 'Tente ajustar os filtros de busca para encontrar documentos.' 
                  : 'Seus documentos aparecerão aqui quando estiverem disponíveis.'}
              </p>
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
                        <h3 className="font-medium text-gray-900 text-xs sm:text-sm break-words leading-tight">{doc.document_name}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-gray-600 mt-1 space-y-1 sm:space-y-0">
                          <span>{doc.document_type}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{formatFileSize(doc.file_size || 0)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{formatDate(doc.upload_date)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                        getStatusFromDocument(doc) === 'Finalizado' 
                          ? 'bg-green-100 text-green-800' 
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
    </div>
  );
};

export default PortalDocuments;
