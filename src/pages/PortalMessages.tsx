
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MessagesSquare, User, ArrowLeft, Send, Bell, Search, RefreshCw, BarChart3, Filter, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesService, clientService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import PortalNotificationList from "@/components/PortalNotificationList";
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_type: 'client' | 'staff';
  sender_id: string;
  recipient_id?: string;
  is_read?: boolean;
  read_at?: string;
  attachments?: MessageAttachment[] | null;
}

interface MessageAttachment {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  file_url: string;
  uploaded_at: string;
}

const PortalMessages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    dateFrom: '',
    dateTo: '',
    messageType: '', // 'sent' | 'received' | ''
    isRead: '', // 'read' | 'unread' | ''
  });
  const [isTyping, setIsTyping] = useState(false);
  const [staffTyping, setStaffTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesPerPage = 20;
  
  // Check if we should show notifications by default
  const showNotifications = location.state?.showNotifications;
  const [isChatActive, setIsChatActive] = useState(!showNotifications);

  // Helper function to highlight search terms in message content
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </span>
      ) : part
    );
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!client?.id) return;

    console.log('Setting up real-time subscription for client:', client.id);

    const channel = supabase
      .channel('portal_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_messages',
          filter: `sender_id=eq.${client.id}`
        },
        (payload) => {
          console.log('Real-time message update (sent):', payload);
          queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_messages',
          filter: `recipient_id=eq.${client.id}`
        },
        (payload) => {
          console.log('Real-time message update (received):', payload);
          queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [client?.id, queryClient]);

  // Set up typing indicator subscription
  useEffect(() => {
    if (!client?.id || !assignedStaff) return;

    console.log('Setting up typing indicator subscription');

    const typingChannel = supabase
      .channel('typing_indicators')
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          console.log('Received typing broadcast:', payload);
          
          const { senderId, isTyping: typing } = payload.payload;
          
          // If the typing sender is the assigned staff, update staff typing status
          if (senderId === assignedStaff) {
            setStaffTyping(typing);
            
            // Auto-hide typing indicator after 3 seconds
            if (typing) {
              setTimeout(() => setStaffTyping(false), 3000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up typing indicator subscription');
      supabase.removeChannel(typingChannel);
    };
  }, [client?.id, assignedStaff]);

  // Get current client data
  const { data: client } = useQuery({
    queryKey: ['current-client'],
    queryFn: clientService.getCurrentClient,
    enabled: !!user
  });

  // Get assigned staff for this client
  const { data: assignedStaff } = useQuery({
    queryKey: ['assigned-staff', client?.id],
    queryFn: async () => {
      if (!client?.id) return null;
      
      console.log('Getting assigned staff for client:', client.id);
      
      // First try to get primary lawyer from client record
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('primary_lawyer')
        .eq('id', client.id)
        .single();
        
      if (clientError) {
        console.error('Error fetching client primary lawyer:', clientError);
      }
      
      if (clientData?.primary_lawyer) {
        console.log('Found primary lawyer:', clientData.primary_lawyer);
        return clientData.primary_lawyer;
      }
      
      // Fallback: get first active staff assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('staff_client_assignments')
        .select('staff_id')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .order('assigned_at', { ascending: true })
        .limit(1)
        .single();
        
      if (assignmentError) {
        console.error('Error fetching staff assignment:', assignmentError);
      }
      
      console.log('Found assigned staff:', assignment?.staff_id || 'No assignment found');
      return assignment?.staff_id || null;
    },
    enabled: !!client?.id
  });

  // Get initial messages with pagination
  const { data: initialMessagesData, isLoading } = useQuery({
    queryKey: ['messages', currentPage, client?.id],
    queryFn: async () => {
      if (!client?.id) return null;
      return messagesService.getPaginatedMessages(0, messagesPerPage, client.id);
    },
    enabled: !!client?.id,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Update allMessages when initial data loads
  useEffect(() => {
    if (initialMessagesData?.messages) {
      setAllMessages(initialMessagesData.messages);
      setHasMoreMessages(initialMessagesData.hasMore);
      setCurrentPage(0);
    }
  }, [initialMessagesData]);

  // Load more messages function
  const loadMoreMessages = async () => {
    if (!client?.id || isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const moreData = await messagesService.getPaginatedMessages(nextPage, messagesPerPage, client.id);
      
      if (moreData.messages.length > 0) {
        setAllMessages(prev => [...prev, ...moreData.messages]);
        setCurrentPage(nextPage);
        setHasMoreMessages(moreData.hasMore);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar mais mensagens.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Enhanced message filtering with advanced search
  const filteredMessages = allMessages.filter(message => {
    // Text search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const contentMatch = message.content.toLowerCase().includes(searchLower);
      if (!contentMatch) return false;
    }
    
    // Date range filter
    if (searchFilters.dateFrom) {
      const messageDate = new Date(message.created_at);
      const fromDate = new Date(searchFilters.dateFrom);
      if (messageDate < fromDate) return false;
    }
    
    if (searchFilters.dateTo) {
      const messageDate = new Date(message.created_at);
      const toDate = new Date(searchFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (messageDate > toDate) return false;
    }
    
    // Message type filter (sent/received)
    if (searchFilters.messageType) {
      const isSent = message.sender_type === 'client' && message.sender_id === client?.id;
      const isReceived = message.sender_type === 'staff' && message.recipient_id === client?.id;
      
      if (searchFilters.messageType === 'sent' && !isSent) return false;
      if (searchFilters.messageType === 'received' && !isReceived) return false;
    }
    
    // Read status filter
    if (searchFilters.isRead) {
      if (searchFilters.isRead === 'read' && !message.is_read) return false;
      if (searchFilters.isRead === 'unread' && message.is_read) return false;
    }
    
    return true;
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!assignedStaff) {
        throw new Error('Nenhum advogado atribuído a este cliente. Entre em contato com o escritório.');
      }
      
      console.log('Sending message to assigned staff:', assignedStaff);
      return messagesService.sendMessage(
        content,
        assignedStaff,
        client?.id || ''
      );
    },
    onSuccess: (newMessage) => {
      // Create a decrypted version for immediate UI display
      const displayMessage = {
        ...newMessage,
        content: newMessage.content // Content is already in plain text in the UI context
      };
      
      // Add the new message to the local state for immediate UI update
      if (newMessage) {
        setAllMessages(prev => [displayMessage, ...prev]);
      }
      
      // Invalidate queries to refresh data
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
  }, [filteredMessages]);

  // Mark messages as read when viewing them
  useEffect(() => {
    if (!client?.id || !isChatActive) return;
    
    const markMessagesAsRead = async () => {
      // Get unread messages sent to this client
      const unreadMessages = filteredMessages.filter(msg => 
        msg.recipient_id === client.id && 
        msg.sender_type === 'staff' && 
        !msg.is_read
      );
      
      if (unreadMessages.length > 0) {
        console.log('Marking messages as read for client:', client.id);
        // Mark all unread messages as read
        for (const message of unreadMessages) {
          try {
            await messagesService.markMessageAsRead(message.id);
          } catch (error) {
            console.error('Error marking message as read:', message.id, error);
          }
        }
        // Refresh messages to show updated read status
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      }
    };

    // Debounce the marking of messages as read
    const timer = setTimeout(markMessagesAsRead, 1000);
    return () => clearTimeout(timer);
  }, [filteredMessages, client?.id, isChatActive, queryClient]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Handle typing indicators
    if (value.trim() && !isTyping && assignedStaff && client?.id) {
      setIsTyping(true);
      // Broadcast typing status with proper thread ID
      // First get or create thread ID for this conversation
      messagesService.getOrCreateThreadId(client.id, assignedStaff)
        .then(threadId => {
          messagesService.broadcastTyping(client.id, assignedStaff, threadId, true)
            .catch(error => console.error('Error broadcasting typing:', error));
        })
        .catch(error => console.error('Error getting thread ID:', error));
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && assignedStaff && client?.id) {
        setIsTyping(false);
        messagesService.getOrCreateThreadId(client.id, assignedStaff)
          .then(threadId => {
            messagesService.broadcastTyping(client.id, assignedStaff, threadId, false)
              .catch(error => console.error('Error stopping typing broadcast:', error));
          })
          .catch(error => console.error('Error getting thread ID for stop typing:', error));
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
      
      // Stop typing indicator
      if (isTyping && assignedStaff && client?.id) {
        setIsTyping(false);
        messagesService.getOrCreateThreadId(client.id, assignedStaff)
          .then(threadId => {
            messagesService.broadcastTyping(client.id, assignedStaff, threadId, false)
              .catch(error => console.error('Error stopping typing on send:', error));
          })
          .catch(error => console.error('Error getting thread ID for send stop typing:', error));
      }
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

  // New function to handle message notification clicks
  const handleMessageNotificationClick = () => {
    console.log('Message notification clicked - switching to chat mode');
    setIsChatActive(true);
  };

  // Fetch notifications for this client
  const { data: notifications = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ["portal-notifications", client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      // Load from Supabase (now use supabase from import, not window.supabase)
      const { data, error } = await supabase
        .from("portal_notifications")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
      // SAFELY coerce metadata to be an object, as expected by Notification[]
      return (data ?? []).map((notif) => ({
        ...notif,
        metadata:
          typeof notif.metadata === "object" && notif.metadata !== null
            ? notif.metadata
            : {},
      }));
    },
    enabled: !!client?.id && !isChatActive,
  });

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
                {assignedStaff ? (
                  <>
                    <span className="bg-green-500 w-2 h-2 rounded-full"></span>
                    <span className="text-sm text-green-600 font-normal">Online</span>
                  </>
                ) : (
                  <>
                    <span className="bg-yellow-500 w-2 h-2 rounded-full"></span>
                    <span className="text-sm text-yellow-600 font-normal">Aguardando atribuição</span>
                  </>
                )}
                <span className="text-sm text-gray-500">
                  ({filteredMessages.length} mensagens
                  {(searchTerm.trim() || Object.values(searchFilters).some(v => v)) ? ` (${allMessages.length} total)` : ''})
                </span>
                {Object.values(searchFilters).some(v => v) && (
                  <div className="flex items-center gap-1 ml-2">
                    <Filter className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-600">Filtros ativos</span>
                  </div>
                )}
              </CardTitle>
              
              {/* Search Input */}
              <div className="space-y-3 mt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar mensagens..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Filter className="h-3 w-3" />
                    Filtros
                    {showAdvancedSearch ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </div>

                {/* Advanced Search Filters */}
                {showAdvancedSearch && (
                  <div className="bg-gray-50 p-3 rounded-md border space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Date Range */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Período</Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label htmlFor="dateFrom" className="text-xs text-gray-600">De:</Label>
                            <Input
                              id="dateFrom"
                              type="date"
                              value={searchFilters.dateFrom}
                              onChange={(e) => setSearchFilters(prev => ({...prev, dateFrom: e.target.value}))}
                              className="text-xs"
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="dateTo" className="text-xs text-gray-600">Até:</Label>
                            <Input
                              id="dateTo"
                              type="date"
                              value={searchFilters.dateTo}
                              onChange={(e) => setSearchFilters(prev => ({...prev, dateTo: e.target.value}))}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Message Type */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Tipo de Mensagem</Label>
                        <Select
                          value={searchFilters.messageType}
                          onValueChange={(value) => setSearchFilters(prev => ({...prev, messageType: value}))}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Todas as mensagens" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todas as mensagens</SelectItem>
                            <SelectItem value="sent">Mensagens enviadas</SelectItem>
                            <SelectItem value="received">Mensagens recebidas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Read Status */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Status de Leitura</Label>
                        <Select
                          value={searchFilters.isRead}
                          onValueChange={(value) => setSearchFilters(prev => ({...prev, isRead: value}))}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Todas as mensagens" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todas as mensagens</SelectItem>
                            <SelectItem value="read">Mensagens lidas</SelectItem>
                            <SelectItem value="unread">Mensagens não lidas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Clear Filters */}
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setSearchFilters({
                              dateFrom: '',
                              dateTo: '',
                              messageType: '',
                              isRead: '',
                            });
                          }}
                          className="text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Limpar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 mb-4 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-3 p-3">
                    {filteredMessages.length === 0 && (searchTerm.trim() || Object.values(searchFilters).some(v => v)) ? (
                      <div className="text-center py-8">
                        <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {searchTerm.trim() 
                            ? `Nenhuma mensagem encontrada para "${searchTerm}"` 
                            : 'Nenhuma mensagem encontrada com os filtros aplicados'
                          }
                        </p>
                        <div className="flex gap-2 justify-center mt-2">
                          {searchTerm.trim() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSearchTerm('')}
                            >
                              Limpar busca
                            </Button>
                          )}
                          {Object.values(searchFilters).some(v => v) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSearchFilters({
                                dateFrom: '',
                                dateTo: '',
                                messageType: '',
                                isRead: '',
                              })}
                            >
                              Limpar filtros
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      filteredMessages.map((msg) => (
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
                            {msg.sender_type === 'client' && (
                              <span className={`text-xs ml-2 ${
                                msg.is_read ? 'text-blue-400' : 'text-gray-400'
                              }`}>
                                {msg.is_read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm">{highlightSearchTerm(msg.content, searchTerm)}</p>
                          {msg.is_read && msg.read_at && msg.sender_type === 'client' && (
                            <p className="text-xs text-blue-300 mt-1">
                              Lida em {new Date(msg.read_at).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Load More Messages Button */}
                  {hasMoreMessages && !searchTerm.trim() && (
                    <div className="text-center py-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadMoreMessages}
                        disabled={isLoadingMore}
                        className="text-xs"
                      >
                        {isLoadingMore ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Carregar mais mensagens
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </div>
              
              {/* Typing Indicator */}
              {staffTyping && (
                <div className="px-3 py-2 text-xs text-gray-500 italic">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>Equipe Jurídica está digitando...</span>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2 flex-shrink-0 border-t pt-4">
                <Input 
                  placeholder="Digite sua mensagem..." 
                  value={newMessage} 
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1" 
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-teal-600 hover:bg-teal-700 text-white" 
                  disabled={!newMessage.trim() || sendMessageMutation.isPending || !assignedStaff}
                  title={!assignedStaff ? 'Nenhum advogado atribuído a este cliente' : ''}
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
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">{notifications.length}</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 p-4 overflow-hidden">
              {loadingNotifications ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <PortalNotificationList 
                  notifications={notifications} 
                  onMessageNotificationClick={handleMessageNotificationClick}
                />
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PortalMessages;
