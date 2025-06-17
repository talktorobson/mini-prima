import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, X, Calendar, Clock, AlertTriangle, FileText } from 'lucide-react';
import { calendarService, CalendarEventWithDetails } from '@/services/calendarService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarEventFormProps {
  event?: CalendarEventWithDetails | null;
  onSubmit: () => void;
  onCancel: () => void;
}

interface Client {
  id: string;
  company_name: string;
}

interface Case {
  id: string;
  case_number: string;
  title: string;
  client_id: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

export function CalendarEventForm({ event, onSubmit, onCancel }: CalendarEventFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [deadlineTemplates, setDeadlineTemplates] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_type: event?.event_type || 'appointment',
    start_date: event?.start_date || new Date().toISOString().split('T')[0],
    start_time: event?.start_time || '',
    end_date: event?.end_date || '',
    end_time: event?.end_time || '',
    all_day: event?.all_day || false,
    case_id: event?.case_id || '',
    client_id: event?.client_id || '',
    staff_id: event?.staff_id || '',
    court_name: event?.court_name || '',
    court_address: event?.court_address || '',
    process_number: event?.process_number || '',
    priority: event?.priority || 'medium',
    status: event?.status || 'scheduled',
    location: event?.location || '',
    location_address: event?.location_address || '',
    travel_time_minutes: event?.travel_time_minutes || '',
    requires_preparation: event?.requires_preparation || false,
    preparation_time_hours: event?.preparation_time_hours || '',
    reminder_enabled: event?.reminder_enabled !== false,
    reminder_days_before: event?.reminder_days_before || 7,
    reminder_hours_before: event?.reminder_hours_before || 24,
    email_reminder: event?.email_reminder !== false,
    sms_reminder: event?.sms_reminder || false,
    is_legal_deadline: event?.is_legal_deadline || false,
    deadline_type: event?.deadline_type || '',
    consequence_of_missing: event?.consequence_of_missing || '',
    can_be_extended: event?.can_be_extended || false,
    extension_criteria: event?.extension_criteria || '',
    is_recurring: event?.is_recurring || false,
    required_documents: event?.required_documents || [],
    documents_prepared: event?.documents_prepared || false,
  });

  const eventTypes = calendarService.getEventTypes();
  const priorityLevels = calendarService.getPriorityLevels();
  const courts = calendarService.getBrazilianCourts();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.client_id) {
      const clientCases = cases.filter(c => c.client_id === formData.client_id);
      setFilteredCases(clientCases);
    } else {
      setFilteredCases(cases);
    }
  }, [formData.client_id, cases]);

  const loadData = async () => {
    try {
      const [clientsRes, casesRes, staffRes, templatesRes] = await Promise.all([
        supabase.from('clients').select('id, company_name').eq('status', 'approved').order('company_name'),
        supabase.from('cases').select('id, case_number, title, client_id').eq('status', 'active').order('case_number'),
        supabase.from('staff').select('id, name, role').eq('is_active', true).order('name'),
        calendarService.getDeadlineTemplates(),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (casesRes.error) throw casesRes.error;
      if (staffRes.error) throw staffRes.error;

      setClients(clientsRes.data || []);
      setCases(casesRes.data || []);
      setStaff(staffRes.data || []);
      setDeadlineTemplates(templatesRes);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do formulário',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData: any = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        start_date: formData.start_date,
        start_time: formData.all_day ? null : (formData.start_time || null),
        end_date: formData.end_date || null,
        end_time: formData.all_day ? null : (formData.end_time || null),
        all_day: formData.all_day,
        case_id: formData.case_id || null,
        client_id: formData.client_id || null,
        staff_id: formData.staff_id || null,
        court_name: formData.court_name || null,
        court_address: formData.court_address || null,
        process_number: formData.process_number || null,
        priority: formData.priority,
        status: formData.status,
        location: formData.location || null,
        location_address: formData.location_address || null,
        travel_time_minutes: formData.travel_time_minutes ? parseInt(formData.travel_time_minutes) : null,
        requires_preparation: formData.requires_preparation,
        preparation_time_hours: formData.preparation_time_hours ? parseInt(formData.preparation_time_hours) : null,
        reminder_enabled: formData.reminder_enabled,
        reminder_days_before: parseInt(formData.reminder_days_before.toString()),
        reminder_hours_before: parseInt(formData.reminder_hours_before.toString()),
        email_reminder: formData.email_reminder,
        sms_reminder: formData.sms_reminder,
        is_legal_deadline: formData.is_legal_deadline,
        deadline_type: formData.deadline_type || null,
        consequence_of_missing: formData.consequence_of_missing || null,
        can_be_extended: formData.can_be_extended,
        extension_criteria: formData.extension_criteria || null,
        is_recurring: formData.is_recurring,
        required_documents: formData.required_documents,
        documents_prepared: formData.documents_prepared,
      };

      if (event) {
        await calendarService.updateEvent(event.id, submitData);
        toast({
          title: 'Sucesso',
          description: 'Evento atualizado com sucesso',
        });
      } else {
        await calendarService.createEvent(submitData);
        toast({
          title: 'Sucesso',
          description: 'Evento criado com sucesso',
        });
      }

      onSubmit();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar evento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createFromTemplate = async (templateId: string) => {
    if (!formData.case_id) {
      toast({
        title: 'Erro',
        description: 'Selecione um caso para usar o modelo',
        variant: 'destructive',
      });
      return;
    }

    try {
      await calendarService.createDeadlineFromTemplate(
        templateId,
        formData.start_date,
        formData.case_id
      );
      
      toast({
        title: 'Sucesso',
        description: 'Prazo criado a partir do modelo',
      });
      
      onSubmit();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar prazo do modelo',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">
            <Calendar className="h-4 w-4 mr-2" />
            Básico
          </TabsTrigger>
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="reminders">
            <Clock className="h-4 w-4 mr-2" />
            Lembretes
          </TabsTrigger>
          <TabsTrigger value="templates">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Modelos
          </TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Audiência de instrução"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_type">Tipo de Evento *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: type.color }}
                        />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes sobre o evento..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value, case_id: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="case_id">Processo</Label>
              <Select
                value={formData.case_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, case_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o processo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum processo</SelectItem>
                  {filteredCases.map((case_) => (
                    <SelectItem key={case_.id} value={case_.id}>
                      {case_.case_number} - {case_.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff_id">Responsável</Label>
              <Select
                value={formData.staff_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, staff_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum responsável</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="all_day"
                checked={formData.all_day}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, all_day: checked }))}
              />
              <Label htmlFor="all_day">Evento de dia inteiro</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>

              {!formData.all_day && (
                <div className="space-y-2">
                  <Label htmlFor="start_time">Horário de Início</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="end_date">Data de Término</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>

              {!formData.all_day && (
                <div className="space-y-2">
                  <Label htmlFor="end_time">Horário de Término</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {priorityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: level.color }}
                        />
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
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
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="postponed">Adiado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {/* Court Information */}
          {(formData.event_type === 'court_hearing' || formData.is_legal_deadline) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Tribunal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="court_name">Nome do Tribunal</Label>
                    <Select
                      value={formData.court_name}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, court_name: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tribunal" />
                      </SelectTrigger>
                      <SelectContent>
                        {courts.map((court) => (
                          <SelectItem key={court.code} value={court.name}>
                            {court.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="process_number">Número do Processo</Label>
                    <Input
                      id="process_number"
                      value={formData.process_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, process_number: e.target.value }))}
                      placeholder="0000000-00.0000.0.00.0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="court_address">Endereço do Tribunal</Label>
                  <Textarea
                    id="court_address"
                    value={formData.court_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, court_address: e.target.value }))}
                    placeholder="Endereço completo do tribunal..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location and Logistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Local e Logística</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Nome do local"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travel_time_minutes">Tempo de Deslocamento (min)</Label>
                  <Input
                    id="travel_time_minutes"
                    type="number"
                    value={formData.travel_time_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, travel_time_minutes: e.target.value }))}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_address">Endereço</Label>
                <Textarea
                  id="location_address"
                  value={formData.location_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_address: e.target.value }))}
                  placeholder="Endereço completo do local..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_preparation"
                  checked={formData.requires_preparation}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_preparation: checked }))}
                />
                <Label htmlFor="requires_preparation">Requer preparação prévia</Label>
              </div>

              {formData.requires_preparation && (
                <div className="space-y-2">
                  <Label htmlFor="preparation_time_hours">Tempo de Preparação (horas)</Label>
                  <Input
                    id="preparation_time_hours"
                    type="number"
                    value={formData.preparation_time_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, preparation_time_hours: e.target.value }))}
                    placeholder="2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legal Deadline Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Informações de Prazo Legal</CardTitle>
                <Switch
                  checked={formData.is_legal_deadline}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_legal_deadline: checked }))}
                />
              </div>
            </CardHeader>
            {formData.is_legal_deadline && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadline_type">Tipo de Prazo</Label>
                    <Select
                      value={formData.deadline_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, deadline_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="statute_limitations">Prescrição</SelectItem>
                        <SelectItem value="appeal_deadline">Prazo Recursal</SelectItem>
                        <SelectItem value="response_deadline">Prazo de Resposta</SelectItem>
                        <SelectItem value="filing_deadline">Prazo de Peticionamento</SelectItem>
                        <SelectItem value="payment_deadline">Prazo de Pagamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_be_extended"
                      checked={formData.can_be_extended}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_be_extended: checked }))}
                    />
                    <Label htmlFor="can_be_extended">Pode ser prorrogado</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consequence_of_missing">Consequências se Perdido</Label>
                  <Textarea
                    id="consequence_of_missing"
                    value={formData.consequence_of_missing}
                    onChange={(e) => setFormData(prev => ({ ...prev, consequence_of_missing: e.target.value }))}
                    placeholder="Ex: Decadência do direito, revelia, etc."
                  />
                </div>

                {formData.can_be_extended && (
                  <div className="space-y-2">
                    <Label htmlFor="extension_criteria">Critérios para Prorrogação</Label>
                    <Textarea
                      id="extension_criteria"
                      value={formData.extension_criteria}
                      onChange={(e) => setFormData(prev => ({ ...prev, extension_criteria: e.target.value }))}
                      placeholder="Condições necessárias para prorrogação..."
                    />
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações de Lembrete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="reminder_enabled"
                  checked={formData.reminder_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminder_enabled: checked }))}
                />
                <Label htmlFor="reminder_enabled">Ativar lembretes</Label>
              </div>

              {formData.reminder_enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reminder_days_before">Lembrar X dias antes</Label>
                      <Input
                        id="reminder_days_before"
                        type="number"
                        value={formData.reminder_days_before}
                        onChange={(e) => setFormData(prev => ({ ...prev, reminder_days_before: parseInt(e.target.value) || 0 }))}
                        min="0"
                        placeholder="7"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reminder_hours_before">Lembrar X horas antes</Label>
                      <Input
                        id="reminder_hours_before"
                        type="number"
                        value={formData.reminder_hours_before}
                        onChange={(e) => setFormData(prev => ({ ...prev, reminder_hours_before: parseInt(e.target.value) || 0 }))}
                        min="0"
                        placeholder="24"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Métodos de Lembrete</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="email_reminder"
                          checked={formData.email_reminder}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_reminder: checked }))}
                        />
                        <Label htmlFor="email_reminder">Lembrete por e-mail</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="sms_reminder"
                          checked={formData.sms_reminder}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sms_reminder: checked }))}
                        />
                        <Label htmlFor="sms_reminder">Lembrete por SMS</Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modelos de Prazos Brasileiros</CardTitle>
              <CardDescription>
                Use modelos pré-configurados para criar prazos legais automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deadlineTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-600">{template.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">{template.days_from_trigger} dias</Badge>
                        <Badge variant="outline">{template.legal_basis}</Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => createFromTemplate(template.id)}
                      disabled={!formData.case_id}
                    >
                      Usar Modelo
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.title}
        >
          {loading ? (
            'Salvando...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {event ? 'Atualizar' : 'Criar'} Evento
            </>
          )}
        </Button>
      </div>
    </form>
  );
}