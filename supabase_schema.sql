-- Create custom types
CREATE TYPE request_status AS ENUM ('pending', 'manager_approved', 'stock_approved', 'rejected');
CREATE TYPE approver_role AS ENUM ('manager', 'stock');

-- Create requests table
CREATE TABLE public.requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_name TEXT NOT NULL,
    department TEXT NOT NULL,
    objective TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status request_status DEFAULT 'pending'::request_status,
    vehicle_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Create approvers table
CREATE TABLE public.approvers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role approver_role NOT NULL,
    line_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Create error_logs table
CREATE TABLE public.error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to create a request (for the public form)
CREATE POLICY "Enable insert for everyone" ON public.requests
    FOR INSERT WITH CHECK (true);

-- Allow everyone to read requests (for dashboard/tracking) - in production you might want to restrict this
CREATE POLICY "Enable read for everyone" ON public.requests
    FOR SELECT USING (true);

-- Approvers table - Read only (assuming handled by backend or admins)
CREATE POLICY "Enable read access for all users" ON public.approvers
    FOR SELECT USING (true);

-- Storage Setup (You will need to create the bucket 'vehicle-images' in the dashboard first, or use this if extensions are enabled)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-images', 'vehicle-images', true);

-- Policy for Storage (Allow public upload to vehicle-images)
-- CREATE POLICY "Allow public uploads" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'vehicle-images');

-- SEED DATA: Approvers (Replace line_user_id with real Line User IDs)
INSERT INTO public.approvers (name, role, line_user_id) 
VALUES 
    ('Manager Somchai', 'manager', 'U1234567890abcdef1234567890abcdef'), -- Dummy Manager
    ('Stock Somsak', 'stock', 'U0987654321fedcba0987654321fedcba');    -- Dummy Stock

-- WEBHOOK SETUP INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > Database > Webhooks
-- 2. Create a new Webhook
-- 3. Name: "Notify Approver"
-- 4. Table: "requests"
-- 5. Events: INSERT, UPDATE
-- 6. Type: "HTTP Request"
-- 7. URL: [Your Edge Function URL] (e.g., https://<project-ref>.supabase.co/functions/v1/notify-approver)
-- Method: POST
-- 9. HTTP Service Key: [Service Role Key]

-- DEPARTMENTS TABLE (For Admin Management)
CREATE TABLE public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    manager_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS for departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Allow read for everyone (so the request form can list them)
CREATE POLICY "Enable read for everyone" ON public.departments
    FOR SELECT USING (true);

-- Allow all actions for everyone (Simulated Admin env - in prod restricted to Admin role)
CREATE POLICY "Enable write for everyone" ON public.departments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for everyone" ON public.departments
    FOR DELETE USING (true);

CREATE POLICY "Enable update for everyone" ON public.departments
    FOR UPDATE USING (true);

-- SEED DATA: Departments
INSERT INTO public.departments (name, manager_email)
VALUES 
    ('Production', 'prod.mgr@example.com'),
    ('Warehouse', 'wh.mgr@example.com'),
    ('Logistics', 'log.mgr@example.com'),
    ('Maintenance', 'maint.mgr@example.com'),
    ('QC', 'qc.mgr@example.com');

-- ALTER REQUESTS TABLE (To support requester notification)
ALTER TABLE public.requests
ADD COLUMN requester_email TEXT;

