
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, FileText, Users, MessageCircle } from 'lucide-react';
import { useStaffData } from '@/hooks/useStaffData';

const StaffDashboardSummary = () => {
  const { assignedClients, staffInfo, loading, hasAssignedClients } = useStaffData();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!hasAssignedClients) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bem-vindo, {staffInfo?.full_name}
          </CardTitle>
          <CardDescription>
            Você ainda não tem clientes atribuídos. Entre em contato com o administrador para solicitar acesso.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Informações do Funcionário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nome</p>
              <p className="font-medium">{staffInfo?.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cargo</p>
              <p className="font-medium">{staffInfo?.staff_position}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Função</p>
              <Badge variant={staffInfo?.role === 'admin' ? 'default' : 'secondary'}>
                {staffInfo?.role === 'admin' ? 'Administrador' : 'Funcionário'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clientes Atribuídos</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              {assignedClients.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Total de clientes sob sua responsabilidade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Casos Ativos</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              -
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Casos em andamento dos seus clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Documentos</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              -
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Documentos dos clientes atribuídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mensagens</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-orange-600" />
              -
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Mensagens não lidas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Atribuídos</CardTitle>
          <CardDescription>
            Lista dos clientes sob sua responsabilidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedClients.map(client => (
              <div key={client.id} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <h4 className="font-medium">{client.company_name}</h4>
                </div>
                <p className="text-sm text-gray-600">{client.contact_person}</p>
                <p className="text-xs text-gray-500">{client.email}</p>
                <Badge 
                  variant={client.status === 'Active' ? 'default' : 'secondary'}
                  className="mt-2"
                >
                  {client.status === 'Active' ? 'Ativo' : client.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffDashboardSummary;
