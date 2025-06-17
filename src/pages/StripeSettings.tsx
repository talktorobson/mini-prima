import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Save, 
  RefreshCw, 
  Settings, 
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Check,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stripeService, StripeConfig, SubscriptionPlan } from '@/services/stripeService';

export default function StripeSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [oneTimeServices, setOneTimeServices] = useState<SubscriptionPlan[]>([]);

  // Form states
  const [settingsForm, setSettingsForm] = useState({
    stripe_public_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    accept_pix: true,
    accept_boleto: true,
    accept_credit_card: true,
    company_name: '',
    company_tax_id: '',
  });

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SubscriptionPlan | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    product_type: 'subscription' as 'subscription' | 'one_time',
    price_amount: '',
    billing_interval: 'month',
    service_category: '',
    practice_area: '',
    features: [] as string[],
    limits: {} as Record<string, any>,
    tax_rate: '',
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [config, plans, services] = await Promise.all([
        stripeService.getStripeConfig(),
        stripeService.getSubscriptionPlans(),
        stripeService.getOneTimeServices(),
      ]);
      
      setStripeConfig(config);
      setSubscriptionPlans(plans);
      setOneTimeServices(services);
      
      // Populate settings form (in a real app, this would come from a separate endpoint)
      setSettingsForm({
        stripe_public_key: config.publicKey || '',
        stripe_secret_key: '', // Never populate secret keys in forms
        stripe_webhook_secret: '',
        environment: config.environment,
        accept_pix: config.acceptedPaymentMethods.includes('pix'),
        accept_boleto: config.acceptedPaymentMethods.includes('boleto'),
        accept_credit_card: config.acceptedPaymentMethods.includes('card'),
        company_name: '',
        company_tax_id: '',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações do Stripe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStripeSettings = async () => {
    try {
      setSaving(true);
      await stripeService.updateStripeSettings(settingsForm);
      
      toast({
        title: 'Sucesso',
        description: 'Configurações do Stripe salvas com sucesso',
      });
      
      await loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações do Stripe',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      product_type: 'subscription',
      price_amount: '',
      billing_interval: 'month',
      service_category: '',
      practice_area: '',
      features: [],
      limits: {},
      tax_rate: '',
    });
    setNewFeature('');
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const startEditProduct = (product: SubscriptionPlan) => {
    setProductForm({
      name: product.name,
      description: product.description,
      product_type: product.billing_interval === 'one_time' ? 'one_time' : 'subscription',
      price_amount: (product.price_amount / 100).toString(),
      billing_interval: product.billing_interval,
      service_category: '',
      practice_area: '',
      features: product.features,
      limits: product.limits,
      tax_rate: '',
    });
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setProductForm(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.price_amount) {
      toast({
        title: 'Erro',
        description: 'Nome e preço são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      await stripeService.createProduct({
        name: productForm.name,
        description: productForm.description,
        product_type: productForm.product_type,
        price_amount: Math.round(parseFloat(productForm.price_amount) * 100),
        billing_interval: productForm.product_type === 'subscription' ? productForm.billing_interval : undefined,
        service_category: productForm.service_category,
        practice_area: productForm.practice_area,
        features: productForm.features,
        limits: productForm.limits,
        tax_rate: productForm.tax_rate ? parseFloat(productForm.tax_rate) : undefined,
      });

      toast({
        title: 'Sucesso',
        description: editingProduct ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso',
      });

      resetProductForm();
      await loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar produto',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const serviceCategories = [
    { value: 'legal_consulting', label: 'Consultoria Jurídica' },
    { value: 'document_review', label: 'Revisão de Documentos' },
    { value: 'litigation_support', label: 'Suporte Processual' },
    { value: 'contract_analysis', label: 'Análise de Contratos' },
    { value: 'compliance_consulting', label: 'Consultoria em Compliance' },
  ];

  const practiceAreas = [
    { value: 'labor', label: 'Direito Trabalhista' },
    { value: 'civil', label: 'Direito Civil' },
    { value: 'commercial', label: 'Direito Empresarial' },
    { value: 'criminal', label: 'Direito Penal' },
    { value: 'tax', label: 'Direito Tributário' },
    { value: 'administrative', label: 'Direito Administrativo' },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações Stripe</h1>
        </div>
        <div className="flex gap-2">
          {stripeConfig && (
            <Badge variant={stripeConfig.environment === 'production' ? 'default' : 'secondary'}>
              {stripeConfig.environment === 'production' ? 'Produção' : 'Sandbox'}
            </Badge>
          )}
          <Badge variant="outline">Integração de Pagamentos</Badge>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Assinaturas ({subscriptionPlans.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Serviços Avulsos ({oneTimeServices.length})
          </TabsTrigger>
        </TabsList>

        {/* Stripe Configuration */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração da API Stripe</CardTitle>
              <CardDescription>
                Configure as chaves da API e métodos de pagamento aceitos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="environment">Ambiente</Label>
                  <Select
                    value={settingsForm.environment}
                    onValueChange={(value: 'sandbox' | 'production') => 
                      setSettingsForm(prev => ({ ...prev, environment: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Teste)</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe_public_key">Chave Pública Stripe</Label>
                  <Input
                    id="stripe_public_key"
                    value={settingsForm.stripe_public_key}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, stripe_public_key: e.target.value }))}
                    placeholder="pk_test_..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe_secret_key">Chave Secreta Stripe</Label>
                  <Input
                    id="stripe_secret_key"
                    type="password"
                    value={settingsForm.stripe_secret_key}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                    placeholder="sk_test_..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe_webhook_secret">Webhook Secret</Label>
                  <Input
                    id="stripe_webhook_secret"
                    type="password"
                    value={settingsForm.stripe_webhook_secret}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, stripe_webhook_secret: e.target.value }))}
                    placeholder="whsec_..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <Input
                    id="company_name"
                    value={settingsForm.company_name}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="D'Avila Reis Advogados"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_tax_id">CNPJ</Label>
                  <Input
                    id="company_tax_id"
                    value={settingsForm.company_tax_id}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, company_tax_id: e.target.value }))}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Métodos de Pagamento Aceitos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="accept_credit_card"
                      checked={settingsForm.accept_credit_card}
                      onCheckedChange={(checked) => 
                        setSettingsForm(prev => ({ ...prev, accept_credit_card: checked }))
                      }
                    />
                    <Label htmlFor="accept_credit_card">Cartão de Crédito</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="accept_pix"
                      checked={settingsForm.accept_pix}
                      onCheckedChange={(checked) => 
                        setSettingsForm(prev => ({ ...prev, accept_pix: checked }))
                      }
                    />
                    <Label htmlFor="accept_pix">PIX</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="accept_boleto"
                      checked={settingsForm.accept_boleto}
                      onCheckedChange={(checked) => 
                        setSettingsForm(prev => ({ ...prev, accept_boleto: checked }))
                      }
                    />
                    <Label htmlFor="accept_boleto">Boleto Bancário</Label>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Como configurar o Stripe:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Acesse o <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a></li>
                  <li>Vá em "Developers" → "API Keys"</li>
                  <li>Copie a chave pública e secreta</li>
                  <li>Configure webhooks em "Developers" → "Webhooks"</li>
                  <li>Adicione o endpoint: <code className="bg-blue-100 px-1 rounded">{window.location.origin}/api/stripe/webhook</code></li>
                  <li>Copie o webhook secret</li>
                </ol>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={saveStripeSettings} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Plans */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Planos de Assinatura</h3>
              <p className="text-gray-600">Gerencie os planos de assinatura mensal e anual</p>
            </div>
            <Button 
              onClick={() => {
                setProductForm(prev => ({ ...prev, product_type: 'subscription' }));
                setShowProductForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </div>

          {subscriptionPlans.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhum plano de assinatura configurado
                </h3>
                <p className="text-gray-500 mb-4">
                  Crie planos de assinatura para oferecer serviços jurídicos recorrentes
                </p>
                <Button onClick={() => setShowProductForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Plano
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card key={plan.id} className={`${plan.is_featured ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.is_featured && (
                          <Badge className="mt-1">Destacado</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditProduct(plan)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-2xl font-bold">
                        {stripeService.formatCurrency(plan.price_amount, plan.currency)}
                        <span className="text-sm font-normal text-gray-600">
                          /{plan.billing_interval === 'month' ? 'mês' : 'ano'}
                        </span>
                      </div>

                      {plan.features.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Funcionalidades:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <Check className="h-3 w-3 text-green-600" />
                                {feature}
                              </li>
                            ))}
                            {plan.features.length > 3 && (
                              <li className="text-xs text-gray-500">
                                +{plan.features.length - 3} funcionalidades
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* One-time Services */}
        <TabsContent value="services" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Serviços Avulsos</h3>
              <p className="text-gray-600">Gerencie serviços de pagamento único</p>
            </div>
            <Button 
              onClick={() => {
                setProductForm(prev => ({ ...prev, product_type: 'one_time' }));
                setShowProductForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Serviço
            </Button>
          </div>

          {oneTimeServices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhum serviço avulso configurado
                </h3>
                <p className="text-gray-500 mb-4">
                  Crie serviços de pagamento único para consultorias e documentos
                </p>
                <Button onClick={() => setShowProductForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Serviço
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {oneTimeServices.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditProduct(service)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-2xl font-bold">
                        {stripeService.formatCurrency(service.price_amount, service.currency)}
                      </div>

                      {service.features.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Inclui:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {service.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <Check className="h-3 w-3 text-green-600" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingProduct ? 'Editar' : 'Novo'} {productForm.product_type === 'subscription' ? 'Plano' : 'Serviço'}
              </CardTitle>
              <CardDescription>
                Configure as informações do {productForm.product_type === 'subscription' ? 'plano de assinatura' : 'serviço avulso'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Nome *</Label>
                  <Input
                    id="product_name"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Consultoria Jurídica Premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_amount">Preço (R$) *</Label>
                  <Input
                    id="price_amount"
                    type="number"
                    step="0.01"
                    value={productForm.price_amount}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price_amount: e.target.value }))}
                    placeholder="299.00"
                  />
                </div>

                {productForm.product_type === 'subscription' && (
                  <div className="space-y-2">
                    <Label htmlFor="billing_interval">Intervalo de Cobrança</Label>
                    <Select
                      value={productForm.billing_interval}
                      onValueChange={(value) => setProductForm(prev => ({ ...prev, billing_interval: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Mensal</SelectItem>
                        <SelectItem value="year">Anual</SelectItem>
                        <SelectItem value="week">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="service_category">Categoria do Serviço</Label>
                  <Select
                    value={productForm.service_category}
                    onValueChange={(value) => setProductForm(prev => ({ ...prev, service_category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="practice_area">Área de Atuação</Label>
                  <Select
                    value={productForm.practice_area}
                    onValueChange={(value) => setProductForm(prev => ({ ...prev, practice_area: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                    <SelectContent>
                      {practiceAreas.map((area) => (
                        <SelectItem key={area.value} value={area.value}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Taxa de Imposto (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    value={productForm.tax_rate}
                    onChange={(e) => setProductForm(prev => ({ ...prev, tax_rate: e.target.value }))}
                    placeholder="5.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o que está incluso neste serviço..."
                  rows={3}
                />
              </div>

              {/* Features */}
              <div className="space-y-3">
                <Label>Funcionalidades Incluídas</Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Ex: Consultoria ilimitada"
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button type="button" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {productForm.features.length > 0 && (
                  <div className="space-y-2">
                    {productForm.features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{feature}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-6 border-t">
                <Button variant="outline" onClick={resetProductForm}>
                  Cancelar
                </Button>
                <Button onClick={saveProduct} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingProduct ? 'Atualizar' : 'Criar'} {productForm.product_type === 'subscription' ? 'Plano' : 'Serviço'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}