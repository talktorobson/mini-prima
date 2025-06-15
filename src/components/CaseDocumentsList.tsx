
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Upload, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DocumentUploadManager from './DocumentUploadManager';
import { getDocumentPreviewUrl, downloadDocument } from '@/services/documentPreview';

interface CaseDocumentsListProps {
  caseId: string;
  caseTitle: string;
}

const CaseDocumentsList: React.FC<CaseDocumentsListProps> = ({ caseId, caseTitle }) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();

  // Fetch documents for this case
  const { data: documents = [], isLoading, refetch } = useQuery({
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
  });

  const handlePreview = async (document: any) => {
    try {
      const url = await getDocumentPreviewUrl(document);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error previewing document:', error);
      toast({
        title: 'Erro na visualização',
        description: 'Não foi possível visualizar o documento.',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = async (document: any) => {
    try {
      await downloadDocument(document);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o documento.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Documento removido com sucesso.'
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o documento.',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Review': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando documentos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos do Processo
            </CardTitle>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Adicionar Documento
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Adicione documentos relacionados a este processo
              </p>
              <Button
                onClick={() => setIsUploadOpen(true)}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Primeiro Documento
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {document.document_name}
                        </h3>
                        <Badge className={getStatusColor(document.status)}>
                          {document.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{document.document_category}</span>
                        <span>{formatFileSize(document.file_size || 0)}</span>
                        <span>{formatDate(document.upload_date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(document)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(document.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentUploadManager
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={() => refetch()}
        preselectedCaseId={caseId}
        preselectedCaseTitle={caseTitle}
      />
    </>
  );
};

export default CaseDocumentsList;
