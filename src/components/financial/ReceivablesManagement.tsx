// 💰 RECEIVABLES MANAGEMENT COMPONENT
// Comprehensive Accounts Receivable Management Interface

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Plus,
  Download,
  FileText,
  DollarSign,
  AlertTriangle,
  Clock,
  Eye,
  Send,
  CreditCard,
  Building2,
  Calendar,
  TrendingUp,
  Users,
  BarChart3,
  Mail,
  Phone,
  MoreHorizontal
} from 'lucide-react';

import { invoicesService, type Invoice, type AgingReport } from '@/lib/financialService';
import { useToast } from '@/hooks/use-toast';

export const ReceivablesManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agingReport, setAgingReport] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    client_id: '',
    search: '',
    due_date_from: '',
    due_date_to: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
    loadAgingReport();
  }, [filters]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesService.getInvoices(filters);
      setInvoices(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a receber",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAgingReport = async () => {
    try {
      const aging = await invoicesService.getAgingReport();
      setAgingReport(aging);
    } catch (error) {
      console.error('Error loading aging report:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      sent: { label: 'Enviada', variant: 'default' as const },
      viewed: { label: 'Visualizada', variant: 'secondary' as const },
      partial_paid: { label: 'Pago Parcial', variant: 'secondary' as const },
      paid: { label: 'Paga', variant: 'default' as const },
      overdue: { label: 'Vencida', variant: 'destructive' as const },
      cancelled: { label: 'Cancelada', variant: 'outline' as const },
      disputed: { label: 'Contestada', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCollectionStatusBadge = (status: string) => {
    const statusConfig = {
      none: { label: 'Normal', variant: 'outline' as const },
      reminder_sent: { label: 'Lembrete Enviado', variant: 'secondary' as const },
      first_notice: { label: '1º Aviso', variant: 'secondary' as const },
      second_notice: { label: '2º Aviso', variant: 'destructive' as const },
      collection_agency: { label: 'Cobrança', variant: 'destructive' as const },
      legal_action: { label: 'Ação Legal', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await invoicesService.sendInvoice(invoiceId);
      toast({
        title: "Sucesso",
        description: "Fatura enviada com sucesso"
      });
      loadInvoices();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar fatura",
        variant: "destructive"
      });
    }
  };

  const handleRecordPayment = async (invoiceId: string, paymentData: any) => {
    try {
      await invoicesService.recordPayment(invoiceId, paymentData, 'current-user-id');
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso"
      });
      setShowPaymentDialog(false);
      loadInvoices();
      loadAgingReport();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento",
        variant: "destructive"
      });
    }
  };

  // Summary calculations
  const totalOutstanding = invoices.filter(i => ['sent', 'viewed', 'partial_paid', 'overdue'].includes(i.status))
    .reduce((sum, invoice) => sum + invoice.remaining_amount, 0);
  
  const overdueAmount = invoices.filter(i => i.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.remaining_amount, 0);
  
  const currentAmount = invoices.filter(i => {
    const dueDate = new Date(i.due_date);
    const today = new Date();
    return dueDate >= today && ['sent', 'viewed', 'partial_paid'].includes(i.status);
  }).reduce((sum, invoice) => sum + invoice.remaining_amount, 0);

  const paidThisMonth = invoices.filter(i => {
    const paidDate = new Date();
    const firstDayOfMonth = new Date(paidDate.getFullYear(), paidDate.getMonth(), 1);
    return i.status === 'paid' && new Date(i.created_at) >= firstDayOfMonth;
  }).reduce((sum, invoice) => sum + invoice.total_amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalOutstanding)}</div>
            <p className="text-xs text-gray-600">Faturas em aberto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
            <p className="text-xs text-gray-600">Necessita cobrança</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Vencer</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(currentAmount)}</div>
            <p className="text-xs text-gray-600">Dentro do prazo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(paidThisMonth)}</div>
            <p className="text-xs text-gray-600">Pagamentos recebidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Report */}
      {agingReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Relatório de Aging (Análise de Vencimento)
            </CardTitle>
            <CardDescription>Distribuição das contas a receber por período de vencimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(agingReport.current)}</p>
                <p className="text-xs text-gray-600">Atual</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(agingReport.days1to30)}</p>
                <p className="text-xs text-gray-600">1-30 dias</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(agingReport.days31to60)}</p>
                <p className="text-xs text-gray-600">31-60 dias</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{formatCurrency(agingReport.days61to90)}</p>
                <p className="text-xs text-gray-600">61-90 dias</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-800">{formatCurrency(agingReport.over90Days)}</p>
                <p className="text-xs text-gray-600">+90 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>Gerencie todas as faturas e recebimentos da empresa</CardDescription>
            </div>
            
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Fatura
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Nova Fatura</DialogTitle>
                    <DialogDescription>
                      Crie uma nova fatura para cobrança de serviços
                    </DialogDescription>
                  </DialogHeader>
                  <NewInvoiceForm 
                    onSuccess={() => {
                      setShowNewInvoiceDialog(false);
                      loadInvoices();
                    }}
                  />
                </DialogContent>
              </Dialog>
              
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por número, cliente ou descrição..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full"
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="viewed">Visualizada</SelectItem>
                <SelectItem value="partial_paid">Pago Parcial</SelectItem>
                <SelectItem value="paid">Paga</SelectItem>
                <SelectItem value="overdue">Vencida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cobrança</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                      Nenhuma fatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          {invoice.reference_number && (
                            <p className="text-xs text-gray-600">Ref: {invoice.reference_number}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span>{invoice.client?.name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-xs truncate">{invoice.description}</p>
                        {invoice.case && (
                          <p className="text-xs text-gray-600">Processo: {invoice.case.case_number}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                          {invoice.remaining_amount !== invoice.total_amount && (
                            <p className="text-xs text-green-600">
                              Restante: {formatCurrency(invoice.remaining_amount)}
                            </p>
                          )}
                          {invoice.subscription_discount_applied > 0 && (
                            <p className="text-xs text-blue-600">
                              Desconto: {invoice.subscription_discount_percentage}%
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className={`text-sm ${
                            new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' 
                              ? 'text-red-600 font-medium' 
                              : 'text-gray-900'
                          }`}>
                            {formatDate(invoice.due_date)}
                          </p>
                          {new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && (
                            <p className="text-xs text-red-600">
                              {Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))} dias
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                        {getCollectionStatusBadge(invoice.collection_status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {invoice.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendInvoice(invoice.id)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Enviar
                            </Button>
                          )}
                          
                          {['sent', 'viewed', 'partial_paid', 'overdue'].includes(invoice.status) && invoice.remaining_amount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowPaymentDialog(true);
                              }}
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Receber
                            </Button>
                          )}
                          
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
            <DialogDescription>
              Registre o pagamento da fatura {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <PaymentForm
              invoice={selectedInvoice}
              onSubmit={handleRecordPayment}
              onCancel={() => setShowPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// New Invoice Form Component
const NewInvoiceForm: React.FC<{
  onSuccess: () => void;
}> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    client_id: '',
    case_id: '',
    description: '',
    due_date: '',
    payment_terms: '30',
    service_period_start: '',
    service_period_end: '',
    notes: ''
  });

  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unit_price: 0 }
  ]);

  const { toast } = useToast();

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setLineItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await invoicesService.createInvoice({
        ...formData,
        payment_terms: parseInt(formData.payment_terms),
        created_by: 'current-user-id'
      } as any, lineItems);
      
      toast({
        title: "Sucesso",
        description: "Fatura criada com sucesso"
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar fatura",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_id">Cliente</Label>
          <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {/* Client options would be loaded from API */}
              <SelectItem value="client1">Cliente 1</SelectItem>
              <SelectItem value="client2">Cliente 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="due_date">Data de Vencimento</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({...formData, due_date: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Descrição dos serviços prestados"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="service_period_start">Período de Serviço - Início</Label>
          <Input
            id="service_period_start"
            type="date"
            value={formData.service_period_start}
            onChange={(e) => setFormData({...formData, service_period_start: e.target.value})}
          />
        </div>

        <div>
          <Label htmlFor="service_period_end">Período de Serviço - Fim</Label>
          <Input
            id="service_period_end"
            type="date"
            value={formData.service_period_end}
            onChange={(e) => setFormData({...formData, service_period_end: e.target.value})}
          />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Itens da Fatura</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>

        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 items-end">
              <div className="col-span-2">
                <Input
                  placeholder="Descrição do item"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={item.unit_price}
                  onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                />
                {lineItems.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal:</span>
            <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateSubtotal())}</span>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Informações adicionais sobre esta fatura"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">Cancelar</Button>
        <Button type="submit">Criar Fatura</Button>
      </div>
    </form>
  );
};

// Payment Form Component
const PaymentForm: React.FC<{
  invoice: Invoice;
  onSubmit: (invoiceId: string, paymentData: any) => void;
  onCancel: () => void;
}> = ({ invoice, onSubmit, onCancel }) => {
  const [paymentData, setPaymentData] = useState({
    amount: invoice.remaining_amount.toString(),
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'transfer',
    reference_number: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(invoice.id, {
      ...paymentData,
      amount: parseFloat(paymentData.amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium">Detalhes da Fatura</h4>
        <p className="text-sm text-gray-600">Cliente: {invoice.client?.name}</p>
        <p className="text-sm text-gray-600">Valor Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total_amount)}</p>
        <p className="text-sm text-gray-600">Valor Restante: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.remaining_amount)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Valor Recebido</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={paymentData.amount}
            onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
            max={invoice.remaining_amount}
            required
          />
        </div>

        <div>
          <Label htmlFor="payment_date">Data do Recebimento</Label>
          <Input
            id="payment_date"
            type="date"
            value={paymentData.payment_date}
            onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="payment_method">Método de Pagamento</Label>
        <Select value={paymentData.payment_method} onValueChange={(value) => setPaymentData({...paymentData, payment_method: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transfer">Transferência Bancária</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
            <SelectItem value="check">Cheque</SelectItem>
            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
            <SelectItem value="cash">Dinheiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="reference_number">Número de Referência</Label>
        <Input
          id="reference_number"
          value={paymentData.reference_number}
          onChange={(e) => setPaymentData({...paymentData, reference_number: e.target.value})}
          placeholder="Número da transação, cheque, etc."
        />
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={paymentData.notes}
          onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
          placeholder="Informações adicionais sobre o recebimento"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Registrar Recebimento</Button>
      </div>
    </form>
  );
};