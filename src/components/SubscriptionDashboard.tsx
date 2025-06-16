import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Clock, 
  FileText, 
  MessageCircle, 
  CreditCard,
  AlertCircle,
  Calendar,
  BarChart3,
  Users,
  DollarSign
} from 'lucide-react';
import { subscriptionService, analyticsService, ClientSubscription, SubscriptionUsage } from '@/lib/subscriptionService';
import { useToast } from '@/hooks/use-toast';
import SubscriptionPlanCard from './SubscriptionPlanCard';

interface SubscriptionDashboardProps {
  clientId?: string;
  isAdminView?: boolean;
}

const SubscriptionDashboard: React.FC<SubscriptionDashboardProps> = ({
  clientId,
  isAdminView = false
}) => {
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [usageHistory, setUsageHistory] = useState<SubscriptionUsage[]>([]);
  const [mrrData, setMrrData] = useState<any>(null);
  const [crossSellData, setCrossSellData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionData();
    if (isAdminView) {
      loadAnalyticsData();
    }
  }, [clientId, isAdminView]);

  const loadSubscriptionData = async () => {
    if (!clientId && !isAdminView) return;

    try {
      setLoading(true);
      
      if (clientId) {
        const subs = await subscriptionService.getClientSubscriptions(clientId);
        setSubscriptions(subs);

        // Load usage history for active subscription
        const activeSub = subs.find(sub => sub.status === 'active');
        if (activeSub) {
          const usage = await subscriptionService.getUsageHistory(activeSub.id);
          setUsageHistory(usage);
        }
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da assinatura",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const [mrr, crossSell] = await Promise.all([
        analyticsService.calculateMRR(),
        analyticsService.calculateCrossSellMetrics()
      ]);
      
      setMrrData(mrr);
      setCrossSellData(crossSell);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getUsagePercentage = (used: number, quota: number) => {
    if (quota === 0) return 0;
    return Math.min((used / quota) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const activeSubscription = subscriptions.find(sub => sub.status === 'active');

  // Admin Dashboard View
  if (isAdminView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard de Assinaturas</h2>
            <p className="text-gray-600">Visão geral do negócio de Legal-as-a-Service</p>
          </div>
        </div>

        {/* Admin Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {mrrData ? formatCurrency(mrrData.totalMRR) : 'Carregando...'}
              </div>
              <p className="text-xs text-muted-foreground">
                {mrrData?.activeSubscriptions || 0} assinaturas ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ARPU</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mrrData ? formatCurrency(mrrData.avgRevenuePerUser) : 'Carregando...'}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita média por usuário
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cross-sell</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {crossSellData ? `${crossSellData.conversionRate.toFixed(1)}%` : 'Carregando...'}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de conversão para litígios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Cross-sell</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {crossSellData ? formatCurrency(crossSellData.revenueFromCrossSell) : 'Carregando...'}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita de assinantes em litígios
              </p>
            </CardContent>
          </Card>
        </div>

        {/* MRR Breakdown */}
        {mrrData && (
          <Card>
            <CardHeader>
              <CardTitle>Receita por Tier de Assinatura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(mrrData.mrrByTier).map(([tier, revenue]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {tier}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(revenue as number)}</div>
                      <div className="text-sm text-gray-500">
                        {((revenue as number / mrrData.totalMRR) * 100).toFixed(1)}% do MRR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Client Dashboard View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Minha Assinatura</h2>
          <p className="text-gray-600">Gerencie sua assinatura e acompanhe o uso</p>
        </div>
      </div>

      {!activeSubscription ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não possui uma assinatura ativa. Entre em contato conosco para assinar um plano.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="usage">Uso Detalhado</TabsTrigger>
            <TabsTrigger value="billing">Cobrança</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Current Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {activeSubscription.plan && (
                  <SubscriptionPlanCard 
                    plan={activeSubscription.plan} 
                    isCurrentPlan={true}
                    showPricing={false}
                  />
                )}
              </div>

              <div className="space-y-6">
                {/* Billing Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações de Cobrança</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Valor Mensal:</span>
                      <span className="font-semibold">{formatCurrency(activeSubscription.monthly_amount)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ciclo:</span>
                      <Badge variant="outline">
                        {activeSubscription.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Próxima Cobrança:</span>
                      <span className="text-sm">
                        {activeSubscription.next_billing_date 
                          ? new Date(activeSubscription.next_billing_date).toLocaleDateString('pt-BR')
                          : 'N/A'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge 
                        variant={activeSubscription.status === 'active' ? 'default' : 'secondary'}
                        className={activeSubscription.status === 'active' ? 'bg-green-500' : ''}
                      >
                        {activeSubscription.status === 'active' ? 'Ativa' : activeSubscription.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Atualizar Pagamento
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Alterar Ciclo de Cobrança
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Fazer Upgrade do Plano
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Usage Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Uso do Período Atual</CardTitle>
                <CardDescription>
                  Período: {new Date(activeSubscription.current_period_start).toLocaleDateString('pt-BR')} - {new Date(activeSubscription.current_period_end).toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Consulting Hours */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Horas de Consultoria</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {activeSubscription.usage_tracking?.consulting_hours_used || 0} / {activeSubscription.plan?.consulting_hours_quota || 0}h
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(
                        activeSubscription.usage_tracking?.consulting_hours_used || 0,
                        activeSubscription.plan?.consulting_hours_quota || 0
                      )} 
                      className="h-2"
                    />
                    <div className={`text-sm ${getUsageColor(getUsagePercentage(
                      activeSubscription.usage_tracking?.consulting_hours_used || 0,
                      activeSubscription.plan?.consulting_hours_quota || 0
                    ))}`}>
                      {getUsagePercentage(
                        activeSubscription.usage_tracking?.consulting_hours_used || 0,
                        activeSubscription.plan?.consulting_hours_quota || 0
                      ).toFixed(1)}% utilizado
                    </div>
                  </div>

                  {/* Document Reviews */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Análises de Documentos</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {activeSubscription.usage_tracking?.documents_reviewed || 0} / {activeSubscription.plan?.document_review_quota || 0}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(
                        activeSubscription.usage_tracking?.documents_reviewed || 0,
                        activeSubscription.plan?.document_review_quota || 0
                      )} 
                      className="h-2"
                    />
                    <div className={`text-sm ${getUsageColor(getUsagePercentage(
                      activeSubscription.usage_tracking?.documents_reviewed || 0,
                      activeSubscription.plan?.document_review_quota || 0
                    ))}`}>
                      {getUsagePercentage(
                        activeSubscription.usage_tracking?.documents_reviewed || 0,
                        activeSubscription.plan?.document_review_quota || 0
                      ).toFixed(1)}% utilizado
                    </div>
                  </div>

                  {/* Legal Questions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Perguntas Jurídicas</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {activeSubscription.usage_tracking?.questions_asked || 0} / {activeSubscription.plan?.legal_questions_quota || 0}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(
                        activeSubscription.usage_tracking?.questions_asked || 0,
                        activeSubscription.plan?.legal_questions_quota || 0
                      )} 
                      className="h-2"
                    />
                    <div className={`text-sm ${getUsageColor(getUsagePercentage(
                      activeSubscription.usage_tracking?.questions_asked || 0,
                      activeSubscription.plan?.legal_questions_quota || 0
                    ))}`}>
                      {getUsagePercentage(
                        activeSubscription.usage_tracking?.questions_asked || 0,
                        activeSubscription.plan?.legal_questions_quota || 0
                      ).toFixed(1)}% utilizado
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Uso Detalhado</CardTitle>
                <CardDescription>
                  Últimas atividades da sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usageHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum uso registrado ainda
                  </div>
                ) : (
                  <div className="space-y-4">
                    {usageHistory.slice(0, 10).map((usage) => (
                      <div key={usage.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {usage.usage_type === 'consulting_hours' && <Clock className="h-5 w-5 text-blue-500" />}
                          {usage.usage_type === 'document_review' && <FileText className="h-5 w-5 text-purple-500" />}
                          {usage.usage_type === 'legal_questions' && <MessageCircle className="h-5 w-5 text-green-500" />}
                          
                          <div>
                            <div className="font-medium">
                              {usage.usage_type === 'consulting_hours' && 'Consultoria Jurídica'}
                              {usage.usage_type === 'document_review' && 'Análise de Documento'}
                              {usage.usage_type === 'legal_questions' && 'Pergunta Jurídica'}
                              {usage.usage_type === 'template_access' && 'Acesso a Template'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {usage.description || 'Sem descrição'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium">
                            {usage.quantity_used} {usage.usage_type === 'consulting_hours' ? 'h' : 'x'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(usage.usage_date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Cobrança</CardTitle>
                <CardDescription>
                  Detalhes sobre sua assinatura e próximas cobranças
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Assinatura Atual</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Plano:</span>
                          <span className="font-medium">{activeSubscription.plan?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor:</span>
                          <span className="font-medium">{formatCurrency(activeSubscription.monthly_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ciclo:</span>
                          <span className="font-medium">
                            {activeSubscription.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Próxima Cobrança</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Data:</span>
                          <span className="font-medium">
                            {activeSubscription.next_billing_date 
                              ? new Date(activeSubscription.next_billing_date).toLocaleDateString('pt-BR')
                              : 'N/A'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor:</span>
                          <span className="font-medium">{formatCurrency(activeSubscription.monthly_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Renovação:</span>
                          <span className="font-medium">
                            {activeSubscription.auto_renew ? 'Automática' : 'Manual'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Benefit for Litigation */}
                  {activeSubscription.plan?.litigation_discount_percentage && (
                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Benefício Exclusivo:</strong> Como assinante, você tem direito a{' '}
                        <strong className="text-red-600">
                          {activeSubscription.plan.litigation_discount_percentage}% de desconto
                        </strong>{' '}
                        em todos os serviços de litígio que contratar conosco!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SubscriptionDashboard;