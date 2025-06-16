// 💼 FINANCIAL DEPARTMENT DASHBOARD
// D'Avila Reis Legal Practice Management System
// Unified Accounts Payable & Receivable Management

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  CreditCard,
  Download,
  Plus,
  Filter,
  Bell,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

import { financialAnalyticsService, type FinancialDashboardData } from '@/lib/financialService';
import { PayablesManagement } from '@/components/financial/PayablesManagement';
import { ReceivablesManagement } from '@/components/financial/ReceivablesManagement';
import { FinancialReports } from '@/components/financial/FinancialReports';
import { SuppliersManagement } from '@/components/financial/SuppliersManagement';

export const FinancialDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<FinancialDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await financialAnalyticsService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      setError('Erro ao carregar dados financeiros');
      console.error('Error loading dashboard data:', err);
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) return null;

  const totalCashFlow = dashboardData.cashFlow.currentBalance;
  const totalOutstanding = dashboardData.accountsReceivable.totalOutstanding + dashboardData.accountsPayable.totalOutstanding;
  const netLiquidity = dashboardData.accountsReceivable.totalOutstanding - dashboardData.accountsPayable.totalOutstanding;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Departamento Financeiro</h1>
            <p className="text-gray-600 mt-1">Gestão completa de contas a pagar e receber</p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Critical Alerts */}
        {dashboardData.alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <Bell className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Atenção:</strong> Você tem {dashboardData.alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').length} alertas importantes que requerem ação imediata.
            </AlertDescription>
          </Alert>
        )}

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Current Cash Flow */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fluxo de Caixa Atual</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCashFlow)}</div>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                {dashboardData.cashFlow.netCashFlow >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                )}
                <span>Resultado do mês: {formatCurrency(dashboardData.cashFlow.netCashFlow)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Accounts Receivable */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(dashboardData.accountsReceivable.totalOutstanding)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                <span className="text-red-600">Vencido: {formatCurrency(dashboardData.accountsReceivable.overdueAmount)}</span>
              </div>
              <div className="flex items-center mt-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${dashboardData.accountsReceivable.collectionEfficiency}%` 
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 ml-2">
                  {formatPercentage(dashboardData.accountsReceivable.collectionEfficiency)} eficiência
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Accounts Payable */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(dashboardData.accountsPayable.totalOutstanding)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                <span className="text-red-600">Vencido: {formatCurrency(dashboardData.accountsPayable.overdueAmount)}</span>
              </div>
              <div className="text-xs text-amber-600 mt-1">
                Vence em 7 dias: {formatCurrency(dashboardData.accountsPayable.dueSoon)}
              </div>
            </CardContent>
          </Card>

          {/* Net Liquidity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Liquidez Líquida</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netLiquidity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netLiquidity)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Receber - Pagar = Posição Líquida
              </div>
              <div className="flex items-center mt-2">
                <Badge variant={netLiquidity >= 0 ? 'default' : 'destructive'} className="text-xs">
                  {netLiquidity >= 0 ? 'Positiva' : 'Negativa'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            <CardDescription>Operações frequentes do departamento financeiro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <FileText className="w-5 h-5" />
                <span className="text-xs">Nova Conta</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Registrar Pagamento</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Users className="w-5 h-5" />
                <span className="text-xs">Novo Fornecedor</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Calendar className="w-5 h-5" />
                <span className="text-xs">Agendar Pagamento</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Download className="w-5 h-5" />
                <span className="text-xs">Relatório Excel</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">Projeção Fluxo</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alert Center */}
        {dashboardData.alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Central de Alertas
                <Badge variant="destructive" className="ml-2">{dashboardData.alerts.filter(a => !a.is_read).length}</Badge>
              </CardTitle>
              <CardDescription>Itens que requerem sua atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                    alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                    alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {alert.severity === 'critical' ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : alert.severity === 'high' ? (
                        <Clock className="w-5 h-5 text-orange-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-gray-600">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' :
                        alert.severity === 'high' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {alert.severity === 'critical' ? 'Crítico' :
                         alert.severity === 'high' ? 'Alto' :
                         alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                      </Badge>
                      <Button size="sm" variant="ghost">Ver</Button>
                    </div>
                  </div>
                ))}
              </div>
              {dashboardData.alerts.length > 5 && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm">
                    Ver todos os {dashboardData.alerts.length} alertas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Tabs Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
            <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Monthly Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho Mensal</CardTitle>
                  <CardDescription>Receitas vs Despesas dos últimos meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Receitas</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(dashboardData.cashFlow.monthlyIncome)}
                      </span>
                    </div>
                    <Progress value={75} className="w-full" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Despesas</span>
                      <span className="text-sm font-bold text-red-600">
                        {formatCurrency(dashboardData.cashFlow.monthlyExpenses)}
                      </span>
                    </div>
                    <Progress value={60} className="w-full" />
                    
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Resultado Líquido</span>
                        <span className={`text-sm font-bold ${
                          dashboardData.cashFlow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(dashboardData.cashFlow.netCashFlow)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Transações Recentes</CardTitle>
                  <CardDescription>Últimas movimentações financeiras</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.recentTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {transaction.payment_type === 'receivable' ? (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {transaction.payment_method === 'transfer' ? 'Transferência' :
                               transaction.payment_method === 'pix' ? 'PIX' :
                               transaction.payment_method === 'boleto' ? 'Boleto' :
                               transaction.payment_method}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(transaction.payment_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            transaction.payment_type === 'receivable' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.payment_type === 'receivable' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {transaction.status === 'completed' ? 'Concluído' : transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-4">
                    <Button variant="outline" size="sm">Ver todas as transações</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payables Tab */}
          <TabsContent value="payables">
            <PayablesManagement />
          </TabsContent>

          {/* Receivables Tab */}
          <TabsContent value="receivables">
            <ReceivablesManagement />
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers">
            <SuppliersManagement />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <FinancialReports />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};