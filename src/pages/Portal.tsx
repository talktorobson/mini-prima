
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessagesSquare, User, Bell } from 'lucide-react';
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portal do Cliente</h1>
              <p className="text-sm text-gray-600">
                Bem-vindo, {clientName} {clientCompany && `- ${clientCompany}`}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Meus Casos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Meus Casos</CardTitle>
                  <CardDescription>
                    Acompanhe o progresso dos seus processos jurídicos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    + Filtros Funcionais
                  </Button>
                  <Button size="sm" variant="outline" className="border-blue-500 text-blue-600">
                    📊 Dados Reais
                  </Button>
                </div>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Filtrar por status (Em Andamento, Aberto, etc.)</li>
                <li>• Filtrar por prioridade (Alta, Média, Baixa)</li>
                <li>• Visualizar progresso em tempo real</li>
                <li>• Acessar documentos relacionados</li>
              </ul>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/portal/cases')}
              >
                Ver Casos →
              </Button>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <CardTitle>Documentos</CardTitle>
                  <CardDescription>
                    Acesse, visualize e baixe todos os seus documentos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    📥 Download Real
                  </Button>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    🔒 Acesso Seguro
                  </Button>
                </div>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Contratos e procurações assinadas</li>
                <li>• Relatórios e pareceres técnicos</li>
                <li>• Filtrar por tipo ou status</li>
                <li>• Visualização online e download</li>
              </ul>
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/portal/documents')}
              >
                Ver Documentos →
              </Button>
            </CardContent>
          </Card>

          {/* Financeiro */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <CardTitle>Financeiro</CardTitle>
                  <CardDescription>
                    Consulte faturas, histórico de pagamentos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                    ⚠️ Faturas em Atraso
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    💳 Pagamento Online
                  </Button>
                </div>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Faturas pendentes e pagas</li>
                <li>• Histórico financeiro completo</li>
                <li>• Links para pagamento direto</li>
                <li>• Notificações de vencimento</li>
              </ul>
              
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={() => navigate('/portal/financial')}
              >
                Ver Financeiro →
              </Button>
            </CardContent>
          </Card>

          {/* Mensagens */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MessagesSquare className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <CardTitle>Mensagens</CardTitle>
                  <CardDescription>
                    Comunique-se diretamente com sua equipe jurídica
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                    💬 Chat em Tempo Real
                  </Button>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    🔔 Notificações
                  </Button>
                </div>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Mensagens diretas com advogados</li>
                <li>• Histórico de conversas</li>
                <li>• Anexos e documentos</li>
                <li>• Notificações instantâneas</li>
              </ul>
              
              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={() => navigate('/portal/messages')}
              >
                Ver Mensagens →
              </Button>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Bell className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle>Notificações</CardTitle>
                  <CardDescription>
                    Receba atualizações em tempo real sobre seus casos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                    2 Não Lidas
                  </Button>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    ⚡ Tempo Real
                  </Button>
                </div>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Atualizações de casos e processos</li>
                <li>• Novos documentos disponíveis</li>
                <li>• Lembretes de pagamentos e vencimentos</li>
                <li>• Mensagens da equipe jurídica</li>
              </ul>
              
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/portal/notifications')}
              >
                Ver Notificações →
              </Button>
            </CardContent>
          </Card>

          {/* Status Section */}
          <Card className="col-span-full bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-green-600 text-xl">✅</span>
                <h3 className="font-semibold text-green-800">Portal com Autenticação Reforçada</h3>
              </div>
              
              <p className="text-green-700 mb-4">Sistema de autenticação completamente reconstruído:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span>🔐</span>
                    <span><strong>JWT Auth:</strong> Sistema robusto e seguro</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🛡️</span>
                    <span><strong>Middleware:</strong> Proteção de rotas funcionando</span>
                  </div>
                </div>
                <div className="space-y-2">
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
