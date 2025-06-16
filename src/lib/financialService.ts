// 💼 FINANCIAL MANAGEMENT SERVICE
// D'Avila Reis Legal Practice Management System
// Comprehensive Accounts Payable & Receivable Management

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  tax_id?: string;
  payment_terms: number;
  preferred_payment_method: 'transfer' | 'check' | 'pix' | 'boleto';
  bank_info?: Record<string, any>;
  notes?: string;
  notifications_enabled: boolean;
  auto_send_confirmation: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  parent_category_id?: string;
  is_tax_deductible: boolean;
  accounting_code?: string;
  budget_amount: number;
  is_active: boolean;
  created_at: string;
}

export interface Bill {
  id: string;
  supplier_id: string;
  category_id: string;
  bill_number?: string;
  reference_number?: string;
  description: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  due_date: string;
  issue_date: string;
  received_date: string;
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'overdue' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  payment_type: 'one_time' | 'installments' | 'recurring';
  installments: number;
  installment_frequency: 'weekly' | 'monthly' | 'quarterly';
  recurring_period?: 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
  recurring_end_date?: string;
  attachment_url?: string;
  payment_proof_url?: string;
  contract_url?: string;
  approval_required: boolean;
  approval_threshold: number;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  paid_amount: number;
  remaining_amount: number;
  paid_date?: string;
  payment_method?: string;
  payment_reference?: string;
  auto_approve: boolean;
  auto_pay: boolean;
  notes?: string;
  internal_notes?: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  category?: ExpenseCategory;
}

export interface Invoice {
  id: string;
  client_id: string;
  case_id?: string;
  subscription_id?: string;
  invoice_number: string;
  reference_number?: string;
  description: string;
  invoice_date: string;
  due_date: string;
  service_period_start?: string;
  service_period_end?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'draft' | 'sent' | 'viewed' | 'partial_paid' | 'paid' | 'overdue' | 'cancelled' | 'disputed';
  collection_status: 'none' | 'reminder_sent' | 'first_notice' | 'second_notice' | 'collection_agency' | 'legal_action';
  last_reminder_sent?: string;
  next_follow_up_date?: string;
  payment_terms: number;
  late_fee_percentage: number;
  early_payment_discount_percentage: number;
  early_payment_discount_days: number;
  pdf_url?: string;
  payment_proof_url?: string;
  subscription_discount_applied: number;
  subscription_discount_percentage: number;
  notes?: string;
  internal_notes?: string;
  created_by: string;
  updated_by?: string;
  sent_at?: string;
  first_viewed_at?: string;
  created_at: string;
  updated_at: string;
  client?: any;
  case?: any;
  line_items?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  service_type_id?: string;
  case_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  billable_hours: number;
  hourly_rate: number;
  staff_id?: string;
  is_subscription_quota: boolean;
  quota_type?: 'consulting_hours' | 'document_review' | 'legal_questions';
  discount_percentage: number;
  discount_amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_type: 'payable' | 'receivable';
  reference_id: string;
  reference_table: 'bills' | 'invoices';
  amount: number;
  payment_date: string;
  received_date?: string;
  payment_method: 'transfer' | 'pix' | 'boleto' | 'check' | 'cash' | 'credit_card' | 'debit_card';
  payment_processor?: string;
  reference_number?: string;
  bank_account?: string;
  bank_code?: string;
  proof_url?: string;
  receipt_url?: string;
  processing_fee: number;
  exchange_rate: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  auto_reconciled: boolean;
  reconciliation_date?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentInstallment {
  id: string;
  reference_type: 'bill' | 'invoice';
  reference_id: string;
  installment_number: number;
  total_installments: number;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled';
  late_fee_amount: number;
  late_fee_applied_date?: string;
  payment_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialAlert {
  id: string;
  alert_type: 'due_date' | 'overdue' | 'payment_received' | 'payment_made' | 'approval_required' | 'budget_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reference_type?: 'bill' | 'invoice' | 'payment' | 'budget';
  reference_id?: string;
  title: string;
  message: string;
  assigned_to?: string;
  department?: string;
  is_read: boolean;
  is_dismissed: boolean;
  auto_dismiss_date?: string;
  requires_action: boolean;
  action_type?: string;
  action_url?: string;
  created_at: string;
  read_at?: string;
  dismissed_at?: string;
}

// =====================================================
// FINANCIAL DASHBOARD ANALYTICS
// =====================================================

export interface FinancialDashboardData {
  cashFlow: {
    currentBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netCashFlow: number;
    projectedBalance: number;
  };
  accountsPayable: {
    totalOutstanding: number;
    overdueAmount: number;
    dueSoon: number; // Due in next 7 days
    pendingApproval: number;
  };
  accountsReceivable: {
    totalOutstanding: number;
    overdueAmount: number;
    currentAmount: number;
    collectionEfficiency: number;
  };
  alerts: FinancialAlert[];
  recentTransactions: Payment[];
}

export interface AgingReport {
  type: 'payable' | 'receivable';
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90Days: number;
  total: number;
}

export interface CashFlowProjection {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  netCashFlow: number;
  runningBalance: number;
}

// =====================================================
// SUPPLIER MANAGEMENT SERVICE
// =====================================================

export const supplierService = {
  
  // Get all suppliers with filtering
  async getSuppliers(filters?: {
    active?: boolean;
    search?: string;
    category?: string;
  }): Promise<Supplier[]> {
    let query = supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (filters?.active !== undefined) {
      query = query.eq('is_active', filters.active);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }

    return data || [];
  },

  // Get supplier by ID
  async getSupplier(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }

    return data;
  },

  // Create new supplier
  async createSupplier(supplierData: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        ...supplierData,
        created_by: supplierData.created_by || 'system'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }

    return data;
  },

  // Update supplier
  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }

    return data;
  },

  // Delete supplier (soft delete)
  async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }
};

// =====================================================
// BILLS MANAGEMENT SERVICE (ACCOUNTS PAYABLE)
// =====================================================

export const billsService = {

  // Get all bills with filtering and relationships
  async getBills(filters?: {
    status?: string;
    supplier_id?: string;
    category_id?: string;
    due_date_from?: string;
    due_date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Bill[]> {
    let query = supabase
      .from('bills')
      .select(`
        *,
        supplier:suppliers(*),
        category:expense_categories(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters?.due_date_from) {
      query = query.gte('due_date', filters.due_date_from);
    }

    if (filters?.due_date_to) {
      query = query.lte('due_date', filters.due_date_to);
    }

    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%,bill_number.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }

    return data || [];
  },

  // Get bill by ID
  async getBill(id: string): Promise<Bill | null> {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        supplier:suppliers(*),
        category:expense_categories(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }

    return data;
  },

  // Create new bill
  async createBill(billData: Partial<Bill>): Promise<Bill> {
    // Generate bill number if not provided
    if (!billData.bill_number) {
      const { count } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true });
      
      billData.bill_number = `BILL-${String(count + 1).padStart(6, '0')}`;
    }

    const { data, error } = await supabase
      .from('bills')
      .insert([billData])
      .select(`
        *,
        supplier:suppliers(*),
        category:expense_categories(*)
      `)
      .single();

    if (error) {
      console.error('Error creating bill:', error);
      throw error;
    }

    // Create alert if approval required
    if (data.approval_required && data.amount >= data.approval_threshold) {
      await this.createFinancialAlert({
        alert_type: 'approval_required',
        reference_type: 'bill',
        reference_id: data.id,
        title: `Bill Approval Required: ${data.bill_number}`,
        message: `Bill from ${data.supplier?.name} for R$ ${data.total_amount.toLocaleString('pt-BR')} requires approval`,
        severity: data.amount > 10000 ? 'high' : 'medium',
        department: 'financial'
      });
    }

    return data;
  },

  // Update bill
  async updateBill(id: string, billData: Partial<Bill>): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills')
      .update(billData)
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(*),
        category:expense_categories(*)
      `)
      .single();

    if (error) {
      console.error('Error updating bill:', error);
      throw error;
    }

    return data;
  },

  // Approve bill
  async approveBill(id: string, approverId: string, notes?: string): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        approval_notes: notes
      })
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(*),
        category:expense_categories(*)
      `)
      .single();

    if (error) {
      console.error('Error approving bill:', error);
      throw error;
    }

    return data;
  },

  // Mark bill as paid
  async markBillAsPaid(
    id: string, 
    paymentData: {
      amount: number;
      payment_date: string;
      payment_method: string;
      reference_number?: string;
      proof_url?: string;
      notes?: string;
    },
    paidBy: string
  ): Promise<void> {
    const bill = await this.getBill(id);
    if (!bill) throw new Error('Bill not found');

    // Start transaction
    const { error: billError } = await supabase
      .from('bills')
      .update({
        paid_amount: bill.paid_amount + paymentData.amount,
        status: (bill.paid_amount + paymentData.amount >= bill.total_amount) ? 'paid' : 'approved',
        paid_date: (bill.paid_amount + paymentData.amount >= bill.total_amount) ? paymentData.payment_date : null,
        payment_method: paymentData.payment_method,
        payment_reference: paymentData.reference_number,
        payment_proof_url: paymentData.proof_url
      })
      .eq('id', id);

    if (billError) {
      console.error('Error updating bill payment:', billError);
      throw billError;
    }

    // Record payment transaction
    const { error: paymentError } = await supabase
      .from('payments')
      .insert([{
        payment_type: 'payable',
        reference_id: id,
        reference_table: 'bills',
        amount: paymentData.amount,
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number,
        proof_url: paymentData.proof_url,
        notes: paymentData.notes,
        status: 'completed',
        created_by: paidBy
      }]);

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      throw paymentError;
    }

    // Send notification to supplier if enabled
    if (bill.supplier?.notifications_enabled && bill.supplier?.email) {
      await this.createFinancialAlert({
        alert_type: 'payment_made',
        reference_type: 'bill',
        reference_id: id,
        title: `Payment Made: ${bill.bill_number}`,
        message: `Payment of R$ ${paymentData.amount.toLocaleString('pt-BR')} has been made for bill ${bill.bill_number}`,
        severity: 'low'
      });
    }
  },

  // Get overdue bills
  async getOverdueBills(): Promise<Bill[]> {
    return this.getBills({
      status: 'overdue'
    });
  },

  // Get bills due soon (next 7 days)
  async getBillsDueSoon(): Promise<Bill[]> {
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.getBills({
      due_date_from: today,
      due_date_to: weekFromNow,
      status: 'approved'
    });
  },

  // Create financial alert
  async createFinancialAlert(alertData: Partial<FinancialAlert>): Promise<FinancialAlert> {
    const { data, error } = await supabase
      .from('financial_alerts')
      .insert([alertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating financial alert:', error);
      throw error;
    }

    return data;
  }
};

// =====================================================
// INVOICES MANAGEMENT SERVICE (ACCOUNTS RECEIVABLE)
// =====================================================

export const invoicesService = {

  // Get all invoices with filtering
  async getInvoices(filters?: {
    status?: string;
    client_id?: string;
    case_id?: string;
    due_date_from?: string;
    due_date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Invoice[]> {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        case:cases(*),
        line_items:invoice_line_items(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters?.case_id) {
      query = query.eq('case_id', filters.case_id);
    }

    if (filters?.due_date_from) {
      query = query.gte('due_date', filters.due_date_from);
    }

    if (filters?.due_date_to) {
      query = query.lte('due_date', filters.due_date_to);
    }

    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    return data || [];
  },

  // Get invoice by ID
  async getInvoice(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        case:cases(*),
        line_items:invoice_line_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }

    return data;
  },

  // Create new invoice
  async createInvoice(invoiceData: Partial<Invoice>, lineItems: Partial<InvoiceLineItem>[]): Promise<Invoice> {
    // Generate invoice number if not provided
    if (!invoiceData.invoice_number) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`);
      
      invoiceData.invoice_number = `${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }

    // Calculate subtotal from line items
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    invoiceData.subtotal = subtotal;

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw invoiceError;
    }

    // Add line items
    const lineItemsWithInvoiceId = lineItems.map(item => ({
      ...item,
      invoice_id: invoice.id
    }));

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsWithInvoiceId);

    if (lineItemsError) {
      console.error('Error creating invoice line items:', lineItemsError);
      throw lineItemsError;
    }

    return this.getInvoice(invoice.id);
  },

  // Send invoice to client
  async sendInvoice(id: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error sending invoice:', error);
      throw error;
    }

    // Create alert for sent invoice
    await billsService.createFinancialAlert({
      alert_type: 'payment_received',
      reference_type: 'invoice',
      reference_id: id,
      title: `Invoice Sent: ${data.invoice_number}`,
      message: `Invoice ${data.invoice_number} has been sent to client`,
      severity: 'low'
    });

    return data;
  },

  // Record payment received
  async recordPayment(
    id: string,
    paymentData: {
      amount: number;
      payment_date: string;
      payment_method: string;
      reference_number?: string;
      proof_url?: string;
      notes?: string;
    },
    recordedBy: string
  ): Promise<void> {
    const invoice = await this.getInvoice(id);
    if (!invoice) throw new Error('Invoice not found');

    // Update invoice
    const newPaidAmount = invoice.paid_amount + paymentData.amount;
    const newStatus = newPaidAmount >= invoice.total_amount ? 'paid' : 'partial_paid';

    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        status: newStatus
      })
      .eq('id', id);

    if (invoiceError) {
      console.error('Error updating invoice payment:', invoiceError);
      throw invoiceError;
    }

    // Record payment transaction
    const { error: paymentError } = await supabase
      .from('payments')
      .insert([{
        payment_type: 'receivable',
        reference_id: id,
        reference_table: 'invoices',
        amount: paymentData.amount,
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number,
        proof_url: paymentData.proof_url,
        notes: paymentData.notes,
        status: 'completed',
        created_by: recordedBy
      }]);

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      throw paymentError;
    }

    // Create payment received alert
    await billsService.createFinancialAlert({
      alert_type: 'payment_received',
      reference_type: 'invoice',
      reference_id: id,
      title: `Payment Received: ${invoice.invoice_number}`,
      message: `Payment of R$ ${paymentData.amount.toLocaleString('pt-BR')} received for invoice ${invoice.invoice_number}`,
      severity: 'low'
    });
  },

  // Get overdue invoices
  async getOverdueInvoices(): Promise<Invoice[]> {
    return this.getInvoices({
      status: 'overdue'
    });
  },

  // Get aging report
  async getAgingReport(): Promise<AgingReport> {
    const { data, error } = await supabase
      .from('accounts_receivable_aging')
      .select('*');

    if (error) {
      console.error('Error fetching aging report:', error);
      throw error;
    }

    const aging = {
      type: 'receivable' as const,
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      over90Days: 0,
      total: 0
    };

    data?.forEach(item => {
      const amount = item.remaining_amount || 0;
      aging.total += amount;

      switch (item.aging_bucket) {
        case 'Current':
          aging.current += amount;
          break;
        case '1-30 Days':
          aging.days1to30 += amount;
          break;
        case '31-60 Days':
          aging.days31to60 += amount;
          break;
        case '61-90 Days':
          aging.days61to90 += amount;
          break;
        case '90+ Days':
          aging.over90Days += amount;
          break;
      }
    });

    return aging;
  }
};

// =====================================================
// FINANCIAL ANALYTICS SERVICE
// =====================================================

export const financialAnalyticsService = {

  // Get financial dashboard data
  async getDashboardData(): Promise<FinancialDashboardData> {
    // Get cash flow data
    const { data: cashFlowData, error: cashFlowError } = await supabase
      .from('monthly_financial_summary')
      .select('*')
      .order('month', { ascending: false })
      .limit(1)
      .single();

    if (cashFlowError) {
      console.error('Error fetching cash flow data:', cashFlowError);
    }

    // Get accounts payable summary
    const { data: payableData, error: payableError } = await supabase
      .from('bills')
      .select('status, total_amount, remaining_amount, due_date')
      .in('status', ['pending', 'approved', 'overdue']);

    if (payableError) {
      console.error('Error fetching payable data:', payableError);
    }

    // Get accounts receivable summary
    const { data: receivableData, error: receivableError } = await supabase
      .from('invoices')
      .select('status, total_amount, remaining_amount, due_date')
      .in('status', ['sent', 'viewed', 'partial_paid', 'overdue']);

    if (receivableError) {
      console.error('Error fetching receivable data:', receivableError);
    }

    // Get recent alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('financial_alerts')
      .select('*')
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
    }

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'completed')
      .order('payment_date', { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
    }

    // Calculate metrics
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const payableMetrics = {
      totalOutstanding: payableData?.reduce((sum, bill) => sum + bill.remaining_amount, 0) || 0,
      overdueAmount: payableData?.filter(bill => bill.status === 'overdue').reduce((sum, bill) => sum + bill.remaining_amount, 0) || 0,
      dueSoon: payableData?.filter(bill => bill.due_date >= today && bill.due_date <= weekFromNow).reduce((sum, bill) => sum + bill.remaining_amount, 0) || 0,
      pendingApproval: payableData?.filter(bill => bill.status === 'pending').reduce((sum, bill) => sum + bill.total_amount, 0) || 0
    };

    const receivableMetrics = {
      totalOutstanding: receivableData?.reduce((sum, invoice) => sum + invoice.remaining_amount, 0) || 0,
      overdueAmount: receivableData?.filter(invoice => invoice.status === 'overdue').reduce((sum, invoice) => sum + invoice.remaining_amount, 0) || 0,
      currentAmount: receivableData?.filter(invoice => invoice.due_date >= today).reduce((sum, invoice) => sum + invoice.remaining_amount, 0) || 0,
      collectionEfficiency: 85 // This would be calculated based on historical data
    };

    return {
      cashFlow: {
        currentBalance: (cashFlowData?.total_revenue || 0) - (cashFlowData?.total_expenses || 0),
        monthlyIncome: cashFlowData?.total_revenue || 0,
        monthlyExpenses: cashFlowData?.total_expenses || 0,
        netCashFlow: cashFlowData?.net_profit || 0,
        projectedBalance: 0 // This would be calculated based on projections
      },
      accountsPayable: payableMetrics,
      accountsReceivable: receivableMetrics,
      alerts: alerts || [],
      recentTransactions: transactions || []
    };
  },

  // Get cash flow projections
  async getCashFlowProjections(months: number = 6): Promise<CashFlowProjection[]> {
    const { data, error } = await supabase
      .from('monthly_financial_summary')
      .select('*')
      .order('month', { ascending: false })
      .limit(months);

    if (error) {
      console.error('Error fetching cash flow projections:', error);
      throw error;
    }

    let runningBalance = 0;
    
    return (data || []).reverse().map(monthData => {
      runningBalance += monthData.net_profit;
      
      return {
        month: monthData.month,
        projectedIncome: monthData.total_revenue,
        projectedExpenses: monthData.total_expenses,
        netCashFlow: monthData.net_profit,
        runningBalance
      };
    });
  },

  // Export to Excel functionality
  async exportToExcel(
    type: 'bills' | 'invoices' | 'payments',
    filters?: any
  ): Promise<Blob> {
    let data: any[] = [];
    
    switch (type) {
      case 'bills':
        data = await billsService.getBills(filters);
        break;
      case 'invoices':
        data = await invoicesService.getInvoices(filters);
        break;
      case 'payments':
        const { data: paymentsData, error } = await supabase
          .from('payments')
          .select('*')
          .order('payment_date', { ascending: false });
        
        if (error) throw error;
        data = paymentsData || [];
        break;
    }

    // Convert to CSV format (simplified Excel export)
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' ? `"${row[header]}"` : row[header]
        ).join(',')
      )
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }
};