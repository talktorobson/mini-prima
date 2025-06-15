
-- Add the new case_risk_value field to the cases table
ALTER TABLE public.cases 
ADD COLUMN case_risk_value NUMERIC;

-- Add a comment to describe the field
COMMENT ON COLUMN public.cases.case_risk_value IS 'Valor da causa pleiteado pelo cliente';
