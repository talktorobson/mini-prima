import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminStaffManagement from '@/pages/AdminStaffManagement';
import AdminStaffDashboard from '@/pages/AdminStaffDashboard';
import AdminStaffCases from '@/pages/AdminStaffCases';
import AdminStaffDocuments from '@/pages/AdminStaffDocuments';
import AdminStaffMessages from '@/pages/AdminStaffMessages';
import AdminStaffBilling from '@/pages/AdminStaffBilling';
import AdminSubscriptions from '@/pages/AdminSubscriptions';
import AdminBusinessIntelligence from '@/pages/AdminBusinessIntelligence';
import RegistrationManagement from '@/components/admin/RegistrationManagement';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminDashboard = () => {
  const { adminUser } = useAdminAuth();

  return (
    <AdminLayout>
      <Routes>
        {/* Main Dashboard - Show different content based on role */}
        <Route path="/" element={
          adminUser?.role === 'admin' ? (
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Painel Administrativo
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-2">Gestão Geral</h2>
                  <p className="text-gray-600">
                    Acesso completo a todos os clientes, casos e configurações do sistema.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-2">Gerenciamento da Equipe</h2>
                  <p className="text-gray-600">
                    Configure permissões e atribuições da equipe para clientes específicos.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-2">Relatórios</h2>
                  <p className="text-gray-600">
                    Visualize métricas e relatórios completos de toda a operação.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <AdminStaffDashboard />
          )
        } />
        
        {/* Admin-only routes */}
        {adminUser?.role === 'admin' && (
          <>
            <Route path="/permissions" element={<AdminStaffManagement />} />
            <Route path="/registrations" element={
              <div className="p-6">
                <RegistrationManagement />
              </div>
            } />
            <Route path="/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/analytics" element={<AdminBusinessIntelligence />} />
            <Route path="/clients" element={<div className="p-6"><h1>Gestão de Clientes (Em desenvolvimento)</h1></div>} />
            <Route path="/cases" element={<div className="p-6"><h1>Gestão de Casos (Em desenvolvimento)</h1></div>} />
            <Route path="/documents" element={<div className="p-6"><h1>Gestão de Documentos (Em desenvolvimento)</h1></div>} />
            <Route path="/financial" element={<div className="p-6"><h1>Gestão Financeira (Em desenvolvimento)</h1></div>} />
            <Route path="/messages" element={<div className="p-6"><h1>Gestão de Mensagens (Em desenvolvimento)</h1></div>} />
            <Route path="/settings" element={<div className="p-6"><h1>Configurações do Sistema (Em desenvolvimento)</h1></div>} />
          </>
        )}

        {/* Staff-specific routes */}
        {adminUser?.role === 'staff' && (
          <>
            <Route path="/staff/cases" element={<AdminStaffCases />} />
            <Route path="/staff/documents" element={<AdminStaffDocuments />} />
            <Route path="/staff/messages" element={<AdminStaffMessages />} />
            <Route path="/staff/billing" element={<AdminStaffBilling />} />
            <Route path="/staff/clients/:clientId" element={<div className="p-6"><h1>Detalhes do Cliente (Em desenvolvimento)</h1></div>} />
            <Route path="/staff/cases/new" element={<div className="p-6"><h1>Novo Caso (Em desenvolvimento)</h1></div>} />
            <Route path="/staff/cases/:caseId" element={<div className="p-6"><h1>Detalhes do Caso (Em desenvolvimento)</h1></div>} />
            <Route path="/staff/cases/:caseId/edit" element={<div className="p-6"><h1>Editar Caso (Em desenvolvimento)</h1></div>} />
          </>
        )}

        {/* Redirect unauthorized routes */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
