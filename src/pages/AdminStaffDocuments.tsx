
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Search, 
  Upload, 
  Download, 
  Eye,
  Filter,
  Calendar,
  Building,
  AlertCircle,
  Paperclip
} from 'lucide-react';
import { useStaffData } from '@/hooks/useStaffData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DocumentUploadManager from '@/components/DocumentUploadManager';
import SmartDocumentSearch from '@/components/SmartDocumentSearch';
import useDocumentManagement from '@/hooks/useDocumentManagement';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  document_category: string;
  status: string;
  upload_date: string;
  file_size: number;
  file_path?: string;
  original_filename?: string;
  client_id: string;
  case_id?: string;
  is_visible_to_client: boolean;
  client: {
    company_name: string;
    contact_person: string;
  };
  case?: {
    case_title: string;
    case_number: string;
  };
}

const AdminStaffDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { assignedClients, staffInfo, isStaff, hasAssignedClients } = useStaffData();
  const { toast } = useToast();

  useEffect(() => {
    if (hasAssignedClients) {
      fetchStaffDocuments();
    }
  }, [hasAssignedClients, assignedClients]);

  const fetchStaffDocuments = async () => {
    try {
      setLoading(true);
      
      const assignedClientIds = assignedClients.map(client => client.id);
      
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          file_path,
          client:clients (
            company_name,
            contact_person
          ),
          case:cases (
            case_title,
            case_number
          )
        `)
        .in('client_id', assignedClientIds)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching staff documents:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar documentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.client.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.document_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Review': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewDocument = async (document: Document) => {
    try {
      // Get the correct file path from the document record
      const filePath = document.file_path || `${document.client_id}/${document.id}`;
      const bucketName = document.file_path ? 'case-documents' : 'documents';
      
      console.log('Viewing document from bucket:', bucketName, 'path:', filePath);
      
      // Create a signed URL for viewing the document
      const { data: signedData, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 300); // 5 minutes expiry

      if (error) {
        throw error;
      }

      if (signedData?.signedUrl) {
        // Open document in a new tab for viewing
        window.open(signedData.signedUrl, '_blank');
        
        toast({
          title: "Documento Aberto",
          description: `${document.document_name} foi aberto em uma nova aba`,
        });
      } else {
        throw new Error('Não foi possível gerar URL de visualização');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Erro",
        description: "Erro ao visualizar documento. Verifique se o arquivo existe.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      toast({
        title: "Download Iniciado",
        description: `Preparando download de: ${document.document_name}`,
      });

      // Get the correct file path from the document record
      const filePath = document.file_path || `${document.client_id}/${document.id}`;
      const bucketName = document.file_path ? 'case-documents' : 'documents';
      
      console.log('Downloading document from bucket:', bucketName, 'path:', filePath);

      // Create a signed URL for downloading the document
      const { data: signedData, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60); // 1 minute expiry for download

      if (error) {
        throw error;
      }

      if (signedData?.signedUrl) {
        // Create a temporary download link
        const link = document.createElement('a');
        link.href = signedData.signedUrl;
        // Use original filename if available, otherwise use document name
        link.download = document.original_filename || document.document_name;
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Concluído",
          description: "Documento baixado com sucesso",
        });
      } else {
        throw new Error('Não foi possível gerar URL de download');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Erro",
        description: "Erro ao baixar documento. Verifique se o arquivo existe.",
        variant: "destructive"
      });
    }
  };

  const uniqueCategories = [...new Set(documents.map(doc => doc.document_category))];

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Acesso restrito à equipe.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gerenciamento de Documentos</h1>
              <p className="text-sm text-gray-600">
                Documentos dos clientes atribuídos a {staffInfo?.full_name}
              </p>
            </div>
            <Button 
              onClick={() => setIsUploadOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Documento
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {!hasAssignedClients ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você não tem clientes atribuídos. Entre em contato com o administrador.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar documentos</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Buscar por nome, tipo ou cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category-filter">Categoria</Label>
                    <select
                      id="category-filter"
                      className="w-full p-2 border rounded-md"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">Todas</option>
                      {uniqueCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{documents.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Revisão</CardTitle>
                  <Eye className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {documents.filter(doc => doc.status === 'Review').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
                  <FileText className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {documents.filter(doc => doc.status === 'Approved').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visíveis ao Cliente</CardTitle>
                  <Building className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {documents.filter(doc => doc.is_visible_to_client).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando documentos...</p>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos</CardTitle>
                  <CardDescription>
                    Lista de documentos dos clientes atribuídos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum documento encontrado
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || categoryFilter !== 'all' 
                          ? 'Tente ajustar os filtros de busca.'
                          : 'Ainda não há documentos para os clientes atribuídos.'}
                      </p>
                      <Button onClick={() => setIsUploadOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Primeiro Documento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredDocuments.map((document) => (
                        <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {document.document_name}
                                </p>
                                <Badge className={getStatusColor(document.status)}>
                                  {document.status}
                                </Badge>
                                {document.is_visible_to_client && (
                                  <Badge variant="outline" className="text-xs">
                                    Visível ao Cliente
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{document.document_type}</span>
                                <span>{document.document_category}</span>
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {document.client.company_name}
                                </span>
                                {document.case && (
                                  <span className="flex items-center gap-1">
                                    <Paperclip className="h-3 w-3" />
                                    {document.case.case_number}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(document.upload_date).toLocaleDateString('pt-BR')}
                                </span>
                                <span>{formatFileSize(document.file_size || 0)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewDocument(document)}
                              className="hover:bg-blue-50 hover:text-blue-600"
                              title="Visualizar documento"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDownloadDocument(document)}
                              className="hover:bg-green-50 hover:text-green-600"
                              title="Download documento"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* Document Upload Manager */}
      <DocumentUploadManager
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={() => {
          fetchStaffDocuments();
          setIsUploadOpen(false);
        }}
      />
    </div>
  );
};

export default AdminStaffDocuments;
