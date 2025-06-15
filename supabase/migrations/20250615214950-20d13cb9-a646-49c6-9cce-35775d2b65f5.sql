
-- First, let's add the basic fields without the enum column
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS registration_notes TEXT,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_processing_consent BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS preferred_contact_method CHARACTER VARYING DEFAULT 'email',
ADD COLUMN IF NOT EXISTS reference_source CHARACTER VARYING,
ADD COLUMN IF NOT EXISTS initial_consultation_date TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS estimated_case_value NUMERIC,
ADD COLUMN IF NOT EXISTS urgency_level CHARACTER VARYING DEFAULT 'normal';

-- Create the enum type for registration status
DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('pending', 'approved', 'rejected', 'under_review');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add the registration_status column with proper enum type and default
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS registration_status registration_status DEFAULT 'pending'::registration_status;

-- Create a client registration history table to track changes
CREATE TABLE IF NOT EXISTS public.client_registration_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    status registration_status NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on the new table
ALTER TABLE public.client_registration_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for client registration history (admin/staff access only)
CREATE POLICY "Admin and staff can view registration history" ON public.client_registration_history
FOR ALL USING (public.is_admin_or_staff());

-- Create a function to log registration status changes
CREATE OR REPLACE FUNCTION public.log_registration_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if registration_status actually changed
    IF OLD.registration_status IS DISTINCT FROM NEW.registration_status THEN
        INSERT INTO public.client_registration_history (
            client_id,
            status,
            changed_by,
            change_reason,
            metadata
        ) VALUES (
            NEW.id,
            NEW.registration_status,
            auth.uid(),
            'Status changed from ' || COALESCE(OLD.registration_status::text, 'null') || ' to ' || NEW.registration_status::text,
            jsonb_build_object(
                'old_status', OLD.registration_status,
                'new_status', NEW.registration_status,
                'timestamp', now()
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for logging registration changes
DROP TRIGGER IF EXISTS trigger_log_registration_changes ON public.clients;
CREATE TRIGGER trigger_log_registration_changes
    AFTER UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.log_registration_status_change();

-- Update RLS policies for clients table to include registration management
DROP POLICY IF EXISTS "Admin can manage all clients" ON public.clients;
CREATE POLICY "Admin can manage all clients" ON public.clients
FOR ALL USING (public.is_admin_or_staff());
