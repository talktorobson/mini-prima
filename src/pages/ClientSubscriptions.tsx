import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Crown, 
  Calendar, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Settings,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stripeService, CustomerSubscription, PaymentHistory, SubscriptionPlan } from '@/services/stripeService';

export default function ClientSubscriptions() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);

  // Mock client ID - in real implementation, get from auth context
  const clientId = 'mock-client-id';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, payments, plans] = await Promise.all([
        stripeService.getClientSubscriptions(clientId),
        stripeService.getClientPaymentHistory(clientId),
        stripeService.getSubscriptionPlans(),
      ]);
      
      setSubscriptions(subs);
      setPaymentHistory(payments);
      setAvailablePlans(plans);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados das assinaturas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      await stripeService.cancelSubscription(subscriptionId, true);
      
      toast({
        title: 'Sucesso',
        description: 'Assinatura será cancelada ao final do período atual',
      });
      
      setShowCancelModal(null);
      await loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao cancelar assinatura',
        variant: 'destructive',
      });
    }
  };

  const handleViewAvailablePlans = () => {
    // Navigate to plans page or open plans modal
    toast({
      title: "Planos Disponíveis",
      description: "Redirecionando para catálogo de planos...",
    });
    // In a real implementation, this would navigate to /plans or similar
  };

  const handleManageSubscription = (subscription: any) => {
    toast({
      title: "Gerenciar Assinatura",
      description: `Gerenciando assinatura: ${subscription.product_name}`,
    });
    // In a real implementation, this would open a management modal
    // with options to change plan, update payment method, etc.
  };

  const handleViewSubscriptionDetails = (subscription: any) => {
    toast({
      title: "Detalhes da Assinatura", 
      description: `Visualizando detalhes: ${subscription.product_name}`,
    });
    // In a real implementation, this would show detailed subscription info
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativa', variant: 'default' as const, icon: CheckCircle },
      trialing: { label: 'Período Trial', variant: 'secondary' as const, icon: Crown },
      past_due: { label: 'Em Atraso', variant: 'destructive' as const, icon: AlertTriangle },
      canceled: { label: 'Cancelada', variant: 'outline' as const, icon: XCircle },
      unpaid: { label: 'Não Paga', variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      succeeded: { label: 'Pago', variant: 'default' as const, color: 'text-green-600' },
      pending: { label: 'Pendente', variant: 'secondary' as const, color: 'text-yellow-600' },
      failed: { label: 'Falhou', variant: 'destructive' as const, color: 'text-red-600' },
      canceled: { label: 'Cancelado', variant: 'outline' as const, color: 'text-gray-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(sub => ['active', 'trialing'].includes(sub.status));
  const inactiveSubscriptions = subscriptions.filter(sub => !['active', 'trialing'].includes(sub.status));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Assinaturas</h1>
          <p className="text-gray-600">Gerencie seus planos e histórico de pagamentos</p>
        </div>
        
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Ativas ({activeSubscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Histórico ({inactiveSubscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos ({paymentHistory.length})
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novos Planos
          </TabsTrigger>
        </TabsList>

        {/* Active Subscriptions */}
        <TabsContent value="active" className="space-y-6">
          {activeSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhuma assinatura ativa
                </h3>
                <p className="text-gray-500 mb-4">
                  Você não possui assinaturas ativas no momento
                </p>
                <Button onClick={handleViewAvailablePlans}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ver Planos Disponíveis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeSubscriptions.map((subscription) => (
                <Card key={subscription.id} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{subscription.product_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(subscription.status)}
                          {subscription.cancel_at_period_end && (
                            <Badge variant="outline" className="text-orange-600">
                              Cancelará em {formatDate(subscription.current_period_end)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {stripeService.formatCurrency(subscription.amount, subscription.currency)}
                        </div>
                        <div className="text-sm text-gray-500">/mês</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Início do período</p>
                          <p className="font-medium">{formatDate(subscription.current_period_start)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Fim do período</p>
                          <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
                        </div>
                      </div>
                      
                      {subscription.trial_end && (
                        <Alert>
                          <Crown className="h-4 w-4" />
                          <AlertDescription>
                            Período trial até {formatDate(subscription.trial_end)}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {subscription.next_payment_date && (
                        <div className="text-sm">
                          <p className="text-gray-500">Próximo pagamento</p>
                          <p className="font-medium">{formatDate(subscription.next_payment_date)}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleManageSubscription(subscription)}>
                          <Settings className="h-3 w-3 mr-1" />
                          Gerenciar
                        </Button>
                        {!subscription.cancel_at_period_end && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 text-red-600 hover:text-red-700"
                            onClick={() => setShowCancelModal(subscription.id)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subscription History */}
        <TabsContent value="history" className="space-y-6">
          {inactiveSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhuma assinatura no histórico
                </h3>
                <p className="text-gray-500">
                  Suas assinaturas canceladas ou expiradas aparecerão aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {inactiveSubscriptions.map((subscription) => (
                <Card key={subscription.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{subscription.product_name}</h4>
                          <p className="text-sm text-gray-500">
                            {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                          </p>
                        </div>
                        {getStatusBadge(subscription.status)}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {stripeService.formatCurrency(subscription.amount, subscription.currency)}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleViewSubscriptionDetails(subscription)}>
                          <Eye className="h-3 w-3 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Payment History */}
        <TabsContent value="payments" className="space-y-6">
          {paymentHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhum pagamento encontrado
                </h3>
                <p className="text-gray-500">
                  Seu histórico de pagamentos aparecerá aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paymentHistory.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{payment.description}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{formatDate(payment.payment_created_at)}</span>
                            <span>•</span>
                            <span>{stripeService.formatPaymentMethod(payment.payment_method)}</span>
                            <span>•</span>
                            <span className="capitalize">{payment.payment_type.replace('_', ' ')}</span>
                          </div>
                        </div>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {stripeService.formatCurrency(payment.amount, payment.currency)}
                        </div>
                        <div className="flex gap-1">
                          {payment.receipt_url && (
                            <Button variant="ghost" size="sm">
                              <Download className="h-3 w-3 mr-1" />
                              Recibo
                            </Button>
                          )}
                          {payment.boleto_url && (
                            <Button variant="ghost" size="sm">
                              <Download className="h-3 w-3 mr-1" />
                              Boleto
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Available Plans */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.is_featured ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {plan.is_featured && (
                        <Badge className="mt-1">Recomendado</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {stripeService.formatCurrency(plan.price_amount, plan.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        por {plan.billing_interval === 'month' ? 'mês' : 'ano'}
                      </div>
                    </div>
                    
                    {plan.features.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Funcionalidades:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <Button className="w-full">
                      Assinar Agora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Cancelar Assinatura
              </CardTitle>
              <CardDescription>
                Tem certeza que deseja cancelar esta assinatura?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  A assinatura continuará ativa até o final do período atual. Você não será cobrado no próximo ciclo.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCancelModal(null)}
                  className="flex-1"
                >
                  Manter Assinatura
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleCancelSubscription(showCancelModal)}
                  className="flex-1"
                >
                  Confirmar Cancelamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}