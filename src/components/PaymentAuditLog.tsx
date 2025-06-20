import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Eye, 
  Download, 
  Filter, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface PaymentAuditEntry {
  id: string;
  payment_intent_id?: string;
  amount?: number;
  payment_method: string;
  status: 'succeeded' | 'failed' | 'pending';
  client_data?: any;
  error_message?: string;
  transaction_id?: string;
  timestamp: string;
}

interface PaymentAuditLogProps {
  showSensitiveData?: boolean;
}

export default function PaymentAuditLog({ showSensitiveData = false }: PaymentAuditLogProps) {
  const [auditEntries, setAuditEntries] = useState<PaymentAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'succeeded' | 'failed' | 'pending'>('all');

  useEffect(() => {
    loadAuditLog();
  }, []);

  const loadAuditLog = () => {
    setLoading(true);
    try {
      const auditLog = JSON.parse(localStorage.getItem('payment_audit_log') || '[]');
      setAuditEntries(auditLog.reverse()); // Show most recent first
    } catch (error) {
      console.error('Failed to load audit log:', error);
      setAuditEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = auditEntries.filter(entry => {
    if (filter === 'all') return true;
    return entry.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      succeeded: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const exportAuditLog = () => {
    const dataStr = JSON.stringify(filteredEntries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-audit-log-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAuditLog = () => {
    if (confirm('Tem certeza que deseja limpar o log de auditoria? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('payment_audit_log');
      setAuditEntries([]);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p>Carregando log de auditoria...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Log de Auditoria de Pagamentos
          </CardTitle>
          <CardDescription>
            Registro de segurança de todas as transações de pagamento processadas no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex gap-1">
              {(['all', 'succeeded', 'failed', 'pending'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status)}
                >
                  {status === 'all' ? 'Todos' : status.toUpperCase()}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={loadAuditLog}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={exportAuditLog}>
                <Download className="h-3 w-3 mr-1" />
                Exportar
              </Button>
              <Button variant="destructive" size="sm" onClick={clearAuditLog}>
                Limpar Log
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          {showSensitiveData && (
            <Alert className="mb-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Aviso de Segurança:</strong> Dados sensíveis estão sendo exibidos. 
                Certifique-se de que apenas pessoal autorizado tenha acesso a estas informações.
              </AlertDescription>
            </Alert>
          )}

          {/* Audit Entries */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma entrada de auditoria encontrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(entry.status)}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {entry.payment_method.toUpperCase()}
                            </span>
                            {getStatusBadge(entry.status)}
                            <span className="text-sm font-semibold">
                              {formatCurrency(entry.amount)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {formatTimestamp(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right text-xs text-gray-500">
                        {entry.payment_intent_id && (
                          <div>ID: {entry.payment_intent_id.slice(-8)}</div>
                        )}
                        {entry.transaction_id && (
                          <div>TXN: {entry.transaction_id.slice(-8)}</div>
                        )}
                      </div>
                    </div>

                    {/* Error Message */}
                    {entry.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                        <strong>Erro:</strong> {entry.error_message}
                      </div>
                    )}

                    {/* Sensitive Data (only if authorized) */}
                    {showSensitiveData && entry.client_data && (
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                        <strong>Dados do Cliente:</strong>
                        <ul className="mt-1 space-y-1">
                          <li><strong>Nome:</strong> {entry.client_data.name || 'N/A'}</li>
                          <li><strong>Email:</strong> {entry.client_data.email || 'N/A'}</li>
                          <li><strong>CPF/CNPJ:</strong> {entry.client_data.cpf_cnpj ? '***' + entry.client_data.cpf_cnpj.slice(-4) : 'N/A'}</li>
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Resumo do Log</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-600">Total de Entradas:</span>
                <div className="font-semibold">{auditEntries.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Sucessos:</span>
                <div className="font-semibold text-green-600">
                  {auditEntries.filter(e => e.status === 'succeeded').length}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Falhas:</span>
                <div className="font-semibold text-red-600">
                  {auditEntries.filter(e => e.status === 'failed').length}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Pendentes:</span>
                <div className="font-semibold text-yellow-600">
                  {auditEntries.filter(e => e.status === 'pending').length}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}