
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Briefcase, 
  FileText, 
  DollarSign, 
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  Activity
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { adminUser, signOut, isAdmin } = useAdminAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const stats = [
    {
      title: "Total de Clientes",
      value: "156",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Casos Ativos",
      value: "89",
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Documentos",
      value: "1,247",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Receita Mensal",
      value: "R$ 245.750",
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    }
  ];

  const quickActions = [
    {
      title: "Gerenciar Clientes",
      description: "Visualizar e editar informações dos clientes",
      icon: Users,
      href: "/admin/clients",
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Gerenciar Casos",
      description: "Acompanhar progresso e status dos casos",
      icon: Briefcase,
      href: "/admin/cases",
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      title: "Documentos",
      description: "Organizar e revisar documentos",
      icon: FileText,
      href: "/admin/documents",
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "Financeiro",
      description: "Controlar faturas e pagamentos",
      icon: DollarSign,
      href: "/admin/financial",
      color: "bg-yellow-600 hover:bg-yellow-700"
    },
    {
      title: "Mensagens",
      description: "Comunicação com clientes",
      icon: MessageSquare,
      href: "/admin/messages",
      color: "bg-indigo-600 hover:bg-indigo-700"
    },
    {
      title: "Configurações",
      description: "Administrar sistema e usuários",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-600 hover:bg-gray-700",
      adminOnly: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
                <p className="text-sm text-gray-600">Bem-vindo ao sistema de gestão</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
                {adminUser?.role === 'admin' ? 'Administrador' : 'Equipe'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions
              .filter(action => !action.adminOnly || isAdmin)
              .map((action, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center transition-colors`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-gray-900 transition-colors">
                        {action.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">
                    {action.description}
                  </CardDescription>
                  <Button 
                    onClick={() => navigate(action.href)}
                    className={`w-full ${action.color} text-white`}
                  >
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Últimas ações no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Novo cliente cadastrado</p>
                  <p className="text-xs text-gray-600">Empresa XYZ Ltda - há 2 horas</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Documento aprovado</p>
                  <p className="text-xs text-gray-600">Contrato de Prestação de Serviços - há 4 horas</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Pagamento recebido</p>
                  <p className="text-xs text-gray-600">Fatura #001234 - R$ 5.000,00 - há 6 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
