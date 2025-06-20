// 📊 SEARCH RESULTS TABLE COMPONENT
// High-performance table with sorting, pagination, and actions

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  User,
  CreditCard
} from 'lucide-react';
import type { 
  SearchResult, 
  SupplierSearchResult, 
  BillSearchResult, 
  InvoiceSearchResult 
} from '@/lib/financialSearchService';

type SearchResultData = SupplierSearchResult | BillSearchResult | InvoiceSearchResult;

interface SearchResultsTableProps {
  results: SearchResult<SearchResultData>;
  type: 'suppliers' | 'bills' | 'invoices';
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: SearchResultData) => void;
  onAction?: (action: string, item: SearchResultData) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  loading?: boolean;
  className?: string;
}

export const SearchResultsTable: React.FC<SearchResultsTableProps> = ({
  results,
  type,
  onSort,
  onPageChange,
  onRowClick,
  onAction,
  selectable = false,
  onSelectionChange,
  loading = false,
  className = ""
}) => {
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Handle sorting
  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    onSort?.(field, newDirection);
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? results.data.map(item => item.id) : [];
    setSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedIds, id]
      : selectedIds.filter(selectedId => selectedId !== id);
    setSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'approved':
      case 'active':
        return 'default';
      case 'pending':
      case 'sent':
        return 'secondary';
      case 'overdue':
      case 'rejected':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'approved':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'overdue':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Render table header with sorting
  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field ? (
          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
  );

  // Render action menu
  const ActionMenu = ({ item }: { item: SearchResultData }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction?.('view', item)}>
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction?.('edit', item)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction?.('download', item)}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </DropdownMenuItem>
        {type === 'bills' && (item as BillSearchResult).status === 'pending' && (
          <DropdownMenuItem onClick={() => onAction?.('approve', item)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          onClick={() => onAction?.('delete', item)}
          className="text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Render suppliers table
  const renderSuppliersTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === results.data.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
          )}
          <SortableHeader field="name">Fornecedor</SortableHeader>
          <SortableHeader field="category">Categoria</SortableHeader>
          <SortableHeader field="total_amount_owed">Valor em Aberto</SortableHeader>
          <SortableHeader field="total_bills">Total de Contas</SortableHeader>
          <SortableHeader field="last_payment_date">Último Pagamento</SortableHeader>
          <TableHead>Status</TableHead>
          <TableHead className="w-12">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.data.map((supplier) => {
          const supplierData = supplier as SupplierSearchResult;
          return (
            <TableRow 
              key={supplier.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onRowClick?.(supplier)}
            >
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(supplier.id)}
                    onCheckedChange={(checked) => handleSelectItem(supplier.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{supplierData.name}</div>
                    {supplierData.email && (
                      <div className="text-sm text-gray-500">{supplierData.email}</div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{supplierData.category || 'Sem categoria'}</Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium text-red-600">
                  {formatCurrency(supplierData.total_amount_owed || 0)}
                </span>
              </TableCell>
              <TableCell>{supplierData.total_bills || 0}</TableCell>
              <TableCell>
                {supplierData.last_payment_date 
                  ? formatDate(supplierData.last_payment_date)
                  : 'Nunca'
                }
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(supplierData.is_active ? 'active' : 'inactive')}>
                  {getStatusIcon(supplierData.is_active ? 'active' : 'inactive')}
                  <span className="ml-1">{supplierData.is_active ? 'Ativo' : 'Inativo'}</span>
                </Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <ActionMenu item={supplier} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  // Render bills table
  const renderBillsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === results.data.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
          )}
          <SortableHeader field="bill_number">Número</SortableHeader>
          <SortableHeader field="supplier_name">Fornecedor</SortableHeader>
          <SortableHeader field="description">Descrição</SortableHeader>
          <SortableHeader field="total_amount">Valor</SortableHeader>
          <SortableHeader field="due_date">Vencimento</SortableHeader>
          <TableHead>Status</TableHead>
          <TableHead className="w-12">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.data.map((bill) => {
          const billData = bill as BillSearchResult;
          return (
            <TableRow 
              key={bill.id}
              className={`cursor-pointer hover:bg-gray-50 ${
                billData.is_overdue ? 'bg-red-50' : ''
              }`}
              onClick={() => onRowClick?.(bill)}
            >
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(bill.id)}
                    onCheckedChange={(checked) => handleSelectItem(bill.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="font-medium">{billData.bill_number}</div>
                {billData.search_rank && billData.search_rank > 0 && (
                  <div className="text-xs text-blue-600">
                    Relevância: {Math.round(billData.search_rank * 100)}%
                  </div>
                )}
              </TableCell>
              <TableCell>{billData.supplier_name || 'N/A'}</TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={billData.description}>
                  {billData.description}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {formatCurrency(billData.total_amount)}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <div>{formatDate(billData.due_date)}</div>
                  {billData.days_until_due !== undefined && (
                    <div className={`text-xs ${
                      billData.is_overdue ? 'text-red-600' : 
                      billData.days_until_due <= 7 ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {billData.is_overdue 
                        ? `Vencido há ${Math.abs(billData.days_until_due)} dias`
                        : billData.days_until_due === 0 
                        ? 'Vence hoje'
                        : `${billData.days_until_due} dias`
                      }
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(billData.status)}>
                  {getStatusIcon(billData.status)}
                  <span className="ml-1 capitalize">{billData.status}</span>
                </Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <ActionMenu item={bill} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  // Render invoices table
  const renderInvoicesTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === results.data.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
          )}
          <SortableHeader field="invoice_number">Número</SortableHeader>
          <SortableHeader field="client_name">Cliente</SortableHeader>
          <SortableHeader field="description">Descrição</SortableHeader>
          <SortableHeader field="total_amount">Valor</SortableHeader>
          <SortableHeader field="due_date">Vencimento</SortableHeader>
          <TableHead>Status</TableHead>
          <TableHead className="w-12">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.data.map((invoice) => {
          const invoiceData = invoice as InvoiceSearchResult;
          return (
            <TableRow 
              key={invoice.id}
              className={`cursor-pointer hover:bg-gray-50 ${
                invoiceData.is_overdue ? 'bg-red-50' : ''
              }`}
              onClick={() => onRowClick?.(invoice)}
            >
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(invoice.id)}
                    onCheckedChange={(checked) => handleSelectItem(invoice.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="font-medium">{invoiceData.invoice_number}</div>
                {invoiceData.search_rank && invoiceData.search_rank > 0 && (
                  <div className="text-xs text-blue-600">
                    Relevância: {Math.round(invoiceData.search_rank * 100)}%
                  </div>
                )}
              </TableCell>
              <TableCell>{invoiceData.client_name || 'N/A'}</TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={invoiceData.description}>
                  {invoiceData.description}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoiceData.total_amount)}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <div>{formatDate(invoiceData.due_date)}</div>
                  {invoiceData.days_until_due !== undefined && (
                    <div className={`text-xs ${
                      invoiceData.is_overdue ? 'text-red-600' : 
                      invoiceData.days_until_due <= 7 ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {invoiceData.is_overdue 
                        ? `Vencido há ${Math.abs(invoiceData.days_until_due)} dias`
                        : invoiceData.days_until_due === 0 
                        ? 'Vence hoje'
                        : `${invoiceData.days_until_due} dias`
                      }
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(invoiceData.status)}>
                  {getStatusIcon(invoiceData.status)}
                  <span className="ml-1 capitalize">{invoiceData.status}</span>
                </Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <ActionMenu item={invoice} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Empty state
  if (results.data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-2">Nenhum resultado encontrado</div>
        <div className="text-sm text-gray-400">
          Tente ajustar os termos de busca ou filtros
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {results.total_count.toLocaleString('pt-BR')} resultados encontrados
          {results.search_time_ms && (
            <span className="ml-2 text-gray-400">
              ({results.search_time_ms}ms)
            </span>
          )}
        </div>
        {selectable && selectedIds.length > 0 && (
          <div className="text-sm text-blue-600">
            {selectedIds.length} item(s) selecionado(s)
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="border rounded-lg overflow-hidden">
        {type === 'suppliers' && renderSuppliersTable()}
        {type === 'bills' && renderBillsTable()}
        {type === 'invoices' && renderInvoicesTable()}
      </div>

      {/* Pagination */}
      {results.page_info.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Página {results.page_info.current_page} de {results.page_info.total_pages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!results.page_info.has_previous}
              onClick={() => onPageChange?.(results.page_info.current_page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!results.page_info.has_next}
              onClick={() => onPageChange?.(results.page_info.current_page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultsTable;