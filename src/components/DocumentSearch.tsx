
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar } from 'lucide-react';

interface DocumentSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

interface SearchFilters {
  query: string;
  type: string;
  status: string;
  dateRange: string;
}

const DocumentSearch = ({ onSearch }: DocumentSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: '',
    status: '',
    dateRange: ''
  });

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      query: '',
      type: '',
      status: '',
      dateRange: ''
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border mb-4 sm:mb-6">
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, tipo, cliente ou caso..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2 sm:flex sm:space-x-2">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
          >
            <option value="">Todos os tipos</option>
            <option value="General Document">Documento Escritório</option>
            <option value="Case Document">Documento Processo</option>
            <option value="Contrato">Contrato</option>
            <option value="Procuração">Procuração</option>
            <option value="Relatório">Relatório</option>
            <option value="Identificação">Identificação</option>
            <option value="Petição">Petição</option>
            <option value="Jurisprudência">Jurisprudência</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
          >
            <option value="">Todos os status</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Pendente Assinatura">Pendente Assinatura</option>
            <option value="Rejeitado">Rejeitado</option>
            <option value="Processando">Processando</option>
            <option value="Em Análise">Em Análise</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
          >
            <option value="">Período</option>
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="year">Este ano</option>
          </select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearFilters}
            className="px-3 py-2 text-sm"
            title="Limpar filtros"
          >
            <Filter className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentSearch;
