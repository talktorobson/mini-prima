
import * as XLSX from 'xlsx';

export interface FinancialRecord {
  id: string;
  description: string;
  amount: number;
  status: string;
  type: string;
  category?: string;
  invoice_number?: string;
  due_date?: string;
  payment_date?: string;
  payment_method?: string;
  created_at: string;
  notes?: string;
}

export const exportFinancialRecordsToExcel = (records: FinancialRecord[], filterType: string = 'all') => {
  // Prepare data for Excel
  const excelData = records.map(record => ({
    'Descrição': record.description,
    'Valor': `R$ ${(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    'Status': record.status,
    'Tipo': record.type,
    'Categoria': record.category || 'N/A',
    'Número da Fatura': record.invoice_number || 'N/A',
    'Data de Vencimento': record.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A',
    'Data de Pagamento': record.payment_date ? new Date(record.payment_date).toLocaleDateString('pt-BR') : 'N/A',
    'Método de Pagamento': record.payment_method || 'N/A',
    'Criado em': new Date(record.created_at).toLocaleDateString('pt-BR'),
    'Observações': record.notes || ''
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = [
    { wch: 30 }, // Descrição
    { wch: 15 }, // Valor
    { wch: 12 }, // Status
    { wch: 15 }, // Tipo
    { wch: 15 }, // Categoria
    { wch: 20 }, // Número da Fatura
    { wch: 18 }, // Data de Vencimento
    { wch: 18 }, // Data de Pagamento
    { wch: 20 }, // Método de Pagamento
    { wch: 15 }, // Criado em
    { wch: 30 }  // Observações
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  const sheetName = getSheetName(filterType);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate filename
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filterSuffix = filterType !== 'all' ? `_${filterType}` : '';
  const filename = `registros_financeiros${filterSuffix}_${dateStr}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
};

const getSheetName = (filterType: string): string => {
  switch (filterType) {
    case 'pending':
      return 'Pendentes';
    case 'paid':
      return 'Pagos';
    case 'overdue':
      return 'Em Atraso';
    default:
      return 'Todos os Registros';
  }
};
