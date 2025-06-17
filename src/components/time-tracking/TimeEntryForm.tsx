import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Save, X } from 'lucide-react';
import { timeTrackingService } from '@/services/timeTrackingService';
import { supabase } from '@/integrations/supabase/client';

interface TimeEntryFormProps {
  mode: 'timer' | 'manual';
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
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

export function TimeEntryForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  disabled = false,
}: TimeEntryFormProps) {
  const [formData, setFormData] = useState({
    client_id: initialData?.client_id || '',
    case_id: initialData?.case_id || '',
    description: initialData?.description || '',
    task_type: initialData?.task_type || '',
    start_time: initialData?.start_time || new Date().toISOString().slice(0, 16),
    end_time: initialData?.end_time || '',
    billable_minutes: initialData?.billable_minutes || '',
    is_billable: initialData?.is_billable !== false,
    hourly_rate: initialData?.hourly_rate || '',
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [estimatedRate, setEstimatedRate] = useState<number>(0);

  const taskTypes = timeTrackingService.getTaskTypes();

  useEffect(() => {
    loadClients();
    loadCases();
  }, []);

  useEffect(() => {
    if (formData.client_id) {
      const clientCases = cases.filter(c => c.client_id === formData.client_id);
      setFilteredCases(clientCases);
    } else {
      setFilteredCases(cases);
    }
  }, [formData.client_id, cases]);

  useEffect(() => {
    if (formData.task_type || formData.client_id) {
      loadEstimatedRate();
    }
  }, [formData.task_type, formData.client_id]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('status', 'approved')
        .order('company_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, title, client_id')
        .eq('status', 'active')
        .order('case_number');

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const loadEstimatedRate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const rate = await timeTrackingService.getStaffBillingRate(
        user.id,
        formData.client_id || undefined,
        formData.task_type || undefined
      );
      setEstimatedRate(rate);
      
      if (!formData.hourly_rate && rate > 0) {
        setFormData(prev => ({ ...prev, hourly_rate: rate.toString() }));
      }
    } catch (error) {
      console.error('Error loading estimated rate:', error);
    }
  };

  const calculateDuration = () => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      const diffMs = end.getTime() - start.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? diffMinutes : 0;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData: any = {
        client_id: formData.client_id || null,
        case_id: formData.case_id || null,
        description: formData.description,
        task_type: formData.task_type,
        is_billable: formData.is_billable,
        hourly_rate: parseFloat(formData.hourly_rate) || estimatedRate,
      };

      if (mode === 'manual') {
        submitData.start_time = formData.start_time;
        submitData.end_time = formData.end_time;
        
        if (formData.billable_minutes) {
          submitData.billable_minutes = parseInt(formData.billable_minutes);
        } else {
          const duration = calculateDuration();
          submitData.billable_minutes = duration;
        }
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const duration = calculateDuration();
  const billableMinutes = formData.billable_minutes ? parseInt(formData.billable_minutes) : duration;
  const estimatedAmount = (billableMinutes / 60) * (parseFloat(formData.hourly_rate) || estimatedRate);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client and Case Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client">Cliente (Opcional)</Label>
          <Select
            value={formData.client_id}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, client_id: value, case_id: '' }));
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
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
          <Label htmlFor="case">Processo (Opcional)</Label>
          <Select
            value={formData.case_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, case_id: value }))}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um processo" />
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
      </div>

      {/* Task Type and Description */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="task_type">Tipo de Atividade *</Label>
          <Select
            value={formData.task_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value }))}
            disabled={disabled}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de atividade" />
            </SelectTrigger>
            <SelectContent>
              {taskTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição da Atividade *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descreva detalhadamente a atividade realizada..."
            className="min-h-[100px]"
            disabled={disabled}
            required
          />
        </div>
      </div>

      {/* Time Settings (Manual Mode Only) */}
      {mode === 'manual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Horário de Início *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                disabled={disabled}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Horário de Término *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                disabled={disabled}
                required
              />
            </div>
          </div>

          {duration > 0 && (
            <div className="space-y-2">
              <Label htmlFor="billable_minutes">Tempo Faturável (minutos)</Label>
              <Input
                id="billable_minutes"
                type="number"
                value={formData.billable_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, billable_minutes: e.target.value }))}
                placeholder={`Padrão: ${duration} minutos`}
                disabled={disabled}
              />
              <p className="text-sm text-gray-500">
                Duração total: {timeTrackingService.formatDuration(duration)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Billing Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_billable"
            checked={formData.is_billable}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_billable: checked }))}
            disabled={disabled}
          />
          <Label htmlFor="is_billable">Tempo faturável</Label>
        </div>

        {formData.is_billable && (
          <div className="space-y-2">
            <Label htmlFor="hourly_rate">Valor por Hora (R$)</Label>
            <Input
              id="hourly_rate"
              type="number"
              step="0.01"
              value={formData.hourly_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
              placeholder={estimatedRate > 0 ? `Sugerido: R$ ${estimatedRate.toFixed(2)}` : 'Digite o valor'}
              disabled={disabled}
            />
            {estimatedAmount > 0 && (
              <p className="text-sm text-gray-600">
                Valor estimado: {timeTrackingService.formatCurrency(estimatedAmount)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Estimated Cost Card */}
      {formData.is_billable && estimatedAmount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Valor Estimado</p>
                <p className="text-xl font-semibold text-blue-700">
                  {timeTrackingService.formatCurrency(estimatedAmount)}
                </p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>{timeTrackingService.formatDuration(billableMinutes)}</p>
                <p>× R$ {(parseFloat(formData.hourly_rate) || estimatedRate).toFixed(2)}/h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          disabled={loading || disabled || !formData.description || !formData.task_type}
        >
          {loading ? (
            'Processando...'
          ) : mode === 'timer' ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Iniciar Timer
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Registro
            </>
          )}
        </Button>
      </div>
    </form>
  );
}