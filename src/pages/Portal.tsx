
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

const Portal = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: client, isLoading: clientLoading } = useClientData();
  const { toast } = useToast();
  
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

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getNotifications,
    enabled: !!client
  });

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
      
      // Get signed URL for preview
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

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
        // Open in sheet instead of modal
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
      
      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from('case-documents')
        .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

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
        // Use fetch to download the file properly
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
    // Could navigate to notifications page or show modal
  };

  const handleNotificationClick = (notificationId: string) => {
    console.log('Viewing notification:', notificationId);
    // Could mark as read and show details
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Compact Header */}
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6 text-blue-400" />
              <div>
                <h1 className="text-lg font-bold text-white">Portal do Cliente</h1>
                <p className="text-xs text-blue-200">{client?.company_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-blue-200">
                <User className="h-3 w-3" />
                <span className="text-xs">{client?.contact_person}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-1 border-slate-600 text-blue-200 hover:bg-slate-700 h-8 px-3">
                <LogOut className="h-3 w-3" />
                <span className="text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white mb-1">
            Bem-vindo, {client?.contact_person}!
          </h2>
          <p className="text-blue-200 text-sm">
            Acompanhe o progresso dos seus casos e mantenha-se atualizado com nossa equipe jurídica.
          </p>
        </div>

        {/* 2x2 Grid Layout - Fixed */}
        <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[calc(100vh-200px)]">
          
          {/* Top Left: Cases */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg text-white">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-blue-400" />
                  <span>Casos</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/cases')}
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white text-xs h-7 px-3"
                >
                  Ver Todos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-2 mb-3">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-2 rounded transition-colors"
                  onClick={handleCasesAtivosClick}
                >
                  <span className="text-sm text-blue-300">Casos Ativos</span>
                  <Badge className="bg-blue-500 text-white text-xs">{activeCases.length}</Badge>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-2 rounded transition-colors"
                  onClick={handleTotalCasosClick}
                >
                  <span className="text-sm text-slate-300">Total de Casos</span>
                  <span className="text-sm font-semibold text-white">{cases.length}</span>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[calc(100%-80px)] overflow-y-auto">
                {cases.slice(0, 6).map((case_item) => (
                  <div 
                    key={case_item.id} 
                    className="p-3 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                    onClick={() => handleCaseClick(case_item.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white text-sm truncate pr-2">{case_item.case_title}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          case_item.status === 'Open' || case_item.status === 'In Progress' 
                            ? 'border-green-400 text-green-400' 
                            : 'border-gray-400 text-gray-400'
                        }`}
                      >
                        {case_item.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-200">Prioridade: {case_item.priority}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-400/20">
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {cases.length === 0 && (
                  <p className="text-slate-400 text-center py-8 text-sm">Nenhum caso encontrado</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Right: Documents */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg text-white">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-400" />
                  <span>Documentos</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/documents')}
                  className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white text-xs h-7 px-3"
                >
                  Ver Todos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-2 mb-3">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-2 rounded transition-colors"
                  onClick={handleTotalDocumentosClick}
                >
                  <span className="text-sm text-green-300">Total de Documentos</span>
                  <Badge className="bg-green-500 text-white text-xs">{documents.length}</Badge>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-2 rounded transition-colors"
                  onClick={handleRecentesClick}
                >
                  <span className="text-sm text-slate-300">Recentes</span>
                  <span className="text-sm font-semibold text-white">{documents.slice(0, 5).length}</span>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[calc(100%-80px)] overflow-y-auto">
                {documents.slice(0, 6).map((doc) => (
                  <div 
                    key={doc.id} 
                    className="p-3 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                    onClick={() => handleDocumentClick(doc.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{doc.document_name}</h4>
                        <p className="text-xs text-green-200 mt-1">{doc.document_type}</p>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 text-green-400 hover:bg-green-400/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewDocument(doc);
                          }}
                          title="Visualizar documento"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 text-green-400 hover:bg-green-400/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(doc);
                          }}
                          title="Baixar documento"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-slate-400 text-center py-8 text-sm">Nenhum documento encontrado</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bottom Left: Financial */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg text-white">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-orange-400" />
                  <span>Financeiro</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/financial')}
                  className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white text-xs h-7 px-3"
                >
                  Ver Detalhes
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-2 mb-3">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-2 rounded transition-colors"
                  onClick={handlePendenciasClick}
                >
                  <span className="text-sm text-orange-300">Pendências</span>
                  <Badge className="bg-orange-500 text-white text-xs">{pendingInvoices.length}</Badge>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-2 rounded transition-colors"
                  onClick={handleTotalRegistrosClick}
                >
                  <span className="text-sm text-slate-300">Total de Registros</span>
                  <span className="text-sm font-semibold text-white">{financialRecords.length}</span>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[calc(100%-80px)] overflow-y-auto">
                {pendingInvoices.slice(0, 6).map((record) => (
                  <div 
                    key={record.id} 
                    className="p-3 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                    onClick={() => handleFinancialItemClick(record.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white text-sm truncate pr-2">{record.description}</h4>
                      <span className="text-sm font-semibold text-orange-400">
                        R$ {(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-orange-200">
                        Venc: {record.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
                      <Badge variant="outline" className="border-orange-400 text-orange-400 text-xs">
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {pendingInvoices.length === 0 && (
                  <p className="text-slate-400 text-center py-8 text-sm">Nenhuma pendência financeira</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bottom Right: Messages & Notifications */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg text-white">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                  <span>Comunicação</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/messages')}
                  className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white text-xs h-7 px-3"
                >
                  Abrir Chat
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-500 text-white text-xs">Online</Badge>
                    {unreadNotifications.length > 0 && (
                      <Badge 
                        className="bg-red-500 text-white text-xs flex items-center space-x-1 cursor-pointer hover:bg-red-600 transition-colors"
                        onClick={handleNotificationsClick}
                      >
                        <Bell className="h-3 w-3" />
                        <span>{unreadNotifications.length}</span>
                      </Badge>
                    )}
                  </div>
                  <span 
                    className="text-sm font-semibold text-white cursor-pointer hover:text-purple-300 transition-colors"
                    onClick={handleNotificationsClick}
                  >
                    {notifications.length} notificações
                  </span>
                </div>
              </div>
              
              <p className="text-purple-200 text-sm mb-3">
                Comunique-se diretamente com nossa equipe jurídica
              </p>
              
              <div className="space-y-3 max-h-[calc(100%-100px)] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.slice(0, 6).map((notification) => (
                    <div 
                      key={notification.id} 
                      className="p-3 bg-slate-700/30 rounded border border-slate-600/50 cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-white truncate">{notification.title}</h5>
                          <p className="text-xs text-purple-200 mt-1 line-clamp-2">{notification.message}</p>
                          <span className="text-xs text-slate-400 mt-1">
                            {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8 text-sm">Nenhuma notificação</p>
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
