
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessagesSquare, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PortalMessages = () => {
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');

  const messages = [
    {
      id: 1,
      sender: "Dr. Maria Silva",
      role: "Advogada Responsável",
      message: "Olá! Recebi os documentos que você enviou. Vou revisar e te retorno em breve com o parecer.",
      time: "14:30",
      isFromTeam: true
    },
    {
      id: 2,
      sender: "Você",
      role: "Cliente",
      message: "Perfeito! Preciso saber se há algum prazo específico para o processo.",
      time: "14:35",
      isFromTeam: false
    },
    {
      id: 3,
      sender: "Dr. Carlos Santos",
      role: "Advogado Associado",
      message: "O prazo para entrada do recurso é de 15 dias úteis. Já estamos preparando toda a documentação necessária.",
      time: "15:20",
      isFromTeam: true
    },
    {
      id: 4,
      sender: "Você",
      role: "Cliente", 
      message: "Entendi. Vocês precisam de mais algum documento de minha parte?",
      time: "15:25",
      isFromTeam: false
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

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
                <h1 className="text-xl font-bold text-gray-900">Mensagens</h1>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                Chat
              </Button>
              <Button size="sm" variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                Notificações
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="h-[500px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <MessagesSquare className="h-5 w-5" />
              <span>Chat com Equipe Jurídica</span>
              <span className="bg-green-500 w-2 h-2 rounded-full"></span>
              <span className="text-sm text-green-600 font-normal">Online</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col pt-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 p-3 bg-gray-50 rounded-lg">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isFromTeam ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    msg.isFromTeam 
                      ? 'bg-white border border-gray-200' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-3 w-3" />
                      <span className="text-xs font-medium">{msg.sender}</span>
                      <span className="text-xs opacity-70">{msg.time}</span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Message Input */}
            <div className="flex space-x-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Card className="bg-teal-50 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <MessagesSquare className="h-5 w-5 text-teal-600" />
                <div>
                  <h3 className="font-semibold text-teal-900">Chat em Tempo Real</h3>
                  <div className="text-teal-700 text-sm mt-1 space-y-1">
                    <p>• Comunicação direta com advogados e assistentes</p>
                    <p>• Histórico completo de conversas salvo automaticamente</p>
                    <p>• Notificações instantâneas para novas mensagens</p>
                    <p>• Anexar documentos e imagens nas conversas</p>
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

export default PortalMessages;
