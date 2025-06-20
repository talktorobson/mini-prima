import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  Calendar,
  Target,
  TrendingDown,
  AlertCircle,
  Download,
  RefreshCw,
  PieChart,
  Activity,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { analyticsService, subscriptionService } from '@/lib/subscriptionService';
import { useToast } from '@/hooks/use-toast';

const AdminBusinessIntelligence: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [mrrData, setMrrData] = useState<any>(null);
  const [crossSellData, setCrossSellData] = useState<any>(null);
  const [revenueProjections, setRevenueProjections] = useState<any>(null);
  const [churnAnalysis, setChurnAnalysis] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  
  // Analytics search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [metricFilter, setMetricFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [mrr, crossSell] = await Promise.all([
        analyticsService.calculateMRR(),
        analyticsService.calculateCrossSellMetrics()
      ]);
      
      setMrrData(mrr);
      setCrossSellData(crossSell);
      
      // Calculate projections and churn (mock data for now)
      calculateProjections(mrr);
      calculateChurnAnalysis();
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProjections = (mrrData: any) => {
    if (!mrrData) return;
    
    const currentMRR = mrrData.totalMRR;
    const growthRate = 0.15; // 15% monthly growth assumption
    
    const projections = {
      nextMonth: currentMRR * (1 + growthRate),
      nextQuarter: currentMRR * Math.pow(1 + growthRate, 3),
      nextYear: currentMRR * Math.pow(1 + growthRate, 12),
      arr: currentMRR * 12,
      projectedARR: currentMRR * Math.pow(1 + growthRate, 12) * 12
    };
    
    setRevenueProjections(projections);
  };

  const calculateChurnAnalysis = () => {
    // Mock churn data - would come from actual subscription cancellation analysis
    setChurnAnalysis({
      monthlyChurnRate: 2.3,
      customerLifetime: 43.5, // months
      avgCustomerLifetimeValue: 34580,
      riskFactors: ['payment_failures', 'low_usage', 'no_litigation_conversion']
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getGrowthIndicator = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(growth).toFixed(1),
      isPositive: growth > 0,
      icon: growth > 0 ? TrendingUp : TrendingDown,
      color: growth > 0 ? 'text-green-600' : 'text-red-600'
    };
  };

  // Mock analytics data for search functionality
  const mockAnalyticsData = [
    {
      id: 'client_001',
      client_name: 'Empresa ABC Ltda',
      mrr: 1200.00,
      clv: 28500.00,
      subscription_plan: 'Professional',
      churn_risk: 'Low',
      last_payment: '2024-06-15',
      metrics: {
        total_cases: 15,
        avg_case_value: 2500.00,
        litigation_conversion: '45%'
      }
    },
    {
      id: 'client_002',
      client_name: 'Consultoria XYZ S.A.',
      mrr: 2500.00,
      clv: 67500.00,
      subscription_plan: 'Enterprise',
      churn_risk: 'Low',
      last_payment: '2024-06-14',
      metrics: {
        total_cases: 8,
        avg_case_value: 5200.00,
        litigation_conversion: '62%'
      }
    },
    {
      id: 'client_003',
      client_name: 'Startup DEF Tech',
      mrr: 600.00,
      clv: 8400.00,
      subscription_plan: 'Basic',
      churn_risk: 'High',
      last_payment: '2024-06-01',
      metrics: {
        total_cases: 3,
        avg_case_value: 800.00,
        litigation_conversion: '15%'
      }
    },
    {
      id: 'client_004',
      client_name: 'Indústria GHI Ltda',
      mrr: 1800.00,
      clv: 42300.00,
      subscription_plan: 'Professional',
      churn_risk: 'Medium',
      last_payment: '2024-06-10',
      metrics: {
        total_cases: 22,
        avg_case_value: 3100.00,
        litigation_conversion: '38%'
      }
    },
    {
      id: 'client_005',
      client_name: 'Comércio JKL S.A.',
      mrr: 3200.00,
      clv: 89600.00,
      subscription_plan: 'Enterprise',
      churn_risk: 'Low',
      last_payment: '2024-06-13',
      metrics: {
        total_cases: 35,
        avg_case_value: 4200.00,
        litigation_conversion: '68%'
      }
    }
  ];

  // Advanced analytics search function
  const handleAnalyticsSearch = async () => {
    setIsSearching(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let filtered = mockAnalyticsData;
      
      // Apply search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          item.client_name.toLowerCase().includes(query) ||
          item.subscription_plan.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
        );
      }
      
      // Apply metric filter
      if (metricFilter) {
        switch (metricFilter) {
          case 'high_mrr':
            filtered = filtered.filter(item => item.mrr >= 2000);
            break;
          case 'high_clv':
            filtered = filtered.filter(item => item.clv >= 50000);
            break;
          case 'high_churn_risk':
            filtered = filtered.filter(item => item.churn_risk === 'High');
            break;
          case 'high_conversion':
            filtered = filtered.filter(item => parseInt(item.metrics.litigation_conversion) >= 50);
            break;
        }
      }
      
      // Apply client filter
      if (clientFilter) {
        filtered = filtered.filter(item => item.subscription_plan === clientFilter);
      }
      
      setSearchResults(filtered);
      
      toast({
        title: 'Busca concluída',
        description: `${filtered.length} clientes encontrados.`,
      });
      
    } catch (error) {
      console.error('Error searching analytics:', error);
      toast({
        title: 'Erro na busca',
        description: 'Erro ao pesquisar analytics. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search filters
  const clearAnalyticsFilters = () => {
    setSearchQuery('');
    setMetricFilter('');
    setClientFilter('');
    setSearchResults([]);
  };

  // Export analytics data function
  const handleExportAnalytics = () => {
    try {
      // Create comprehensive analytics data for export
      const exportData = {
        exported_at: new Date().toISOString(),
        period: selectedPeriod,
        metrics: {
          mrr: mrrData,
          cross_sell: crossSellData,
          revenue_projections: revenueProjections,
          churn_analysis: churnAnalysis
        }
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída',
        description: 'Dados de analytics exportados com sucesso.',
      });
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Erro ao exportar dados de analytics.',
        variant: 'destructive'
      });
    }
  };

  // Export search results function
  const handleExportSearchResults = () => {
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
      const headers = ['ID', 'Cliente', 'Plano', 'MRR', 'CLV', 'Risco de Churn', 'Conversão'];
      const csvContent = [
        headers.join(','),
        ...searchResults.map(client => [
          client.id,
          `"${client.client_name}"`,
          client.subscription_plan,
          client.mrr,
          client.clv,
          client.churn_risk,
          client.metrics.litigation_conversion + '%'
        ].join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-search-results-${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída',
        description: `${searchResults.length} resultados exportados com sucesso.`,
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

  // Get churn risk badge
  const getChurnRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Low':
        return <Badge className="bg-green-100 text-green-800">Baixo Risco</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Médio Risco</Badge>;
      case 'High':
        return <Badge className="bg-red-100 text-red-800">Alto Risco</Badge>;
      default:
        return <Badge variant="outline">{risk}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-gray-600">Analytics avançados do Legal-as-a-Service</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button variant="outline" onClick={handleExportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="search">Buscar Analytics</TabsTrigger>
          <TabsTrigger value="projections">Projeções</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
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
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  +15.2% vs mês anterior
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ARR Projetado</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {revenueProjections ? formatCurrency(revenueProjections.arr) : 'Calculando...'}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Activity className="h-3 w-3 mr-1 text-blue-600" />
                  Base anual atual
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Cross-sell</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {crossSellData ? `${crossSellData.conversionRate.toFixed(1)}%` : 'Calculando...'}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Users className="h-3 w-3 mr-1 text-purple-600" />
                  Assinantes → Litígios
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {churnAnalysis ? `${churnAnalysis.monthlyChurnRate}%` : 'Calculando...'}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingDown className="h-3 w-3 mr-1 text-yellow-600" />
                  Mensal
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MRR Breakdown by Tier */}
          {mrrData && (
            <Card>
              <CardHeader>
                <CardTitle>Receita por Tier de Assinatura</CardTitle>
                <CardDescription>Distribuição do MRR por nível de plano</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mrrData.mrrByTier).map(([tier, revenue]) => {
                    const percentage = ((revenue as number / mrrData.totalMRR) * 100).toFixed(1);
                    return (
                      <div key={tier} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {tier}
                          </Badge>
                          <span className="text-sm text-gray-600">{percentage}% do MRR</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(revenue as number)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cross-sell Performance */}
          {crossSellData && (
            <Card>
              <CardHeader>
                <CardTitle>Performance de Cross-sell</CardTitle>
                <CardDescription>Conversão de assinantes para serviços de litígio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{crossSellData.totalSubscribers}</div>
                    <div className="text-sm text-gray-600">Total Assinantes</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{crossSellData.subscribersWithCases}</div>
                    <div className="text-sm text-gray-600">Com Litígios</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(crossSellData.revenueFromCrossSell)}</div>
                    <div className="text-sm text-gray-600">Receita Cross-sell</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Receita Detalhada</CardTitle>
              <CardDescription>Métricas de receita e crescimento</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Insights de Receita:</strong> O MRR atual de {mrrData ? formatCurrency(mrrData.totalMRR) : 'N/A'} 
                  representa uma base sólida para crescimento. O modelo híbrido de assinatura + litígio está gerando 
                  receita diversificada e previsível.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Clientes</CardTitle>
              <CardDescription>Métricas de lifetime value e churn</CardDescription>
            </CardHeader>
            <CardContent>
              {churnAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Customer Lifetime Value</h4>
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(churnAnalysis.avgCustomerLifetimeValue)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Valor médio ao longo de {churnAnalysis.customerLifetime} meses
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Fatores de Risco</h4>
                    <div className="space-y-2">
                      {churnAnalysis.riskFactors.map((factor: string, index: number) => (
                        <Badge key={index} variant="outline" className="mr-2">
                          {factor.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projeções de Crescimento</CardTitle>
              <CardDescription>Estimativas baseadas em tendências atuais</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueProjections && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(revenueProjections.nextMonth)}
                    </div>
                    <div className="text-sm text-gray-600">Próximo Mês</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(revenueProjections.nextQuarter)}
                    </div>
                    <div className="text-sm text-gray-600">Próximo Trimestre</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {formatCurrency(revenueProjections.nextYear)}
                    </div>
                    <div className="text-sm text-gray-600">Próximo Ano (MRR)</div>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(revenueProjections.projectedARR)}
                    </div>
                    <div className="text-sm text-gray-600">ARR Projetado</div>
                  </div>
                </div>
              )}
              
              <Alert className="mt-6">
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <strong>Projeção Conservadora:</strong> Baseada em crescimento de 15% ao mês. 
                  O modelo Legal-as-a-Service está posicionado para crescimento exponencial com 
                  baixo churn e alto valor por cliente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Search */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Busca Avançada de Analytics
              </CardTitle>
              <CardDescription>
                Pesquise e filtre dados de clientes, receita e métricas de negócio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="analytics_search_query">Buscar Cliente</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="analytics_search_query"
                      placeholder="Nome do cliente, ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="metric_filter">Filtro por Métrica</Label>
                  <Select value={metricFilter} onValueChange={setMetricFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as métricas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as métricas</SelectItem>
                      <SelectItem value="high_mrr">MRR Alto (≥R$2.000)</SelectItem>
                      <SelectItem value="high_clv">CLV Alto (≥R$50.000)</SelectItem>
                      <SelectItem value="high_churn_risk">Alto Risco de Churn</SelectItem>
                      <SelectItem value="high_conversion">Alta Conversão (≥50%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="client_filter">Plano de Assinatura</Label>
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os planos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os planos</SelectItem>
                      <SelectItem value="Basic">Básico</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end gap-2">
                  <Button onClick={handleAnalyticsSearch} disabled={isSearching}>
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? 'Buscando...' : 'Buscar'}
                  </Button>
                  <Button variant="outline" onClick={clearAnalyticsFilters}>
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
                <CardTitle>Resultados da Análise ({searchResults.length})</CardTitle>
                <CardDescription>
                  Dados dos clientes encontrados com base nos filtros aplicados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.map((client) => (
                    <div
                      key={client.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-lg">{client.client_name}</h3>
                          <p className="text-sm text-gray-500">ID: {client.id}</p>
                          <Badge className="mt-1" variant="outline">{client.subscription_plan}</Badge>
                        </div>
                        <div className="text-right">
                          {getChurnRiskBadge(client.churn_risk)}
                          <p className="text-xs text-gray-500 mt-1">
                            Último pagamento: {new Date(client.last_payment).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-green-600">MRR</p>
                          <p className="text-lg font-bold">{formatCurrency(client.mrr)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-600">CLV</p>
                          <p className="text-lg font-bold">{formatCurrency(client.clv)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-purple-600">Total de Casos</p>
                          <p className="text-lg font-bold">{client.metrics.total_cases}</p>
                        </div>
                        <div>
                          <p className="font-medium text-orange-600">Conversão</p>
                          <p className="text-lg font-bold">{client.metrics.litigation_conversion}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span><strong>Valor Médio por Caso:</strong> {formatCurrency(client.metrics.avg_case_value)}</span>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {searchResults.length > 3 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm" onClick={handleExportSearchResults}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Análise
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Empty State */}
          {searchResults.length === 0 && (searchQuery || metricFilter || clientFilter) && !isSearching && (
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum dado encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Tente ajustar os filtros de busca ou usar critérios diferentes
                </p>
                <Button variant="outline" onClick={clearAnalyticsFilters}>
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBusinessIntelligence;