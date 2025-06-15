
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: number | string;
  document_name: string;
  document_type: string;
  upload_date: string;
}

interface DocumentsOverviewProps {
  documents: Document[];
  totalDocuments: number;
  isLoading: boolean;
}

const DocumentsOverview: React.FC<DocumentsOverviewProps> = ({ 
  documents, 
  totalDocuments, 
  isLoading 
}) => {
  const navigate = useNavigate();

  // Helper function to get display label for document type
  function getDocumentTypeDisplayLabel(docType: string) {
    if (docType === 'General Document') return 'Documento Escritório';
    if (docType === 'Case Document') return 'Documento Processo';
    return docType;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Documentos</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-green-600">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">Total de Documentos</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/portal/documents')}
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            Ver Todos
          </Button>
        </div>
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recentes</h4>
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                    {doc.document_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {getDocumentTypeDisplayLabel(doc.document_type)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentsOverview;
