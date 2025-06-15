
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Scale, 
  MessageSquare, 
  DollarSign, 
  Bell,
  ArrowRight,
  LogOut,
  User,
  Eye,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClientData } from '@/hooks/useClientData';
import { useDocuments } from '@/hooks/useDocuments';

const Portal = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: clientData, isLoading: clientLoading } = useClientData();
  const { data: documents = [], isLoading: documentsLoading } = useDocuments();

  // Helper function to get display label for document type
  function getDocumentTypeDisplayLabel(docType: string) {
    if (docType === 'General Document') return 'Documento Escritório';
    if (docType === 'Case Document') return 'Documento Processo';
    return docType; // Return original type for other cases
  }

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Get recent documents (last 3)
  const recentDocuments = documents.slice(0, 3);

  // Mock data for demo purposes when no real data is available
  const mockRecentDocuments = [
    {
      id: 1,
      document_name: "CV_BOOST-IT Pedro Leite da Silva (4).pdf",
      document_type: "General Document",
      upload_date: "2024-06-15T12:00:00Z"
    },
    {
      id: 2,
      document_name: "Contrato Prestação Serviços.pdf", 
      document_type: "Case Document",
      upload_date: "2024-06-14T10:30:00Z"
    },
    {
      id: 3,
      document_name: "Procuração Judicial.pdf",
      document_type: "Case Document", 
      upload_date: "2024-06-12T14:15:00Z"
    }
  ];

  const displayDocuments = recentDocuments.length > 0 ? recentDocuments : mockRecentDocuments;
  const totalDocuments = documents.length > 0 ? documents.length : 7; // Mock total when no real data

  if (clientLoading || documentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Scale className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portal do Cliente</h1>
                <p className="text-sm text-gray-600">D'avila Reis Advogados</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{clientData?.contact_person || 'Cliente'}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo, {clientData?.contact_person || 'Cliente'}!
          </h2>
          <p className="text-gray-600">
            Aqui você pode acompanhar seus processos, documentos e comunicações.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/cases')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Scale className="h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Processos</h3>
                  <p className="text-sm text-gray-600">Acompanhe seus casos</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/documents')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <FileText className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Documentos</h3>
                  <p className="text-sm text-gray-600">Acesse seus arquivos</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/messages')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <MessageSquare className="h-8 w-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Mensagens</h3>
                  <p className="text-sm text-gray-600">Comunicações</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/financial')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <DollarSign className="h-8 w-8 text-yellow-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Financeiro</h3>
                  <p className="text-sm text-gray-600">Faturas e pagamentos</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Documents Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">{totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">Total de Documentos</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/portal/documents')}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  Ver Todos
                </Button>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recentes</h4>
                {displayDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                          {doc.document_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {getDocumentTypeDisplayLabel(doc.document_type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividade Recente</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Novo documento adicionado</p>
                    <p className="text-xs text-gray-600">Há 2 horas</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Processo atualizado</p>
                    <p className="text-xs text-gray-600">Há 1 dia</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Nova mensagem recebida</p>
                    <p className="text-xs text-gray-600">Há 2 dias</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resumo</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Processos Ativos</span>
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Documentos Pendentes</span>
                  <span className="text-sm font-medium">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mensagens Não Lidas</span>
                  <span className="text-sm font-medium">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Próxima Audiência</span>
                  <span className="text-sm font-medium">22/06</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Portal;
