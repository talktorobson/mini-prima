
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessagesSquare, User, ArrowLeft, Send, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesService, clientService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_type: 'client' | 'staff';
  sender_id: string;
  recipient_id?: string;
}

const PortalMessages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  
  // Check if we should show notifications by default
  const showNotifications = location.state?.showNotifications;
  const [isChatActive, setIsChatActive] = useState(!showNotifications);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get current client data
  const { data: client } = useQuery({
    queryKey: ['current-client'],
    queryFn: clientService.getCurrentClient,
    enabled: !!user
  });

  // Get messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', client?.id],
    queryFn: () => messagesService.getMessages(client?.id || ''),
    enabled: !!client?.id
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => 
      messagesService.sendMessage(
        content,
        '550e8400-e29b-41d4-a716-446655440000', // Use proper UUID format
        client?.id || ''
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setNewMessage('');
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso."
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: string) => {
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

    sendMessageMutation.mutate(newMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChatClick = () => {
    setIsChatActive(true);
    const toastResult = toast({
      title: "Chat ativo",
      description: "Você está no modo de chat."
    });

    // Auto-dismiss the toast after 2 seconds
    setTimeout(() => {
      if (toastResult && toastResult.dismiss) {
        toastResult.dismiss();
      }
    }, 2000);
  };

  const handleNotificationsClick = () => {
    setIsChatActive(false);
    const toastResult = toast({
      title: "Notificações",
      description: "Visualizando notificações do sistema."
    });

    // Auto-dismiss the toast after 2 seconds
    setTimeout(() => {
      if (toastResult && toastResult.dismiss) {
        toastResult.dismiss();
      }
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/portal')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Portal</span>
              </Button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-bold text-gray-900">Mensagens</h1>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={handleChatClick}
                className={`${isChatActive 
                  ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <MessagesSquare className="h-4 w-4 mr-1" />
                Chat
              </Button>
              <Button 
                size="sm" 
                onClick={handleNotificationsClick}
                className={`${!isChatActive 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'border-purple-300 text-purple-600 hover:bg-purple-50'
                }`}
                variant={!isChatActive ? "default" : "outline"}
              >
                <Bell className="h-4 w-4 mr-1" />
                Notificações
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {isChatActive ? (
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <MessagesSquare className="h-5 w-5" />
                <span>Chat com Equipe Jurídica</span>
                <span className="bg-green-500 w-2 h-2 rounded-full"></span>
                <span className="text-sm text-green-600 font-normal">Online</span>
                <span className="text-sm text-gray-500">({messages.length} mensagens)</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 mb-4 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-3 p-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_type === 'staff' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          msg.sender_type === 'staff' 
                            ? 'bg-white border border-gray-200 shadow-sm' 
                            : 'bg-blue-600 text-white'
                        }`}>
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs font-medium">
                              {msg.sender_type === 'client' ? (client?.contact_person || 'Você') : 'Equipe Jurídica'}
                            </span>
                            <span className="text-xs opacity-70">{new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
              
              <div className="flex space-x-2 flex-shrink-0 border-t pt-4">
                <Input 
                  placeholder="Digite sua mensagem..." 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyPress={handleKeyPress}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1" 
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-teal-600 hover:bg-teal-700 text-white" 
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Bell className="h-5 w-5" />
                <span>Notificações do Sistema</span>
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">3</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 p-4 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Novo documento disponível</h4>
                        <p className="text-blue-700 text-sm mt-1">Um novo documento foi adicionado ao seu caso #12345.</p>
                        <span className="text-xs text-blue-600">Há 2 horas</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Bell className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Prazo importante</h4>
                        <p className="text-yellow-700 text-sm mt-1">Lembrete: prazo para envio de documentos é amanhã.</p>
                        <span className="text-xs text-yellow-600">Há 1 dia</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Bell className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">Processo atualizado</h4>
                        <p className="text-green-700 text-sm mt-1">Seu processo teve uma atualização de status.</p>
                        <span className="text-xs text-green-600">Há 3 dias</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PortalMessages;
