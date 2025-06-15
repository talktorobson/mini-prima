
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2 } from 'lucide-react';

const AdminLayout = () => {
  const { loading, adminUser } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  // Hide sidebar on login page
  const isLoginPage = location.pathname === '/admin/login';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {!isLoginPage && <AdminSidebar />}
      <div className={`flex-1 ${!isLoginPage ? 'ml-64' : ''}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
