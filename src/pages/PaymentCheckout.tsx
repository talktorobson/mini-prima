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

  const simulatePaymentSuccess = () => {
    setPaymentStatus('succeeded');
    setTimeout(() => {
      onSuccess?.({
        payment_intent_id: paymentIntent?.id,
        amount: paymentIntent?.amount,
        payment_method: selectedPaymentMethod,
      });
    }, 1500);
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
                      
                      <Button onClick={simulatePaymentSuccess} className="w-full">
                        Simular Pagamento PIX
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
                      
                      <Button onClick={simulatePaymentSuccess} className="w-full">
                        Simular Pagamento Boleto
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
                    
                    <Button onClick={simulatePaymentSuccess} className="w-full">
                      Simular Pagamento Cartão
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