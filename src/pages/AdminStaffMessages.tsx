
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Users,
  Clock,
  Building,
  AlertCircle,
  Plus,
  Reply,
  Filter,
  Download,
  Eye,
  Paperclip,
  FileText,
  X,
  Upload
} from 'lucide-react';
import { useStaffData } from '@/hooks/useStaffData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { encryptMessage, decryptMessages } from '@/services/encryptionService';

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
  read_at?: string;
  created_at: string;
  case_id?: string;
  attachments?: MessageAttachment[] | null;
  client?: {
    company_name: string;
    contact_person: string;
  };
  case?: {
    case_title: string;
    case_number: string;
  };
}

interface MessageAttachment {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  file_url: string;
  uploaded_at: string;
}

const AdminStaffMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [clientTyping, setClientTyping] = useState<{[key: string]: boolean}>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [newMessageForm, setNewMessageForm] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    case_id: ''
  });
  
  // Advanced search states
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // File attachment states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newMessageFiles, setNewMessageFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newMessageFileInputRef = useRef<HTMLInputElement>(null);
  const { assignedClients, staffInfo, isStaff, hasAssignedClients } = useStaffData();
  const { toast } = useToast();

  useEffect(() => {
    if (hasAssignedClients) {
      fetchStaffMessages();
    }
  }, [hasAssignedClients, assignedClients]);

  // Set up real-time subscription for staff messages
  useEffect(() => {
    if (!hasAssignedClients || assignedClients.length === 0) return;

    console.log('Setting up real-time subscription for staff messages');

    const assignedClientIds = assignedClients.map(client => client.id);
    
    const channel = supabase
      .channel('staff_portal_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_messages'
        },
        (payload) => {
          console.log('Real-time staff message update:', payload);
          
          // Check if the message involves any of the assigned clients
          const newMessage = payload.new as any;
          const oldMessage = payload.old as any;
          
          const isRelevant = (msg: any) => {
            return msg && (
              assignedClientIds.includes(msg.sender_id) || 
              assignedClientIds.includes(msg.recipient_id) ||
              msg.recipient_id === staffInfo?.id ||
              msg.sender_id === staffInfo?.id
            );
          };
          
          if (isRelevant(newMessage) || isRelevant(oldMessage)) {
            fetchStaffMessages();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up staff real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [hasAssignedClients, assignedClients, staffInfo?.id]);

  // Set up typing indicator subscription for staff
  useEffect(() => {
    if (!hasAssignedClients || !staffInfo?.staff_id) return;

    console.log('Setting up staff typing indicator subscription');

    const typingChannel = supabase
      .channel('staff_typing_indicators')
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          console.log('Staff received typing broadcast:', payload);
          
          const { senderId, recipientId, isTyping: typing, threadId } = payload.payload;
          
          // If the typing sender is one of our assigned clients
          const assignedClientIds = assignedClients.map(client => client.id);
          if (assignedClientIds.includes(senderId) && recipientId === staffInfo.staff_id) {
            setClientTyping(prev => ({
              ...prev,
              [threadId]: typing
            }));
            
            // Auto-hide typing indicator after 3 seconds
            if (typing) {
              setTimeout(() => {
                setClientTyping(prev => ({
                  ...prev,
                  [threadId]: false
                }));
              }, 3000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up staff typing indicator subscription');
      supabase.removeChannel(typingChannel);
    };
  }, [hasAssignedClients, assignedClients, staffInfo?.staff_id]);

  const fetchStaffMessages = async () => {
    try {
      setLoading(true);
      
      const assignedClientIds = assignedClients.map(client => client.id);
      
      // Fetch messages where staff is sender or recipient, and client is from assigned clients
      const { data, error } = await supabase
        .from('portal_messages')
        .select(`
          *,
          client:sender_id!portal_messages_sender_id_fkey (
            company_name,
            contact_person
          ),
          case:cases!portal_messages_case_id_fkey (
            case_title,
            case_number
          )
        `)
        .or(`sender_id.in.(${assignedClientIds.join(',')}),recipient_id.in.(${assignedClientIds.join(',')})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: Message[] = (data || []).map(message => ({
        ...message,
        client: Array.isArray(message.client) ? message.client[0] : message.client,
        case: Array.isArray(message.case) ? message.case[0] : message.case
      }));
      
      // Decrypt message contents for legal confidentiality
      if (transformedData.length > 0) {
        console.log('Decrypting staff messages...');
        const decryptedMessages = await decryptMessages(
          transformedData.map(msg => ({ id: msg.id, content: msg.content }))
        );
        
        const finalMessages = transformedData.map(msg => {
          const decrypted = decryptedMessages.find(d => d.id === msg.id);
          return {
            ...msg,
            content: decrypted?.content || msg.content
          };
        });
        
        setMessages(finalMessages);
      } else {
        setMessages(transformedData);
      }
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
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const searchContent = message.content.toLowerCase().includes(searchLower) ||
                         (message.subject && message.subject.toLowerCase().includes(searchLower)) ||
                         (message.client?.company_name && message.client.company_name.toLowerCase().includes(searchLower)) ||
                         (message.client?.contact_person && message.client.contact_person.toLowerCase().includes(searchLower)) ||
                         (message.case?.case_title && message.case.case_title.toLowerCase().includes(searchLower)) ||
                         (message.case?.case_number && message.case.case_number.toLowerCase().includes(searchLower));
    return searchContent;
  });

  // Advanced message search function
  const handleAdvancedMessageSearch = async () => {
    setIsSearching(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let filtered = messages;
      
      // Apply search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(message => 
          message.content.toLowerCase().includes(query) ||
          (message.subject && message.subject.toLowerCase().includes(query)) ||
          (message.client?.company_name && message.client.company_name.toLowerCase().includes(query)) ||
          (message.client?.contact_person && message.client.contact_person.toLowerCase().includes(query)) ||
          (message.case?.case_title && message.case.case_title.toLowerCase().includes(query)) ||
          (message.case?.case_number && message.case.case_number.toLowerCase().includes(query))
        );
      }
      
      // Apply client filter
      if (clientFilter) {
        filtered = filtered.filter(message => 
          message.client?.company_name === clientFilter ||
          message.sender_id === clientFilter ||
          message.recipient_id === clientFilter
        );
      }
      
      // Apply status filter
      if (statusFilter) {
        switch (statusFilter) {
          case 'read':
            filtered = filtered.filter(message => message.is_read);
            break;
          case 'unread':
            filtered = filtered.filter(message => !message.is_read);
            break;
          case 'from_client':
            filtered = filtered.filter(message => message.sender_type === 'client');
            break;
          case 'from_staff':
            filtered = filtered.filter(message => message.sender_type === 'staff');
            break;
        }
      }
      
      // Apply date filter
      if (dateFilter) {
        const now = new Date();
        let dateThreshold: Date;
        
        switch (dateFilter) {
          case 'today':
            dateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateThreshold = new Date(0);
        }
        
        filtered = filtered.filter(message => 
          new Date(message.created_at) >= dateThreshold
        );
      }
      
      setSearchResults(filtered);
      
      toast({
        title: 'Busca concluída',
        description: `${filtered.length} mensagens encontradas.`,
      });
      
    } catch (error) {
      console.error('Error searching messages:', error);
      toast({
        title: 'Erro na busca',
        description: 'Erro ao pesquisar mensagens. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search filters
  const clearAdvancedFilters = () => {
    setSearchQuery('');
    setClientFilter('');
    setStatusFilter('');
    setDateFilter('');
    setSearchResults([]);
  };

  // File upload utility functions
  const uploadFileToStorage = async (file: File, folder: string = 'message-attachments'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isNewMessage: boolean = false) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede o limite de 10MB`,
          variant: 'destructive'
        });
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Tipo de arquivo não suportado',
          description: `${file.name} não é um tipo de arquivo permitido`,
          variant: 'destructive'
        });
        return false;
      }
      
      return true;
    });

    if (isNewMessage) {
      setNewMessageFiles(prev => [...prev, ...validFiles]);
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number, isNewMessage: boolean = false) => {
    if (isNewMessage) {
      setNewMessageFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Component to render message attachments
  const renderAttachments = (attachments: MessageAttachment[] | null | undefined) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(attachment.file_url, '_blank')}
            >
              <Download className="h-3 w-3 mr-1" />
              Baixar
            </Button>
          </div>
        ))}
      </div>
    );
  };

  // Component to render file upload interface
  const renderFileUpload = (files: File[], onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void, onRemoveFile: (index: number) => void, inputRef: React.RefObject<HTMLInputElement>) => {
    return (
      <div className="space-y-2">
        <input
          type="file"
          ref={inputRef}
          onChange={onFileSelect}
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
          className="hidden"
        />
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploadingFiles}
          >
            <Paperclip className="h-4 w-4 mr-1" />
            Anexar Arquivo
          </Button>
          
          {files.length > 0 && (
            <span className="text-xs text-gray-500">
              {files.length} arquivo(s) selecionado(s)
            </span>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const threadGroups = groupMessagesByThread();
  const selectedThreadMessages = selectedThread ? threadGroups[selectedThread] || [] : [];

  // Mark messages as read when thread is selected
  useEffect(() => {
    if (!selectedThread || !staffInfo?.staff_id) return;
    
    const markThreadAsRead = async () => {
      try {
        // Get unread messages in this thread where staff is the recipient
        const unreadMessages = selectedThreadMessages.filter(msg => 
          msg.recipient_id === staffInfo.staff_id && 
          msg.sender_type === 'client' && 
          !msg.is_read
        );
        
        if (unreadMessages.length > 0) {
          console.log('Marking staff thread messages as read:', selectedThread);
          // Mark messages as read
          for (const message of unreadMessages) {
            await supabase
              .from('portal_messages')
              .update({
                is_read: true,
                read_at: new Date().toISOString()
              })
              .eq('id', message.id);
          }
          // Refresh messages
          fetchStaffMessages();
        }
      } catch (error) {
        console.error('Error marking thread as read:', error);
      }
    };

    // Debounce the read marking
    const timer = setTimeout(markThreadAsRead, 1000);
    return () => clearTimeout(timer);
  }, [selectedThread, selectedThreadMessages, staffInfo?.staff_id]);

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedThread) return;

    try {
      setUploadingFiles(true);
      const threadMessages = threadGroups[selectedThread];
      const lastMessage = threadMessages[threadMessages.length - 1];
      
      // Determine recipient based on the last message
      const isLastFromClient = lastMessage.sender_type === 'client';
      const recipientId = isLastFromClient ? lastMessage.sender_id : lastMessage.recipient_id;
      const recipientType = isLastFromClient ? 'client' : 'staff';

      // Upload files if any
      let attachments: MessageAttachment[] = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const fileUrl = await uploadFileToStorage(file, 'message-attachments');
          return {
            id: crypto.randomUUID(),
            filename: file.name,
            file_size: file.size,
            file_type: file.type,
            file_url: fileUrl,
            uploaded_at: new Date().toISOString()
          };
        });
        
        attachments = await Promise.all(uploadPromises);
      }

      // Encrypt message content for legal confidentiality
      const encryptedContent = await encryptMessage(replyMessage);
      
      const { error } = await supabase
        .from('portal_messages')
        .insert({
          content: encryptedContent,
          sender_type: 'staff',
          sender_id: staffInfo?.staff_id || '',
          recipient_type: recipientType,
          recipient_id: recipientId,
          thread_id: selectedThread,
          case_id: lastMessage.case_id,
          attachments: attachments.length > 0 ? attachments : null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: attachments.length > 0 
          ? `Resposta enviada com ${attachments.length} anexo(s)`
          : "Resposta enviada com sucesso"
      });

      setReplyMessage('');
      setSelectedFiles([]);
      fetchStaffMessages();
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar resposta",
        variant: "destructive"
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessageForm.recipient_id || !newMessageForm.content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um destinatário e digite uma mensagem",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingFiles(true);
      
      // Check for existing conversation thread between staff and client
      const { data: existingThread, error: threadError } = await supabase
        .from('portal_messages')
        .select('thread_id')
        .or(`and(sender_id.eq.${staffInfo?.staff_id},recipient_id.eq.${newMessageForm.recipient_id}),and(sender_id.eq.${newMessageForm.recipient_id},recipient_id.eq.${staffInfo?.staff_id})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let threadId: string;
      
      if (threadError) {
        console.error('Error checking existing thread:', threadError);
        // On error, create new thread as fallback
        threadId = crypto.randomUUID();
        console.log('Error fetching thread, creating new one:', threadId);
      } else if (existingThread?.thread_id) {
        // Use existing thread
        threadId = existingThread.thread_id;
        console.log('Using existing thread:', threadId);
      } else {
        // Create new thread - no existing conversation found
        threadId = crypto.randomUUID();
        console.log('No existing thread found, creating new thread:', threadId);
      }

      // Upload files if any
      let attachments: MessageAttachment[] = [];
      if (newMessageFiles.length > 0) {
        const uploadPromises = newMessageFiles.map(async (file) => {
          const fileUrl = await uploadFileToStorage(file, 'message-attachments');
          return {
            id: crypto.randomUUID(),
            filename: file.name,
            file_size: file.size,
            file_type: file.type,
            file_url: fileUrl,
            uploaded_at: new Date().toISOString()
          };
        });
        
        attachments = await Promise.all(uploadPromises);
      }

      // Encrypt message content for legal confidentiality
      const encryptedContent = await encryptMessage(newMessageForm.content);
      
      const { error } = await supabase
        .from('portal_messages')
        .insert({
          content: encryptedContent,
          subject: newMessageForm.subject || undefined,
          sender_type: 'staff',
          sender_id: staffInfo?.staff_id || '',
          recipient_type: 'client',
          recipient_id: newMessageForm.recipient_id,
          thread_id: threadId,
          case_id: newMessageForm.case_id || undefined,
          attachments: attachments.length > 0 ? attachments : null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: attachments.length > 0 
          ? `Nova mensagem enviada com ${attachments.length} anexo(s)`
          : "Nova mensagem enviada com sucesso"
      });

      setNewMessageForm({
        recipient_id: '',
        subject: '',
        content: '',
        case_id: ''
      });
      setNewMessageFiles([]);
      setShowNewMessageDialog(false);
      fetchStaffMessages();
    } catch (error: any) {
      console.error('Error sending new message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      });
    } finally {
      setUploadingFiles(false);
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

  const handleReplyInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setReplyMessage(value);
    
    // Handle typing indicators for reply
    if (value.trim() && !isTyping && selectedThread && staffInfo?.staff_id) {
      setIsTyping(true);
      
      // Get recipient from selected thread
      const threadMessages = threadGroups[selectedThread];
      if (threadMessages && threadMessages.length > 0) {
        const lastMessage = threadMessages[threadMessages.length - 1];
        const recipientId = lastMessage.sender_type === 'client' ? lastMessage.sender_id : lastMessage.recipient_id;
        
        // Broadcast typing status
        supabase.channel(`typing_${selectedThread}`)
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              senderId: staffInfo.staff_id,
              recipientId,
              threadId: selectedThread,
              isTyping: true,
              timestamp: new Date().toISOString()
            }
          })
          .catch(error => console.error('Error broadcasting staff typing:', error));
      }
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && selectedThread && staffInfo?.staff_id) {
        setIsTyping(false);
        
        const threadMessages = threadGroups[selectedThread];
        if (threadMessages && threadMessages.length > 0) {
          const lastMessage = threadMessages[threadMessages.length - 1];
          const recipientId = lastMessage.sender_type === 'client' ? lastMessage.sender_id : lastMessage.recipient_id;
          
          supabase.channel(`typing_${selectedThread}`)
            .send({
              type: 'broadcast',
              event: 'typing',
              payload: {
                senderId: staffInfo.staff_id,
                recipientId,
                threadId: selectedThread,
                isTyping: false,
                timestamp: new Date().toISOString()
              }
            })
            .catch(error => console.error('Error stopping staff typing broadcast:', error));
        }
      }
    }, 1000);
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
            <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Mensagem
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova Mensagem</DialogTitle>
                  <DialogDescription>
                    Envie uma mensagem para um dos seus clientes atribuídos
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipient">Destinatário</Label>
                    <Select value={newMessageForm.recipient_id} onValueChange={(value) => setNewMessageForm({...newMessageForm, recipient_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignedClients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name} - {client.contact_person}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Assunto (opcional)</Label>
                    <Input
                      id="subject"
                      value={newMessageForm.subject}
                      onChange={(e) => setNewMessageForm({...newMessageForm, subject: e.target.value})}
                      placeholder="Assunto da mensagem"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Mensagem</Label>
                    <Textarea
                      id="content"
                      value={newMessageForm.content}
                      onChange={(e) => setNewMessageForm({...newMessageForm, content: e.target.value})}
                      placeholder="Digite sua mensagem aqui..."
                      rows={4}
                    />
                  </div>

                  {/* File Upload for New Message */}
                  <div>
                    <Label>Anexos</Label>
                    {renderFileUpload(
                      newMessageFiles,
                      (e) => handleFileSelect(e, true),
                      (index) => removeFile(index, true),
                      newMessageFileInputRef
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewMessageDialog(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSendNewMessage}
                      disabled={uploadingFiles}
                    >
                      {uploadingFiles ? (
                        <>
                          <Upload className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
          <Tabs defaultValue="messages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Mensagens
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Busca Avançada
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-6">
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
                      placeholder="Buscar por conteúdo, cliente, caso ou assunto..."
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
                      {searchTerm.trim() ? (
                        <>
                          <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Nenhuma conversa encontrada para "{searchTerm}"</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => setSearchTerm('')}
                          >
                            Limpar busca
                          </Button>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Nenhuma conversa encontrada</p>
                        </>
                      )}
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
                            <div className="space-y-2">
                              <p className="text-sm">{message.content}</p>
                              {renderAttachments(message.attachments)}
                            </div>
                            <div className="flex justify-between items-end mt-2">
                              <span className="text-xs opacity-70">
                                {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {message.sender_type === 'staff' && (
                                <span className={`text-xs ${
                                  message.is_read ? 'text-blue-200' : 'text-gray-300'
                                }`}>
                                  {message.is_read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                            <p className={`text-xs ${
                              message.sender_type === 'staff' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.created_at).toLocaleString('pt-BR')}
                              {message.is_read && message.read_at && message.sender_type === 'staff' && (
                                <span className="ml-2">
                                  • Lida em {new Date(message.read_at).toLocaleString('pt-BR')}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Typing Indicator */}
                    {selectedThread && clientTyping[selectedThread] && (
                      <div className="px-3 py-2 text-xs text-gray-500 italic border-t">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span>Cliente está digitando...</span>
                        </div>
                      </div>
                    )}

                    {/* Reply Form */}
                    <div className="border-t pt-4 space-y-3">
                      {/* File Upload */}
                      {renderFileUpload(
                        selectedFiles,
                        (e) => handleFileSelect(e, false),
                        (index) => removeFile(index, false),
                        fileInputRef
                      )}
                      
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Digite sua resposta..."
                          value={replyMessage}
                          onChange={handleReplyInputChange}
                          className="flex-1"
                          rows={2}
                        />
                        <Button 
                          onClick={handleSendReply} 
                          disabled={!replyMessage.trim() || uploadingFiles}
                        >
                          {uploadingFiles ? (
                            <Upload className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
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
            </TabsContent>

            {/* Advanced Search Tab */}
            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Busca Avançada de Mensagens
                  </CardTitle>
                  <CardDescription>
                    Pesquise e filtre mensagens por conteúdo, cliente, status e data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="message_search_query">Buscar Conteúdo</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="message_search_query"
                          placeholder="Conteúdo, assunto, caso..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="client_filter">Cliente</Label>
                      <Select value={clientFilter} onValueChange={setClientFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os clientes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os clientes</SelectItem>
                          {assignedClients.map((client) => (
                            <SelectItem key={client.id} value={client.company_name}>
                              {client.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="status_filter">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os status</SelectItem>
                          <SelectItem value="read">Lidas</SelectItem>
                          <SelectItem value="unread">Não lidas</SelectItem>
                          <SelectItem value="from_client">De clientes</SelectItem>
                          <SelectItem value="from_staff">Da equipe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="date_filter">Período</Label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os períodos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os períodos</SelectItem>
                          <SelectItem value="today">Hoje</SelectItem>
                          <SelectItem value="week">Última semana</SelectItem>
                          <SelectItem value="month">Último mês</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button onClick={handleAdvancedMessageSearch} disabled={isSearching}>
                      <Search className="h-4 w-4 mr-2" />
                      {isSearching ? 'Buscando...' : 'Buscar'}
                    </Button>
                    <Button variant="outline" onClick={clearAdvancedFilters}>
                      <Filter className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resultados da Busca ({searchResults.length})</CardTitle>
                    <CardDescription>
                      Mensagens encontradas com base nos filtros aplicados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {searchResults.map((message) => (
                        <div
                          key={message.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-sm">
                                {message.client?.company_name || 'Cliente não identificado'}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {message.sender_type === 'client' ? 'De' : 'Para'}: {message.client?.contact_person}
                              </p>
                              {message.subject && (
                                <p className="text-xs text-blue-600 mt-1">
                                  <strong>Assunto:</strong> {message.subject}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant={message.is_read ? "secondary" : "default"}>
                                {message.is_read ? 'Lida' : 'Não lida'}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(message.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-700 mb-3">
                            <p className="line-clamp-2">{message.content}</p>
                            {renderAttachments(message.attachments)}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="space-y-1">
                              {message.case?.case_title && (
                                <p><strong>Caso:</strong> {message.case.case_title}</p>
                              )}
                              {message.case?.case_number && (
                                <p><strong>Número:</strong> {message.case.case_number}</p>
                              )}
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver Conversa
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {searchResults.length > 5 && (
                      <div className="mt-4 text-center">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar Resultados
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Empty State */}
              {searchResults.length === 0 && (searchQuery || clientFilter || statusFilter || dateFilter) && !isSearching && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma mensagem encontrada
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Tente ajustar os filtros de busca ou usar critérios diferentes
                    </p>
                    <Button variant="outline" onClick={clearAdvancedFilters}>
                      Limpar Filtros
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default AdminStaffMessages;
