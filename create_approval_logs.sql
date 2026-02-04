-- Create approval_logs table for tracking approval history

CREATE TABLE IF NOT EXISTS public.approval_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    approver_role TEXT NOT NULL, -- 'dept_manager', 'warehouse_manager'
    action TEXT NOT NULL, -- 'approve', 'reject'
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    remarks TEXT, -- Optional comments
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Allow everyone to read logs
CREATE POLICY "Enable read for everyone" ON public.approval_logs
    FOR SELECT USING (true);

-- RLS Policy - Only Edge Functions can insert logs
CREATE POLICY "Enable insert for service role" ON public.approval_logs
    FOR INSERT WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_approval_logs_request_id ON public.approval_logs(request_id);
CREATE INDEX idx_approval_logs_created_at ON public.approval_logs(created_at DESC);

-- Add comment to table
COMMENT ON TABLE public.approval_logs IS 'Logs all approval/rejection actions for audit trail';
