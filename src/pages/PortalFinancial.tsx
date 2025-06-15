import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  CreditCard, 
  FileText, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useClientData } from '@/hooks/useClientData';
import { financialService } from '@/services/database';
import { exportFinancialRecordsToExcel } from '@/utils/excelExport';

type FilterType = 'all' | 'pending' | 'paid' | 'overdue';

const PortalFinancial = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: client } = useClientData();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  const { data: financialRecords = [], isLoading } = useQuery({
    queryKey: ['financial-records'],
    queryFn: financialService.getFinancialRecords,
    enabled: !!client
  });

  const pendingRecords = financialRecords.filter(record => record.status === 'Pending');
  const paidRecords = financialRecords.filter(record => record.status === 'Paid');
  const overdueRecords = financialRecords.filter(record => 
    record.status === 'Pending' && record.due_date && new Date(record.due_date) < new Date()
  );

  const totalPending = pendingRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
  const totalPaid = paidRecords.reduce((sum, record) => sum + (record.amount || 0), 0);

  // Filter records based on active filter
  const getFilteredRecords = () => {
    switch (activeFilter) {
      case 'pending':
        return pendingRecords;
      case 'paid':
        return paidRecords;
      case 'overdue':
        return overdueRecords;
      default:
        return financialRecords;
    }
  };

  const handleCardClick = (filterType: FilterType) => {
    setActiveFilter(filterType);
    
    // Set appropriate tab based on filter
    if (filterType === 'paid') {
      setActiveTab('paid');
    } else if (filterType === 'pending' || filterType === 'overdue') {
      setActiveTab('pending');
    } else {
      setActiveTab('all');
    }
  };

  const handleExportToExcel = () => {
    const filteredRecords = getFilteredRecords();
    exportFinancialRecordsToExcel(filteredRecords, activeFilter);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-orange-400" />;
      case 'Overdue':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string, dueDate?: string) => {
    if (status === 'Pending' && dueDate && new Date(dueDate) < new Date()) {
      return 'border-red-400 text-red-400';
    }
    switch (status) {
      case 'Paid':
        return 'border-green-400 text-green-400';
      case 'Pending':
        return 'border-orange-400 text-orange-400';
      default:
        return 'border-gray-400 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  const filteredRecords = getFilteredRecords();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/portal')}
                className="text-orange-300 hover:text-orange-200 hover:bg-slate-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Portal
              </Button>
              <div className="flex items-center space-x-3">
                <CreditCard className="h-6 w-6 text-orange-400" />
                <div>
                  <h1 className="text-xl font-bold text-white">Financeiro</h1>
                  <p className="text-sm text-orange-200">{client?.company_name}</p>
                </div>
              </div>
            </div>
            
            {/* Export Button */}
            <Button
              onClick={handleExportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={filteredRecords.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card 
            className={`bg-slate-800/50 border-slate-700 backdrop-blur-sm cursor-pointer transition-all hover:bg-slate-700/50 ${
              activeFilter === 'pending' ? 'ring-2 ring-orange-400' : ''
            }`}
            onClick={() => handleCardClick('pending')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-300">Total Pendente</p>
                  <p className="text-2xl font-bold text-orange-400">
                    R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-slate-800/50 border-slate-700 backdrop-blur-sm cursor-pointer transition-all hover:bg-slate-700/50 ${
              activeFilter === 'paid' ? 'ring-2 ring-green-400' : ''
            }`}
            onClick={() => handleCardClick('paid')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300">Total Pago</p>
                  <p className="text-2xl font-bold text-green-400">
                    R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-slate-800/50 border-slate-700 backdrop-blur-sm cursor-pointer transition-all hover:bg-slate-700/50 ${
              activeFilter === 'overdue' ? 'ring-2 ring-red-400' : ''
            }`}
            onClick={() => handleCardClick('overdue')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-300">Em Atraso</p>
                  <p className="text-2xl font-bold text-red-400">{overdueRecords.length}</p>
                </div>
                <Clock className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-slate-800/50 border-slate-700 backdrop-blur-sm cursor-pointer transition-all hover:bg-slate-700/50 ${
              activeFilter === 'all' ? 'ring-2 ring-blue-400' : ''
            }`}
            onClick={() => handleCardClick('all')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300">Total Registros</p>
                  <p className="text-2xl font-bold text-blue-400">{financialRecords.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Filter Indicator */}
        {activeFilter !== 'all' && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">Filtro ativo:</span>
              <Badge variant="outline" className="text-white border-orange-400">
                {activeFilter === 'pending' && 'Pendentes'}
                {activeFilter === 'paid' && 'Pagos'}
                {activeFilter === 'overdue' && 'Em Atraso'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCardClick('all')}
                className="text-orange-300 hover:text-orange-200"
              >
                Limpar filtro
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">
                {filteredRecords.length} registro(s) selecionado(s)
              </span>
            </div>
          </div>
        )}

        {/* Financial Records */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-orange-400" />
                <span>Registros Financeiros</span>
                {filteredRecords.length !== financialRecords.length && (
                  <span className="text-sm text-slate-400">
                    ({filteredRecords.length} de {financialRecords.length})
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-700/50">
                <TabsTrigger value="pending" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  Pendentes ({pendingRecords.length})
                </TabsTrigger>
                <TabsTrigger value="paid" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  Pagos ({paidRecords.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Todos ({financialRecords.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {(activeFilter === 'all' ? pendingRecords : activeFilter === 'pending' || activeFilter === 'overdue' ? filteredRecords : []).length > 0 ? (
                  (activeFilter === 'all' ? pendingRecords : activeFilter === 'pending' || activeFilter === 'overdue' ? filteredRecords : []).map((record) => (
                    <div key={record.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(record.status)}
                          <div>
                            <h3 className="font-medium text-white">{record.description}</h3>
                            <p className="text-sm text-slate-300">
                              {record.invoice_number && `Fatura: ${record.invoice_number}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-orange-400">
                            R$ {(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge variant="outline" className={getStatusColor(record.status, record.due_date)}>
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Vencimento:</span>
                          <p className="text-white">
                            {record.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Tipo:</span>
                          <p className="text-white">{record.type}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Categoria:</span>
                          <p className="text-white">{record.category || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Criado em:</span>
                          <p className="text-white">
                            {new Date(record.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      {record.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-600">
                          <span className="text-slate-400 text-sm">Observações:</span>
                          <p className="text-white text-sm mt-1">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <p className="text-xl text-white mb-2">Nenhuma pendência financeira!</p>
                    <p className="text-slate-400">Todas as faturas estão em dia.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="paid" className="space-y-4">
                {(activeFilter === 'all' ? paidRecords : activeFilter === 'paid' ? filteredRecords : []).length > 0 ? (
                  (activeFilter === 'all' ? paidRecords : activeFilter === 'paid' ? filteredRecords : []).map((record) => (
                    <div key={record.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(record.status)}
                          <div>
                            <h3 className="font-medium text-white">{record.description}</h3>
                            <p className="text-sm text-slate-300">
                              {record.invoice_number && `Fatura: ${record.invoice_number}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-400">
                            R$ {(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge variant="outline" className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Pago em:</span>
                          <p className="text-white">
                            {record.payment_date ? new Date(record.payment_date).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Método:</span>
                          <p className="text-white">{record.payment_method || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Tipo:</span>
                          <p className="text-white">{record.type}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Categoria:</span>
                          <p className="text-white">{record.category || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-xl text-white mb-2">Nenhum pagamento registrado</p>
                    <p className="text-slate-400">Não há registros de pagamentos realizados.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <div key={record.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(record.status)}
                          <div>
                            <h3 className="font-medium text-white">{record.description}</h3>
                            <p className="text-sm text-slate-300">
                              {record.invoice_number && `Fatura: ${record.invoice_number}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-blue-400">
                            R$ {(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge variant="outline" className={getStatusColor(record.status, record.due_date)}>
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Vencimento:</span>
                          <p className="text-white">
                            {record.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Tipo:</span>
                          <p className="text-white">{record.type}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Status:</span>
                          <p className="text-white">{record.status}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Criado em:</span>
                          <p className="text-white">
                            {new Date(record.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-xl text-white mb-2">Nenhum registro financeiro</p>
                    <p className="text-slate-400">Não há registros financeiros para exibir.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PortalFinancial;
