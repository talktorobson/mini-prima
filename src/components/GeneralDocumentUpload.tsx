import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { clientService, casesService } from '@/services/database';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface GeneralDocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

interface SelectedFile {
  file: File;
  category: string;
  caseId: string;
  id: string;
}

const DOCUMENT_CATEGORIES = [
  'Contratos',
  'Documentos Pessoais',
  'Certidões',
  'Procurações',
  'Petições',
  'Decisões Judiciais',
  'Correspondências',
  'Comprovantes',
  'Relatórios',
  'Outros'
];

const GeneralDocumentUpload: React.FC<GeneralDocumentUploadProps> = ({
  isOpen,
  onClose,
  onUploadComplete
}) => {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Fetch available cases
  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: casesService.getCases,
    enabled: isOpen,
  });

  // Helper function to get display label for document type
  function getDocumentTypeDisplayLabel(docType: string) {
    if (docType === 'General Document') return 'Documento Escritório';
    if (docType === 'Case Document') return 'Documento Processo';
    return docType; // Return original type for other cases
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: SelectedFile[] = Array.from(files).map(file => ({
      file,
      category: 'Outros',
      caseId: 'general', // Default to general instead of empty string
      id: `${Date.now()}-${Math.random()}`
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    // Reset input
    event.target.value = '';
  };

  const updateFileCategory = (fileId: string, category: string) => {
    setSelectedFiles(prev =>
      prev.map(f => f.id === fileId ? { ...f, category } : f)
    );
  };

  const updateFileCaseId = (fileId: string, caseId: string) => {
    setSelectedFiles(prev =>
      prev.map(f => f.id === fileId ? { ...f, caseId } : f)
    );
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um arquivo.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Get current user and client
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Getting current client...');
      const client = await clientService.getCurrentClient();
      if (!client) {
        throw new Error('Cliente não encontrado');
      }

      console.log('Client found:', client.id);

      const uploadPromises = selectedFiles.map(async ({ file, category, caseId }) => {
        console.log(`Uploading file: ${file.name}, category: ${category}, case: ${caseId === 'general' ? 'General' : caseId}`);
        
        // Create a safe file path
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = (caseId !== 'general' && caseId !== 'administrative') 
          ? `${user.id}/${caseId}/${timestamp}-${safeName}`
          : `${user.id}/general/${timestamp}-${safeName}`;
        
        console.log('Uploading to storage path:', fileName);

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('case-documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        console.log('File uploaded successfully, creating document record...');

        // Create document record with client_id
        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            document_name: file.name,
            original_filename: file.name,
            file_path: fileName,
            document_type: (caseId !== 'general' && caseId !== 'administrative') ? 'Case Document' : 'General Document',
            document_category: category,
            file_size: file.size,
            case_id: (caseId !== 'general' && caseId !== 'administrative') ? caseId : null,
            client_id: client.id,
            status: 'Draft',
            is_visible_to_client: true
          });

        if (insertError) {
          console.error('Database insert error:', insertError);
          throw insertError;
        }

        console.log('Document record created successfully');
        return file.name;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Sucesso",
        description: `${selectedFiles.length} documento(s) enviado(s) com sucesso!`,
        variant: "success"
      });

      setSelectedFiles([]);
      onUploadComplete?.();
      onClose();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Erro",
        description: `Erro ao enviar documentos: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">Enviar Documentos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Selection */}
          <div>
            <Label htmlFor="file-upload" className="block mb-2 text-sm">
              Selecionar Arquivos
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
              <p className="text-xs sm:text-sm text-gray-600 mb-2 px-2">
                Clique para selecionar arquivos ou arraste e solte aqui
              </p>
              <Input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="text-xs"
              >
                Selecionar Arquivos
              </Button>
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div>
              <Label className="block mb-2 text-sm">
                Arquivos Selecionados ({selectedFiles.length})
              </Label>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {selectedFiles.map((selectedFile) => (
                  <div key={selectedFile.id} className="border rounded-lg p-3 space-y-3">
                    {/* File Info Row */}
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate pr-2">
                          {selectedFile.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(selectedFile.file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(selectedFile.id)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Controls Row - Stacked on mobile */}
                    <div className="space-y-2">
                      {/* Case Selection */}
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Caso</Label>
                        <Select
                          value={selectedFile.caseId}
                          onValueChange={(value) => updateFileCaseId(selectedFile.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue placeholder="Selecionar caso" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general" className="text-xs">
                              {getDocumentTypeDisplayLabel('General Document')}
                            </SelectItem>
                            <SelectItem value="administrative" className="text-xs">
                              Financeiro D'avila Reis Advogados
                            </SelectItem>
                            {cases.map((case_) => (
                              <SelectItem key={case_.id} value={case_.id} className="text-xs">
                                {case_.counterparty_name || case_.case_title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Category Selection */}
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Categoria</Label>
                        <Select
                          value={selectedFile.category}
                          onValueChange={(value) => updateFileCategory(selectedFile.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category} className="text-xs">
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex flex-col gap-2 pt-4 border-t">
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
              className="bg-blue-600 hover:bg-blue-700 w-full text-sm"
            >
              {uploading ? 'Enviando...' : `Enviar ${selectedFiles.length} arquivo(s)`}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={uploading} 
              className="w-full text-sm"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeneralDocumentUpload;
