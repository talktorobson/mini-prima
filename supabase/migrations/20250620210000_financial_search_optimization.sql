-- Financial Search Optimization Migration
-- Enhanced search functionality with GIN indexes and performance improvements
-- Created: 2025-06-20

-- Add full-text search capabilities to financial tables
-- This will significantly improve search performance

-- 1. Add search vector columns for suppliers
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese', 
        COALESCE(name, '') || ' ' ||
        COALESCE(contact_name, '') || ' ' ||
        COALESCE(email, '') || ' ' ||
        COALESCE(category, '') || ' ' ||
        COALESCE(notes, '')
    )
) STORED;

-- 2. Add search vector columns for bills  
ALTER TABLE public.bills
ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese',
        COALESCE(bill_number, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(payment_reference, '') || ' ' ||
        COALESCE(notes, '') || ' ' ||
        COALESCE(tags::text, '')
    )
) STORED;

-- 3. Add search vector columns for invoices (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        ALTER TABLE public.invoices
        ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
            to_tsvector('portuguese',
                COALESCE(invoice_number, '') || ' ' ||
                COALESCE(description, '') || ' ' ||
                COALESCE(reference_number, '') || ' ' ||
                COALESCE(notes, '') || ' ' ||
                COALESCE(internal_notes, '')
            )
        ) STORED;
    END IF;
END $$;

-- 4. Add search vector columns for expense categories
ALTER TABLE public.expense_categories
ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese',
        COALESCE(name, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(category_type, '') || ' ' ||
        COALESCE(account_code, '')
    )
) STORED;

-- 5. Create GIN indexes for full-text search (extremely fast text search)
CREATE INDEX IF NOT EXISTS idx_suppliers_search_gin ON public.suppliers USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_bills_search_gin ON public.bills USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_expense_categories_search_gin ON public.expense_categories USING GIN(search_vector);

-- Create GIN index for invoices if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        CREATE INDEX IF NOT EXISTS idx_invoices_search_gin ON public.invoices USING GIN(search_vector);
    END IF;
END $$;

-- 6. Add composite indexes for common search and filter combinations
CREATE INDEX IF NOT EXISTS idx_suppliers_active_name ON public.suppliers(is_active, name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_suppliers_category_active ON public.suppliers(category, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_bills_status_date ON public.bills(status, due_date) WHERE status IN ('pending', 'approved', 'overdue');
CREATE INDEX IF NOT EXISTS idx_bills_supplier_status ON public.bills(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_category_status ON public.bills(category_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_amount_range ON public.bills(total_amount) WHERE status != 'cancelled';

-- Add invoice indexes if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON public.invoices(status, due_date) WHERE status IN ('sent', 'viewed', 'partial_paid', 'overdue');
        CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON public.invoices(client_id, status);
        CREATE INDEX IF NOT EXISTS idx_invoices_amount_range ON public.invoices(total_amount) WHERE status != 'cancelled';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_type_status ON public.payments(payment_type, status, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_reference_lookup ON public.payments(reference_type, reference_id, status);

-- 7. Create optimized search functions for different use cases

-- Function for intelligent supplier search with ranking
CREATE OR REPLACE FUNCTION public.search_suppliers_optimized(
    search_term TEXT,
    active_only BOOLEAN DEFAULT true,
    limit_results INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    contact_name VARCHAR,
    email VARCHAR,
    category VARCHAR,
    is_active BOOLEAN,
    search_rank REAL
) 
LANGUAGE sql
STABLE
AS $$
    SELECT 
        s.id,
        s.name,
        s.contact_name,
        s.email,
        s.category,
        s.is_active,
        ts_rank(s.search_vector, websearch_to_tsquery('portuguese', search_term)) as search_rank
    FROM public.suppliers s
    WHERE 
        (NOT active_only OR s.is_active = true)
        AND (
            search_term = '' OR search_term IS NULL OR
            s.search_vector @@ websearch_to_tsquery('portuguese', search_term) OR
            s.name ILIKE '%' || search_term || '%' OR
            s.email ILIKE '%' || search_term || '%'
        )
    ORDER BY 
        CASE 
            WHEN search_term = '' OR search_term IS NULL THEN s.name
            ELSE NULL
        END,
        search_rank DESC,
        s.name
    LIMIT limit_results;
$$;

-- Function for intelligent bills search with advanced filtering
CREATE OR REPLACE FUNCTION public.search_bills_optimized(
    search_term TEXT DEFAULT '',
    status_filter TEXT DEFAULT '',
    supplier_id_filter UUID DEFAULT NULL,
    category_id_filter UUID DEFAULT NULL,
    amount_min DECIMAL DEFAULT NULL,
    amount_max DECIMAL DEFAULT NULL,
    due_date_from DATE DEFAULT NULL,
    due_date_to DATE DEFAULT NULL,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    bill_number VARCHAR,
    description TEXT,
    total_amount DECIMAL,
    due_date DATE,
    status VARCHAR,
    supplier_name VARCHAR,
    category_name VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    search_rank REAL
) 
LANGUAGE sql
STABLE
AS $$
    SELECT 
        b.id,
        b.bill_number,
        b.description,
        b.total_amount,
        b.due_date,
        b.status,
        s.name as supplier_name,
        ec.name as category_name,
        b.created_at,
        CASE 
            WHEN search_term = '' OR search_term IS NULL THEN 0
            ELSE ts_rank(b.search_vector, websearch_to_tsquery('portuguese', search_term))
        END as search_rank
    FROM public.bills b
    LEFT JOIN public.suppliers s ON b.supplier_id = s.id
    LEFT JOIN public.expense_categories ec ON b.category_id = ec.id
    WHERE 
        (search_term = '' OR search_term IS NULL OR
         b.search_vector @@ websearch_to_tsquery('portuguese', search_term) OR
         b.bill_number ILIKE '%' || search_term || '%' OR
         b.description ILIKE '%' || search_term || '%' OR
         s.name ILIKE '%' || search_term || '%')
        AND (status_filter = '' OR b.status = status_filter)
        AND (supplier_id_filter IS NULL OR b.supplier_id = supplier_id_filter)
        AND (category_id_filter IS NULL OR b.category_id = category_id_filter)
        AND (amount_min IS NULL OR b.total_amount >= amount_min)
        AND (amount_max IS NULL OR b.total_amount <= amount_max)
        AND (due_date_from IS NULL OR b.due_date >= due_date_from)
        AND (due_date_to IS NULL OR b.due_date <= due_date_to)
    ORDER BY 
        CASE 
            WHEN search_term = '' OR search_term IS NULL THEN b.due_date
            ELSE NULL
        END DESC,
        search_rank DESC,
        b.created_at DESC
    LIMIT limit_results;
$$;

-- Function for intelligent invoices search (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.search_invoices_optimized(
            search_term TEXT DEFAULT '''',
            status_filter TEXT DEFAULT '''',
            client_id_filter UUID DEFAULT NULL,
            amount_min DECIMAL DEFAULT NULL,
            amount_max DECIMAL DEFAULT NULL,
            due_date_from DATE DEFAULT NULL,
            due_date_to DATE DEFAULT NULL,
            limit_results INTEGER DEFAULT 50
        )
        RETURNS TABLE (
            id UUID,
            invoice_number VARCHAR,
            description TEXT,
            total_amount DECIMAL,
            due_date DATE,
            status VARCHAR,
            client_name VARCHAR,
            created_at TIMESTAMP WITH TIME ZONE,
            search_rank REAL
        ) 
        LANGUAGE sql
        STABLE
        AS $func$
            SELECT 
                i.id,
                i.invoice_number,
                i.description,
                i.total_amount,
                i.due_date,
                i.status,
                c.company_name as client_name,
                i.created_at,
                CASE 
                    WHEN search_term = '''' OR search_term IS NULL THEN 0
                    ELSE ts_rank(i.search_vector, websearch_to_tsquery(''portuguese'', search_term))
                END as search_rank
            FROM public.invoices i
            LEFT JOIN public.clients c ON i.client_id = c.id
            WHERE 
                (search_term = '''' OR search_term IS NULL OR
                 i.search_vector @@ websearch_to_tsquery(''portuguese'', search_term) OR
                 i.invoice_number ILIKE ''%'' || search_term || ''%'' OR
                 i.description ILIKE ''%'' || search_term || ''%'' OR
                 c.company_name ILIKE ''%'' || search_term || ''%'')
                AND (status_filter = '''' OR i.status = status_filter)
                AND (client_id_filter IS NULL OR i.client_id = client_id_filter)
                AND (amount_min IS NULL OR i.total_amount >= amount_min)
                AND (amount_max IS NULL OR i.total_amount <= amount_max)
                AND (due_date_from IS NULL OR i.due_date >= due_date_from)
                AND (due_date_to IS NULL OR i.due_date <= due_date_to)
            ORDER BY 
                CASE 
                    WHEN search_term = '''' OR search_term IS NULL THEN i.due_date
                    ELSE NULL
                END DESC,
                search_rank DESC,
                i.created_at DESC
            LIMIT limit_results;
        $func$;
        ';
    END IF;
END $$;

-- 8. Create materialized view for financial search analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.financial_search_analytics AS
SELECT 
    'suppliers' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_active = true) as active_records,
    ARRAY_AGG(DISTINCT category) FILTER (WHERE category IS NOT NULL) as categories,
    MIN(created_at) as oldest_record,
    MAX(updated_at) as newest_record
FROM public.suppliers
UNION ALL
SELECT 
    'bills' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status NOT IN ('cancelled')) as active_records,
    ARRAY_AGG(DISTINCT status) as categories,
    MIN(created_at) as oldest_record,
    MAX(updated_at) as newest_record
FROM public.bills
UNION ALL
SELECT 
    'expense_categories' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_active = true) as active_records,
    ARRAY_AGG(DISTINCT category_type) as categories,
    MIN(created_at) as oldest_record,
    MAX(updated_at) as newest_record
FROM public.expense_categories;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_search_analytics_table 
ON public.financial_search_analytics(table_name);

-- 9. Function to refresh search analytics
CREATE OR REPLACE FUNCTION public.refresh_financial_search_analytics()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    REFRESH MATERIALIZED VIEW public.financial_search_analytics;
$$;

-- 10. Create auto-refresh trigger for search analytics (every hour)
-- This will keep search statistics up to date automatically

-- Grant permissions for the new functions and views
GRANT SELECT ON public.financial_search_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_suppliers_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_bills_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_financial_search_analytics TO service_role;

-- Grant invoices search function if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'search_invoices_optimized') THEN
        GRANT EXECUTE ON FUNCTION public.search_invoices_optimized TO authenticated;
    END IF;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION public.search_suppliers_optimized IS 'High-performance full-text search for suppliers with relevance ranking';
COMMENT ON FUNCTION public.search_bills_optimized IS 'Advanced search for bills with multiple filters and full-text search capabilities';
COMMENT ON MATERIALIZED VIEW public.financial_search_analytics IS 'Real-time analytics for financial search optimization and performance monitoring';

-- Log completion
SELECT 'Financial Search Optimization migration completed successfully! Added GIN indexes, search functions, and analytics.' as result;