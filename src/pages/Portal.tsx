
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
  TrendingUp,
  User,
  Building2,
  LogOut,
  ArrowRight,
  Eye,
  Download
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const activeCases = cases.filter(c => c.status === 'Open' || c.status === 'In Progress');
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const pendingInvoices = financialRecords.filter(f => f.status === 'Pending');
  const totalPending = pendingInvoices.reduce((sum, record) => sum + (record.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Portal do Cliente</h1>
                <p className="text-sm text-blue-200">{client?.company_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-blue-200">
                <User className="h-4 w-4" />
                <span className="text-sm">{client?.contact_person}</span>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2 border-slate-600 text-blue-200 hover:bg-slate-700">
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Bem-vindo, {client?.contact_person}!
          </h2>
          <p className="text-blue-200">
            Acompanhe o progresso dos seus casos e mantenha-se atualizado com nossa equipe jurídica.
          </p>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Casos Ativos</p>
                  <p className="text-2xl font-bold text-white">{activeCases.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-200">Documentos</p>
                  <p className="text-2xl font-bold text-white">{documents.length}</p>
                </div>
                <FileText className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-200">Pendente</p>
                  <p className="text-xl font-bold text-white">
                    R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200">Notificações</p>
                  <p className="text-2xl font-bold text-white">{unreadNotifications.length}</p>
                </div>
                <Bell className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cases */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-lg text-white">
                    <Briefcase className="h-5 w-5 text-blue-400" />
                    <span>Meus Casos</span>
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate('/portal/cases')}
                    className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                  >
                    Ver Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {cases.slice(0, 4).map((case_item) => (
                  <div key={case_item.id} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white text-sm truncate">{case_item.case_title}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          case_item.status === 'Open' || case_item.status === 'In Progress' 
                            ? 'border-green-400 text-green-400' 
                            : 'border-gray-400 text-gray-400'
                        }`}
                      >
                        {case_item.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-200">Prioridade: {case_item.priority}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 px-2 text-blue-400 hover:bg-blue-400/20"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {cases.length === 0 && (
                  <p className="text-slate-400 text-center py-4">Nenhum caso encontrado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Documents and Messages */}
          <div className="lg:col-span-1 space-y-6">
            {/* Documents Section */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-lg text-white">
                    <FileText className="h-5 w-5 text-green-400" />
                    <span>Documentos</span>
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate('/portal/documents')}
                    className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
                  >
                    Ver Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {documents.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{doc.document_name}</h4>
                        <p className="text-xs text-green-200">{doc.document_type}</p>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-green-400 hover:bg-green-400/20">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-green-400 hover:bg-green-400/20">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-slate-400 text-center py-4">Nenhum documento encontrado</p>
                )}
              </CardContent>
            </Card>

            {/* Messages Section */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors cursor-pointer" onClick={() => navigate('/portal/messages')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg text-white">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                  <span>Mensagens</span>
                  <Badge className="bg-green-500 text-white">Online</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm mb-3">
                  Comunique-se diretamente com nossa equipe jurídica
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Abrir Chat
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Notifications and Financial */}
          <div className="lg:col-span-1 space-y-6">
            {/* Notifications Section */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg text-white">
                  <Bell className="h-5 w-5 text-purple-400" />
                  <span>Notificações</span>
                  {unreadNotifications.length > 0 && (
                    <Badge className="bg-red-500 text-white">{unreadNotifications.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.slice(0, 4).map((notification) => (
                  <div key={notification.id} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                        <p className="text-xs text-purple-200 mt-1 line-clamp-2">{notification.message}</p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-slate-400 text-center py-4">Nenhuma notificação</p>
                )}
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg text-white">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                  <span>Resumo Financeiro</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingInvoices.slice(0, 3).map((record) => (
                  <div key={record.id} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{record.description}</h4>
                        <p className="text-xs text-orange-200">
                          Venc: {record.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-orange-400 ml-2">
                        R$ {(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
                {pendingInvoices.length === 0 && (
                  <p className="text-slate-400 text-center py-4">Nenhuma pendência financeira</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Portal;
