import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Loader2, 
  Check, 
  X,
  QrCode,
  FileText,
  Copy,
  ExternalLink,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stripeService, SubscriptionPlan, PaymentIntent } from '@/services/stripeService';
import { securityService } from '@/services/securityService';

interface PaymentCheckoutProps {
  productId?: string;
  amount?: number;
  description?: string;
  paymentType: 'subscription' | 'one_time' | 'case_payment';
  caseId?: string;
  onSuccess?: (paymentData: any) => void;
  onCancel?: () => void;
}

export default function PaymentCheckout({
  productId,
  amount,
  description = 'Pagamento D\'Avila Reis Advogados',
  paymentType,
  caseId,
  onSuccess,
  onCancel
}: PaymentCheckoutProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [product, setProduct] = useState<SubscriptionPlan | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('pix');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'succeeded' | 'failed'>('pending');

  // Customer information form
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf_cnpj: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
    },
  });

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const [subscriptions, services] = await Promise.all([
        stripeService.getSubscriptionPlans(),
        stripeService.getOneTimeServices(),
      ]);
      
      const allProducts = [...subscriptions, ...services];
      const foundProduct = allProducts.find(p => p.id === productId);
      
      if (foundProduct) {
        setProduct(foundProduct);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar informações do produto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async () => {
    try {
      setProcessing(true);
      
      // Security validation before creating payment intent
      const securityCheck = await securityService.validatePaymentAttempt({
        email: customerForm.email,
        cpf_cnpj: customerForm.cpf_cnpj,
        amount: amount || (product ? product.price_amount : 0),
        payment_method: selectedPaymentMethod,
      });

      if (!securityCheck.allowed) {
        toast({
          title: 'Erro de Segurança',
          description: securityCheck.reason,
          variant: 'destructive',
        });
        setProcessing(false);
        return;
      }

      const paymentData = {
        amount: amount || (product ? product.price_amount : 0),
        currency: 'BRL',
        client_id: 'mock-client-id', // In real implementation, get from auth context
        description: description,
        payment_type: paymentType,
        case_id: caseId,
        payment_methods: [selectedPaymentMethod],
      };

      const intent = await stripeService.createPaymentIntent(paymentData);
      setPaymentIntent(intent);
      setPaymentStatus('processing');
      
      toast({
        title: 'Sucesso',
        description: 'Pagamento criado com sucesso',
      });
      
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar pagamento',
        variant: 'destructive',
      });
      setPaymentStatus('failed');
      
      await securityService.logSecurityEvent({
        event_type: 'payment_failure',
        event_data: { error: error instanceof Error ? error.message : 'Unknown error' },
        risk_level: 'medium',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyPixCode = () => {
    if (paymentIntent?.pix_code) {
      navigator.clipboard.writeText(paymentIntent.pix_code);
      toast({
        title: 'Copiado',
        description: 'Código PIX copiado para a área de transferência',
      });
    }
  };

  const simulatePaymentSuccess = async () => {
    setPaymentStatus('processing');
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would verify payment with Stripe
      const paymentResult = await confirmPayment();
      
      setPaymentStatus('succeeded');
      
      // Security audit logging
      await logPaymentTransaction({
        payment_intent_id: paymentIntent?.id,
        amount: paymentIntent?.amount,
        payment_method: selectedPaymentMethod,
        status: 'succeeded',
        client_data: customerForm,
      });
      
      setTimeout(() => {
        onSuccess?.({
          payment_intent_id: paymentIntent?.id,
          amount: paymentIntent?.amount,
          payment_method: selectedPaymentMethod,
          transaction_id: paymentResult.transaction_id,
        });
      }, 1500);
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentStatus('failed');
      
      // Log failed payment attempt
      await logPaymentTransaction({
        payment_intent_id: paymentIntent?.id,
        amount: paymentIntent?.amount,
        payment_method: selectedPaymentMethod,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      
      toast({
        title: 'Erro no pagamento',
        description: 'Ocorreu um erro ao processar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const confirmPayment = async (): Promise<{ transaction_id: string }> => {
    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    // Validate customer data
    if (!customerForm.name || !customerForm.email || !customerForm.cpf_cnpj) {
      throw new Error('Dados do cliente incompletos');
    }

    // Validate payment method specific requirements
    if (selectedPaymentMethod === 'card') {
      // In real implementation, this would use Stripe Elements
      // For now, we'll simulate card validation
      await validateCardPayment();
    }

    // Security validation
    await validatePaymentSecurity();

    // Update payment status in database
    await stripeService.processWebhookEvent({
      id: `evt_${Date.now()}`,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntent.id,
          charges: {
            data: [{
              id: `ch_${Date.now()}`,
              receipt_url: `https://pay.stripe.com/receipts/${paymentIntent.id}`,
            }]
          }
        }
      },
      api_version: '2023-10-16',
    });

    return {
      transaction_id: `txn_${Date.now()}`
    };
  };

  const validateCardPayment = async (): Promise<void> => {
    // Simulate card validation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Random validation success/failure for demo
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Cartão rejeitado'));
        }
      }, 1000);
    });
  };

  const validatePaymentSecurity = async (): Promise<void> => {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      customerForm.email.includes('test@test.com'),
      customerForm.name.toLowerCase().includes('test'),
      customerForm.cpf_cnpj === '00000000000',
    ];

    if (suspiciousPatterns.some(pattern => pattern)) {
      console.warn('Suspicious payment pattern detected');
      // In production, this might trigger additional verification steps
    }

    // Rate limiting check (simplified)
    const recentAttempts = localStorage.getItem(`payment_attempts_${customerForm.email}`);
    if (recentAttempts && parseInt(recentAttempts) > 5) {
      throw new Error('Muitas tentativas de pagamento. Tente novamente mais tarde.');
    }

    // Update attempt counter
    const attempts = recentAttempts ? parseInt(recentAttempts) + 1 : 1;
    localStorage.setItem(`payment_attempts_${customerForm.email}`, attempts.toString());
    
    // Clear attempts after 1 hour
    setTimeout(() => {
      localStorage.removeItem(`payment_attempts_${customerForm.email}`);
    }, 3600000);
  };

  const logPaymentTransaction = async (transactionData: {
    payment_intent_id?: string;
    amount?: number;
    payment_method: string;
    status: 'succeeded' | 'failed' | 'pending';
    client_data?: any;
    error_message?: string;
    transaction_id?: string;
  }) => {
    try {
      // In a real implementation, this would log to a secure audit table
      console.log('Payment transaction logged:', {
        ...transactionData,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip_address: 'masked', // Would be captured server-side
      });

      // Store in local audit log for demo purposes
      const auditLog = JSON.parse(localStorage.getItem('payment_audit_log') || '[]');
      auditLog.push({
        ...transactionData,
        timestamp: new Date().toISOString(),
        id: `audit_${Date.now()}`,
      });
      
      // Keep only last 100 entries
      if (auditLog.length > 100) {
        auditLog.splice(0, auditLog.length - 100);
      }
      
      localStorage.setItem('payment_audit_log', JSON.stringify(auditLog));
    } catch (error) {
      console.error('Failed to log payment transaction:', error);
    }
  };

  const paymentMethods = [
    { value: 'pix', label: 'PIX', icon: QrCode, description: 'Pagamento instantâneo' },
    { value: 'boleto', label: 'Boleto Bancário', icon: FileText, description: 'Vencimento em 3 dias' },
    { value: 'card', label: 'Cartão de Crédito', icon: CreditCard, description: 'Parcelamento disponível' },
  ];

  const brazilianStates = [
    { value: 'SP', label: 'São Paulo' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'PR', label: 'Paraná' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'BA', label: 'Bahia' },
    { value: 'GO', label: 'Goiás' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'DF', label: 'Distrito Federal' },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando...</span>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'processing') {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Processando Pagamento...</h3>
            <p className="text-gray-600 mb-4">
              Aguarde enquanto confirmamos seu pagamento.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p><strong>Método:</strong> {stripeService.formatPaymentMethod(selectedPaymentMethod)}</p>
              <p><strong>Valor:</strong> {stripeService.formatCurrency(paymentIntent?.amount || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'succeeded') {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Pagamento Confirmado!</h3>
            <p className="text-gray-600 mb-4">
              Seu pagamento foi processado com sucesso.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p><strong>Valor:</strong> {stripeService.formatCurrency(paymentIntent?.amount || 0)}</p>
              <p><strong>Método:</strong> {stripeService.formatPaymentMethod(selectedPaymentMethod)}</p>
              <p><strong>ID:</strong> {paymentIntent?.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <X className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Pagamento Falhou</h3>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro ao processar seu pagamento. Tente novamente.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  setPaymentStatus('pending');
                  setPaymentIntent(null);
                }}
                className="w-full"
              >
                Tentar Novamente
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel} className="w-full">
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-gray-600">
            {product ? `${product.name} - ${stripeService.formatCurrency(product.price_amount)}` : 
             amount ? stripeService.formatCurrency(amount) : 'Pagamento'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-600">Pagamento Seguro</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Form */}
        <div className="space-y-6">
          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Método de Pagamento</CardTitle>
              <CardDescription>Escolha como deseja pagar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {paymentMethods.map((method) => (
                  <div key={method.value}>
                    <label className="cursor-pointer">
                      <div className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                        selectedPaymentMethod === method.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="payment_method"
                            value={method.value}
                            checked={selectedPaymentMethod === method.value}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="sr-only"
                          />
                          <method.icon className="h-5 w-5" />
                          <div className="flex-1">
                            <div className="font-medium">{method.label}</div>
                            <div className="text-sm text-gray-500">{method.description}</div>
                          </div>
                          {selectedPaymentMethod === method.value && (
                            <Check className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
              <CardDescription>Dados necessários para emissão da nota fiscal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="João Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="joao@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                  <Input
                    id="cpf_cnpj"
                    value={customerForm.cpf_cnpj}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, cpf_cnpj: e.target.value }))}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Endereço *</Label>
                  <Input
                    id="address_line1"
                    value={customerForm.address.line1}
                    onChange={(e) => setCustomerForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, line1: e.target.value }
                    }))}
                    placeholder="Rua das Flores, 123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={customerForm.address.city}
                    onChange={(e) => setCustomerForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    placeholder="São Paulo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select
                    value={customerForm.address.state}
                    onValueChange={(value) => setCustomerForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, state: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">CEP *</Label>
                  <Input
                    id="postal_code"
                    value={customerForm.address.postal_code}
                    onChange={(e) => setCustomerForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, postal_code: e.target.value }
                    }))}
                    placeholder="01234-567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Details & Actions */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{product?.name || description}</span>
                  <span className="font-medium">
                    {stripeService.formatCurrency(amount || product?.price_amount || 0)}
                  </span>
                </div>
                
                {product?.features && product.features.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Incluso:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {product.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{stripeService.formatCurrency(amount || product?.price_amount || 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Actions */}
          {!paymentIntent ? (
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={createPaymentIntent} 
                  disabled={processing || !customerForm.name || !customerForm.email}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Confirmar Pagamento
                </Button>
                
                {onCancel && (
                  <Button 
                    variant="outline" 
                    onClick={onCancel}
                    className="w-full mt-2"
                  >
                    Cancelar
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Payment Instructions */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedPaymentMethod === 'pix' && <QrCode className="h-5 w-5" />}
                  {selectedPaymentMethod === 'boleto' && <FileText className="h-5 w-5" />}
                  {selectedPaymentMethod === 'card' && <CreditCard className="h-5 w-5" />}
                  {stripeService.formatPaymentMethod(selectedPaymentMethod)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPaymentMethod === 'pix' && (
                  <>
                    <Alert>
                      <AlertDescription>
                        Use o código PIX abaixo para realizar o pagamento no seu banco ou carteira digital.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Código PIX:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-white p-2 rounded border break-all">
                            {paymentIntent.pix_code}
                          </code>
                          <Button size="sm" variant="outline" onClick={copyPixCode}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={simulatePaymentSuccess} 
                        className="w-full"
                        disabled={paymentStatus === 'processing'}
                      >
                        {paymentStatus === 'processing' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          'Confirmar Pagamento PIX'
                        )}
                      </Button>
                    </div>
                  </>
                )}
                
                {selectedPaymentMethod === 'boleto' && (
                  <>
                    <Alert>
                      <AlertDescription>
                        Clique no link abaixo para baixar o boleto. O vencimento é em 3 dias úteis.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(paymentIntent.boleto_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Baixar Boleto
                      </Button>
                      
                      <p className="text-sm text-gray-600">
                        <strong>Vencimento:</strong> {paymentIntent.boleto_due_date}
                      </p>
                      
                      <Button 
                        onClick={simulatePaymentSuccess} 
                        className="w-full"
                        disabled={paymentStatus === 'processing'}
                      >
                        {paymentStatus === 'processing' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          'Confirmar Pagamento Boleto'
                        )}
                      </Button>
                    </div>
                  </>
                )}
                
                {selectedPaymentMethod === 'card' && (
                  <>
                    <Alert>
                      <AlertDescription>
                        Em uma implementação real, aqui seria exibido o formulário seguro do Stripe para cartão de crédito.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      onClick={simulatePaymentSuccess} 
                      className="w-full"
                      disabled={paymentStatus === 'processing'}
                    >
                      {paymentStatus === 'processing' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Confirmar Pagamento Cartão'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Seus dados estão protegidos com criptografia SSL. D'Avila Reis Advogados não armazena informações de cartão.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}