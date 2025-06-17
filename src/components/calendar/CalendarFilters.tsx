import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CalendarFilter } from '@/services/calendarService';
import { Filter, X, Calendar, Users, FileText } from 'lucide-react';

interface CalendarFiltersProps {
  filters: Partial<CalendarFilter>;
  onFiltersChange: (filters: Partial<CalendarFilter>) => void;
}

export function CalendarFilters({ filters, onFiltersChange }: CalendarFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<Partial<CalendarFilter>>(filters);

  const eventTypes = [
    { value: 'court_hearing', label: 'Audiência', color: '#dc2626' },
    { value: 'deadline', label: 'Prazo Legal', color: '#ea580c' },
    { value: 'appointment', label: 'Reunião', color: '#2563eb' },
    { value: 'reminder', label: 'Lembrete', color: '#7c3aed' },
    { value: 'task', label: 'Tarefa', color: '#059669' },
    { value: 'meeting', label: 'Reunião Interna', color: '#0891b2' },
  ];

  const priorityLevels = [
    { value: 'critical', label: 'Crítica', color: '#dc2626' },
    { value: 'high', label: 'Alta', color: '#ef4444' },
    { value: 'medium', label: 'Média', color: '#f59e0b' },
    { value: 'low', label: 'Baixa', color: '#10b981' },
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'Agendado' },
    { value: 'in_progress', label: 'Em Andamento' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'postponed', label: 'Adiado' },
  ];

  const updateLocalFilter = (key: keyof CalendarFilter, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleEventType = (eventType: string) => {
    const currentTypes = localFilters.event_type || [];
    const newTypes = currentTypes.includes(eventType)
      ? currentTypes.filter(t => t !== eventType)
      : [...currentTypes, eventType];
    
    updateLocalFilter('event_type', newTypes.length > 0 ? newTypes : undefined);
  };

  const togglePriority = (priority: string) => {
    const currentPriorities = localFilters.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];
    
    updateLocalFilter('priority', newPriorities.length > 0 ? newPriorities : undefined);
  };

  const toggleStatus = (status: string) => {
    const currentStatuses = localFilters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    updateLocalFilter('status', newStatuses.length > 0 ? newStatuses : undefined);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setIsOpen(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.start_date) count++;
    if (localFilters.end_date) count++;
    if (localFilters.event_type?.length) count++;
    if (localFilters.priority?.length) count++;
    if (localFilters.status?.length) count++;
    if (localFilters.is_legal_deadline !== undefined) count++;
    if (localFilters.staff_id) count++;
    if (localFilters.case_id) count++;
    if (localFilters.client_id) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filtrar Eventos</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Período
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="start_date" className="text-xs text-gray-500">De</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={localFilters.start_date || ''}
                  onChange={(e) => updateLocalFilter('start_date', e.target.value || undefined)}
                  className="text-xs"
                />
              </div>
              <div>
                <Label htmlFor="end_date" className="text-xs text-gray-500">Até</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={localFilters.end_date || ''}
                  onChange={(e) => updateLocalFilter('end_date', e.target.value || undefined)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Event Types */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Tipos de Evento</Label>
            <div className="space-y-1">
              {eventTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`event-type-${type.value}`}
                    checked={localFilters.event_type?.includes(type.value) || false}
                    onCheckedChange={() => toggleEventType(type.value)}
                  />
                  <Label
                    htmlFor={`event-type-${type.value}`}
                    className="text-xs flex items-center gap-2 flex-1 cursor-pointer"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: type.color }}
                    />
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Prioridade</Label>
            <div className="space-y-1">
              {priorityLevels.map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${level.value}`}
                    checked={localFilters.priority?.includes(level.value) || false}
                    onCheckedChange={() => togglePriority(level.value)}
                  />
                  <Label
                    htmlFor={`priority-${level.value}`}
                    className="text-xs flex items-center gap-2 flex-1 cursor-pointer"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: level.color }}
                    />
                    {level.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Status</Label>
            <div className="space-y-1">
              {statusOptions.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={localFilters.status?.includes(status.value) || false}
                    onCheckedChange={() => toggleStatus(status.value)}
                  />
                  <Label
                    htmlFor={`status-${status.value}`}
                    className="text-xs flex-1 cursor-pointer"
                  >
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Deadlines */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="legal_deadlines"
                checked={localFilters.is_legal_deadline === true}
                onCheckedChange={(checked) => 
                  updateLocalFilter('is_legal_deadline', checked ? true : undefined)
                }
              />
              <Label htmlFor="legal_deadlines" className="text-xs">
                Apenas prazos legais
              </Label>
            </div>
          </div>

          {/* Staff Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Users className="h-3 w-3" />
              Responsável
            </Label>
            <Select
              value={localFilters.staff_id || ''}
              onValueChange={(value) => updateLocalFilter('staff_id', value || undefined)}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Todos os responsáveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os responsáveis</SelectItem>
                {/* Note: In a real implementation, you would load staff from the database */}
                <SelectItem value="staff-1">João Silva</SelectItem>
                <SelectItem value="staff-2">Maria Santos</SelectItem>
                <SelectItem value="staff-3">Pedro Costa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Case Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Processo
            </Label>
            <Select
              value={localFilters.case_id || ''}
              onValueChange={(value) => updateLocalFilter('case_id', value || undefined)}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Todos os processos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os processos</SelectItem>
                {/* Note: In a real implementation, you would load cases from the database */}
                <SelectItem value="case-1">001/2024 - Empresa ABC</SelectItem>
                <SelectItem value="case-2">002/2024 - Empresa XYZ</SelectItem>
                <SelectItem value="case-3">003/2024 - Empresa 123</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apply Button */}
          <div className="pt-2 border-t">
            <Button onClick={applyFilters} className="w-full" size="sm">
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}