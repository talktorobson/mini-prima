
import { useState } from 'react';
import { getDocumentPreviewUrl, downloadDocument } from '@/services/documentPreview';
import { useToast } from '@/hooks/useToast';

export const useDocumentActions = () => {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const { toast } = useToast();

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

  const closePreview = () => {
    setIsPreviewOpen(false);
    setSelectedDocument(null);
    setPreviewUrl('');
  };

  return {
    selectedDocument,
    previewUrl,
    isPreviewOpen,
    isLoadingPreview,
    handlePreview,
    handleDownload,
    closePreview
  };
};
