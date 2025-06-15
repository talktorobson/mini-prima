
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface SearchFilters {
  query: string;
  type: string;
  status: string;
  dateRange: string;
}

interface EmptyDocumentsStateProps {
  searchFilters: SearchFilters;
}

const EmptyDocumentsState: React.FC<EmptyDocumentsStateProps> = ({ searchFilters }) => {
  const hasActiveFilters = searchFilters.query || searchFilters.type || searchFilters.status || searchFilters.dateRange;

  return (
    <Card className="text-center py-12">
      <CardContent>
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {hasActiveFilters ? 'Nenhum documento encontrado' : 'Nenhum documento disponível'}
        </h3>
        <p className="text-gray-600">
          {hasActiveFilters 
            ? 'Tente ajustar os filtros de busca para encontrar documentos.' 
            : 'Seus documentos aparecerão aqui quando estiverem disponíveis.'}
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyDocumentsState;
