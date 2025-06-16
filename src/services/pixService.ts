// 🔄 PIX Payment Service with Database Integration
// D'Avila Reis Legal Practice Management System
// Real PIX payment processing with Supabase persistence

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types from database schema
type PixTransaction = Database['public']['Tables']['pix_transactions']['Row'];
type PixTransactionInsert = Database['public']['Tables']['pix_transactions']['Insert'];
type PixTransactionUpdate = Database['public']['Tables']['pix_transactions']['Update'];

// PIX Service Types
export interface PixChargeRequest {
  clientId: string;
  caseId?: string;
  invoiceId?: string;
  amount: number;
  description: string;
  payerName?: string;
  payerDocument?: string;
  expirationMinutes?: number;
}

export interface PixChargeResponse {
  id: string;
  txid: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  qrCode: string;
  qrCodeText: string;
  expirationDate: string;
  createdAt: string;
}

export interface PixPaymentStatus {
  id: string;
  txid: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  paidAt?: string;
  payerName?: string;
  payerDocument?: string;
  payerBank?: string;
}

export class PixService {
  private readonly pixKey: string;
  private readonly mockMode: boolean;

  constructor(pixKey: string = '11999999999', mockMode: boolean = true) {
    this.pixKey = pixKey;
    this.mockMode = mockMode;
  }

  /**
   * Create a PIX charge and save to database
   */
  async createPixCharge(request: PixChargeRequest): Promise<PixChargeResponse> {
    try {
      // Generate PIX transaction data
      const txid = this.generateTxId();
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + (request.expirationMinutes || 60));

      // Generate PIX codes (mock implementation for development)
      const pixPayload = this.generatePixPayload(txid, request.amount, request.description);
      const qrCode = await this.generateQRCode(pixPayload);

      // Create database record
      const pixTransaction: PixTransactionInsert = {
        client_id: request.clientId,
        case_id: request.caseId || null,
        invoice_id: request.invoiceId || null,
        txid,
        amount: request.amount,
        description: request.description,
        pix_key: this.pixKey,
        pix_key_type: this.getPixKeyType(this.pixKey),
        qr_code: qrCode,
        qr_code_text: pixPayload,
        br_code: pixPayload,
        status: 'pending',
        expiration_date: expirationDate.toISOString(),
        payer_name: request.payerName || null,
        payer_document: request.payerDocument || null
      };

      const { data, error } = await supabase
        .from('pix_transactions')
        .insert(pixTransaction)
        .select()
        .single();

      if (error) {
        console.error('Error creating PIX transaction:', error);
        throw new Error(`Failed to create PIX transaction: ${error.message}`);
      }

      // Return response format
      return {
        id: data.id,
        txid: data.txid,
        amount: data.amount,
        status: data.status as 'pending',
        qrCode: data.qr_code!,
        qrCodeText: data.qr_code_text!,
        expirationDate: data.expiration_date!,
        createdAt: data.created_at!
      };

    } catch (error) {
      console.error('Error in createPixCharge:', error);
      throw new Error(`PIX charge creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get PIX payment status from database
   */
  async getPixStatus(pixId: string): Promise<PixPaymentStatus | null> {
    try {
      const { data, error } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('id', pixId)
        .single();

      if (error) {
        console.error('Error fetching PIX status:', error);
        return null;
      }

      return {
        id: data.id,
        txid: data.txid,
        status: data.status as 'pending' | 'paid' | 'expired' | 'cancelled',
        paidAt: data.paid_at || undefined,
        payerName: data.payer_name || undefined,
        payerDocument: data.payer_document || undefined,
        payerBank: data.payer_bank || undefined
      };

    } catch (error) {
      console.error('Error getting PIX status:', error);
      return null;
    }
  }

  /**
   * Update PIX payment status (typically called by webhooks)
   */
  async updatePixStatus(
    pixId: string,
    status: 'paid' | 'expired' | 'cancelled',
    paymentData?: {
      payerName?: string;
      payerDocument?: string;
      payerBank?: string;
      paidAt?: string;
    }
  ): Promise<boolean> {
    try {
      const updateData: PixTransactionUpdate = {
        status,
        ...(status === 'paid' && {
          paid_at: paymentData?.paidAt || new Date().toISOString(),
          payer_name: paymentData?.payerName,
          payer_document: paymentData?.payerDocument,
          payer_bank: paymentData?.payerBank
        })
      };

      const { error } = await supabase
        .from('pix_transactions')
        .update(updateData)
        .eq('id', pixId);

      if (error) {
        console.error('Error updating PIX status:', error);
        return false;
      }

      // If payment was confirmed, try auto-reconciliation
      if (status === 'paid') {
        await this.attemptAutoReconciliation(pixId);
      }

      return true;

    } catch (error) {
      console.error('Error updating PIX status:', error);
      return false;
    }
  }

  /**
   * List PIX transactions for a client
   */
  async getClientPixTransactions(clientId: string): Promise<PixTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client PIX transactions:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Error getting client PIX transactions:', error);
      return [];
    }
  }

  /**
   * Mock payment simulation for development/testing
   */
  async simulatePayment(pixId: string, payerName: string = 'Test Payer'): Promise<boolean> {
    if (!this.mockMode) {
      throw new Error('Payment simulation only available in mock mode');
    }

    return await this.updatePixStatus(pixId, 'paid', {
      payerName,
      payerDocument: '123.456.789-00',
      payerBank: '033', // Santander
      paidAt: new Date().toISOString()
    });
  }

  // Private helper methods

  private generateTxId(): string {
    // Generate unique transaction ID (35 chars max for PIX)
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${random}`.substring(0, 35);
  }

  private getPixKeyType(key: string): string {
    if (/^\d{11}$/.test(key)) return 'phone';
    if (/^\d{11}$/.test(key.replace(/[^\d]/g, ''))) return 'cpf';
    if (/^\d{14}$/.test(key.replace(/[^\d]/g, ''))) return 'cnpj';
    if (/@/.test(key)) return 'email';
    return 'random';
  }

  private generatePixPayload(txid: string, amount: number, description: string): string {
    // Simplified PIX payload generation (EMV format)
    // In production, use proper PIX payload library
    const merchantName = "D'AVILA REIS ADVOGADOS";
    const merchantCity = "SAO PAULO";
    const pixKey = this.pixKey;
    
    return `00020126580014BR.GOV.BCB.PIX0136${pixKey}${txid}5204000053039865406${amount.toFixed(2)}5802BR5925${merchantName}6009${merchantCity}62070503***6304`;
  }

  private async generateQRCode(payload: string): Promise<string> {
    // Mock QR code generation - replace with actual QR code library
    if (this.mockMode) {
      return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
    }
    
    // In production, use qrcode library:
    // const QRCode = require('qrcode');
    // return await QRCode.toDataURL(payload);
    return payload; // Fallback
  }

  private async attemptAutoReconciliation(pixId: string): Promise<void> {
    try {
      // Get PIX transaction details
      const { data: pixTx, error: pixError } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('id', pixId)
        .single();

      if (pixError || !pixTx) {
        console.error('PIX transaction not found for reconciliation:', pixError);
        return;
      }

      // Call the auto-reconciliation function
      const { error: reconcileError } = await supabase.rpc('auto_reconcile_payment', {
        p_payment_type: 'pix',
        p_payment_id: pixId,
        p_amount: pixTx.amount,
        p_client_id: pixTx.client_id
      });

      if (reconcileError) {
        console.error('Auto-reconciliation failed:', reconcileError);
      } else {
        console.log('Auto-reconciliation completed for PIX:', pixId);
      }

    } catch (error) {
      console.error('Error in auto-reconciliation:', error);
    }
  }
}

// Export singleton instance
export const pixService = new PixService();