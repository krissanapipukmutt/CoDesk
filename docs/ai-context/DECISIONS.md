# DECISIONS

## 2026-02-21

### DEC-01: Source of Best Practices
- Context: คำสั่งกำหนดให้ยึด `skills.sh` แต่ไม่พบไฟล์ `skills.sh` ใน root หรือ `.agents/skills.sh`
- Decision: ใช้แนวปฏิบัติจาก `.agents/skills/database-schema-designer/SKILL.md`, `.agents/skills/postgresql-table-design/SKILL.md`, `.agents/skills/supabase-postgres-best-practices/SKILL.md` เป็น baseline
- Reason: เป็นแหล่ง best practices ที่มีอยู่จริงใน repo และถูกใช้ในรอบงานก่อนหน้าอย่างสอดคล้อง

### DEC-02: Single Day Storage Semantics
- Context: Requirement ระบุว่า Single Day = ทั้งวัน และไม่ต้องละเอียดระดับนาที
- Decision: กำหนด `booking_mode = 'single_day'` ให้ใช้ช่วงเวลา `[00:00, 00:00+1day)` ใน timezone `Asia/Bangkok`, พร้อมบันทึก `booking_date_start = booking_date_end` สำหรับมุมมอง UI
- Reason: ช่วย enforce ได้ชัดด้วย CHECK constraint และคงความสอดคล้องกับรูปแบบแสดงผล `YYYY-MM-DD`

### DEC-03: Overlap Enforcement Strategy
- Context: ต้องกันการจองซ้อนของผู้ใช้เดิม
- Decision: ใช้ `tstzrange` + `EXCLUDE USING gist` (เฉพาะสถานะ `booked`) ในตาราง `bookings`
- Reason: เป็นกลไกระดับฐานข้อมูลที่แข็งแรงและลดโอกาสผิดพลาดจาก application logic เพียงชั้นเดียว

### DEC-04: Capacity Enforcement Boundary
- Context: กติกา capacity แบบ limited/unlimited และมีความเสี่ยง concurrency
- Decision: เก็บโครงสร้าง policy/constraint ที่ enforce ได้ใน DDL และใช้ RPC placeholder (`check_department_capacity`, `create/update_booking_with_validation`) สำหรับ logic เชิงธุรกรรมใน phase ถัดไป
- Reason: การนับจำนวนพร้อมกันภายใต้ concurrent writes ไม่สามารถปิดจบด้วย static table constraint อย่างเดียว

### DEC-05: Holiday Warning Boundary
- Context: ต้องเตือนและยืนยันเมื่อจองทับวันหยุด
- Decision: เก็บ field `holiday_warning_acknowledged` ใน `bookings` และใช้ RPC placeholder `check_holiday_warning` เพื่อ validate ข้ามตารางก่อน insert/update
- Reason: CHECK constraint ไม่รองรับการตรวจเงื่อนไขข้ามตารางแบบยืดหยุ่น

### DEC-06: Reporting Security Scope
- Context: รายงานต้องใช้โดย `hr/admin` เท่านั้น
- Decision: สร้าง views ในชั้น SQL ก่อน และเลื่อนการบังคับสิทธิ์เชิงละเอียด (RLS policy + API authorization) ไป phase implementation
- Reason: เฟสนี้โฟกัส database-first artifacts เพื่อรองรับ Short Paper บทที่ 3

### DEC-07: Capacity Check Granularity in Placeholder RPC
- Context: Requirement ต้องรองรับความจุรายวัน/ช่วงเวลา และมีกรณีข้ามวัน
- Decision: ในไฟล์ placeholder ใช้การประเมิน capacity จากช่วงเวลา request แบบ overlap ก่อน เพื่อแสดง signature และผลลัพธ์ที่ต้องการ และกำหนดให้พัฒนาอัลกอริทึม per-day/per-slot แบบละเอียดใน phase implementation
- Reason: เฟสปัจจุบันต้องเน้น design artifacts สำหรับบทที่ 3 โดยไม่ลง implementation logic แบบสมบูรณ์

### DEC-08: SQL Runtime Validation Environment
- Context: รอบตรวจ SQL run-ready ต้อง execute test จริง แต่ Docker daemon ในเครื่องไม่พร้อมใช้งาน
- Decision: ใช้ PostgreSQL local (`Homebrew postgresql@14`) เป็น PostgreSQL-compatible executor สำหรับ dry-run และ verification
- Reason: เพื่อให้ตรวจได้จริงตามข้อบังคับ `ON_ERROR_STOP` และยืนยันว่าไฟล์ `01/03/04/05` รันต่อเนื่องได้โดยไม่ error

## 2026-02-22

### DEC-09: Admin User Provisioning Boundary
- Context: มี requirement เพิ่มให้ `admin` สร้างผู้ใช้ใน Supabase Auth (`auth.users`) ผ่านหน้าเว็บได้
- Decision: กำหนดว่า frontend ส่งคำขอได้ แต่การสร้างผู้ใช้จริงต้องทำผ่าน backend/server-side endpoint เท่านั้น
- Reason: ลดความเสี่ยงจากการเปิดสิทธิ์ระดับ admin operation ที่ฝั่ง client และสอดคล้องหลัก least privilege

### DEC-10: Service Role Key Handling
- Context: Provisioning flow ต้องใช้สิทธิ์ระดับสูงของ Supabase Admin API
- Decision: `SUPABASE_SERVICE_ROLE_KEY` เป็น server-only secret และห้าม expose ไป frontend ทุกกรณี
- Reason: ป้องกันการรั่วไหลของคีย์สิทธิ์สูงและลดความเสี่ยงการถูกนำไปเรียก API นอกการควบคุม

### DEC-11: Profile Sync + Validation After Auth Create
- Context: หลังสร้าง user ใน `auth.users` ต้องให้ข้อมูลฝั่ง `co_desk` สอดคล้องกัน
- Decision: กำหนด design flow ว่าต้อง sync `co_desk.profiles` พร้อม role/department/status และตรวจ validation email/role/department/status ก่อนบันทึก
- Reason: ป้องกันข้อมูลผู้ใช้ค้าง/ไม่สอดคล้องข้ามระบบ และลด data integrity issues ใน phase implementation

### DEC-12: Admin User Management Audit Design
- Context: Requirement ระบุว่าควรมี audit log สำหรับการจัดการผู้ใช้โดย admin
- Decision: เพิ่ม design note ของตาราง `co_desk.user_admin_audit_logs` ในเอกสาร ERD (ยังไม่สร้าง SQL ใน phase นี้)
- Reason: เฟสปัจจุบันจำกัดที่เอกสาร/ออกแบบ แต่ต้องล็อกโครงสร้างสำหรับ governance และ traceability ใน phase ถัดไป
