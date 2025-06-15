
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Users,
  Clock,
  Building,
  AlertCircle,
  Plus,
  Reply
} from 'lucide-react';
import { useStaffData } from '@/hooks/useStaffData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  subject?: string;
  sender_type: string;
  sender_id: string;
  recipient_type: string;
  recipient_id: string;
  thread_id: string;
  is_read: boolean;
  created_at: string;
  case_id?: string;
  client?: {
    company_name: string;
    contact_person: string;
  };
  case?: {
    case_title: string;
    case_number: string;
  };
}

const AdminStaffMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const { assignedClients, staffInfo, isStaff, hasAssignedClients } = useStaffData();
  const { toast } = useToast();

  useEffect(() => {
    if (hasAssignedClients) {
      fetchStaffMessages();
    }
  }, [hasAssignedClients, assignedClients]);

  const fetchStaffMessages = async () => {
    try {
      setLoading(true);
      
      const assignedClientIds = assignedClients.map(client => client.id);
      
      // Fetch messages where staff is sender or recipient, and client is from assigned clients
      const { data, error } = await supabase
        .from('portal_messages')
        .select(`
          *,
          client:sender_id (
            company_name,
            contact_person
          ),
          case:cases (
            case_title,
            case_number
          )
        `)
        .or(`sender_id.in.(${assignedClientIds.join(',')}),recipient_id.in.(${assignedClientIds.join(',')})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching staff messages:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mensagens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const groupMessagesByThread = () => {
    const threads: { [key: string]: Message[] } = {};
    
    filteredMessages.forEach(message => {
      if (!threads[message.thread_id]) {
        threads[message.thread_id] = [];
      }
      threads[message.thread_id].push(message);
    });

    // Sort messages within each thread by created_at
    Object.keys(threads).forEach(threadId => {
      threads[threadId].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return threads;
  };

  const filteredMessages = messages.filter(message => {
    const searchContent = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    return searchContent;
  });

  const threadGroups = groupMessagesByThread();
  const selectedThreadMessages = selectedThread ? threadGroups[selectedThread] || [] : [];

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedThread) return;

    try {
      const threadMessages = threadGroups[selectedThread];
      const lastMessage = threadMessages[threadMessages.length - 1];
      
      // Determine recipient based on the last message
      const isLastFromClient = lastMessage.sender_type === 'client';
      const recipientId = isLastFromClient ? lastMessage.sender_id : lastMessage.recipient_id;
      const recipientType = isLastFromClient ? 'client' : 'staff';

      const { error } = await supabase
        .from('portal_messages')
        .insert({
          content: replyMessage,
          sender_type: 'staff',
          sender_id: staffInfo?.staff_id || '',
          recipient_type: recipientType,
          recipient_id: recipientId,
          thread_id: selectedThread,
          case_id: lastMessage.case_id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Resposta enviada com sucesso"
      });

      setReplyMessage('');
      fetchStaffMessages();
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar resposta",
        variant: "destructive"
      });
    }
  };

  const getLatestMessageFromThread = (threadId: string) => {
    const threadMessages = threadGroups[threadId] || [];
    return threadMessages[threadMessages.length - 1];
  };

  const getUnreadCount = (threadId: string) => {
    const threadMessages = threadGroups[threadId] || [];
    return threadMessages.filter(msg => !msg.is_read && msg.sender_type === 'client').length;
  };

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Acesso restrito à equipe.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mensagens</h1>
              <p className="text-sm text-gray-600">
                Comunicação com clientes atribuídos a {staffInfo?.full_name}
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Mensagem
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {!hasAssignedClients ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você não tem clientes atribuídos. Entre em contato com o administrador.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Conversas
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar mensagens..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Carregando...</p>
                    </div>
                  ) : Object.keys(threadGroups).length === 0 ? (
                    <div className="p-6 text-center">
                      <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Nenhuma conversa encontrada</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {Object.keys(threadGroups).map((threadId) => {
                        const latestMessage = getLatestMessageFromThread(threadId);
                        const unreadCount = getUnreadCount(threadId);
                        
                        return (
                          <div
                            key={threadId}
                            className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                              selectedThread === threadId ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => setSelectedThread(threadId)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Building className="h-4 w-4 text-gray-400" />
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    Cliente - Conversa
                                  </p>
                                  {unreadCount > 0 && (
                                    <Badge variant="default" className="bg-red-600">
                                      {unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 truncate mb-1">
                                  {latestMessage.content}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {new Date(latestMessage.created_at).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Message Thread */}
            <div className="lg:col-span-2">
              {selectedThread ? (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Conversa</CardTitle>
                    <CardDescription>
                      {selectedThreadMessages.length} mensagens nesta conversa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col h-96">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {selectedThreadMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_type === 'staff' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_type === 'staff'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_type === 'staff' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    <div className="border-t pt-4">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Digite sua resposta..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          className="flex-1"
                          rows={2}
                        />
                        <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full">
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Selecione uma conversa
                      </h3>
                      <p className="text-gray-600">
                        Escolha uma conversa da lista para visualizar e responder mensagens
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminStaffMessages;
