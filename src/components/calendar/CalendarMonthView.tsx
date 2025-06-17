import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarEventWithDetails } from '@/services/calendarService';

interface CalendarMonthViewProps {
  events: CalendarEventWithDetails[];
  selectedDate: Date;
  onEventClick: (event: CalendarEventWithDetails) => void;
  onDateClick: (date: Date) => void;
}

export function CalendarMonthView({ 
  events, 
  selectedDate, 
  onEventClick, 
  onDateClick 
}: CalendarMonthViewProps) {
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // Get first day of month and calculate calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));

  // Generate calendar weeks
  const weeks = [];
  let currentDate = new Date(startDate);

  for (let week = 0; week < 6; week++) {
    const days = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(currentDate);
      const isCurrentMonth = date.getMonth() === currentMonth;
      const isToday = date.toDateString() === new Date().toDateString();
      
      // Get events for this date
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate.toDateString() === date.toDateString();
      });

      days.push({
        date: new Date(date),
        isCurrentMonth,
        isToday,
        events: dayEvents,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(days);
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'court_hearing': return 'bg-red-100 text-red-800 border-red-200';
      case 'deadline': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'appointment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'meeting': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'task': return 'bg-green-100 text-green-800 border-green-200';
      case 'reminder': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="calendar-month-view">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
          <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`
                  min-h-[100px] p-1 border rounded-lg cursor-pointer transition-colors
                  ${day.isCurrentMonth 
                    ? 'bg-white hover:bg-gray-50 border-gray-200' 
                    : 'bg-gray-50 border-gray-100 text-gray-400'
                  }
                  ${day.isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                `}
                onClick={() => onDateClick(day.date)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`
                    text-sm font-medium
                    ${day.isToday ? 'text-blue-600' : ''}
                    ${!day.isCurrentMonth ? 'text-gray-400' : ''}
                  `}>
                    {day.date.getDate()}
                  </span>
                  {day.events.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-1 py-0"
                    >
                      {day.events.length}
                    </Badge>
                  )}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {day.events.slice(0, 3).map((event) => (
                    <Button
                      key={event.id}
                      variant="ghost"
                      size="sm"
                      className={`
                        w-full h-auto p-1 text-left text-xs leading-none
                        ${getEventTypeColor(event.event_type)}
                        hover:opacity-80
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <div 
                          className={`w-2 h-2 rounded-full ${getPriorityDot(event.priority)}`}
                        />
                        <span className="truncate flex-1">
                          {event.title}
                        </span>
                        {event.is_legal_deadline && (
                          <span className="text-red-500">⚖️</span>
                        )}
                      </div>
                      {event.start_time && !event.all_day && (
                        <div className="text-xs opacity-75 mt-0.5">
                          {event.start_time.slice(0, 5)}
                        </div>
                      )}
                    </Button>
                  ))}
                  
                  {day.events.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{day.events.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}