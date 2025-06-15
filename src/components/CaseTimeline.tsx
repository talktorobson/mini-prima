
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Scale, User, MessageSquare, Calendar } from 'lucide-react';

interface CaseTimelineProps {
  caseId: string;
}

interface TimelineEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  description?: string;
  user?: string;
}

const CaseTimeline: React.FC<CaseTimelineProps> = ({ caseId }) => {
  // Mock data for timeline events - in a real app this would come from the database
  const mockTimelineEvents: TimelineEvent[] = [
    {
      id: '1',
      date: '2024-06-15T10:30:00Z',
      type: 'update',
      title: 'Atualização do status do caso',
      description: 'Status alterado para "Em Andamento"',
      user: 'Dr. Silva'
    },
    {
      id: '2',
      date: '2024-06-14T14:15:00Z',
      type: 'document',
      title: 'Documento adicionado',
      description: 'Contrato comercial revisado foi adicionado ao caso',
      user: 'Dr. Silva'
    },
    {
      id: '3',
      date: '2024-06-12T09:45:00Z',
      type: 'court',
      title: 'Audiência agendada',
      description: 'Audiência marcada para 25/06/2024 às 14:00',
      user: 'Sistema'
    },
    {
      id: '4',
      date: '2024-06-10T16:20:00Z',
      type: 'meeting',
      title: 'Reunião com cliente',
      description: 'Discussão sobre estratégia do caso e próximos passos',
      user: 'Dr. Silva'
    },
    {
      id: '5',
      date: '2024-06-08T11:00:00Z',
      type: 'message',
      title: 'Mensagem do cliente',
      description: 'Cliente enviou documentos adicionais solicitados',
      user: 'Cliente'
    },
    {
      id: '6',
      date: '2024-06-01T08:00:00Z',
      type: 'created',
      title: 'Caso criado',
      description: 'Caso foi criado e atribuído ao Dr. Silva',
      user: 'Sistema'
    }
  ];

  const { data: events = mockTimelineEvents, isLoading } = useQuery({
    queryKey: ['case-timeline', caseId],
    queryFn: async () => {
      // In a real implementation, this would fetch from the database
      // For now, return mock data
      return mockTimelineEvents;
    },
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'court': return <Scale className="h-4 w-4" />;
      case 'meeting': return <User className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'update': return <Clock className="h-4 w-4" />;
      case 'created': return <Calendar className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'court': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'meeting': return 'bg-green-100 text-green-800 border-green-200';
      case 'message': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'update': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'created': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'document': return 'Documento';
      case 'court': return 'Tribunal';
      case 'meeting': return 'Reunião';
      case 'message': return 'Mensagem';
      case 'update': return 'Atualização';
      case 'created': return 'Criação';
      default: return 'Evento';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96 pr-4">
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.id} className="relative">
            {/* Timeline line */}
            {index !== events.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
            )}
            
            {/* Event container */}
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${getEventColor(event.type)}`}>
                {getEventIcon(event.type)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {getTypeDisplayName(event.type)}
                  </Badge>
                </div>
                
                {event.description && (
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                )}
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{new Date(event.date).toLocaleDateString('pt-BR')} às {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  {event.user && <span>por {event.user}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="mx-auto h-8 w-8 mb-2 text-gray-400" />
            <p className="text-sm">Nenhum evento registrado ainda</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default CaseTimeline;
