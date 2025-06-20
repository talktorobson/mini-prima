import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MessageCircle, 
  Users,
  Calendar,
  Filter,
  Download,
  Archive,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { messagesService } from '@/services/database';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminPermissionGuard from '@/components/admin/AdminPermissionGuard';

interface MessageSearchResult {
  id: string;
  content: string;
  subject?: string;
  sender_type: 'client' | 'staff';
  sender_id: string;
  recipient_id: string;
  recipient_type: 'client' | 'staff';
  thread_id: string;
  is_read: boolean;
  read_at?: string;
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
  staff?: {
    full_name: string;
    position: string;
  };
}

interface SearchFilters {
  query: string;
  sender_type: string;
  date_from: string;
  date_to: string;
  status: string;
  client_id: string;
  staff_id: string;
}

const AdminMessagesManagement = () => {
  const [searchResults, setSearchResults] = useState<MessageSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState('search');
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    sender_type: '',
    date_from: '',
    date_to: '',
    status: '',
    client_id: '',
    staff_id: ''
  });
  const [clients, setClients] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [messageStats, setMessageStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    threads: 0
  });
  
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadClientsAndStaff();
    loadMessageStats();
  }, []);

  const loadClientsAndStaff = async () => {
    try {
      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, company_name, contact_person')
        .eq('status', 'Active')
        .order('company_name');

      if (clientsError) {
        console.error('Error loading clients:', clientsError);
      } else {
        setClients(clientsData || []);
      }

      // Load staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, full_name, position')
        .eq('is_active', true)
        .order('full_name');

      if (staffError) {
        console.error('Error loading staff:', staffError);
      } else {
        setStaffMembers(staffData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadMessageStats = async () => {
    try {
      // Get total messages
      const { count: totalCount } = await supabase
        .from('portal_messages')
        .select('*', { count: 'exact', head: true });

      // Get unread messages
      const { count: unreadCount } = await supabase
        .from('portal_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      // Get today's messages
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('portal_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`);

      // Get unique threads
      const { data: threadsData } = await supabase
        .from('portal_messages')
        .select('thread_id')
        .not('thread_id', 'is', null);

      const uniqueThreads = new Set(threadsData?.map(m => m.thread_id)).size;

      setMessageStats({
        total: totalCount || 0,
        unread: unreadCount || 0,
        today: todayCount || 0,
        threads: uniqueThreads || 0
      });
    } catch (error) {
      console.error('Error loading message stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!filters.query.trim() && !filters.sender_type && !filters.date_from && !filters.status) {
      toast({
        title: 'Filtros necessários',
        description: 'Por favor, digite um termo de busca ou selecione um filtro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSearching(true);
      
      // Use the comprehensive search from the messages service
      const searchFilters: any = {};
      
      if (filters.date_from) searchFilters.dateFrom = filters.date_from;
      if (filters.date_to) searchFilters.dateTo = filters.date_to;
      if (filters.sender_type) searchFilters.messageType = filters.sender_type;
      if (filters.client_id) searchFilters.clientId = filters.client_id;
      if (filters.staff_id) searchFilters.staffId = filters.staff_id;

      const results = await messagesService.searchMessages(filters.query, searchFilters);
      
      setSearchResults(results);
      
      toast({
        title: 'Busca concluída',
        description: `${results.length} mensagens encontradas.`,
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

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      sender_type: '',
      date_from: '',
      date_to: '',
      status: '',
      client_id: '',
      staff_id: ''
    });
    setSearchResults([]);
  };

  const exportResults = async () => {
    try {
      // Convert search results to CSV format
      const headers = ['Data', 'Remetente', 'Destinatário', 'Assunto', 'Conteúdo', 'Status', 'Caso'];
      const csvData = searchResults.map(message => [
        new Date(message.created_at).toLocaleString('pt-BR'),
        message.sender_type === 'client' ? 
          (message.client?.company_name || 'Cliente') : 
          (message.staff?.full_name || 'Equipe'),
        message.recipient_type === 'client' ? 'Cliente' : 'Equipe',
        message.subject || 'N/A',
        message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
        message.is_read ? 'Lida' : 'Não lida',
        message.case?.case_number || 'N/A'
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `mensagens-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Sucesso',
        description: 'Relatório de mensagens exportado com sucesso',
      });
    } catch (error) {
      console.error('Error exporting messages:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar relatório',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (message: MessageSearchResult) => {
    if (message.is_read) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusBadge = (message: MessageSearchResult) => {
    if (message.is_read) {
      return <Badge variant="outline" className="text-green-600">Lida</Badge>;
    }
    return <Badge variant="secondary" className="text-yellow-600">Não lida</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gestão de Mensagens</h1>
              <p className="text-sm text-gray-600">Sistema abrangente de busca e gerenciamento de mensagens</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <AdminPermissionGuard requiredPermission="message_management">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Mensagens</p>
                    <p className="text-2xl font-bold text-gray-900">{messageStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Não Lidas</p>
                    <p className="text-2xl font-bold text-gray-900">{messageStats.unread}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Hoje</p>
                    <p className="text-2xl font-bold text-gray-900">{messageStats.today}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Conversas</p>
                    <p className="text-2xl font-bold text-gray-900">{messageStats.threads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="search">Busca Avançada</TabsTrigger>
              <TabsTrigger value="analytics">Análises</TabsTrigger>
              <TabsTrigger value="management">Gerenciamento</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6">
              {/* Advanced Search Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Busca Abrangente de Mensagens
                  </CardTitle>
                  <CardDescription>
                    Pesquise em todas as mensagens do sistema com filtros avançados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Query */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="search-query">Termo de Busca</Label>
                      <Input
                        id="search-query"
                        placeholder="Buscar no conteúdo, assunto, cliente..."
                        value={filters.query}
                        onChange={(e) => handleFilterChange('query', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="sender-type">Tipo de Remetente</Label>
                      <Select value={filters.sender_type} onValueChange={(value) => handleFilterChange('sender_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os tipos</SelectItem>
                          <SelectItem value="client">Cliente</SelectItem>
                          <SelectItem value="staff">Equipe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date-from">Data Inicial</Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="date-to">Data Final</Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Additional Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client">Cliente Específico</Label>
                      <Select value={filters.client_id} onValueChange={(value) => handleFilterChange('client_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os clientes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os clientes</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="staff">Membro da Equipe</Label>
                      <Select value={filters.staff_id} onValueChange={(value) => handleFilterChange('staff_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os membros" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os membros</SelectItem>
                          {staffMembers.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button onClick={handleSearch} disabled={isSearching}>
                      <Search className="h-4 w-4 mr-2" />
                      {isSearching ? 'Pesquisando...' : 'Buscar Mensagens'}
                    </Button>
                    <Button variant="outline" onClick={clearFilters}>
                      <Filter className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                    {searchResults.length > 0 && (
                      <Button variant="outline" onClick={exportResults}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Resultados
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Search Results */}
              {isSearching && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Pesquisando mensagens...</p>
                  </CardContent>
                </Card>
              )}

              {!isSearching && searchResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resultados da Busca ({searchResults.length})</CardTitle>
                    <CardDescription>
                      Mensagens encontradas com base nos filtros aplicados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {searchResults.map((message) => (
                        <div
                          key={message.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(message)}
                              <div>
                                <p className="font-medium text-sm">
                                  {message.sender_type === 'client' ? 
                                    (message.client?.company_name || 'Cliente') : 
                                    (message.staff?.full_name || 'Equipe')
                                  }
                                  {message.subject && (
                                    <span className="text-gray-500 ml-2">- {message.subject}</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(message.created_at).toLocaleString('pt-BR')}
                                  {message.case && (
                                    <span className="ml-2">• Caso: {message.case.case_number}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(message)}
                              <Badge variant="outline" className="text-xs">
                                {message.sender_type === 'client' ? 'Cliente → Equipe' : 'Equipe → Cliente'}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {message.content}
                          </p>
                          {message.read_at && (
                            <p className="text-xs text-gray-500 mt-2">
                              Lida em: {new Date(message.read_at).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isSearching && searchResults.length === 0 && (filters.query || filters.sender_type || filters.date_from) && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma mensagem encontrada
                    </h3>
                    <p className="text-gray-600">
                      Tente ajustar os filtros de busca ou usar termos diferentes
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Análises de Mensagens</CardTitle>
                  <CardDescription>
                    Estatísticas e métricas de comunicação em tempo real
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Volume de Mensagens</h4>
                      <div className="text-2xl font-bold text-blue-600">{messageStats.total}</div>
                      <p className="text-xs text-gray-500">Total de mensagens no sistema</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Taxa de Resposta</h4>
                      <div className="text-2xl font-bold text-green-600">
                        {messageStats.total > 0 ? Math.round((messageStats.total - messageStats.unread) / messageStats.total * 100) : 0}%
                      </div>
                      <p className="text-xs text-gray-500">Mensagens respondidas</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Conversas Ativas</h4>
                      <div className="text-2xl font-bold text-purple-600">{messageStats.threads}</div>
                      <p className="text-xs text-gray-500">Threads de conversa únicas</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Atividade Hoje</h4>
                      <div className="text-2xl font-bold text-orange-600">{messageStats.today}</div>
                      <p className="text-xs text-gray-500">Mensagens enviadas hoje</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="management">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciamento de Mensagens</CardTitle>
                  <CardDescription>
                    Ferramentas de administração e moderação de mensagens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Ações em Massa</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar Mensagens como Lidas
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Archive className="h-4 w-4 mr-2" />
                          Arquivar Conversas Antigas
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar Histórico de Mensagens
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Monitoramento</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 border rounded">
                          <span className="text-sm">Mensagens não lidas</span>
                          <Badge variant={messageStats.unread > 10 ? 'destructive' : 'secondary'}>
                            {messageStats.unread}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded">
                          <span className="text-sm">Conversas ativas hoje</span>
                          <Badge variant="outline">{messageStats.today}</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded">
                          <span className="text-sm">Threads totais</span>
                          <Badge variant="outline">{messageStats.threads}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </AdminPermissionGuard>
      </main>
    </div>
  );
};

export default AdminMessagesManagement;