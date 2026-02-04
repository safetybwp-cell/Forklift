-- ============================================
-- CLEAN UP OLD DATA (ล้างข้อมูลเก่า)
-- ============================================
-- ⚠️ คำเตือน: Script นี้จะลบข้อมูลทั้งหมดในตาราง requests
-- ใช้เฉพาะตอนต้องการเริ่มต้นใหม่เท่านั้น!

-- ลบข้อมูลคำขอทั้งหมด
DELETE FROM requests;

-- (Optional) ถ้าต้องการรีเซ็ต sequence (ใช้เฉพาะถ้ามี auto-increment)
-- ALTER SEQUENCE requests_id_seq RESTART WITH 1;

-- ตรวจสอบว่าลบหมดแล้ว
SELECT COUNT(*) as remaining_requests FROM requests;

-- ============================================
-- หมายเหตุ:
-- - ตาราง departments จะไม่ถูกลบ (เก็บ Password ไว้)
-- - ถ้าต้องการลบ departments ด้วย ให้เพิ่ม: DELETE FROM departments;
-- - แนะนำให้ทำ Backup ก่อนรัน Script นี้
-- ============================================
