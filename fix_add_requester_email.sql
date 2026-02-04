-- Add requester_email column to requests table
-- This is needed for sending notification emails back to the requester

ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS requester_email TEXT;

-- Update existing records if possible (optional, maybe set to null)
-- UPDATE public.requests SET requester_email = 'unknown@example.com' WHERE requester_email IS NULL;
