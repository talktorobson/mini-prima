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
import TimeTracking from '@/pages/TimeTracking';
import Calendar from '@/pages/Calendar';
import BusinessSettings from '@/pages/BusinessSettings';
import DocumentTemplates from '@/pages/DocumentTemplates';
import DocumentGeneration from '@/pages/DocumentGeneration';
import StripeSettings from '@/pages/StripeSettings';
import PaymentAnalytics from '@/pages/PaymentAnalytics';
import WebhookLogs from '@/pages/WebhookLogs';
import BrazilianLegalCompliance from '@/pages/BrazilianLegalCompliance';
import AdminMessagesManagement from '@/pages/AdminMessagesManagement';
import FinancialDashboard from '@/pages/FinancialDashboard';
import CaseDetails from '@/pages/admin/CaseDetails';
import CaseForm from '@/components/admin/CaseForm';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminDashboard = () => {
  const { adminUser } = useAdminAuth();

  return (
    <AdminLayout>
      <Routes>
        {/* Main Dashboard - Show different content based on role */}
        <Route index element={
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
            <Route path="permissions" element={<AdminStaffManagement />} />
            <Route path="registrations" element={
              <div className="p-6">
                <RegistrationManagement />
              </div>
            } />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="analytics" element={<AdminBusinessIntelligence />} />
            <Route path="clients" element={<RegistrationManagement />} />
            <Route path="cases" element={<AdminStaffCases />} />
            <Route path="documents" element={<AdminStaffDocuments />} />
            <Route path="financial" element={<FinancialDashboard />} />
            <Route path="messages" element={<AdminMessagesManagement />} />
            <Route path="time-tracking" element={<TimeTracking />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="business-settings" element={<BusinessSettings />} />
            <Route path="document-templates" element={<DocumentTemplates />} />
            <Route path="document-generation" element={<DocumentGeneration />} />
            <Route path="stripe-settings" element={<StripeSettings />} />
            <Route path="payment-analytics" element={<PaymentAnalytics />} />
            <Route path="webhook-logs" element={<WebhookLogs />} />
            <Route path="legal-compliance" element={<BrazilianLegalCompliance />} />
            {/* Redirect duplicate settings route to business-settings */}
            <Route path="settings" element={<Navigate to="/admin/business-settings" replace />} />
          </>
        )}

        {/* Staff-specific routes */}
        {adminUser?.role === 'staff' && (
          <>
            <Route path="staff/cases" element={<AdminStaffCases />} />
            <Route path="staff/documents" element={<AdminStaffDocuments />} />
            <Route path="staff/messages" element={<AdminStaffMessages />} />
            <Route path="staff/billing" element={<AdminStaffBilling />} />
            <Route path="staff/time-tracking" element={<TimeTracking />} />
            <Route path="staff/calendar" element={<Calendar />} />
            <Route path="staff/document-generation" element={<DocumentGeneration />} />
            <Route path="staff/clients/:clientId" element={<RegistrationManagement />} />
            <Route path="staff/cases/new" element={<CaseForm />} />
            <Route path="staff/cases/:caseId" element={<CaseDetails />} />
            <Route path="staff/cases/:caseId/edit" element={<CaseForm />} />
          </>
        )}

        {/* Redirect unauthorized routes */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
