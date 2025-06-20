import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  CreditCard,
  Users,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  FileText,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stripeService } from '@/services/stripeService';

interface PaymentAnalytics {
  total_revenue: number;
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  average_payment_value: number;
  payment_methods_breakdown: Record<string, number>;
}

export default function PaymentAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [mrr, setMrr] = useState<number>(0);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('');
  
  // Payment search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, paymentTypeFilter]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, mrrData] = await Promise.all([
        stripeService.getPaymentAnalytics({
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          payment_type: paymentTypeFilter || undefined,
        }),
        stripeService.getMonthlyRecurringRevenue(),
      ]);
      
      setAnalytics(analyticsData);
      setMrr(mrrData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar analytics de pagamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSuccessRate = () => {
    if (!analytics || analytics.total_transactions === 0) return 0;
    return ((analytics.successful_payments / analytics.total_transactions) * 100).toFixed(1);
  };

  const getFailureRate = () => {
    if (!analytics || analytics.total_transactions === 0) return 0;
    return ((analytics.failed_payments / analytics.total_transactions) * 100).toFixed(1);
  };

  const getTopPaymentMethod = () => {
    if (!analytics || !analytics.payment_methods_breakdown) return 'N/A';
    
    const methods = analytics.payment_methods_breakdown;
    const topMethod = Object.keys(methods).reduce((a, b) => 
      methods[a] > methods[b] ? a : b
    );
    
    return stripeService.formatPaymentMethod(topMethod);
  };

  const exportData = () => {
    if (!analytics) return;
    
    const data = {
      periodo: `${dateRange.start_date} a ${dateRange.end_date}`,
      receita_total: stripeService.formatCurrency(analytics.total_revenue),
      transacoes_total: analytics.total_transactions,
      pagamentos_sucesso: analytics.successful_payments,
      pagamentos_falha: analytics.failed_payments,
      valor_medio_pagamento: stripeService.formatCurrency(analytics.average_payment_value),
      taxa_sucesso: `${getSuccessRate()}%`,
      mrr: stripeService.formatCurrency(mrr * 100),
      metodos_pagamento: analytics.payment_methods_breakdown,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-pagamentos-${dateRange.start_date}-${dateRange.end_date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Sucesso',
      description: 'Dados exportados com sucesso',
    });
  };

  // Mock payment data for search functionality
  const mockPayments = [
    {
      id: 'pay_1234567890',
      client_name: 'Empresa ABC Ltda',
      amount: 1500.00,
      status: 'succeeded',
      method: 'PIX',
      description: 'Assinatura Mensal - Plano Professional',
      created_at: '2024-06-15T10:30:00Z',
      invoice_id: 'inv_abc123',
      subscription_id: 'sub_abc123'
    },
    {
      id: 'pay_0987654321',
      client_name: 'Consultoria XYZ S.A.',
      amount: 2500.00,
      status: 'succeeded',
      method: 'Cartão de Crédito',
      description: 'Pagamento de Caso - Trabalhista',
      created_at: '2024-06-14T15:45:00Z',
      invoice_id: 'inv_xyz789',
      case_id: 'case_xyz789'
    },
    {
      id: 'pay_5678901234',
      client_name: 'Indústria DEF Ltda',
      amount: 800.00,
      status: 'failed',
      method: 'Boleto',
      description: 'Consultoria Jurídica - Tributário',
      created_at: '2024-06-13T09:15:00Z',
      invoice_id: 'inv_def456',
      failure_reason: 'Insuficiência de fundos'
    },
    {
      id: 'pay_3456789012',
      client_name: 'Startup GHI Tech',
      amount: 600.00,
      status: 'pending',
      method: 'PIX',
      description: 'Assinatura Mensal - Plano Básico',
      created_at: '2024-06-12T14:20:00Z',
      invoice_id: 'inv_ghi789'
    },
    {
      id: 'pay_7890123456',
      client_name: 'Comércio JKL S.A.',
      amount: 3200.00,
      status: 'succeeded',
      method: 'Transferência Bancária',
      description: 'Pagamento de Caso - Societário',
      created_at: '2024-06-11T16:30:00Z',
      invoice_id: 'inv_jkl012',
      case_id: 'case_jkl012'
    }
  ];

  // Advanced payment search function
  const handlePaymentSearch = async () => {
    setIsSearching(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let filtered = mockPayments;
      
      // Apply search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(payment => 
          payment.client_name.toLowerCase().includes(query) ||
          payment.id.toLowerCase().includes(query) ||
          payment.description.toLowerCase().includes(query) ||
          payment.invoice_id.toLowerCase().includes(query)
        );
      }
      
      // Apply status filter
      if (statusFilter) {
        filtered = filtered.filter(payment => payment.status === statusFilter);
      }
      
      // Apply method filter
      if (methodFilter) {
        filtered = filtered.filter(payment => payment.method === methodFilter);
      }
      
      setSearchResults(filtered);
      
      toast({
        title: 'Busca concluída',
        description: `${filtered.length} pagamentos encontrados.`,
      });
      
    } catch (error) {
      console.error('Error searching payments:', error);
      toast({
        title: 'Erro na busca',
        description: 'Erro ao pesquisar pagamentos. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search filters
  const clearSearchFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setMethodFilter('');
    setSearchResults([]);
  };

  // Export search results function
  const exportSearchResults = () => {
    try {
      if (searchResults.length === 0) {
        toast({
          title: 'Nenhum resultado',
          description: 'Não há resultados de busca para exportar.',
          variant: 'destructive'
        });
        return;
      }

      // Create CSV content
      const headers = ['ID', 'Cliente', 'Valor', 'Status', 'Método', 'Data', 'Descrição'];
      const csvContent = [
        headers.join(','),
        ...searchResults.map(payment => [
          payment.id,
          `"${payment.customer_name}"`,
          `R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          payment.status,
          payment.method,
          new Date(payment.created_at).toLocaleDateString('pt-BR'),
          `"${payment.description || ''}"`
        ].join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pagamentos-busca-${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída',
        description: `${searchResults.length} pagamentos exportados com sucesso.`,
      });
    } catch (error) {
      console.error('Error exporting search results:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Erro ao exportar resultados da busca.',
        variant: 'destructive'
      });
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Falhou</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const mockChartData = {
    revenue_trend: [
      { month: 'Jan', revenue: 12500 },
      { month: 'Feb', revenue: 15200 },
      { month: 'Mar', revenue: 18100 },
      { month: 'Apr', revenue: 16800 },
      { month: 'May', revenue: 21300 },
      { month: 'Jun', revenue: 24600 },
    ],
    payment_methods: [
      { method: 'PIX', count: 45, percentage: 52 },
      { method: 'Cartão', count: 32, percentage: 37 },
      { method: 'Boleto', count: 9, percentage: 11 },
    ],
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics de Pagamentos</h1>
          <p className="text-gray-600">Acompanhe o desempenho financeiro e métricas de pagamento</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={loadAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Configure o período e tipo de pagamento para análise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data Início</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_date">Data Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_type">Tipo de Pagamento</Label>
              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="subscription">Assinaturas</SelectItem>
                  <SelectItem value="one_time">Pagamentos Únicos</SelectItem>
                  <SelectItem value="case_payment">Pagamentos de Casos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? stripeService.formatCurrency(analytics.total_revenue) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +15% vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR (Receita Recorrente)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stripeService.formatCurrency(mrr * 100)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.total_transactions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de sucesso: {getSuccessRate()}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? stripeService.formatCurrency(analytics.average_payment_value) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Por transação aprovada
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Receita
          </TabsTrigger>
          <TabsTrigger value="methods" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Métodos
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar Pagamentos
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status dos Pagamentos</CardTitle>
                <CardDescription>Distribuição de sucessos e falhas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Pagamentos Aprovados</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{analytics?.successful_payments || 0}</div>
                      <div className="text-sm text-gray-500">{getSuccessRate()}%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Pagamentos Rejeitados</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{analytics?.failed_payments || 0}</div>
                      <div className="text-sm text-gray-500">{getFailureRate()}%</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${getSuccessRate()}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pagamento</CardTitle>
                <CardDescription>Preferência dos clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockChartData.payment_methods.map((method) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{method.method}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{method.count} pagamentos</div>
                        <div className="text-sm text-gray-500">{method.percentage}%</div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2">
                    <div className="text-sm text-gray-600">
                      <strong>Método mais usado:</strong> {getTopPaymentMethod()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Trends */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Receita</CardTitle>
              <CardDescription>Evolução da receita nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockChartData.revenue_trend.map((data, index) => (
                  <div key={data.month} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium">{data.month}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{stripeService.formatCurrency(data.revenue * 100)}</span>
                        <span className="text-sm text-gray-500">
                          {index > 0 && (
                            <span className={`flex items-center gap-1 ${
                              data.revenue > mockChartData.revenue_trend[index - 1].revenue 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {data.revenue > mockChartData.revenue_trend[index - 1].revenue 
                                ? <TrendingUp className="h-3 w-3" /> 
                                : <TrendingDown className="h-3 w-3" />
                              }
                              {(((data.revenue - mockChartData.revenue_trend[index - 1].revenue) / 
                                mockChartData.revenue_trend[index - 1].revenue) * 100).toFixed(1)}%
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(data.revenue / Math.max(...mockChartData.revenue_trend.map(d => d.revenue))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Método de Pagamento</CardTitle>
              <CardDescription>Performance detalhada de cada método</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(analytics?.payment_methods_breakdown || {}).map(([method, count]) => (
                  <div key={method} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{stripeService.formatPaymentMethod(method)}</h4>
                      <Badge variant="outline">{count} transações</Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Volume</p>
                        <p className="font-medium">{count} pagamentos</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Taxa Sucesso</p>
                        <p className="font-medium">95.2%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tempo Médio</p>
                        <p className="font-medium">
                          {method === 'pix' ? '< 1 min' : 
                           method === 'card' ? '5 seg' : '1-3 dias'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>KPIs de Performance</CardTitle>
                <CardDescription>Indicadores chave de desempenho</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Conversão</span>
                    <span className="font-medium">{getSuccessRate()}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tempo Médio de Processamento</span>
                    <span className="font-medium">2.3 seg</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Chargeback</span>
                    <span className="font-medium">0.2%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cliente Lifetime Value (CLV)</span>
                    <span className="font-medium">R$ 2.847,00</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Redução (Churn)</span>
                    <span className="font-medium">3.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparação com Mês Anterior</CardTitle>
                <CardDescription>Variações nos principais indicadores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Receita</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium">+15%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Transações</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium">+12%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Valor Médio</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium">+3%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Sucesso</span>
                    <div className="flex items-center gap-1 text-red-600">
                      <TrendingDown className="h-3 w-3" />
                      <span className="font-medium">-0.5%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Novos Clientes</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium">+24%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Search */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Busca Avançada de Pagamentos
              </CardTitle>
              <CardDescription>
                Pesquise e filtre pagamentos por cliente, status, método e mais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search_query">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search_query"
                      placeholder="Cliente, ID do pagamento, fatura..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status_filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      <SelectItem value="succeeded">Sucesso</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="method_filter">Método de Pagamento</Label>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os métodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os métodos</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="Transferência Bancária">Transferência Bancária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end gap-2">
                  <Button onClick={handlePaymentSearch} disabled={isSearching}>
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? 'Buscando...' : 'Buscar'}
                  </Button>
                  <Button variant="outline" onClick={clearSearchFilters}>
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados da Busca ({searchResults.length})</CardTitle>
                <CardDescription>
                  Pagamentos encontrados com base nos filtros aplicados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.map((payment) => (
                    <div
                      key={payment.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-sm">{payment.client_name}</h3>
                          <p className="text-xs text-gray-500">ID: {payment.id}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-lg">
                            {stripeService.formatCurrency(payment.amount * 100)}
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="space-y-1">
                          <p><strong>Método:</strong> {payment.method}</p>
                          <p><strong>Descrição:</strong> {payment.description}</p>
                          <p><strong>Data:</strong> {new Date(payment.created_at).toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p><strong>Fatura:</strong> {payment.invoice_id}</p>
                          {payment.case_id && <p><strong>Caso:</strong> {payment.case_id}</p>}
                          {payment.subscription_id && <p><strong>Assinatura:</strong> {payment.subscription_id}</p>}
                          {payment.failure_reason && (
                            <p className="text-red-600"><strong>Motivo:</strong> {payment.failure_reason}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-3">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {searchResults.length > 5 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm" onClick={exportSearchResults}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Resultados
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Empty State */}
          {searchResults.length === 0 && (searchQuery || statusFilter || methodFilter) && !isSearching && (
            <Card>
              <CardContent className="p-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum pagamento encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Tente ajustar os filtros de busca ou usar termos diferentes
                </p>
                <Button variant="outline" onClick={clearSearchFilters}>
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}