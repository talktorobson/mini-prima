
import React from 'react';
import { useClientData } from '@/hooks/useClientData';
import { useDocuments } from '@/hooks/useDocuments';
import PortalHeader from '@/components/portal/PortalHeader';
import WelcomeSection from '@/components/portal/WelcomeSection';
import QuickActionsGrid from '@/components/portal/QuickActionsGrid';
import DocumentsOverview from '@/components/portal/DocumentsOverview';
import RecentActivity from '@/components/portal/RecentActivity';
import QuickStats from '@/components/portal/QuickStats';

const Portal = () => {
  const { data: clientData, isLoading: clientLoading } = useClientData();
  const { data: documents = [], isLoading: documentsLoading } = useDocuments();

  // Get recent documents (last 3)
  const recentDocuments = documents.slice(0, 3);

  // Mock data for demo purposes when no real data is available
  const mockRecentDocuments = [
    {
      id: 1,
      document_name: "CV_BOOST-IT Pedro Leite da Silva (4).pdf",
      document_type: "General Document",
      upload_date: "2024-06-15T12:00:00Z"
    },
    {
      id: 2,
      document_name: "Contrato Prestação Serviços.pdf", 
      document_type: "Case Document",
      upload_date: "2024-06-14T10:30:00Z"
    },
    {
      id: 3,
      document_name: "Procuração Judicial.pdf",
      document_type: "Case Document", 
      upload_date: "2024-06-12T14:15:00Z"
    }
  ];

  const displayDocuments = recentDocuments.length > 0 ? recentDocuments : mockRecentDocuments;
  const totalDocuments = documents.length > 0 ? documents.length : 7; // Mock total when no real data

  if (clientLoading || documentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader clientName={clientData?.contact_person} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <WelcomeSection clientName={clientData?.contact_person} />
        
        <QuickActionsGrid />

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DocumentsOverview 
            documents={displayDocuments}
            totalDocuments={totalDocuments}
            isLoading={documentsLoading}
          />
          
          <RecentActivity />
          
          <QuickStats />
        </div>
      </main>
    </div>
  );
};

export default Portal;
