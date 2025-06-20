// 🚨 Document Upload Error Handler Component
// D'Avila Reis Legal Practice Management System
// Comprehensive error handling for document uploads with retry mechanisms

import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  FileX, 
  Shield, 
  Wifi, 
  HardDrive,
  Clock,
  X
} from 'lucide-react';

export interface DocumentUploadError {
  id: string;
  filename: string;
  fileSize: number;
  errorType: 'network' | 'size' | 'type' | 'permission' | 'storage' | 'timeout' | 'unknown';
  errorMessage: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

interface DocumentUploadErrorHandlerProps {
  errors: DocumentUploadError[];
  onRetry: (errorId: string) => void;
  onDismiss: (errorId: string) => void;
  onDismissAll: () => void;
  onReportIssue?: (error: DocumentUploadError) => void;
  className?: string;
}

const DocumentUploadErrorHandler: React.FC<DocumentUploadErrorHandlerProps> = ({
  errors,
  onRetry,
  onDismiss,
  onDismissAll,
  onReportIssue,
  className = ''
}) => {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  if (errors.length === 0) return null;

  const toggleExpanded = (errorId: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedErrors(newExpanded);
  };

  const getErrorIcon = (errorType: DocumentUploadError['errorType']) => {
    switch (errorType) {
      case 'network': return <Wifi className="h-4 w-4" />;
      case 'size': return <HardDrive className="h-4 w-4" />;
      case 'type': return <FileX className="h-4 w-4" />;
      case 'permission': return <Shield className="h-4 w-4" />;
      case 'storage': return <HardDrive className="h-4 w-4" />;
      case 'timeout': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getErrorColor = (errorType: DocumentUploadError['errorType']) => {
    switch (errorType) {
      case 'network': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'size': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'type': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'permission': return 'bg-red-100 text-red-800 border-red-200';
      case 'storage': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'timeout': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getErrorTitle = (errorType: DocumentUploadError['errorType']) => {
    switch (errorType) {
      case 'network': return 'Erro de Conexão';
      case 'size': return 'Arquivo Muito Grande';
      case 'type': return 'Tipo de Arquivo Inválido';
      case 'permission': return 'Sem Permissão';
      case 'storage': return 'Erro de Armazenamento';
      case 'timeout': return 'Timeout de Upload';
      default: return 'Erro Desconhecido';
    }
  };

  const getErrorSolution = (errorType: DocumentUploadError['errorType']) => {
    switch (errorType) {
      case 'network': 
        return 'Verifique sua conexão com a internet e tente novamente.';
      case 'size': 
        return 'O arquivo excede o tamanho máximo permitido. Comprima o arquivo ou divida em partes menores.';
      case 'type': 
        return 'Este tipo de arquivo não é suportado. Use PDF, DOC, DOCX, JPG ou PNG.';
      case 'permission': 
        return 'Você não tem permissão para fazer upload deste documento. Contate o administrador.';
      case 'storage': 
        return 'Erro no servidor de armazenamento. Tente novamente em alguns minutos.';
      case 'timeout': 
        return 'O upload demorou muito para completar. Tente com um arquivo menor ou verifique sua conexão.';
      default: 
        return 'Erro inesperado. Tente novamente ou contate o suporte técnico.';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const canRetry = (error: DocumentUploadError) => {
    return error.retryCount < error.maxRetries && 
           ['network', 'storage', 'timeout'].includes(error.errorType);
  };

  const criticalErrors = errors.filter(e => ['permission', 'type', 'size'].includes(e.errorType));
  const retryableErrors = errors.filter(e => canRetry(e));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Alert */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <span>
              <strong>{errors.length} erro{errors.length !== 1 ? 's' : ''} de upload encontrado{errors.length !== 1 ? 's' : ''}</strong>
              {criticalErrors.length > 0 && (
                <span className="ml-2">
                  ({criticalErrors.length} crítico{criticalErrors.length !== 1 ? 's' : ''})
                </span>
              )}
            </span>
            <div className="flex gap-2">
              {retryableErrors.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => retryableErrors.forEach(e => onRetry(e.id))}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Tentar Novamente ({retryableErrors.length})
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onDismissAll}
                className="text-red-700 hover:bg-red-100"
              >
                <X className="h-3 w-3 mr-1" />
                Dispensar Todos
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Individual Error Cards */}
      <div className="space-y-3">
        {errors.map((error) => (
          <Card key={error.id} className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    {getErrorIcon(error.errorType)}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-900">
                      {error.filename}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getErrorColor(error.errorType)}>
                        {getErrorTitle(error.errorType)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(error.fileSize)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {error.timestamp.toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {canRetry(error) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRetry(error.id)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Tentar Novamente
                      {error.retryCount > 0 && (
                        <span className="ml-1">({error.retryCount}/{error.maxRetries})</span>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleExpanded(error.id)}
                    className="text-gray-600 hover:bg-gray-100"
                  >
                    {expandedErrors.has(error.id) ? 'Menos' : 'Detalhes'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDismiss(error.id)}
                    className="text-gray-600 hover:bg-gray-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {expandedErrors.has(error.id) && (
              <CardContent className="pt-0">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Mensagem de Erro:</h4>
                    <p className="text-sm text-gray-700 font-mono bg-white p-2 rounded border">
                      {error.errorMessage}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Solução Sugerida:</h4>
                    <p className="text-sm text-gray-700">
                      {getErrorSolution(error.errorType)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      Tentativas: {error.retryCount}/{error.maxRetries}
                    </div>
                    {onReportIssue && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReportIssue(error)}
                        className="text-xs"
                      >
                        Reportar Problema
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Help Section */}
      {criticalErrors.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Dicas para Evitar Erros de Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-700 space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li>Tamanho máximo por arquivo: 50MB</li>
              <li>Formatos aceitos: PDF, DOC, DOCX, JPG, PNG, TXT</li>
              <li>Evite caracteres especiais nos nomes dos arquivos</li>
              <li>Verifique se você tem permissão para o cliente/caso selecionado</li>
              <li>Mantenha uma conexão estável de internet durante o upload</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentUploadErrorHandler;