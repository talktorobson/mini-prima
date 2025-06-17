import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];
type CalendarEventInsert = Database['public']['Tables']['calendar_events']['Insert'];
type CalendarEventUpdate = Database['public']['Tables']['calendar_events']['Update'];
type DeadlineTemplate = Database['public']['Tables']['deadline_templates']['Row'];
type BrazilianHoliday = Database['public']['Tables']['brazilian_holidays']['Row'];
type StatuteLimitations = Database['public']['Tables']['statute_limitations']['Row'];

export interface CalendarEventWithDetails extends CalendarEvent {
  case?: {
    id: string;
    case_number: string;
    title: string;
  };
  client?: {
    id: string;
    company_name: string;
  };
  staff?: {
    id: string;
    name: string;
    role: string;
  };
  created_by_staff?: {
    id: string;
    name: string;
  };
}

export interface DeadlineAlert {
  id: string;
  title: string;
  deadline_date: string;
  days_remaining: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  case_number?: string;
  client_name?: string;
  consequence: string;
}

export interface CalendarFilter {
  start_date?: string;
  end_date?: string;
  event_type?: string[];
  staff_id?: string;
  case_id?: string;
  client_id?: string;
  priority?: string[];
  status?: string[];
  is_legal_deadline?: boolean;
}

export interface StatuteLimitationsAlert {
  id: string;
  case_id: string;
  case_number: string;
  client_name: string;
  claim_type: string;
  days_remaining: number;
  risk_level: string;
  deadline_date: string;
  legal_basis: string;
}

export const calendarService = {
  // Calendar Event Management
  async createEvent(data: Omit<CalendarEventInsert, 'created_by'>): Promise<CalendarEvent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        ...data,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return event;
  },

  async updateEvent(id: string, data: CalendarEventUpdate): Promise<CalendarEvent> {
    const { data: event, error } = await supabase
      .from('calendar_events')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return event;
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getEvents(filters?: CalendarFilter): Promise<CalendarEventWithDetails[]> {
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        case:cases(id, case_number, title),
        client:clients(id, company_name),
        staff:staff(id, name, role),
        created_by_staff:staff!calendar_events_created_by_fkey(id, name)
      `)
      .order('start_date', { ascending: true });

    // Apply filters
    if (filters?.start_date) {
      query = query.gte('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('start_date', filters.end_date);
    }
    if (filters?.event_type && filters.event_type.length > 0) {
      query = query.in('event_type', filters.event_type);
    }
    if (filters?.staff_id) {
      query = query.eq('staff_id', filters.staff_id);
    }
    if (filters?.case_id) {
      query = query.eq('case_id', filters.case_id);
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters?.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority);
    }
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    if (filters?.is_legal_deadline !== undefined) {
      query = query.eq('is_legal_deadline', filters.is_legal_deadline);
    }

    const { data: events, error } = await query;

    if (error) throw error;
    return events || [];
  },

  async getEvent(id: string): Promise<CalendarEventWithDetails> {
    const { data: event, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        case:cases(id, case_number, title),
        client:clients(id, company_name),
        staff:staff(id, name, role),
        created_by_staff:staff!calendar_events_created_by_fkey(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return event;
  },

  async getUpcomingDeadlines(days_ahead: number = 30): Promise<DeadlineAlert[]> {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days_ahead * 24 * 60 * 60 * 1000);

    const { data: events, error } = await supabase
      .from('calendar_events')
      .select(`
        id,
        title,
        start_date,
        consequence_of_missing,
        priority,
        case:cases(case_number),
        client:clients(company_name)
      `)
      .eq('is_legal_deadline', true)
      .gte('start_date', today.toISOString().split('T')[0])
      .lte('start_date', futureDate.toISOString().split('T')[0])
      .eq('status', 'scheduled')
      .order('start_date', { ascending: true });

    if (error) throw error;

    return (events || []).map(event => {
      const deadlineDate = new Date(event.start_date);
      const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (daysRemaining <= 3) riskLevel = 'critical';
      else if (daysRemaining <= 7) riskLevel = 'high';
      else if (daysRemaining <= 15) riskLevel = 'medium';

      return {
        id: event.id,
        title: event.title,
        deadline_date: event.start_date,
        days_remaining: daysRemaining,
        risk_level: riskLevel,
        case_number: event.case?.case_number,
        client_name: event.client?.company_name,
        consequence: event.consequence_of_missing || 'Consequências não especificadas',
      };
    });
  },

  // Deadline Template Management
  async getDeadlineTemplates(): Promise<DeadlineTemplate[]> {
    const { data: templates, error } = await supabase
      .from('deadline_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return templates || [];
  },

  async createDeadlineFromTemplate(
    templateId: string,
    triggerDate: string,
    caseId: string
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data, error } = await supabase.rpc('create_deadline_from_template', {
      template_id: templateId,
      trigger_date: triggerDate,
      case_id: caseId,
      staff_id: user.id,
    });

    if (error) throw error;
    return data;
  },

  // Brazilian Holidays
  async getBrazilianHolidays(year?: number): Promise<BrazilianHoliday[]> {
    let query = supabase
      .from('brazilian_holidays')
      .select('*')
      .order('date');

    if (year) {
      query = query.eq('year', year);
    } else {
      const currentYear = new Date().getFullYear();
      query = query.gte('year', currentYear);
    }

    const { data: holidays, error } = await query;

    if (error) throw error;
    return holidays || [];
  },

  async isBusinessDay(date: string, stateCode?: string): Promise<boolean> {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Check if weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Check if holiday
    const { data: holidays, error } = await supabase
      .from('brazilian_holidays')
      .select('id')
      .eq('date', date)
      .eq('affects_deadlines', true)
      .or(`holiday_type.eq.national,state_code.eq.${stateCode || 'SP'}`);

    if (error) throw error;
    return !holidays || holidays.length === 0;
  },

  async calculateBusinessDays(startDate: string, days: number): Promise<string> {
    const { data, error } = await supabase.rpc('calculate_business_days', {
      start_date: startDate,
      days: days,
    });

    if (error) throw error;
    return data;
  },

  // Statute of Limitations
  async createStatuteLimitations(data: {
    case_id: string;
    claim_type: string;
    legal_basis: string;
    limitation_period_years?: number;
    limitation_period_months?: number;
    limitation_period_days?: number;
    trigger_event: string;
    trigger_date: string;
    notes?: string;
  }): Promise<StatuteLimitations> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Calculate deadline date
    const triggerDate = new Date(data.trigger_date);
    const deadlineDate = new Date(triggerDate);
    
    if (data.limitation_period_years) {
      deadlineDate.setFullYear(deadlineDate.getFullYear() + data.limitation_period_years);
    }
    if (data.limitation_period_months) {
      deadlineDate.setMonth(deadlineDate.getMonth() + data.limitation_period_months);
    }
    if (data.limitation_period_days) {
      deadlineDate.setDate(deadlineDate.getDate() + data.limitation_period_days);
    }

    const { data: statute, error } = await supabase
      .from('statute_limitations')
      .insert({
        ...data,
        calculated_deadline: deadlineDate.toISOString().split('T')[0],
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return statute;
  },

  async getStatuteLimitationsAlerts(): Promise<StatuteLimitationsAlert[]> {
    const { data: statutes, error } = await supabase
      .from('statute_limitations')
      .select(`
        id,
        case_id,
        claim_type,
        days_remaining,
        risk_level,
        calculated_deadline,
        legal_basis,
        case:cases(case_number, client:clients(company_name))
      `)
      .eq('status', 'active')
      .lte('days_remaining', 365) // Only show alerts for next year
      .order('days_remaining', { ascending: true });

    if (error) throw error;

    return (statutes || []).map(statute => ({
      id: statute.id,
      case_id: statute.case_id,
      case_number: statute.case?.case_number || 'N/A',
      client_name: statute.case?.client?.company_name || 'N/A',
      claim_type: statute.claim_type,
      days_remaining: statute.days_remaining || 0,
      risk_level: statute.risk_level,
      deadline_date: statute.calculated_deadline,
      legal_basis: statute.legal_basis,
    }));
  },

  // Calendar Views and Utilities
  async getMonthView(year: number, month: number): Promise<{
    events: CalendarEventWithDetails[];
    holidays: BrazilianHoliday[];
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const [events, holidays] = await Promise.all([
      this.getEvents({ start_date: startDateStr, end_date: endDateStr }),
      this.getBrazilianHolidays(year),
    ]);

    const monthHolidays = holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getMonth() === month - 1;
    });

    return { events, holidays: monthHolidays };
  },

  async getWeekView(date: string): Promise<{
    events: CalendarEventWithDetails[];
    startDate: string;
    endDate: string;
  }> {
    const baseDate = new Date(date);
    const dayOfWeek = baseDate.getDay();
    
    // Calculate start of week (Monday)
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    // Calculate end of week (Sunday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const events = await this.getEvents({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    return {
      events,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  },

  async getDayView(date: string): Promise<CalendarEventWithDetails[]> {
    return this.getEvents({
      start_date: date,
      end_date: date,
    });
  },

  // Event Types and Categories
  getEventTypes(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'court_hearing', label: 'Audiência', color: '#dc2626' },
      { value: 'deadline', label: 'Prazo Legal', color: '#ea580c' },
      { value: 'appointment', label: 'Reunião', color: '#2563eb' },
      { value: 'reminder', label: 'Lembrete', color: '#7c3aed' },
      { value: 'task', label: 'Tarefa', color: '#059669' },
      { value: 'meeting', label: 'Reunião Interna', color: '#0891b2' },
    ];
  },

  getPriorityLevels(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'low', label: 'Baixa', color: '#10b981' },
      { value: 'medium', label: 'Média', color: '#f59e0b' },
      { value: 'high', label: 'Alta', color: '#ef4444' },
      { value: 'critical', label: 'Crítica', color: '#dc2626' },
    ];
  },

  // Reminder Management
  async scheduleReminder(eventId: string, reminderType: string, dateTime: string): Promise<void> {
    // This would integrate with notification system
    // For now, we'll update the event's reminder settings
    const { error } = await supabase
      .from('calendar_events')
      .update({
        reminder_enabled: true,
        last_reminder_sent: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) throw error;
  },

  async getDuePrazos(days_ahead: number = 7): Promise<DeadlineAlert[]> {
    const alerts = await this.getUpcomingDeadlines(days_ahead);
    return alerts.filter(alert => alert.days_remaining <= days_ahead);
  },

  // Court Integration (Brazilian Courts)
  getBrazilianCourts(): Array<{ code: string; name: string; jurisdiction: string }> {
    return [
      { code: 'TJSP', name: 'Tribunal de Justiça de São Paulo', jurisdiction: 'state' },
      { code: 'TRT02', name: 'TRT 2ª Região - São Paulo', jurisdiction: 'labor' },
      { code: 'TRF03', name: 'TRF 3ª Região - São Paulo', jurisdiction: 'federal' },
      { code: 'TST', name: 'Tribunal Superior do Trabalho', jurisdiction: 'labor' },
      { code: 'STF', name: 'Supremo Tribunal Federal', jurisdiction: 'constitutional' },
      { code: 'STJ', name: 'Superior Tribunal de Justiça', jurisdiction: 'federal' },
    ];
  },

  // Utility Functions
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  },

  formatDateTime(date: string, time?: string): string {
    const dateObj = new Date(date + (time ? `T${time}` : ''));
    return dateObj.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: time ? '2-digit' : undefined,
      minute: time ? '2-digit' : undefined,
    });
  },

  getDaysUntil(date: string): number {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  isOverdue(date: string): boolean {
    return this.getDaysUntil(date) < 0;
  },

  getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  },
};