import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeadlineAlert } from '@/services/calendarService';
import { RefreshCw, Search, Filter, AlertTriangle, Clock, Calendar, Building } from 'lucide-react';

interface DeadlinesListProps {
  alerts: DeadlineAlert[];
  onRefresh: () => void;
}

export function DeadlinesList({ alerts, onRefresh }: DeadlinesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('deadline_date');

  // Filter and sort alerts
  const filteredAlerts = alerts
    .filter(alert => {
      const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRisk = riskFilter === 'all' || alert.risk_level === riskFilter;
      
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'deadline_date':
          return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
        case 'risk_level':
          const riskOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
          return riskOrder[a.risk_level as keyof typeof riskOrder] - riskOrder[b.risk_level as keyof typeof riskOrder];
        case 'days_remaining':
          return a.days_remaining - b.days_remaining;
        case 'title':
          return a.title.localeCompare(b.title);
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

  const formatDaysRemaining = (days: number) => {
    if (days < 0) return `${Math.abs(days)} dias atrasado`;
    if (days === 0) return 'Vence hoje';
    if (days === 1) return '1 dia restante';
    return `${days} dias restantes`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Group alerts by risk level for better organization
  const groupedAlerts = {
    critical: filteredAlerts.filter(a => a.risk_level === 'critical'),
    high: filteredAlerts.filter(a => a.risk_level === 'high'),
    medium: filteredAlerts.filter(a => a.risk_level === 'medium'),
    low: filteredAlerts.filter(a => a.risk_level === 'low'),
  };

  const AlertCard = ({ alert }: { alert: DeadlineAlert }) => (
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
              <h3 className="font-semibold text-lg mb-1">{alert.title}</h3>
              {alert.consequence && (
                <p className="text-sm text-gray-600 mb-2">{alert.consequence}</p>
              )}
            </div>
          </div>
          <Badge variant={getRiskColor(alert.risk_level)}>
            {getRiskLabel(alert.risk_level)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {/* Deadline Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium">Data Limite</div>
              <div className="text-gray-600">{formatDate(alert.deadline_date)}</div>
            </div>
          </div>

          {/* Days Remaining */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium">Prazo</div>
              <div className={`
                ${alert.days_remaining < 0 ? 'text-red-600 font-medium' : ''}
                ${alert.days_remaining <= 3 ? 'text-red-600' : ''}
                ${alert.days_remaining <= 7 ? 'text-orange-600' : 'text-gray-600'}
              `}>
                {formatDaysRemaining(alert.days_remaining)}
              </div>
            </div>
          </div>

          {/* Case/Client Info */}
          {(alert.case_number || alert.client_name) && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">Processo/Cliente</div>
                <div className="text-gray-600">
                  {alert.case_number && <div className="font-mono text-xs">{alert.case_number}</div>}
                  {alert.client_name && <div>{alert.client_name}</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Overdue Alert */}
        {alert.days_remaining < 0 && (
          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-red-800 font-medium">Prazo vencido! Ação imediata necessária.</span>
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
                <AlertTriangle className="h-5 w-5" />
                Prazos e Alertas Legais
              </CardTitle>
              <CardDescription>
                Monitoramento de prazos processuais e obrigações legais
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
                  placeholder="Buscar por título, número do processo ou cliente..."
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline_date">Data limite</SelectItem>
                <SelectItem value="days_remaining">Dias restantes</SelectItem>
                <SelectItem value="risk_level">Nível de risco</SelectItem>
                <SelectItem value="title">Título</SelectItem>
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
        </CardContent>
      </Card>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">🎉</div>
            <p className="text-gray-600">
              {searchTerm || riskFilter !== 'all' 
                ? 'Nenhum prazo encontrado com os filtros aplicados'
                : 'Nenhum prazo legal pendente encontrado'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Critical alerts first */}
          {groupedAlerts.critical.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                🚨 Alertas Críticos ({groupedAlerts.critical.length})
              </h3>
              <div className="space-y-3">
                {groupedAlerts.critical.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </>
          )}

          {/* High priority alerts */}
          {groupedAlerts.high.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                ⚠️ Alto Risco ({groupedAlerts.high.length})
              </h3>
              <div className="space-y-3">
                {groupedAlerts.high.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </>
          )}

          {/* Medium and low priority (if not filtered) */}
          {riskFilter === 'all' && (groupedAlerts.medium.length > 0 || groupedAlerts.low.length > 0) && (
            <>
              <h3 className="text-lg font-semibold text-gray-600 flex items-center gap-2">
                📋 Outros Prazos ({groupedAlerts.medium.length + groupedAlerts.low.length})
              </h3>
              <div className="space-y-3">
                {[...groupedAlerts.medium, ...groupedAlerts.low].map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}