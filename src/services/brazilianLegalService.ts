// 🇧🇷 Brazilian Legal Service
// D'Avila Reis Legal Practice Management System
// Brazilian court system integration and legal compliance automation

import { supabase } from '@/integrations/supabase/client';

// Brazilian Legal System Constants
export const BRAZILIAN_COURTS = {
  STF: { name: 'Supremo Tribunal Federal', jurisdiction: 'federal', level: 'supreme' },
  STJ: { name: 'Superior Tribunal de Justiça', jurisdiction: 'federal', level: 'superior' },
  TST: { name: 'Tribunal Superior do Trabalho', jurisdiction: 'labor', level: 'superior' },
  TCU: { name: 'Tribunal de Contas da União', jurisdiction: 'federal', level: 'audit' },
  
  // Regional Federal Courts
  TRF1: { name: 'Tribunal Regional Federal da 1ª Região', jurisdiction: 'federal', region: 1 },
  TRF2: { name: 'Tribunal Regional Federal da 2ª Região', jurisdiction: 'federal', region: 2 },
  TRF3: { name: 'Tribunal Regional Federal da 3ª Região', jurisdiction: 'federal', region: 3 },
  TRF4: { name: 'Tribunal Regional Federal da 4ª Região', jurisdiction: 'federal', region: 4 },
  TRF5: { name: 'Tribunal Regional Federal da 5ª Região', jurisdiction: 'federal', region: 5 },
  TRF6: { name: 'Tribunal Regional Federal da 6ª Região', jurisdiction: 'federal', region: 6 },
  
  // State Courts (São Paulo focus)
  TJSP: { name: 'Tribunal de Justiça de São Paulo', jurisdiction: 'state', state: 'SP' },
  TRTSP2: { name: 'Tribunal Regional do Trabalho da 2ª Região (SP)', jurisdiction: 'labor', region: 2 },
  TRTSP15: { name: 'Tribunal Regional do Trabalho da 15ª Região (Campinas/SP)', jurisdiction: 'labor', region: 15 },
};

export const LEGAL_PROCEDURE_TYPES = {
  // Civil Procedures
  CIVIL_ORDINARY: { 
    name: 'Procedimento Comum', 
    type: 'civil', 
    estimated_duration_days: 730,
    key_phases: ['citação', 'resposta', 'saneamento', 'instrução', 'sentença']
  },
  CIVIL_SUMMARY: { 
    name: 'Procedimento Sumário', 
    type: 'civil', 
    estimated_duration_days: 365,
    key_phases: ['citação', 'audiência_conciliação', 'instrução', 'sentença']
  },
  CIVIL_SMALL_CLAIMS: { 
    name: 'Juizado Especial Cível', 
    type: 'civil', 
    estimated_duration_days: 180,
    key_phases: ['citação', 'audiência', 'sentença']
  },
  
  // Labor Procedures
  LABOR_ORDINARY: { 
    name: 'Reclamação Trabalhista', 
    type: 'labor', 
    estimated_duration_days: 365,
    key_phases: ['audiência_inaugural', 'instrução', 'sentença', 'execução']
  },
  LABOR_APPEAL: { 
    name: 'Recurso Trabalhista', 
    type: 'labor', 
    estimated_duration_days: 180,
    key_phases: ['preparo', 'contrarrazões', 'julgamento']
  },
  
  // Corporate Procedures
  CORPORATE_CONTRACT: { 
    name: 'Ação Societária', 
    type: 'corporate', 
    estimated_duration_days: 540,
    key_phases: ['petição_inicial', 'citação', 'defesa', 'perícia', 'sentença']
  },
  CORPORATE_DISSOLUTION: { 
    name: 'Dissolução Societária', 
    type: 'corporate', 
    estimated_duration_days: 720,
    key_phases: ['requerimento', 'citação_sócios', 'liquidação', 'extinção']
  }
};

export const LEGAL_DEADLINES = {
  // Appeal deadlines (dias corridos)
  CIVIL_APPEAL: { days: 15, type: 'corridos', description: 'Apelação Cível' },
  LABOR_APPEAL: { days: 8, type: 'corridos', description: 'Recurso Ordinário Trabalhista' },
  SPECIAL_APPEAL: { days: 15, type: 'corridos', description: 'Recurso Especial' },
  EXTRAORDINARY_APPEAL: { days: 15, type: 'corridos', description: 'Recurso Extraordinário' },
  
  // Response deadlines
  CIVIL_RESPONSE: { days: 15, type: 'úteis', description: 'Contestação Civil' },
  LABOR_RESPONSE: { days: 15, type: 'corridos', description: 'Defesa Trabalhista' },
  CORPORATE_RESPONSE: { days: 15, type: 'úteis', description: 'Resposta Societária' },
  
  // Motion deadlines
  CIVIL_MOTION: { days: 5, type: 'úteis', description: 'Petição Simples' },
  URGENT_MOTION: { days: 2, type: 'úteis', description: 'Petição Urgente' },
  
  // Compliance deadlines
  COMPLIANCE_REPORT: { days: 30, type: 'corridos', description: 'Relatório de Cumprimento' },
  EXPERT_REPORT: { days: 45, type: 'corridos', description: 'Laudo Pericial' }
};

export const OAB_COMPLIANCE_RULES = {
  // Professional conduct rules
  CLIENT_CONFIDENTIALITY: {
    rule: 'Sigilo Profissional',
    description: 'Obrigação de manter sigilo sobre informações do cliente',
    penalty: 'Suspensão ou exclusão da OAB'
  },
  
  CONFLICT_OF_INTEREST: {
    rule: 'Conflito de Interesses',
    description: 'Proibição de representar partes com interesses conflitantes',
    penalty: 'Processo disciplinar'
  },
  
  FEE_AGREEMENT: {
    rule: 'Contrato de Honorários',
    description: 'Obrigatoriedade de contrato escrito para honorários',
    penalty: 'Advertência ou suspensão'
  },
  
  DEADLINE_COMPLIANCE: {
    rule: 'Cumprimento de Prazos',
    description: 'Obrigação de cumprir prazos processuais',
    penalty: 'Responsabilidade civil e disciplinar'
  }
};

interface CaseDeadline {
  id: string;
  case_id: string;
  deadline_type: string;
  due_date: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'completed' | 'overdue';
  notification_sent: boolean;
  created_at: string;
}

interface CourtIntegration {
  court_code: string;
  case_number: string;
  process_status: string;
  last_movement: string;
  next_hearing: string | null;
  judge: string | null;
  last_updated: string;
}

class BrazilianLegalService {
  
  // 📅 DEADLINE MANAGEMENT SYSTEM
  async calculateDeadline(
    startDate: Date, 
    deadlineType: keyof typeof LEGAL_DEADLINES,
    considerHolidays: boolean = true
  ): Promise<Date> {
    const deadline = LEGAL_DEADLINES[deadlineType];
    if (!deadline) {
      throw new Error(`Tipo de prazo não encontrado: ${deadlineType}`);
    }

    let calculatedDate = new Date(startDate);
    
    if (deadline.type === 'corridos') {
      // Dias corridos - simply add days
      calculatedDate.setDate(calculatedDate.getDate() + deadline.days);
    } else {
      // Dias úteis - exclude weekends and holidays
      let addedDays = 0;
      while (addedDays < deadline.days) {
        calculatedDate.setDate(calculatedDate.getDate() + 1);
        
        // Skip weekends
        if (calculatedDate.getDay() !== 0 && calculatedDate.getDay() !== 6) {
          // Check if it's a Brazilian holiday
          if (considerHolidays && !this.isBrazilianHoliday(calculatedDate)) {
            addedDays++;
          } else if (!considerHolidays) {
            addedDays++;
          }
        }
      }
    }

    return calculatedDate;
  }

  private isBrazilianHoliday(date: Date): boolean {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Fixed Brazilian holidays
    const fixedHolidays = [
      '01-01', // Confraternização Universal
      '04-21', // Tiradentes
      '05-01', // Dia do Trabalhador
      '09-07', // Independência do Brasil
      '10-12', // Nossa Senhora Aparecida
      '11-02', // Finados
      '11-15', // Proclamação da República
      '12-25'  // Natal
    ];

    const dateStr = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    if (fixedHolidays.includes(dateStr)) {
      return true;
    }

    // Variable holidays would need external calendar API
    // For now, we'll implement the basic fixed holidays
    return false;
  }

  async createCaseDeadline(
    caseId: string,
    deadlineType: keyof typeof LEGAL_DEADLINES,
    startDate: Date,
    description?: string
  ): Promise<CaseDeadline> {
    try {
      const dueDate = await this.calculateDeadline(startDate, deadlineType);
      const deadline = LEGAL_DEADLINES[deadlineType];
      
      const { data, error } = await supabase
        .from('case_deadlines')
        .insert({
          case_id: caseId,
          deadline_type: deadlineType,
          due_date: dueDate.toISOString().split('T')[0],
          description: description || deadline.description,
          priority: this.calculateDeadlinePriority(dueDate),
          status: 'pending',
          notification_sent: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule notification
      await this.scheduleDeadlineNotification(data.id, dueDate);

      return data;
    } catch (error) {
      console.error('Error creating case deadline:', error);
      throw error;
    }
  }

  private calculateDeadlinePriority(dueDate: Date): 'low' | 'medium' | 'high' | 'critical' {
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'critical';
    if (diffDays <= 3) return 'high';
    if (diffDays <= 7) return 'medium';
    return 'low';
  }

  private async scheduleDeadlineNotification(deadlineId: string, dueDate: Date): Promise<void> {
    // Schedule notifications at: 7 days, 3 days, 1 day, and on due date
    const notificationDays = [7, 3, 1, 0];
    
    for (const days of notificationDays) {
      const notificationDate = new Date(dueDate);
      notificationDate.setDate(notificationDate.getDate() - days);
      
      await supabase
        .from('deadline_notifications')
        .insert({
          deadline_id: deadlineId,
          notification_date: notificationDate.toISOString(),
          days_before: days,
          status: 'scheduled',
          created_at: new Date().toISOString()
        });
    }
  }

  // 🏛️ COURT INTEGRATION SYSTEM
  async integrateWithCourt(
    caseId: string,
    courtCode: keyof typeof BRAZILIAN_COURTS,
    processNumber: string
  ): Promise<CourtIntegration> {
    try {
      // In a real implementation, this would connect to court APIs
      // For now, we'll simulate the integration
      const mockIntegration: CourtIntegration = {
        court_code: courtCode,
        case_number: processNumber,
        process_status: 'Em andamento',
        last_movement: 'Juntada de petição',
        next_hearing: null,
        judge: 'Dr. João Silva',
        last_updated: new Date().toISOString()
      };

      // Store integration data
      const { data, error } = await supabase
        .from('court_integrations')
        .upsert({
          case_id: caseId,
          court_code: courtCode,
          process_number: processNumber,
          integration_data: mockIntegration,
          last_sync: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'case_id,court_code'
        })
        .select()
        .single();

      if (error) throw error;

      return mockIntegration;
    } catch (error) {
      console.error('Error integrating with court:', error);
      throw error;
    }
  }

  // ⚖️ OAB COMPLIANCE MONITORING
  async checkOABCompliance(caseId: string): Promise<{
    compliant: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    try {
      const { data: caseData, error } = await supabase
        .from('cases')
        .select(`
          *,
          client:clients(*),
          case_deadlines(*),
          documents(*)
        `)
        .eq('id', caseId)
        .single();

      if (error) throw error;

      const violations: string[] = [];
      const recommendations: string[] = [];

      // Check deadline compliance
      const overdueDeadlines = caseData.case_deadlines?.filter(
        (d: any) => new Date(d.due_date) < new Date() && d.status === 'pending'
      );

      if (overdueDeadlines?.length > 0) {
        violations.push('Prazos processuais em atraso detectados');
        recommendations.push('Regularizar imediatamente os prazos vencidos');
      }

      // Check fee agreement
      if (!caseData.hourly_rate && !caseData.fixed_fee) {
        violations.push('Contrato de honorários não definido');
        recommendations.push('Formalizar contrato de honorários por escrito');
      }

      // Check case documentation
      const requiredDocs = ['contrato_honorarios', 'procuracao', 'documentos_iniciais'];
      const existingDocs = caseData.documents?.map((d: any) => d.document_type) || [];
      
      const missingDocs = requiredDocs.filter(doc => !existingDocs.includes(doc));
      if (missingDocs.length > 0) {
        violations.push(`Documentos obrigatórios ausentes: ${missingDocs.join(', ')}`);
        recommendations.push('Providenciar documentação obrigatória');
      }

      return {
        compliant: violations.length === 0,
        violations,
        recommendations
      };
    } catch (error) {
      console.error('Error checking OAB compliance:', error);
      throw error;
    }
  }

  // 📊 CASE AUTOMATION WORKFLOWS
  async automateCaseWorkflow(
    caseId: string,
    procedureType: keyof typeof LEGAL_PROCEDURE_TYPES
  ): Promise<void> {
    try {
      const procedure = LEGAL_PROCEDURE_TYPES[procedureType];
      if (!procedure) {
        throw new Error(`Tipo de procedimento não encontrado: ${procedureType}`);
      }

      // Create workflow phases
      for (let i = 0; i < procedure.key_phases.length; i++) {
        const phase = procedure.key_phases[i];
        const estimatedDays = Math.floor(procedure.estimated_duration_days / procedure.key_phases.length);
        const phaseDate = new Date();
        phaseDate.setDate(phaseDate.getDate() + (i * estimatedDays));

        await supabase
          .from('case_workflow_phases')
          .insert({
            case_id: caseId,
            phase_name: phase,
            phase_order: i + 1,
            estimated_start_date: phaseDate.toISOString().split('T')[0],
            status: i === 0 ? 'active' : 'pending',
            procedure_type: procedureType,
            created_at: new Date().toISOString()
          });
      }

      // Update case with workflow information
      await supabase
        .from('cases')
        .update({
          procedure_type: procedureType,
          estimated_duration_days: procedure.estimated_duration_days,
          workflow_automated: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

    } catch (error) {
      console.error('Error automating case workflow:', error);
      throw error;
    }
  }

  // 📈 LEGAL ANALYTICS
  async getCaseAnalytics(timeframe: '30days' | '6months' | '1year'): Promise<{
    totalCases: number;
    casesByType: Record<string, number>;
    successRate: number;
    averageDuration: number;
    deadlineCompliance: number;
    oabCompliance: number;
  }> {
    try {
      const daysBack = timeframe === '30days' ? 30 : timeframe === '6months' ? 180 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: cases, error } = await supabase
        .from('cases')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const totalCases = cases?.length || 0;
      const casesByType: Record<string, number> = {};
      let successfulCases = 0;
      let totalDuration = 0;
      let casesWithDuration = 0;

      cases?.forEach(case_ => {
        // Count by service type
        casesByType[case_.service_type] = (casesByType[case_.service_type] || 0) + 1;

        // Count successful cases
        if (case_.status === 'Closed - Won') {
          successfulCases++;
        }

        // Calculate duration for closed cases
        if (case_.actual_close_date && case_.start_date) {
          const startDate = new Date(case_.start_date);
          const endDate = new Date(case_.actual_close_date);
          const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          totalDuration += duration;
          casesWithDuration++;
        }
      });

      const successRate = totalCases > 0 ? (successfulCases / totalCases) * 100 : 0;
      const averageDuration = casesWithDuration > 0 ? totalDuration / casesWithDuration : 0;

      // Mock deadline and OAB compliance for now
      const deadlineCompliance = 92; // 92% compliance rate
      const oabCompliance = 98; // 98% OAB compliance

      return {
        totalCases,
        casesByType,
        successRate: Math.round(successRate),
        averageDuration: Math.round(averageDuration),
        deadlineCompliance,
        oabCompliance
      };
    } catch (error) {
      console.error('Error getting case analytics:', error);
      throw error;
    }
  }

  // 🚨 AUTOMATED COMPLIANCE ALERTS
  async generateComplianceAlerts(): Promise<{
    deadlineAlerts: Array<{
      caseId: string;
      caseTitle: string;
      deadline: string;
      daysRemaining: number;
      priority: string;
    }>;
    oabViolations: Array<{
      caseId: string;
      caseTitle: string;
      violation: string;
      severity: string;
    }>;
  }> {
    try {
      // Get upcoming deadlines
      const { data: upcomingDeadlines } = await supabase
        .from('case_deadlines')
        .select(`
          *,
          case:cases(id, case_title)
        `)
        .eq('status', 'pending')
        .gte('due_date', new Date().toISOString().split('T')[0])
        .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      const deadlineAlerts = upcomingDeadlines?.map(deadline => {
        const dueDate = new Date(deadline.due_date);
        const today = new Date();
        const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
          caseId: deadline.case_id,
          caseTitle: (deadline.case as any)?.case_title || 'Caso sem título',
          deadline: deadline.description,
          daysRemaining,
          priority: deadline.priority
        };
      }) || [];

      // Mock OAB violations for demonstration
      const oabViolations = [
        {
          caseId: 'mock-case-1',
          caseTitle: 'Ação Trabalhista - Empresa XYZ',
          violation: 'Contrato de honorários não formalizado',
          severity: 'medium'
        }
      ];

      return {
        deadlineAlerts,
        oabViolations
      };
    } catch (error) {
      console.error('Error generating compliance alerts:', error);
      throw error;
    }
  }
}

export const brazilianLegalService = new BrazilianLegalService();
export default brazilianLegalService;