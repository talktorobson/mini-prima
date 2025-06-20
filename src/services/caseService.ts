// 📁 Case Management Service
// D'Avila Reis Legal Practice Management System
// Complete CRUD operations for case management

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Case = Database['public']['Tables']['cases']['Row'];
type CaseInsert = Database['public']['Tables']['cases']['Insert'];
type CaseUpdate = Database['public']['Tables']['cases']['Update'];

export interface CreateCaseRequest {
  client_id: string;
  case_title: string;
  service_type: string;
  description?: string;
  assigned_lawyer?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  status?: 'Open' | 'In Progress' | 'Waiting Client' | 'Waiting Court' | 'On Hold' | 'Closed - Won' | 'Closed - Lost' | 'Cancelled';
  start_date?: string;
  due_date?: string;
  expected_close_date?: string;
  hourly_rate?: number;
  fixed_fee?: number;
  total_value?: number;
  risk_level?: 'Low' | 'Medium' | 'High';
  case_risk_value?: number;
  opposing_party?: string;
  counterparty_name?: string;
  court_agency?: string;
  court_process_number?: string;
  case_number_external?: string;
  notes?: string;
  supporting_staff?: string[];
  hours_budgeted?: number;
}

export interface UpdateCaseRequest extends Partial<CreateCaseRequest> {
  id: string;
  progress_percentage?: number;
  hours_worked?: number;
  outcome?: string;
  actual_close_date?: string;
  end_date?: string;
  next_steps?: string;
  key_dates?: string;
  client_satisfaction?: number;
}

export interface CaseFilters {
  status?: string;
  priority?: string;
  assigned_lawyer?: string;
  client_id?: string;
  risk_level?: string;
  search_query?: string;
}

class CaseService {
  private generateCaseNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    return `CASO-${year}${month}-${timestamp}`;
  }

  async createCase(request: CreateCaseRequest): Promise<Case> {
    try {
      console.log('Creating case with request:', request);

      // Validate required fields
      if (!request.client_id || !request.case_title || !request.service_type) {
        throw new Error('Campos obrigatórios não preenchidos: Cliente, Título e Tipo de Serviço são obrigatórios');
      }

      // Verify client exists
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', request.client_id)
        .single();

      if (clientError || !client) {
        throw new Error('Cliente especificado não existe no sistema');
      }

      // Verify assigned lawyer exists if provided
      if (request.assigned_lawyer) {
        const { data: lawyer, error: lawyerError } = await supabase
          .from('staff')
          .select('id')
          .eq('id', request.assigned_lawyer)
          .single();

        if (lawyerError || !lawyer) {
          throw new Error('Advogado especificado não existe no sistema');
        }
      }

      // Prepare case data with proper array handling
      const caseData: CaseInsert = {
        ...request,
        case_number: this.generateCaseNumber(),
        start_date: request.start_date || new Date().toISOString().split('T')[0],
        status: request.status || 'Open',
        priority: request.priority || 'Medium',
        progress_percentage: 0,
        // Handle supporting_staff as proper JSON array
        supporting_staff: request.supporting_staff && request.supporting_staff.length > 0 
          ? JSON.stringify(request.supporting_staff) 
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting case data:', caseData);

      const { data, error } = await supabase
        .from('cases')
        .insert(caseData)
        .select(`
          *,
          client:clients(
            id,
            company_name,
            contact_person,
            email,
            phone
          )
        `)
        .single();

      if (error) {
        console.error('Database error creating case:', error);
        
        // Provide specific error messages
        if (error.code === '23505') {
          throw new Error('Já existe um caso com essas informações. Verifique número do processo ou título.');
        } else if (error.code === '23503') {
          throw new Error('Dados relacionados inválidos. Verifique cliente e advogado selecionados.');
        } else if (error.code === '23502') {
          throw new Error('Campos obrigatórios não preenchidos corretamente.');
        } else {
          throw new Error(`Erro ao criar caso: ${error.message}`);
        }
      }

      console.log('Case created successfully:', data.id);

      // Create initial case update (don't fail if this fails)
      try {
        await this.createCaseUpdate(data.id, 'case_created', 'Caso criado', 'Novo caso registrado no sistema');
      } catch (updateError) {
        console.warn('Failed to create initial case update:', updateError);
        // Don't throw here as the case was created successfully
      }

      return data;
    } catch (error) {
      console.error('Error in createCase:', error);
      throw error;
    }
  }

  async updateCase(request: UpdateCaseRequest): Promise<Case> {
    try {
      console.log('Updating case with request:', request);
      
      const { id, ...updateData } = request;
      
      // Verify case exists
      const { data: existingCase, error: fetchError } = await supabase
        .from('cases')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError || !existingCase) {
        throw new Error('Caso não encontrado no sistema');
      }

      // Verify client exists if being updated
      if (updateData.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('id', updateData.client_id)
          .single();

        if (clientError || !client) {
          throw new Error('Cliente especificado não existe no sistema');
        }
      }

      // Verify assigned lawyer exists if being updated
      if (updateData.assigned_lawyer) {
        const { data: lawyer, error: lawyerError } = await supabase
          .from('staff')
          .select('id')
          .eq('id', updateData.assigned_lawyer)
          .single();

        if (lawyerError || !lawyer) {
          throw new Error('Advogado especificado não existe no sistema');
        }
      }
      
      const caseUpdate: CaseUpdate = {
        ...updateData,
        // Handle supporting_staff array properly
        supporting_staff: updateData.supporting_staff && updateData.supporting_staff.length > 0
          ? JSON.stringify(updateData.supporting_staff) 
          : updateData.supporting_staff === null ? null : undefined,
        updated_at: new Date().toISOString()
      };

      console.log('Updating case with data:', caseUpdate);

      const { data, error } = await supabase
        .from('cases')
        .update(caseUpdate)
        .eq('id', id)
        .select(`
          *,
          client:clients(
            id,
            company_name,
            contact_person,
            email,
            phone
          )
        `)
        .single();

      if (error) {
        console.error('Database error updating case:', error);
        
        // Provide specific error messages
        if (error.code === '23505') {
          throw new Error('Já existe um caso com essas informações. Verifique número do processo ou título.');
        } else if (error.code === '23503') {
          throw new Error('Dados relacionados inválidos. Verifique cliente e advogado selecionados.');
        } else if (error.code === '23502') {
          throw new Error('Campos obrigatórios não preenchidos corretamente.');
        } else {
          throw new Error(`Erro ao atualizar caso: ${error.message}`);
        }
      }

      console.log('Case updated successfully:', data.id);

      // Create case update log (don't fail if this fails)
      try {
        await this.createCaseUpdate(id, 'case_updated', 'Caso atualizado', 'Informações do caso foram atualizadas');
      } catch (updateError) {
        console.warn('Failed to create case update log:', updateError);
        // Don't throw here as the case was updated successfully
      }

      return data;
    } catch (error) {
      console.error('Error in updateCase:', error);
      throw error;
    }
  }

  async deleteCase(caseId: string): Promise<void> {
    try {
      // First, check if case has associated documents or other dependencies
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('case_id', caseId);

      if (documents && documents.length > 0) {
        throw new Error('Não é possível excluir caso com documentos associados. Remova os documentos primeiro.');
      }

      // Delete case updates first (foreign key constraint)
      await supabase
        .from('case_updates')
        .delete()
        .eq('case_id', caseId);

      // Delete the case
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);

      if (error) {
        console.error('Error deleting case:', error);
        throw new Error(`Erro ao excluir caso: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteCase:', error);
      throw error;
    }
  }

  async getCaseById(caseId: string): Promise<Case | null> {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          client:clients(*),
          case_updates(*),
          documents(*)
        `)
        .eq('id', caseId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Case not found
        }
        console.error('Error fetching case:', error);
        throw new Error(`Erro ao buscar caso: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getCaseById:', error);
      throw error;
    }
  }

  async getCases(filters?: CaseFilters): Promise<Case[]> {
    try {
      let query = supabase
        .from('cases')
        .select(`
          *,
          client:clients(
            id,
            company_name,
            contact_person,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assigned_lawyer) {
        query = query.eq('assigned_lawyer', filters.assigned_lawyer);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching cases:', error);
        throw new Error(`Erro ao buscar casos: ${error.message}`);
      }

      // Apply text search filter if provided
      let filteredData = data || [];
      if (filters?.search_query) {
        const searchTerm = filters.search_query.toLowerCase();
        filteredData = filteredData.filter(case_ => 
          case_.case_title?.toLowerCase().includes(searchTerm) ||
          case_.case_number?.toLowerCase().includes(searchTerm) ||
          case_.opposing_party?.toLowerCase().includes(searchTerm) ||
          case_.counterparty_name?.toLowerCase().includes(searchTerm) ||
          case_.court_process_number?.toLowerCase().includes(searchTerm) ||
          (case_.client as any)?.company_name?.toLowerCase().includes(searchTerm)
        );
      }

      return filteredData;
    } catch (error) {
      console.error('Error in getCases:', error);
      throw error;
    }
  }

  async getCasesByClient(clientId: string): Promise<Case[]> {
    return this.getCases({ client_id: clientId });
  }

  async getCasesByStaff(staffId: string): Promise<Case[]> {
    try {
      // Get assigned clients for this staff member
      const { data: assignments } = await supabase
        .from('staff_client_assignments')
        .select('client_id')
        .eq('staff_id', staffId)
        .eq('is_active', true);

      if (!assignments || assignments.length === 0) {
        return [];
      }

      const clientIds = assignments.map(a => a.client_id);

      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          client:clients(
            id,
            company_name,
            contact_person,
            email,
            phone
          )
        `)
        .in('client_id', clientIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching staff cases:', error);
        throw new Error(`Erro ao buscar casos da equipe: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCasesByStaff:', error);
      throw error;
    }
  }

  async updateCaseProgress(caseId: string, progressPercentage: number, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cases')
        .update({
          progress_percentage: Math.max(0, Math.min(100, progressPercentage)),
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      if (error) {
        console.error('Error updating case progress:', error);
        throw new Error(`Erro ao atualizar progresso: ${error.message}`);
      }

      // Create case update for progress
      await this.createCaseUpdate(
        caseId,
        'progress_updated',
        `Progresso atualizado para ${progressPercentage}%`,
        notes || `Progresso do caso atualizado para ${progressPercentage}%`
      );
    } catch (error) {
      console.error('Error in updateCaseProgress:', error);
      throw error;
    }
  }

  async closeCaseWithOutcome(
    caseId: string, 
    status: 'Closed - Won' | 'Closed - Lost' | 'Cancelled',
    outcome: string,
    clientSatisfaction?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('cases')
        .update({
          status,
          outcome,
          client_satisfaction: clientSatisfaction,
          actual_close_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          progress_percentage: status === 'Closed - Won' ? 100 : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      if (error) {
        console.error('Error closing case:', error);
        throw new Error(`Erro ao fechar caso: ${error.message}`);
      }

      // Create case update for closure
      await this.createCaseUpdate(
        caseId,
        'case_closed',
        `Caso fechado - ${status}`,
        `Caso encerrado com resultado: ${outcome}`
      );
    } catch (error) {
      console.error('Error in closeCaseWithOutcome:', error);
      throw error;
    }
  }

  private async createCaseUpdate(
    caseId: string,
    updateType: string,
    title: string,
    description?: string,
    visibility: 'internal' | 'client' = 'internal'
  ): Promise<void> {
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get staff ID for the current user
      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!staff) return;

      await supabase
        .from('case_updates')
        .insert({
          case_id: caseId,
          update_type: updateType,
          title,
          description,
          visibility,
          created_by: staff.id,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error creating case update:', error);
      // Don't throw here as this is supplementary
    }
  }

  async getCaseStatistics(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    closed: number;
    avgProgressPercentage: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('status, progress_percentage');

      if (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }

      const total = data?.length || 0;
      const open = data?.filter(c => c.status === 'Open').length || 0;
      const inProgress = data?.filter(c => c.status === 'In Progress').length || 0;
      const closed = data?.filter(c => c.status?.startsWith('Closed')).length || 0;
      
      const avgProgressPercentage = total > 0 
        ? (data?.reduce((sum, c) => sum + (c.progress_percentage || 0), 0) || 0) / total
        : 0;

      return {
        total,
        open,
        inProgress,
        closed,
        avgProgressPercentage: Math.round(avgProgressPercentage)
      };
    } catch (error) {
      console.error('Error in getCaseStatistics:', error);
      throw error;
    }
  }
}

export const caseService = new CaseService();
export default caseService;