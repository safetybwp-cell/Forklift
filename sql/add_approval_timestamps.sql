-- Add Approval Timestamps to Requests Table
-- เพิ่มคอลัมน์สำหรับบันทึกเวลาที่แต่ละคนอนุมัติ

-- เพิ่มคอลัมน์ใหม่
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS dept_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS warehouse_approved_at TIMESTAMPTZ;

-- เพิ่ม Comment
COMMENT ON COLUMN requests.dept_approved_at IS 'เวลาที่ผู้จัดการแผนกอนุมัติ';
COMMENT ON COLUMN requests.warehouse_approved_at IS 'เวลาที่ผู้จัดการคลังอนุมัติ';
