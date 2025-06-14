
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  MessageSquare, 
  Briefcase, 
  CreditCard, 
  Bell,
  Calendar,
  TrendingUp,
  Clock,
  User,
  Building2,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useClientData } from '@/hooks/useClientData';
import { casesService, documentsService, financialService, notificationsService } from '@/services/database';

const Portal = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: client, isLoading: clientLoading } = useClientData();

  // Get dashboard data
  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: casesService.getCases,
    enabled: !!client
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsService.getDocuments,
    enabled: !!client
  });

  const { data: financialRecords = [] } = useQuery({
    queryKey: ['financial-records'],
    queryFn: financialService.getFinancialRecords,
    enabled: !!client
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getNotifications,
    enabled: !!client
  });

  const handleLogout = async () => {
    await signOut();
  };

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeCases = cases.filter(c => c.status === 'Open' || c.status === 'In Progress');
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const pendingInvoices = financialRecords.filter(f => f.status === 'Pending');
  const totalPending = pendingInvoices.reduce((sum, record) => sum + (record.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portal do Cliente</h1>
                <p className="text-sm text-gray-500">{client?.company_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="h-4 w-4" />
                <span className="text-sm">{client?.contact_person}</span>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo, {client?.contact_person}!
          </h2>
          <p className="text-gray-600">
            Acompanhe o progresso dos seus casos e mantenha-se atualizado com nossa equipe jurídica.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Casos Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{activeCases.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Documentos</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pendente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Bell className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Notificações</p>
                  <p className="text-2xl font-bold text-gray-900">{unreadNotifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/cases')}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span>Meus Casos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-3">
                Acompanhe o progresso dos seus processos jurídicos
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{cases.length} casos</span>
                <Badge variant="secondary">{activeCases.length} ativos</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/documents')}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <FileText className="h-5 w-5 text-green-600" />
                <span>Documentos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-3">
                Acesse contratos, pareceres e outros documentos
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{documents.length} documentos</span>
                <Badge variant="outline">Atualizado</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/messages')}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <span>Mensagens</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-3">
                Comunique-se diretamente com nossa equipe
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Chat ativo</span>
                <Badge className="bg-green-500">Online</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Atividade Recente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cases.slice(0, 3).map((case_item) => (
                <div key={case_item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {case_item.case_title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: {case_item.status}
                    </p>
                  </div>
                  <Badge variant="outline">{case_item.priority}</Badge>
                </div>
              ))}
              {cases.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhum caso encontrado</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Resumo Financeiro</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingInvoices.slice(0, 3).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {record.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      Vencimento: {record.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-orange-600">
                    R$ {(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {pendingInvoices.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhuma pendência financeira</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Portal;
