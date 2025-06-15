
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building, 
  Search, 
  Filter, 
  Plus, 
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useStaffData } from '@/hooks/useStaffData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Case {
  id: string;
  case_number: string;
  case_title: string;
  service_type: string;
  status: string;
  priority: string;
  client_id: string;
  start_date: string;
  due_date?: string;
  progress_percentage: number;
  client: {
    company_name: string;
    contact_person: string;
  };
}

const AdminStaffCases = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { assignedClients, staffInfo, isStaff, hasAssignedClients } = useStaffData();
  const { toast } = useToast();

  useEffect(() => {
    if (hasAssignedClients) {
      fetchStaffCases();
    }
  }, [hasAssignedClients, assignedClients]);

  const fetchStaffCases = async () => {
    try {
      setLoading(true);
      
      const assignedClientIds = assignedClients.map(client => client.id);
      
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          client:clients (
            company_name,
            contact_person
          )
        `)
        .in('client_id', assignedClientIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error: any) {
      console.error('Error fetching staff cases:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar casos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.case_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.client.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
              <h1 className="text-xl font-bold text-gray-900">Gerenciamento de Casos</h1>
              <p className="text-sm text-gray-600">
                Casos dos clientes atribuídos a {staffInfo?.full_name}
              </p>
            </div>
            <Link to="/admin/staff/cases/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Caso
              </Button>
            </Link>
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
          <>
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar casos</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Buscar por título, número ou cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status-filter">Status</Label>
                    <select
                      id="status-filter"
                      className="w-full p-2 border rounded-md"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="Open">Aberto</option>
                      <option value="In Progress">Em Andamento</option>
                      <option value="On Hold">Em Espera</option>
                      <option value="Closed">Fechado</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cases List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando casos...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredCases.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum caso encontrado
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Tente ajustar os filtros de busca.'
                          : 'Ainda não há casos para os clientes atribuídos.'}
                      </p>
                      <Link to="/admin/staff/cases/new">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Criar Primeiro Caso
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  filteredCases.map((case_) => (
                    <Card key={case_.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-gray-900">
                                {case_.case_title}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {case_.case_number}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-2">{case_.service_type}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Users className="h-4 w-4" />
                              <span>{case_.client.company_name} - {case_.client.contact_person}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge className={getStatusColor(case_.status)}>
                              {case_.status}
                            </Badge>
                            <Badge className={getPriorityColor(case_.priority)}>
                              {case_.priority}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Início</p>
                            <p className="text-sm">
                              {new Date(case_.start_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          {case_.due_date && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Prazo</p>
                              <p className="text-sm">
                                {new Date(case_.due_date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Progresso</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${case_.progress_percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">
                                {case_.progress_percentage}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link to={`/admin/staff/cases/${case_.id}`}>
                            <Button variant="outline" size="sm">
                              <FileText className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </Button>
                          </Link>
                          <Link to={`/admin/staff/cases/${case_.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminStaffCases;
