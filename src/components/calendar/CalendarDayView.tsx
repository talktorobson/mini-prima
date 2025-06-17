import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarEventWithDetails } from '@/services/calendarService';
import { Clock, MapPin, Users, AlertTriangle, FileText } from 'lucide-react';

interface CalendarDayViewProps {
  events: CalendarEventWithDetails[];
  selectedDate: Date;
  onEventClick: (event: CalendarEventWithDetails) => void;
}

export function CalendarDayView({ events, selectedDate, onEventClick }: CalendarDayViewProps) {
  // Filter events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.start_date);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  // Separate all-day and timed events
  const allDayEvents = dayEvents.filter(event => event.all_day);
  const timedEvents = dayEvents.filter(event => !event.all_day && event.start_time);
  const noTimeEvents = dayEvents.filter(event => !event.all_day && !event.start_time);

  // Sort timed events by start time
  const sortedTimedEvents = timedEvents.sort((a, b) => {
    const timeA = a.start_time || '00:00';
    const timeB = b.start_time || '00:00';
    return timeA.localeCompare(timeB);
  });

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'court_hearing': return '⚖️';
      case 'deadline': return '⏰';
      case 'appointment': return '📅';
      case 'meeting': return '👥';
      case 'task': return '✅';
      case 'reminder': return '🔔';
      default: return '📋';
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'court_hearing': return 'border-red-200 bg-red-50';
      case 'deadline': return 'border-orange-200 bg-orange-50';
      case 'appointment': return 'border-blue-200 bg-blue-50';
      case 'meeting': return 'border-cyan-200 bg-cyan-50';
      case 'task': return 'border-green-200 bg-green-50';
      case 'reminder': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatEventTime = (event: CalendarEventWithDetails) => {
    if (event.all_day) return 'Dia inteiro';
    if (!event.start_time) return 'Sem horário';
    
    let timeStr = event.start_time.slice(0, 5);
    if (event.end_time) {
      timeStr += ` - ${event.end_time.slice(0, 5)}`;
    }
    return timeStr;
  };

  const EventCard = ({ event }: { event: CalendarEventWithDetails }) => (
    <Card 
      className={`
        cursor-pointer transition-all hover:shadow-md
        ${getEventTypeColor(event.event_type)}
      `}
      onClick={() => onEventClick(event)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getEventTypeIcon(event.event_type)}</span>
            <CardTitle className="text-lg">{event.title}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge variant={getPriorityColor(event.priority)}>
              {event.priority === 'critical' && 'Crítico'}
              {event.priority === 'high' && 'Alto'}
              {event.priority === 'medium' && 'Médio'}
              {event.priority === 'low' && 'Baixo'}
            </Badge>
            {event.is_legal_deadline && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Prazo Legal
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{formatEventTime(event)}</span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
            {event.location_address && (
              <span className="text-xs">({event.location_address})</span>
            )}
          </div>
        )}

        {/* Court Information */}
        {event.court_name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{event.court_name}</span>
            {event.process_number && (
              <span className="font-mono text-xs">({event.process_number})</span>
            )}
          </div>
        )}

        {/* Case and Client */}
        {(event.case || event.client) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <div>
              {event.case && (
                <span className="font-medium">{event.case.case_number}</span>
              )}
              {event.case && event.client && <span> - </span>}
              {event.client && (
                <span>{event.client.company_name}</span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-700 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Legal Deadline Info */}
        {event.is_legal_deadline && event.consequence_of_missing && (
          <div className="bg-red-50 border border-red-200 p-2 rounded text-sm">
            <span className="font-medium text-red-800">Consequências: </span>
            <span className="text-red-700">{event.consequence_of_missing}</span>
          </div>
        )}

        {/* Travel Time */}
        {event.travel_time_minutes && (
          <div className="text-xs text-gray-500">
            ⏱️ Tempo de deslocamento: {event.travel_time_minutes} min
          </div>
        )}

        {/* Preparation Required */}
        {event.requires_preparation && (
          <div className="text-xs text-orange-600">
            🔧 Requer preparação prévia
            {event.preparation_time_hours && (
              <span> ({event.preparation_time_hours}h)</span>
            )}
          </div>
        )}

        {/* Status */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">
            Status: <span className="capitalize">{event.status}</span>
          </span>
          {event.staff && (
            <span className="text-gray-500">
              Responsável: {event.staff.name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="calendar-day-view space-y-6">
      {/* Date Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {selectedDate.toLocaleDateString('pt-BR', { 
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </h2>
        {isToday && (
          <Badge variant="default" className="mt-2">
            Hoje
          </Badge>
        )}
      </div>

      {/* Events Summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{dayEvents.length}</div>
          <div className="text-sm text-blue-800">Total de Eventos</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {dayEvents.filter(e => e.is_legal_deadline).length}
          </div>
          <div className="text-sm text-red-800">Prazos Legais</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {dayEvents.filter(e => e.priority === 'critical' || e.priority === 'high').length}
          </div>
          <div className="text-sm text-orange-800">Alta Prioridade</div>
        </div>
      </div>

      {/* No Events Message */}
      {dayEvents.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="text-gray-400 text-lg mb-2">📅</div>
            <p className="text-gray-600">Nenhum evento agendado para este dia</p>
          </CardContent>
        </Card>
      )}

      {/* All-day Events */}
      {allDayEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Eventos de Dia Inteiro
          </h3>
          {allDayEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Timed Events */}
      {sortedTimedEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Eventos com Horário
          </h3>
          {sortedTimedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Events without time */}
      {noTimeEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Eventos sem Horário Específico
          </h3>
          {noTimeEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}