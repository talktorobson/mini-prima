import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, ArrowRight, Upload, Scale, Search, Filter, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { casesService } from '@/services/database';
import DocumentUpload from '@/components/DocumentUpload';
import CaseDetailsModal from '@/components/CaseDetailsModal';
import * as XLSX from 'xlsx';

const PortalCases = () => {
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCaseForUpload, setSelectedCaseForUpload] = useState<{ id: string; title: string } | null>(null);
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Fetch cases from database with proper error handling
  const { data: cases = [], isLoading, error, refetch } = useQuery({
    queryKey: ['client-cases'],
    queryFn: casesService.getCases,
    retry: 3,
    retryDelay: 1000,
  });

  console.log('Cases query state:', { cases, isLoading, error });

  // Filter cases based on search query and filters
  const filteredCases = useMemo(() => {
    let filtered = cases;
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      filtered = filtered.filter((case_: any) => {
        // Search in counterparty name
        if (case_.counterparty_name?.toLowerCase().includes(query)) return true;
        
        // Search in case number/ID
        if (case_.case_number?.toLowerCase().includes(query)) return true;
        if (case_.id?.toLowerCase().includes(query)) return true;
        
        // Search in opposing party (same as counterparty)
        if (case_.opposing_party?.toLowerCase().includes(query)) return true;
        
        // Search in risk level
        if (case_.risk_level?.toLowerCase().includes(query)) return true;
        
        // Search in case risk value (convert to string and search)
        if (case_.case_risk_value?.toString().includes(query)) return true;
        
        // Search in case title
        if (case_.case_title?.toLowerCase().includes(query)) return true;
        
        return false;
      });
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((case_: any) => 
        case_.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Apply risk filter
    if (riskFilter) {
      filtered = filtered.filter((case_: any) => 
        case_.risk_level?.toLowerCase() === riskFilter.toLowerCase()
      );
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter((case_: any) => 
        case_.priority?.toLowerCase() === priorityFilter.toLowerCase()
      );
    }
    
    return filtered;
  }, [cases, searchQuery, statusFilter, riskFilter, priorityFilter]);

  const handleUploadClick = (caseId: string, caseTitle: string) => {
    setSelectedCaseForUpload({ id: caseId, title: caseTitle });
    setUploadDialogOpen(true);
  };

  const handleDetailsClick = (case_: any) => {
    setSelectedCaseForDetails(case_);
    setDetailsModalOpen(true);
  };

  const handleUploadComplete = () => {
    // Optionally refetch data or update UI
    console.log('Upload completed successfully');
  };

  const handleExport = () => {
    // Create data for Excel export
    const excelData = filteredCases.map((case_: any) => ({
      'Título do Caso': case_.case_title || 'N/A',
      'Número do Caso': case_.case_number || 'N/A',
      'Parte Contrária': case_.counterparty_name || 'N/A',
      'Status': getStatusDisplayName(case_.status),
      'Prioridade': getPriorityDisplayName(case_.priority),
      'Risco': getRiskDisplayName(case_.risk_level),
      'Valor da Causa': case_.case_risk_value ? formatCurrency(Number(case_.case_risk_value)) : 'N/A',
      'Tribunal': case_.court_agency || 'N/A',
      'Data de Criação': new Date(case_.created_at).toLocaleDateString('pt-BR')
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 30 }, // Título do Caso
      { wch: 15 }, // Número do Caso
      { wch: 25 }, // Parte Contrária
      { wch: 15 }, // Status
      { wch: 10 }, // Prioridade
      { wch: 10 }, // Risco
      { wch: 15 }, // Valor da Causa
      { wch: 20 }, // Tribunal
      { wch: 12 }  // Data de Criação
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Casos');

    // Generate and download Excel file
    const fileName = `casos-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const clearAllFilters = () => {
    setStatusFilter('');
    setRiskFilter('');
    setPriorityFilter('');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter || riskFilter || priorityFilter || searchQuery;

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

  const getRiskDisplayName = (risk: string) => {
    switch (risk) {
      case 'High': return 'Alto';
      case 'Medium': return 'Médio';
      case 'Low': return 'Baixo';
      default: return risk || 'N/A';
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
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    size="sm" 
                    className={`${hasActiveFilters ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white flex items-center space-x-2`}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filtros</span>
                    {hasActiveFilters && (
                      <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-medium">
                        {[statusFilter, riskFilter, priorityFilter, searchQuery].filter(Boolean).length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros</h4>
                      {hasActiveFilters && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearAllFilters}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Limpar tudo
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                        <select 
                          value={statusFilter} 
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">Todos os status</option>
                          <option value="open">Aberto</option>
                          <option value="in progress">Em Andamento</option>
                          <option value="waiting client">Aguardando Cliente</option>
                          <option value="waiting court">Aguardando Tribunal</option>
                          <option value="on hold">Pausado</option>
                          <option value="closed - won">Fechado - Ganho</option>
                          <option value="closed - lost">Fechado - Perdido</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Nível de Risco</label>
                        <select 
                          value={riskFilter} 
                          onChange={(e) => setRiskFilter(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">Todos os riscos</option>
                          <option value="low">Baixo</option>
                          <option value="medium">Médio</option>
                          <option value="high">Alto</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Prioridade</label>
                        <select 
                          value={priorityFilter} 
                          onChange={(e) => setPriorityFilter(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">Todas as prioridades</option>
                          <option value="low">Baixa</option>
                          <option value="medium">Média</option>
                          <option value="high">Alta</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Search Section */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por parte contrária, número do caso, risco ou valor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
          {(searchQuery || statusFilter || riskFilter || priorityFilter) && (
            <p className="mt-2 text-sm text-gray-600">
              Mostrando {filteredCases.length} de {cases.length} casos
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="ml-2 text-blue-600 hover:text-blue-700 p-0 underline"
                >
                  (limpar filtros)
                </Button>
              )}
            </p>
          )}
        </div>

        {filteredCases.length === 0 ? (
          <div className="text-center py-12">
            <Scale className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery || statusFilter || riskFilter || priorityFilter ? 'Nenhum caso encontrado para esta busca' : 'Nenhum caso encontrado'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter || riskFilter || priorityFilter
                ? 'Tente usar termos diferentes ou limpe os filtros.' 
                : 'Você não possui casos associados no momento.'
              }
            </p>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="mt-4"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredCases.map((case_) => (
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
                        {case_.counterparty_name && (
                          <p><span className="font-medium">Parte Contrária:</span> {case_.counterparty_name}</p>
                        )}
                        {case_.court_agency && (
                          <p><span className="font-medium">Tribunal:</span> {case_.court_agency}</p>
                        )}
                        <p>
                          <span className="font-medium">Risco:</span> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(case_.risk_level)}`}>
                            {getRiskDisplayName(case_.risk_level)}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Informações do Processo</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {case_.case_risk_value && (
                          <p><span className="font-medium">Valor da Causa (pleiteado):</span> {formatCurrency(Number(case_.case_risk_value))}</p>
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
                      onClick={() => handleDetailsClick(case_)}
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

      {/* Case Details Modal */}
      {selectedCaseForDetails && (
        <CaseDetailsModal
          case_={selectedCaseForDetails}
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedCaseForDetails(null);
          }}
        />
      )}
    </div>
  );
};

export default PortalCases;
