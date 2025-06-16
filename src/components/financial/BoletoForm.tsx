// 📄 Boleto Generation Form Component
// D'Avila Reis Legal Practice Management System
// Complete boleto generation and management interface

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
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  DollarSign,
  Building,
  Calendar,
  BarChart3,
  Copy,
  RefreshCw,
  User,
  MapPin
} from 'lucide-react';

// Import Boleto Service
import { boletoService, type BoletoResponse, type BoletoPaymentStatus } from '@/services/boletoService';

// Boleto Service Types
interface BoletoRequest {
  sacado: {
    nome: string;
    cpfCnpj: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    };
  };
  valor: string;
  vencimento: string;
  numeroDocumento: string;
  nossoNumero?: string;
  instrucoes: string[];
  demonstrativo: string[];
  aceite: 'S' | 'N';
  especie: 'DM' | 'RC' | 'NP' | 'NS' | 'ME' | 'ND' | 'DS' | 'FS';
  juros?: {
    tipo: 1 | 2 | 3;
    valor: string;
    data?: string;
  };
  multa?: {
    tipo: 1 | 2 | 3;
    valor: string;
    data?: string;
  };
  desconto?: {
    tipo: 1 | 2 | 3;
    valor: string;
    data: string;
  };
}

interface BoletoResponse {
  nossoNumero: string;
  codigoBarras: string;
  linhaDigitavel: string;
  dataVencimento: string;
  valor: string;
  url: string;
  status: 'REGISTRADO' | 'LIQUIDADO' | 'BAIXADO';
}

interface Props {
  clientId?: string;
  caseId?: string;
  invoiceId?: string;
  onBoletoGenerated?: (boleto: BoletoResponse) => void;
  onBoletoPaymentConfirmed?: (nossoNumero: string) => void;
}

export const BoletoForm: React.FC<Props> = ({
  clientId,
  caseId,
  invoiceId,
  onBoletoGenerated,
  onBoletoPaymentConfirmed
}) => {
  // Form State
  const [formData, setFormData] = useState({
    // Payer Information
    payerName: '',
    payerDocument: '',
    documentType: 'cpf' as 'cpf' | 'cnpj',
    
    // Address
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    zipCode: '',
    
    // Boleto Details
    amount: '',
    dueDate: '',
    documentNumber: '',
    instructions: '',
    demonstration: '',
    accept: 'S' as 'S' | 'N',
    species: 'DM' as 'DM' | 'RC' | 'NP' | 'NS' | 'ME' | 'ND' | 'DS' | 'FS',
    
    // Interest and Fees
    enableInterest: false,
    interestType: 1 as 1 | 2 | 3,
    interestValue: '',
    interestDate: '',
    
    enableFine: false,
    fineType: 1 as 1 | 2 | 3,
    fineValue: '',
    fineDate: '',
    
    enableDiscount: false,
    discountType: 1 as 1 | 2 | 3,
    discountValue: '',
    discountDate: ''
  });

  // Boleto State
  const [boleto, setBoleto] = useState<BoletoResponse | null>(null);
  const [boletoStatus, setBoletoStatus] = useState<BoletoPaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'generating' | 'generated' | 'paid' | 'expired'>('idle');

  // Brazilian states
  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Document species options
  const speciesOptions = [
    { value: 'DM', label: 'Duplicata Mercantil' },
    { value: 'RC', label: 'Recibo' },
    { value: 'NP', label: 'Nota Promissória' },
    { value: 'NS', label: 'Nota de Serviço' },
    { value: 'ME', label: 'Mensalidade Escolar' },
    { value: 'ND', label: 'Nota de Débito' },
    { value: 'DS', label: 'Duplicata de Serviço' },
    { value: 'FS', label: 'Fatura de Serviço' }
  ];

  // Initialize due date to 30 days from now
  useEffect(() => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    setFormData(prev => ({
      ...prev,
      dueDate: defaultDueDate.toISOString().split('T')[0],
      documentNumber: generateDocumentNumber()
    }));
  }, []);

  const generateDocumentNumber = (): string => {
    return 'DOC' + Date.now().toString();
  };

  const handleGenerateBoleto = async () => {
    if (!formData.amount || !formData.payerName || !formData.dueDate || !clientId) {
      setError('Valor, nome do pagador, data de vencimento e cliente são obrigatórios');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('generating');

    try {
      const boletoResponse = await boletoService.generateBoleto({
        clientId,
        caseId,
        invoiceId,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        documentNumber: formData.documentNumber,
        payerName: formData.payerName,
        payerDocument: formData.payerDocument,
        payerAddress: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        accept: formData.accept,
        species: formData.species,
        instructions: formData.instructions.split('\n').filter(line => line.trim()),
        demonstration: formData.demonstration.split('\n').filter(line => line.trim()),
        ...(formData.enableInterest && {
          interestConfig: {
            type: formData.interestType,
            value: formData.interestValue,
            date: formData.interestDate
          }
        }),
        ...(formData.enableFine && {
          fineConfig: {
            type: formData.fineType,
            value: formData.fineValue,
            date: formData.fineDate
          }
        }),
        ...(formData.enableDiscount && {
          discountConfig: {
            type: formData.discountType,
            value: formData.discountValue,
            date: formData.discountDate
          }
        })
      });

      setBoleto(boletoResponse);
      setStatus('generated');
      
      if (onBoletoGenerated) {
        onBoletoGenerated(boletoResponse);
      }

      // Start polling for payment status
      startPaymentPolling(boletoResponse.id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar boleto');
      setStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const startPaymentPolling = (boletoId: string) => {
    // Poll for payment status every 30 seconds
    const interval = setInterval(async () => {
      try {
        const currentStatus = await boletoService.getBoletoStatus(boletoId);
        if (currentStatus) {
          setBoletoStatus(currentStatus);
          
          if (currentStatus.status === 'paid') {
            setStatus('paid');
            if (onBoletoPaymentConfirmed) {
              onBoletoPaymentConfirmed(currentStatus.nossoNumero);
            }
            clearInterval(interval);
          } else if (currentStatus.status === 'expired' || currentStatus.status === 'cancelled') {
            setStatus('expired');
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error checking boleto status:', error);
      }
    }, 30000);

    // Clear interval after 30 days
    setTimeout(() => {
      clearInterval(interval);
      if (status === 'generated') {
        setStatus('expired');
      }
    }, 30 * 24 * 60 * 60 * 1000);
  };

  // Add payment simulation for testing
  const simulatePayment = async () => {
    if (boleto) {
      try {
        const success = await boletoService.simulatePayment(boleto.id, boleto.amount);
        if (success) {
          setStatus('paid');
          if (onBoletoPaymentConfirmed) {
            onBoletoPaymentConfirmed(boleto.nossoNumero);
          }
        }
      } catch (error) {
        console.error('Error simulating payment:', error);
      }
    }
  };

  const copyDigitableLine = () => {
    if (boleto?.digitableLine) {
      navigator.clipboard.writeText(boleto.digitableLine);
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
      case 'generating':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Gerando</Badge>;
      case 'generated':
        return <Badge variant="default"><Clock className="w-3 h-3 mr-1" />Aguardando</Badge>;
      case 'paid':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Vencido</Badge>;
      default:
        return null;
    }
  };

  if (boleto && status !== 'idle') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Boleto Bancário
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Valor</Label>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(boleto.amount.toString())}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Vencimento</Label>
              <p className="text-lg font-semibold">
                {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <p className="text-lg font-semibold">
                {status === 'generated' ? 'Aguardando Pagamento' : 
                 status === 'paid' ? 'Pagamento Confirmado' : 
                 status === 'expired' ? 'Boleto Vencido' : 'Processando...'}
              </p>
            </div>
          </div>

          {/* Barcode and Digitable Line */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Código de Barras</Label>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-center h-12 bg-white border-2 border-dashed border-gray-300 rounded">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                  <span className="ml-2 font-mono text-xs text-gray-500">{boleto.barcode}</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Linha Digitável</Label>
              <div className="flex gap-2">
                <Input
                  value={boleto.digitableLine}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyDigitableLine}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Boleto Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nosso Número:</span>
              <span className="font-mono">{boleto.nossoNumero}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Número do Documento:</span>
              <span className="font-mono">{boleto.documentNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Espécie:</span>
              <span>{speciesOptions.find(s => s.value === formData.species)?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Aceite:</span>
              <span>{formData.accept === 'S' ? 'Sim' : 'Não'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setBoleto(null);
                setBoletoStatus(null);
                setStatus('idle');
                setFormData(prev => ({ 
                  ...prev, 
                  amount: '', 
                  payerName: '', 
                  payerDocument: '',
                  street: '',
                  number: '',
                  city: '',
                  zipCode: '',
                  documentNumber: generateDocumentNumber()
                }));
              }}
              className="flex-1"
            >
              Novo Boleto
            </Button>
            {status === 'generated' && (
              <Button 
                variant="outline" 
                onClick={simulatePayment}
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Simular Pagamento
              </Button>
            )}
            <Button 
              variant="default"
              onClick={() => window.open(boleto.pdfUrl, '_blank')}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>

          {status === 'paid' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Pagamento confirmado! O valor será creditado em até 1 dia útil.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Gerar Boleto Bancário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Boleto Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Dados do Boleto
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">Número do Documento</Label>
              <Input
                id="documentNumber"
                placeholder="Número do documento"
                value={formData.documentNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Espécie do Documento</Label>
              <Select 
                value={formData.species} 
                onValueChange={(value: typeof formData.species) => setFormData(prev => ({ ...prev, species: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {speciesOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aceite</Label>
              <Select 
                value={formData.accept} 
                onValueChange={(value: 'S' | 'N') => setFormData(prev => ({ ...prev, accept: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">Sim</SelectItem>
                  <SelectItem value="N">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Payer Information */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <User className="w-4 h-4 mr-2" />
            Dados do Pagador
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

        {/* Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Endereço do Pagador
          </h3>
          
          <div className="grid grid-cols-1 md:grid-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Logradouro</Label>
              <Input
                id="street"
                placeholder="Rua, Avenida..."
                value={formData.street}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                placeholder="123"
                value={formData.number}
                onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                placeholder="Apto, Sala..."
                value={formData.complement}
                onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                placeholder="Nome do bairro"
                value={formData.neighborhood}
                onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Nome da cidade"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select 
                value={formData.state} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brazilianStates.map(state => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                placeholder="00000-000"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Instructions and Demonstration */}
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Instruções</Label>
            <Textarea
              id="instructions"
              placeholder="Instruções para o banco (uma por linha)..."
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="demonstration">Demonstrativo</Label>
            <Textarea
              id="demonstration"
              placeholder="Demonstrativo/Descrição dos serviços (uma por linha)..."
              value={formData.demonstration}
              onChange={(e) => setFormData(prev => ({ ...prev, demonstration: e.target.value }))}
              rows={4}
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateBoleto}
          disabled={isLoading || !formData.amount || !formData.payerName || !formData.dueDate}
          className="w-full h-12"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Gerando Boleto...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Gerar Boleto Bancário
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BoletoForm;