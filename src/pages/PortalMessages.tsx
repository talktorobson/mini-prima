
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessagesSquare, User, ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  sender: string;
  role: string;
  message: string;
  time: string;
  isFromTeam: boolean;
  timestamp: number;
}

const PortalMessages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clientName = localStorage.getItem('clientName') || 'Cliente';

  // Initialize messages from localStorage or use default
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      const initialMessages: Message[] = [
        {
          id: 1,
          sender: "Dr. Maria Silva",
          role: "Advogada Responsável",
          message: "Olá! Recebi os documentos que você enviou. Vou revisar e te retorno em breve com o parecer.",
          time: "14:30",
          isFromTeam: true,
          timestamp: Date.now() - 3600000
        },
        {
          id: 2,
          sender: clientName,
          role: "Cliente",
          message: "Perfeito! Preciso saber se há algum prazo específico para o processo.",
          time: "14:35",
          isFromTeam: false,
          timestamp: Date.now() - 3300000
        },
        {
          id: 3,
          sender: "Dr. Carlos Santos",
          role: "Advogado Associado",
          message: "O prazo para entrada do recurso é de 15 dias úteis. Já estamos preparando toda a documentação necessária.",
          time: "15:20",
          isFromTeam: true,
          timestamp: Date.now() - 600000
        },
        {
          id: 4,
          sender: clientName,
          role: "Cliente",
          message: "Entendi. Vocês precisam de mais algum documento de minha parte?",
          time: "15:25",
          isFromTeam: false,
          timestamp: Date.now() - 300000
        }
      ];
      setMessages(initialMessages);
      localStorage.setItem('chatMessages', JSON.stringify(initialMessages));
    }
  }, [clientName]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Por favor, digite uma mensagem antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    const timestamp = Date.now();
    const newMsg: Message = {
      id: messages.length + 1,
      sender: clientName,
      role: "Cliente",
      message: newMessage.trim(),
      time: formatTime(timestamp),
      isFromTeam: false,
      timestamp
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');

    // Simulate team response after a delay
    setTimeout(() => {
      simulateTeamResponse(newMsg.message);
    }, 2000 + Math.random() * 3000); // Random delay between 2-5 seconds

    toast({
      title: "Mensagem enviada",
      description: "Sua mensagem foi enviada com sucesso.",
    });

    console.log('Sending message:', newMsg.message);
  };

  const simulateTeamResponse = (userMessage: string) => {
    const teamMembers = [
      { name: "Dr. Maria Silva", role: "Advogada Responsável" },
      { name: "Dr. Carlos Santos", role: "Advogado Associado" },
      { name: "Ana Paula", role: "Assistente Jurídica" }
    ];

    const responses = [
      "Obrigado pela mensagem! Vou verificar e te retorno em breve.",
      "Recebi sua solicitação. Já estou analisando os detalhes.",
      "Perfeito! Vou encaminhar para a equipe responsável.",
      "Entendi sua preocupação. Vamos resolver isso rapidamente.",
      "Muito bem! Vou preparar os documentos necessários.",
      "Obrigado pelo esclarecimento. Isso nos ajuda muito no processo."
    ];

    const randomTeamMember = teamMembers[Math.floor(Math.random() * teamMembers.length)];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const timestamp = Date.now();

    const teamResponse: Message = {
      id: Date.now(), // Use timestamp as unique ID
      sender: randomTeamMember.name,
      role: randomTeamMember.role,
      message: randomResponse,
      time: formatTime(timestamp),
      isFromTeam: true,
      timestamp
    };

    setMessages(prev => [...prev, teamResponse]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
              <span className="text-sm text-gray-500">({messages.length} mensagens)</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col pt-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="space-y-3">
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
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Message Input */}
            <div className="flex space-x-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={false}
              />
              <Button 
                onClick={handleSendMessage} 
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4" />
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
                  <h3 className="font-semibold text-teal-900">Chat Funcional</h3>
                  <div className="text-teal-700 text-sm mt-1 space-y-1">
                    <p>• Envio de mensagens em tempo real</p>
                    <p>• Respostas automáticas da equipe jurídica</p>
                    <p>• Histórico salvo automaticamente no navegador</p>
                    <p>• Scroll automático para novas mensagens</p>
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
