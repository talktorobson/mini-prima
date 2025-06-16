// 📄 Boleto Payment Service with Database Integration
// D'Avila Reis Legal Practice Management System
// Real Boleto payment processing with Supabase persistence

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types from database schema
type Boleto = Database['public']['Tables']['boletos']['Row'];
type BoletoInsert = Database['public']['Tables']['boletos']['Insert'];
type BoletoUpdate = Database['public']['Tables']['boletos']['Update'];

// Boleto Service Types
export interface BoletoRequest {
  clientId: string;
  caseId?: string;
  invoiceId?: string;
  amount: number;
  dueDate: string; // ISO date string
  documentNumber: string;
  
  // Payer Information
  payerName: string;
  payerDocument: string;
  payerAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Boleto Configuration
  accept?: 'S' | 'N';
  species?: string;
  instructions?: string[];
  demonstration?: string[];
  
  // Interest and Fees (optional)
  interestConfig?: {
    type: 1 | 2 | 3;
    value: string;
    date?: string;
  };
  fineConfig?: {
    type: 1 | 2 | 3;
    value: string;
    date?: string;
  };
  discountConfig?: {
    type: 1 | 2 | 3;
    value: string;
    date: string;
  };
}

export interface BoletoResponse {
  id: string;
  nossoNumero: string;
  documentNumber: string;
  amount: number;
  dueDate: string;
  status: 'registered' | 'paid' | 'cancelled' | 'expired';
  barcode: string;
  digitableLine: string;
  pdfUrl: string;
  createdAt: string;
}

export interface BoletoPaymentStatus {
  id: string;
  nossoNumero: string;
  status: 'registered' | 'paid' | 'cancelled' | 'expired';
  paidAt?: string;
  paidAmount?: number;
  paymentMethod?: string;
}

export class BoletoService {
  private readonly mockMode: boolean;

  constructor(mockMode: boolean = true) {
    this.mockMode = mockMode;
  }

  /**
   * Generate a boleto and save to database
   */
  async generateBoleto(request: BoletoRequest): Promise<BoletoResponse> {
    try {
      // Generate boleto identifiers
      const nossoNumero = this.generateNossoNumero();
      const barcode = this.generateBarcode(request.amount, request.dueDate);
      const digitableLine = this.generateDigitableLine(barcode);
      const pdfUrl = this.generatePdfUrl(nossoNumero);

      // Create database record
      const boletoData: BoletoInsert = {
        client_id: request.clientId,
        case_id: request.caseId || null,
        invoice_id: request.invoiceId || null,
        nosso_numero: nossoNumero,
        document_number: request.documentNumber,
        amount: request.amount,
        due_date: request.dueDate,
        payer_name: request.payerName,
        payer_document: request.payerDocument,
        payer_address: request.payerAddress,
        accept: request.accept || 'S',
        species: request.species || 'DM',
        instructions: request.instructions || [],
        demonstration: request.demonstration || [],
        interest_config: request.interestConfig || null,
        fine_config: request.fineConfig || null,
        discount_config: request.discountConfig || null,
        barcode,
        digitable_line: digitableLine,
        status: 'registered',
        pdf_url: pdfUrl
      };

      const { data, error } = await supabase
        .from('boletos')
        .insert(boletoData)
        .select()
        .single();

      if (error) {
        console.error('Error creating boleto:', error);
        throw new Error(`Failed to create boleto: ${error.message}`);
      }

      // Return response format
      return {
        id: data.id,
        nossoNumero: data.nosso_numero,
        documentNumber: data.document_number,
        amount: data.amount,
        dueDate: data.due_date,
        status: data.status as 'registered',
        barcode: data.barcode,
        digitableLine: data.digitable_line,
        pdfUrl: data.pdf_url!,
        createdAt: data.created_at!
      };

    } catch (error) {
      console.error('Error in generateBoleto:', error);
      throw new Error(`Boleto generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get boleto status from database
   */
  async getBoletoStatus(boletoId: string): Promise<BoletoPaymentStatus | null> {
    try {
      const { data, error } = await supabase
        .from('boletos')
        .select('*')
        .eq('id', boletoId)
        .single();

      if (error) {
        console.error('Error fetching boleto status:', error);
        return null;
      }

      return {
        id: data.id,
        nossoNumero: data.nosso_numero,
        status: data.status as 'registered' | 'paid' | 'cancelled' | 'expired',
        paidAt: data.paid_at || undefined,
        paidAmount: data.paid_amount || undefined,
        paymentMethod: data.payment_method || undefined
      };

    } catch (error) {
      console.error('Error getting boleto status:', error);
      return null;
    }
  }

  /**
   * Update boleto payment status (typically called by webhooks)
   */
  async updateBoletoStatus(
    boletoId: string,
    status: 'paid' | 'expired' | 'cancelled',
    paymentData?: {
      paidAmount?: number;
      paymentMethod?: string;
      paidAt?: string;
    }
  ): Promise<boolean> {
    try {
      const updateData: BoletoUpdate = {
        status,
        ...(status === 'paid' && {
          paid_at: paymentData?.paidAt || new Date().toISOString(),
          paid_amount: paymentData?.paidAmount,
          payment_method: paymentData?.paymentMethod || 'boleto'
        })
      };

      const { error } = await supabase
        .from('boletos')
        .update(updateData)
        .eq('id', boletoId);

      if (error) {
        console.error('Error updating boleto status:', error);
        return false;
      }

      // If payment was confirmed, try auto-reconciliation
      if (status === 'paid') {
        await this.attemptAutoReconciliation(boletoId);
      }

      return true;

    } catch (error) {
      console.error('Error updating boleto status:', error);
      return false;
    }
  }

  /**
   * List boletos for a client
   */
  async getClientBoletos(clientId: string): Promise<Boleto[]> {
    try {
      const { data, error } = await supabase
        .from('boletos')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client boletos:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Error getting client boletos:', error);
      return [];
    }
  }

  /**
   * Cancel a boleto
   */
  async cancelBoleto(boletoId: string): Promise<boolean> {
    return await this.updateBoletoStatus(boletoId, 'cancelled');
  }

  /**
   * Mock payment simulation for development/testing
   */
  async simulatePayment(boletoId: string, paidAmount?: number): Promise<boolean> {
    if (!this.mockMode) {
      throw new Error('Payment simulation only available in mock mode');
    }

    return await this.updateBoletoStatus(boletoId, 'paid', {
      paidAmount,
      paymentMethod: 'boleto_bancario',
      paidAt: new Date().toISOString()
    });
  }

  // Private helper methods

  private generateNossoNumero(): string {
    // Generate unique boleto number (20 chars max for Santander)
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 6);
    return `${timestamp}${random}`.substring(0, 20);
  }

  private generateBarcode(amount: number, dueDate: string): string {
    // Simplified barcode generation (44 digits for Brazilian boletos)
    const bankCode = '033'; // Santander
    const currencyCode = '9'; // Real
    const dueFactor = this.calculateDueFactor(dueDate);
    const amountFormatted = Math.round(amount * 100).toString().padStart(10, '0');
    const checkDigit = this.calculateCheckDigit();
    const ourNumber = this.generateNossoNumero().padStart(20, '0');
    
    return `${bankCode}${currencyCode}${checkDigit}${dueFactor}${amountFormatted}${ourNumber}`;
  }

  private generateDigitableLine(barcode: string): string {
    // Convert barcode to digitable line format (5 groups)
    if (barcode.length !== 44) {
      throw new Error('Invalid barcode length');
    }

    const group1 = `${barcode.substr(0, 4)}.${barcode.substr(4, 5)}`;
    const group2 = `${barcode.substr(9, 5)}.${barcode.substr(14, 6)}`;
    const group3 = `${barcode.substr(20, 5)}.${barcode.substr(25, 6)}`;
    const group4 = barcode.substr(4, 1); // Check digit
    const group5 = barcode.substr(5, 14); // Due factor + amount

    return `${group1} ${group2} ${group3} ${group4} ${group5}`;
  }

  private calculateDueFactor(dueDate: string): string {
    // Calculate days since October 7, 1997 (boleto base date)
    const baseDate = new Date('1997-10-07');
    const targetDate = new Date(dueDate);
    const diffTime = targetDate.getTime() - baseDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString().padStart(4, '0');
  }

  private calculateCheckDigit(): string {
    // Simplified check digit calculation
    return Math.floor(Math.random() * 9 + 1).toString();
  }

  private generatePdfUrl(nossoNumero: string): string {
    if (this.mockMode) {
      return `https://mock.santander.com.br/boleto/${nossoNumero}.pdf`;
    }
    return `https://cobranca.santander.com.br/boleto/${nossoNumero}.pdf`;
  }

  private async attemptAutoReconciliation(boletoId: string): Promise<void> {
    try {
      // Get boleto details
      const { data: boleto, error: boletoError } = await supabase
        .from('boletos')
        .select('*')
        .eq('id', boletoId)
        .single();

      if (boletoError || !boleto) {
        console.error('Boleto not found for reconciliation:', boletoError);
        return;
      }

      // Call the auto-reconciliation function
      const { error: reconcileError } = await supabase.rpc('auto_reconcile_payment', {
        p_payment_type: 'boleto',
        p_payment_id: boletoId,
        p_amount: boleto.amount,
        p_client_id: boleto.client_id
      });

      if (reconcileError) {
        console.error('Auto-reconciliation failed:', reconcileError);
      } else {
        console.log('Auto-reconciliation completed for boleto:', boletoId);
      }

    } catch (error) {
      console.error('Error in auto-reconciliation:', error);
    }
  }
}

// Export singleton instance
export const boletoService = new BoletoService();