import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarEventWithDetails } from '@/services/calendarService';

interface CalendarWeekViewProps {
  events: CalendarEventWithDetails[];
  selectedDate: Date;
  onEventClick: (event: CalendarEventWithDetails) => void;
}

export function CalendarWeekView({ events, selectedDate, onEventClick }: CalendarWeekViewProps) {
  // Calculate week start (Monday)
  const weekStart = new Date(selectedDate);
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  // Generate week days
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    weekDays.push(date);
  }

  // Generate time slots (6 AM to 10 PM)
  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    timeSlots.push(hour);
  }

  const getEventsForDateTime = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      if (eventDate.toDateString() !== date.toDateString()) return false;

      if (event.all_day) return hour === 6; // Show all-day events at 6 AM slot

      if (event.start_time) {
        const eventHour = parseInt(event.start_time.split(':')[0]);
        return eventHour === hour;
      }

      return false;
    });
  };

  const getAllDayEvents = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.toDateString() === date.toDateString() && event.all_day;
    });
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'court_hearing': return 'bg-red-500 text-white';
      case 'deadline': return 'bg-orange-500 text-white';
      case 'appointment': return 'bg-blue-500 text-white';
      case 'meeting': return 'bg-cyan-500 text-white';
      case 'task': return 'bg-green-500 text-white';
      case 'reminder': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  return (
    <div className="calendar-week-view">
      {/* Week Header */}
      <div className="grid grid-cols-8 gap-1 mb-4">
        <div className="p-2"></div> {/* Empty corner for time column */}
        {weekDays.map((date, index) => (
          <div 
            key={index} 
            className={`
              p-2 text-center border rounded-lg
              ${isToday(date) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}
            `}
          >
            <div className="font-medium text-sm">
              {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
            </div>
            <div className={`
              text-lg font-bold
              ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}
            `}>
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* All-day events section */}
      <div className="grid grid-cols-8 gap-1 mb-4">
        <div className="p-2 text-right text-sm text-gray-600 font-medium">
          Dia inteiro
        </div>
        {weekDays.map((date, index) => {
          const allDayEvents = getAllDayEvents(date);
          return (
            <div key={index} className="p-1 min-h-[40px] border rounded-lg bg-gray-50">
              {allDayEvents.map((event) => (
                <Button
                  key={event.id}
                  variant="ghost"
                  size="sm"
                  className={`
                    w-full h-auto p-1 mb-1 text-left text-xs
                    ${getEventTypeColor(event.event_type)}
                    hover:opacity-80
                  `}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate flex-1">{event.title}</span>
                    {event.is_legal_deadline && (
                      <span className="text-white">⚖️</span>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-8 gap-1">
            {/* Time column */}
            <div className="p-2 text-right text-sm text-gray-600 font-medium border-r">
              {hour.toString().padStart(2, '0')}:00
            </div>
            
            {/* Day columns */}
            {weekDays.map((date, dayIndex) => {
              const hourEvents = getEventsForDateTime(date, hour);
              return (
                <div 
                  key={dayIndex} 
                  className="p-1 min-h-[60px] border rounded-lg bg-white hover:bg-gray-50"
                >
                  {hourEvents.map((event) => (
                    <Button
                      key={event.id}
                      variant="ghost"
                      size="sm"
                      className={`
                        w-full h-auto p-2 mb-1 text-left text-xs
                        ${getEventTypeColor(event.event_type)}
                        hover:opacity-80
                      `}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="truncate flex-1 font-medium">
                            {event.title}
                          </span>
                          {event.is_legal_deadline && (
                            <span className="text-white">⚖️</span>
                          )}
                        </div>
                        
                        {event.start_time && !event.all_day && (
                          <div className="text-xs opacity-90">
                            {event.start_time.slice(0, 5)}
                            {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                          </div>
                        )}
                        
                        {event.case?.case_number && (
                          <div className="text-xs opacity-75">
                            {event.case.case_number}
                          </div>
                        )}
                        
                        {event.location && (
                          <div className="text-xs opacity-75">
                            📍 {event.location}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}