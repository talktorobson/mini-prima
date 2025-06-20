// 💳 PAYABLES MANAGEMENT COMPONENT
// Comprehensive Accounts Payable Management Interface

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Filter,
  Download,
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Upload,
  Search,
  MoreHorizontal,
  CreditCard,
  Building
} from 'lucide-react';

import { billsService, supplierService, financialAnalyticsService, type Bill, type Supplier } from '@/lib/financialService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const PayablesManagement: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showNewBillDialog, setShowNewBillDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    supplier_id: '',
    search: '',
    due_date_from: '',
    due_date_to: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadBills();
    loadSuppliers();
  }, [filters]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const data = await billsService.getBills(filters);
      setBills(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a pagar",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getSuppliers({ active: true });
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const handleExport = async () => {
    try {
      console.log('Exporting payables data...');
      const blob = await financialAnalyticsService.exportToExcel('bills', filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contas-a-pagar-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Dados exportados com sucesso",
      });
    } catch (error) {
      console.error('Error exporting payables data:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar dados",
        variant: "destructive"
      });
    }
  };

  const handleFilter = () => {
    console.log('Opening filter dialog...');
    // TODO: Implement advanced filter dialog
    toast({
      title: "Filtros",
      description: "Funcionalidade de filtros avançados será implementada em breve",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      pending: { label: 'Pendente', variant: 'default' as const },
      approved: { label: 'Aprovado', variant: 'secondary' as const },
      paid: { label: 'Pago', variant: 'default' as const },
      overdue: { label: 'Vencido', variant: 'destructive' as const },
      cancelled: { label: 'Cancelado', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <Clock className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleApproveBill = async (billId: string) => {
    try {
      await billsService.approveBill(billId, 'current-user-id', 'Aprovado via interface');
      toast({
        title: "Sucesso",
        description: "Conta aprovada com sucesso"
      });
      loadBills();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao aprovar conta",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsPaid = async (billId: string, paymentData: any) => {
    try {
      await billsService.markBillAsPaid(billId, paymentData, 'current-user-id');
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso"
      });
      setShowPaymentDialog(false);
      loadBills();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento",
        variant: "destructive"
      });
    }
  };

  // Summary calculations
  const totalOutstanding = bills.filter(b => ['pending', 'approved', 'overdue'].includes(b.status))
    .reduce((sum, bill) => sum + bill.remaining_amount, 0);
  
  const overdueAmount = bills.filter(b => b.status === 'overdue')
    .reduce((sum, bill) => sum + bill.remaining_amount, 0);
  
  const pendingApproval = bills.filter(b => b.status === 'pending')
    .reduce((sum, bill) => sum + bill.total_amount, 0);

  const dueSoon = bills.filter(b => {
    const dueDate = new Date(b.due_date);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= weekFromNow && ['pending', 'approved'].includes(b.status);
  }).reduce((sum, bill) => sum + bill.remaining_amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Header and Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</div>
            <p className="text-xs text-gray-600">Contas a pagar em aberto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
            <p className="text-xs text-gray-600">Contas em atraso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vence em 7 dias</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(dueSoon)}</div>
            <p className="text-xs text-gray-600">Ação necessária</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovação</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(pendingApproval)}</div>
            <p className="text-xs text-gray-600">Aguardando aprovação</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>Gerencie todas as obrigações financeiras da empresa</CardDescription>
            </div>
            
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Dialog open={showNewBillDialog} onOpenChange={setShowNewBillDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Conta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Nova Conta a Pagar</DialogTitle>
                    <DialogDescription>
                      Cadastre uma nova obrigação financeira
                    </DialogDescription>
                  </DialogHeader>
                  <NewBillForm 
                    suppliers={suppliers}
                    onSuccess={() => {
                      setShowNewBillDialog(false);
                      loadBills();
                    }}
                  />
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              
              <Button variant="outline" onClick={handleFilter}>
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por descrição, número da conta ou fornecedor..."
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
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.supplier_id} onValueChange={(value) => setFilters({...filters, supplier_id: value})}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bills Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                      Nenhuma conta encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill) => (
                    <TableRow key={bill.id} className="hover:bg-gray-50">
                      <TableCell>
                        {getPriorityIcon(bill.priority)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{bill.bill_number || 'S/N'}</p>
                          {bill.reference_number && (
                            <p className="text-xs text-gray-600">Ref: {bill.reference_number}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span>{bill.supplier?.name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-xs truncate">{bill.description}</p>
                        {bill.category && (
                          <p className="text-xs text-gray-600">{bill.category.name}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(bill.total_amount)}</p>
                          {bill.remaining_amount !== bill.total_amount && (
                            <p className="text-xs text-green-600">
                              Restante: {formatCurrency(bill.remaining_amount)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className={`text-sm ${
                            new Date(bill.due_date) < new Date() && bill.status !== 'paid' 
                              ? 'text-red-600 font-medium' 
                              : 'text-gray-900'
                          }`}>
                            {formatDate(bill.due_date)}
                          </p>
                          {new Date(bill.due_date) < new Date() && bill.status !== 'paid' && (
                            <p className="text-xs text-red-600">
                              {Math.floor((new Date().getTime() - new Date(bill.due_date).getTime()) / (1000 * 60 * 60 * 24))} dias
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(bill.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {bill.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveBill(bill.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                          )}
                          
                          {bill.status === 'approved' && bill.remaining_amount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowPaymentDialog(true);
                              }}
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pagar
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
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Registre o pagamento da conta {selectedBill?.bill_number}
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <PaymentForm
              bill={selectedBill}
              onSubmit={handleMarkAsPaid}
              onCancel={() => setShowPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// New Bill Form Component
const NewBillForm: React.FC<{
  suppliers: Supplier[];
  onSuccess: () => void;
}> = ({ suppliers, onSuccess }) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    category_id: '',
    description: '',
    amount: '',
    tax_amount: '0',
    due_date: '',
    reference_number: '',
    payment_type: 'one_time',
    priority: 'normal',
    notes: ''
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await billsService.createBill({
        ...formData,
        amount: parseFloat(formData.amount),
        tax_amount: parseFloat(formData.tax_amount || '0'),
        created_by: 'current-user-id'
      } as any);
      
      toast({
        title: "Sucesso",
        description: "Conta criada com sucesso"
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar conta",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier_id">Fornecedor</Label>
          <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o fornecedor" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
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
          placeholder="Descreva a conta a pagar"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Valor Principal</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="0,00"
            required
          />
        </div>

        <div>
          <Label htmlFor="tax_amount">Impostos</Label>
          <Input
            id="tax_amount"
            type="number"
            step="0.01"
            value={formData.tax_amount}
            onChange={(e) => setFormData({...formData, tax_amount: e.target.value})}
            placeholder="0,00"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="reference_number">Número de Referência</Label>
        <Input
          id="reference_number"
          value={formData.reference_number}
          onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
          placeholder="Número da nota fiscal ou referência do fornecedor"
        />
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Informações adicionais sobre esta conta"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">Cancelar</Button>
        <Button type="submit">Criar Conta</Button>
      </div>
    </form>
  );
};

// Payment Form Component
const PaymentForm: React.FC<{
  bill: Bill;
  onSubmit: (billId: string, paymentData: any) => void;
  onCancel: () => void;
}> = ({ bill, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState({
    amount: bill.remaining_amount.toString(),
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'transfer',
    reference_number: '',
    notes: '',
    proof_file: null as File | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let proof_url = '';
    
    // Upload payment proof if file is provided
    if (paymentData.proof_file) {
      try {
        const timestamp = Date.now();
        const filename = `payment-proof-${timestamp}-${paymentData.proof_file.name}`;
        const filePath = `payment-proofs/${bill.id}/${filename}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, paymentData.proof_file);
          
        if (uploadError) {
          console.error('Error uploading payment proof:', uploadError);
          toast({
            title: "Erro",
            description: "Erro ao fazer upload do comprovante",
            variant: "destructive"
          });
          return;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
          
        proof_url = urlData.publicUrl;
      } catch (error) {
        console.error('Error processing payment proof:', error);
        toast({
          title: "Erro",
          description: "Erro ao processar comprovante",
          variant: "destructive"
        });
        return;
      }
    }
    
    onSubmit(bill.id, {
      ...paymentData,
      amount: parseFloat(paymentData.amount),
      proof_url
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium">Detalhes da Conta</h4>
        <p className="text-sm text-gray-600">Fornecedor: {bill.supplier?.name}</p>
        <p className="text-sm text-gray-600">Valor Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.total_amount)}</p>
        <p className="text-sm text-gray-600">Valor Restante: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.remaining_amount)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Valor do Pagamento</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={paymentData.amount}
            onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
            max={bill.remaining_amount}
            required
          />
        </div>

        <div>
          <Label htmlFor="payment_date">Data do Pagamento</Label>
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
          placeholder="Informações adicionais sobre o pagamento"
        />
      </div>

      <div>
        <Label htmlFor="proof_file">Comprovante de Pagamento</Label>
        <Input
          id="proof_file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setPaymentData({...paymentData, proof_file: file});
          }}
          className="cursor-pointer"
        />
        <p className="text-sm text-gray-500 mt-1">
          Anexe o comprovante do pagamento (PDF, JPG, PNG - máx. 10MB)
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Registrar Pagamento</Button>
      </div>
    </form>
  );
};