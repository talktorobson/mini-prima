import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { clientService } from '@/services/database';
import { caseService } from '@/services/caseService';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getDocumentTypeDisplayLabel } from '@/lib/documentUtils';

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
    queryFn: caseService.getCases,
    enabled: isOpen,
  });

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
      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
      }

      console.log('User authenticated:', user.id);

      // Test storage bucket access first
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.error('Bucket access error:', bucketError);
        throw new Error('Erro ao acessar sistema de armazenamento. Verifique sua conexão.');
      }

      const caseDocumentsBucket = buckets?.find(b => b.name === 'case-documents');
      if (!caseDocumentsBucket) {
        throw new Error('Bucket de documentos não configurado. Contate o administrador.');
      }

      console.log('Storage bucket verified:', caseDocumentsBucket.name);

      // Get current client
      let client;
      try {
        client = await clientService.getCurrentClient();
        if (!client) {
          // For admin users, use a fallback approach
          const { data: staffUser } = await supabase
            .from('staff')
            .select('id, full_name')
            .eq('email', user.email)
            .single();
          
          if (staffUser) {
            console.log('Admin user detected, using staff context');
            client = { id: 'admin-' + staffUser.id, company_name: 'Administração' };
          } else {
            throw new Error('Usuário não encontrado no sistema');
          }
        }
      } catch (clientError) {
        console.error('Client retrieval error:', clientError);
        throw new Error('Erro ao identificar cliente. Verifique suas permissões.');
      }

      console.log('Client identified:', client.id);

      const uploadPromises = selectedFiles.map(async ({ file, category, caseId }, index) => {
        console.log(`[${index + 1}/${selectedFiles.length}] Uploading: ${file.name}`);
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Arquivo "${file.name}" excede o limite de 10MB`);
        }

        // Create secure file path
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = (caseId !== 'general' && caseId !== 'administrative') 
          ? `cases/${caseId}/${timestamp}-${randomId}-${safeName}`
          : `general/${user.id}/${timestamp}-${randomId}-${safeName}`;
        
        console.log(`Uploading to: ${fileName}`);

        // Upload file with proper error handling
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('case-documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/octet-stream'
          });

        if (uploadError) {
          console.error(`Upload error for ${file.name}:`, uploadError);
          
          // Handle specific error cases
          if (uploadError.message?.includes('already exists')) {
            // Retry with new filename
            const retryFileName = `${fileName.replace(/(\.[^.]+)$/, '')}-retry-${Date.now()}$1`;
            const { error: retryError } = await supabase.storage
              .from('case-documents')
              .upload(retryFileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || 'application/octet-stream'
              });
            
            if (retryError) {
              throw new Error(`Falha no upload de "${file.name}": ${retryError.message}`);
            }
            console.log(`Retry upload successful: ${retryFileName}`);
          } else {
            throw new Error(`Falha no upload de "${file.name}": ${uploadError.message}`);
          }
        }

        console.log(`File uploaded successfully: ${fileName}`);

        // Get signed URL for verification
        const { data: urlData } = supabase.storage
          .from('case-documents')
          .getPublicUrl(fileName);

        // Create document record with comprehensive data
        const documentData = {
          document_name: file.name,
          original_filename: file.name,
          file_path: fileName,
          file_url: urlData?.publicUrl,
          document_type: (caseId !== 'general' && caseId !== 'administrative') ? 'Case Document' : 'General Document',
          document_category: category,
          file_size: file.size,
          case_id: (caseId !== 'general' && caseId !== 'administrative') ? caseId : null,
          client_id: client.id.startsWith('admin-') ? null : client.id,
          status: 'Draft',
          is_visible_to_client: true,
          upload_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('Creating document record...', documentData);

        const { data: docRecord, error: insertError } = await supabase
          .from('documents')
          .insert(documentData)
          .select()
          .single();

        if (insertError) {
          console.error('Database insert error:', insertError);
          
          // Clean up uploaded file on database error
          await supabase.storage.from('case-documents').remove([fileName]);
          
          throw new Error(`Erro ao salvar registro de "${file.name}": ${insertError.message}`);
        }

        console.log(`Document record created successfully:`, docRecord.id);
        return { fileName: file.name, documentId: docRecord.id };
      });

      const results = await Promise.all(uploadPromises);

      toast({
        title: "Sucesso",
        description: `${results.length} documento(s) enviado(s) com sucesso!`,
        variant: "success"
      });

      setSelectedFiles([]);
      onUploadComplete?.();
      onClose();
    } catch (error) {
      console.error('Upload process error:', error);
      toast({
        title: "Erro no Upload",
        description: error.message || 'Erro inesperado ao enviar documentos. Tente novamente.',
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
