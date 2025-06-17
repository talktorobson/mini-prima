import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type TimeEntry = Database['public']['Tables']['time_entries']['Row'];
type TimeEntryInsert = Database['public']['Tables']['time_entries']['Insert'];
type TimeEntryUpdate = Database['public']['Tables']['time_entries']['Update'];
type ActiveTimer = Database['public']['Tables']['active_timers']['Row'];
type ActiveTimerInsert = Database['public']['Tables']['active_timers']['Insert'];
type BillingRate = Database['public']['Tables']['billing_rates']['Row'];

export interface TimeEntryWithDetails extends TimeEntry {
  staff?: {
    id: string;
    name: string;
    role: string;
  };
  case?: {
    id: string;
    case_number: string;
    title: string;
  };
  client?: {
    id: string;
    company_name: string;
  };
}

export interface TimerSession {
  id: string;
  description: string;
  task_type: string;
  started_at: string;
  elapsed_minutes: number;
  hourly_rate: number;
  case?: {
    id: string;
    case_number: string;
    title: string;
  };
  client?: {
    id: string;
    company_name: string;
  };
}

export interface TimeTrackingSummary {
  period: string;
  total_hours: number;
  billable_hours: number;
  total_amount: number;
  billed_amount: number;
  entries_count: number;
  status_breakdown: {
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
    billed: number;
  };
}

export const timeTrackingService = {
  // Timer Management
  async startTimer(data: {
    case_id?: string;
    client_id?: string;
    description: string;
    task_type: string;
  }): Promise<ActiveTimer> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Get billing rate
    const hourlyRate = await this.getStaffBillingRate(
      user.id,
      data.client_id,
      data.task_type
    );

    // Stop any existing timer first
    await this.stopActiveTimer();

    const { data: timer, error } = await supabase
      .from('active_timers')
      .insert({
        staff_id: user.id,
        case_id: data.case_id,
        client_id: data.client_id,
        description: data.description,
        task_type: data.task_type,
        hourly_rate: hourlyRate,
      })
      .select()
      .single();

    if (error) throw error;
    return timer;
  },

  async stopActiveTimer(description?: string): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data: timer } = await supabase
      .from('active_timers')
      .select('*')
      .eq('staff_id', user.id)
      .single();

    if (!timer) return null;

    // Call the database function to stop timer and create entry
    const { data, error } = await supabase.rpc('stop_active_timer', {
      timer_id: timer.id,
      description: description || null,
    });

    if (error) throw error;
    return data; // Returns the new time_entry ID
  },

  async getActiveTimer(): Promise<TimerSession | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data: timer, error } = await supabase
      .from('active_timers')
      .select(`
        *,
        case:cases(id, case_number, title),
        client:clients(id, company_name)
      `)
      .eq('staff_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!timer) return null;

    const startedAt = new Date(timer.started_at);
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));

    return {
      id: timer.id,
      description: timer.description,
      task_type: timer.task_type,
      started_at: timer.started_at,
      elapsed_minutes: elapsedMinutes,
      hourly_rate: timer.hourly_rate,
      case: timer.case,
      client: timer.client,
    };
  },

  // Time Entry Management
  async createTimeEntry(data: Omit<TimeEntryInsert, 'staff_id'>): Promise<TimeEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Get billing rate if not provided
    const hourlyRate = data.hourly_rate || await this.getStaffBillingRate(
      user.id,
      data.client_id,
      data.task_type
    );

    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        ...data,
        staff_id: user.id,
        hourly_rate: hourlyRate,
      })
      .select()
      .single();

    if (error) throw error;
    return entry;
  },

  async updateTimeEntry(id: string, data: TimeEntryUpdate): Promise<TimeEntry> {
    const { data: entry, error } = await supabase
      .from('time_entries')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return entry;
  },

  async deleteTimeEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getTimeEntries(filters?: {
    staff_id?: string;
    case_id?: string;
    client_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    entries: TimeEntryWithDetails[];
    total: number;
  }> {
    let query = supabase
      .from('time_entries')
      .select(`
        *,
        staff:staff(id, name, role),
        case:cases(id, case_number, title),
        client:clients(id, company_name)
      `)
      .order('start_time', { ascending: false });

    // Apply filters
    if (filters?.staff_id) {
      query = query.eq('staff_id', filters.staff_id);
    }
    if (filters?.case_id) {
      query = query.eq('case_id', filters.case_id);
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date_from) {
      query = query.gte('start_time', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('start_time', filters.date_to);
    }

    // Get total count
    const { count } = await query.select('*', { count: 'exact', head: true });

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1);
    }

    const { data: entries, error } = await query;

    if (error) throw error;
    return {
      entries: entries || [],
      total: count || 0,
    };
  },

  async getTimeEntry(id: string): Promise<TimeEntryWithDetails> {
    const { data: entry, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        staff:staff(id, name, role),
        case:cases(id, case_number, title),
        client:clients(id, company_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return entry;
  },

  // Approval Workflow
  async submitTimeEntries(entry_ids: string[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { error } = await supabase
      .from('time_entries')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        submitted_by: user.id,
      })
      .in('id', entry_ids)
      .eq('staff_id', user.id)
      .eq('status', 'draft');

    if (error) throw error;
  },

  async approveTimeEntries(entry_ids: string[], notes?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { error } = await supabase
      .from('time_entries')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        approval_notes: notes,
      })
      .in('id', entry_ids)
      .eq('status', 'submitted');

    if (error) throw error;
  },

  async rejectTimeEntries(entry_ids: string[], notes: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { error } = await supabase
      .from('time_entries')
      .update({
        status: 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        approval_notes: notes,
      })
      .in('id', entry_ids)
      .eq('status', 'submitted');

    if (error) throw error;
  },

  // Billing Rate Management
  async getStaffBillingRate(
    staff_id: string,
    client_id?: string,
    task_type?: string
  ): Promise<number> {
    const { data, error } = await supabase.rpc('get_staff_billing_rate', {
      p_staff_id: staff_id,
      p_client_id: client_id || null,
      p_task_type: task_type || null,
    });

    if (error) throw error;
    return data || 0;
  },

  async setBillingRate(data: {
    staff_id: string;
    default_hourly_rate?: number;
    task_type?: string;
    custom_rate?: number;
    client_id?: string;
    client_rate?: number;
    effective_from?: string;
    effective_until?: string;
  }): Promise<BillingRate> {
    const { data: rate, error } = await supabase
      .from('billing_rates')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return rate;
  },

  async getBillingRates(staff_id?: string): Promise<BillingRate[]> {
    let query = supabase
      .from('billing_rates')
      .select('*')
      .eq('is_active', true)
      .order('effective_from', { ascending: false });

    if (staff_id) {
      query = query.eq('staff_id', staff_id);
    }

    const { data: rates, error } = await query;

    if (error) throw error;
    return rates || [];
  },

  // Reporting and Analytics
  async getTimeTrackingSummary(filters?: {
    staff_id?: string;
    client_id?: string;
    date_from?: string;
    date_to?: string;
    period?: 'daily' | 'weekly' | 'monthly';
  }): Promise<TimeTrackingSummary> {
    let query = supabase
      .from('time_entries')
      .select('*');

    // Apply filters
    if (filters?.staff_id) {
      query = query.eq('staff_id', filters.staff_id);
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters?.date_from) {
      query = query.gte('start_time', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('start_time', filters.date_to);
    }

    const { data: entries, error } = await query;

    if (error) throw error;

    const summary: TimeTrackingSummary = {
      period: `${filters?.date_from || ''} - ${filters?.date_to || ''}`,
      total_hours: 0,
      billable_hours: 0,
      total_amount: 0,
      billed_amount: 0,
      entries_count: entries?.length || 0,
      status_breakdown: {
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        billed: 0,
      },
    };

    entries?.forEach(entry => {
      const hours = (entry.duration_minutes || 0) / 60;
      const billableHours = (entry.billable_minutes || 0) / 60;
      
      summary.total_hours += hours;
      summary.billable_hours += billableHours;
      summary.total_amount += entry.billable_amount || 0;
      
      if (entry.status === 'billed') {
        summary.billed_amount += entry.billable_amount || 0;
      }

      summary.status_breakdown[entry.status as keyof typeof summary.status_breakdown]++;
    });

    return summary;
  },

  // Task Types
  getTaskTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'consultation', label: 'Consulta Jurídica' },
      { value: 'research', label: 'Pesquisa Legal' },
      { value: 'document_prep', label: 'Elaboração de Documentos' },
      { value: 'court_appearance', label: 'Audiência/Tribunal' },
      { value: 'negotiation', label: 'Negociação' },
      { value: 'contract_review', label: 'Análise de Contratos' },
      { value: 'litigation', label: 'Contencioso' },
      { value: 'admin', label: 'Administrativo' },
      { value: 'travel', label: 'Deslocamento' },
      { value: 'other', label: 'Outros' },
    ];
  },

  // Utility functions
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  },

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  },
};