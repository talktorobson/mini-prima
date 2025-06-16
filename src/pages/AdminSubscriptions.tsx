import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  CreditCard,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { subscriptionService, analyticsService, SubscriptionPlan, ClientSubscription } from '@/lib/subscriptionService';
import { useToast } from '@/hooks/use-toast';
import SubscriptionDashboard from '@/components/SubscriptionDashboard';
import SubscriptionPlanCard from '@/components/SubscriptionPlanCard';

const AdminSubscriptions: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<ClientSubscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newPlan, setNewPlan] = useState({
    name: '',
    tier: 'basic',
    category: 'labor_law',
    monthly_price: 0,
    yearly_price: 0,
    description: '',
    consulting_hours_quota: 0,
    document_review_quota: 0,
    legal_questions_quota: 0,
    litigation_discount_percentage: 0,
    features: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchTerm, filterStatus, filterTier]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData] = await Promise.all([
        subscriptionService.getSubscriptionPlans()
      ]);
      
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.plan?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    if (filterTier !== 'all') {
      filtered = filtered.filter(sub => sub.plan?.tier === filterTier);
    }

    setFilteredSubscriptions(filtered);
  };

  const handleCreatePlan = async () => {
    try {
      // Here we would call the API to create a new plan
      // For now, we'll just show a success message
      toast({
        title: "Sucesso",
        description: "Plano criado com sucesso",
      });
      
      setIsCreatePlanOpen(false);
      setNewPlan({
        name: '',
        tier: 'basic',
        category: 'labor_law',
        monthly_price: 0,
        yearly_price: 0,
        description: '',
        consulting_hours_quota: 0,
        document_review_quota: 0,
        legal_questions_quota: 0,
        litigation_discount_percentage: 0,
        features: {}
      });
      
      await loadData();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar plano",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { label: 'Ativa', variant: 'default' as const, className: 'bg-green-500' },
      'cancelled': { label: 'Cancelada', variant: 'destructive' as const, className: '' },
      'past_due': { label: 'Em Atraso', variant: 'destructive' as const, className: 'bg-yellow-500' },
      'paused': { label: 'Pausada', variant: 'secondary' as const, className: '' },
      'trial': { label: 'Trial', variant: 'outline' as const, className: 'bg-blue-500 text-white' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      'basic': { label: 'Básico', className: 'bg-blue-500 text-white' },
      'professional': { label: 'Profissional', className: 'bg-purple-500 text-white' },
      'enterprise': { label: 'Enterprise', className: 'bg-red-500 text-white' }
    };

    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.basic;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Assinaturas</h1>
          <p className="text-gray-600">Gerencie planos de assinatura e clientes do Legal-as-a-Service</p>
        </div>
        
        <div className="flex space-x-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Dados
          </Button>
          <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Plano de Assinatura</DialogTitle>
                <DialogDescription>
                  Configure um novo plano para o sistema Legal-as-a-Service
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Nome do Plano</Label>
                  <Input
                    id="plan-name"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                    placeholder="Ex: Profissional Trabalhista"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plan-tier">Tier</Label>
                  <Select value={newPlan.tier} onValueChange={(value) => setNewPlan({...newPlan, tier: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-category">Categoria</Label>
                  <Select value={newPlan.category} onValueChange={(value) => setNewPlan({...newPlan, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="labor_law">Direito Trabalhista</SelectItem>
                      <SelectItem value="corporate_law">Direito Empresarial</SelectItem>
                      <SelectItem value="full_service">Serviço Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly-price">Preço Mensal (R$)</Label>
                  <Input
                    id="monthly-price"
                    type="number"
                    value={newPlan.monthly_price}
                    onChange={(e) => setNewPlan({...newPlan, monthly_price: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearly-price">Preço Anual (R$)</Label>
                  <Input
                    id="yearly-price"
                    type="number"
                    value={newPlan.yearly_price}
                    onChange={(e) => setNewPlan({...newPlan, yearly_price: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consulting-hours">Horas de Consultoria/Mês</Label>
                  <Input
                    id="consulting-hours"
                    type="number"
                    value={newPlan.consulting_hours_quota}
                    onChange={(e) => setNewPlan({...newPlan, consulting_hours_quota: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-quota">Análises de Documentos/Mês</Label>
                  <Input
                    id="document-quota"
                    type="number"
                    value={newPlan.document_review_quota}
                    onChange={(e) => setNewPlan({...newPlan, document_review_quota: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questions-quota">Perguntas Jurídicas/Mês</Label>
                  <Input
                    id="questions-quota"
                    type="number"
                    value={newPlan.legal_questions_quota}
                    onChange={(e) => setNewPlan({...newPlan, legal_questions_quota: parseInt(e.target.value)})}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="discount-percentage">Desconto em Litígios (%)</Label>
                  <Input
                    id="discount-percentage"
                    type="number"
                    value={newPlan.litigation_discount_percentage}
                    onChange={(e) => setNewPlan({...newPlan, litigation_discount_percentage: parseFloat(e.target.value)})}
                    max="100"
                    min="0"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="plan-description">Descrição</Label>
                  <Input
                    id="plan-description"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                    placeholder="Descrição do plano..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePlan} className="bg-red-600 hover:bg-red-700">
                  Criar Plano
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <SubscriptionDashboard isAdminView={true} />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Planos de Assinatura</h2>
            <span className="text-sm text-gray-500">{plans.length} planos ativos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="relative">
                <SubscriptionPlanCard plan={plan} />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedPlan(plan);
                      // Open edit dialog
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      // Handle delete
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Buscar por plano..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="past_due">Em Atraso</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select value={filterTier} onValueChange={setFilterTier}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tiers</SelectItem>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterTier('all');
                  }}>
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions List */}
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas Ativas</CardTitle>
              <CardDescription>
                {filteredSubscriptions.length} assinaturas encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma assinatura encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubscriptions.map((subscription) => (
                    <div 
                      key={subscription.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-medium">{subscription.plan?.name}</div>
                          <div className="text-sm text-gray-500">
                            Cliente ID: {subscription.client_id.slice(0, 8)}...
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {getStatusBadge(subscription.status)}
                          {subscription.plan && getTierBadge(subscription.plan.tier)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(subscription.monthly_amount)}</div>
                          <div className="text-sm text-gray-500">
                            {subscription.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-500">Próxima cobrança</div>
                          <div className="text-sm">
                            {subscription.next_billing_date 
                              ? new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')
                              : 'N/A'
                            }
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Cobrança
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSubscriptions;