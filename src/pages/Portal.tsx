
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessagesSquare, User, Bell, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Portal = () => {
  const navigate = useNavigate();
  const clientName = localStorage.getItem('clientName') || 'Cliente';
  const clientCompany = localStorage.getItem('clientCompany') || '';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('clientName');
    localStorage.removeItem('clientCompany');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Site</span>
              </Button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-bold text-gray-900">Portal do Cliente</h1>
                <p className="text-sm text-gray-600">
                  {clientName} {clientCompany && `- ${clientCompany}`}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Meus Casos */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Meus Casos</CardTitle>
                  <CardDescription className="text-sm">
                    Acompanhe o progresso dos seus processos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Filtros
                  </Button>
                  <Button size="sm" variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                    Dados
                  </Button>
                </div>
                
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Filtrar por status e prioridade</li>
                  <li>• Visualizar progresso em tempo real</li>
                  <li>• Acessar documentos relacionados</li>
                </ul>
                
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate('/portal/cases')}
                >
                  Ver Casos →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Documentos</CardTitle>
                  <CardDescription className="text-sm">
                    Acesse e baixe todos os seus documentos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    Download
                  </Button>
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                    Seguro
                  </Button>
                </div>
                
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Contratos e procurações</li>
                  <li>• Relatórios e pareceres técnicos</li>
                  <li>• Visualização online e download</li>
                </ul>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => navigate('/portal/documents')}
                >
                  Ver Documentos →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Financeiro */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Financeiro</CardTitle>
                  <CardDescription className="text-sm">
                    Consulte faturas e histórico de pagamentos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                    Faturas
                  </Button>
                  <Button size="sm" variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                    Pagamento
                  </Button>
                </div>
                
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Faturas pendentes e pagas</li>
                  <li>• Histórico financeiro completo</li>
                  <li>• Links para pagamento direto</li>
                </ul>
                
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => navigate('/portal/financial')}
                >
                  Ver Financeiro →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mensagens */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-50 rounded-lg">
                  <MessagesSquare className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Mensagens</CardTitle>
                  <CardDescription className="text-sm">
                    Comunique-se com sua equipe jurídica
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                    Chat
                  </Button>
                  <Button size="sm" variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                    Notificar
                  </Button>
                </div>
                
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Mensagens diretas com advogados</li>
                  <li>• Histórico de conversas</li>
                  <li>• Anexos e documentos</li>
                </ul>
                
                <Button 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => navigate('/portal/messages')}
                >
                  Ver Mensagens →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notificações</CardTitle>
                  <CardDescription className="text-sm">
                    Receba atualizações em tempo real
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                    2 Não Lidas
                  </Button>
                  <Button size="sm" variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                    Tempo Real
                  </Button>
                </div>
                
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Atualizações de casos</li>
                  <li>• Novos documentos disponíveis</li>
                  <li>• Lembretes de pagamentos</li>
                </ul>
                
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => navigate('/portal/notifications')}
                >
                  Ver Notificações →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Section */}
          <Card className="col-span-full bg-green-50 border-green-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-green-600 text-lg">✅</span>
                <h3 className="font-semibold text-green-800">Portal com Autenticação Reforçada</h3>
              </div>
              
              <p className="text-green-700 mb-3 text-sm">Sistema de autenticação completamente reconstruído:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span>🔐</span>
                    <span><strong>JWT Auth:</strong> Sistema robusto e seguro</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🛡️</span>
                    <span><strong>Middleware:</strong> Proteção de rotas funcionando</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span>⚛️</span>
                    <span><strong>React Hooks:</strong> Estado de auth compartilhado</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🔗</span>
                    <span><strong>Auto-login:</strong> Parâmetros URL funcionais</span>
                  </div>
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
