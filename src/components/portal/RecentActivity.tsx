
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

const RecentActivity: React.FC = () => {
  const activities = [
    {
      id: 1,
      title: 'Novo documento adicionado',
      time: 'Há 2 horas',
      color: 'bg-blue-600'
    },
    {
      id: 2,
      title: 'Processo atualizado',
      time: 'Há 1 dia',
      color: 'bg-green-600'
    },
    {
      id: 3,
      title: 'Nova mensagem recebida',
      time: 'Há 2 dias',
      color: 'bg-purple-600'
    }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Atividade Recente</CardTitle>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-2 h-2 ${activity.color} rounded-full mt-2`}></div>
              <div>
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-gray-600">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
