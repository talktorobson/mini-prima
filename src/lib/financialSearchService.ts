// 🔍 ENHANCED FINANCIAL SEARCH SERVICE
// D'Avila Reis Legal Practice Management System
// High-Performance Search with GIN Indexes and Advanced Filtering

import { supabase } from '@/integrations/supabase/client';
import type { Supplier, Bill, Invoice } from './financialService';

// =====================================================
// ENHANCED SEARCH INTERFACES
// =====================================================

export interface SearchFilters {
  // General filters
  search?: string;
  limit?: number;
  page?: number;
  
  // Status filters
  status?: string;
  active?: boolean;
  
  // Financial filters
  amount_min?: number;
  amount_max?: number;
  
  // Date filters
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  
  // Relationship filters
  supplier_id?: string;
  client_id?: string;
  category_id?: string;
  
  // Sorting
  sort_by?: 'relevance' | 'date' | 'amount' | 'name' | 'due_date';
  sort_order?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  data: T[];
  total_count: number;
  search_time_ms: number;
  page_info: {
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  aggregations?: {
    by_status?: Record<string, number>;
    by_category?: Record<string, number>;
    amount_stats?: {
      min: number;
      max: number;
      avg: number;
      total: number;
    };
  };
}

export interface SupplierSearchResult extends Supplier {
  search_rank?: number;
  total_bills?: number;
  total_amount_owed?: number;
  last_payment_date?: string;
}

export interface BillSearchResult extends Bill {
  search_rank?: number;
  supplier_name?: string;
  category_name?: string;
  days_until_due?: number;
  is_overdue?: boolean;
}

export interface InvoiceSearchResult extends Invoice {
  search_rank?: number;
  client_name?: string;
  days_until_due?: number;
  is_overdue?: boolean;
}

// =====================================================
// OPTIMIZED SEARCH SERVICE
// =====================================================

export const financialSearchService = {

  // ================== SUPPLIER SEARCH ==================

  async searchSuppliers(filters: SearchFilters = {}): Promise<SearchResult<SupplierSearchResult>> {
    const start_time = performance.now();
    
    try {
      // Use the optimized database function for best performance
      const { data, error, count } = await supabase
        .rpc('search_suppliers_optimized', {
          search_term: filters.search || '',
          active_only: filters.active !== false,
          limit_results: filters.limit || 20
        });

      if (error) {
        console.error('Error searching suppliers:', error);
        throw error;
      }

      // Get additional metrics for each supplier
      const supplierIds = data?.map(s => s.id) || [];
      let billMetrics: any[] = [];
      
      if (supplierIds.length > 0) {
        const { data: metrics } = await supabase
          .from('bills')
          .select('supplier_id, total_amount, payment_date, status')
          .in('supplier_id', supplierIds);
        billMetrics = metrics || [];
      }

      // Enhance results with additional data
      const enhancedResults: SupplierSearchResult[] = (data || []).map(supplier => {
        const supplierBills = billMetrics.filter(b => b.supplier_id === supplier.id);
        const totalAmount = supplierBills
          .filter(b => b.status !== 'paid')
          .reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
        
        const lastPayment = supplierBills
          .filter(b => b.payment_date)
          .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];

        return {
          ...supplier,
          total_bills: supplierBills.length,
          total_amount_owed: totalAmount,
          last_payment_date: lastPayment?.payment_date || null
        };
      });

      const search_time = performance.now() - start_time;
      const total_count = count || enhancedResults.length;
      const current_page = filters.page || 1;
      const page_size = filters.limit || 20;

      return {
        data: enhancedResults,
        total_count,
        search_time_ms: Math.round(search_time),
        page_info: {
          current_page,
          total_pages: Math.ceil(total_count / page_size),
          has_next: current_page * page_size < total_count,
          has_previous: current_page > 1
        }
      };

    } catch (error) {
      console.error('Supplier search failed:', error);
      throw error;
    }
  },

  // ================== BILLS SEARCH ==================

  async searchBills(filters: SearchFilters = {}): Promise<SearchResult<BillSearchResult>> {
    const start_time = performance.now();
    
    try {
      const { data, error } = await supabase
        .rpc('search_bills_optimized', {
          search_term: filters.search || '',
          status_filter: filters.status || '',
          supplier_id_filter: filters.supplier_id || null,
          category_id_filter: filters.category_id || null,
          amount_min: filters.amount_min || null,
          amount_max: filters.amount_max || null,
          due_date_from: filters.due_date_from || null,
          due_date_to: filters.due_date_to || null,
          limit_results: filters.limit || 50
        });

      if (error) {
        console.error('Error searching bills:', error);
        throw error;
      }

      // Calculate additional fields
      const today = new Date();
      const enhancedResults: BillSearchResult[] = (data || []).map(bill => {
        const dueDate = new Date(bill.due_date);
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...bill,
          days_until_due: daysDiff,
          is_overdue: daysDiff < 0
        };
      });

      // Get aggregations for analytics
      const aggregations = await this.getBillsAggregations(filters);

      const search_time = performance.now() - start_time;
      const total_count = enhancedResults.length;
      const current_page = filters.page || 1;
      const page_size = filters.limit || 50;

      return {
        data: enhancedResults,
        total_count,
        search_time_ms: Math.round(search_time),
        page_info: {
          current_page,
          total_pages: Math.ceil(total_count / page_size),
          has_next: current_page * page_size < total_count,
          has_previous: current_page > 1
        },
        aggregations
      };

    } catch (error) {
      console.error('Bills search failed:', error);
      throw error;
    }
  },

  // ================== INVOICES SEARCH ==================

  async searchInvoices(filters: SearchFilters = {}): Promise<SearchResult<InvoiceSearchResult>> {
    const start_time = performance.now();
    
    try {
      // Check if invoices table exists first
      const { data, error } = await supabase
        .rpc('search_invoices_optimized', {
          search_term: filters.search || '',
          status_filter: filters.status || '',
          client_id_filter: filters.client_id || null,
          amount_min: filters.amount_min || null,
          amount_max: filters.amount_max || null,
          due_date_from: filters.due_date_from || null,
          due_date_to: filters.due_date_to || null,
          limit_results: filters.limit || 50
        })
        .catch(() => {
          // Fallback if function doesn't exist
          return { data: [], error: null };
        });

      if (error) {
        console.error('Error searching invoices:', error);
        throw error;
      }

      // Calculate additional fields
      const today = new Date();
      const enhancedResults: InvoiceSearchResult[] = (data || []).map(invoice => {
        const dueDate = new Date(invoice.due_date);
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...invoice,
          days_until_due: daysDiff,
          is_overdue: daysDiff < 0
        };
      });

      const search_time = performance.now() - start_time;
      const total_count = enhancedResults.length;
      const current_page = filters.page || 1;
      const page_size = filters.limit || 50;

      return {
        data: enhancedResults,
        total_count,
        search_time_ms: Math.round(search_time),
        page_info: {
          current_page,
          total_pages: Math.ceil(total_count / page_size),
          has_next: current_page * page_size < total_count,
          has_previous: current_page > 1
        }
      };

    } catch (error) {
      console.error('Invoices search failed:', error);
      // Return empty results instead of throwing on missing table
      return {
        data: [],
        total_count: 0,
        search_time_ms: 0,
        page_info: {
          current_page: 1,
          total_pages: 1,
          has_next: false,
          has_previous: false
        }
      };
    }
  },

  // ================== UNIFIED SEARCH ==================

  async searchAllFinancialRecords(filters: SearchFilters = {}) {
    const [suppliers, bills, invoices] = await Promise.all([
      this.searchSuppliers({ ...filters, limit: 10 }),
      this.searchBills({ ...filters, limit: 10 }),
      this.searchInvoices({ ...filters, limit: 10 }).catch(() => ({ data: [], total_count: 0 }))
    ]);

    return {
      suppliers: suppliers.data,
      bills: bills.data,
      invoices: invoices.data,
      totals: {
        suppliers: suppliers.total_count,
        bills: bills.total_count,
        invoices: invoices.total_count
      },
      search_time_ms: Math.max(
        suppliers.search_time_ms,
        bills.search_time_ms,
        invoices.search_time_ms || 0
      )
    };
  },

  // ================== ANALYTICS & AGGREGATIONS ==================

  async getBillsAggregations(filters: SearchFilters = {}) {
    try {
      // Get status aggregations
      const { data: statusData } = await supabase
        .from('bills')
        .select('status, total_amount')
        .filter('status', 'neq', 'cancelled');

      // Get category aggregations
      const { data: categoryData } = await supabase
        .from('bills')
        .select('category_id, expense_categories(name), total_amount')
        .filter('status', 'neq', 'cancelled');

      const by_status = statusData?.reduce((acc, bill) => {
        acc[bill.status] = (acc[bill.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const by_category = categoryData?.reduce((acc, bill) => {
        const categoryName = (bill as any).expense_categories?.name || 'Sem categoria';
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const amounts = statusData?.map(b => parseFloat(b.total_amount)) || [];
      const amount_stats = amounts.length > 0 ? {
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        avg: amounts.reduce((sum, val) => sum + val, 0) / amounts.length,
        total: amounts.reduce((sum, val) => sum + val, 0)
      } : { min: 0, max: 0, avg: 0, total: 0 };

      return {
        by_status,
        by_category,
        amount_stats
      };

    } catch (error) {
      console.error('Error getting bills aggregations:', error);
      return {};
    }
  },

  // ================== SEARCH SUGGESTIONS ==================

  async getSearchSuggestions(query: string, type: 'suppliers' | 'bills' | 'invoices' = 'bills') {
    if (!query || query.length < 2) return [];

    try {
      switch (type) {
        case 'suppliers':
          const { data: suppliers } = await supabase
            .from('suppliers')
            .select('name, email, category')
            .ilike('name', `%${query}%`)
            .eq('is_active', true)
            .limit(5);
          
          return suppliers?.map(s => ({
            label: s.name,
            value: s.name,
            type: 'supplier',
            metadata: { email: s.email, category: s.category }
          })) || [];

        case 'bills':
          const { data: bills } = await supabase
            .from('bills')
            .select('bill_number, description, suppliers(name)')
            .or(`bill_number.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(5);
          
          return bills?.map(b => ({
            label: b.bill_number || b.description,
            value: b.bill_number || b.description,
            type: 'bill',
            metadata: { supplier: (b as any).suppliers?.name }
          })) || [];

        case 'invoices':
          const { data: invoices } = await supabase
            .from('invoices')
            .select('invoice_number, description, clients(company_name)')
            .or(`invoice_number.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(5)
            .catch(() => ({ data: [] }));
          
          return invoices?.map(i => ({
            label: i.invoice_number || i.description,
            value: i.invoice_number || i.description,
            type: 'invoice',
            metadata: { client: (i as any).clients?.company_name }
          })) || [];

        default:
          return [];
      }
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  },

  // ================== SEARCH ANALYTICS ==================

  async getSearchAnalytics() {
    try {
      const { data } = await supabase
        .from('financial_search_analytics')
        .select('*');

      return data || [];
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return [];
    }
  },

  // ================== PERFORMANCE UTILITIES ==================

  async refreshSearchAnalytics() {
    try {
      await supabase.rpc('refresh_financial_search_analytics');
      return true;
    } catch (error) {
      console.error('Error refreshing search analytics:', error);
      return false;
    }
  }
};

export default financialSearchService;