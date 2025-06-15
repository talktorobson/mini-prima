
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Building, Scale, FileText, DollarSign } from 'lucide-react';

interface CaseDetailsModalProps {
  case_: any;
  isOpen: boolean;
  onClose: () => void;
}

const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({ case_, isOpen, onClose }) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {case_.case_title || `Caso ${case_.case_number}`}
          </DialogTitle>
          <div className="flex items-center space-x-2 mt-2">
            <Badge className={getStatusColor(case_.status)}>
              {getStatusDisplayName(case_.status)}
            </Badge>
            <Badge className={getPriorityColor(case_.priority)}>
              Prioridade {getPriorityDisplayName(case_.priority)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Section */}
          {case_.progress_percentage !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progresso do Caso</span>
                <span>{case_.progress_percentage}%</span>
              </div>
              <Progress value={case_.progress_percentage} className="h-3" />
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Informações Básicas
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Número do Caso:</span>
                  <span>{case_.case_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Serviço:</span>
                  <span>{case_.service_type || 'N/A'}</span>
                </div>
                {case_.court_process_number && (
                  <div className="flex justify-between">
                    <span className="font-medium">Processo:</span>
                    <span>{case_.court_process_number}</span>
                  </div>
                )}
                {case_.court_agency && (
                  <div className="flex justify-between">
                    <span className="font-medium">Tribunal:</span>
                    <span>{case_.court_agency}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="h-5 w-5 mr-2" />
                Responsáveis
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Advogado:</span>
                  <span>{case_.assigned_lawyer || 'N/A'}</span>
                </div>
                {case_.counterparty_name && (
                  <div className="flex justify-between">
                    <span className="font-medium">Parte Contrária:</span>
                    <span>{case_.counterparty_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Cronograma
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium block">Data de Início:</span>
                <span>{case_.start_date ? new Date(case_.start_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
              </div>
              {case_.expected_close_date && (
                <div>
                  <span className="font-medium block">Previsão de Conclusão:</span>
                  <span>{new Date(case_.expected_close_date).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              {case_.actual_close_date && (
                <div>
                  <span className="font-medium block">Data de Conclusão:</span>
                  <span>{new Date(case_.actual_close_date).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Informações Financeiras
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {case_.total_value && (
                <div>
                  <span className="font-medium block">Valor Total:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(Number(case_.total_value))}
                  </span>
                </div>
              )}
              {case_.fixed_fee && (
                <div>
                  <span className="font-medium block">Taxa Fixa:</span>
                  <span>{formatCurrency(Number(case_.fixed_fee))}</span>
                </div>
              )}
              {case_.hourly_rate && (
                <div>
                  <span className="font-medium block">Valor por Hora:</span>
                  <span>{formatCurrency(Number(case_.hourly_rate))}</span>
                </div>
              )}
            </div>
            {(case_.hours_budgeted || case_.hours_worked) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {case_.hours_budgeted && (
                  <div>
                    <span className="font-medium block">Horas Orçadas:</span>
                    <span>{case_.hours_budgeted}h</span>
                  </div>
                )}
                {case_.hours_worked && (
                  <div>
                    <span className="font-medium block">Horas Trabalhadas:</span>
                    <span>{case_.hours_worked}h</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {case_.description && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Descrição</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
                {case_.description}
              </p>
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="font-medium block mb-1">Criado em:</span>
              <span>{new Date(case_.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div>
              <span className="font-medium block mb-1">Última atualização:</span>
              <span>{new Date(case_.updated_at).toLocaleDateString('pt-BR')}</span>
            </div>
            {case_.risk_level && (
              <div>
                <span className="font-medium block mb-1">Nível de Risco:</span>
                <Badge variant={case_.risk_level === 'High' ? 'destructive' : case_.risk_level === 'Medium' ? 'secondary' : 'outline'}>
                  {case_.risk_level === 'High' ? 'Alto' : case_.risk_level === 'Medium' ? 'Médio' : 'Baixo'}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaseDetailsModal;
