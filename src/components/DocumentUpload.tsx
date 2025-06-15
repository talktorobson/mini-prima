
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DocumentUploadProps {
  caseId: string;
  caseTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

interface SelectedFile {
  file: File;
  category: string;
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

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  caseId,
  caseTitle,
  isOpen,
  onClose,
  onUploadComplete
}) => {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: SelectedFile[] = Array.from(files).map(file => ({
      file,
      category: 'Outros',
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const uploadPromises = selectedFiles.map(async ({ file, category }) => {
        console.log(`Uploading file: ${file.name}, category: ${category}, case: ${caseId}`);
        
        // Upload file to storage
        const fileName = `${user.id}/${caseId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('case-documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        // Create document record
        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            document_name: file.name,
            original_filename: file.name,
            file_path: fileName,
            document_type: 'Case Document',
            document_category: category,
            file_size: file.size,
            case_id: caseId,
            status: 'Draft',
            is_visible_to_client: true
          });

        if (insertError) {
          console.error('Database insert error:', insertError);
          throw insertError;
        }

        return file.name;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Sucesso",
        description: `${selectedFiles.length} documento(s) enviado(s) com sucesso!`
      });

      setSelectedFiles([]);
      onUploadComplete?.();
      onClose();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar documentos. Tente novamente.",
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Documentos - {caseTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* File Selection */}
          <div>
            <Label htmlFor="file-upload" className="block mb-2">
              Selecionar Arquivos
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
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
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Selecionar Arquivos
              </Button>
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div>
              <Label className="block mb-2">
                Arquivos Selecionados ({selectedFiles.length})
              </Label>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {selectedFiles.map((selectedFile) => (
                  <div key={selectedFile.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {selectedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.file.size)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 w-40">
                      <Select
                        value={selectedFile.category}
                        onValueChange={(value) => updateFileCategory(selectedFile.id, value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(selectedFile.id)}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? 'Enviando...' : `Enviar ${selectedFiles.length} arquivo(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUpload;
