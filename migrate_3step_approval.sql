-- Migration Script: Update to 3-Step Approval Workflow
-- Date: 2026-02-04
-- Description: Changes from 2-step (Manager → Stock) to 3-step (Dept Manager → Warehouse Manager → Email)

-- Step 1: Drop existing enum and recreate with new values
ALTER TYPE request_status RENAME TO request_status_old;

CREATE TYPE request_status AS ENUM ('pending', 'dept_manager_approved', 'warehouse_approved', 'rejected');

-- Step 2: Update the requests table to use the new enum
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

-- Step 3: Drop old enum
DROP TYPE request_status_old;

-- Step 4: Update approver roles (Optional - keep for backward compatibility or update as needed)
-- The 'manager' role now means "department manager"
-- The 'stock' role now means "warehouse manager"
-- No changes needed to approver_role enum, just documentation

-- Step 5: Add warehouse_manager_email column to departments (if not exists)
-- Note: We'll use the existing 'manager_email' for dept managers
-- and identify the Warehouse department for warehouse manager approval
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS warehouse_manager_email TEXT;

-- Step 6: Update Warehouse department with warehouse manager email
UPDATE public.departments 
SET warehouse_manager_email = 'wh.mgr@example.com'
WHERE name = 'Warehouse';

-- Step 7: Update other departments to use a default warehouse manager
-- (Or you can set a specific warehouse manager for all departments)
UPDATE public.departments 
SET warehouse_manager_email = 'wh.mgr@example.com'
WHERE warehouse_manager_email IS NULL;

-- NOTES:
-- 1. The approver role 'manager' will now be used for department managers
-- 2. The approver role 'stock' will now be used for warehouse managers
-- 3. Each department has its own manager_email for first approval
-- 4. warehouse_manager_email is used for second approval (can be same for all depts)

-- VERIFICATION QUERIES:
-- SELECT * FROM pg_enum WHERE enumtypid = 'request_status'::regtype;
-- SELECT * FROM public.departments;
-- SELECT * FROM public.requests LIMIT 5;
