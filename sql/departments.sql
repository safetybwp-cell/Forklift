-- ============================================
-- TABLE: departments
-- ============================================
-- สำหรับเก็บข้อมูลแผนกและ Password สำหรับอนุมัติ

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    manager_email TEXT,
    warehouse_manager_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INITIAL DATA
-- ============================================
-- ใส่ข้อมูลแผนกเริ่มต้น

INSERT INTO departments (name, password, manager_email, warehouse_manager_email) VALUES
('Production', '1001', 'production.manager@company.com', NULL),
('Warehouse', '2001', NULL, 'warehouse.manager@company.com'),
('Logistics', '1002', 'logistics.manager@company.com', NULL),
('Maintenance', '1003', 'maintenance.manager@company.com', NULL),
('QC', '1004', 'qc.manager@company.com', NULL)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================
-- เปิด RLS

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้ทุกคนอ่านได้ (เพื่อใช้ใน dropdown)
CREATE POLICY "Allow public read access" ON departments
    FOR SELECT USING (true);

-- อนุญาตให้แก้ไขสำหรับ authenticated users เท่านั้น (Super Admin)
CREATE POLICY "Allow authenticated update" ON departments
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated insert" ON departments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated delete" ON departments
    FOR DELETE USING (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_password ON departments(password);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
