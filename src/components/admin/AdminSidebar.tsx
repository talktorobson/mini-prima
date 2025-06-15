
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  DollarSign, 
  MessageCircle, 
  Settings,
  Shield,
  Building,
  LogOut
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

const AdminSidebar = () => {
  const location = useLocation();
  const { adminUser, signOut } = useAdminAuth();
  const { canAccess, isAdmin, loading } = useAdminPermissions();

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-screen p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const adminMenuItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      path: '/admin/clients',
      label: 'Clientes',
      icon: Users,
      show: canAccess.clients
    },
    {
      path: '/admin/cases',
      label: 'Casos',
      icon: Building,
      show: canAccess.cases
    },
    {
      path: '/admin/documents',
      label: 'Documentos',
      icon: FileText,
      show: canAccess.documents
    },
    {
      path: '/admin/financial',
      label: 'Financeiro',
      icon: DollarSign,
      show: canAccess.billing
    },
    {
      path: '/admin/messages',
      label: 'Mensagens',
      icon: MessageCircle,
      show: canAccess.messaging
    },
    {
      path: '/admin/permissions',
      label: 'Equipe',
      icon: Shield,
      show: isAdmin
    },
    {
      path: '/admin/settings',
      label: 'Configurações',
      icon: Settings,
      show: canAccess.settings
    }
  ];

  const staffMenuItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      path: '/admin/staff/cases',
      label: 'Casos',
      icon: Building,
      show: canAccess.cases
    },
    {
      path: '/admin/staff/documents',
      label: 'Documentos',
      icon: FileText,
      show: canAccess.documents
    },
    {
      path: '/admin/staff/messages',
      label: 'Mensagens',
      icon: MessageCircle,
      show: canAccess.messaging
    },
    {
      path: '/admin/staff/billing',
      label: 'Faturamento',
      icon: DollarSign,
      show: canAccess.billing
    }
  ];

  const menuItems = isAdmin ? adminMenuItems : staffMenuItems;

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-red-600" />
          <span className="font-bold text-gray-900">Admin Panel</span>
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-900">
            {isAdmin ? 'Administrador' : 'Equipe'}
          </p>
          <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs">
            {isAdmin ? 'Admin' : 'Staff'}
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          if (!item.show) return null;
          
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
