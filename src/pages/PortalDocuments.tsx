
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ArrowLeft } from 'lucide-react';
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
              <Button 
                variant="ghost" 
                onClick={() => navigate('/portal')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Portal</span>
              </Button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-bold text-gray-900">Documentos</h1>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                Download
              </Button>
              <Button size="sm" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                Acesso Seguro
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
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
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      doc.status === 'Assinado' || doc.status === 'Finalizado' || doc.status === 'Aprovado' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status}
                    </span>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                        Visualizar
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Informações sobre Documentos</h3>
                  <div className="text-blue-700 text-sm mt-1 space-y-1">
                    <p>• Todos os documentos são armazenados com segurança e criptografia</p>
                    <p>• Downloads são registrados para auditoria e controle</p>
                    <p>• Visualização online disponível para todos os tipos de arquivo</p>
                  </div>
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
