
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  previewUrl: string;
  onDownload: () => void;
}

const DocumentPreviewModal = ({ isOpen, onClose, document, previewUrl, onDownload }: DocumentPreviewModalProps) => {
  const isPDF = document?.document_name?.toLowerCase().endsWith('.pdf') || document?.document_type?.toLowerCase().includes('pdf');
  
  const handleOpenInNewTab = () => {
    window.open(previewUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-800 border-slate-700">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-white text-lg">
            {document?.document_name}
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em Nova Aba
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="w-full h-[70vh] bg-white rounded">
          {isPDF ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-600">
              <div className="text-6xl">📄</div>
              <h3 className="text-xl font-semibold">Visualização de PDF</h3>
              <p className="text-center max-w-md">
                Para visualizar este PDF, clique em "Abrir em Nova Aba" ou faça o download do arquivo.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={handleOpenInNewTab}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
                <Button
                  variant="outline"
                  onClick={onDownload}
                  className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={previewUrl}
              className="w-full h-full rounded"
              title={`Preview of ${document?.document_name}`}
              style={{ border: 'none' }}
              sandbox="allow-same-origin allow-scripts"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
