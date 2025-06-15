
-- Create staff_client_assignments table for managing which staff can access which clients
CREATE TABLE public.staff_client_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(staff_id, client_id)
);

-- Enable RLS
ALTER TABLE public.staff_client_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to assignments
CREATE POLICY "Admins can manage all assignments" ON public.staff_client_assignments
  FOR ALL
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

-- Add indexes for better performance
CREATE INDEX idx_staff_client_assignments_staff_id ON public.staff_client_assignments(staff_id);
CREATE INDEX idx_staff_client_assignments_client_id ON public.staff_client_assignments(client_id);
CREATE INDEX idx_staff_client_assignments_active ON public.staff_client_assignments(staff_id, client_id, is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_staff_client_assignments_updated_at
  BEFORE UPDATE ON public.staff_client_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies for staff to access only assigned clients' data
-- Update clients table policies
DROP POLICY IF EXISTS "Staff can view assigned clients" ON public.clients;
CREATE POLICY "Staff can view assigned clients" ON public.clients
  FOR SELECT
  USING (
    public.is_admin_user() OR
    id IN (
      SELECT client_id FROM public.staff_client_assignments sca
      JOIN public.admin_users au ON au.staff_id::uuid = sca.staff_id
      WHERE au.user_id = auth.uid() AND sca.is_active = true
    )
  );

-- Update cases table policies for staff
DROP POLICY IF EXISTS "Staff can view assigned cases" ON public.cases;
CREATE POLICY "Staff can view assigned cases" ON public.cases
  FOR SELECT
  USING (
    public.is_admin_user() OR
    client_id IN (
      SELECT client_id FROM public.staff_client_assignments sca
      JOIN public.admin_users au ON au.staff_id::uuid = sca.staff_id
      WHERE au.user_id = auth.uid() AND sca.is_active = true
    )
  );

-- Update documents table policies for staff
DROP POLICY IF EXISTS "Staff can view assigned documents" ON public.documents;
CREATE POLICY "Staff can view assigned documents" ON public.documents
  FOR SELECT
  USING (
    public.is_admin_user() OR
    client_id IN (
      SELECT client_id FROM public.staff_client_assignments sca
      JOIN public.admin_users au ON au.staff_id::uuid = sca.staff_id
      WHERE au.user_id = auth.uid() AND sca.is_active = true
    )
  );

-- Update financial_records table policies for staff
DROP POLICY IF EXISTS "Staff can view assigned financial records" ON public.financial_records;
CREATE POLICY "Staff can view assigned financial records" ON public.financial_records
  FOR SELECT
  USING (
    public.is_admin_user() OR
    client_id IN (
      SELECT client_id FROM public.staff_client_assignments sca
      JOIN public.admin_users au ON au.staff_id::uuid = sca.staff_id
      WHERE au.user_id = auth.uid() AND sca.is_active = true
    )
  );

-- Update portal_messages table policies for staff
DROP POLICY IF EXISTS "Staff can view assigned messages" ON public.portal_messages;
CREATE POLICY "Staff can view assigned messages" ON public.portal_messages
  FOR SELECT
  USING (
    public.is_admin_user() OR
    (sender_type = 'staff' AND sender_id::text IN (
      SELECT au.staff_id FROM public.admin_users au
      WHERE au.user_id = auth.uid()
    )) OR
    (recipient_type = 'staff' AND recipient_id::text IN (
      SELECT au.staff_id FROM public.admin_users au
      WHERE au.user_id = auth.uid()
    )) OR
    (sender_type = 'client' AND sender_id::text IN (
      SELECT client_id::text FROM public.staff_client_assignments sca
      JOIN public.admin_users au ON au.staff_id::uuid = sca.staff_id
      WHERE au.user_id = auth.uid() AND sca.is_active = true
    )) OR
    (recipient_type = 'client' AND recipient_id::text IN (
      SELECT client_id::text FROM public.staff_client_assignments sca
      JOIN public.admin_users au ON au.staff_id::uuid = sca.staff_id
      WHERE au.user_id = auth.uid() AND sca.is_active = true
    ))
  );

-- Create helper function to get staff's assigned clients
CREATE OR REPLACE FUNCTION public.get_staff_assigned_clients(staff_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (client_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT sca.client_id
  FROM public.staff_client_assignments sca
  JOIN public.admin_users au ON au.staff_id::uuid = sca.staff_id
  WHERE au.user_id = staff_user_id 
  AND sca.is_active = true;
$$;

-- Create function to get staff member info
CREATE OR REPLACE FUNCTION public.get_staff_info(staff_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  staff_id UUID,
  full_name TEXT,
  email TEXT,
  staff_position TEXT,
  role TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    s.id,
    s.full_name,
    s.email,
    s."position",
    au.role::text
  FROM public.staff s
  JOIN public.admin_users au ON au.staff_id::text = s.id::text
  WHERE au.user_id = staff_user_id
  AND au.is_active = true;
$$;
