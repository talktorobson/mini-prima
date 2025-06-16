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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.case_title || !formData.service_type) {
      setError('Cliente, título do caso e tipo de serviço são obrigatórios');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && caseId) {
        // Update existing case
        const updateRequest: UpdateCaseRequest = {
          id: caseId,
          ...formData,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
          fixed_fee: formData.fixed_fee ? parseFloat(formData.fixed_fee) : undefined,
          total_value: formData.total_value ? parseFloat(formData.total_value) : undefined,
          case_risk_value: formData.case_risk_value ? parseFloat(formData.case_risk_value) : undefined,
          hours_budgeted: formData.hours_budgeted ? parseFloat(formData.hours_budgeted) : undefined,
          hours_worked: formData.hours_worked ? parseFloat(formData.hours_worked) : undefined,
          client_satisfaction: formData.client_satisfaction ? parseInt(formData.client_satisfaction) : undefined
        };

        const updatedCase = await caseService.updateCase(updateRequest);
        
        toast({
          title: "Sucesso",
          description: "Caso atualizado com sucesso"
        });

        if (onSuccess) {
          onSuccess(updatedCase);
        } else {
          navigate('/admin/staff/cases');
        }
      } else {
        // Create new case
        const createRequest: CreateCaseRequest = {
          ...formData,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
          fixed_fee: formData.fixed_fee ? parseFloat(formData.fixed_fee) : undefined,
          total_value: formData.total_value ? parseFloat(formData.total_value) : undefined,
          case_risk_value: formData.case_risk_value ? parseFloat(formData.case_risk_value) : undefined,
          hours_budgeted: formData.hours_budgeted ? parseFloat(formData.hours_budgeted) : undefined
        };

        const newCase = await caseService.createCase(createRequest);
        
        toast({
          title: "Sucesso",
          description: "Caso criado com sucesso"
        });

        if (onSuccess) {
          onSuccess(newCase);
        } else {
          navigate('/admin/staff/cases');
        }
      }
    } catch (error: any) {
      console.error('Error saving case:', error);
      setError(error.message || 'Erro ao salvar caso');
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
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                >
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">Tipo de Serviço *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="case_title">Título do Caso *</Label>
              <Input
                id="case_title"
                value={formData.case_title}
                onChange={(e) => setFormData(prev => ({ ...prev, case_title: e.target.value }))}
                placeholder="Descreva brevemente o caso"
              />
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
                    <span>{member.full_name}</span>
                  </label>
                ))}
              </div>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Data Prevista de Encerramento</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_close_date: e.target.value }))}
                />
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
                    onChange={(e) => setFormData(prev => ({ ...prev, progress_percentage: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours_worked">Horas Trabalhadas</Label>
                  <Input
                    id="hours_worked"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hours_worked}
                    onChange={(e) => setFormData(prev => ({ ...prev, hours_worked: e.target.value }))}
                  />
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
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fixed_fee">Honorários Fixos (R$)</Label>
                <Input
                  id="fixed_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fixed_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, fixed_fee: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_value">Valor Total (R$)</Label>
                <Input
                  id="total_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_value: e.target.value }))}
                />
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
                  value={formData.hours_budgeted}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours_budgeted: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="case_risk_value">Valor da Causa (R$)</Label>
                <Input
                  id="case_risk_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.case_risk_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, case_risk_value: e.target.value }))}
                />
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
                  onChange={(e) => setFormData(prev => ({ ...prev, court_process_number: e.target.value }))}
                  placeholder="Número do processo judicial"
                />
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
                        onChange={(e) => setFormData(prev => ({ ...prev, client_satisfaction: e.target.value }))}
                      />
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
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
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