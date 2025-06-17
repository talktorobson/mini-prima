import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  AlertTriangle, 
  FileText, 
  Users,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { calendarService, CalendarEventWithDetails, DeadlineAlert, StatuteLimitationsAlert } from '@/services/calendarService';
import { useToast } from '@/hooks/use-toast';
import { CalendarEventForm } from '@/components/calendar/CalendarEventForm';
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView';
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView';
import { CalendarDayView } from '@/components/calendar/CalendarDayView';
import { DeadlinesList } from '@/components/calendar/DeadlinesList';
import { StatuteLimitationsList } from '@/components/calendar/StatuteLimitationsList';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';

export default function Calendar() {
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEventWithDetails[]>([]);
  const [deadlineAlerts, setDeadlineAlerts] = useState<DeadlineAlert[]>([]);
  const [statuteAlerts, setStatuteAlerts] = useState<StatuteLimitationsAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithDetails | null>(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadCalendarData();
    loadAlerts();
  }, [selectedDate, viewType, filters]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      let eventsData: CalendarEventWithDetails[] = [];
      
      if (viewType === 'month') {
        const { events: monthEvents } = await calendarService.getMonthView(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1
        );
        eventsData = monthEvents;
      } else if (viewType === 'week') {
        const { events: weekEvents } = await calendarService.getWeekView(
          selectedDate.toISOString().split('T')[0]
        );
        eventsData = weekEvents;
      } else {
        eventsData = await calendarService.getDayView(
          selectedDate.toISOString().split('T')[0]
        );
      }
      
      setEvents(eventsData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar eventos do calendário',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const [deadlines, statutes] = await Promise.all([
        calendarService.getUpcomingDeadlines(30),
        calendarService.getStatuteLimitationsAlerts(),
      ]);
      
      setDeadlineAlerts(deadlines);
      setStatuteAlerts(statutes);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const handleEventCreated = () => {
    loadCalendarData();
    setShowEventForm(false);
    setSelectedEvent(null);
  };

  const handleEventUpdated = () => {
    loadCalendarData();
    setSelectedEvent(null);
  };

  const handleEventClick = (event: CalendarEventWithDetails) => {
    setSelectedEvent(event);
    setShowEventForm(true);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  const formatDateHeader = () => {
    if (viewType === 'month') {
      return selectedDate.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
    } else if (viewType === 'week') {
      const weekStart = new Date(selectedDate);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } else {
      return selectedDate.toLocaleDateString('pt-BR', { 
        weekday: 'long',
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  const criticalAlertsCount = deadlineAlerts.filter(alert => alert.risk_level === 'critical').length +
                             statuteAlerts.filter(alert => alert.risk_level === 'critical').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendário e Prazos</h1>
          <p className="text-gray-600">
            Gestão de datas, prazos legais e compliance brasileiro
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowEventForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Critical Alerts Bar */}
      {criticalAlertsCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {criticalAlertsCount} prazo{criticalAlertsCount > 1 ? 's' : ''} crítico{criticalAlertsCount > 1 ? 's' : ''}
              </span>
              <Badge variant="destructive" className="ml-2">
                Atenção Urgente
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="deadlines">
            <Clock className="h-4 w-4 mr-2" />
            Prazos
          </TabsTrigger>
          <TabsTrigger value="statutes">
            <FileText className="h-4 w-4 mr-2" />
            Prescrição
          </TabsTrigger>
          <TabsTrigger value="courts">
            <Users className="h-4 w-4 mr-2" />
            Tribunais
          </TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          {/* Calendar Controls */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-lg font-semibold min-w-[200px] text-center">
                      {formatDateHeader()}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Hoje
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex border rounded-lg overflow-hidden">
                    <Button
                      variant={viewType === 'month' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('month')}
                      className="rounded-none"
                    >
                      Mês
                    </Button>
                    <Button
                      variant={viewType === 'week' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('week')}
                      className="rounded-none"
                    >
                      Semana
                    </Button>
                    <Button
                      variant={viewType === 'day' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('day')}
                      className="rounded-none"
                    >
                      Dia
                    </Button>
                  </div>
                  
                  <CalendarFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {viewType === 'month' && (
                    <CalendarMonthView
                      events={events}
                      selectedDate={selectedDate}
                      onEventClick={handleEventClick}
                      onDateClick={setSelectedDate}
                    />
                  )}
                  {viewType === 'week' && (
                    <CalendarWeekView
                      events={events}
                      selectedDate={selectedDate}
                      onEventClick={handleEventClick}
                    />
                  )}
                  {viewType === 'day' && (
                    <CalendarDayView
                      events={events}
                      selectedDate={selectedDate}
                      onEventClick={handleEventClick}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines" className="space-y-4">
          <DeadlinesList
            alerts={deadlineAlerts}
            onRefresh={loadAlerts}
          />
        </TabsContent>

        {/* Statute of Limitations Tab */}
        <TabsContent value="statutes" className="space-y-4">
          <StatuteLimitationsList
            alerts={statuteAlerts}
            onRefresh={loadAlerts}
          />
        </TabsContent>

        {/* Courts Tab */}
        <TabsContent value="courts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tribunais Brasileiros</CardTitle>
              <CardDescription>
                Informações sobre tribunais e sua jurisdição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calendarService.getBrazilianCourts().map((court) => (
                  <div key={court.code} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{court.name}</h3>
                      <p className="text-sm text-gray-600">Código: {court.code}</p>
                    </div>
                    <Badge variant="outline">
                      {court.jurisdiction === 'state' && 'Estadual'}
                      {court.jurisdiction === 'federal' && 'Federal'}
                      {court.jurisdiction === 'labor' && 'Trabalhista'}
                      {court.jurisdiction === 'constitutional' && 'Constitucional'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {selectedEvent ? 'Editar Evento' : 'Novo Evento'}
              </CardTitle>
              <CardDescription>
                {selectedEvent ? 'Edite as informações do evento' : 'Crie um novo evento no calendário'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarEventForm
                event={selectedEvent}
                onSubmit={selectedEvent ? handleEventUpdated : handleEventCreated}
                onCancel={() => {
                  setShowEventForm(false);
                  setSelectedEvent(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}