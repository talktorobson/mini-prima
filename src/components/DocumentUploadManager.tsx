
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, FolderOpen } from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import GeneralDocumentUpload from './GeneralDocumentUpload';
import { useQuery } from '@tanstack/react-query';
import { caseService } from '@/services/caseService';

interface DocumentUploadManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
  preselectedCaseId?: string;
  preselectedCaseTitle?: string;
}

const DocumentUploadManager: React.FC<DocumentUploadManagerProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  preselectedCaseId,
  preselectedCaseTitle
}) => {
  const [activeTab, setActiveTab] = useState(preselectedCaseId ? 'case' : 'general');
  const [selectedCase, setSelectedCase] = useState<{id: string, title: string} | null>(
    preselectedCaseId && preselectedCaseTitle 
      ? { id: preselectedCaseId, title: preselectedCaseTitle }
      : null
  );

  // Fetch available cases
  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: caseService.getCases,
    enabled: isOpen,
  });

  const handleCaseSelect = (caseItem: any) => {
    setSelectedCase({
      id: caseItem.id,
      title: caseItem.case_title || caseItem.counterparty_name || 'Processo sem título'
    });
    setActiveTab('case');
  };

  const handleUploadComplete = () => {
    onUploadComplete?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Gerenciador de Documentos
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mx-6 mb-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos Gerais
              </TabsTrigger>
              <TabsTrigger value="case" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Vincular a Processo
              </TabsTrigger>
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Selecionar Processo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-0">
              <GeneralDocumentUpload
                isOpen={true}
                onClose={onClose}
                onUploadComplete={handleUploadComplete}
              />
            </TabsContent>

            <TabsContent value="case" className="mt-0">
              {selectedCase ? (
                <DocumentUpload
                  caseId={selectedCase.id}
                  caseTitle={selectedCase.title}
                  isOpen={true}
                  onClose={onClose}
                  onUploadComplete={handleUploadComplete}
                />
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-600 mb-4">Selecione um processo para vincular os documentos</p>
                  <Button onClick={() => setActiveTab('browse')}>
                    Selecionar Processo
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="browse" className="mt-0 max-h-96 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Selecionar Processo</h3>
                <div className="space-y-2">
                  {cases.map((caseItem) => (
                    <Card 
                      key={caseItem.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleCaseSelect(caseItem)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              {caseItem.case_title || caseItem.counterparty_name || 'Processo sem título'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Número: {caseItem.case_number} | Status: {caseItem.status}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Selecionar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {cases.length === 0 && (
                  <p className="text-center text-gray-600 py-8">
                    Nenhum processo disponível
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUploadManager;
