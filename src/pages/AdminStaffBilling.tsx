
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, 
  Search, 
  Plus, 
  Calendar,
  Building,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText
} from 'lucide-react';
import { useStaffData } from '@/hooks/useStaffData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FinancialRecord {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  due_date?: string;
  payment_date?: string;
  invoice_number?: string;
  client_id: string;
  case_id?: string;
  created_at: string;
  client?: {
    company_name: string;
    contact_person: string;
  };
  case?: {
    case_title: string;
    case_number: string;
  };
}

const AdminStaffBilling = () => {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    client_id: '',
    case_id: '',
    description: '',
    amount: '',
    due_date: '',
    notes: ''
  });
  const { assignedClients, staffInfo, isStaff, hasAssignedClients } = useStaffData();
  const { toast } = useToast();

  useEffect(() => {
    if (hasAssignedClients) {
      fetchStaffFinancialRecords();
    }
  }, [hasAssignedClients, assignedClients]);

  const fetchStaffFinancialRecords = async () => {
    try {
      setLoading(true);
      
      const assignedClientIds = assignedClients.map(client => client.id);
      
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          client:clients!financial_records_client_id_fkey (
            company_name,
            contact_person
          ),
          case:cases!financial_records_case_id_fkey (
            case_title,
            case_number
          )
        `)
        .in('client_id', assignedClientIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: FinancialRecord[] = (data || []).map(record => ({
        ...record,
        client: Array.isArray(record.client) ? record.client[0] : record.client,
        case: Array.isArray(record.case) ? record.case[0] : record.case
      }));
      
      setRecords(transformedData);
    } catch (error: any) {
      console.error('Error fetching financial records:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar registros financeiros",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoiceForm.client_id || !newInvoiceForm.description || !newInvoiceForm.amount || !newInvoiceForm.due_date) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const { error } = await supabase
        .from('financial_records')
        .insert({
          type: 'invoice',
          description: newInvoiceForm.description,
          amount: parseFloat(newInvoiceForm.amount),
          status: 'pending',
          due_date: newInvoiceForm.due_date,
          invoice_number: invoiceNumber,
          client_id: newInvoiceForm.client_id,
          case_id: newInvoiceForm.case_id || undefined,
          notes: newInvoiceForm.notes || undefined,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fatura criada com sucesso"
      });

      setNewInvoiceForm({
        client_id: '',
        case_id: '',
        description: '',
        amount: '',
        due_date: '',
        notes: ''
      });
      setShowNewInvoiceDialog(false);
      fetchStaffFinancialRecords();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar fatura",
        variant: "destructive"
      });
    }
  };

  const handleViewRecordDetails = (record: FinancialRecord) => {
    toast({
      title: "Detalhes do Registro",
      description: `Visualizando registro: ${record.description}`,
    });
    
    // In a real implementation, this would open a detailed view modal
    // showing complete record information
  };

  const handleMarkAsPaid = async (record: FinancialRecord) => {
    try {
      const { error } = await supabase
        .from('financial_records')
        .update({
          status: 'Paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro marcado como pago com sucesso"
      });

      fetchStaffFinancialRecords();
    } catch (error: any) {
      console.error('Error marking as paid:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar registro como pago",
        variant: "destructive"
      });
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.client?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.invoice_number && record.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Invoice': return 'bg-blue-100 text-blue-800';
      case 'Receipt': return 'bg-green-100 text-green-800';
      case 'Expense': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Calculate totals
  const totalRevenue = records
    .filter(r => r.type === 'Invoice' && r.status === 'Paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPending = records
    .filter(r => r.type === 'Invoice' && r.status === 'Pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalOverdue = records
    .filter(r => r.type === 'Invoice' && r.status === 'Overdue')
    .reduce((sum, r) => sum + r.amount, 0);

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Acesso restrito à equipe.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Faturamento e Cobrança</h1>
              <p className="text-sm text-gray-600">
                Gestão financeira dos clientes atribuídos a {staffInfo?.full_name}
              </p>
            </div>
            <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Fatura
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova Fatura</DialogTitle>
                  <DialogDescription>
                    Crie uma nova fatura para um dos seus clientes atribuídos
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client">Cliente *</Label>
                      <Select value={newInvoiceForm.client_id} onValueChange={(value) => setNewInvoiceForm({...newInvoiceForm, client_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignedClients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="due_date">Data de Vencimento *</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={newInvoiceForm.due_date}
                        onChange={(e) => setNewInvoiceForm({...newInvoiceForm, due_date: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                      id="description"
                      value={newInvoiceForm.description}
                      onChange={(e) => setNewInvoiceForm({...newInvoiceForm, description: e.target.value})}
                      placeholder="Descreva o serviço prestado"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Valor *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={newInvoiceForm.amount}
                      onChange={(e) => setNewInvoiceForm({...newInvoiceForm, amount: e.target.value})}
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={newInvoiceForm.notes}
                      onChange={(e) => setNewInvoiceForm({...newInvoiceForm, notes: e.target.value})}
                      placeholder="Informações adicionais sobre a fatura"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewInvoiceDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateInvoice}>
                      <FileText className="mr-2 h-4 w-4" />
                      Criar Fatura
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {!hasAssignedClients ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você não tem clientes atribuídos. Entre em contato com o administrador.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalRevenue)}
                  </div>
                  <p className="text-xs text-gray-500">Faturas pagas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(totalPending)}
                  </div>
                  <p className="text-xs text-gray-500">Aguardando pagamento</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalOverdue)}
                  </div>
                  <p className="text-xs text-gray-500">Vencidas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{records.length}</div>
                  <p className="text-xs text-gray-500">Todos os registros</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar registros</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Buscar por descrição, cliente ou número da fatura..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status-filter">Status</Label>
                    <select
                      id="status-filter"
                      className="w-full p-2 border rounded-md"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="Pending">Pendente</option>
                      <option value="Paid">Pago</option>
                      <option value="Overdue">Em Atraso</option>
                      <option value="Cancelled">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="type-filter">Tipo</Label>
                    <select
                      id="type-filter"
                      className="w-full p-2 border rounded-md"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="Invoice">Fatura</option>
                      <option value="Receipt">Recibo</option>
                      <option value="Expense">Despesa</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Records Table */}
            <Card>
              <CardHeader>
                <CardTitle>Registros Financeiros</CardTitle>
                <CardDescription>
                  Lista de faturas, recibos e despesas dos clientes atribuídos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando registros...</p>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum registro encontrado
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                        ? 'Tente ajustar os filtros de busca.'
                        : 'Ainda não há registros financeiros para os clientes atribuídos.'}
                    </p>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Registro
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900">
                                {record.description}
                              </p>
                              <Badge className={getTypeColor(record.type)}>
                                {record.type}
                              </Badge>
                              <Badge className={getStatusColor(record.status)}>
                                {record.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {record.client?.company_name || 'Cliente não encontrado'}
                              </span>
                              {record.invoice_number && (
                                <span>Nº {record.invoice_number}</span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(record.created_at).toLocaleDateString('pt-BR')}
                              </span>
                              {record.due_date && (
                                <span className="text-yellow-600">
                                  Venc: {new Date(record.due_date).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              {formatCurrency(record.amount)}
                            </p>
                            {record.payment_date && (
                              <p className="text-xs text-green-600">
                                Pago em {new Date(record.payment_date).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => handleViewRecordDetails(record)}>
                            Ver Detalhes
                          </Button>
                          {record.status === 'Pending' && (
                            <Button size="sm" onClick={() => handleMarkAsPaid(record)}>
                              Marcar como Pago
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminStaffBilling;
