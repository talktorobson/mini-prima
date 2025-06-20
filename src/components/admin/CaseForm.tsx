// 📝 Case Management Form Component
// D'Avila Reis Legal Practice Management System
// Complete form for creating and editing cases

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle,
  Building,
  Scale,
  DollarSign,
  Calendar,
  Users,
  FileText,
  Target,
  Clock,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { caseService, CreateCaseRequest, UpdateCaseRequest } from '@/services/caseService';
import { financialValidationService } from '@/services/financialValidationService';

interface Client {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
}

interface Staff {
  id: string;
  full_name: string;
  email: string;
  position: string;
}

interface CaseFormProps {
  caseId?: string; // If provided, we're editing; otherwise creating
  onSuccess?: (case_: any) => void;
  onCancel?: () => void;
}

export const CaseForm: React.FC<CaseFormProps> = ({ 
  caseId, 
  onSuccess, 
  onCancel 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!caseId;

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    case_title: '',
    service_type: '',
    description: '',
    assigned_lawyer: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    status: 'Open' as any,
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
    expected_close_date: '',
    hourly_rate: '',
    fixed_fee: '',
    total_value: '',
    risk_level: 'Medium' as 'Low' | 'Medium' | 'High',
    case_risk_value: '',
    opposing_party: '',
    counterparty_name: '',
    court_agency: '',
    court_process_number: '',
    case_number_external: '',
    notes: '',
    supporting_staff: [] as string[],
    hours_budgeted: '',
    progress_percentage: 0,
    hours_worked: '',
    outcome: '',
    next_steps: '',
    key_dates: '',
    client_satisfaction: ''
  });

  // Loading and data states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [existingCase, setExistingCase] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Service type options
  const serviceTypes = [
    'Direito Trabalhista',
    'Direito Civil',
    'Direito Empresarial',
    'Consultoria Jurídica',
    'Compliance',
    'Contratos',
    'Tributário',
    'Família',
    'Criminal',
    'Imobiliário',
    'Outros'
  ];

  // Status options
  const statusOptions = [
    'Open',
    'In Progress', 
    'Waiting Client',
    'Waiting Court',
    'On Hold',
    'Closed - Won',
    'Closed - Lost',
    'Cancelled'
  ];

  useEffect(() => {
    loadInitialData();
  }, [caseId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Load clients and staff
      await Promise.all([
        loadClients(),
        loadStaff()
      ]);

      // If editing, load existing case data
      if (isEditing && caseId) {
        await loadExistingCase(caseId);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Erro ao carregar dados iniciais');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, company_name, contact_person, email, phone')
      .eq('status', 'Active')
      .order('company_name');

    if (error) {
      throw new Error(`Erro ao carregar clientes: ${error.message}`);
    }

    setClients(data || []);
  };

  const loadStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, full_name, email, position')
      .eq('status', 'Active')
      .order('full_name');

    if (error) {
      throw new Error(`Erro ao carregar equipe: ${error.message}`);
    }

    setStaff(data || []);
  };

  const loadExistingCase = async (caseId: string) => {
    try {
      const case_ = await caseService.getCaseById(caseId);
      if (!case_) {
        throw new Error('Caso não encontrado');
      }

      setExistingCase(case_);
      
      // Populate form with existing data
      setFormData({
        client_id: case_.client_id,
        case_title: case_.case_title,
        service_type: case_.service_type,
        description: case_.description || '',
        assigned_lawyer: case_.assigned_lawyer || '',
        priority: case_.priority as any,
        status: case_.status as any,
        start_date: case_.start_date,
        due_date: case_.due_date || '',
        expected_close_date: case_.expected_close_date || '',
        hourly_rate: case_.hourly_rate?.toString() || '',
        fixed_fee: case_.fixed_fee?.toString() || '',
        total_value: case_.total_value?.toString() || '',
        risk_level: case_.risk_level as any || 'Medium',
        case_risk_value: case_.case_risk_value?.toString() || '',
        opposing_party: case_.opposing_party || '',
        counterparty_name: case_.counterparty_name || '',
        court_agency: case_.court_agency || '',
        court_process_number: case_.court_process_number || '',
        case_number_external: case_.case_number_external || '',
        notes: case_.notes || '',
        supporting_staff: case_.supporting_staff ? 
          (Array.isArray(case_.supporting_staff) ? case_.supporting_staff : JSON.parse(case_.supporting_staff as string)) : [],
        hours_budgeted: case_.hours_budgeted?.toString() || '',
        progress_percentage: case_.progress_percentage || 0,
        hours_worked: case_.hours_worked?.toString() || '',
        outcome: case_.outcome || '',
        next_steps: case_.next_steps || '',
        key_dates: case_.key_dates || '',
        client_satisfaction: case_.client_satisfaction?.toString() || ''
      });
    } catch (error) {
      console.error('Error loading case:', error);
      throw error;
    }
  };

  // Comprehensive validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required field validation
    if (!formData.client_id) {
      errors.client_id = 'Cliente é obrigatório';
    }
    if (!formData.case_title) {
      errors.case_title = 'Título do caso é obrigatório';
    }
    if (!formData.service_type) {
      errors.service_type = 'Tipo de serviço é obrigatório';
    }
    
    // Date validation
    if (formData.start_date && formData.due_date) {
      const startDate = new Date(formData.start_date);
      const dueDate = new Date(formData.due_date);
      if (startDate >= dueDate) {
        errors.due_date = 'Data de prazo deve ser posterior à data de início';
      }
    }
    
    if (formData.start_date && formData.expected_close_date) {
      const startDate = new Date(formData.start_date);
      const expectedClose = new Date(formData.expected_close_date);
      if (startDate >= expectedClose) {
        errors.expected_close_date = 'Data prevista de encerramento deve ser posterior à data de início';
      }
    }
    
    // Date range validation (not more than 10 years in the future)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10);
    
    if (formData.due_date && new Date(formData.due_date) > maxDate) {
      errors.due_date = 'Data de prazo não pode ser superior a 10 anos no futuro';
    }
    
    if (formData.expected_close_date && new Date(formData.expected_close_date) > maxDate) {
      errors.expected_close_date = 'Data prevista não pode ser superior a 10 anos no futuro';
    }
    
    // Financial validation
    if (formData.hourly_rate) {
      const hourlyRate = parseFloat(formData.hourly_rate);
      if (hourlyRate < 0) {
        errors.hourly_rate = 'Taxa por hora não pode ser negativa';
      }
      if (hourlyRate > 10000) {
        errors.hourly_rate = 'Taxa por hora parece excessivamente alta (máximo R$ 10.000/h)';
      }
    }
    
    if (formData.fixed_fee) {
      const fixedFee = parseFloat(formData.fixed_fee);
      if (fixedFee < 0) {
        errors.fixed_fee = 'Honorários fixos não podem ser negativos';
      }
      if (fixedFee > 10000000) {
        errors.fixed_fee = 'Honorários fixos parecem excessivamente altos (máximo R$ 10.000.000)';
      }
    }
    
    if (formData.total_value) {
      const totalValue = parseFloat(formData.total_value);
      if (totalValue < 0) {
        errors.total_value = 'Valor total não pode ser negativo';
      }
    }
    
    if (formData.case_risk_value) {
      const riskValue = parseFloat(formData.case_risk_value);
      if (riskValue < 0) {
        errors.case_risk_value = 'Valor da causa não pode ser negativo';
      }
    }
    
    if (formData.hours_budgeted) {
      const hoursBudgeted = parseFloat(formData.hours_budgeted);
      if (hoursBudgeted < 0) {
        errors.hours_budgeted = 'Horas orçadas não podem ser negativas';
      }
      if (hoursBudgeted > 10000) {
        errors.hours_budgeted = 'Horas orçadas parecem excessivamente altas (máximo 10.000h)';
      }
    }
    
    if (formData.hours_worked) {
      const hoursWorked = parseFloat(formData.hours_worked);
      if (hoursWorked < 0) {
        errors.hours_worked = 'Horas trabalhadas não podem ser negativas';
      }
      // Check if hours worked exceed budgeted hours by more than 200%
      if (formData.hours_budgeted && hoursWorked > parseFloat(formData.hours_budgeted) * 3) {
        errors.hours_worked = 'Horas trabalhadas excedem significativamente o orçado. Verifique os valores.';
      }
    }
    
    // Progress validation
    if (formData.progress_percentage < 0 || formData.progress_percentage > 100) {
      errors.progress_percentage = 'Progresso deve estar entre 0% e 100%';
    }
    
    // Client satisfaction validation
    if (formData.client_satisfaction) {
      const satisfaction = parseInt(formData.client_satisfaction);
      if (satisfaction < 1 || satisfaction > 5) {
        errors.client_satisfaction = 'Satisfação do cliente deve estar entre 1 e 5';
      }
    }
    
    // Court process number format validation (Brazilian format)
    if (formData.court_process_number) {
      // Brazilian process number format: NNNNNNN-DD.AAAA.J.TR.OOOO
      const processNumberPattern = /^\d{7}-\d{2}\.\d{4}\.[\d]\.[\d]{2}\.\d{4}$|^\d{20}$/;
      if (!processNumberPattern.test(formData.court_process_number.replace(/\s/g, ''))) {
        errors.court_process_number = 'Formato inválido. Use: NNNNNNN-DD.AAAA.J.TR.OOOO ou 20 dígitos sequenciais';
      }
    }
    
    // Case title length validation
    if (formData.case_title && formData.case_title.length > 200) {
      errors.case_title = 'Título do caso não pode exceder 200 caracteres';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Form data:', formData);
    
    // Clear previous errors
    setError(null);
    setValidationErrors({});
    
    // Validate form
    if (!validateForm()) {
      setError('Por favor, corrija os erros indicados nos campos');
      console.log('Form validation failed:', validationErrors);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Verify user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
      }

      console.log('User authenticated:', user.id);

      // Prepare data with proper type conversion and validation
      const preparedData = {
        client_id: formData.client_id.trim(),
        case_title: formData.case_title.trim(),
        service_type: formData.service_type,
        description: formData.description?.trim() || null,
        assigned_lawyer: formData.assigned_lawyer || null,
        priority: formData.priority,
        status: formData.status,
        start_date: formData.start_date,
        due_date: formData.due_date || null,
        expected_close_date: formData.expected_close_date || null,
        opposing_party: formData.opposing_party?.trim() || null,
        counterparty_name: formData.counterparty_name?.trim() || null,
        court_agency: formData.court_agency?.trim() || null,
        court_process_number: formData.court_process_number?.trim() || null,
        case_number_external: formData.case_number_external?.trim() || null,
        notes: formData.notes?.trim() || null,
        risk_level: formData.risk_level,
        // Financial fields with proper validation
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        fixed_fee: formData.fixed_fee ? parseFloat(formData.fixed_fee) : null,
        total_value: formData.total_value ? parseFloat(formData.total_value) : null,
        case_risk_value: formData.case_risk_value ? parseFloat(formData.case_risk_value) : null,
        hours_budgeted: formData.hours_budgeted ? parseFloat(formData.hours_budgeted) : null,
        // Supporting staff with proper array handling
        supporting_staff: formData.supporting_staff.length > 0 ? formData.supporting_staff : []
      };

      console.log('Prepared data:', preparedData);

      // Validate client exists
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('id', preparedData.client_id)
        .single();

      if (clientError || !clientData) {
        throw new Error('Cliente selecionado não encontrado no sistema');
      }

      console.log('Client verified:', clientData.company_name);

      // Validate assigned lawyer if provided
      if (preparedData.assigned_lawyer) {
        const { data: lawyerData, error: lawyerError } = await supabase
          .from('staff')
          .select('id, full_name')
          .eq('id', preparedData.assigned_lawyer)
          .single();

        if (lawyerError || !lawyerData) {
          throw new Error('Advogado selecionado não encontrado no sistema');
        }

        console.log('Assigned lawyer verified:', lawyerData.full_name);
      }

      if (isEditing && caseId) {
        // Update existing case
        const updateRequest: UpdateCaseRequest = {
          id: caseId,
          ...preparedData,
          hours_worked: formData.hours_worked ? parseFloat(formData.hours_worked) : undefined,
          client_satisfaction: formData.client_satisfaction ? parseInt(formData.client_satisfaction) : undefined,
          progress_percentage: formData.progress_percentage,
          next_steps: formData.next_steps?.trim() || null,
          key_dates: formData.key_dates?.trim() || null,
          outcome: formData.outcome?.trim() || null
        };

        console.log('Updating case with data:', updateRequest);

        const updatedCase = await caseService.updateCase(updateRequest);
        
        console.log('Case updated successfully:', updatedCase.id);

        toast({
          title: "Sucesso",
          description: "Caso atualizado com sucesso",
          variant: "success"
        });

        if (onSuccess) {
          onSuccess(updatedCase);
        } else {
          navigate('/admin/staff/cases');
        }
      } else {
        // Create new case
        const createRequest: CreateCaseRequest = preparedData;

        console.log('Creating new case with data:', createRequest);

        const newCase = await caseService.createCase(createRequest);
        
        console.log('Case created successfully:', newCase.id);

        toast({
          title: "Sucesso",
          description: `Caso "${newCase.case_title}" criado com sucesso!`,
          variant: "success"
        });

        if (onSuccess) {
          onSuccess(newCase);
        } else {
          navigate('/admin/staff/cases');
        }
      }
    } catch (error: any) {
      console.error('Error saving case:', error);
      
      // Provide specific error messages
      let errorMessage = 'Erro inesperado ao salvar caso';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        switch (error.code) {
          case '23505': // Unique violation
            errorMessage = 'Já existe um caso com essas informações';
            break;
          case '23503': // Foreign key violation
            errorMessage = 'Dados relacionados não encontrados. Verifique cliente e advogado selecionados.';
            break;
          case '23502': // Not null violation
            errorMessage = 'Campos obrigatórios não preenchidos corretamente';
            break;
          default:
            errorMessage = `Erro no banco de dados: ${error.code}`;
        }
      }
      
      setError(errorMessage);
      
      toast({
        title: "Erro ao Salvar",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/admin/staff/cases');
    }
  };

  const handleSupportingStaffChange = (staffId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      supporting_staff: checked 
        ? [...prev.supporting_staff, staffId]
        : prev.supporting_staff.filter(id => id !== staffId)
    }));
  };

  // Utility function to get staff member name by ID
  const getStaffMemberById = (staffId: string) => {
    return staff.find(s => s.id === staffId);
  };

  // Real-time validation on field change
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Caso' : 'Novo Caso'}
            </h1>
            {isEditing && existingCase && (
              <p className="text-gray-600">
                {existingCase.case_number} • {existingCase.case_title}
              </p>
            )}
          </div>
        </div>
        
        {isEditing && existingCase && (
          <Badge 
            variant={existingCase.status === 'Open' ? 'default' : 'secondary'}
            className="text-sm"
          >
            {existingCase.status}
          </Badge>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Validation Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Corrija os seguintes erros:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {Object.entries(validationErrors).map(([field, message]) => (
                  message && <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Informações Básicas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Cliente *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, client_id: value }));
                    // Clear validation error when field is corrected
                    if (validationErrors.client_id) {
                      setValidationErrors(prev => ({ ...prev, client_id: '' }));
                    }
                  }}
                >
                  <SelectTrigger className={validationErrors.client_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name} - {client.contact_person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.client_id && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.client_id}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">Tipo de Serviço *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, service_type: value }));
                    if (validationErrors.service_type) {
                      setValidationErrors(prev => ({ ...prev, service_type: '' }));
                    }
                  }}
                >
                  <SelectTrigger className={validationErrors.service_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o tipo de serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.service_type && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.service_type}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="case_title">Título do Caso *</Label>
              <Input
                id="case_title"
                value={formData.case_title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, case_title: e.target.value }));
                  if (validationErrors.case_title) {
                    setValidationErrors(prev => ({ ...prev, case_title: '' }));
                  }
                }}
                placeholder="Descreva brevemente o caso"
                className={validationErrors.case_title ? 'border-red-500' : ''}
                maxLength={200}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {validationErrors.case_title && (
                    <span className="text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {validationErrors.case_title}
                    </span>
                  )}
                </span>
                <span>{formData.case_title.length}/200</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição detalhada do caso"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Assignment and Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Atribuição e Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigned_lawyer">Advogado Responsável</Label>
                <Select
                  value={formData.assigned_lawyer}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_lawyer: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um advogado" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.filter(s => s.position.toLowerCase().includes('advogado') || s.position.toLowerCase().includes('lawyer')).map(lawyer => (
                      <SelectItem key={lawyer.id} value={lawyer.id}>
                        {lawyer.full_name} - {lawyer.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Display selected lawyer details */}
                {formData.assigned_lawyer && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    {(() => {
                      const selectedLawyer = getStaffMemberById(formData.assigned_lawyer);
                      return selectedLawyer ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">{selectedLawyer.full_name}</span>
                          <Badge variant="outline" className="text-xs">{selectedLawyer.position}</Badge>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-orange-600">Advogado não encontrado (ID: {formData.assigned_lawyer.substring(0, 8)}...)</span>
                        </div>
                      );
                    })()
                    }
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Baixa</SelectItem>
                    <SelectItem value="Medium">Média</SelectItem>
                    <SelectItem value="High">Alta</SelectItem>
                    <SelectItem value="Urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Supporting Staff */}
            <div className="space-y-2">
              <Label>Equipe de Apoio</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {staff.filter(s => !s.position.toLowerCase().includes('advogado')).map(member => (
                  <label key={member.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.supporting_staff.includes(member.id)}
                      onChange={(e) => handleSupportingStaffChange(member.id, e.target.checked)}
                      className="rounded"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{member.full_name}</span>
                      <span className="text-xs text-gray-500">{member.position}</span>
                    </div>
                  </label>
                ))}
              </div>
              
              {/* Display selected supporting staff */}
              {formData.supporting_staff.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700">Equipe Selecionada:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.supporting_staff.map(staffId => {
                      const staffMember = staff.find(s => s.id === staffId);
                      return staffMember ? (
                        <Badge key={staffId} variant="secondary" className="text-xs">
                          {staffMember.full_name} - {staffMember.position}
                        </Badge>
                      ) : (
                        <Badge key={staffId} variant="destructive" className="text-xs">
                          Membro Inativo (ID: {staffId.substring(0, 8)}...)
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dates and Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Cronograma e Progresso</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Prazo</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, due_date: e.target.value }));
                    if (validationErrors.due_date) {
                      setValidationErrors(prev => ({ ...prev, due_date: '' }));
                    }
                  }}
                  className={validationErrors.due_date ? 'border-red-500' : ''}
                />
                {validationErrors.due_date && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.due_date}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Data Prevista de Encerramento</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, expected_close_date: e.target.value }));
                    if (validationErrors.expected_close_date) {
                      setValidationErrors(prev => ({ ...prev, expected_close_date: '' }));
                    }
                  }}
                  className={validationErrors.expected_close_date ? 'border-red-500' : ''}
                />
                {validationErrors.expected_close_date && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.expected_close_date}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="progress_percentage">Progresso (%)</Label>
                  <Input
                    id="progress_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress_percentage}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, progress_percentage: parseInt(e.target.value) || 0 }));
                      if (validationErrors.progress_percentage) {
                        setValidationErrors(prev => ({ ...prev, progress_percentage: '' }));
                      }
                    }}
                    className={validationErrors.progress_percentage ? 'border-red-500' : ''}
                  />
                  {validationErrors.progress_percentage && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {validationErrors.progress_percentage}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours_worked">Horas Trabalhadas</Label>
                  <Input
                    id="hours_worked"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hours_worked}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, hours_worked: e.target.value }));
                      if (validationErrors.hours_worked) {
                        setValidationErrors(prev => ({ ...prev, hours_worked: '' }));
                      }
                    }}
                    className={validationErrors.hours_worked ? 'border-red-500' : ''}
                  />
                  {validationErrors.hours_worked && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {validationErrors.hours_worked}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Informações Financeiras</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Taxa por Hora (R$)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10000"
                  value={formData.hourly_rate}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, hourly_rate: e.target.value }));
                    if (validationErrors.hourly_rate) {
                      setValidationErrors(prev => ({ ...prev, hourly_rate: '' }));
                    }
                  }}
                  className={validationErrors.hourly_rate ? 'border-red-500' : ''}
                  placeholder="Ex: 350.00"
                />
                {validationErrors.hourly_rate && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.hourly_rate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fixed_fee">Honorários Fixos (R$)</Label>
                <Input
                  id="fixed_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10000000"
                  value={formData.fixed_fee}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, fixed_fee: e.target.value }));
                    if (validationErrors.fixed_fee) {
                      setValidationErrors(prev => ({ ...prev, fixed_fee: '' }));
                    }
                  }}
                  className={validationErrors.fixed_fee ? 'border-red-500' : ''}
                  placeholder="Ex: 5000.00"
                />
                {validationErrors.fixed_fee && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.fixed_fee}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_value">Valor Total (R$)</Label>
                <Input
                  id="total_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_value}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, total_value: e.target.value }));
                    if (validationErrors.total_value) {
                      setValidationErrors(prev => ({ ...prev, total_value: '' }));
                    }
                  }}
                  className={validationErrors.total_value ? 'border-red-500' : ''}
                  placeholder="Ex: 25000.00"
                />
                {validationErrors.total_value && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.total_value}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours_budgeted">Horas Orçadas</Label>
                <Input
                  id="hours_budgeted"
                  type="number"
                  step="0.5"
                  min="0"
                  max="10000"
                  value={formData.hours_budgeted}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, hours_budgeted: e.target.value }));
                    if (validationErrors.hours_budgeted) {
                      setValidationErrors(prev => ({ ...prev, hours_budgeted: '' }));
                    }
                  }}
                  className={validationErrors.hours_budgeted ? 'border-red-500' : ''}
                  placeholder="Ex: 40.0"
                />
                {validationErrors.hours_budgeted && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.hours_budgeted}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="case_risk_value">Valor da Causa (R$)</Label>
                <Input
                  id="case_risk_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.case_risk_value}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, case_risk_value: e.target.value }));
                    if (validationErrors.case_risk_value) {
                      setValidationErrors(prev => ({ ...prev, case_risk_value: '' }));
                    }
                  }}
                  className={validationErrors.case_risk_value ? 'border-red-500' : ''}
                  placeholder="Ex: 100000.00"
                />
                {validationErrors.case_risk_value && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.case_risk_value}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scale className="h-5 w-5" />
              <span>Detalhes Jurídicos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opposing_party">Parte Contrária</Label>
                <Input
                  id="opposing_party"
                  value={formData.opposing_party}
                  onChange={(e) => setFormData(prev => ({ ...prev, opposing_party: e.target.value }))}
                  placeholder="Nome da parte contrária"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk_level">Nível de Risco</Label>
                <Select
                  value={formData.risk_level}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, risk_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Baixo</SelectItem>
                    <SelectItem value="Medium">Médio</SelectItem>
                    <SelectItem value="High">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="court_agency">Tribunal/Órgão</Label>
                <Input
                  id="court_agency"
                  value={formData.court_agency}
                  onChange={(e) => setFormData(prev => ({ ...prev, court_agency: e.target.value }))}
                  placeholder="Ex: TJSP, TRT, STJ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="court_process_number">Número do Processo</Label>
                <Input
                  id="court_process_number"
                  value={formData.court_process_number}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, court_process_number: e.target.value }));
                    if (validationErrors.court_process_number) {
                      setValidationErrors(prev => ({ ...prev, court_process_number: '' }));
                    }
                  }}
                  placeholder="Ex: 1234567-89.2023.8.26.0001"
                  className={validationErrors.court_process_number ? 'border-red-500' : ''}
                />
                {validationErrors.court_process_number && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.court_process_number}
                  </p>
                )}
                <p className="text-xs text-gray-500">Formato: NNNNNNN-DD.AAAA.J.TR.OOOO ou 20 dígitos</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="case_number_external">Número Externo do Caso</Label>
              <Input
                id="case_number_external"
                value={formData.case_number_external}
                onChange={(e) => setFormData(prev => ({ ...prev, case_number_external: e.target.value }))}
                placeholder="Referência externa do cliente"
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Informações Adicionais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações internas sobre o caso"
                rows={3}
              />
            </div>

            {isEditing && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="next_steps">Próximos Passos</Label>
                  <Textarea
                    id="next_steps"
                    value={formData.next_steps}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_steps: e.target.value }))}
                    placeholder="Próximas ações a serem tomadas"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key_dates">Datas Importantes</Label>
                  <Textarea
                    id="key_dates"
                    value={formData.key_dates}
                    onChange={(e) => setFormData(prev => ({ ...prev, key_dates: e.target.value }))}
                    placeholder="Datas de audiências, prazos, etc."
                    rows={2}
                  />
                </div>

                {formData.status.startsWith('Closed') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="outcome">Resultado</Label>
                      <Textarea
                        id="outcome"
                        value={formData.outcome}
                        onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
                        placeholder="Resultado do caso"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_satisfaction">Satisfação do Cliente (1-5)</Label>
                      <Input
                        id="client_satisfaction"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.client_satisfaction}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, client_satisfaction: e.target.value }));
                          if (validationErrors.client_satisfaction) {
                            setValidationErrors(prev => ({ ...prev, client_satisfaction: '' }));
                          }
                        }}
                        className={validationErrors.client_satisfaction ? 'border-red-500' : ''}
                        placeholder="1 = Muito Insatisfeito, 5 = Muito Satisfeito"
                      />
                      {validationErrors.client_satisfaction && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {validationErrors.client_satisfaction}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>

          <div className="flex items-center space-x-2">
            {/* Validation Status Indicator */}
            {Object.keys(validationErrors).length === 0 && formData.client_id && formData.case_title && formData.service_type && (
              <div className="flex items-center text-green-600 text-sm mr-4">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Formulário válido</span>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={isSaving || Object.keys(validationErrors).length > 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Atualizando...' : 'Criando...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Atualizar Caso' : 'Criar Caso'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CaseForm;