
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';

interface DocumentsHeaderProps {
  filteredDocumentsCount: number;
  onUploadClick: () => void;
  onBulkDownload: () => void;
}

const DocumentsHeader: React.FC<DocumentsHeaderProps> = ({
  filteredDocumentsCount,
  onUploadClick,
  onBulkDownload
}) => {
  const navigate = useNavigate();

  return (
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
              onClick={onUploadClick}
            >
              <Upload className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Enviar Documentos</span>
              <span className="sm:hidden">Enviar</span>
            </Button>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm w-full sm:w-auto"
              onClick={onBulkDownload}
              disabled={filteredDocumentsCount === 0}
            >
              <Download className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Download em Lote ({filteredDocumentsCount})</span>
              <span className="sm:hidden">Download ({filteredDocumentsCount})</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DocumentsHeader;
