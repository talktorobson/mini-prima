import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  MessageSquare, 
  Briefcase, 
  CreditCard, 
  TrendingUp,
  User,
  Building2,
  LogOut,
  ArrowRight,
  Eye,
  Download,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useClientData } from '@/hooks/useClientData';
import { casesService, documentsService, financialService, notificationsService } from '@/services/database';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DocumentPreviewSheet from '@/components/DocumentPreviewSheet';
import { useIsMobile } from '@/hooks/use-mobile';

const Portal = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: client, isLoading: clientLoading } = useClientData();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Preview sheet state
  const [previewSheet, setPreviewSheet] = useState({
    isOpen: false,
    document: null,
    previewUrl: ''
  });

  // Get dashboard data
  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: casesService.getCases,
    enabled: !!client
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsService.getDocuments,
    enabled: !!client
  });

  const { data: financialRecords = [] } = useQuery({
    queryKey: ['financial-records'],
    queryFn: financialService.getFinancialRecords,
    enabled: !!client
  });

  const { data: notifications = [], isLoading: notificationsLoading, error: notificationsError } = useQuery({
    queryKey: ['notifications', client?.id],
    queryFn: async () => {
      console.log('Fetching notifications for client:', client?.id);
      if (!client?.id) {
        console.log('No client ID available for notifications');
        return [];
      }
      try {
        const result = await notificationsService.getNotifications();
        console.log('Notifications fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
    },
    enabled: !!client?.id
  });

  // Log notifications data for debugging
  React.useEffect(() => {
    console.log('Notifications state:', {
      notifications,
      isLoading: notificationsLoading,
      error: notificationsError,
      clientId: client?.id
    });
  }, [notifications, notificationsLoading, notificationsError, client?.id]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleCasesAtivosClick = () => {
    navigate('/portal/cases', { state: { filter: 'active' } });
  };

  const handleTotalCasosClick = () => {
    navigate('/portal/cases');
  };

  const handleCaseClick = (caseId: string) => {
    navigate('/portal/cases', { state: { selectedCaseId: caseId } });
  };

  const handleTotalDocumentosClick = () => {
    navigate('/portal/documents');
  };

  const handleRecentesClick = () => {
    navigate('/portal/documents', { state: { filter: 'recent' } });
  };

  const handleDocumentClick = (documentId: string) => {
    navigate('/portal/documents', { state: { selectedDocumentId: documentId } });
  };

  const handlePreviewDocument = async (document: any) => {
    try {
      if (!document.file_path) {
        toast({
          title: "Erro",
          description: "Caminho do arquivo não encontrado.",
          variant: "destructive"
        });
        return;
      }

      console.log('Previewing document:', document.document_name, 'Path:', document.file_path);
      
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(document.file_path, 3600);

      if (error) {
        console.error('Error creating signed URL:', error);
        toast({
          title: "Erro",
          description: "Não foi possível gerar o link de visualização.",
          variant: "destructive"
        });
        return;
      }

      if (data?.signedUrl) {
        setPreviewSheet({
          isOpen: true,
          document: document,
          previewUrl: data.signedUrl
        });
      }
    } catch (error) {
      console.error('Error previewing document:', error);
      toast({
        title: "Erro",
        description: "Erro ao visualizar documento.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      if (!doc.file_path) {
        toast({
          title: "Erro",
          description: "Caminho do arquivo não encontrado.",
          variant: "destructive"
        });
        return;
      }

      console.log('Downloading document:', doc.document_name, 'Path:', doc.file_path);
      
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(doc.file_path, 3600);

      if (error) {
        console.error('Error creating signed URL for download:', error);
        toast({
          title: "Erro",
          description: "Não foi possível gerar o link de download.",
          variant: "destructive"
        });
        return;
      }

      if (data?.signedUrl) {
        const response = await fetch(data.signedUrl);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.original_filename || doc.document_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Sucesso",
          description: "Download iniciado com sucesso!"
        });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer download do documento.",
        variant: "destructive"
      });
    }
  };

  const closePreviewSheet = () => {
    setPreviewSheet({
      isOpen: false,
      document: null,
      previewUrl: ''
    });
  };

  const handleDownloadFromSheet = () => {
    if (previewSheet.document) {
      handleDownloadDocument(previewSheet.document);
    }
  };

  const handlePendenciasClick = () => {
    console.log('Navigating to financial pending items');
    navigate('/portal/financial', { state: { activeTab: 'pending' } });
  };

  const handleTotalRegistrosClick = () => {
    console.log('Navigating to all financial records');
    navigate('/portal/financial', { state: { activeTab: 'all' } });
  };

  const handleFinancialItemClick = (recordId: string) => {
    console.log('Viewing financial record:', recordId);
    navigate('/portal/financial', { state: { selectedRecordId: recordId } });
  };

  const handleNotificationsClick = () => {
    console.log('Viewing all notifications');
    navigate('/portal/messages', { state: { showNotifications: true } });
  };

  const handleNotificationClick = (notificationId: string) => {
    console.log('Viewing notification:', notificationId);
    if (notificationId) {
      notificationsService.markAsRead(notificationId).catch(console.error);
    }
    navigate('/portal/messages', { state: { showNotifications: true } });
  };

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const activeCases = cases.filter(c => c.status === 'Open' || c.status === 'In Progress');
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const pendingInvoices = financialRecords.filter(f => f.status === 'Pending');
  const totalPending = pendingInvoices.reduce((sum, record) => sum + (record.amount || 0), 0);

  // Debug logging for notifications
  console.log('Rendering Portal with notifications:', {
    total: notifications.length,
    unread: unreadNotifications.length,
    notificationsError,
    notificationsLoading
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-hidden">
      {/* Ultra Compact Header */}
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="w-full px-2 sm:px-3">
          <div className={`flex justify-between items-center ${isMobile ? 'h-10' : 'h-12'}`}>
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Building2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-white truncate">Portal do Cliente</h1>
                <p className="text-xs text-blue-200 truncate">{client?.company_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="flex items-center space-x-1 text-blue-200 min-w-0">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="text-xs truncate max-w-20">{client?.contact_person}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1 border-blue-400 text-blue-700 bg-white hover:bg-blue-50 focus:bg-blue-100 font-medium shadow-none h-6 px-2"
              >
                <LogOut className="h-3 w-3" />
                <span className="text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full h-[calc(100vh-40px)] sm:h-[calc(100vh-48px)] px-2 py-1 sm:px-3 sm:py-2 overflow-hidden">
        {/* Minimal Welcome Section */}
        <div className="mb-2">
          <h2 className="text-base font-bold text-white truncate">
            Bem-vindo, {client?.contact_person}!
          </h2>
          {!isMobile && (
            <p className="text-blue-200 text-xs truncate">
              Acompanhe o progresso dos seus casos
            </p>
          )}
        </div>

        {/* Fully Responsive Grid Layout with Fixed Heights */}
        <div className={`grid gap-2 h-[calc(100%-40px)] ${
          isMobile 
            ? 'grid-cols-1 grid-rows-4' 
            : 'grid-cols-2 grid-rows-2'
        }`}>
          
          {/* Cases Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-1 px-3 pt-2">
              <CardTitle className="flex items-center justify-between text-sm text-white">
                <div className="flex items-center space-x-2 min-w-0">
                  <Briefcase className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <span className="truncate">Casos</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/cases')}
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white text-xs h-5 px-2 flex-shrink-0"
                >
                  Ver
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden px-3 pb-2">
              <div className="space-y-1 mb-2">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-1 rounded transition-colors"
                  onClick={handleCasesAtivosClick}
                >
                  <span className="text-xs text-blue-300 truncate pr-2">Ativos</span>
                  <Badge className="bg-blue-500 text-white text-xs flex-shrink-0">
                    {activeCases.length}
                  </Badge>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-1 rounded transition-colors"
                  onClick={handleTotalCasosClick}
                >
                  <span className="text-xs text-slate-300 truncate pr-2">Total</span>
                  <span className="text-xs font-semibold text-white flex-shrink-0">
                    {cases.length}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1 overflow-y-auto" style={{ maxHeight: isMobile ? '80px' : '120px' }}>
                {cases.slice(0, isMobile ? 1 : 3).map((case_item) => (
                  <div 
                    key={case_item.id} 
                    className="p-1.5 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                    onClick={() => handleCaseClick(case_item.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white text-xs truncate pr-2 flex-1 min-w-0">
                        {case_item.case_title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className="text-xs flex-shrink-0 border-green-400 text-green-400"
                      >
                        {case_item.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-200 truncate pr-2">
                        {case_item.priority}
                      </span>
                      <Button size="sm" variant="ghost" className="h-4 w-4 p-0 text-blue-400 hover:bg-blue-400/20 flex-shrink-0">
                        <ArrowRight className="h-2 w-2" />
                      </Button>
                    </div>
                  </div>
                ))}
                {cases.length === 0 && (
                  <p className="text-slate-400 text-center py-2 text-xs">
                    Nenhum caso
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-1 px-3 pt-2">
              <CardTitle className="flex items-center justify-between text-sm text-white">
                <div className="flex items-center space-x-2 min-w-0">
                  <FileText className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="truncate">Documentos</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/documents')}
                  className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white text-xs h-5 px-2 flex-shrink-0"
                >
                  Ver
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden px-3 pb-2">
              <div className="space-y-1 mb-2">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-1 rounded transition-colors"
                  onClick={handleTotalDocumentosClick}
                >
                  <span className="text-xs text-green-300 truncate pr-2">Total</span>
                  <Badge className="bg-green-500 text-white text-xs flex-shrink-0">
                    {documents.length}
                  </Badge>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-1 rounded transition-colors"
                  onClick={handleRecentesClick}
                >
                  <span className="text-xs text-slate-300 truncate pr-2">Recentes</span>
                  <span className="text-xs font-semibold text-white flex-shrink-0">
                    {documents.slice(0, 5).length}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1 overflow-y-auto" style={{ maxHeight: isMobile ? '80px' : '120px' }}>
                {documents.slice(0, isMobile ? 1 : 3).map((doc) => (
                  <div 
                    key={doc.id} 
                    className="p-1.5 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                    onClick={() => handleDocumentClick(doc.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-xs truncate">
                          {doc.document_name}
                        </h4>
                        <p className="text-xs text-green-200 truncate">
                          {doc.document_type}
                        </p>
                      </div>
                      <div className="flex space-x-1 ml-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-4 w-4 p-0 text-green-400 hover:bg-green-400/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewDocument(doc);
                          }}
                          title="Visualizar"
                        >
                          <Eye className="h-2 w-2" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-4 w-4 p-0 text-green-400 hover:bg-green-400/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(doc);
                          }}
                          title="Baixar"
                        >
                          <Download className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-slate-400 text-center py-2 text-xs">
                    Nenhum documento
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-1 px-3 pt-2">
              <CardTitle className="flex items-center justify-between text-sm text-white">
                <div className="flex items-center space-x-2 min-w-0">
                  <CreditCard className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  <span className="truncate">Financeiro</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/financial')}
                  className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white text-xs h-5 px-2 flex-shrink-0"
                >
                  Ver
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden px-3 pb-2">
              <div className="space-y-1 mb-2">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-1 rounded transition-colors"
                  onClick={handlePendenciasClick}
                >
                  <span className="text-xs text-orange-300 truncate pr-2">Pendências</span>
                  <Badge className="bg-orange-500 text-white text-xs flex-shrink-0">
                    {pendingInvoices.length}
                  </Badge>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-1 rounded transition-colors"
                  onClick={handleTotalRegistrosClick}
                >
                  <span className="text-xs text-slate-300 truncate pr-2">Total</span>
                  <span className="text-xs font-semibold text-white flex-shrink-0">
                    {financialRecords.length}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1 overflow-y-auto" style={{ maxHeight: isMobile ? '80px' : '120px' }}>
                {pendingInvoices.slice(0, isMobile ? 1 : 3).map((record) => (
                  <div 
                    key={record.id} 
                    className="p-1.5 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                    onClick={() => handleFinancialItemClick(record.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white text-xs truncate pr-2 flex-1 min-w-0">
                        {record.description}
                      </h4>
                      <span className="text-xs font-semibold text-orange-400 flex-shrink-0">
                        R$ {(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-orange-200 truncate pr-2">
                        {record.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
                      <Badge variant="outline" className="border-orange-400 text-orange-400 text-xs flex-shrink-0">
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {pendingInvoices.length === 0 && (
                  <p className="text-slate-400 text-center py-2 text-xs">
                    Nenhuma pendência
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages & Notifications Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-1 px-3 pt-2">
              <CardTitle className="flex items-center justify-between text-sm text-white">
                <div className="flex items-center space-x-2 min-w-0">
                  <MessageSquare className="h-4 w-4 text-purple-400 flex-shrink-0" />
                  <span className="truncate">Comunicação</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/messages')}
                  className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white text-xs h-5 px-2 flex-shrink-0"
                >
                  Chat
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden px-3 pb-2">
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-500 text-white text-xs">Online</Badge>
                    {unreadNotifications.length > 0 && (
                      <Badge 
                        className="bg-red-500 text-white text-xs flex items-center space-x-1 cursor-pointer hover:bg-red-600 transition-colors"
                        onClick={handleNotificationsClick}
                      >
                        <Bell className="h-2 w-2" />
                        <span>{unreadNotifications.length}</span>
                      </Badge>
                    )}
                  </div>
                  <span 
                    className="text-xs font-semibold text-white cursor-pointer hover:text-purple-300 transition-colors truncate"
                    onClick={handleNotificationsClick}
                  >
                    {notifications.length}
                  </span>
                </div>
              </div>
              
              <p className="text-purple-200 text-xs mb-2 truncate">
                Comunique-se com nossa equipe
              </p>
              
              <div className="space-y-1 overflow-y-auto" style={{ maxHeight: isMobile ? '80px' : '120px' }}>
                {notificationsLoading ? (
                  <p className="text-slate-400 text-center py-2 text-xs">
                    Carregando...
                  </p>
                ) : notificationsError ? (
                  <div className="text-center py-2">
                    <p className="text-red-400 text-xs">
                      Erro ao carregar
                    </p>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.slice(0, isMobile ? 1 : 3).map((notification) => (
                    <div 
                      key={notification.id} 
                      className="p-1.5 bg-slate-700/30 rounded border border-slate-600/50 cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-medium text-white truncate">
                            {notification.title}
                          </h5>
                          <p className="text-xs text-purple-200 truncate">
                            {notification.message}
                          </p>
                          <span className="text-xs text-slate-400">
                            {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {!notification.is_read && (
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-2 text-xs">
                    Nenhuma notificação
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Document Preview Sheet */}
      <DocumentPreviewSheet
        isOpen={previewSheet.isOpen}
        onClose={closePreviewSheet}
        document={previewSheet.document}
        previewUrl={previewSheet.previewUrl}
        onDownload={handleDownloadFromSheet}
      />
    </div>
  );
};

export default Portal;
