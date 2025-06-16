
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageSquare, 
  CreditCard,
  Settings,
  Shield,
  Building,
  DollarSign,
  UserPlus,
  Briefcase,
  Archive,
  Repeat
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';

const AdminSidebar = () => {
  const { adminUser } = useAdminAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">
          Admin Panel
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {adminUser?.role === 'admin' ? 'Administrador' : 'Equipe'}
        </p>
      </div>

      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {/* Dashboard */}
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/admin') 
                ? 'bg-red-50 text-red-600' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          {/* Admin-only menu items */}
          {adminUser?.role === 'admin' && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Administração
                </p>
              </div>

              <Link
                to="/admin/permissions"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/permissions') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Shield className="h-4 w-4" />
                Permissões
              </Link>

              <Link
                to="/admin/registrations"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/registrations') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Cadastros
              </Link>

              <Link
                to="/admin/subscriptions"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/subscriptions') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Repeat className="h-4 w-4" />
                Assinaturas
              </Link>

              <Link
                to="/admin/clients"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/clients') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Building className="h-4 w-4" />
                Clientes
              </Link>

              <Link
                to="/admin/cases"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/cases') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Casos
              </Link>

              <Link
                to="/admin/documents"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/documents') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Archive className="h-4 w-4" />
                Documentos
              </Link>

              <Link
                to="/admin/financial"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/financial') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Financeiro
              </Link>

              <Link
                to="/admin/messages"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/messages') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Mensagens
              </Link>

              <Link
                to="/admin/settings"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/settings') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
            </>
          )}

          {/* Staff-specific menu items */}
          {adminUser?.role === 'staff' && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Área da Equipe
                </p>
              </div>

              <Link
                to="/admin/staff/cases"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/staff/cases') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Casos
              </Link>

              <Link
                to="/admin/staff/documents"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/staff/documents') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="h-4 w-4" />
                Documentos
              </Link>

              <Link
                to="/admin/staff/messages"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/staff/messages') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Mensagens
              </Link>

              <Link
                to="/admin/staff/billing"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/staff/billing') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Cobrança
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;
