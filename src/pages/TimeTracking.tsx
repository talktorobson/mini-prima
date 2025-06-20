import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, Square, Plus, Calendar, DollarSign, CheckCircle, AlertCircle, Download, Search, Users } from 'lucide-react';
import { timeTrackingService, TimerSession, TimeEntryWithDetails, TimeTrackingSummary } from '@/services/timeTrackingService';
import { useToast } from '@/hooks/use-toast';
import { TimeEntryForm } from '@/components/time-tracking/TimeEntryForm';
import { ActiveTimerWidget } from '@/components/time-tracking/ActiveTimerWidget';
import { TimeEntriesList } from '@/components/time-tracking/TimeEntriesList';
import { TimeSummaryCards } from '@/components/time-tracking/TimeSummaryCards';
import { BillingRatesManager } from '@/components/time-tracking/BillingRatesManager';

function TimeTracking() {
  const { toast } = useToast();
  const [activeTimer, setActiveTimer] = useState<TimerSession | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithDetails[]>([]);
  const [summary, setSummary] = useState<TimeTrackingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState('timer');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Polling for active timer updates
  useEffect(() => {
    const fetchActiveTimer = async () => {
      try {
        const timer = await timeTrackingService.getActiveTimer();
        setActiveTimer(timer);
      } catch (error) {
        console.error('Error fetching active timer:', error);
      }
    };

    fetchActiveTimer();
    const interval = setInterval(fetchActiveTimer, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Load time entries and summary
  useEffect(() => {
    loadTimeEntries();
    loadSummary();
  }, []);

  const loadTimeEntries = async () => {
    try {
      setLoading(true);
      const { entries } = await timeTrackingService.getTimeEntries({
        limit: 50,
        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      });
      setTimeEntries(entries);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar registros de tempo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await timeTrackingService.getTimeTrackingSummary({
        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        date_to: new Date().toISOString(),
      });
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleTimerStart = async (data: {
    case_id?: string;
    client_id?: string;
    description: string;
    task_type: string;
  }) => {
    try {
      await timeTrackingService.startTimer(data);
      const timer = await timeTrackingService.getActiveTimer();
      setActiveTimer(timer);
      toast({
        title: 'Timer Iniciado',
        description: 'O cronômetro foi iniciado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao iniciar o cronômetro',
        variant: 'destructive',
      });
    }
  };

  const handleTimerStop = async (description?: string) => {
    try {
      await timeTrackingService.stopActiveTimer(description);
      setActiveTimer(null);
      loadTimeEntries();
      loadSummary();
      toast({
        title: 'Timer Parado',
        description: 'Tempo registrado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao parar o cronômetro',
        variant: 'destructive',
      });
    }
  };

  const handleEntryCreated = () => {
    loadTimeEntries();
    loadSummary();
    setShowNewEntryForm(false);
  };

  const handleEntryUpdated = () => {
    loadTimeEntries();
    loadSummary();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'submitted':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'billed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const exportTimeEntriesToCSV = async () => {
    try {
      // Convert time entries to CSV format
      const headers = ['Data', 'Cliente', 'Projeto', 'Descrição', 'Duração (h)', 'Taxa (R$)', 'Total (R$)', 'Status'];
      const csvData = timeEntries.map(entry => [
        new Date(entry.created_at).toLocaleDateString('pt-BR'),
        entry.client?.company_name || 'N/A',
        entry.project_name || 'N/A',
        entry.description,
        (entry.duration_minutes / 60).toFixed(2),
        entry.hourly_rate ? `R$ ${entry.hourly_rate.toFixed(2)}` : 'N/A',
        entry.total_amount ? `R$ ${entry.total_amount.toFixed(2)}` : 'N/A',
        entry.status
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-tempo-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Sucesso',
        description: 'Relatório exportado com sucesso',
      });
    } catch (error) {
      console.error('Error exporting time entries:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar relatório',
        variant: 'destructive',
      });
    }
  };

  const exportTimeentriesToExcel = async () => {
    try {
      // For now, we'll export as CSV since it's more universally supported
      // In a full implementation, you'd use a library like xlsx
      await exportTimeEntriesToCSV();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar para Excel',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Use the real search functionality from the service
      const searchResults = await timeTrackingService.searchTimeTrackingData(term, {
        date_from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Last 90 days
      });

      // Transform search results into display format
      const displayResults = [
        // Time Entries
        ...searchResults.timeEntries.map(entry => ({
          type: 'time_entry',
          title: `${entry.description.substring(0, 50)}${entry.description.length > 50 ? '...' : ''}`,
          description: `Cliente: ${entry.client?.company_name || 'N/A'} - ${(entry.duration_minutes / 60).toFixed(2)}h - ${entry.task_type}`,
          amount: entry.total_amount || 0,
          status: entry.status,
          date: entry.created_at,
          id: entry.id
        })),
        
        // Active Timers
        ...searchResults.activeTimers.map(timer => ({
          type: 'active_timer',
          title: `Timer: ${timer.description.substring(0, 40)}${timer.description.length > 40 ? '...' : ''}`,
          description: `Cliente: ${timer.client?.company_name || 'N/A'} - ${timer.task_type} (Em execução)`,
          amount: null,
          status: 'running',
          date: timer.started_at,
          id: timer.id
        })),
        
        // Billing Rates
        ...searchResults.billingRates.map(rate => ({
          type: 'billing_rate',
          title: `Taxa: ${rate.task_type}`,
          description: `${rate.staff?.full_name || 'N/A'} - ${rate.description || 'Configuração de valor por hora'}`,
          amount: rate.hourly_rate,
          status: 'active',
          date: rate.created_at,
          id: rate.id
        })),
        
        // Clients
        ...searchResults.clients.map(client => ({
          type: 'client',
          title: `Cliente: ${client.company_name}`,
          description: `Contato: ${client.contact_person}`,
          amount: null,
          status: 'active',
          date: new Date().toISOString(),
          id: client.id
        })),
        
        // Cases
        ...searchResults.cases.map(caseItem => ({
          type: 'case',
          title: `Caso: ${caseItem.case_number}`,
          description: caseItem.case_title,
          amount: null,
          status: 'active',
          date: new Date().toISOString(),
          id: caseItem.id
        }))
      ];

      setSearchResults(displayResults);
    } catch (error) {
      console.error('Error searching time tracking records:', error);
      setSearchResults([]);
      toast({
        title: 'Erro na busca',
        description: 'Erro ao pesquisar registros. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controle de Tempo</h1>
          <p className="text-gray-600">
            Gerencie suas horas trabalhadas e registros de tempo
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowNewEntryForm(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registro Manual
          </Button>
        </div>
      </div>

      {/* Smart Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Busca Inteligente
          </CardTitle>
          <CardDescription>
            Pesquise rapidamente em registros de tempo, clientes e projetos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="search-input" className="sr-only">
                Termo de pesquisa
              </Label>
              <Input
                id="search-input"
                placeholder="Digite para buscar registros de tempo, clientes ou projetos..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            {searchTerm && (
              <Button variant="outline" onClick={clearSearch}>
                Limpar
              </Button>
            )}
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-gray-700">
                Resultados ({searchResults.length})
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer border"
                    onClick={() => {
                      // In a real implementation, this would navigate to the specific record
                      console.log('Navigate to:', result);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        result.type === 'time_entry' ? 'bg-blue-100' :
                        result.type === 'active_timer' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        {result.type === 'time_entry' ? (
                          <Clock className="w-4 h-4 text-blue-600" />
                        ) : result.type === 'active_timer' ? (
                          <Play className="w-4 h-4 text-green-600" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {result.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {result.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {result.amount && result.amount > 0 && (
                        <p className="text-sm font-medium">
                          R$ {result.amount.toFixed(2)}
                        </p>
                      )}
                      <Badge variant={
                        result.status === 'approved' ? 'default' :
                        result.status === 'submitted' ? 'secondary' :
                        result.status === 'running' ? 'outline' : 'secondary'
                      } className="text-xs">
                        {result.status === 'approved' ? 'Aprovado' :
                         result.status === 'submitted' ? 'Enviado' :
                         result.status === 'running' ? 'Executando' :
                         result.status === 'active' ? 'Ativo' : result.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {searchTerm && searchResults.length === 0 && (
            <div className="mt-4 text-center py-6 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum resultado encontrado para "{searchTerm}"</p>
              <p className="text-xs">Tente palavras-chave diferentes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Timer Widget */}
      {activeTimer && (
        <ActiveTimerWidget
          timer={activeTimer}
          onStop={handleTimerStop}
        />
      )}

      {/* Summary Cards */}
      {summary && (
        <TimeSummaryCards summary={summary} />
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timer">
            <Clock className="h-4 w-4 mr-2" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="entries">
            <Calendar className="h-4 w-4 mr-2" />
            Registros
          </TabsTrigger>
          <TabsTrigger value="rates">
            <DollarSign className="h-4 w-4 mr-2" />
            Valores
          </TabsTrigger>
          <TabsTrigger value="reports">
            <CheckCircle className="h-4 w-4 mr-2" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Iniciar Novo Timer</CardTitle>
              <CardDescription>
                Inicie o cronômetro para uma nova atividade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimeEntryForm
                mode="timer"
                onSubmit={handleTimerStart}
                onCancel={() => {}}
                disabled={!!activeTimer}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Tempo</CardTitle>
                  <CardDescription>
                    Histórico completo de registros de tempo
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportTimeEntriesToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportTimeentriesToExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TimeEntriesList
                entries={timeEntries}
                loading={loading}
                onEntryUpdated={handleEntryUpdated}
                onRefresh={loadTimeEntries}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <BillingRatesManager />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Tempo</CardTitle>
              <CardDescription>
                Análises detalhadas do tempo trabalhado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Relatórios detalhados em desenvolvimento</p>
                <p className="text-sm">
                  Em breve: relatórios por período, cliente e tipo de atividade
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Entry Form Modal */}
      {showNewEntryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Novo Registro de Tempo</CardTitle>
              <CardDescription>
                Adicione um registro manual de tempo trabalhado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimeEntryForm
                mode="manual"
                onSubmit={async (data) => {
                  try {
                    await timeTrackingService.createTimeEntry(data);
                    handleEntryCreated();
                    toast({
                      title: 'Sucesso',
                      description: 'Registro de tempo criado com sucesso',
                    });
                  } catch (error) {
                    toast({
                      title: 'Erro',
                      description: 'Erro ao criar registro de tempo',
                      variant: 'destructive',
                    });
                  }
                }}
                onCancel={() => setShowNewEntryForm(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default TimeTracking;