
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, Image, File, AlertCircle } from 'lucide-react';

interface DocumentPreviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  previewUrl: string;
  onDownload: () => void;
}

const DocumentPreviewSheet = ({ isOpen, onClose, document, previewUrl, onDownload }: DocumentPreviewSheetProps) => {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && previewUrl) {
      setLoadError(false);
      setIsLoading(true);
    }
  }, [isOpen, previewUrl]);

  const getFileExtension = (filename: string) => {
    return filename.toLowerCase().split('.').pop() || '';
  };

  const getFileType = () => {
    const filename = document?.document_name || document?.original_filename || '';
    const extension = getFileExtension(filename);
    
    if (['pdf'].includes(extension)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) return 'image';
    if (['txt', 'md'].includes(extension)) return 'text';
    return 'other';
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  const fileType = getFileType();
  const filename = document?.document_name || document?.original_filename || 'Documento';

  const renderPreviewContent = () => {
    if (!previewUrl) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg space-y-4">
          <AlertCircle className="h-16 w-16 text-orange-400" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">URL de visualização não disponível</h3>
            <p className="text-gray-600">Não foi possível gerar a URL de visualização para este documento.</p>
          </div>
        </div>
      );
    }

    switch (fileType) {
      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg p-4">
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span>Carregando imagem...</span>
              </div>
            )}
            <img
              src={previewUrl}
              alt={filename}
              className={`max-w-full max-h-full object-contain rounded shadow-lg ${isLoading ? 'hidden' : 'block'}`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
            {loadError && (
              <div className="flex flex-col items-center justify-center space-y-4 text-gray-600">
                <Image className="h-16 w-16 text-gray-400" />
                <p>Não foi possível carregar a imagem</p>
              </div>
            )}
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-full bg-white rounded-lg border relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span>Carregando PDF...</span>
                </div>
              </div>
            )}
            {loadError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg space-y-4">
                <FileText className="h-16 w-16 text-gray-400" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">Erro ao carregar PDF</h3>
                  <p className="text-gray-600">O PDF não pôde ser carregado no visualizador.</p>
                  <Button
                    onClick={handleOpenInNewTab}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em Nova Aba
                  </Button>
                </div>
              </div>
            ) : (
              <iframe
                src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                className="w-full h-full rounded-lg"
                title={`Preview of ${filename}`}
                style={{ border: 'none', minHeight: '600px' }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            )}
          </div>
        );

      case 'text':
        return (
          <div className="w-full h-full bg-white rounded-lg border relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span>Carregando texto...</span>
                </div>
              </div>
            )}
            <iframe
              src={previewUrl}
              className="w-full h-full rounded-lg"
              title={`Preview of ${filename}`}
              style={{ border: 'none', minHeight: '600px' }}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg space-y-6">
            <File className="h-20 w-20 text-blue-500" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">Visualização não disponível</h3>
              <p className="text-gray-600 max-w-sm">
                Este tipo de arquivo não pode ser visualizado diretamente. Use as opções abaixo para acessar o conteúdo.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleOpenInNewTab}
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Abrir em Nova Aba</span>
              </Button>
              <Button
                onClick={onDownload}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl bg-white">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-lg font-semibold text-gray-900 pr-8">
            {filename}
          </SheetTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center space-x-2"
              disabled={!previewUrl}
            >
              <ExternalLink className="h-4 w-4" />
              <span>Nova Aba</span>
            </Button>
            <Button
              size="sm"
              onClick={onDownload}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        </SheetHeader>
        
        <div className="mt-6 h-[calc(100vh-140px)]">
          {renderPreviewContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DocumentPreviewSheet;
