
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Building, 
  FileText, 
  MessageCircle, 
  DollarSign,
  Plus,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useStaffData } from '@/hooks/useStaffData';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Link } from 'react-router-dom';

const AdminStaffDashboard = () => {
  const { assignedClients, staffInfo, loading, isStaff, hasAssignedClients } = useStaffData();
  const { adminUser } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!isStaff || !staffInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso restrito à equipe. Entre em contato com o administrador.
          </AlertDescription>
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
              <h1 className="text-xl font-bold text-gray-900">
                Painel da Equipe - {staffInfo.full_name}
              </h1>
              <p className="text-sm text-gray-600">{staffInfo.staff_position}</p>
            </div>
            <Badge variant="secondary">
              {hasAssignedClients ? `${assignedClients.length} clientes` : 'Nenhum cliente'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {!hasAssignedClients ? (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você ainda não tem clientes atribuídos. Entre em contato com o administrador para receber atribuições.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Atribuídos</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignedClients.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Casos Ativos</CardTitle>
                  <Building className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignedClients?.length || 0}</div>
                  <p className="text-xs text-gray-500">Casos ativos atribuídos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documentos Pendentes</CardTitle>
                  <FileText className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-500">Documentos aguardando review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
                  <MessageCircle className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-gray-500">Mensagens não lidas</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Acesso rápido às principais funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/admin/staff/cases">
                  <Button className="w-full" variant="outline">
                    <Building className="mr-2 h-4 w-4" />
                    Gerenciar Casos
                  </Button>
                </Link>
                <Link to="/admin/staff/documents">
                  <Button className="w-full" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Documentos
                  </Button>
                </Link>
                <Link to="/admin/staff/messages">
                  <Button className="w-full" variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Mensagens
                  </Button>
                </Link>
                <Link to="/admin/staff/billing">
                  <Button className="w-full" variant="outline">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Faturamento
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Assigned Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clientes Atribuídos
                </CardTitle>
                <CardDescription>
                  Clientes para os quais você tem acesso e responsabilidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedClients.map((client) => (
                    <Card key={client.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {client.company_name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {client.contact_person}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            {client.email}
                          </p>
                          <Badge 
                            variant={client.status === 'Active' ? 'default' : 'secondary'}
                            className="mb-3"
                          >
                            {client.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/admin/staff/clients/${client.id}`}>
                          <Button size="sm" variant="outline" className="flex-1">
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminStaffDashboard;
