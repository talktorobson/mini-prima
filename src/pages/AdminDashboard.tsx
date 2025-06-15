
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminPermissionGuard from '@/components/admin/AdminPermissionGuard';
import PermissionManager from '@/components/admin/PermissionManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { 
  Users, 
  Building, 
  FileText, 
  DollarSign, 
  MessageCircle, 
  Shield,
  BarChart3,
  TrendingUp
} from 'lucide-react';

const DashboardHome = () => {
  const { adminUser } = useAdminAuth();
  const { canAccess, permissions, isAdmin } = useAdminPermissions();

  const accessCards = [
    {
      title: 'Clientes',
      description: 'Gestão de clientes e portal',
      icon: Users,
      color: 'bg-blue-500',
      hasAccess: canAccess.clients
    },
    {
      title: 'Casos',
      description: 'Gerenciamento de casos jurídicos',
      icon: Building,
      color: 'bg-green-500',
      hasAccess: canAccess.cases
    },
    {
      title: 'Documentos',
      description: 'Sistema de documentos',
      icon: FileText,
      color: 'bg-purple-500',
      hasAccess: canAccess.documents
    },
    {
      title: 'Financeiro',
      description: 'Faturamento e pagamentos',
      icon: DollarSign,
      color: 'bg-yellow-500',
      hasAccess: canAccess.billing
    },
    {
      title: 'Mensagens',
      description: 'Portal de mensagens',
      icon: MessageCircle,
      color: 'bg-indigo-500',
      hasAccess: canAccess.messaging
    },
    {
      title: 'Configurações',
      description: 'Configurações do sistema',
      icon: Shield,
      color: 'bg-red-500',
      hasAccess: canAccess.settings
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo ao painel de administração. Gerencie o sistema e monitore as atividades.
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informações do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tipo de Acesso:</p>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="mt-1">
                {isAdmin ? 'Administrador' : 'Equipe'}
              </Badge>
            </div>
            <div>
              <p className="font-medium">Permissões Ativas:</p>
              <Badge variant="outline" className="mt-1">
                {permissions.length} de 6 módulos
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Módulos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className={`${card.hasAccess ? '' : 'opacity-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${card.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{card.title}</h3>
                      <p className="text-sm text-gray-600">{card.description}</p>
                    </div>
                    <div>
                      <Badge variant={card.hasAccess ? 'default' : 'secondary'}>
                        {card.hasAccess ? 'Ativo' : 'Restrito'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Stats - Only for users with appropriate permissions */}
      {(canAccess.clients || canAccess.cases || canAccess.billing) && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Estatísticas Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {canAccess.clients && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">-</p>
                      <p className="text-sm text-gray-600">Clientes Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {canAccess.cases && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Building className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">-</p>
                      <p className="text-sm text-gray-600">Casos Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {canAccess.billing && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">R$ -</p>
                      <p className="text-sm text-gray-600">Receita Mensal</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          
          <Route 
            path="/clients" 
            element={
              <AdminPermissionGuard requiredPermission="client_access">
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Gestão de Clientes</h1>
                  <p>Funcionalidade em desenvolvimento...</p>
                </div>
              </AdminPermissionGuard>
            } 
          />
          
          <Route 
            path="/cases" 
            element={
              <AdminPermissionGuard requiredPermission="cases_management">
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Gestão de Casos</h1>
                  <p>Funcionalidade em desenvolvimento...</p>
                </div>
              </AdminPermissionGuard>
            } 
          />
          
          <Route 
            path="/documents" 
            element={
              <AdminPermissionGuard requiredPermission="document_management">
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Gestão de Documentos</h1>
                  <p>Funcionalidade em desenvolvimento...</p>
                </div>
              </AdminPermissionGuard>
            } 
          />
          
          <Route 
            path="/financial" 
            element={
              <AdminPermissionGuard requiredPermission="billing">
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Gestão Financeira</h1>
                  <p>Funcionalidade em desenvolvimento...</p>
                </div>
              </AdminPermissionGuard>
            } 
          />
          
          <Route 
            path="/messages" 
            element={
              <AdminPermissionGuard requiredPermission="messaging">
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Gestão de Mensagens</h1>
                  <p>Funcionalidade em desenvolvimento...</p>
                </div>
              </AdminPermissionGuard>
            } 
          />
          
          <Route 
            path="/permissions" 
            element={
              <AdminPermissionGuard requiredPermission="system_setup">
                <div className="p-6">
                  <PermissionManager />
                </div>
              </AdminPermissionGuard>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <AdminPermissionGuard requiredPermission="system_setup">
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Configurações do Sistema</h1>
                  <p>Funcionalidade em desenvolvimento...</p>
                </div>
              </AdminPermissionGuard>
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
