
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ArrowLeft, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '@/hooks/useDocuments';
import DocumentSearch from '@/components/DocumentSearch';
import DocumentPreviewSheet from '@/components/DocumentPreviewSheet';
import { getDocumentPreviewUrl, downloadDocument } from '@/services/documentPreview';

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

  const getStatusFromDocument = (doc: any) => {
    if (doc.status === 'Final') return 'Finalizado';
    if (doc.status === 'Draft') return 'Pendente Assinatura';
    return 'Processando';
  };

  const checkDateRange = (uploadDate: string, range: string) => {
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
  };

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
    console.log('Previewing document:', document.document_name, 'Path:', document.file_path);
    setSelectedDocument(document);
    const url = await getDocumentPreviewUrl(document);
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (document: any) => {
    await downloadDocument(document);
  };

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/portal')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Portal</span>
              </Button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-bold text-gray-900">Documentos</h1>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Download em Lote
              </Button>
              <Button size="sm" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                Acesso Seguro
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{doc.document_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{doc.document_type}</span>
                          <span>{formatFileSize(doc.file_size || 0)}</span>
                          <span>{formatDate(doc.upload_date)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          onClick={() => handlePreview(doc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
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
        onClose={() => setIsPreviewOpen(false)}
        document={selectedDocument}
        previewUrl={previewUrl}
        onDownload={() => selectedDocument && handleDownload(selectedDocument)}
      />
    </div>
  );
};

export default PortalDocuments;
