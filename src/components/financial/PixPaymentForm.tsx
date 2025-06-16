// 💰 PIX Payment Form Component
// D'Avila Reis Legal Practice Management System
// Complete PIX payment generation and management interface

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Copy, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  DollarSign,
  FileText,
  Download,
  RefreshCw,
  User,
  Calendar
} from 'lucide-react';

// PIX Service Types
interface PixChargeRequest {
  calendario: {
    expiracao: number;
  };
  devedor?: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
  valor: {
    original: string;
  };
  chave: string;
  solicitacaoPagador?: string;
  infoAdicionais?: Array<{
    nome: string;
    valor: string;
  }>;
}

interface PixChargeResponse {
  txid: string;
  status: 'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP';
  pixCopiaECola: string;
  calendario: {
    criacao: string;
    expiracao: number;
  };
  valor: {
    original: string;
  };
  devedor?: {
    nome: string;
    cpf?: string;
    cnpj?: string;
  };
}

interface Props {
  clientId?: string;
  caseId?: string;
  invoiceId?: string;
  onPaymentCreated?: (charge: PixChargeResponse) => void;
  onPaymentCompleted?: (txid: string) => void;
}

export const PixPaymentForm: React.FC<Props> = ({
  clientId,
  caseId,
  invoiceId,
  onPaymentCreated,
  onPaymentCompleted
}) => {
  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    payerName: '',
    payerDocument: '',
    documentType: 'cpf' as 'cpf' | 'cnpj',
    expirationHours: '24',
    pixKey: process.env.REACT_APP_PIX_KEY || '11999999999'
  });

  // PIX Charge State
  const [pixCharge, setPixCharge] = useState<PixChargeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'active' | 'completed' | 'expired'>('idle');

  // Mock PIX Service (replace with actual Santander integration)
  const createPixCharge = async (request: PixChargeRequest): Promise<PixChargeResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response - replace with actual Santander API call
    const mockResponse: PixChargeResponse = {
      txid: generateTxId(),
      status: 'ATIVA',
      pixCopiaECola: generatePixPayload(request.valor.original),
      calendario: {
        criacao: new Date().toISOString(),
        expiracao: request.calendario.expiracao
      },
      valor: {
        original: request.valor.original
      },
      devedor: request.devedor
    };

    return mockResponse;
  };

  const generateTxId = (): string => {
    return 'PIX' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  };

  const generatePixPayload = (amount: string): string => {
    // Simplified PIX payload generation
    const pixKey = formData.pixKey;
    const amountFormatted = parseFloat(amount).toFixed(2);
    return `00020126330014BR.GOV.BCB.PIX0111${pixKey}520400005303986540${amountFormatted.length}${amountFormatted}5802BR5925D'AVILA REIS ADVOGADOS6009SAO PAULO62070503***6304${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const handleCreateCharge = async () => {
    if (!formData.amount || !formData.payerName) {
      setError('Valor e nome do pagador são obrigatórios');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('creating');

    try {
      const request: PixChargeRequest = {
        calendario: {
          expiracao: parseInt(formData.expirationHours) * 3600
        },
        devedor: {
          nome: formData.payerName,
          ...(formData.documentType === 'cpf' 
            ? { cpf: formData.payerDocument } 
            : { cnpj: formData.payerDocument }
          )
        },
        valor: {
          original: parseFloat(formData.amount).toFixed(2)
        },
        chave: formData.pixKey,
        solicitacaoPagador: formData.description,
        infoAdicionais: [
          { nome: 'Cliente', valor: clientId || 'N/A' },
          { nome: 'Caso', valor: caseId || 'N/A' },
          { nome: 'Fatura', valor: invoiceId || 'N/A' }
        ]
      };

      const charge = await createPixCharge(request);
      setPixCharge(charge);
      setStatus('active');
      
      if (onPaymentCreated) {
        onPaymentCreated(charge);
      }

      // Start polling for payment status
      startStatusPolling(charge.txid);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cobrança PIX');
      setStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const startStatusPolling = (txid: string) => {
    // Poll for payment status every 5 seconds
    const interval = setInterval(async () => {
      try {
        // Mock status check - replace with actual API call
        const random = Math.random();
        if (random > 0.7) { // 30% chance of completion for demo
          setStatus('completed');
          if (onPaymentCompleted) {
            onPaymentCompleted(txid);
          }
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000);

    // Clear interval after expiration time
    setTimeout(() => {
      clearInterval(interval);
      if (status === 'active') {
        setStatus('expired');
      }
    }, parseInt(formData.expirationHours) * 3600 * 1000);
  };

  const copyPixCode = () => {
    if (pixCharge?.pixCopiaECola) {
      navigator.clipboard.writeText(pixCharge.pixCopiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? 'R$ 0,00' : num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'creating':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Criando</Badge>;
      case 'active':
        return <Badge variant="default"><Clock className="w-3 h-3 mr-1" />Aguardando</Badge>;
      case 'completed':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return null;
    }
  };

  if (pixCharge && status !== 'idle') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              Cobrança PIX
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Valor</Label>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(pixCharge.valor.original)}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <p className="text-lg font-semibold">
                {status === 'active' ? 'Aguardando Pagamento' : 
                 status === 'completed' ? 'Pagamento Confirmado' : 
                 status === 'expired' ? 'Cobrança Expirada' : 'Processando...'}
              </p>
            </div>
          </div>

          {/* PIX Code */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Código PIX Copia e Cola</Label>
            <div className="flex gap-2">
              <Textarea
                value={pixCharge.pixCopiaECola}
                readOnly
                className="font-mono text-xs resize-none"
                rows={3}
              />
              <Button
                onClick={copyPixCode}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            {copied && (
              <p className="text-sm text-green-600">Código copiado!</p>
            )}
          </div>

          {/* QR Code Placeholder */}
          <div className="text-center">
            <div className="inline-block p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <QrCode className="w-24 h-24 mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">QR Code</p>
              <p className="text-xs text-gray-400">Escaneie com seu banco</p>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ID da Transação:</span>
              <span className="font-mono">{pixCharge.txid}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Criado em:</span>
              <span>{new Date(pixCharge.calendario.criacao).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Expira em:</span>
              <span>
                {new Date(
                  new Date(pixCharge.calendario.criacao).getTime() + 
                  pixCharge.calendario.expiracao * 1000
                ).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setPixCharge(null);
                setStatus('idle');
                setFormData(prev => ({ ...prev, amount: '', description: '', payerName: '', payerDocument: '' }));
              }}
              className="flex-1"
            >
              Nova Cobrança
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Baixar QR
            </Button>
          </div>

          {status === 'completed' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Pagamento confirmado! O valor será creditado em sua conta em instantes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Criar Cobrança PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            />
            {formData.amount && (
              <p className="text-sm text-gray-600">
                {formatCurrency(formData.amount)}
              </p>
            )}
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label htmlFor="expiration">Validade</Label>
            <Select 
              value={formData.expirationHours} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, expirationHours: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hora</SelectItem>
                <SelectItem value="6">6 horas</SelectItem>
                <SelectItem value="24">24 horas</SelectItem>
                <SelectItem value="72">3 dias</SelectItem>
                <SelectItem value="168">7 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payer Information */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <User className="w-4 h-4 mr-2" />
            Informações do Pagador
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="payerName">Nome do Pagador *</Label>
            <Input
              id="payerName"
              placeholder="Nome completo ou razão social"
              value={formData.payerName}
              onChange={(e) => setFormData(prev => ({ ...prev, payerName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select 
                value={formData.documentType} 
                onValueChange={(value: 'cpf' | 'cnpj') => setFormData(prev => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="payerDocument">
                {formData.documentType === 'cpf' ? 'CPF' : 'CNPJ'}
              </Label>
              <Input
                id="payerDocument"
                placeholder={formData.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                value={formData.payerDocument}
                onChange={(e) => setFormData(prev => ({ ...prev, payerDocument: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            placeholder="Descrição do pagamento..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        {/* PIX Key Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Chave PIX Configurada</h4>
          <p className="text-sm text-blue-700">
            <strong>Chave:</strong> {formData.pixKey}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Os pagamentos serão creditados nesta chave PIX
          </p>
        </div>

        {/* Create Button */}
        <Button 
          onClick={handleCreateCharge}
          disabled={isLoading || !formData.amount || !formData.payerName}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Criando Cobrança...
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4 mr-2" />
              Gerar Cobrança PIX
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PixPaymentForm;