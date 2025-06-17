import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Bell,
  Crown,
  Plus
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
      {/* Optimized Header */}
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center ${isMobile ? 'h-10' : 'h-14'}`}>
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <Building2 className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-blue-400 flex-shrink-0`} />
              <div className="min-w-0 flex-1">
                <h1 className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-white truncate`}>Portal do Cliente</h1>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-200 truncate`}>{client?.company_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="flex items-center space-x-2 text-blue-200 min-w-0">
                <User className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} flex-shrink-0`} />
                <span className={`${isMobile ? 'text-xs max-w-20' : 'text-sm'} truncate`}>{client?.contact_person}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className={`flex items-center space-x-1 border-blue-400 text-blue-700 bg-white hover:bg-blue-50 focus:bg-blue-100 font-medium shadow-none ${isMobile ? 'h-6 px-2' : 'h-8 px-3'}`}
              >
                <LogOut className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isMobile ? 'py-2' : 'py-6'}`}>
        {/* Welcome Section */}
        <div className={`${isMobile ? 'mb-2' : 'mb-6'}`}>
          <h2 className={`${isMobile ? 'text-base' : 'text-2xl'} font-bold text-white ${isMobile ? 'truncate' : 'mb-2'}`}>
            Bem-vindo, {client?.contact_person}!
          </h2>
          {!isMobile && (
            <p className="text-blue-200">
              Acompanhe o progresso dos seus casos e mantenha-se atualizado com nossa equipe jurídica.
            </p>
          )}
        </div>

        {/* Quick Access Card for Subscriptions */}
        {!isMobile && (
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-400/30 backdrop-blur-sm mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Crown className="h-8 w-8 text-yellow-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Planos e Assinaturas</h3>
                    <p className="text-purple-200 text-sm">Gerencie seus planos jurídicos ou contrate novos serviços</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => navigate('/portal/subscriptions')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Minhas Assinaturas
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/portal/payment')}
                    className="border-purple-400 text-purple-300 hover:bg-purple-400/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Contratar Serviço
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Optimized Grid Layout with ScrollArea */}
        <div className={`grid gap-6 ${
          isMobile 
            ? 'grid-cols-1 space-y-4' 
            : 'grid-cols-2 auto-rows-fr h-[calc(100vh-200px)]'
        }`}>
          
          {/* Cases Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-4 flex-shrink-0">
              <CardTitle className="flex items-center justify-between text-xl text-white">
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-6 w-6 text-blue-400" />
                  <span>Casos</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/cases')}
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                >
                  Ver Todos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              <div className="space-y-3 mb-4 flex-shrink-0">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-3 rounded transition-colors"
                  onClick={handleCasesAtivosClick}
                >
                  <span className="text-blue-300">Casos Ativos</span>
                  <Badge className="bg-blue-500 text-white">{activeCases.length}</Badge>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-3 rounded transition-colors"
                  onClick={handleTotalCasosClick}
                >
                  <span className="text-slate-300">Total de Casos</span>
                  <span className="font-semibold text-white">{cases.length}</span>
                </div>
              </div>
              
              {isMobile ? (
                <div className="space-y-3 overflow-y-auto flex-1">
                  {cases.slice(0, 3).map((case_item) => (
                    <div 
                      key={case_item.id} 
                      className="p-4 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                      onClick={() => handleCaseClick(case_item.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white truncate pr-2">{case_item.case_title}</h4>
                        <Badge 
                          variant="outline" 
                          className={
                            case_item.status === 'Open' || case_item.status === 'In Progress' 
                              ? 'border-green-400 text-green-400' 
                              : 'border-gray-400 text-gray-400'
                          }
                        >
                          {case_item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-200">Prioridade: {case_item.priority}</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-400/20">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {cases.length === 0 && (
                    <p className="text-slate-400 text-center py-8">Nenhum caso encontrado</p>
                  )}
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-4">
                    {cases.map((case_item) => (
                      <div 
                        key={case_item.id} 
                        className="p-4 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                        onClick={() => handleCaseClick(case_item.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white truncate pr-2">{case_item.case_title}</h4>
                          <Badge 
                            variant="outline" 
                            className={
                              case_item.status === 'Open' || case_item.status === 'In Progress' 
                                ? 'border-green-400 text-green-400' 
                                : 'border-gray-400 text-gray-400'
                            }
                          >
                            {case_item.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-200">Prioridade: {case_item.priority}</span>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-400/20">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {cases.length === 0 && (
                      <p className="text-slate-400 text-center py-8">Nenhum caso encontrado</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-4 flex-shrink-0">
              <CardTitle className="flex items-center justify-between text-xl text-white">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-green-400" />
                  <span>Documentos</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/documents')}
                  className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
                >
                  Ver Todos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              <div className="space-y-3 mb-4 flex-shrink-0">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-3 rounded transition-colors"
                  onClick={handleTotalDocumentosClick}
                >
                  <span className="text-green-300">Total de Documentos</span>
                  <Badge className="bg-green-500 text-white">{documents.length}</Badge>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-3 rounded transition-colors"
                  onClick={handleRecentesClick}
                >
                  <span className="text-slate-300">Recentes</span>
                  <span className="font-semibold text-white">{documents.slice(0, 5).length}</span>
                </div>
              </div>
              
              {isMobile ? (
                <div className="space-y-3 overflow-y-auto flex-1">
                  {documents.slice(0, 3).map((doc) => (
                    <div 
                      key={doc.id} 
                      className="p-4 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                      onClick={() => handleDocumentClick(doc.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{doc.document_name}</h4>
                          <p className="text-sm text-green-200 mt-1">{doc.document_type}</p>
                        </div>
                        <div className="flex space-x-2 ml-3">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-green-400 hover:bg-green-400/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewDocument(doc);
                            }}
                            title="Visualizar documento"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-green-400 hover:bg-green-400/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadDocument(doc);
                            }}
                            title="Baixar documento"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <p className="text-slate-400 text-center py-8">Nenhum documento encontrado</p>
                  )}
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-4">
                    {documents.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="p-4 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                        onClick={() => handleDocumentClick(doc.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{doc.document_name}</h4>
                            <p className="text-sm text-green-200 mt-1">{doc.document_type}</p>
                          </div>
                          <div className="flex space-x-2 ml-3">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-green-400 hover:bg-green-400/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewDocument(doc);
                              }}
                              title="Visualizar documento"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-green-400 hover:bg-green-400/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDocument(doc);
                              }}
                              title="Baixar documento"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {documents.length === 0 && (
                      <p className="text-slate-400 text-center py-8">Nenhum documento encontrado</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Financial Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-4 flex-shrink-0">
              <CardTitle className="flex items-center justify-between text-xl text-white">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-6 w-6 text-orange-400" />
                  <span>Financeiro</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/financial')}
                  className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                >
                  Ver Detalhes
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              <div className="space-y-3 mb-4 flex-shrink-0">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-3 rounded transition-colors"
                  onClick={handlePendenciasClick}
                >
                  <span className="text-orange-300">Pendências</span>
                  <Badge className="bg-orange-500 text-white">{pendingInvoices.length}</Badge>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-3 rounded transition-colors"
                  onClick={handleTotalRegistrosClick}
                >
                  <span className="text-slate-300">Total de Registros</span>
                  <span className="font-semibold text-white">{financialRecords.length}</span>
                </div>
              </div>
              
              {isMobile ? (
                <div className="space-y-3 overflow-y-auto flex-1">
                  {pendingInvoices.slice(0, 3).map((record) => (
                    <div 
                      key={record.id} 
                      className="p-4 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                      onClick={() => handleFinancialItemClick(record.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white truncate pr-2">{record.description}</h4>
                        <span className="font-semibold text-orange-400">
                          R$ {(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-orange-200">
                          Venc: {record.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                        </span>
                        <Badge variant="outline" className="border-orange-400 text-orange-400">
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {pendingInvoices.length === 0 && (
                    <p className="text-slate-400 text-center py-8">Nenhuma pendência financeira</p>
                  )}
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-4">
                    {pendingInvoices.map((record) => (
                      <div 
                        key={record.id} 
                        className="p-4 bg-slate-700/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                        onClick={() => handleFinancialItemClick(record.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white truncate pr-2">{record.description}</h4>
                          <span className="font-semibold text-orange-400">
                            R$ {(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-orange-200">
                            Venc: {record.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                          <Badge variant="outline" className="border-orange-400 text-orange-400">
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {pendingInvoices.length === 0 && (
                      <p className="text-slate-400 text-center py-8">Nenhuma pendência financeira</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Messages & Notifications Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-4 flex-shrink-0">
              <CardTitle className="flex items-center justify-between text-xl text-white">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-6 w-6 text-purple-400" />
                  <span>Comunicação</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate('/portal/messages')}
                  className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
                >
                  Abrir Chat
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              <div className="space-y-3 mb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-green-500 text-white">Online</Badge>
                    {unreadNotifications.length > 0 && (
                      <Badge 
                        className="bg-red-500 text-white flex items-center space-x-2 cursor-pointer hover:bg-red-600 transition-colors"
                        onClick={handleNotificationsClick}
                      >
                        <Bell className="h-4 w-4" />
                        <span>{unreadNotifications.length}</span>
                      </Badge>
                    )}
                  </div>
                  <span 
                    className="font-semibold text-white cursor-pointer hover:text-purple-300 transition-colors"
                    onClick={handleNotificationsClick}
                  >
                    {notifications.length} notificações
                  </span>
                </div>
              </div>
              
              <p className="text-purple-200 mb-4 flex-shrink-0">
                Comunique-se diretamente com nossa equipe jurídica
              </p>
              
              {isMobile ? (
                <div className="space-y-3 overflow-y-auto flex-1">
                  {notificationsLoading ? (
                    <p className="text-slate-400 text-center py-8">Carregando notificações...</p>
                  ) : notificationsError ? (
                    <div className="text-center py-8">
                      <p className="text-red-400 mb-2">Erro ao carregar notificações</p>
                      <p className="text-slate-400 text-sm">{notificationsError.message}</p>
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.slice(0, 3).map((notification) => (
                      <div 
                        key={notification.id} 
                        className="p-4 bg-slate-700/30 rounded border border-slate-600/50 cursor-pointer hover:bg-slate-700/50 transition-colors"
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-white truncate">{notification.title}</h5>
                            <p className="text-sm text-purple-200 mt-1 line-clamp-2">{notification.message}</p>
                            <span className="text-xs text-slate-400 mt-2">
                              {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {!notification.is_read && (
                            <div className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-8">Nenhuma notificação</p>
                  )}
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-4">
                    {notificationsLoading ? (
                      <p className="text-slate-400 text-center py-8">Carregando notificações...</p>
                    ) : notificationsError ? (
                      <div className="text-center py-8">
                        <p className="text-red-400 mb-2">Erro ao carregar notificações</p>
                        <p className="text-slate-400 text-sm">{notificationsError.message}</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="p-4 bg-slate-700/30 rounded border border-slate-600/50 cursor-pointer hover:bg-slate-700/50 transition-colors"
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-white truncate">{notification.title}</h5>
                              <p className="text-sm text-purple-200 mt-1 line-clamp-2">{notification.message}</p>
                              <span className="text-xs text-slate-400 mt-2">
                                {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            {!notification.is_read && (
                              <div className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-center py-8">Nenhuma notificação</p>
                    )}
                  </div>
                </ScrollArea>
              )}
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
