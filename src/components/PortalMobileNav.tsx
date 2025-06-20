import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu,
  Home,
  Briefcase, 
  FileText, 
  MessageSquare, 
  CreditCard,
  User,
  Building2,
  LogOut
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PortalMobileNavProps {
  client?: any;
  signOut: () => void;
}

const PortalMobileNav: React.FC<PortalMobileNavProps> = ({ client, signOut }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/portal' },
    { icon: Briefcase, label: 'Casos', path: '/portal/cases' },
    { icon: FileText, label: 'Documentos', path: '/portal/documents' },
    { icon: MessageSquare, label: 'Mensagens', path: '/portal/messages' },
    { icon: CreditCard, label: 'Financeiro', path: '/portal/financial' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="fixed top-4 left-4 z-50 bg-slate-800/90 text-white shadow-lg border border-slate-600 h-12 w-12 p-0 rounded-lg hover:bg-slate-700"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu de navegação</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[300px] z-50 bg-slate-800 border-slate-700">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-blue-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Portal do Cliente</h2>
                  <p className="text-sm text-blue-200">{client?.company_name || 'Carregando...'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-3 text-blue-200">
                <User className="h-4 w-4" />
                <span className="text-sm">{client?.contact_person || 'Usuário'}</span>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto">
              <div className="px-4 py-6 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>

            <div className="p-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors min-h-[48px]"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PortalMobileNav;