
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PortalCases = () => {
  const navigate = useNavigate();

  const cases = [
    {
      id: 1,
      title: "Processo Trabalhista #2024-001",
      status: "Em Andamento",
      priority: "Alta",
      progress: 75,
      lastUpdate: "15/06/2024"
    },
    {
      id: 2,
      title: "Revisão Contratual #2024-002",
      status: "Pendente Documentos",
      priority: "Média",
      progress: 40,
      lastUpdate: "12/06/2024"
    },
    {
      id: 3,
      title: "Consultoria Fiscal #2024-003",
      status: "Concluído",
      priority: "Baixa",
      progress: 100,
      lastUpdate: "10/06/2024"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/portal')}>
                ← Voltar ao Portal
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Meus Casos</h1>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                + Filtros Funcionais
              </Button>
              <Button size="sm" variant="outline" className="border-blue-500 text-blue-600">
                📊 Dados Reais
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {cases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{case_.title}</CardTitle>
                    <CardDescription>Última atualização: {case_.lastUpdate}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      case_.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
                      case_.status === 'Pendente Documentos' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {case_.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      case_.priority === 'Alta' ? 'bg-red-100 text-red-800' :
                      case_.priority === 'Média' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {case_.priority}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{case_.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${case_.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <p>• Documentos anexados e revisados</p>
                      <p>• Acompanhamento em tempo real</p>
                      <p>• Histórico completo disponível</p>
                    </div>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <span>Ver Detalhes</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PortalCases;
