
-- Enable RLS on all tables that don't have it yet
ALTER TABLE public.case_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies first
DROP POLICY IF EXISTS "Users can view their own case updates" ON public.case_updates;
DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.client_activity_logs;
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.client_activity_logs;
DROP POLICY IF EXISTS "Users can view their own document access logs" ON public.document_access_logs;
DROP POLICY IF EXISTS "Users can insert their own document access logs" ON public.document_access_logs;
DROP POLICY IF EXISTS "Users can view their own financial records" ON public.financial_records;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.portal_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.portal_messages;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.portal_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.portal_notifications;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.portal_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.portal_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.portal_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.portal_sessions;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.portal_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.portal_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.portal_settings;

-- Create comprehensive RLS policies for case_updates
CREATE POLICY "Users can view case updates for their cases" ON public.case_updates
FOR SELECT USING (
  case_id IN (
    SELECT id FROM public.cases WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

-- Create comprehensive RLS policies for cases
CREATE POLICY "Users can view their own cases" ON public.cases
FOR SELECT USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own cases" ON public.cases
FOR UPDATE USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Create comprehensive RLS policies for client_activity_logs
CREATE POLICY "Users can view their own activity logs" ON public.client_activity_logs
FOR SELECT USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own activity logs" ON public.client_activity_logs
FOR INSERT WITH CHECK (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Create comprehensive RLS policies for document_access_logs
CREATE POLICY "Users can view their own document access logs" ON public.document_access_logs
FOR SELECT USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own document access logs" ON public.document_access_logs
FOR INSERT WITH CHECK (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Create comprehensive RLS policies for financial_records
CREATE POLICY "Users can view their own financial records" ON public.financial_records
FOR SELECT USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for leads (admin-only access, but secured)
CREATE POLICY "Admin can manage leads" ON public.leads
FOR ALL USING (false); -- No client access to leads

-- Create RLS policies for portal_faqs (public read access)
CREATE POLICY "Anyone can view active FAQs" ON public.portal_faqs
FOR SELECT USING (is_active = true);

-- Create comprehensive RLS policies for portal_messages
CREATE POLICY "Users can view their own messages" ON public.portal_messages
FOR SELECT USING (
  (sender_type = 'client' AND sender_id::text = (
    SELECT id::text FROM public.clients WHERE user_id = auth.uid()
  )) OR
  (recipient_type = 'client' AND recipient_id::text = (
    SELECT id::text FROM public.clients WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can insert their own messages" ON public.portal_messages
FOR INSERT WITH CHECK (
  sender_type = 'client' AND sender_id::text = (
    SELECT id::text FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" ON public.portal_messages
FOR UPDATE USING (
  sender_type = 'client' AND sender_id::text = (
    SELECT id::text FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Create comprehensive RLS policies for portal_notifications (already have some, but ensuring completeness)
CREATE POLICY "Users can view their own notifications" ON public.portal_notifications
FOR SELECT USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own notifications" ON public.portal_notifications
FOR UPDATE USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Create comprehensive RLS policies for portal_sessions (already have some, but ensuring completeness)
CREATE POLICY "Users can view their own sessions" ON public.portal_sessions
FOR SELECT USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own sessions" ON public.portal_sessions
FOR INSERT WITH CHECK (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own sessions" ON public.portal_sessions
FOR UPDATE USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own sessions" ON public.portal_sessions
FOR DELETE USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Create comprehensive RLS policies for portal_settings (already have some, but ensuring completeness)
CREATE POLICY "Users can view their own settings" ON public.portal_settings
FOR SELECT USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own settings" ON public.portal_settings
FOR INSERT WITH CHECK (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own settings" ON public.portal_settings
FOR UPDATE USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for staff (admin-only access)
CREATE POLICY "No client access to staff" ON public.staff
FOR ALL USING (false); -- No client access to staff data

-- Create RLS policies for tasks
CREATE POLICY "Users can view tasks for their cases" ON public.tasks
FOR SELECT USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  ) OR
  case_id IN (
    SELECT id FROM public.cases WHERE client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  )
);

-- Create storage policies for case-documents bucket (if it exists)
-- First, let's ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('case-documents', 'case-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their case documents" ON storage.objects;

-- Create secure storage policies
CREATE POLICY "Users can upload case documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'case-documents' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their case documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'case-documents' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their case documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'case-documents' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their case documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'case-documents' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  auth.role() = 'authenticated'
);

-- Create function to securely log client activities
CREATE OR REPLACE FUNCTION public.log_client_activity(
  activity_type_param text,
  description_param text DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id_var uuid;
BEGIN
  -- Get the client ID for the current user
  SELECT id INTO client_id_var
  FROM public.clients
  WHERE user_id = auth.uid();
  
  -- Only log if we have a valid client
  IF client_id_var IS NOT NULL THEN
    INSERT INTO public.client_activity_logs (
      client_id,
      activity_type,
      description,
      metadata,
      ip_address,
      user_agent
    ) VALUES (
      client_id_var,
      activity_type_param,
      description_param,
      metadata_param,
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
  END IF;
END;
$$;

-- Create function to securely check if user owns a case
CREATE OR REPLACE FUNCTION public.user_owns_case(case_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cases c
    JOIN public.clients cl ON c.client_id = cl.id
    WHERE c.id = case_id_param
    AND cl.user_id = auth.uid()
  );
$$;

-- Create function to securely get user's client ID
CREATE OR REPLACE FUNCTION public.get_current_client_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id
  FROM public.clients
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Add security audit logging trigger
CREATE OR REPLACE FUNCTION public.audit_rls_violations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log any potential RLS violations or suspicious access patterns
  INSERT INTO public.client_activity_logs (
    client_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    public.get_current_client_id(),
    'security_audit',
    'Potential security event detected',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;
