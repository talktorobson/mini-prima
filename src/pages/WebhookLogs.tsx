import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Webhook, 
  RefreshCw, 
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download,
  Code,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  event_data: any;
  processed: boolean;
  processed_at?: string;
  processing_attempts: number;
  last_processing_error?: string;
  api_version: string;
  request_id?: string;
  event_created_at: string;
  received_at: string;
}

export default function WebhookLogs() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<WebhookEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    event_type: '',
    status: '',
    date_range: '7', // days
  });

  useEffect(() => {
    loadWebhookEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const loadWebhookEvents = async () => {
    try {
      setLoading(true);
      
      // Mock webhook events data
      const mockEvents: WebhookEvent[] = [
        {
          id: '1',
          stripe_event_id: 'evt_1234567890',
          event_type: 'payment_intent.succeeded',
          event_data: {
            object: {
              id: 'pi_1234567890',
              amount: 29900,
              currency: 'brl',
              status: 'succeeded'
            }
          },
          processed: true,
          processed_at: new Date(Date.now() - 60000).toISOString(),
          processing_attempts: 1,
          api_version: '2023-10-16',
          request_id: 'req_123',
          event_created_at: new Date(Date.now() - 120000).toISOString(),
          received_at: new Date(Date.now() - 90000).toISOString(),
        },
        {
          id: '2',
          stripe_event_id: 'evt_0987654321',
          event_type: 'customer.subscription.updated',
          event_data: {
            object: {
              id: 'sub_0987654321',
              status: 'active',
              current_period_end: 1698796800
            }
          },
          processed: true,
          processed_at: new Date(Date.now() - 3600000).toISOString(),
          processing_attempts: 1,
          api_version: '2023-10-16',
          request_id: 'req_456',
          event_created_at: new Date(Date.now() - 3660000).toISOString(),
          received_at: new Date(Date.now() - 3630000).toISOString(),
        },
        {
          id: '3',
          stripe_event_id: 'evt_5555555555',
          event_type: 'payment_intent.payment_failed',
          event_data: {
            object: {
              id: 'pi_5555555555',
              amount: 15000,
              currency: 'brl',
              status: 'requires_payment_method',
              last_payment_error: {
                code: 'card_declined',
                message: 'Your card was declined.'
              }
            }
          },
          processed: false,
          processing_attempts: 3,
          last_processing_error: 'Payment method validation failed',
          api_version: '2023-10-16',
          request_id: 'req_789',
          event_created_at: new Date(Date.now() - 7200000).toISOString(),
          received_at: new Date(Date.now() - 7170000).toISOString(),
        },
        {
          id: '4',
          stripe_event_id: 'evt_9999999999',
          event_type: 'invoice.payment_succeeded',
          event_data: {
            object: {
              id: 'in_9999999999',
              amount_paid: 59900,
              currency: 'brl',
              status: 'paid'
            }
          },
          processed: true,
          processed_at: new Date(Date.now() - 86400000).toISOString(),
          processing_attempts: 1,
          api_version: '2023-10-16',
          event_created_at: new Date(Date.now() - 86460000).toISOString(),
          received_at: new Date(Date.now() - 86430000).toISOString(),
        },
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar logs de webhooks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(event => 
        event.stripe_event_id.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.event_type.toLowerCase().includes(filters.search.toLowerCase()) ||
        (event.request_id && event.request_id.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Event type filter
    if (filters.event_type) {
      filtered = filtered.filter(event => event.event_type === filters.event_type);
    }

    // Status filter
    if (filters.status) {
      if (filters.status === 'processed') {
        filtered = filtered.filter(event => event.processed);
      } else if (filters.status === 'failed') {
        filtered = filtered.filter(event => !event.processed && event.processing_attempts > 0);
      } else if (filters.status === 'pending') {
        filtered = filtered.filter(event => !event.processed && event.processing_attempts === 0);
      }
    }

    // Date range filter
    if (filters.date_range) {
      const days = parseInt(filters.date_range);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(event => new Date(event.received_at) >= cutoffDate);
    }

    // Sort by received date (newest first)
    filtered.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());

    setFilteredEvents(filtered);
  };

  const getStatusBadge = (event: WebhookEvent) => {
    if (event.processed) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Processado
        </Badge>
      );
    } else if (event.processing_attempts > 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Falhou ({event.processing_attempts}x)
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pendente
        </Badge>
      );
    }
  };

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes('succeeded') || eventType.includes('updated')) {
      return 'text-green-600';
    } else if (eventType.includes('failed') || eventType.includes('canceled')) {
      return 'text-red-600';
    } else if (eventType.includes('created') || eventType.includes('pending')) {
      return 'text-blue-600';
    }
    return 'text-gray-600';
  };

  const formatEventType = (eventType: string) => {
    return eventType.split('.').map(part => 
      part.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    ).join(' - ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const exportLogs = () => {
    const dataToExport = filteredEvents.map(event => ({
      stripe_event_id: event.stripe_event_id,
      event_type: event.event_type,
      processed: event.processed,
      processing_attempts: event.processing_attempts,
      last_processing_error: event.last_processing_error,
      api_version: event.api_version,
      received_at: event.received_at,
      processed_at: event.processed_at,
    }));
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhook-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Sucesso',
      description: 'Logs exportados com sucesso',
    });
  };

  const eventTypes = Array.from(new Set(events.map(e => e.event_type))).sort();
  const processedCount = events.filter(e => e.processed).length;
  const failedCount = events.filter(e => !e.processed && e.processing_attempts > 0).length;
  const pendingCount = events.filter(e => !e.processed && e.processing_attempts === 0).length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Logs de Webhooks</h1>
          </div>
          <Badge variant="outline">Stripe Integration</Badge>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={loadWebhookEvents} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              Últimos {filters.date_range} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{processedCount}</div>
            <p className="text-xs text-muted-foreground">
              {events.length > 0 ? ((processedCount / events.length) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falharam</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <p className="text-xs text-muted-foreground">
              {events.length > 0 ? ((failedCount / events.length) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {events.length > 0 ? ((pendingCount / events.length) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
          <CardDescription>Filtre os eventos por tipo, status ou período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ID do evento, tipo..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="event_type">Tipo de Evento</Label>
              <Select value={filters.event_type} onValueChange={(value) => setFilters(prev => ({ ...prev, event_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatEventType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="processed">Processados</SelectItem>
                  <SelectItem value="failed">Falharam</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_range">Período</Label>
              <Select value={filters.date_range} onValueChange={(value) => setFilters(prev => ({ ...prev, date_range: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Último dia</SelectItem>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos ({filteredEvents.length})</CardTitle>
          <CardDescription>Lista de todos os eventos de webhook recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum evento encontrado</h3>
              <p className="text-gray-500">Tente ajustar os filtros ou aguarde novos eventos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">{event.stripe_event_id}</code>
                          {getStatusBadge(event)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-sm font-medium ${getEventTypeColor(event.event_type)}`}>
                            {formatEventType(event.event_type)}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(event.received_at)}
                          </span>
                          {event.request_id && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <code className="text-xs text-gray-500">{event.request_id}</code>
                            </>
                          )}
                        </div>
                        
                        {event.last_processing_error && (
                          <Alert className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              <strong>Erro:</strong> {event.last_processing_error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {event.processing_attempts > 1 && (
                        <Badge variant="outline" className="text-orange-600">
                          {event.processing_attempts} tentativas
                        </Badge>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Detalhes do Evento
                  </CardTitle>
                  <CardDescription>ID: {selectedEvent.stripe_event_id}</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo do Evento</Label>
                  <div className={`font-medium ${getEventTypeColor(selectedEvent.event_type)}`}>
                    {formatEventType(selectedEvent.event_type)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedEvent)}</div>
                </div>
                
                <div className="space-y-2">
                  <Label>Recebido em</Label>
                  <div className="text-sm">{formatDate(selectedEvent.received_at)}</div>
                </div>
                
                <div className="space-y-2">
                  <Label>Processado em</Label>
                  <div className="text-sm">
                    {selectedEvent.processed_at ? formatDate(selectedEvent.processed_at) : 'Não processado'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Versão da API</Label>
                  <div className="text-sm">{selectedEvent.api_version}</div>
                </div>
                
                <div className="space-y-2">
                  <Label>Tentativas de Processamento</Label>
                  <div className="text-sm">{selectedEvent.processing_attempts}</div>
                </div>
              </div>
              
              {selectedEvent.last_processing_error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Último Erro:</strong> {selectedEvent.last_processing_error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label>Dados do Evento</Label>
                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs">
                    {JSON.stringify(selectedEvent.event_data, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}