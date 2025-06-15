
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Calendar, 
  CreditCard, 
  FileText, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Building
} from 'lucide-react';

// Dynamic imports for PDF generation to avoid build issues
const generatePDF = async (elementId: string, fileName: string) => {
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    
    const element = document.getElementById(elementId);
    if (!element) return;

    const canvas = await html2canvas(element, {
      backgroundColor: '#1e293b',
      scale: 2,
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

interface FinancialRecord {
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

interface FinancialRecordModalProps {
  record: FinancialRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const FinancialRecordModal: React.FC<FinancialRecordModalProps> = ({
  record,
  isOpen,
  onClose
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-orange-400" />;
      case 'Overdue':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string, dueDate?: string) => {
    if (status === 'Pending' && dueDate && new Date(dueDate) < new Date()) {
      return 'border-red-400 text-red-400 bg-red-400/10';
    }
    switch (status) {
      case 'Paid':
        return 'border-green-400 text-green-400 bg-green-400/10';
      case 'Pending':
        return 'border-orange-400 text-orange-400 bg-orange-400/10';
      default:
        return 'border-gray-400 text-gray-400 bg-gray-400/10';
    }
  };

  const exportToPDF = async () => {
    if (!record) return;
    
    const fileName = `registro_financeiro_${record.invoice_number || record.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    await generatePDF('financial-record-content', fileName);
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-white flex items-center space-x-3">
              {getStatusIcon(record.status)}
              <span>{record.description}</span>
            </DialogTitle>
            <Button
              onClick={exportToPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </DialogHeader>

        <div id="financial-record-content" className="space-y-6 p-6 bg-slate-800 rounded-lg">
          {/* Header Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-6 w-6 text-green-400" />
                <div>
                  <p className="text-sm text-slate-400">Valor</p>
                  <p className="text-3xl font-bold text-green-400">
                    R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(record.status)}
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    <Badge variant="outline" className={getStatusColor(record.status, record.due_date)}>
                      {record.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {record.invoice_number && (
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-slate-400">Número da Fatura</p>
                    <p className="text-lg font-semibold text-white">{record.invoice_number}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm text-slate-400">Tipo</p>
                  <p className="text-lg font-semibold text-white">{record.type}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-600" />

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-medium text-slate-300">Data de Vencimento</span>
              </div>
              <p className="text-white ml-6">
                {record.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>

            {record.payment_date && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-slate-300">Data de Pagamento</span>
                </div>
                <p className="text-white ml-6">
                  {new Date(record.payment_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            {record.payment_method && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Método de Pagamento</span>
                </div>
                <p className="text-white ml-6">{record.payment_method}</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">Categoria</span>
              </div>
              <p className="text-white ml-6">{record.category || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">Criado em</span>
              </div>
              <p className="text-white ml-6">
                {new Date(record.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {record.notes && (
            <>
              <Separator className="bg-slate-600" />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <span>Observações</span>
                </h3>
                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                  <p className="text-slate-200 leading-relaxed">{record.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Footer with metadata */}
          <Separator className="bg-slate-600" />
          <div className="text-center text-sm text-slate-400">
            <p>Registro gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialRecordModal;
