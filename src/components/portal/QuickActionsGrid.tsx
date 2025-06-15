
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Scale, 
  MessageSquare, 
  DollarSign, 
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActionsGrid: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Processos',
      description: 'Acompanhe seus casos',
      icon: Scale,
      color: 'text-blue-600',
      route: '/portal/cases'
    },
    {
      title: 'Documentos',
      description: 'Acesse seus arquivos',
      icon: FileText,
      color: 'text-green-600',
      route: '/portal/documents'
    },
    {
      title: 'Mensagens',
      description: 'Comunicações',
      icon: MessageSquare,
      color: 'text-purple-600',
      route: '/portal/messages'
    },
    {
      title: 'Financeiro',
      description: 'Faturas e pagamentos',
      icon: DollarSign,
      color: 'text-yellow-600',
      route: '/portal/financial'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {quickActions.map((action) => {
        const IconComponent = action.icon;
        return (
          <Card 
            key={action.title}
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => navigate(action.route)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <IconComponent className={`h-8 w-8 ${action.color} mb-2`} />
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuickActionsGrid;
