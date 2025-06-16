// 📊 FINANCIAL REPORTS COMPONENT
// Comprehensive Financial Analytics and Reporting

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  Target,
  Eye,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Users,
  CreditCard,
  Printer
} from 'lucide-react';

import { 
  financialAnalyticsService, 
  billsService, 
  invoicesService,
  type CashFlowProjection,
  type AgingReport 
} from '@/lib/financialService';
import { useToast } from '@/hooks/use-toast';

export const FinancialReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    to: new Date().toISOString().split('T')[0] // Today
  });
  const [cashFlowProjections, setCashFlowProjections] = useState<CashFlowProjection[]>([]);
  const [agingReport, setAgingReport] = useState<AgingReport | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadReportsData();
  }, [dateRange]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      // Load cash flow projections
      const projections = await financialAnalyticsService.getCashFlowProjections(6);
      setCashFlowProjections(projections);

      // Load aging report
      const aging = await invoicesService.getAgingReport();
      setAgingReport(aging);

    } catch (error) {
      console.error('Error loading reports data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleExportReport = async (type: 'bills' | 'invoices' | 'payments') => {
    try {
      const blob = await financialAnalyticsService.exportToExcel(type);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatórios Financeiros</h2>
          <p className="text-gray-600">Análises e projeções financeiras detalhadas</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <Label htmlFor="date_from">Período:</Label>
            <Input
              id="date_from"
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              className="w-40"
            />
            <span className="text-gray-500">até</span>
            <Input
              id="date_to"
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              className="w-40"
            />
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="aging">Aging Report</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="exports">Exportações</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(cashFlowProjections.reduce((sum, p) => sum + p.projectedIncome, 0))}
                </div>
                <p className="text-xs text-gray-600">Últimos 6 meses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas Total</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(cashFlowProjections.reduce((sum, p) => sum + p.projectedExpenses, 0))}
                </div>
                <p className="text-xs text-gray-600">Últimos 6 meses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(cashFlowProjections.reduce((sum, p) => sum + p.netCashFlow, 0))}
                </div>
                <p className="text-xs text-gray-600">Resultado acumulado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Margem</CardTitle>
                <Target className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const totalIncome = cashFlowProjections.reduce((sum, p) => sum + p.projectedIncome, 0);
                    const totalProfit = cashFlowProjections.reduce((sum, p) => sum + p.netCashFlow, 0);
                    const margin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0;
                    return `${margin.toFixed(1)}%`;
                  })()}
                </div>
                <p className="text-xs text-gray-600">Margem de lucro</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance Mensal
              </CardTitle>
              <CardDescription>Evolução de receitas e despesas nos últimos meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cashFlowProjections.slice(-6).map((projection, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {new Date(projection.month).toLocaleDateString('pt-BR', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </span>
                      <span className={`font-bold ${
                        projection.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(projection.netCashFlow)}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Receitas: {formatCurrency(projection.projectedIncome)}</span>
                        <span>Despesas: {formatCurrency(projection.projectedExpenses)}</span>
                      </div>
                      
                      <div className="relative">
                        <Progress 
                          value={Math.min((projection.projectedIncome / 100000) * 100, 100)} 
                          className="h-2 bg-gray-200" 
                        />
                        <Progress 
                          value={Math.min((projection.projectedExpenses / 100000) * 100, 100)} 
                          className="h-2 bg-red-200 absolute top-0" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Projeção de Fluxo de Caixa
              </CardTitle>
              <CardDescription>Análise detalhada do fluxo de caixa e projeções futuras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-right">Receitas Previstas</TableHead>
                      <TableHead className="text-right">Despesas Previstas</TableHead>
                      <TableHead className="text-right">Fluxo Líquido</TableHead>
                      <TableHead className="text-right">Saldo Acumulado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashFlowProjections.map((projection, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {new Date(projection.month).toLocaleDateString('pt-BR', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(projection.projectedIncome)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(projection.projectedExpenses)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          projection.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {projection.netCashFlow >= 0 ? '+' : ''}{formatCurrency(projection.netCashFlow)}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${
                          projection.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(projection.runningBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aging Report Tab */}
        <TabsContent value="aging" className="space-y-6">
          {agingReport && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Análise de Vencimento (Aging Report)
                  </CardTitle>
                  <CardDescription>Distribuição das contas a receber por período de vencimento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(agingReport.current)}</p>
                      <p className="text-sm text-gray-600">Em dia</p>
                      <p className="text-xs text-gray-500">
                        {agingReport.total > 0 ? ((agingReport.current / agingReport.total) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{formatCurrency(agingReport.days1to30)}</p>
                      <p className="text-sm text-gray-600">1-30 dias</p>
                      <p className="text-xs text-gray-500">
                        {agingReport.total > 0 ? ((agingReport.days1to30 / agingReport.total) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(agingReport.days31to60)}</p>
                      <p className="text-sm text-gray-600">31-60 dias</p>
                      <p className="text-xs text-gray-500">
                        {agingReport.total > 0 ? ((agingReport.days31to60 / agingReport.total) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(agingReport.days61to90)}</p>
                      <p className="text-sm text-gray-600">61-90 dias</p>
                      <p className="text-xs text-gray-500">
                        {agingReport.total > 0 ? ((agingReport.days61to90 / agingReport.total) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-red-100 rounded-lg">
                      <p className="text-2xl font-bold text-red-800">{formatCurrency(agingReport.over90Days)}</p>
                      <p className="text-sm text-gray-600">+90 dias</p>
                      <p className="text-xs text-gray-500">
                        {agingReport.total > 0 ? ((agingReport.over90Days / agingReport.total) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total em Aberto:</span>
                      <span className="text-xl font-bold">{formatCurrency(agingReport.total)}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Risco de Inadimplência</span>
                        <span>
                          {agingReport.total > 0 ? 
                            (((agingReport.days61to90 + agingReport.over90Days) / agingReport.total) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={agingReport.total > 0 ? 
                          ((agingReport.days61to90 + agingReport.over90Days) / agingReport.total) * 100 
                          : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Indicadores de Receita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">MRR (Receita Recorrente)</span>
                  <span className="font-bold text-green-600">R$ 45.200</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taxa de Crescimento</span>
                  <span className="font-bold text-blue-600">+12.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ticket Médio</span>
                  <span className="font-bold">R$ 3.850</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Eficiência Operacional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taxa de Cobrança</span>
                  <span className="font-bold text-green-600">94.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tempo Médio Recebimento</span>
                  <span className="font-bold">28 dias</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Inadimplência</span>
                  <span className="font-bold text-red-600">2.1%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controle de Custos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Custo Operacional</span>
                  <span className="font-bold">R$ 28.500</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">% da Receita</span>
                  <span className="font-bold text-orange-600">63.1%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">EBITDA</span>
                  <span className="font-bold text-green-600">36.9%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expense Categories Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Distribuição de Despesas por Categoria
              </CardTitle>
              <CardDescription>Análise dos principais centros de custo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">R$ 8.500</div>
                  <div className="text-sm text-gray-600">Salários</div>
                  <div className="text-xs text-gray-500">29.8%</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">R$ 6.200</div>
                  <div className="text-sm text-gray-600">Instalações</div>
                  <div className="text-xs text-gray-500">21.8%</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">R$ 4.800</div>
                  <div className="text-sm text-gray-600">Tecnologia</div>
                  <div className="text-xs text-gray-500">16.8%</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">R$ 3.200</div>
                  <div className="text-sm text-gray-600">Marketing</div>
                  <div className="text-xs text-gray-500">11.2%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exports Tab */}
        <TabsContent value="exports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Contas a Pagar
                </CardTitle>
                <CardDescription>Exportar relatório completo de contas a pagar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Inclui todas as contas pendentes, aprovadas e pagas no período selecionado.
                </p>
                <Button 
                  onClick={() => handleExportReport('bills')}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Contas a Receber
                </CardTitle>
                <CardDescription>Exportar relatório de faturas e recebimentos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Inclui todas as faturas emitidas, pagas e em aberto no período.
                </p>
                <Button 
                  onClick={() => handleExportReport('invoices')}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Movimentações
                </CardTitle>
                <CardDescription>Exportar todas as transações financeiras</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Relatório completo de todos os pagamentos e recebimentos.
                </p>
                <Button 
                  onClick={() => handleExportReport('payments')}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Fluxo de Caixa
                </CardTitle>
                <CardDescription>Relatório de fluxo de caixa detalhado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Projeções e análise histórica do fluxo de caixa.
                </p>
                <Button className="w-full" variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Gerar PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Aging Report
                </CardTitle>
                <CardDescription>Relatório de análise de vencimentos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Análise detalhada de contas em aberto por período.
                </p>
                <Button className="w-full" variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Gerar PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Relatório Executivo
                </CardTitle>
                <CardDescription>Resumo executivo completo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Dashboard executivo com principais KPIs financeiros.
                </p>
                <Button className="w-full" variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Gerar PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};