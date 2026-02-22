# OPEN_TASKS

อัปเดตล่าสุด: `2026-02-22 00:12:03 +07`

## High Priority
1. ปิด blocker `B-01`: ปรับ `docs/short-paper/ch03-methodology-draft.md` ให้ชื่อ field/view/entity ตรงกับ SQL/ERD ล่าสุด
- หลักฐานอ้างอิง: `database/sql/01_create_schema_and_tables.sql`, `database/sql/03_create_reporting_views.sql`, `docs/short-paper/erd-design-notes.md`
- สถานะ: Open

2. ตรวจทานงานเขียนเชิงวิชาการก่อนส่งอาจารย์
- ขอบเขต: บทที่ 1-3 ทั้งฉบับ, ความลื่นไหลภาษา, ความสม่ำเสมอของคำศัพท์
- สถานะ: Open (ต้องให้มนุษย์ตรวจ)

3. ยืนยันรูปประกอบสำหรับบทที่ 3
- ขอบเขต: ERD diagram และ process flow diagram ตาม placeholders
- สถานะ: Open

## Medium Priority
1. จัดทำ RLS policies และ grants จริงใน Supabase PostgreSQL
- ขอบเขต: enforce visibility ตาม `employee/hr/admin`
- สถานะ: Planned

2. ยกระดับ RPC placeholders เป็น implementation จริง
- ขอบเขต: transaction/locking, authorization checks, atomic audit writes
- สถานะ: Planned

3. ผูก reporting views เข้ากับ API/UI dashboard
- ขอบเขต: query endpoints + TanStack Table filters
- สถานะ: Planned

## Low Priority
1. เพิ่ม query tuning และ performance baseline สำหรับ reporting views
- ขอบเขต: execution plan review, optional materialized strategy
- สถานะ: Backlog

2. เพิ่มชุดทดสอบเชิงระบบ (integration/e2e) หลังเริ่ม implementation
- สถานะ: Backlog

## Notes
- หากต้องส่ง Short Paper ทันที ให้โฟกัส High Priority ข้อ 1-3 ก่อน
- งาน Medium/Low เป็น implementation phase ต่อเนื่อง
- งานตรวจ SQL run-ready (`database/sql/01,03,04,05`) สถานะ: ปิดแล้วเมื่อ `2026-02-22` หลัง execute test ผ่านครบ
