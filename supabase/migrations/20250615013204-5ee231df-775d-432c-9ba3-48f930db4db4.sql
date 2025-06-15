
-- Add new columns to the cases table for counterparty and court process number
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS counterparty_name character varying,
ADD COLUMN IF NOT EXISTS court_process_number character varying;

-- Create a storage bucket for case documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-documents', 'case-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for case documents
CREATE POLICY "Users can upload case documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'case-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their case documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'case-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their case documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'case-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add document_type column to documents table if it doesn't exist
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_category character varying DEFAULT 'General';

-- Update the documents table to support better file management
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_path character varying,
ADD COLUMN IF NOT EXISTS original_filename character varying;
