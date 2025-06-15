import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Eye, 
  Building,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { clientRegistrationService } from '@/services/clientRegistration';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  cnpj?: string;
  position?: string;
  industry?: string;
  company_size?: string;
  registration_status: string;
  registration_date: string;
  registration_notes?: string;
  estimated_case_value?: number;
  urgency_level?: string;
  preferred_contact_method?: string;
  reference_source?: string;
}

type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';
type FilterStatus = 'all' | RegistrationStatus;

const RegistrationManagement = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [statusUpdateReason, setStatusUpdateReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pendingRegistrations, isLoading } = useQuery({
    queryKey: ['pending-registrations', filterStatus],
    queryFn: async () => {
      console.log('Fetching registrations with filter:', filterStatus);
      
      let query = supabase
        .from('clients')
        .select('*')
        .order('registration_date', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('registration_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching registrations:', error);
        throw error;
      }

      console.log('Successfully fetched registrations:', data);
      return data || [];
    }
  });

  const handleStatusUpdate = async (clientId: string, newStatus: string) => {
    try {
      await clientRegistrationService.updateRegistrationStatus(
        clientId, 
        newStatus as RegistrationStatus, 
        statusUpdateReason
      );

      toast({
        title: "Sucesso",
        description: `Status atualizado para ${getStatusLabel(newStatus)}`
      });

      queryClient.invalidateQueries({ queryKey: ['pending-registrations'] });
      setSelectedClient(null);
      setStatusUpdateReason('');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      'approved': { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
      'rejected': { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
      'under_review': { label: 'Em Análise', variant: 'outline' as const, icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado',
      'under_review': 'Em Análise'
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Cadastros</h2>
          <p className="text-gray-600">Gerencie solicitações de cadastro de novos clientes</p>
        </div>
        <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="under_review">Em Análise</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {pendingRegistrations?.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma solicitação de cadastro encontrada para o filtro selecionado.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {pendingRegistrations?.map((client) => (
            <Card key={client.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-semibold">{client.company_name}</h3>
                      {getStatusBadge(client.registration_status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {client.contact_person} ({client.email})
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {client.phone}
                      </div>
                      {client.industry && (
                        <div>
                          Setor: {client.industry}
                        </div>
                      )}
                      {client.estimated_case_value && (
                        <div>
                          Valor estimado: R$ {client.estimated_case_value.toLocaleString('pt-BR')}
                        </div>
                      )}
                      <div>
                        Urgência: {client.urgency_level || 'Normal'}
                      </div>
                      <div>
                        Cadastrado em: {new Date(client.registration_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedClient(client)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Cadastro</DialogTitle>
                          <DialogDescription>
                            Informações completas da solicitação de cadastro
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedClient && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Empresa</Label>
                                <p className="text-sm text-gray-600">{selectedClient.company_name}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">CNPJ</Label>
                                <p className="text-sm text-gray-600">{selectedClient.cnpj || 'Não informado'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Contato</Label>
                                <p className="text-sm text-gray-600">{selectedClient.contact_person}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Cargo</Label>
                                <p className="text-sm text-gray-600">{selectedClient.position || 'Não informado'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Email</Label>
                                <p className="text-sm text-gray-600">{selectedClient.email}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Telefone</Label>
                                <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                              </div>
                            </div>

                            {selectedClient.registration_notes && (
                              <div>
                                <Label className="text-sm font-medium">Observações</Label>
                                <p className="text-sm text-gray-600 mt-1">{selectedClient.registration_notes}</p>
                              </div>
                            )}

                            <div className="space-y-3">
                              <Label className="text-sm font-medium">Atualizar Status</Label>
                              <Select onValueChange={(value) => {
                                if (value !== selectedClient.registration_status) {
                                  handleStatusUpdate(selectedClient.id, value);
                                }
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder={getStatusLabel(selectedClient.registration_status)} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="under_review">Em Análise</SelectItem>
                                  <SelectItem value="approved">Aprovado</SelectItem>
                                  <SelectItem value="rejected">Rejeitado</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Textarea
                                placeholder="Motivo da alteração (opcional)"
                                value={statusUpdateReason}
                                onChange={(e) => setStatusUpdateReason(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegistrationManagement;
