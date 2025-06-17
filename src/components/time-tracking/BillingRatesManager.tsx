import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, Edit3, Save, X, Calendar } from 'lucide-react';
import { timeTrackingService } from '@/services/timeTrackingService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface BillingRate {
  id: string;
  staff_id: string;
  default_hourly_rate: number;
  task_type?: string;
  custom_rate?: number;
  client_id?: string;
  client_rate?: number;
  effective_from: string;
  effective_until?: string;
  is_active: boolean;
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface Client {
  id: string;
  company_name: string;
}

export function BillingRatesManager() {
  const { toast } = useToast();
  const [rates, setRates] = useState<BillingRate[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRateForm, setShowNewRateForm] = useState(false);
  const [editingRate, setEditingRate] = useState<BillingRate | null>(null);

  const [formData, setFormData] = useState({
    staff_id: '',
    default_hourly_rate: '',
    task_type: '',
    custom_rate: '',
    client_id: '',
    client_rate: '',
    effective_from: new Date().toISOString().split('T')[0],
    effective_until: '',
  });

  const taskTypes = timeTrackingService.getTaskTypes();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadBillingRates(),
        loadStaff(),
        loadClients(),
      ]);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBillingRates = async () => {
    const rates = await timeTrackingService.getBillingRates();
    setRates(rates);
  };

  const loadStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    setStaff(data || []);
  };

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('status', 'approved')
      .order('company_name');

    if (error) throw error;
    setClients(data || []);
  };

  const resetForm = () => {
    setFormData({
      staff_id: '',
      default_hourly_rate: '',
      task_type: '',
      custom_rate: '',
      client_id: '',
      client_rate: '',
      effective_from: new Date().toISOString().split('T')[0],
      effective_until: '',
    });
    setShowNewRateForm(false);
    setEditingRate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData: any = {
        staff_id: formData.staff_id,
        effective_from: formData.effective_from,
        effective_until: formData.effective_until || null,
      };

      // Default rate
      if (formData.default_hourly_rate) {
        submitData.default_hourly_rate = parseFloat(formData.default_hourly_rate);
      }

      // Task-specific rate
      if (formData.task_type && formData.custom_rate) {
        submitData.task_type = formData.task_type;
        submitData.custom_rate = parseFloat(formData.custom_rate);
      }

      // Client-specific rate
      if (formData.client_id && formData.client_rate) {
        submitData.client_id = formData.client_id;
        submitData.client_rate = parseFloat(formData.client_rate);
      }

      await timeTrackingService.setBillingRate(submitData);
      
      toast({
        title: 'Sucesso',
        description: 'Taxa de cobrança salva com sucesso',
      });
      
      resetForm();
      loadBillingRates();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar taxa de cobrança',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getRateDescription = (rate: BillingRate) => {
    if (rate.client_id) {
      const client = clients.find(c => c.id === rate.client_id);
      return `Cliente: ${client?.company_name || 'N/A'}`;
    }
    
    if (rate.task_type) {
      const taskType = taskTypes.find(t => t.value === rate.task_type);
      return `Atividade: ${taskType?.label || rate.task_type}`;
    }
    
    return 'Taxa padrão';
  };

  const getRateValue = (rate: BillingRate) => {
    if (rate.client_rate) return rate.client_rate;
    if (rate.custom_rate) return rate.custom_rate;
    return rate.default_hourly_rate;
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? staffMember.name : 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Valores de Cobrança</h2>
          <p className="text-gray-600">
            Configure as taxas horárias por advogado, tipo de atividade e cliente
          </p>
        </div>
        <Dialog open={showNewRateForm} onOpenChange={setShowNewRateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Taxa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Taxa de Cobrança</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff_id">Advogado *</Label>
                <Select
                  value={formData.staff_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, staff_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um advogado" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((staffMember) => (
                      <SelectItem key={staffMember.id} value={staffMember.id}>
                        {staffMember.name} ({staffMember.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_hourly_rate">Taxa Padrão por Hora (R$)</Label>
                <Input
                  id="default_hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.default_hourly_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_hourly_rate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task_type">Tipo de Atividade (Opcional)</Label>
                  <Select
                    value={formData.task_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {taskTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom_rate">Taxa Específica (R$)</Label>
                  <Input
                    id="custom_rate"
                    type="number"
                    step="0.01"
                    value={formData.custom_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_rate: e.target.value }))}
                    placeholder="0.00"
                    disabled={!formData.task_type}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente Específico (Opcional)</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_rate">Taxa do Cliente (R$)</Label>
                  <Input
                    id="client_rate"
                    type="number"
                    step="0.01"
                    value={formData.client_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_rate: e.target.value }))}
                    placeholder="0.00"
                    disabled={!formData.client_id}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="effective_from">Válido a partir de *</Label>
                  <Input
                    id="effective_from"
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData(prev => ({ ...prev, effective_from: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effective_until">Válido até (Opcional)</Label>
                  <Input
                    id="effective_until"
                    type="date"
                    value={formData.effective_until}
                    onChange={(e) => setFormData(prev => ({ ...prev, effective_until: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Taxas Configuradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Carregando taxas...</p>
            </div>
          ) : rates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma taxa configurada</p>
              <p className="text-sm">Adicione taxas de cobrança para os advogados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Advogado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor/Hora</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <div className="font-medium">
                          {getStaffName(rate.staff_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getRateDescription(rate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(getRateValue(rate))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>De: {formatDate(rate.effective_from)}</div>
                          {rate.effective_until && (
                            <div>Até: {formatDate(rate.effective_until)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rate.is_active ? 'default' : 'secondary'}>
                          {rate.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRate(rate)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {staff.length}
              </div>
              <div className="text-sm text-gray-600">Advogados Ativos</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rates.filter(r => r.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Taxas Ativas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {rates.filter(r => r.client_id).length}
              </div>
              <div className="text-sm text-gray-600">Taxas por Cliente</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}