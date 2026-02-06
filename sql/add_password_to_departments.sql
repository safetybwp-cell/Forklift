-- Add password column to departments table
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Update existing departments with a default password (optional, for safety)
-- UPDATE public.departments SET password = '1234' WHERE password IS NULL;
