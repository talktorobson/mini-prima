
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Upload, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { casesService } from '@/services/database';
import DocumentUpload from '@/components/DocumentUpload';

const PortalCases = () => {
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCaseForUpload, setSelectedCaseForUpload] = useState<{ id: string; title: string } | null>(null);

  // Fetch cases from database with proper error handling
  const { data: cases = [], isLoading, error, refetch } = useQuery({
    queryKey: ['client-cases'],
    queryFn: casesService.getCases,
    retry: 3,
    retryDelay: 1000,
  });

  console.log('Cases query state:', { cases, isLoading, error });

  const handleUploadClick = (caseId: string, caseTitle: string) => {
    setSelectedCaseForUpload({ id: caseId, title: caseTitle });
    setUploadDialogOpen(true);
  };

  const handleUploadComplete = () => {
    // Optionally refetch data or update UI
    console.log('Upload completed successfully');
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'Open': return 'Aberto';
      case 'In Progress': return 'Em Andamento';
      case 'Waiting Client': return 'Aguardando Cliente';
      case 'Waiting Court': return 'Aguardando Tribunal';
      case 'On Hold': return 'Pausado';
      case 'Closed - Won': return 'Fechado - Ganho';
      case 'Closed - Lost': return 'Fechado - Perdido';
      case 'Cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getPriorityDisplayName = (priority: string) => {
    switch (priority) {
      case 'High': return 'Alta';
      case 'Medium': return 'Média';
      case 'Low': return 'Baixa';
      default: return priority;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    console.error('Cases loading error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar casos</h2>
          <p className="text-gray-600 mb-4">Tente novamente mais tarde.</p>
          <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/portal')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Portal</span>
              </Button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-bold text-gray-900">Meus Casos</h1>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Filtros
              </Button>
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {cases.length === 0 ? (
          <div className="text-center py-12">
            <Scale className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum caso encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Você não possui casos associados no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {cases.map((case_) => (
              <Card key={case_.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{case_.case_title || `Caso ${case_.case_number}`}</CardTitle>
                      <CardDescription className="mt-1">
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          <span>Número: {case_.case_number}</span>
                          {case_.court_process_number && (
                            <span>• Processo: {case_.court_process_number}</span>
                          )}
                          <span>• Criado: {new Date(case_.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
                        {getStatusDisplayName(case_.status)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(case_.priority)}`}>
                        {getPriorityDisplayName(case_.priority)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Case Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Detalhes do Caso</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Serviço:</span> {case_.service_type || 'N/A'}</p>
                        <p><span className="font-medium">Responsável:</span> {case_.assigned_lawyer || 'N/A'}</p>
                        {case_.counterparty_name && (
                          <p><span className="font-medium">Parte Contrária:</span> {case_.counterparty_name}</p>
                        )}
                        {case_.court_agency && (
                          <p><span className="font-medium">Tribunal:</span> {case_.court_agency}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Informações Financeiras</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {case_.total_value && (
                          <p><span className="font-medium">Valor Total:</span> {formatCurrency(Number(case_.total_value))}</p>
                        )}
                        {case_.fixed_fee && (
                          <p><span className="font-medium">Taxa Fixa:</span> {formatCurrency(Number(case_.fixed_fee))}</p>
                        )}
                        {case_.hourly_rate && (
                          <p><span className="font-medium">Valor/Hora:</span> {formatCurrency(Number(case_.hourly_rate))}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {case_.progress_percentage !== null && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progresso</span>
                        <span>{case_.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${case_.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center space-x-2"
                        onClick={() => handleUploadClick(case_.id, case_.case_title || case_.case_number)}
                      >
                        <Upload className="h-4 w-4" />
                        <span>Enviar Documentos</span>
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center space-x-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <span>Ver Detalhes</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Document Upload Dialog */}
      {selectedCaseForUpload && (
        <DocumentUpload
          caseId={selectedCaseForUpload.id}
          caseTitle={selectedCaseForUpload.title}
          isOpen={uploadDialogOpen}
          onClose={() => {
            setUploadDialogOpen(false);
            setSelectedCaseForUpload(null);
          }}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
};

export default PortalCases;
