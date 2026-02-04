# วิธีการตั้งค่า Database สำหรับระบบ Forklift (Password-Based)

## ขั้นตอนที่ 1: เข้า Supabase Dashboard

1. ไปที่ [Supabase Dashboard](https://app.supabase.com)
2. เลือก Project ของคุณ
3. คลิกที่ **SQL Editor** (เมนูด้านซ้าย)

## ขั้นตอนที่ 2: รัน SQL Script

1. คลิก **New Query**
2. คัดลอกโค้ดจากไฟล์ `sql/departments.sql`
3. วางลงในหน้า SQL Editor
4. คลิก **Run** (หรือกด Ctrl+Enter)

## ขั้นตอนที่ 3: ตรวจสอบว่าสำเร็จ

1. ไปที่ **Table Editor**
2. ควรเห็นตาราง `departments` ใหม่
3. คลิกเข้าไปดู ควรมีข้อมูล 5 แผนก:
   - Production (รหัส: 1001)
   - Warehouse (รหัส: 2001)
   - Logistics (รหัส: 1002)
   - Maintenance (รหัส: 1003)
   - QC (รหัส: 1004)

## ขั้นตอนที่ 4: แก้ไข Email (Optional)

ถ้าต้องการเปลี่ยน Email ผู้จัดการแผนก:
1. ไปที่ **Table Editor** → `departments`
2. คลิกแก้ไขแถวที่ต้องการ
3. ใส่ Email จริงลงในคอลัมน์ `manager_email` หรือ `warehouse_manager_email`

## ⚠️ หมายเหตุ

- **Password เหล่านี้เป็นค่าเริ่มต้น** - ควรเปลี่ยนให้เหมาะกับองค์กร
- Password สามารถแก้ไขได้ผ่าน Super Admin (หน้า `admin.html`)
- แนะนำให้ใช้เลข 4 หลักที่จำง่าย เช่น `1001`, `2001`, `3001` เป็นต้น
