
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';

const QuickStats: React.FC = () => {
  const stats = [
    {
      label: 'Processos Ativos',
      value: '3'
    },
    {
      label: 'Documentos Pendentes',
      value: '2'
    },
    {
      label: 'Mensagens Não Lidas',
      value: '1'
    },
    {
      label: 'Próxima Audiência',
      value: '22/06'
    }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Resumo</CardTitle>
        <Scale className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <span className="text-sm font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStats;
