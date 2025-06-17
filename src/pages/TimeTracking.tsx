import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, Square, Plus, Calendar, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
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
          <TimeEntriesList
            entries={timeEntries}
            loading={loading}
            onEntryUpdated={handleEntryUpdated}
            onRefresh={loadTimeEntries}
          />
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