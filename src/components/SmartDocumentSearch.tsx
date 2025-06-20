// 🔍 Smart Document Search Component
// D'Avila Reis Legal Practice Management System
// Advanced search with intelligent filtering and bulk operations

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List,
  Download,
  Trash2,
  Eye,
  FileText,
  Calendar,
  Building,
  Paperclip,
  X
} from 'lucide-react';
import useDocumentManagement, { DocumentSearchFilters } from '@/hooks/useDocumentManagement';

interface SmartDocumentSearchProps {
  onFiltersChange?: (filters: DocumentSearchFilters) => void;
  enableBulkOperations?: boolean;
  enableSelection?: boolean;
  presetFilters?: DocumentSearchFilters;
  className?: string;
}

const SmartDocumentSearch: React.FC<SmartDocumentSearchProps> = ({
  onFiltersChange,
  enableBulkOperations = true,
  enableSelection = true,
  presetFilters,
  className = ''
}) => {
  const {
    documents,
    isLoading,
    state,
    updateSearchFilters,
    clearSearchFilters,
    updateSorting,
    toggleDocumentSelection,
    selectAllDocuments,
    clearSelection,
    bulkDownload,
    bulkUpdate,
    hasSelection,
    selectionCount,
    getSelectedDocuments
  } = useDocumentManagement(presetFilters);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [quickSearchValue, setQuickSearchValue] = useState(state.searchFilters.query || '');

  useEffect(() => {
    onFiltersChange?.(state.searchFilters);
  }, [state.searchFilters, onFiltersChange]);

  const handleQuickSearch = (value: string) => {
    setQuickSearchValue(value);
    updateSearchFilters({ query: value });
  };

  const handleFilterChange = (key: keyof DocumentSearchFilters, value: string | boolean) => {
    updateSearchFilters({ [key]: value });
  };

  const handleSort = (sortBy: typeof state.sortBy) => {
    const newOrder = state.sortBy === sortBy && state.sortOrder === 'asc' ? 'desc' : 'asc';
    updateSorting(sortBy, newOrder);
  };

  const handleClearFilters = () => {
    setQuickSearchValue('');
    clearSearchFilters();
  };

  const activeFilterCount = Object.values(state.searchFilters).filter(value => 
    value !== undefined && value !== '' && value !== false
  ).length;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar documentos por nome, tipo, cliente, caso..."
                value={quickSearchValue}
                onChange={(e) => handleQuickSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={showAdvancedFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 px-1 py-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={state.searchFilters.type || ''}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="General Document">Documento Geral</option>
                    <option value="Case Document">Documento Processo</option>
                    <option value="Contrato">Contrato</option>
                    <option value="Procuração">Procuração</option>
                    <option value="Relatório">Relatório</option>
                    <option value="Petição">Petição</option>
                    <option value="Jurisprudência">Jurisprudência</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={state.searchFilters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os status</option>
                    <option value="Draft">Rascunho</option>
                    <option value="Review">Em Revisão</option>
                    <option value="Approved">Aprovado</option>
                    <option value="Rejected">Rejeitado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período
                  </label>
                  <select
                    value={state.searchFilters.dateRange || ''}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os períodos</option>
                    <option value="today">Hoje</option>
                    <option value="week">Esta semana</option>
                    <option value="month">Este mês</option>
                    <option value="year">Este ano</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visibilidade
                  </label>
                  <select
                    value={state.searchFilters.isVisibleToClient === undefined ? '' : state.searchFilters.isVisibleToClient.toString()}
                    onChange={(e) => handleFilterChange('isVisibleToClient', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas</option>
                    <option value="true">Visível ao Cliente</option>
                    <option value="false">Apenas Interno</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {documents.length} documento{documents.length !== 1 ? 's' : ''} encontrado{documents.length !== 1 ? 's' : ''}
          </span>
          
          {enableSelection && hasSelection && (
            <Badge variant="secondary">
              {selectionCount} selecionado{selectionCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sorting */}
          <div className="flex items-center gap-1">
            <Button
              variant={state.sortBy === 'name' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSort('name')}
            >
              Nome
              {state.sortBy === 'name' && (
                state.sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
              )}
            </Button>
            <Button
              variant={state.sortBy === 'date' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSort('date')}
            >
              Data
              {state.sortBy === 'date' && (
                state.sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
              )}
            </Button>
            <Button
              variant={state.sortBy === 'size' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSort('size')}
            >
              Tamanho
              {state.sortBy === 'size' && (
                state.sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
              )}
            </Button>
          </div>

          {/* Bulk Operations */}
          {enableBulkOperations && hasSelection && (
            <div className="flex items-center gap-1 border-l pl-2 ml-2">
              <Button variant="outline" size="sm" onClick={bulkDownload}>
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => bulkUpdate(getSelectedDocuments().map(d => d.id), { status: 'Approved' })}
              >
                <Eye className="h-3 w-3 mr-1" />
                Aprovar
              </Button>
            </div>
          )}

          {/* Selection Controls */}
          {enableSelection && (
            <div className="flex items-center gap-1 border-l pl-2 ml-2">
              <Button variant="ghost" size="sm" onClick={selectAllDocuments}>
                Selecionar Todos
              </Button>
              {hasSelection && (
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando documentos...</p>
          </div>
        ) : documents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-gray-600">
                {activeFilterCount > 0 
                  ? "Tente ajustar os filtros de busca."
                  : "Ainda não há documentos disponíveis."}
              </p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {enableSelection && (
                      <Checkbox
                        checked={state.selectedDocuments.includes(doc.id)}
                        onCheckedChange={() => toggleDocumentSelection(doc.id)}
                      />
                    )}
                    
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {doc.document_name || doc.original_filename || 'Documento sem nome'}
                        </h3>
                        <Badge className={getStatusBadgeColor(doc.status)}>
                          {doc.status}
                        </Badge>
                        {doc.is_visible_to_client && (
                          <Badge variant="outline" className="text-xs">
                            Visível ao Cliente
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{doc.document_type}</span>
                        {doc.client && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {doc.client.company_name}
                          </span>
                        )}
                        {doc.case && (
                          <span className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            {doc.case.case_number}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.upload_date || doc.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span>{formatFileSize(doc.file_size || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" title="Visualizar">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Download">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SmartDocumentSearch;