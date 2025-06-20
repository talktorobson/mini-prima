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
import CaseTimeline from './CaseTimeline';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-3">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-lg font-bold">
            {case_.case_title || `Caso ${case_.case_number}`}
          </DialogTitle>
          <div className="flex items-center space-x-2 mt-1">
            <Badge className={getStatusColor(case_.status)}>
              {getStatusDisplayName(case_.status)}
            </Badge>
            <Badge className={getPriorityColor(case_.priority)}>
              Prioridade {getPriorityDisplayName(case_.priority)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* Progress Section */}
          {case_.progress_percentage !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Progresso do Caso</span>
                <span>{case_.progress_percentage}%</span>
              </div>
              <Progress value={case_.progress_percentage} className="h-1.5" />
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Basic Information - Takes 2/3 width */}
            <div className="lg:col-span-2 space-y-3">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Informações Básicas
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Número do Caso:</span>
                    <span className="text-gray-900 font-medium">{case_.case_number}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Serviço:</span>
                    <span className="text-gray-900">{case_.service_type || 'N/A'}</span>
                  </div>
                  {case_.court_process_number && (
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Processo:</span>
                      <span className="text-gray-900">{case_.court_process_number}</span>
                    </div>
                  )}
                  {case_.court_agency && (
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Tribunal:</span>
                      <span className="text-gray-900">{case_.court_agency}</span>
                    </div>
                  )}
                  {case_.case_risk_value && (
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Valor da Causa (pleiteado):</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(Number(case_.case_risk_value))}
                      </span>
                    </div>
                  )}
                  
                  {/* Responsáveis section */}
                  <div className="pt-1 border-t border-gray-200">
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Seu Advogado:</span>
                      <span className="text-gray-900">{case_.assigned_lawyer || 'N/A'}</span>
                    </div>
                    {case_.counterparty_name && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-1.5 mt-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <Building className="h-3.5 w-3.5 text-red-600" />
                            <span className="font-semibold text-red-800 text-xs">Parte Contrária:</span>
                          </div>
                          <span className="text-red-900 font-medium text-xs">{case_.counterparty_name}</span>
                        </div>
                      </div>
                    )}
                    {case_.opposing_party && (
                      <div className="flex justify-between items-center py-0.5 border-b border-gray-100 mt-1">
                        <span className="font-medium text-gray-600">Advogado da parte:</span>
                        <span className="text-gray-900">{case_.opposing_party}</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata section */}
                  <div className="pt-1 border-t border-gray-200">
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Criado em:</span>
                      <span className="text-gray-900">{new Date(case_.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Última atualização:</span>
                      <span className="text-gray-900">{new Date(case_.updated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {case_.risk_level && (
                      <div className="flex justify-between items-center py-0.5">
                        <span className="font-medium text-gray-600">Nível de Risco:</span>
                        <Badge variant={case_.risk_level === 'High' ? 'destructive' : case_.risk_level === 'Medium' ? 'secondary' : 'outline'} className="text-xs">
                          {getRiskDisplayName(case_.risk_level)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {case_.description && (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Descrição</h3>
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                    {case_.description}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Timeline - Takes 1/3 width */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Linha do Tempo do Caso
              </h3>
              <div className="max-h-96 overflow-y-auto">
                <CaseTimeline caseId={case_.id} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} size="sm">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaseDetailsModal;
