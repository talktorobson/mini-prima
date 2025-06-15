
-- Create admin role enum
CREATE TYPE public.admin_role AS ENUM ('admin', 'staff');

-- Create admin_users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role admin_role NOT NULL DEFAULT 'staff',
  staff_id VARCHAR,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users table
CREATE POLICY "Admin users can view all admin records" 
  ON public.admin_users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can update admin records" 
  ON public.admin_users 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role = 'admin' 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can insert admin records" 
  ON public.admin_users 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role = 'admin' 
      AND au.is_active = true
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper functions for admin access
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() 
    AND is_active = true
  );
$$;
