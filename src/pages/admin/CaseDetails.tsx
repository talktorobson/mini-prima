// 👁️ Case Details Page
// D'Avila Reis Legal Practice Management System
// Comprehensive case details view with management actions

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  AlertCircle, 
  FileText,
  Calendar,
  DollarSign,
  Scale,
  Users,
  Building,
  Clock,
  Target,
  MessageSquare,
  Upload,
  Download,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { caseService } from '@/services/caseService';
import { supabase } from '@/integrations/supabase/client';
import { securityService } from '@/services/securityService';
import CaseDocumentsList from '@/components/CaseDocumentsList';
import DocumentAttachmentButton from '@/components/DocumentAttachmentButton';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CaseDetailsPageProps {}

const CaseDetails: React.FC<CaseDetailsPageProps> = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [case_, setCase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [progressUpdate, setProgressUpdate] = useState({ percentage: 0, notes: '' });
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });
  const [notesUpdate, setNotesUpdate] = useState('');
  
  // Real-time connection state
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionMonitorRef = useRef<{ disconnect: () => void; getStatus: () => string } | null>(null);

  useEffect(() => {
    if (caseId) {
      loadCaseDetails();
      setupRealtimeSubscription();
    }

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (connectionMonitorRef.current) {
        connectionMonitorRef.current.disconnect();
        connectionMonitorRef.current = null;
      }
    };
  }, [caseId]);

  // Initialize dialog states when case data loads
  useEffect(() => {
    if (case_) {
      setProgressUpdate({ 
        percentage: case_.progress_percentage || 0, 
        notes: '' 
      });
      setStatusUpdate({ 
        status: case_.status || '', 
        notes: '' 
      });
      setNotesUpdate(case_.notes || '');
    }
  }, [case_]);

  const loadCaseDetails = async () => {
    if (!caseId) return;

    setLoading(true);
    setError(null);

    try {
      const caseData = await caseService.getCaseById(caseId);
      if (!caseData) {
        setError('Caso não encontrado');
        return;
      }
      setCase(caseData);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error loading case details:', error);
      setError(error.message || 'Erro ao carregar detalhes do caso');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    if (!caseId) return;

    try {
      setConnectionStatus('connecting');

      // Security validation for real-time connection
      const securityCheck = await securityService.validateRealtimeConnection({
        channel: `case-${caseId}`,
        resource_id: caseId,
      });

      if (!securityCheck.allowed) {
        setConnectionStatus('disconnected');
        toast({
          title: "Acesso negado",
          description: securityCheck.reason,
          variant: "destructive",
        });
        return;
      }

      // Clean up existing subscription and monitor
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (connectionMonitorRef.current) {
        connectionMonitorRef.current.disconnect();
      }

      // Start connection monitoring
      connectionMonitorRef.current = securityService.monitorConnection(`case-${caseId}`);

      // Create new real-time channel for this case
      const channel = supabase
        .channel(`case-${caseId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cases',
            filter: `id=eq.${caseId}`,
          },
          (payload) => {
            console.log('Case update received:', payload);
            handleCaseUpdate(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'documents',
            filter: `case_id=eq.${caseId}`,
          },
          (payload) => {
            console.log('Document update received:', payload);
            handleDocumentUpdate(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'case_updates',
            filter: `case_id=eq.${caseId}`,
          },
          (payload) => {
            console.log('Case update log received:', payload);
            handleCaseUpdateLog(payload);
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            toast({
              title: "Conexão estabelecida",
              description: "Atualizações em tempo real ativadas",
              duration: 2000,
            });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionStatus('disconnected');
            handleConnectionError();
          }
        });

      channelRef.current = channel;

    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      setConnectionStatus('disconnected');
      handleConnectionError();
    }
  };

  const handleCaseUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'UPDATE' && newRecord) {
      // Update case data optimistically
      setCase((prevCase: any) => {
        if (!prevCase) return newRecord;
        
        // Show toast notification for status changes
        if (prevCase.status !== newRecord.status) {
          toast({
            title: "Status do caso atualizado",
            description: `Status alterado de "${prevCase.status}" para "${newRecord.status}"`,
          });
        }
        
        // Show toast notification for progress changes
        if (prevCase.progress_percentage !== newRecord.progress_percentage) {
          toast({
            title: "Progresso atualizado",
            description: `Progresso: ${newRecord.progress_percentage}%`,
          });
        }
        
        return { ...prevCase, ...newRecord };
      });
      
      setLastUpdated(new Date());
    }
  };

  const handleDocumentUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT' && newRecord) {
      toast({
        title: "Novo documento adicionado",
        description: `${newRecord.document_name} foi anexado ao caso`,
      });
      
      // Reload case details to get updated document count
      loadCaseDetails();
    } else if (eventType === 'DELETE') {
      toast({
        title: "Documento removido",
        description: "Um documento foi removido do caso",
      });
      
      // Reload case details to get updated document count
      loadCaseDetails();
    }
  };

  const handleCaseUpdateLog = (payload: any) => {
    const { new: newRecord } = payload;
    
    if (newRecord) {
      toast({
        title: "Nova atualização do caso",
        description: newRecord.title || "Atualização adicionada ao histórico",
      });
      
      // Reload case details to get the new update in the timeline
      loadCaseDetails();
    }
  };

  const handleConnectionError = () => {
    toast({
      title: "Conexão perdida",
      description: "Tentando reconectar...",
      variant: "destructive",
    });

    // Attempt to reconnect after 5 seconds
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (caseId) {
        setupRealtimeSubscription();
      }
    }, 5000);
  };

  const forceRefresh = () => {
    loadCaseDetails();
    if (caseId) {
      setupRealtimeSubscription();
    }
  };

  const handleProgressUpdate = async () => {
    if (!caseId || updating) return;

    try {
      setUpdating(true);
      await caseService.updateCaseProgress(caseId, progressUpdate.percentage, progressUpdate.notes);
      
      toast({
        title: "Progresso atualizado",
        description: `Progresso atualizado para ${progressUpdate.percentage}%`
      });
      
      setShowProgressDialog(false);
      setProgressUpdate({ percentage: 0, notes: '' });
      
      // Reload case details to reflect changes
      loadCaseDetails();
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar progresso",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!caseId || !statusUpdate.status || updating) return;

    try {
      setUpdating(true);
      
      const updateData: any = {
        id: caseId,
        status: statusUpdate.status
      };

      await caseService.updateCase(updateData);
      
      // Create a case update log for the status change
      if (statusUpdate.notes) {
        await caseService.updateCase({
          id: caseId,
          notes: case_.notes ? `${case_.notes}\n\n[${new Date().toLocaleDateString('pt-BR')}] Status alterado para "${statusUpdate.status}": ${statusUpdate.notes}` : statusUpdate.notes
        });
      }
      
      toast({
        title: "Status atualizado",
        description: `Status alterado para "${statusUpdate.status}"`
      });
      
      setShowStatusDialog(false);
      setStatusUpdate({ status: '', notes: '' });
      
      // Reload case details to reflect changes
      loadCaseDetails();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleNotesUpdate = async () => {
    if (!caseId || updating) return;

    try {
      setUpdating(true);
      
      const updateData = {
        id: caseId,
        notes: notesUpdate
      };

      await caseService.updateCase(updateData);
      
      toast({
        title: "Observações atualizadas",
        description: "Observações do caso foram atualizadas com sucesso"
      });
      
      setShowNotesDialog(false);
      setNotesUpdate('');
      
      // Reload case details to reflect changes
      loadCaseDetails();
    } catch (error: any) {
      console.error('Error updating notes:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar observações",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!caseId || !case_) return;

    if (!confirm(`Tem certeza que deseja excluir o caso "${case_.case_title}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeleting(true);
    try {
      await caseService.deleteCase(caseId);
      toast({
        title: "Sucesso",
        description: "Caso excluído com sucesso"
      });
      navigate('/admin/staff/cases');
    } catch (error: any) {
      console.error('Error deleting case:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir caso",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting client': return 'bg-orange-100 text-orange-800';
      case 'waiting court': return 'bg-purple-100 text-purple-800';
      case 'on hold': return 'bg-gray-100 text-gray-800';
      case 'closed - won': return 'bg-green-100 text-green-800';
      case 'closed - lost': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!caseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>ID do caso não fornecido na URL.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !case_) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Caso não encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin/staff/cases')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar aos Casos</span>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{case_.case_title}</h1>
                <p className="text-sm text-gray-600">
                  {case_.case_number} • Criado em {formatDate(case_.created_at)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(case_.status)}>
                {case_.status}
              </Badge>
              <Badge className={getPriorityColor(case_.priority)}>
                {case_.priority}
              </Badge>
              
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-1 text-xs">
                {connectionStatus === 'connected' && (
                  <>
                    <Wifi className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Online</span>
                  </>
                )}
                {connectionStatus === 'connecting' && (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin text-yellow-600" />
                    <span className="text-yellow-600">Conectando</span>
                  </>
                )}
                {connectionStatus === 'disconnected' && (
                  <>
                    <WifiOff className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">Offline</span>
                  </>
                )}
              </div>
              
              {/* Last Updated */}
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
                </span>
              )}
              
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={forceRefresh}
                title="Atualizar dados"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              
              {/* Quick Update Actions */}
              <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-green-600 border-green-300">
                    <Target className="h-4 w-4 mr-2" />
                    Progresso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Atualizar Progresso do Caso</DialogTitle>
                    <DialogDescription>
                      Atualize o percentual de progresso e adicione observações.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="progress">Progresso (%)</Label>
                      <Input
                        id="progress"
                        type="number"
                        min="0"
                        max="100"
                        value={progressUpdate.percentage}
                        onChange={(e) => setProgressUpdate(prev => ({ ...prev, percentage: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="progressNotes">Observações</Label>
                      <Textarea
                        id="progressNotes"
                        value={progressUpdate.notes}
                        onChange={(e) => setProgressUpdate(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Descreva as atividades realizadas..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowProgressDialog(false)}>Cancelar</Button>
                    <Button onClick={handleProgressUpdate} disabled={updating}>
                      {updating ? 'Atualizando...' : 'Atualizar Progresso'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                    <Edit className="h-4 w-4 mr-2" />
                    Status
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Atualizar Status do Caso</DialogTitle>
                    <DialogDescription>
                      Altere o status do caso e adicione observações sobre a mudança.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status">Novo Status</Label>
                      <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Aberto</SelectItem>
                          <SelectItem value="In Progress">Em Andamento</SelectItem>
                          <SelectItem value="Waiting Client">Aguardando Cliente</SelectItem>
                          <SelectItem value="Waiting Court">Aguardando Tribunal</SelectItem>
                          <SelectItem value="On Hold">Suspenso</SelectItem>
                          <SelectItem value="Closed - Won">Fechado - Ganho</SelectItem>
                          <SelectItem value="Closed - Lost">Fechado - Perdido</SelectItem>
                          <SelectItem value="Cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="statusNotes">Motivo da Mudança</Label>
                      <Textarea
                        id="statusNotes"
                        value={statusUpdate.notes}
                        onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Explique o motivo da mudança de status..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancelar</Button>
                    <Button onClick={handleStatusUpdate} disabled={updating || !statusUpdate.status}>
                      {updating ? 'Atualizando...' : 'Atualizar Status'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-purple-600 border-purple-300">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Observações
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Atualizar Observações do Caso</DialogTitle>
                    <DialogDescription>
                      Adicione ou edite observações importantes sobre o caso.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={notesUpdate}
                        onChange={(e) => setNotesUpdate(e.target.value)}
                        placeholder="Adicione observações importantes..."
                        rows={5}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNotesDialog(false)}>Cancelar</Button>
                    <Button onClick={handleNotesUpdate} disabled={updating}>
                      {updating ? 'Atualizando...' : 'Atualizar Observações'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <DocumentAttachmentButton
                caseId={case_.id}
                caseTitle={case_.case_title}
                onUploadComplete={loadCaseDetails}
                variant="outline"
                size="sm"
              />
              
              <Link to={`/admin/staff/cases/${case_.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
              
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Visão Geral do Caso</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo de Serviço:</span>
                        <span className="font-medium">{case_.service_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Número Externo:</span>
                        <span className="font-medium">{case_.case_number_external || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nível de Risco:</span>
                        <Badge className={getRiskColor(case_.risk_level)} variant="outline">
                          {case_.risk_level || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Empresa:</span>
                        <span className="font-medium">{case_.client?.company_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contato:</span>
                        <span className="font-medium">{case_.client?.contact_person}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{case_.client?.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {case_.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                    <p className="text-sm text-gray-600">{case_.description}</p>
                  </div>
                )}

                {/* Progress */}
                {case_.progress_percentage !== null && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progresso do Caso</span>
                      <span>{case_.progress_percentage}%</span>
                    </div>
                    <Progress value={case_.progress_percentage} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scale className="h-5 w-5" />
                  <span>Detalhes Jurídicos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Parte Contrária:</span>
                      <p className="text-sm">{case_.opposing_party || case_.counterparty_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Tribunal/Órgão:</span>
                      <p className="text-sm">{case_.court_agency || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Número do Processo:</span>
                      <p className="text-sm">{case_.court_process_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Valor da Causa:</span>
                      <p className="text-sm font-medium">{formatCurrency(case_.case_risk_value)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Informações Financeiras</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Taxa por Hora:</span>
                    <p className="text-lg font-semibold">{formatCurrency(case_.hourly_rate)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Honorários Fixos:</span>
                    <p className="text-lg font-semibold">{formatCurrency(case_.fixed_fee)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Valor Total:</span>
                    <p className="text-lg font-semibold">{formatCurrency(case_.total_value)}</p>
                  </div>
                </div>

                {(case_.hours_budgeted || case_.hours_worked) && (
                  <Separator className="my-4" />
                )}

                {(case_.hours_budgeted || case_.hours_worked) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {case_.hours_budgeted && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Horas Orçadas:</span>
                        <p className="text-sm">{case_.hours_budgeted}h</p>
                      </div>
                    )}
                    {case_.hours_worked && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Horas Trabalhadas:</span>
                        <p className="text-sm">{case_.hours_worked}h</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Case Updates/Timeline */}
            {case_.case_updates && case_.case_updates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Histórico de Atualizações</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {case_.case_updates.slice(0, 5).map((update: any, index: number) => (
                      <div key={update.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{update.title}</p>
                          {update.description && (
                            <p className="text-sm text-gray-600">{update.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDate(update.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            <CaseDocumentsList 
              caseId={case_.id} 
              caseTitle={case_.case_title}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Cronograma</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Data de Início:</span>
                  <p className="text-sm">{formatDate(case_.start_date)}</p>
                </div>
                {case_.due_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Prazo:</span>
                    <p className="text-sm">{formatDate(case_.due_date)}</p>
                  </div>
                )}
                {case_.expected_close_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Previsão de Encerramento:</span>
                    <p className="text-sm">{formatDate(case_.expected_close_date)}</p>
                  </div>
                )}
                {case_.actual_close_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Data de Encerramento:</span>
                    <p className="text-sm">{formatDate(case_.actual_close_date)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Atribuição</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Advogado Responsável:</span>
                  <p className="text-sm">{case_.assigned_lawyer || 'Não atribuído'}</p>
                </div>
                {case_.supporting_staff && case_.supporting_staff.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Equipe de Apoio:</span>
                    <div className="text-sm">
                      {(Array.isArray(case_.supporting_staff) ? case_.supporting_staff : JSON.parse(case_.supporting_staff)).map((staffId: string, index: number) => (
                        <p key={index}>{staffId}</p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Notes */}
            {(case_.notes || case_.next_steps || case_.key_dates) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Informações Adicionais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {case_.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Observações:</span>
                      <p className="text-sm">{case_.notes}</p>
                    </div>
                  )}
                  {case_.next_steps && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Próximos Passos:</span>
                      <p className="text-sm">{case_.next_steps}</p>
                    </div>
                  )}
                  {case_.key_dates && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Datas Importantes:</span>
                      <p className="text-sm">{case_.key_dates}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Case Outcome (if closed) */}
            {case_.status.startsWith('Closed') && case_.outcome && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Resultado</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{case_.outcome}</p>
                  {case_.client_satisfaction && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-600">Satisfação do Cliente:</span>
                      <p className="text-sm">{case_.client_satisfaction}/5</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaseDetails;