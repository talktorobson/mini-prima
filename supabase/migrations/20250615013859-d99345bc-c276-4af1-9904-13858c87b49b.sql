
-- Add foreign key constraint to link documents to cases
ALTER TABLE documents 
ADD CONSTRAINT fk_documents_case_id 
FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE;

-- Also add foreign key constraint to link documents to clients  
ALTER TABLE documents 
ADD CONSTRAINT fk_documents_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Add foreign key constraint to link cases to clients
ALTER TABLE cases 
ADD CONSTRAINT fk_cases_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
