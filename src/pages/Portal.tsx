import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessagesSquare, User, Bell, ArrowLeft, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Portal = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      if (!user) return;

      try {
        const { data: clientInfo, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching client data:', error);
        } else {
          setClientData(clientInfo);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
  };

  // Mock data for dashboard stats - you can replace with real data from Supabase
  const dashboardStats = {
    activeCases: 3,
    pendingDocuments: 2,
    unreadMessages: 4,
    upcomingDeadlines: 1
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const clientName = clientData?.contact_person || user?.email || 'Cliente';
  const clientCompany = clientData?.company_name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Voltar ao Site</span>
              </Button>
              <div className="border-l border-gray-300 pl-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Portal do Cliente</h1>
                    <p className="text-sm text-gray-600 flex items-center space-x-2">
                      <span>{clientName}</span>
                      {clientCompany && (
                        <>
                          <span>•</span>
                          <span className="font-medium">{clientCompany}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-xs">{currentTime.toLocaleDateString('pt-BR')}</div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta, {clientName}!</h2>
              <p className="text-blue-100 text-lg">Acompanhe seus casos e mantenha-se atualizado com sua equipe jurídica.</p>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-right">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">{dashboardStats.activeCases}</div>
                <div className="text-blue-100 text-sm">Casos Ativos</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">{dashboardStats.unreadMessages}</div>
                <div className="text-blue-100 text-sm">Mensagens Não Lidas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-800">{dashboardStats.activeCases}</div>
              <div className="text-sm text-green-600">Casos Ativos</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-800">{dashboardStats.pendingDocuments}</div>
              <div className="text-sm text-orange-600">Docs Pendentes</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <MessagesSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-800">{dashboardStats.unreadMessages}</div>
              <div className="text-sm text-blue-600">Mensagens</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-800">{dashboardStats.upcomingDeadlines}</div>
              <div className="text-sm text-purple-600">Prazos</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Portal Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Meus Casos */}
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Meus Casos</CardTitle>
                    <CardDescription>
                      Acompanhe o progresso dos seus processos
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {dashboardStats.activeCases} ativos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Filtros</Badge>
                <Badge variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">Dados</Badge>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Filtrar por status e prioridade</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Visualizar progresso em tempo real</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Acessar documentos relacionados</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate('/portal/cases')}
              >
                Ver Casos →
              </Button>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Documentos</CardTitle>
                    <CardDescription>
                      Acesse e baixe todos os seus documentos
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {dashboardStats.pendingDocuments} novos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Badge className="bg-green-600 hover:bg-green-700 text-white">Download</Badge>
                <Badge variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">Seguro</Badge>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Contratos e procurações</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Relatórios e pareceres técnicos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Visualização online e download</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate('/portal/documents')}
              >
                Ver Documentos →
              </Button>
            </CardContent>
          </Card>

          {/* Financeiro */}
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl">Financeiro</CardTitle>
                    <CardDescription>
                      Consulte faturas e histórico de pagamentos
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Em dia
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Badge className="bg-red-600 hover:bg-red-700 text-white">Faturas</Badge>
                <Badge variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">Pagamento</Badge>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Faturas pendentes e pagas</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Histórico financeiro completo</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Links para pagamento direto</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate('/portal/financial')}
              >
                Ver Financeiro →
              </Button>
            </CardContent>
          </Card>

          {/* Mensagens */}
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-teal-100 rounded-xl group-hover:bg-teal-200 transition-colors">
                    <MessagesSquare className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Mensagens</CardTitle>
                    <CardDescription>
                      Comunique-se com sua equipe jurídica
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {dashboardStats.unreadMessages} não lidas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Badge className="bg-teal-600 hover:bg-teal-700 text-white">Chat</Badge>
                <Badge variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">Notificar</Badge>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span>Mensagens diretas com advogados</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Histórico de conversas</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Anexos e documentos</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate('/portal/messages')}
              >
                Ver Mensagens →
              </Button>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                    <Bell className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Notificações</CardTitle>
                    <CardDescription>
                      Receba atualizações em tempo real
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  2 não lidas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Badge className="bg-red-600 hover:bg-red-700 text-white">2 Não Lidas</Badge>
                <Badge variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">Tempo Real</Badge>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Atualizações de casos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Novos documentos disponíveis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Lembretes de pagamentos</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate('/portal/notifications')}
              >
                Ver Notificações →
              </Button>
            </CardContent>
          </Card>

          {/* Status Section */}
          <Card className="col-span-full bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-200 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-700" />
                </div>
                <h3 className="font-bold text-green-800 text-lg">Portal com Autenticação Supabase</h3>
              </div>
              
              <p className="text-green-700 mb-4 font-medium">Sistema de autenticação Supabase implementado com sucesso:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-3">
                    <span>🔐</span>
                    <span><strong>Supabase Auth:</strong> Sistema robusto e seguro</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-3">
                    <span>🛡️</span>
                    <span><strong>RLS:</strong> Políticas de segurança implementadas</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-3">
                    <span>⚛️</span>
                    <span><strong>React Context:</strong> Estado de auth compartilhado</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-3">
                    <span>👤</span>
                    <span><strong>Registro automático:</strong> Criação de cliente no signup</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Portal;
