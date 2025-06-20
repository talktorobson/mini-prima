// Enhanced Document-Case Attachment Manager
// D'Avila Reis Legal Practice Management System
// SECURITY: Role-based document attachment with audit trails

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Link, 
  Unlink, 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  EyeOff,
  Clock,
  User
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '@/services/documentService';
import { caseService } from '@/services/caseService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentCaseAttachmentManagerProps {
  documentId?: string;
  caseId?: string;
  isOpen: boolean;
  onClose: () => void;
  onAttachmentComplete?: () => void;
}

interface AttachmentRequest {
  documentId: string;
  caseId: string;
  attachmentType: 'evidence' | 'contract' | 'correspondence' | 'court_filing' | 'other';
  notes?: string;
  isVisibleToClient: boolean;
}

const DocumentCaseAttachmentManager: React.FC<DocumentCaseAttachmentManagerProps> = ({
  documentId,
  caseId,
  isOpen,
  onClose,
  onAttachmentComplete
}) => {
  const [selectedDocumentId, setSelectedDocumentId] = useState(documentId || '');
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || '');
  const [attachmentType, setAttachmentType] = useState<string>('other');
  const [notes, setNotes] = useState('');
  const [isVisibleToClient, setIsVisibleToClient] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [permissionCheck, setPermissionCheck] = useState<{
    documentAccess: boolean;
    caseAccess: boolean;
    canAttach: boolean;
  } | null>(null);

  const queryClient = useQueryClient();
  const adminAuth = useAdminAuth();
  const clientAuth = useAuth();
  
  // Determine current user context
  const currentUser = adminAuth?.user || clientAuth?.user;
  const userRole = adminAuth?.adminUser?.role || (clientAuth?.user ? 'client' : null);

  // Fetch available documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', 'attachable'],
    queryFn: () => documentService.getDocuments(),
    enabled: isOpen && !documentId,
  });

  // Fetch available cases  
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases', 'attachable'],
    queryFn: caseService.getCases,
    enabled: isOpen && !caseId,
  });

  // Fetch selected document details
  const { data: selectedDocument } = useQuery({
    queryKey: ['document', selectedDocumentId],
    queryFn: () => documentService.getDocument(selectedDocumentId),
    enabled: !!selectedDocumentId,
  });

  // Fetch selected case details
  const { data: selectedCase } = useQuery({
    queryKey: ['case', selectedCaseId],
    queryFn: () => caseService.getCase(selectedCaseId),
    enabled: !!selectedCaseId,
  });

  // Attachment mutation
  const attachMutation = useMutation({
    mutationFn: (request: AttachmentRequest) => 
      documentService.attachDocumentToCase({
        document_id: request.documentId,
        case_id: request.caseId,
        attachment_type: request.attachmentType as any,
        notes: request.notes
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onAttachmentComplete?.();
      onClose();
    },
  });

  // Detachment mutation
  const detachMutation = useMutation({
    mutationFn: (docId: string) => documentService.detachDocumentFromCase(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onAttachmentComplete?.();
    },
  });

  // Security validation effect
  useEffect(() => {
    if (selectedDocumentId && selectedCaseId && selectedDocument && selectedCase) {
      validateAttachmentSecurity();
    }
  }, [selectedDocumentId, selectedCaseId, selectedDocument, selectedCase, userRole]);

  const validateAttachmentSecurity = () => {
    if (!selectedDocument || !selectedCase) return;

    const warnings = [];
    let documentAccess = false;
    let caseAccess = false;
    let canAttach = false;

    // Check document access permissions
    if (userRole === 'admin') {
      documentAccess = true;
      caseAccess = true;
    } else if (userRole === 'staff') {
      // Staff should have assignment to both document's client and case
      documentAccess = true; // Validated by service layer
      caseAccess = true; // Validated by service layer
    } else if (userRole === 'client') {
      // Clients can only attach documents to their own cases
      documentAccess = selectedDocument.client_id === clientAuth?.user?.id;
      caseAccess = selectedCase.client_id === clientAuth?.user?.id;
      
      if (!documentAccess) {
        warnings.push('Você não tem permissão para este documento');
      }
      if (!caseAccess) {
        warnings.push('Você não tem permissão para este caso');
      }
    }

    // Check security level compatibility
    if (selectedDocument.access_level === 'attorney_client_privilege' && userRole === 'client') {
      warnings.push('Documento com privilégio advogado-cliente requer aprovação especial');
      canAttach = false;
    } else if (selectedDocument.access_level === 'confidential' && isVisibleToClient) {
      warnings.push('Documento confidencial não deve ser visível ao cliente');
    } else {
      canAttach = documentAccess && caseAccess;
    }

    // Check if document is already attached to a different case
    if (selectedDocument.case_id && selectedDocument.case_id !== selectedCaseId) {
      warnings.push('Documento já está anexado a outro caso');
    }

    setPermissionCheck({ documentAccess, caseAccess, canAttach });
    setSecurityWarning(warnings.length > 0 ? warnings.join('; ') : null);
  };

  const handleAttach = () => {
    if (!selectedDocumentId || !selectedCaseId || !permissionCheck?.canAttach) {
      return;
    }

    const request: AttachmentRequest = {
      documentId: selectedDocumentId,
      caseId: selectedCaseId,
      attachmentType: attachmentType as any,
      notes: notes.trim() || undefined,
      isVisibleToClient
    };

    attachMutation.mutate(request);
  };

  const handleDetach = () => {
    if (!selectedDocumentId) return;
    detachMutation.mutate(selectedDocumentId);
  };

  const getAccessLevelBadge = (level: string) => {
    const variants = {
      'public': 'default',
      'internal': 'secondary', 
      'confidential': 'destructive',
      'attorney_client_privilege': 'destructive'
    } as const;

    const labels = {
      'public': 'Público',
      'internal': 'Interno',
      'confidential': 'Confidencial',
      'attorney_client_privilege': 'Privilégio Advogado-Cliente'
    };

    return (
      <Badge variant={variants[level as keyof typeof variants] || 'default'}>
        <Shield className="h-3 w-3 mr-1" />
        {labels[level as keyof typeof labels] || level}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Gerenciar Anexação de Documentos
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Document Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Documento</label>
            {documentId ? (
              <div className="p-3 border rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedDocument?.document_name}</p>
                    <p className="text-sm text-gray-600">{selectedDocument?.document_type}</p>
                  </div>
                  {selectedDocument && getAccessLevelBadge(selectedDocument.access_level || 'internal')}
                </div>
              </div>
            ) : (
              <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um documento" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{doc.document_name}</span>
                        <Badge variant="outline" className="ml-2">
                          {doc.document_type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Case Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Processo</label>
            {caseId ? (
              <div className="p-3 border rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedCase?.case_title || selectedCase?.counterparty_name}</p>
                    <p className="text-sm text-gray-600">Nº {selectedCase?.case_number}</p>
                  </div>
                  <Badge variant="outline">{selectedCase?.status}</Badge>
                </div>
              </div>
            ) : (
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um processo" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((case_item) => (
                    <SelectItem key={case_item.id} value={case_item.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{case_item.case_title || case_item.counterparty_name}</span>
                        <Badge variant="outline" className="ml-2">
                          {case_item.case_number}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Attachment Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Anexação</label>
            <Select value={attachmentType} onValueChange={setAttachmentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="evidence">Prova/Evidência</SelectItem>
                <SelectItem value="contract">Contrato</SelectItem>
                <SelectItem value="correspondence">Correspondência</SelectItem>
                <SelectItem value="court_filing">Petição Judicial</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Client Visibility */}
          {(userRole === 'staff' || userRole === 'admin') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Visibilidade</label>
              <div className="flex items-center space-x-3">
                <Button
                  variant={isVisibleToClient ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsVisibleToClient(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visível ao Cliente
                </Button>
                <Button
                  variant={!isVisibleToClient ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsVisibleToClient(false)}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Apenas Interno
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre esta anexação..."
              rows={3}
            />
          </div>

          {/* Security Warning */}
          {securityWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{securityWarning}</AlertDescription>
            </Alert>
          )}

          {/* Permission Status */}
          {permissionCheck && (
            <div className="space-y-2">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  {permissionCheck.documentAccess ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Acesso ao Documento</span>
                </div>
                <div className="flex items-center space-x-1">
                  {permissionCheck.caseAccess ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Acesso ao Processo</span>
                </div>
              </div>
            </div>
          )}

          {/* Current Attachment Status */}
          {selectedDocument?.case_id && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Este documento está anexado ao processo {selectedDocument.case_id}
                {selectedDocument.case_id !== selectedCaseId && ' (diferente do selecionado)'}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              {selectedDocument?.case_id && (
                <Button
                  variant="outline"
                  onClick={handleDetach}
                  disabled={detachMutation.isPending}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Desanexar
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleAttach}
                disabled={
                  !selectedDocumentId || 
                  !selectedCaseId || 
                  !permissionCheck?.canAttach ||
                  attachMutation.isPending
                }
              >
                <Link className="h-4 w-4 mr-2" />
                {attachMutation.isPending ? 'Anexando...' : 'Anexar'}
              </Button>
            </div>
          </div>

          {/* User Context Info */}
          <div className="pt-4 border-t text-xs text-gray-500 flex items-center space-x-2">
            <User className="h-3 w-3" />
            <span>
              Logado como: {currentUser?.email} ({userRole})
            </span>
            <Clock className="h-3 w-3 ml-4" />
            <span>
              {new Date().toLocaleString('pt-BR')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentCaseAttachmentManager;