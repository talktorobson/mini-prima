
-- Create enum for access types
CREATE TYPE access_type AS ENUM (
  'client_access',
  'billing', 
  'messaging',
  'cases_management',
  'document_management',
  'system_setup'
);

-- Create staff_access_permissions table
CREATE TABLE public.staff_access_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  access_type access_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  granted_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.staff_access_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to permissions
CREATE POLICY "Admins can manage all permissions" ON public.staff_access_permissions
  FOR ALL
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

-- Create index for better performance
CREATE INDEX idx_staff_access_permissions_staff_id ON public.staff_access_permissions(staff_id);
CREATE INDEX idx_staff_access_permissions_active ON public.staff_access_permissions(staff_id, is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_staff_access_permissions_updated_at
  BEFORE UPDATE ON public.staff_access_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
