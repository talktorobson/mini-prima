// 💳 Unified Payment Interface Component
// D'Avila Reis Legal Practice Management System
// Complete payment solution with PIX and Boleto options

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  QrCode, 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Info,
  Zap,
  Calendar,
  Building
} from 'lucide-react';

import PixPaymentForm from './PixPaymentForm';
import BoletoForm from './BoletoForm';

interface PaymentOption {
  id: 'pix' | 'boleto';
  name: string;
  description: string;
  icon: React.ReactNode;
  processingTime: string;
  available: boolean;
  recommended?: boolean;
}

interface Props {
  clientId?: string;
  caseId?: string;
  invoiceId?: string;
  amount?: string;
  description?: string;
  payerName?: string;
  payerDocument?: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentCreated?: (paymentData: any) => void;
}

export const PaymentInterface: React.FC<Props> = ({
  clientId,
  caseId,
  invoiceId,
  amount,
  description,
  payerName,
  payerDocument,
  onPaymentSuccess,
  onPaymentCreated
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'boleto'>('pix');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'created' | 'paid'>('idle');

  const paymentOptions: PaymentOption[] = [
    {
      id: 'pix',
      name: 'PIX',
      description: 'Pagamento instantâneo disponível 24h',
      icon: <Zap className="w-5 h-5" />,
      processingTime: 'Instantâneo',
      available: true,
      recommended: true
    },
    {
      id: 'boleto',
      name: 'Boleto Bancário',
      description: 'Pagamento tradicional com vencimento',
      icon: <FileText className="w-5 h-5" />,
      processingTime: 'Até 3 dias úteis',
      available: true
    }
  ];

  const handlePaymentCreated = (paymentData: any) => {
    setPaymentStatus('created');
    if (onPaymentCreated) {
      onPaymentCreated(paymentData);
    }
  };

  const handlePaymentCompleted = (paymentData: any) => {
    setPaymentStatus('paid');
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentData);
    }
  };

  const formatCurrency = (value: string | undefined) => {
    if (!value) return 'R$ 0,00';
    const num = parseFloat(value);
    return isNaN(num) ? 'R$ 0,00' : num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <CreditCard className="w-6 h-6 mr-2" />
              Interface de Pagamento
            </CardTitle>
            {paymentStatus === 'created' && (
              <Badge variant="default">
                <Clock className="w-3 h-3 mr-1" />
                Aguardando Pagamento
              </Badge>
            )}
            {paymentStatus === 'paid' && (
              <Badge variant="success">
                <CheckCircle className="w-3 h-3 mr-1" />
                Pagamento Confirmado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Payment Summary */}
          {amount && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Valor Total</div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(amount)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Cliente</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {payerName || 'Cliente'}
                  </div>
                  {payerDocument && (
                    <div className="text-sm text-gray-500">{payerDocument}</div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Descrição</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {description || 'Serviços Jurídicos'}
                  </div>
                  {caseId && (
                    <div className="text-sm text-gray-500">Caso: {caseId}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {paymentOptions.map((option) => (
              <div
                key={option.id}
                className={`
                  relative border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${selectedMethod === option.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                  ${!option.available ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => option.available && setSelectedMethod(option.id)}
              >
                {option.recommended && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-2 -right-2 bg-green-600"
                  >
                    Recomendado
                  </Badge>
                )}
                
                <div className="flex items-start space-x-3">
                  <div className={`
                    p-2 rounded-lg
                    ${selectedMethod === option.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {option.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{option.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{option.description}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {option.processingTime}
                    </div>
                  </div>
                  
                  <div className={`
                    w-4 h-4 rounded-full border-2 
                    ${selectedMethod === option.id 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedMethod === option.id && (
                      <div className="w-full h-full rounded-full bg-white border-2 border-blue-500"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Information Alert */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {selectedMethod === 'pix' 
                ? 'PIX é o método mais rápido - o pagamento é confirmado instantaneamente e está disponível 24 horas por dia.' 
                : 'Boleto bancário permite pagamento em qualquer banco, lotérica ou internet banking até a data de vencimento.'
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Payment Forms */}
      <div className="space-y-6">
        {selectedMethod === 'pix' && (
          <PixPaymentForm
            clientId={clientId}
            caseId={caseId}
            invoiceId={invoiceId}
            onPaymentCreated={handlePaymentCreated}
            onPaymentCompleted={handlePaymentCompleted}
          />
        )}

        {selectedMethod === 'boleto' && (
          <BoletoForm
            clientId={clientId}
            caseId={caseId}
            invoiceId={invoiceId}
            onBoletoGenerated={handlePaymentCreated}
            onBoletoPaymentConfirmed={handlePaymentCompleted}
          />
        )}
      </div>

      {/* Additional Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Building className="w-4 h-4 mr-2" />
                D'Avila Reis Advogados
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>CNPJ: 00.000.000/0001-00</p>
                <p>Fone: (11) 99999-9999</p>
                <p>contato@davilareisadvogados.com.br</p>
                <p>São Paulo - SP</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Segurança</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>✅ Transações protegidas por criptografia</p>
                <p>✅ Integração com Santander Brasil</p>
                <p>✅ Certificados ICP-Brasil</p>
                <p>✅ Conformidade LGPD</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {paymentStatus === 'paid' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Pagamento confirmado!</strong> Obrigado por utilizar nossos serviços. 
            Você receberá um e-mail de confirmação em breve.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PaymentInterface;