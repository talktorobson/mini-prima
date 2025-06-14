
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessagesSquare, User } from 'lucide-react';
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
      // Here you would send the message to your backend
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
              <Button variant="ghost" onClick={() => navigate('/portal')}>
                ← Voltar ao Portal
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                💬 Chat em Tempo Real
              </Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                🔔 Notificações
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessagesSquare className="h-5 w-5" />
              <span>Chat com Equipe Jurídica</span>
              <span className="bg-green-500 w-3 h-3 rounded-full"></span>
              <span className="text-sm text-green-600 font-normal">Online</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isFromTeam ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.isFromTeam 
                      ? 'bg-white border border-gray-200' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-4 w-4" />
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
              <Button onClick={handleSendMessage} className="bg-teal-600 hover:bg-teal-700">
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Card className="bg-teal-50 border-teal-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <MessagesSquare className="h-6 w-6 text-teal-600" />
                <div>
                  <h3 className="font-semibold text-teal-900">Chat em Tempo Real</h3>
                  <p className="text-teal-700 text-sm mt-1">
                    • Comunicação direta com advogados e assistentes
                  </p>
                  <p className="text-teal-700 text-sm">
                    • Histórico completo de conversas salvo automaticamente
                  </p>
                  <p className="text-teal-700 text-sm">
                    • Notificações instantâneas para novas mensagens
                  </p>
                  <p className="text-teal-700 text-sm">
                    • Anexar documentos e imagens nas conversas
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

export default PortalMessages;
