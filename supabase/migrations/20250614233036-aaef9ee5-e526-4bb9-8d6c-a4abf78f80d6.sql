
-- First, let's add RLS policies to the existing tables to work with Supabase auth
-- We'll need to connect auth.users to the clients table

-- Add a user_id column to clients table to link with Supabase auth
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a unique index to ensure one client per user
CREATE UNIQUE INDEX IF NOT EXISTS clients_user_id_unique ON public.clients(user_id);

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Users can view their own client data" 
  ON public.clients 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own client data" 
  ON public.clients 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Enable RLS on portal_sessions
ALTER TABLE public.portal_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for portal_sessions
CREATE POLICY "Users can view their own sessions" 
  ON public.portal_sessions 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

CREATE POLICY "Users can insert their own sessions" 
  ON public.portal_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

CREATE POLICY "Users can update their own sessions" 
  ON public.portal_sessions 
  FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

CREATE POLICY "Users can delete their own sessions" 
  ON public.portal_sessions 
  FOR DELETE 
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

-- Enable RLS on portal_settings
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for portal_settings
CREATE POLICY "Users can view their own settings" 
  ON public.portal_settings 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

CREATE POLICY "Users can insert their own settings" 
  ON public.portal_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

CREATE POLICY "Users can update their own settings" 
  ON public.portal_settings 
  FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

-- Enable RLS on portal_notifications
ALTER TABLE public.portal_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for portal_notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.portal_notifications 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

CREATE POLICY "Users can update their own notifications" 
  ON public.portal_notifications 
  FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

-- Enable RLS on portal_messages
ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for portal_messages (assuming clients can be both senders and recipients)
CREATE POLICY "Users can view their own messages" 
  ON public.portal_messages 
  FOR SELECT 
  USING (
    auth.uid() = (SELECT user_id FROM clients WHERE id = sender_id AND sender_type = 'client') OR
    auth.uid() = (SELECT user_id FROM clients WHERE id = recipient_id AND recipient_type = 'client')
  );

CREATE POLICY "Users can insert their own messages" 
  ON public.portal_messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM clients WHERE id = sender_id AND sender_type = 'client')
  );

-- Enable RLS on cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Create policies for cases
CREATE POLICY "Users can view their own cases" 
  ON public.cases 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Users can view their own documents" 
  ON public.documents 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

-- Enable RLS on financial_records
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_records
CREATE POLICY "Users can view their own financial records" 
  ON public.financial_records 
  FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Create a client record for the new user with basic info
  INSERT INTO public.clients (
    user_id,
    company_name,
    contact_person,
    email,
    phone,
    status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Empresa'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'Active'
  );
  
  -- Create default portal settings
  INSERT INTO public.portal_settings (
    client_id,
    email_notifications,
    whatsapp_notifications,
    language,
    timezone
  ) VALUES (
    (SELECT id FROM public.clients WHERE user_id = NEW.id),
    true,
    false,
    'pt-BR',
    'America/Sao_Paulo'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create client record when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
