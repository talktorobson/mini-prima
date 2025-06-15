
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Download } from 'lucide-react';

interface DocumentCardProps {
  document: any;
  onPreview: (document: any) => void;
  onDownload: (document: any) => void;
  isLoadingPreview: boolean;
  selectedDocumentId?: number | string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onPreview,
  onDownload,
  isLoadingPreview,
  selectedDocumentId
}) => {
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

  const getStatusFromDocument = (doc: any) => {
    if (doc.status === 'Final') return 'Finalizado';
    if (doc.status === 'Draft') return 'Pendente Assinatura';
    return 'Processando';
  };

  const getDocumentTypeDisplayLabel = (docType: string) => {
    if (docType === 'General Document') return 'Documento Escritório';
    if (docType === 'Case Document') return 'Documento Processo';
    return docType;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 text-xs sm:text-sm break-words leading-tight">
                {document.document_name}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-gray-600 mt-1 space-y-1 sm:space-y-0">
                <span>{getDocumentTypeDisplayLabel(document.document_type)}</span>
                <span className="hidden sm:inline">•</span>
                <span>{formatFileSize(document.file_size || 0)}</span>
                <span className="hidden sm:inline">•</span>
                <span>{formatDate(document.upload_date)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
              getStatusFromDocument(document) === 'Finalizado' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {getStatusFromDocument(document)}
            </span>
            
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="border-blue-500 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none text-xs"
                onClick={() => onPreview(document)}
                disabled={isLoadingPreview}
              >
                <Eye className="h-3 w-3 mr-1" />
                {isLoadingPreview && selectedDocumentId === document.id ? 'Carregando...' : 'Ver'}
              </Button>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none text-xs"
                onClick={() => onDownload(document)}
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
  );
};

export default DocumentCard;
