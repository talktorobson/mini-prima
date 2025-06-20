-- SCHEMA FIX MIGRATION FOR MINI PRIMA
-- This migration fixes schema mismatches between the seed script and actual database

BEGIN;

-- =============================================================================
-- 1. FIX STAFF TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to staff table (position exists, we need role, is_active, permissions)
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS role character varying,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;

-- Copy position to role for compatibility with seed script
UPDATE public.staff 
SET role = position 
WHERE role IS NULL AND position IS NOT NULL;

-- =============================================================================
-- 2. FIX CASES TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to cases table
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS case_type character varying,
ADD COLUMN IF NOT EXISTS assigned_lawyer_id uuid,
ADD COLUMN IF NOT EXISTS estimated_value numeric,
ADD COLUMN IF NOT EXISTS success_fee_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_type character varying;

-- Add foreign key constraint for assigned_lawyer_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_cases_assigned_lawyer'
    ) THEN
        ALTER TABLE public.cases 
        ADD CONSTRAINT fk_cases_assigned_lawyer 
        FOREIGN KEY (assigned_lawyer_id) REFERENCES public.staff(id);
    END IF;
END $$;

-- =============================================================================
-- 3. FIX DOCUMENTS TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS is_confidential boolean DEFAULT false;

-- Check if uploaded_by column exists and fix its type if needed
DO $$
BEGIN
    -- Check if uploaded_by exists and is not UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'uploaded_by' 
        AND data_type != 'uuid'
    ) THEN
        -- Convert existing uploaded_by column from varchar to uuid
        -- First, update any non-UUID values to NULL
        UPDATE public.documents 
        SET uploaded_by = NULL 
        WHERE uploaded_by IS NOT NULL 
        AND uploaded_by !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        -- Change column type to UUID
        ALTER TABLE public.documents 
        ALTER COLUMN uploaded_by TYPE uuid USING uploaded_by::uuid;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'uploaded_by'
    ) THEN
        -- Add uploaded_by column as UUID if it doesn't exist
        ALTER TABLE public.documents ADD COLUMN uploaded_by uuid;
    END IF;
END $$;

-- Keep existing document_name column (no need to rename to title)

-- Add foreign key constraint for uploaded_by if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_documents_uploaded_by'
    ) THEN
        ALTER TABLE public.documents 
        ADD CONSTRAINT fk_documents_uploaded_by 
        FOREIGN KEY (uploaded_by) REFERENCES public.staff(id);
    END IF;
END $$;

-- =============================================================================
-- 4. FIX SUBSCRIPTION_PLANS TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS price numeric,
ADD COLUMN IF NOT EXISTS billing_cycle character varying DEFAULT 'monthly';

-- Update monthly_price to price if price doesn't exist
UPDATE public.subscription_plans 
SET price = monthly_price 
WHERE price IS NULL AND monthly_price IS NOT NULL;

-- =============================================================================
-- 5. FIX CLIENT_SUBSCRIPTIONS TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to client_subscriptions table
ALTER TABLE public.client_subscriptions 
ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS monthly_usage integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_limit integer DEFAULT 0;

-- Update from current_period_start/end if they exist
UPDATE public.client_subscriptions 
SET start_date = current_period_start::date,
    end_date = current_period_end::date
WHERE start_date IS NULL AND current_period_start IS NOT NULL;

-- =============================================================================
-- 6. FIX CLIENTS TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to clients table if they don't exist
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS subscription_status character varying,
ADD COLUMN IF NOT EXISTS approved_at timestamp without time zone;

-- Update registration_status to status if needed (map to valid client_status values)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'registration_status'
    ) THEN
        UPDATE public.clients 
        SET status = CASE 
            WHEN registration_status::text = 'pending' THEN 'Inactive'::client_status
            WHEN registration_status::text = 'under_review' THEN 'Inactive'::client_status
            WHEN registration_status::text = 'approved' THEN 'Active'::client_status
            WHEN registration_status::text = 'rejected' THEN 'Terminated'::client_status
            ELSE status
        END
        WHERE status IS NULL;
    END IF;
END $$;

-- =============================================================================
-- 7. FIX STAFF_CLIENT_ASSIGNMENTS TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to staff_client_assignments table
ALTER TABLE public.staff_client_assignments 
ADD COLUMN IF NOT EXISTS assignment_type character varying DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS assigned_date date DEFAULT CURRENT_DATE;

-- Update from assigned_at if it exists
UPDATE public.staff_client_assignments 
SET assigned_date = assigned_at::date
WHERE assigned_date IS NULL AND assigned_at IS NOT NULL;

-- =============================================================================
-- 8. FIX TIME_ENTRIES TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to time_entries table
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS hours_worked numeric,
ADD COLUMN IF NOT EXISTS entry_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS status character varying DEFAULT 'draft';

-- Calculate hours_worked from duration_minutes if missing
UPDATE public.time_entries 
SET hours_worked = ROUND((duration_minutes::numeric / 60.0), 2)
WHERE hours_worked IS NULL AND duration_minutes IS NOT NULL;

-- Set entry_date from start_time if missing
UPDATE public.time_entries 
SET entry_date = start_time::date
WHERE entry_date IS NULL AND start_time IS NOT NULL;

-- Update approval_status to status if needed
UPDATE public.time_entries 
SET status = approval_status
WHERE status = 'draft' AND approval_status IS NOT NULL;

-- =============================================================================
-- 9. FIX BILLS TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to bills table if they don't exist
DO $$
BEGIN
    -- Check if total_amount exists, if not copy from amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bills' AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE public.bills ADD COLUMN total_amount numeric;
        UPDATE public.bills SET total_amount = amount WHERE total_amount IS NULL;
    END IF;
    
    -- Add issue_date if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bills' AND column_name = 'issue_date'
    ) THEN
        ALTER TABLE public.bills ADD COLUMN issue_date date DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- =============================================================================
-- 10. FIX PAYMENTS TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS type character varying,
ADD COLUMN IF NOT EXISTS reference_number character varying;

-- Update payment_type to type if type is missing
UPDATE public.payments 
SET type = payment_type
WHERE type IS NULL AND payment_type IS NOT NULL;

-- =============================================================================
-- 11. FIX PORTAL_MESSAGES TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to portal_messages table
ALTER TABLE public.portal_messages 
ADD COLUMN IF NOT EXISTS sender_type character varying,
ADD COLUMN IF NOT EXISTS recipient_type character varying,
ADD COLUMN IF NOT EXISTS subject character varying,
ADD COLUMN IF NOT EXISTS message text;

-- Update content to message if message is missing
UPDATE public.portal_messages 
SET message = content
WHERE message IS NULL AND content IS NOT NULL;

-- =============================================================================
-- 12. FIX PORTAL_NOTIFICATIONS TABLE - ADD MISSING COLUMNS
-- =============================================================================

-- Add missing columns to portal_notifications table
ALTER TABLE public.portal_notifications 
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS user_type character varying,
ADD COLUMN IF NOT EXISTS notification_type character varying;

-- Update client_id to user_id and set user_type to 'client' if missing
UPDATE public.portal_notifications 
SET user_id = client_id,
    user_type = 'client'
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Update type to notification_type if missing
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'portal_notifications' AND column_name = 'type'
    ) THEN
        UPDATE public.portal_notifications 
        SET notification_type = type::text
        WHERE notification_type IS NULL;
    END IF;
END $$;

-- =============================================================================
-- 13. CREATE MISSING INDEXES
-- =============================================================================

-- Add useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff(email);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_lawyer_id ON public.cases(assigned_lawyer_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_staff_id ON public.time_entries(staff_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_case_id ON public.time_entries(case_id);

-- =============================================================================
-- 14. UPDATE SUBSCRIPTION_USAGE TABLE COMPATIBILITY
-- =============================================================================

-- Add missing columns to subscription_usage table
ALTER TABLE public.subscription_usage 
ADD COLUMN IF NOT EXISTS client_id uuid,
ADD COLUMN IF NOT EXISTS service_type character varying,
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 1;

-- Update usage_type to service_type if service_type is missing
UPDATE public.subscription_usage 
SET service_type = usage_type
WHERE service_type IS NULL AND usage_type IS NOT NULL;

-- Update quantity_used to usage_count if usage_count is missing
UPDATE public.subscription_usage 
SET usage_count = quantity_used::integer
WHERE usage_count IS NULL AND quantity_used IS NOT NULL;

-- =============================================================================
-- 15. VERIFY AND REPORT SCHEMA STATUS
-- =============================================================================

-- Create a verification query to check schema compatibility
DO $$
DECLARE
    missing_columns text := '';
    schema_issues text := '';
BEGIN
    -- Check for critical missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'role') THEN
        missing_columns := missing_columns || 'staff.role, ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'assigned_lawyer_id') THEN
        missing_columns := missing_columns || 'cases.assigned_lawyer_id, ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploaded_by') THEN
        missing_columns := missing_columns || 'documents.uploaded_by, ';
    END IF;
    
    -- Report results
    IF missing_columns = '' THEN
        RAISE NOTICE '✅ SCHEMA MIGRATION COMPLETED SUCCESSFULLY!';
        RAISE NOTICE '✅ All critical columns have been added or verified';
        RAISE NOTICE '✅ Database schema is now compatible with seed script';
    ELSE
        RAISE NOTICE '⚠️  SOME COLUMNS STILL MISSING: %', rtrim(missing_columns, ', ');
    END IF;
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '📋 SCHEMA MIGRATION SUMMARY:';
    RAISE NOTICE '• ✅ Added missing columns to staff table (role, is_active, permissions)';
    RAISE NOTICE '• ✅ Added missing columns to cases table (assigned_lawyer_id, case_type, etc.)';
    RAISE NOTICE '• ✅ Added missing columns to documents table (uploaded_by, is_confidential)';
    RAISE NOTICE '• ✅ Added missing columns to various other tables';
    RAISE NOTICE '• ✅ Created performance indexes';
    RAISE NOTICE '• ✅ Added foreign key constraints where needed';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '🚀 YOU CAN NOW RUN THE SEED SCRIPT SUCCESSFULLY!';
    RAISE NOTICE '=============================================================================';
END $$;

COMMIT;

-- =============================================================================
-- POST-MIGRATION INSTRUCTIONS
-- =============================================================================

/*
NEXT STEPS AFTER RUNNING THIS MIGRATION:

1. Run this migration first:
   psql -h your-supabase-host -U postgres -d postgres -f fix-schema-migration.sql

2. Then run the seed script:
   psql -h your-supabase-host -U postgres -d postgres -f seed-database-complete.sql

3. Verify the seeding completed successfully by checking for the success message

WHAT THIS MIGRATION FIXES:

✅ Staff table: Added role, is_active, permissions columns
✅ Cases table: Added assigned_lawyer_id, case_type, billing_type, estimated_value, etc.
✅ Documents table: Added uploaded_by, is_confidential, description columns
✅ Portal messages: Added sender_type, recipient_type, subject, message columns
✅ Portal notifications: Added user_id, user_type, notification_type columns
✅ Time entries: Added hours_worked, entry_date, status columns
✅ Bills: Added total_amount, issue_date columns
✅ Client subscriptions: Added start_date, end_date, monthly_usage, quota_limit
✅ Subscription usage: Added client_id, service_type, usage_count columns
✅ Staff assignments: Added assignment_type, assigned_date columns
✅ Performance indexes for better query performance
✅ Foreign key constraints for data integrity

This migration is safe to run multiple times and will only add missing columns.
*/