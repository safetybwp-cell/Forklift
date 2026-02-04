-- Consolidated Migration Script (Fixed Version)
-- Run this entire script in Supabase SQL Editor.

-- 1. Add requester_email column (Safe to run multiple times)
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS requester_email TEXT;

-- 2. Update Request Status Enum (3-Step Workflow)
DO $$
BEGIN
    -- Check if we need to migrate (if old status type exists or 'dept_manager_approved' is missing)
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dept_manager_approved' AND enumtypid = 'request_status'::regtype) THEN
        
        -- A. Rename old type
        ALTER TYPE request_status RENAME TO request_status_old;
        
        -- B. Create new type
        CREATE TYPE request_status AS ENUM ('pending', 'dept_manager_approved', 'warehouse_approved', 'rejected');
        
        -- C. Drop default value TEMPORARILY (Fix for ERROR 42804)
        ALTER TABLE public.requests ALTER COLUMN status DROP DEFAULT;

        -- D. Update column to use new type
        ALTER TABLE public.requests 
            ALTER COLUMN status TYPE request_status 
            USING (
                CASE status::text
                    WHEN 'pending' THEN 'pending'::request_status
                    WHEN 'manager_approved' THEN 'dept_manager_approved'::request_status
                    WHEN 'stock_approved' THEN 'warehouse_approved'::request_status
                    WHEN 'rejected' THEN 'rejected'::request_status
                    ELSE 'pending'::request_status
                END
            );
            
        -- E. Restore default value
        ALTER TABLE public.requests ALTER COLUMN status SET DEFAULT 'pending'::request_status;

        -- F. Cleanup
        DROP TYPE request_status_old;
    END IF;
END $$;

-- 3. Add warehouse_manager_email to departments
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS warehouse_manager_email TEXT;

-- Set default warehouse email
UPDATE public.departments 
SET warehouse_manager_email = 'wh.mgr@example.com'
WHERE name = 'Warehouse' OR warehouse_manager_email IS NULL;


-- 4. Create Approval Logs Table
CREATE TABLE IF NOT EXISTS public.approval_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    approver_role TEXT NOT NULL,
    action TEXT NOT NULL,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Indexes for logs
CREATE INDEX IF NOT EXISTS idx_approval_logs_request_id ON public.approval_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_logs_created_at ON public.approval_logs(created_at DESC);

-- 5. Helper function to drop policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable read for everyone" ON public.approval_logs;
    DROP POLICY IF EXISTS "Enable insert for service role" ON public.approval_logs;
END $$;

-- 6. Enable RLS and Create Policies for Approval Logs
ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for everyone" ON public.approval_logs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON public.approval_logs
    FOR INSERT WITH CHECK (true);
