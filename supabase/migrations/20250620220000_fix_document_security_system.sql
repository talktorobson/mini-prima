-- Fix Document Security System
-- D'Avila Reis Legal Practice Management System
-- Enhanced document security with proper role-based access controls

-- 1. Fix documents table schema for security
ALTER TABLE documents ALTER COLUMN uploaded_by DROP NOT NULL;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);

-- 2. Add missing security fields to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(20);

-- 3. Update document_access_logs table for enhanced audit
ALTER TABLE document_access_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE document_access_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 4. Update case_updates table for proper attribution
ALTER TABLE case_updates ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 5. Drop existing document RLS policies
DROP POLICY IF EXISTS "Users can view their documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their documents" ON documents;
DROP POLICY IF EXISTS "Users can update their documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their documents" ON documents;

-- 6. Create comprehensive document RLS policies

-- Policy for clients to view their visible documents
CREATE POLICY "Clients can view their visible documents" ON documents
FOR SELECT USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- Document belongs to client and is visible
  (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
    AND is_visible_to_client = true
  )
);

-- Policy for staff to view documents for assigned cases/clients
CREATE POLICY "Staff can view assigned documents" ON documents
FOR SELECT USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- User is active staff member
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.email = auth.jwt() ->> 'email' 
    AND s.is_active = true
  )
  AND
  (
    -- Document is for a case they're assigned to
    (
      case_id IS NOT NULL 
      AND case_id IN (
        SELECT c.id FROM cases c
        JOIN staff_client_assignments sca ON c.client_id = sca.client_id
        JOIN staff s ON sca.staff_id = s.id
        WHERE s.email = auth.jwt() ->> 'email' 
        AND sca.is_active = true
      )
    )
    OR
    -- Document is for a client they're assigned to
    (
      client_id IS NOT NULL 
      AND client_id IN (
        SELECT sca.client_id FROM staff_client_assignments sca
        JOIN staff s ON sca.staff_id = s.id
        WHERE s.email = auth.jwt() ->> 'email' 
        AND sca.is_active = true
      )
    )
  )
);

-- Policy for admins to view all documents
CREATE POLICY "Admins can view all documents" ON documents
FOR SELECT USING (
  -- User must be authenticated admin
  auth.uid() IS NOT NULL
  AND
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.email = auth.jwt() ->> 'email'
    AND au.is_active = true
  )
);

-- Policy for clients to insert their own documents
CREATE POLICY "Clients can insert their documents" ON documents
FOR INSERT WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- Document must be for their client profile
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
  AND
  -- User ID must match authenticated user
  (uploaded_by = auth.uid() OR uploaded_by IS NULL)
);

-- Policy for staff to insert documents for assigned cases/clients
CREATE POLICY "Staff can insert assigned documents" ON documents
FOR INSERT WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- User is active staff member
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.email = auth.jwt() ->> 'email' 
    AND s.is_active = true
  )
  AND
  -- User ID must match authenticated user
  (uploaded_by = auth.uid() OR uploaded_by IS NULL)
  AND
  (
    -- Document is for a case they're assigned to
    (
      case_id IS NOT NULL 
      AND case_id IN (
        SELECT c.id FROM cases c
        JOIN staff_client_assignments sca ON c.client_id = sca.client_id
        JOIN staff s ON sca.staff_id = s.id
        WHERE s.email = auth.jwt() ->> 'email' 
        AND sca.is_active = true
      )
    )
    OR
    -- Document is for a client they're assigned to
    (
      client_id IS NOT NULL 
      AND client_id IN (
        SELECT sca.client_id FROM staff_client_assignments sca
        JOIN staff s ON sca.staff_id = s.id
        WHERE s.email = auth.jwt() ->> 'email' 
        AND sca.is_active = true
      )
    )
  )
);

-- Policy for admins to insert any documents
CREATE POLICY "Admins can insert any documents" ON documents
FOR INSERT WITH CHECK (
  -- User must be authenticated admin
  auth.uid() IS NOT NULL
  AND
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.email = auth.jwt() ->> 'email'
    AND au.is_active = true
  )
  AND
  -- User ID must match authenticated user
  (uploaded_by = auth.uid() OR uploaded_by IS NULL)
);

-- Policy for clients to update their own documents (limited fields)
CREATE POLICY "Clients can update their documents" ON documents
FOR UPDATE USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- Document belongs to client
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
  AND
  -- Only allow updating specific fields (enforced in application)
  true
) WITH CHECK (
  -- Same conditions as USING clause
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Policy for staff to update documents for assigned cases/clients
CREATE POLICY "Staff can update assigned documents" ON documents
FOR UPDATE USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- User is active staff member
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.email = auth.jwt() ->> 'email' 
    AND s.is_active = true
  )
  AND
  (
    -- Document is for a case they're assigned to
    (
      case_id IS NOT NULL 
      AND case_id IN (
        SELECT c.id FROM cases c
        JOIN staff_client_assignments sca ON c.client_id = sca.client_id
        JOIN staff s ON sca.staff_id = s.id
        WHERE s.email = auth.jwt() ->> 'email' 
        AND sca.is_active = true
      )
    )
    OR
    -- Document is for a client they're assigned to
    (
      client_id IS NOT NULL 
      AND client_id IN (
        SELECT sca.client_id FROM staff_client_assignments sca
        JOIN staff s ON sca.staff_id = s.id
        WHERE s.email = auth.jwt() ->> 'email' 
        AND sca.is_active = true
      )
    )
  )
);

-- Policy for admins to update any documents
CREATE POLICY "Admins can update any documents" ON documents
FOR UPDATE USING (
  -- User must be authenticated admin
  auth.uid() IS NOT NULL
  AND
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.email = auth.jwt() ->> 'email'
    AND au.is_active = true
  )
);

-- Policy for staff and admins to delete documents (clients cannot delete)
CREATE POLICY "Staff can delete assigned documents" ON documents
FOR DELETE USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  (
    -- User is active staff member with assignment
    (
      EXISTS (
        SELECT 1 FROM staff s 
        WHERE s.email = auth.jwt() ->> 'email' 
        AND s.is_active = true
      )
      AND
      (
        -- Document is for a case they're assigned to
        (
          case_id IS NOT NULL 
          AND case_id IN (
            SELECT c.id FROM cases c
            JOIN staff_client_assignments sca ON c.client_id = sca.client_id
            JOIN staff s ON sca.staff_id = s.id
            WHERE s.email = auth.jwt() ->> 'email' 
            AND sca.is_active = true
          )
        )
        OR
        -- Document is for a client they're assigned to
        (
          client_id IS NOT NULL 
          AND client_id IN (
            SELECT sca.client_id FROM staff_client_assignments sca
            JOIN staff s ON sca.staff_id = s.id
            WHERE s.email = auth.jwt() ->> 'email' 
            AND sca.is_active = true
          )
        )
      )
    )
    OR
    -- User is admin
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = auth.jwt() ->> 'email'
      AND au.is_active = true
    )
  )
);

-- 7. Create RLS policies for document_access_logs (audit trail)
CREATE POLICY "Staff and admins can view document access logs" ON document_access_logs
FOR SELECT USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  (
    -- User is active staff member
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.email = auth.jwt() ->> 'email' 
      AND s.is_active = true
    )
    OR
    -- User is admin
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = auth.jwt() ->> 'email'
      AND au.is_active = true
    )
  )
);

CREATE POLICY "All authenticated users can insert access logs" ON document_access_logs
FOR INSERT WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- User ID must match authenticated user
  (user_id = auth.uid() OR user_id IS NULL)
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by_role ON documents(created_by_role);
CREATE INDEX IF NOT EXISTS idx_documents_access_level ON documents(access_level);
CREATE INDEX IF NOT EXISTS idx_documents_client_visible ON documents(client_id, is_visible_to_client) WHERE is_visible_to_client = true;

CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_action ON document_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_timestamp ON document_access_logs(access_timestamp);

-- 9. Create function for document security validation
CREATE OR REPLACE FUNCTION validate_document_access(
  doc_id UUID,
  user_email TEXT,
  required_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  doc_record RECORD;
  user_record RECORD;
  has_access BOOLEAN := FALSE;
BEGIN
  -- Get document details
  SELECT * INTO doc_record FROM documents WHERE id = doc_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is admin
  SELECT * INTO user_record FROM admin_users WHERE email = user_email AND is_active = true;
  IF FOUND THEN
    RETURN TRUE; -- Admins have full access
  END IF;
  
  -- Check if user is staff with proper assignment
  SELECT s.* INTO user_record FROM staff s WHERE s.email = user_email AND s.is_active = true;
  IF FOUND THEN
    -- Check case assignment
    IF doc_record.case_id IS NOT NULL THEN
      SELECT 1 INTO has_access FROM cases c
      JOIN staff_client_assignments sca ON c.client_id = sca.client_id
      WHERE c.id = doc_record.case_id 
      AND sca.staff_id = user_record.id 
      AND sca.is_active = true
      LIMIT 1;
      IF has_access THEN
        RETURN TRUE;
      END IF;
    END IF;
    
    -- Check client assignment
    IF doc_record.client_id IS NOT NULL THEN
      SELECT 1 INTO has_access FROM staff_client_assignments sca
      WHERE sca.client_id = doc_record.client_id 
      AND sca.staff_id = user_record.id 
      AND sca.is_active = true
      LIMIT 1;
      IF has_access THEN
        RETURN TRUE;
      END IF;
    END IF;
    
    RETURN FALSE;
  END IF;
  
  -- Check if user is client
  SELECT c.* INTO user_record FROM clients c 
  JOIN auth.users u ON c.user_id = u.id 
  WHERE u.email = user_email;
  IF FOUND THEN
    -- Client can only access their own documents that are visible
    IF doc_record.client_id = user_record.id THEN
      IF required_action = 'read' OR required_action = 'download' THEN
        RETURN doc_record.is_visible_to_client;
      ELSE
        RETURN TRUE; -- Clients can upload/modify their own documents
      END IF;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger to automatically set uploaded_by field
CREATE OR REPLACE FUNCTION set_document_upload_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Set uploaded_by to current user if not set
  IF NEW.uploaded_by IS NULL THEN
    NEW.uploaded_by := auth.uid();
  END IF;
  
  -- Set user_id to current user if not set
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Determine user role for created_by_role
  IF NEW.created_by_role IS NULL THEN
    IF EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email' AND is_active = true) THEN
      NEW.created_by_role := 'admin';
    ELSIF EXISTS (SELECT 1 FROM staff WHERE email = auth.jwt() ->> 'email' AND is_active = true) THEN
      NEW.created_by_role := 'staff';
    ELSIF EXISTS (SELECT 1 FROM clients WHERE user_id = auth.uid()) THEN
      NEW.created_by_role := 'client';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_document_upload_metadata ON documents;
CREATE TRIGGER trigger_set_document_upload_metadata
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION set_document_upload_metadata();

COMMENT ON TABLE documents IS 'Document storage with enhanced role-based access controls and audit trails';
COMMENT ON COLUMN documents.uploaded_by IS 'References auth.users(id) - tracks who uploaded the document';
COMMENT ON COLUMN documents.user_id IS 'References auth.users(id) - for additional user tracking';
COMMENT ON COLUMN documents.created_by_role IS 'Role of user who created document (client/staff/admin)';
COMMENT ON COLUMN documents.access_level IS 'Security level: public, internal, confidential, attorney_client_privilege';

COMMENT ON FUNCTION validate_document_access IS 'Server-side function to validate document access permissions';
COMMENT ON FUNCTION set_document_upload_metadata IS 'Automatically sets upload metadata on document creation';