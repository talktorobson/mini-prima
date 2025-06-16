// 🏢 SUPPLIERS MANAGEMENT COMPONENT
// Comprehensive Vendor/Provider Management Interface

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
  Search,
  Filter,
  Download,
  Building2,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Eye,
  CreditCard,
  Bell,
  BellOff,
  Users,
  MoreHorizontal,
  FileText,
  Calendar,
  DollarSign,
  Clock
} from 'lucide-react';

import { supplierService, billsService, type Supplier } from '@/lib/financialService';
import { useToast } from '@/hooks/use-toast';

export const SuppliersManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showNewSupplierDialog, setShowNewSupplierDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    active: true,
    category: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadSuppliers();
  }, [filters]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSuppliers(filters);
      setSuppliers(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar fornecedores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (supplierData: Partial<Supplier>) => {
    try {
      await supplierService.createSupplier({
        ...supplierData,
        created_by: 'current-user-id'
      });
      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso"
      });
      setShowNewSupplierDialog(false);
      loadSuppliers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar fornecedor",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    try {
      await supplierService.updateSupplier(id, supplierData);
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso"
      });
      setShowEditDialog(false);
      loadSuppliers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar fornecedor",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateSupplier = async (id: string) => {
    try {
      await supplierService.deleteSupplier(id);
      toast({
        title: "Sucesso",
        description: "Fornecedor desativado com sucesso"
      });
      loadSuppliers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao desativar fornecedor",
        variant: "destructive"
      });
    }
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      transfer: { label: 'Transferência', variant: 'default' as const },
      pix: { label: 'PIX', variant: 'secondary' as const },
      boleto: { label: 'Boleto', variant: 'outline' as const },
      check: { label: 'Cheque', variant: 'secondary' as const }
    };

    const config = methodConfig[method as keyof typeof methodConfig] || { label: method, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{suppliers.length}</div>
            <p className="text-xs text-gray-600">Cadastros ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {suppliers.filter(s => s.is_active).length}
            </div>
            <p className="text-xs text-gray-600">Fornecedores em uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {suppliers.filter(s => s.notifications_enabled).length}
            </div>
            <p className="text-xs text-gray-600">Com notificações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PIX Habilitado</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {suppliers.filter(s => s.preferred_payment_method === 'pix').length}
            </div>
            <p className="text-xs text-gray-600">Pagamento via PIX</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Gestão de Fornecedores</CardTitle>
              <CardDescription>Gerencie todos os fornecedores e prestadores de serviços</CardDescription>
            </div>
            
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Dialog open={showNewSupplierDialog} onOpenChange={setShowNewSupplierDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Fornecedor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Novo Fornecedor</DialogTitle>
                    <DialogDescription>
                      Cadastre um novo fornecedor ou prestador de serviços
                    </DialogDescription>
                  </DialogHeader>
                  <SupplierForm 
                    onSubmit={handleCreateSupplier}
                    onCancel={() => setShowNewSupplierDialog(false)}
                  />
                </DialogContent>
              </Dialog>
              
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              
              <Button variant="outline">
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
                placeholder="Buscar por nome, empresa ou email..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full"
              />
            </div>
            
            <Select value={filters.active.toString()} onValueChange={(value) => setFilters({...filters, active: value === 'true'})}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativos</SelectItem>
                <SelectItem value="false">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Suppliers Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      Nenhum fornecedor encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          {supplier.company_name && (
                            <p className="text-xs text-gray-600">{supplier.company_name}</p>
                          )}
                          {supplier.tax_id && (
                            <p className="text-xs text-gray-600">CNPJ/CPF: {supplier.tax_id}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Mail className="w-3 h-3 mr-1" />
                              {supplier.email}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Phone className="w-3 h-3 mr-1" />
                              {formatPhone(supplier.phone)}
                            </div>
                          )}
                          {supplier.contact_name && (
                            <p className="text-xs text-gray-600">Contato: {supplier.contact_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start space-x-1 text-xs text-gray-600">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          <div>
                            {supplier.city && supplier.state ? (
                              <p>{supplier.city}, {supplier.state}</p>
                            ) : (
                              <p>Não informado</p>
                            )}
                            {supplier.country && (
                              <p>{supplier.country}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getPaymentMethodBadge(supplier.preferred_payment_method)}
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {supplier.payment_terms} dias
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                            {supplier.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            {supplier.notifications_enabled ? (
                              <Bell className="w-3 h-3 text-green-600" />
                            ) : (
                              <BellOff className="w-3 h-3 text-gray-400" />
                            )}
                            {supplier.auto_send_confirmation && (
                              <Badge variant="outline" className="text-xs">Auto</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          {supplier.is_active && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeactivateSupplier(supplier.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                          
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

      {/* Edit Supplier Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
            <DialogDescription>
              Atualize as informações do fornecedor {selectedSupplier?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <SupplierForm 
              supplier={selectedSupplier}
              onSubmit={(data) => handleUpdateSupplier(selectedSupplier.id, data)}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Supplier Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Fornecedor</DialogTitle>
            <DialogDescription>
              Informações completas de {selectedSupplier?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <SupplierDetails supplier={selectedSupplier} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Supplier Form Component
const SupplierForm: React.FC<{
  supplier?: Supplier;
  onSubmit: (data: Partial<Supplier>) => void;
  onCancel: () => void;
}> = ({ supplier, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    company_name: supplier?.company_name || '',
    contact_name: supplier?.contact_name || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    mobile_phone: supplier?.mobile_phone || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    state: supplier?.state || '',
    postal_code: supplier?.postal_code || '',
    country: supplier?.country || 'Brasil',
    tax_id: supplier?.tax_id || '',
    payment_terms: supplier?.payment_terms?.toString() || '30',
    preferred_payment_method: supplier?.preferred_payment_method || 'transfer',
    notes: supplier?.notes || '',
    notifications_enabled: supplier?.notifications_enabled ?? true,
    auto_send_confirmation: supplier?.auto_send_confirmation ?? true,
    is_active: supplier?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      payment_terms: parseInt(formData.payment_terms)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
          <TabsTrigger value="contact">Contato & Endereço</TabsTrigger>
          <TabsTrigger value="payment">Pagamento & Config</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome do Fornecedor *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nome principal do fornecedor"
                required
              />
            </div>

            <div>
              <Label htmlFor="company_name">Razão Social</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                placeholder="Razão social ou nome da empresa"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_name">Nome do Contato</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                placeholder="Pessoa de contato principal"
              />
            </div>

            <div>
              <Label htmlFor="tax_id">CNPJ/CPF</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                placeholder="Documento fiscal"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@fornecedor.com.br"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="(11) 1234-5678"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="Cidade"
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                placeholder="SP"
              />
            </div>

            <div>
              <Label htmlFor="postal_code">CEP</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                placeholder="12345-678"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferred_payment_method">Método de Pagamento Preferido</Label>
              <Select value={formData.preferred_payment_method} onValueChange={(value) => setFormData({...formData, preferred_payment_method: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_terms">Prazo de Pagamento (dias)</Label>
              <Input
                id="payment_terms"
                type="number"
                value={formData.payment_terms}
                onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                placeholder="30"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifications_enabled"
                checked={formData.notifications_enabled}
                onChange={(e) => setFormData({...formData, notifications_enabled: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="notifications_enabled">Enviar notificações por email</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_send_confirmation"
                checked={formData.auto_send_confirmation}
                onChange={(e) => setFormData({...formData, auto_send_confirmation: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="auto_send_confirmation">Envio automático de confirmação de pagamento</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="is_active">Fornecedor ativo</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Informações adicionais sobre este fornecedor"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{supplier ? 'Atualizar' : 'Criar'} Fornecedor</Button>
      </div>
    </form>
  );
};

// Supplier Details Component
const SupplierDetails: React.FC<{ supplier: Supplier }> = ({ supplier }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-sm text-gray-500 mb-2">INFORMAÇÕES BÁSICAS</h4>
          <div className="space-y-2">
            <p><strong>Nome:</strong> {supplier.name}</p>
            {supplier.company_name && <p><strong>Empresa:</strong> {supplier.company_name}</p>}
            {supplier.contact_name && <p><strong>Contato:</strong> {supplier.contact_name}</p>}
            {supplier.tax_id && <p><strong>CNPJ/CPF:</strong> {supplier.tax_id}</p>}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm text-gray-500 mb-2">CONTATO</h4>
          <div className="space-y-2">
            {supplier.email && <p><strong>Email:</strong> {supplier.email}</p>}
            {supplier.phone && <p><strong>Telefone:</strong> {supplier.phone}</p>}
            {supplier.mobile_phone && <p><strong>Celular:</strong> {supplier.mobile_phone}</p>}
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-sm text-gray-500 mb-2">ENDEREÇO</h4>
        <div className="text-sm">
          {supplier.address && <p>{supplier.address}</p>}
          {(supplier.city || supplier.state) && (
            <p>{supplier.city}{supplier.city && supplier.state ? ', ' : ''}{supplier.state}</p>
          )}
          {supplier.postal_code && <p>CEP: {supplier.postal_code}</p>}
          <p>{supplier.country}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-sm text-gray-500 mb-2">CONFIGURAÇÕES DE PAGAMENTO</h4>
          <div className="space-y-2">
            <p><strong>Método Preferido:</strong> {supplier.preferred_payment_method}</p>
            <p><strong>Prazo de Pagamento:</strong> {supplier.payment_terms} dias</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm text-gray-500 mb-2">STATUS & NOTIFICAÇÕES</h4>
          <div className="space-y-2">
            <p><strong>Status:</strong> {supplier.is_active ? 'Ativo' : 'Inativo'}</p>
            <p><strong>Notificações:</strong> {supplier.notifications_enabled ? 'Habilitadas' : 'Desabilitadas'}</p>
            <p><strong>Confirmação Automática:</strong> {supplier.auto_send_confirmation ? 'Sim' : 'Não'}</p>
          </div>
        </div>
      </div>

      {supplier.notes && (
        <div>
          <h4 className="font-medium text-sm text-gray-500 mb-2">OBSERVAÇÕES</h4>
          <p className="text-sm text-gray-700">{supplier.notes}</p>
        </div>
      )}
    </div>
  );
};