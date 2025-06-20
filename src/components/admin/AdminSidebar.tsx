
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageSquare, 
  CreditCard,
  Settings,
  Clock,
  Shield,
  Building,
  DollarSign,
  UserPlus,
  Briefcase,
  Archive,
  Repeat,
  TrendingUp,
  Calendar,
  FolderOpen,
  Download,
  BarChart3,
  Webhook,
  Scale,
  LogOut,
  Menu
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
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Mobile Navigation Component for smaller screens
const MobileAdminNav = ({ adminUser, signOut, isActive }: { adminUser: any, signOut: () => void, isActive: (path: string) => boolean }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="fixed top-4 left-4 z-50 bg-white shadow-lg border h-12 w-12 p-0 rounded-lg hover:bg-gray-50"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[300px] z-50">
          <AdminSidebarContent 
            adminUser={adminUser} 
            signOut={signOut} 
            isActive={isActive} 
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Sidebar Content Component (shared between desktop and mobile)
const AdminSidebarContent = ({ adminUser, signOut, isActive, onNavigate }: { 
  adminUser: any, 
  signOut: () => void, 
  isActive: (path: string) => boolean,
  onNavigate?: () => void
}) => {
  const handleNavClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">
          Admin Panel
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {adminUser?.role === 'admin' ? 'Administrador' : 'Equipe'}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-2">
          {/* Dashboard */}
          <Link
            to="/admin"
            onClick={handleNavClick}
            className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
              isActive('/admin') 
                ? 'bg-red-50 text-red-600' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
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
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/permissions') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Shield className="h-5 w-5" />
                Permissões
              </Link>

              <Link
                to="/admin/registrations"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/registrations') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <UserPlus className="h-5 w-5" />
                Cadastros
              </Link>

              <Link
                to="/admin/subscriptions"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/subscriptions') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Repeat className="h-5 w-5" />
                Assinaturas
              </Link>

              <Link
                to="/admin/analytics"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/analytics') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="h-5 w-5" />
                Analytics
              </Link>

              <Link
                to="/admin/clients"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/clients') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Building className="h-5 w-5" />
                Clientes
              </Link>

              <Link
                to="/admin/cases"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/cases') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="h-5 w-5" />
                Casos
              </Link>

              <Link
                to="/admin/documents"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/documents') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Archive className="h-5 w-5" />
                Documentos
              </Link>

              <Link
                to="/admin/financial"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/financial') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <DollarSign className="h-5 w-5" />
                Financeiro
              </Link>

              <Link
                to="/admin/messages"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/messages') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                Mensagens
              </Link>

              <Link
                to="/admin/time-tracking"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/time-tracking') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Clock className="h-5 w-5" />
                Controle de Tempo
              </Link>

              <Link
                to="/admin/calendar"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/calendar') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Calendar className="h-5 w-5" />
                Calendário e Prazos
              </Link>

              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Sistema PDF e Documentos
                </p>
              </div>

              <Link
                to="/admin/document-generation"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/document-generation') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Download className="h-5 w-5" />
                Gerar Documentos
              </Link>

              <Link
                to="/admin/document-templates"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/document-templates') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FolderOpen className="h-5 w-5" />
                Templates
              </Link>

              <Link
                to="/admin/business-settings"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/business-settings') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-5 w-5" />
                Configurações Empresariais
              </Link>

              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Pagamentos e Cobrança
                </p>
              </div>

              <Link
                to="/admin/stripe-settings"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/stripe-settings') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                Configurações Stripe
              </Link>

              <Link
                to="/admin/payment-analytics"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/payment-analytics') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                Analytics de Pagamentos
              </Link>

              <Link
                to="/admin/webhook-logs"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/webhook-logs') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Webhook className="h-5 w-5" />
                Logs de Webhooks
              </Link>

              <Link
                to="/admin/legal-compliance"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/legal-compliance') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Scale className="h-5 w-5" />
                🇧🇷 Compliance Legal
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
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/staff/cases') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="h-5 w-5" />
                Casos
              </Link>

              <Link
                to="/admin/staff/documents"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/staff/documents') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="h-5 w-5" />
                Documentos
              </Link>

              <Link
                to="/admin/staff/messages"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/staff/messages') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                Mensagens
              </Link>

              <Link
                to="/admin/staff/billing"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/staff/billing') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                Cobrança
              </Link>

              <Link
                to="/admin/staff/time-tracking"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/staff/time-tracking') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Clock className="h-5 w-5" />
                Controle de Tempo
              </Link>

              <Link
                to="/admin/staff/calendar"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/staff/calendar') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Calendar className="h-5 w-5" />
                Calendário e Prazos
              </Link>

              <Link
                to="/admin/staff/document-generation"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive('/admin/staff/document-generation') 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Download className="h-5 w-5" />
                Gerar Documentos
              </Link>
            </>
          )}

          {/* Logout button for all users */}
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            signOut();
            if (onNavigate) onNavigate();
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  );
};

const AdminSidebar = () => {
  const { adminUser, signOut } = useAdminAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  const isActive = (path: string) => location.pathname === path;

  // Show mobile navigation on mobile devices
  if (isMobile) {
    return <MobileAdminNav adminUser={adminUser} signOut={signOut} isActive={isActive} />;
  }

  // Desktop sidebar
  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40 hidden md:block">
      <AdminSidebarContent adminUser={adminUser} signOut={signOut} isActive={isActive} />
    </div>
  );
};

export default AdminSidebar;
