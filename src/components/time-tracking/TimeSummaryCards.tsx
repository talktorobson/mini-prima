import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, CheckCircle, FileText, TrendingUp, Users } from 'lucide-react';
import { TimeTrackingSummary, timeTrackingService } from '@/services/timeTrackingService';

interface TimeSummaryCardsProps {
  summary: TimeTrackingSummary;
}

export function TimeSummaryCards({ summary }: TimeSummaryCardsProps) {
  const utilizationRate = summary.total_hours > 0 ? (summary.billable_hours / summary.total_hours) * 100 : 0;
  const billingRate = summary.billable_hours > 0 ? summary.total_amount / summary.billable_hours : 0;
  const collectionRate = summary.total_amount > 0 ? (summary.billed_amount / summary.total_amount) * 100 : 0;

  const cards = [
    {
      title: 'Total de Horas',
      value: summary.total_hours.toFixed(1),
      subtitle: 'horas trabalhadas',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      details: `${summary.billable_hours.toFixed(1)}h faturáveis`,
    },
    {
      title: 'Valor Gerado',
      value: timeTrackingService.formatCurrency(summary.total_amount),
      subtitle: 'valor total',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      details: `${timeTrackingService.formatCurrency(summary.billed_amount)} faturado`,
    },
    {
      title: 'Registros',
      value: summary.entries_count.toString(),
      subtitle: 'entradas de tempo',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      details: `${summary.status_breakdown.approved} aprovados`,
    },
    {
      title: 'Taxa de Utilização',
      value: `${utilizationRate.toFixed(1)}%`,
      subtitle: 'tempo faturável',
      icon: TrendingUp,
      color: utilizationRate >= 75 ? 'text-green-600' : utilizationRate >= 50 ? 'text-yellow-600' : 'text-red-600',
      bgColor: utilizationRate >= 75 ? 'bg-green-100' : utilizationRate >= 50 ? 'bg-yellow-100' : 'bg-red-100',
      details: `${summary.billable_hours.toFixed(1)}h de ${summary.total_hours.toFixed(1)}h`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className={`text-2xl font-bold ${card.color}`}>
                    {card.value}
                  </div>
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                  <p className="text-xs text-gray-600">{card.details}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Breakdown and Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
              Status dos Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.status_breakdown).map(([status, count]) => {
                if (count === 0) return null;
                
                const statusLabels = {
                  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
                  submitted: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
                  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
                  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
                  billed: { label: 'Faturado', color: 'bg-purple-100 text-purple-800' },
                };

                const statusInfo = statusLabels[status as keyof typeof statusLabels];
                const percentage = summary.entries_count > 0 ? (count / summary.entries_count) * 100 : 0;

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {count} registro{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Métricas de Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taxa Horária Média</span>
                <span className="font-medium">
                  {timeTrackingService.formatCurrency(billingRate)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taxa de Cobrança</span>
                <span className={`font-medium ${
                  collectionRate >= 90 ? 'text-green-600' : 
                  collectionRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {collectionRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Horas por Registro</span>
                <span className="font-medium">
                  {summary.entries_count > 0 ? (summary.total_hours / summary.entries_count).toFixed(1) : '0'}h
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor por Registro</span>
                <span className="font-medium">
                  {summary.entries_count > 0 
                    ? timeTrackingService.formatCurrency(summary.total_amount / summary.entries_count)
                    : timeTrackingService.formatCurrency(0)
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${
                utilizationRate >= 75 ? 'text-green-600' : 
                utilizationRate >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {utilizationRate >= 75 ? '🎯' : utilizationRate >= 50 ? '⚠️' : '📉'}
              </div>
              <div className="text-sm font-medium">Eficiência</div>
              <div className="text-xs text-gray-600">
                {utilizationRate >= 75 ? 'Excelente utilização' : 
                 utilizationRate >= 50 ? 'Boa utilização' : 'Melhorar foco'}
              </div>
            </div>

            <div className="space-y-2">
              <div className={`text-2xl font-bold ${
                collectionRate >= 90 ? 'text-green-600' : 
                collectionRate >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {collectionRate >= 90 ? '💰' : collectionRate >= 70 ? '💵' : '⏳'}
              </div>
              <div className="text-sm font-medium">Cobrança</div>
              <div className="text-xs text-gray-600">
                {collectionRate >= 90 ? 'Excelente cobrança' : 
                 collectionRate >= 70 ? 'Boa cobrança' : 'Agilizar cobranças'}
              </div>
            </div>

            <div className="space-y-2">
              <div className={`text-2xl font-bold ${
                summary.status_breakdown.approved >= summary.status_breakdown.draft ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {summary.status_breakdown.approved >= summary.status_breakdown.draft ? '✅' : '📝'}
              </div>
              <div className="text-sm font-medium">Aprovação</div>
              <div className="text-xs text-gray-600">
                {summary.status_breakdown.approved >= summary.status_breakdown.draft 
                  ? 'Registros em dia' 
                  : 'Enviar para aprovação'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}