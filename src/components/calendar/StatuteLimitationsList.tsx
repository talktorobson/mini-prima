import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatuteLimitationsAlert } from '@/services/calendarService';
import { RefreshCw, Search, Filter, Clock, Calendar, Building, AlertTriangle, FileText } from 'lucide-react';

interface StatuteLimitationsListProps {
  alerts: StatuteLimitationsAlert[];
  onRefresh: () => void;
}

export function StatuteLimitationsList({ alerts, onRefresh }: StatuteLimitationsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [claimTypeFilter, setClaimTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('days_remaining');

  // Get unique claim types for filter
  const claimTypes = [...new Set(alerts.map(alert => alert.claim_type))];

  // Filter and sort alerts
  const filteredAlerts = alerts
    .filter(alert => {
      const matchesSearch = alert.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.claim_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.legal_basis.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRisk = riskFilter === 'all' || alert.risk_level === riskFilter;
      const matchesClaimType = claimTypeFilter === 'all' || alert.claim_type === claimTypeFilter;
      
      return matchesSearch && matchesRisk && matchesClaimType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'days_remaining':
          return a.days_remaining - b.days_remaining;
        case 'deadline_date':
          return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
        case 'risk_level':
          const riskOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
          return riskOrder[a.risk_level as keyof typeof riskOrder] - riskOrder[b.risk_level as keyof typeof riskOrder];
        case 'claim_type':
          return a.claim_type.localeCompare(b.claim_type);
        case 'case_number':
          return a.case_number.localeCompare(b.case_number);
        default:
          return 0;
      }
    });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🔶';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'Crítico';
      case 'high': return 'Alto';
      case 'medium': return 'Médio';
      case 'low': return 'Baixo';
      default: return 'Indefinido';
    }
  };

  const getClaimTypeLabel = (claimType: string) => {
    const types: { [key: string]: string } = {
      'contractual': 'Contratual',
      'tort': 'Responsabilidade Civil',
      'labor': 'Trabalhista',
      'tax': 'Tributário',
      'criminal': 'Criminal',
      'administrative': 'Administrativo',
      'civil': 'Cível',
      'commercial': 'Comercial',
      'consumer': 'Consumidor',
    };
    return types[claimType] || claimType;
  };

  const formatDaysRemaining = (days: number) => {
    if (days < 0) return `${Math.abs(days)} dias prescrito`;
    if (days === 0) return 'Prescreve hoje';
    if (days === 1) return '1 dia restante';
    if (days <= 30) return `${days} dias restantes`;
    if (days <= 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return `${months} mês${months > 1 ? 'es' : ''}${remainingDays > 0 ? ` e ${remainingDays} dias` : ''}`;
    }
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    return `${years} ano${years > 1 ? 's' : ''}${remainingDays > 0 ? ` e ${Math.floor(remainingDays / 30)} meses` : ''}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Group alerts by risk level
  const groupedAlerts = {
    critical: filteredAlerts.filter(a => a.risk_level === 'critical'),
    high: filteredAlerts.filter(a => a.risk_level === 'high'),
    medium: filteredAlerts.filter(a => a.risk_level === 'medium'),
    low: filteredAlerts.filter(a => a.risk_level === 'low'),
  };

  const StatuteCard = ({ alert }: { alert: StatuteLimitationsAlert }) => (
    <Card className={`
      transition-all hover:shadow-md
      ${alert.risk_level === 'critical' ? 'border-red-300 bg-red-50' : ''}
      ${alert.risk_level === 'high' ? 'border-orange-300 bg-orange-50' : ''}
      ${alert.days_remaining < 0 ? 'border-red-500 bg-red-100' : ''}
    `}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">{getRiskIcon(alert.risk_level)}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                {getClaimTypeLabel(alert.claim_type)}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Base legal: {alert.legal_basis}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={getRiskColor(alert.risk_level)}>
              {getRiskLabel(alert.risk_level)}
            </Badge>
            {alert.days_remaining < 0 && (
              <Badge variant="destructive">
                Prescrito
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
          {/* Case Information */}
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium">Processo</div>
              <div className="font-mono text-xs text-gray-600">{alert.case_number}</div>
            </div>
          </div>

          {/* Client */}
          <div className="flex items-start gap-2">
            <Building className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium">Cliente</div>
              <div className="text-gray-600">{alert.client_name}</div>
            </div>
          </div>

          {/* Deadline Date */}
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium">Data Limite</div>
              <div className="text-gray-600">{formatDate(alert.deadline_date)}</div>
            </div>
          </div>
        </div>

        {/* Time Remaining - Prominent Display */}
        <div className="bg-white border rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3">
            <Clock className={`
              h-5 w-5
              ${alert.days_remaining < 0 ? 'text-red-600' : ''}
              ${alert.days_remaining <= 30 ? 'text-red-600' : ''}
              ${alert.days_remaining <= 90 ? 'text-orange-600' : 'text-gray-500'}
            `} />
            <div>
              <div className="text-xs text-gray-500 font-medium">PRAZO PRESCRICIONAL</div>
              <div className={`
                text-lg font-bold
                ${alert.days_remaining < 0 ? 'text-red-600' : ''}
                ${alert.days_remaining <= 30 ? 'text-red-600' : ''}
                ${alert.days_remaining <= 90 ? 'text-orange-600' : 'text-gray-700'}
              `}>
                {formatDaysRemaining(alert.days_remaining)}
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Alert */}
        {alert.days_remaining < 0 && (
          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <div className="text-red-800 font-medium mb-1">Direito Prescrito</div>
              <div className="text-red-700 text-sm">
                O prazo prescricional já foi ultrapassado. Verifique se há causas de interrupção ou suspensão aplicáveis.
              </div>
            </div>
          </div>
        )}

        {/* Critical Warning */}
        {alert.days_remaining >= 0 && alert.days_remaining <= 30 && (
          <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <div className="text-orange-800 font-medium mb-1">Atenção Urgente</div>
              <div className="text-orange-700 text-sm">
                Prazo prescricional próximo do vencimento. Considere tomar medidas para interromper a prescrição.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Prescrição e Decadência
              </CardTitle>
              <CardDescription>
                Monitoramento de prazos prescricionais e decadenciais
              </CardDescription>
            </div>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por caso, cliente, tipo de direito ou base legal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por risco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="critical">🚨 Crítico</SelectItem>
                <SelectItem value="high">⚠️ Alto</SelectItem>
                <SelectItem value="medium">🔶 Médio</SelectItem>
                <SelectItem value="low">🟢 Baixo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={claimTypeFilter} onValueChange={setClaimTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo de direito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {claimTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getClaimTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days_remaining">Dias restantes</SelectItem>
                <SelectItem value="deadline_date">Data limite</SelectItem>
                <SelectItem value="risk_level">Nível de risco</SelectItem>
                <SelectItem value="claim_type">Tipo de direito</SelectItem>
                <SelectItem value="case_number">Número do processo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{groupedAlerts.critical.length}</div>
              <div className="text-sm text-red-800">Críticos</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{groupedAlerts.high.length}</div>
              <div className="text-sm text-orange-800">Alto Risco</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{groupedAlerts.medium.length}</div>
              <div className="text-sm text-yellow-800">Médio</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{groupedAlerts.low.length}</div>
              <div className="text-sm text-green-800">Baixo</div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-800 mb-1">Sobre a Prescrição</div>
                <div className="text-blue-700 text-sm">
                  A prescrição é a extinção de uma pretensão em razão da inércia do seu titular durante um 
                  determinado lapso de tempo. Este sistema monitora os prazos prescricionais para evitar a 
                  perda de direitos por decurso de prazo.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">📋</div>
            <p className="text-gray-600">
              {searchTerm || riskFilter !== 'all' || claimTypeFilter !== 'all'
                ? 'Nenhuma prescrição encontrada com os filtros aplicados'
                : 'Nenhum prazo prescricional monitorado encontrado'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Critical and expired first */}
          {groupedAlerts.critical.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                🚨 Prescrições Críticas ({groupedAlerts.critical.length})
              </h3>
              <div className="space-y-3">
                {groupedAlerts.critical.map((alert) => (
                  <StatuteCard key={alert.id} alert={alert} />
                ))}
              </div>
            </>
          )}

          {/* High priority */}
          {groupedAlerts.high.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                ⚠️ Alto Risco ({groupedAlerts.high.length})
              </h3>
              <div className="space-y-3">
                {groupedAlerts.high.map((alert) => (
                  <StatuteCard key={alert.id} alert={alert} />
                ))}
              </div>
            </>
          )}

          {/* Medium and low priority */}
          {(groupedAlerts.medium.length > 0 || groupedAlerts.low.length > 0) && (
            <>
              <h3 className="text-lg font-semibold text-gray-600 flex items-center gap-2">
                📋 Outras Prescrições ({groupedAlerts.medium.length + groupedAlerts.low.length})
              </h3>
              <div className="space-y-3">
                {[...groupedAlerts.medium, ...groupedAlerts.low].map((alert) => (
                  <StatuteCard key={alert.id} alert={alert} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}