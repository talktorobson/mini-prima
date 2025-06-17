import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock, Edit3, Trash2, Send, CheckCircle, XCircle, 
  Calendar, Filter, RefreshCw, Eye, MoreHorizontal 
} from 'lucide-react';
import { TimeEntryWithDetails, timeTrackingService } from '@/services/timeTrackingService';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TimeEntryForm } from './TimeEntryForm';

interface TimeEntriesListProps {
  entries: TimeEntryWithDetails[];
  loading: boolean;
  onEntryUpdated: () => void;
  onRefresh: () => void;
}

export function TimeEntriesList({ entries, loading, onEntryUpdated, onRefresh }: TimeEntriesListProps) {
  const { toast } = useToast();
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingEntry, setEditingEntry] = useState<TimeEntryWithDetails | null>(null);
  const [viewingEntry, setViewingEntry] = useState<TimeEntryWithDetails | null>(null);
  const [actionLoading, setActionLoading] = useState<string>('');

  const filteredEntries = entries.filter(entry => {
    if (filterStatus !== 'all' && entry.status !== filterStatus) return false;
    if (filterDate && !entry.start_time.startsWith(filterDate)) return false;
    if (searchTerm && !entry.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleSelectEntry = (entryId: string, checked: boolean) => {
    if (checked) {
      setSelectedEntries(prev => [...prev, entryId]);
    } else {
      setSelectedEntries(prev => prev.filter(id => id !== entryId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(filteredEntries.map(entry => entry.id));
    } else {
      setSelectedEntries([]);
    }
  };

  const handleBulkAction = async (action: 'submit' | 'approve' | 'reject', notes?: string) => {
    if (selectedEntries.length === 0) return;

    setActionLoading(action);
    try {
      switch (action) {
        case 'submit':
          await timeTrackingService.submitTimeEntries(selectedEntries);
          toast({
            title: 'Sucesso',
            description: `${selectedEntries.length} registro(s) enviado(s) para aprovação`,
          });
          break;
        case 'approve':
          await timeTrackingService.approveTimeEntries(selectedEntries, notes);
          toast({
            title: 'Sucesso',
            description: `${selectedEntries.length} registro(s) aprovado(s)`,
          });
          break;
        case 'reject':
          if (!notes) {
            toast({
              title: 'Erro',
              description: 'Motivo da rejeição é obrigatório',
              variant: 'destructive',
            });
            return;
          }
          await timeTrackingService.rejectTimeEntries(selectedEntries, notes);
          toast({
            title: 'Sucesso',
            description: `${selectedEntries.length} registro(s) rejeitado(s)`,
          });
          break;
      }
      setSelectedEntries([]);
      onEntryUpdated();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar ação',
        variant: 'destructive',
      });
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await timeTrackingService.deleteTimeEntry(entryId);
      toast({
        title: 'Sucesso',
        description: 'Registro excluído com sucesso',
      });
      onEntryUpdated();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir registro',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      submitted: { label: 'Enviado', variant: 'default' as const },
      approved: { label: 'Aprovado', variant: 'default' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const },
      billed: { label: 'Faturado', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Registros de Tempo
            </CardTitle>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder="Buscar descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="submitted">Enviado</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                    <SelectItem value="billed">Faturado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  placeholder="Filtrar por data"
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm text-gray-600">
                  {filteredEntries.length} registro(s)
                </span>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedEntries.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-700">
                  {selectedEntries.length} selecionado(s):
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('submit')}
                  disabled={actionLoading === 'submit'}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Enviar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('approve')}
                  disabled={actionLoading === 'approve'}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('reject', 'Rejeitado em lote')}
                  disabled={actionLoading === 'reject'}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente/Caso</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Carregando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum registro encontrado</p>
                      <p className="text-sm">Inicie um timer ou adicione um registro manual</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedEntries.includes(entry.id)}
                          onCheckedChange={(checked) => handleSelectEntry(entry.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {formatDateTime(entry.start_time)}
                          </div>
                          {entry.end_time && (
                            <div className="text-xs text-gray-500">
                              até {new Date(entry.end_time).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm font-medium truncate">
                            {timeTrackingService.getTaskTypes().find(t => t.value === entry.task_type)?.label}
                          </p>
                          <p className="text-xs text-gray-500 truncate" title={entry.description}>
                            {entry.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {entry.client && (
                            <div className="text-xs text-gray-600">
                              {entry.client.company_name}
                            </div>
                          )}
                          {entry.case && (
                            <div className="text-xs text-gray-600">
                              {entry.case.case_number}
                            </div>
                          )}
                          {!entry.client && !entry.case && (
                            <div className="text-xs text-gray-400">Interno</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {timeTrackingService.formatDuration(entry.billable_minutes || 0)}
                          </div>
                          {entry.duration_minutes !== entry.billable_minutes && (
                            <div className="text-xs text-gray-500">
                              Total: {timeTrackingService.formatDuration(entry.duration_minutes || 0)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {timeTrackingService.formatCurrency(entry.billable_amount || 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          R$ {entry.hourly_rate}/h
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(entry.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingEntry(entry)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            {entry.status === 'draft' && (
                              <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {entry.status === 'draft' && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Entry Dialog */}
      {editingEntry && (
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Registro de Tempo</DialogTitle>
            </DialogHeader>
            <TimeEntryForm
              mode="manual"
              initialData={editingEntry}
              onSubmit={async (data) => {
                try {
                  await timeTrackingService.updateTimeEntry(editingEntry.id, data);
                  setEditingEntry(null);
                  onEntryUpdated();
                  toast({
                    title: 'Sucesso',
                    description: 'Registro atualizado com sucesso',
                  });
                } catch (error) {
                  toast({
                    title: 'Erro',
                    description: 'Erro ao atualizar registro',
                    variant: 'destructive',
                  });
                }
              }}
              onCancel={() => setEditingEntry(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Entry Dialog */}
      {viewingEntry && (
        <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Registro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <div className="mt-1">{getStatusBadge(viewingEntry.status)}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Tipo:</span>
                  <div className="mt-1 text-sm">
                    {timeTrackingService.getTaskTypes().find(t => t.value === viewingEntry.task_type)?.label}
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Descrição:</span>
                <div className="mt-1 text-sm bg-gray-50 p-3 rounded">
                  {viewingEntry.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Início:</span>
                  <div className="mt-1 text-sm">{formatDateTime(viewingEntry.start_time)}</div>
                </div>
                {viewingEntry.end_time && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Fim:</span>
                    <div className="mt-1 text-sm">{formatDateTime(viewingEntry.end_time)}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Duração:</span>
                  <div className="mt-1 text-sm">
                    {timeTrackingService.formatDuration(viewingEntry.billable_minutes || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Valor:</span>
                  <div className="mt-1 text-sm font-medium">
                    {timeTrackingService.formatCurrency(viewingEntry.billable_amount || 0)}
                  </div>
                </div>
              </div>

              {viewingEntry.approval_notes && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Observações:</span>
                  <div className="mt-1 text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
                    {viewingEntry.approval_notes}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}