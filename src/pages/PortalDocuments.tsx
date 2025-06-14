
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PortalDocuments = () => {
  const navigate = useNavigate();

  const documents = [
    {
      id: 1,
      name: "Contrato de Prestação de Serviços.pdf",
      type: "Contrato",
      size: "2.4 MB",
      date: "15/06/2024",
      status: "Assinado"
    },
    {
      id: 2,
      name: "Procuração Judicial.pdf",
      type: "Procuração",
      size: "1.8 MB",
      date: "12/06/2024",
      status: "Pendente Assinatura"
    },
    {
      id: 3,
      name: "Relatório Parecer Técnico.pdf",
      type: "Relatório",
      size: "3.2 MB",
      date: "10/06/2024",
      status: "Finalizado"
    },
    {
      id: 4,
      name: "Documentos Identificação.zip",
      type: "Identificação",
      size: "5.1 MB",
      date: "08/06/2024",
      status: "Aprovado"
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
              <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                📥 Download Real
              </Button>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                🔒 Acesso Seguro
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{doc.type}</span>
                        <span>{doc.size}</span>
                        <span>{doc.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      doc.status === 'Assinado' || doc.status === 'Finalizado' || doc.status === 'Aprovado' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status}
                    </span>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Visualizar
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Informações sobre Documentos</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    • Todos os documentos são armazenados com segurança e criptografia
                  </p>
                  <p className="text-blue-700 text-sm">
                    • Downloads são registrados para auditoria e controle
                  </p>
                  <p className="text-blue-700 text-sm">
                    • Visualização online disponível para todos os tipos de arquivo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PortalDocuments;
