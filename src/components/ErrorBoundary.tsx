import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: this.generateErrorId()
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service (could be Sentry, LogRocket, etc.)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    try {
      // In production, this would send to your error monitoring service
      const errorData = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      console.error('Error logged:', errorData);
      
      // Example: Send to error monitoring service
      // errorMonitoringService.logError(errorData);
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: this.generateErrorId()
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report - Error ID: ${this.state.errorId}`);
    const body = encodeURIComponent(
      `Error ID: ${this.state.errorId}\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `URL: ${window.location.href}\n` +
      `Error: ${this.state.error?.message || 'Unknown error'}\n` +
      `Stack: ${this.state.error?.stack || 'No stack trace'}\n\n` +
      `Please describe what you were doing when this error occurred:`
    );
    
    window.open(`mailto:suporte@miniprimabr.com?subject=${subject}&body=${body}`);
  };

  private getErrorType(error?: Error): 'network' | 'permission' | 'data' | 'unknown' {
    if (!error) return 'unknown';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return 'network';
    }
    
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'permission';
    }
    
    if (message.includes('parse') || message.includes('invalid') || message.includes('malformed')) {
      return 'data';
    }
    
    return 'unknown';
  }

  private getErrorMessage(errorType: 'network' | 'permission' | 'data' | 'unknown'): {
    title: string;
    description: string;
    suggestion: string;
  } {
    switch (errorType) {
      case 'network':
        return {
          title: 'Erro de Conexão',
          description: 'Não foi possível conectar com o servidor.',
          suggestion: 'Verifique sua conexão com a internet e tente novamente.'
        };
      case 'permission':
        return {
          title: 'Erro de Permissão',
          description: 'Você não tem permissão para acessar este recurso.',
          suggestion: 'Faça login novamente ou entre em contato com o administrador.'
        };
      case 'data':
        return {
          title: 'Erro de Dados',
          description: 'Os dados recebidos estão em um formato inválido.',
          suggestion: 'Tente recarregar a página ou entre em contato com o suporte.'
        };
      default:
        return {
          title: 'Erro Inesperado',
          description: 'Ocorreu um erro inesperado na aplicação.',
          suggestion: 'Tente recarregar a página ou entre em contato com o suporte se o problema persistir.'
        };
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.getErrorType(this.state.error);
      const errorMessage = this.getErrorMessage(errorType);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {errorMessage.title}
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                {errorMessage.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Detalhes do Erro</AlertTitle>
                <AlertDescription className="mt-2">
                  <div className="space-y-2">
                    <p><strong>ID do Erro:</strong> {this.state.errorId}</p>
                    <p><strong>Sugestão:</strong> {errorMessage.suggestion}</p>
                    {this.state.error && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium">
                          Informações Técnicas (clique para expandir)
                        </summary>
                        <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                          <p><strong>Erro:</strong> {this.state.error.message}</p>
                          {this.state.error.stack && (
                            <div className="mt-2">
                              <strong>Stack Trace:</strong>
                              <pre className="whitespace-pre-wrap text-xs mt-1">
                                {this.state.error.stack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar Novamente
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Ir para Início
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleReportBug}
                  className="flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Reportar Erro
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>Se o problema persistir, entre em contato conosco:</p>
                <p className="font-medium">suporte@miniprimabr.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simplified error boundary for smaller components
export const SimpleErrorBoundary: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => {
  return (
    <ErrorBoundary 
      fallback={
        fallback || (
          <Alert variant="destructive" className="m-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro no Componente</AlertTitle>
            <AlertDescription>
              Ocorreu um erro neste componente. Tente recarregar a página.
            </AlertDescription>
          </Alert>
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;