
-- Enable RLS on documents table (if not already enabled)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their documents" ON documents;
DROP POLICY IF EXISTS "Users can update their documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their documents" ON documents;

-- Create RLS policies for documents table
-- Allow users to view documents for their cases
CREATE POLICY "Users can view their documents" ON documents
FOR SELECT USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Allow users to insert documents for their cases
CREATE POLICY "Users can insert their documents" ON documents
FOR INSERT WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Allow users to update documents for their cases
CREATE POLICY "Users can update their documents" ON documents
FOR UPDATE USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Allow users to delete documents for their cases
CREATE POLICY "Users can delete their documents" ON documents
FOR DELETE USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);
