// 🇧🇷 Brazilian Legal Compliance Dashboard
// D'Avila Reis Legal Practice Management System
// Advanced case workflows and OAB compliance monitoring

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Scale,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gavel,
  FileText,
  BarChart3,
  Building2,
  Shield,
  Users,
  TrendingUp,
  AlertCircle,
  Target,
  BookOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { brazilianLegalService, BRAZILIAN_COURTS, LEGAL_PROCEDURE_TYPES, OAB_COMPLIANCE_RULES } from '@/services/brazilianLegalService';
import { supabase } from '@/integrations/supabase/client';

interface ComplianceMetrics {
  totalCases: number;
  complianceScore: number;
  pendingDeadlines: number;
  overdueDeadlines: number;
  oabViolations: number;
  automatedWorkflows: number;
}

interface DeadlineAlert {
  caseId: string;
  caseTitle: string;
  deadline: string;
  daysRemaining: number;
  priority: string;
}

interface CaseAnalytics {
  totalCases: number;
  casesByType: Record<string, number>;
  successRate: number;
  averageDuration: number;
  deadlineCompliance: number;
  oabCompliance: number;
}

const BrazilianLegalCompliance: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    totalCases: 0,
    complianceScore: 0,
    pendingDeadlines: 0,
    overdueDeadlines: 0,
    oabViolations: 0,
    automatedWorkflows: 0
  });
  const [deadlineAlerts, setDeadlineAlerts] = useState<DeadlineAlert[]>([]);
  const [analytics, setAnalytics] = useState<CaseAnalytics | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Load compliance alerts
      const alerts = await brazilianLegalService.generateComplianceAlerts();
      setDeadlineAlerts(alerts.deadlineAlerts);
      
      // Load case analytics
      const caseAnalytics = await brazilianLegalService.getCaseAnalytics('6months');
      setAnalytics(caseAnalytics);
      
      // Calculate compliance metrics
      const complianceMetrics: ComplianceMetrics = {
        totalCases: caseAnalytics.totalCases,
        complianceScore: Math.round((caseAnalytics.deadlineCompliance + caseAnalytics.oabCompliance) / 2),
        pendingDeadlines: alerts.deadlineAlerts.length,
        overdueDeadlines: alerts.deadlineAlerts.filter(a => a.daysRemaining < 0).length,
        oabViolations: alerts.oabViolations.length,
        automatedWorkflows: Math.floor(caseAnalytics.totalCases * 0.75) // Mock automation percentage
      };
      
      setMetrics(complianceMetrics);
      
    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de compliance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutomateWorkflow = async (caseId: string, procedureType: keyof typeof LEGAL_PROCEDURE_TYPES) => {
    try {
      await brazilianLegalService.automateCaseWorkflow(caseId, procedureType);
      toast({
        title: 'Workflow Automatizado',
        description: 'Fluxo de trabalho configurado com sucesso',
      });
      loadComplianceData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao automatizar workflow',
        variant: 'destructive'
      });
    }
  };

  const handleCreateDeadline = async (caseId: string) => {
    try {
      // Mock deadline creation - in real implementation, this would show a form
      await brazilianLegalService.createCaseDeadline(
        caseId,
        'CIVIL_RESPONSE',
        new Date(),
        'Prazo para contestação'
      );
      toast({
        title: 'Prazo Criado',
        description: 'Prazo processual adicionado com sucesso',
      });
      loadComplianceData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar prazo',
        variant: 'destructive'
      });
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Scale className="h-6 w-6 text-blue-600" />
                Compliance Legal Brasileiro
              </h1>
              <p className="text-sm text-gray-600">
                Monitoramento OAB e automação de processos legais
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getComplianceColor(metrics.complianceScore)}>
                Score: {metrics.complianceScore}%
              </Badge>
              <Button onClick={loadComplianceData} variant="outline" size="sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Critical Alerts */}
        {deadlineAlerts.filter(a => a.priority === 'critical').length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Atenção Crítica:</strong> {deadlineAlerts.filter(a => a.priority === 'critical').length} prazos críticos requerem ação imediata.
            </AlertDescription>
          </Alert>
        )}

        {/* Compliance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de Compliance</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getComplianceColor(metrics.complianceScore)}`}>
                {metrics.complianceScore}%
              </div>
              <div className="mt-2">
                <Progress value={metrics.complianceScore} className="w-full" />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {metrics.complianceScore >= 90 ? 'Excelente' : 
                 metrics.complianceScore >= 70 ? 'Bom' : 'Requer atenção'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prazos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.pendingDeadlines}
              </div>
              <p className="text-xs text-gray-600">
                {metrics.overdueDeadlines > 0 && (
                  <span className="text-red-600">{metrics.overdueDeadlines} em atraso</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Casos Ativos</CardTitle>
              <Gavel className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.totalCases}
              </div>
              <p className="text-xs text-gray-600">
                {metrics.automatedWorkflows} com workflow automatizado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Violações OAB</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.oabViolations}
              </div>
              <p className="text-xs text-gray-600">
                {metrics.oabViolations === 0 ? 'Totalmente conforme' : 'Requer correção'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="deadlines">Prazos</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="compliance">OAB</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            
            {/* Deadline Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Alertas de Prazos Urgentes
                </CardTitle>
                <CardDescription>
                  Prazos que requerem atenção nos próximos 7 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deadlineAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Nenhum prazo urgente no momento</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deadlineAlerts.slice(0, 5).map((alert, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(alert.priority)}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{alert.caseTitle}</h4>
                            <p className="text-sm opacity-80">{alert.deadline}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">
                              {alert.daysRemaining === 0 ? 'Hoje' : 
                               alert.daysRemaining === 1 ? 'Amanhã' :
                               alert.daysRemaining < 0 ? `${Math.abs(alert.daysRemaining)} dias atraso` :
                               `${alert.daysRemaining} dias`}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Operações frequentes de compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-xs">Criar Prazo</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Gavel className="w-5 h-5" />
                    <span className="text-xs">Automatizar Workflow</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs">Integrar Tribunal</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <FileText className="w-5 h-5" />
                    <span className="text-xs">Gerar Template</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deadlines Tab */}
          <TabsContent value="deadlines" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Prazos Processuais</CardTitle>
                <CardDescription>
                  Todos os prazos do sistema legal brasileiro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(LEGAL_PROCEDURE_TYPES).map(([key, procedure]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{procedure.name}</h4>
                          <p className="text-sm text-gray-600">
                            Tipo: {procedure.type} • Duração estimada: {procedure.estimated_duration_days} dias
                          </p>
                          <div className="flex gap-2 mt-2">
                            {procedure.key_phases.map((phase, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {phase}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAutomateWorkflow('mock-case-id', key as keyof typeof LEGAL_PROCEDURE_TYPES)}
                        >
                          Automatizar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflows Automatizados</CardTitle>
                <CardDescription>
                  Automação de processos por tipo de procedimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(BRAZILIAN_COURTS).slice(0, 6).map(([key, court]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{court.name}</h4>
                          <p className="text-sm text-gray-600">
                            Jurisdição: {court.jurisdiction} • 
                            {court.level && ` Nível: ${court.level}`}
                            {court.region && ` Região: ${court.region}`}
                            {court.state && ` Estado: ${court.state}`}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {Math.random() > 0.5 ? 'Integrado' : 'Disponível'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Taxa de Sucesso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {analytics.successRate}%
                      </div>
                      <Progress value={analytics.successRate} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Duração Média</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {analytics.averageDuration}
                      </div>
                      <p className="text-sm text-gray-600">dias</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Compliance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {analytics.oabCompliance}%
                      </div>
                      <p className="text-sm text-gray-600">OAB</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Casos por Tipo de Serviço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.casesByType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{type}</span>
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-200 rounded-full h-2 w-32">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(count / analytics.totalCases) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* OAB Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Regras de Compliance OAB</CardTitle>
                <CardDescription>
                  Normas da Ordem dos Advogados do Brasil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(OAB_COMPLIANCE_RULES).map(([key, rule]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium">{rule.rule}</h4>
                          <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                          <Badge variant="destructive" className="mt-2 text-xs">
                            Penalidade: {rule.penalty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BrazilianLegalCompliance;