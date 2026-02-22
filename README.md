# CoDesk (`co_desk`)

## 1) Project Overview
`co_desk` คือโครงการระบบเว็บสำหรับบริหารการจองที่นั่งเข้าออฟฟิศ (Office Seat Booking) โดยในสถานะปัจจุบันของ repository นี้เน้นงานเอกสารและ database-first design artifacts เพื่อรองรับการจัดทำ **Short Paper บทที่ 1-3** ก่อนการพัฒนา implementation เต็มรูปแบบ

- Project name: `co_desk`
- PostgreSQL schema: `co_desk`
- Current branch: `feature/CoDesk-03`
- Current phase: Documentation + Database-first design for Short Paper Chapter 1-3

## 2) Objectives and Scope
เป้าหมายหลักของเฟสนี้:
1. จัดเตรียมเอกสารร่างบทที่ 1-3 ภาษาไทยเชิงวิชาการ
2. จัดทำ structured requirements analysis พร้อม traceability
3. ออกแบบฐานข้อมูลระดับ ERD-ready และ SQL artifacts สำหรับอ้างอิงบทที่ 3
4. เตรียม reporting layer (views) และ RPC/function placeholders ที่ต่อยอด implementation ได้
5. สร้าง context persistence สำหรับทำงานต่อข้ามเครื่อง

ขอบเขตเฟสนี้ (In scope):
- Requirements analysis และเอกสาร short paper support
- Database schema/tables/constraints/indexes design
- Reporting views design (SQL view layer)
- RPC/function placeholder signatures + design intent

นอกขอบเขตเฟสนี้ (Out of scope):
- Frontend/Backend implementation สมบูรณ์
- RLS policy implementation แบบ production-ready
- API integration และ dashboard UI implementation

## 3) Feature Summary (Requirement Baseline)
ระบบถูกออกแบบให้รองรับ requirement เชิงธุรกิจหลักดังนี้:
1. Seat Booking: จองแบบทั้งวัน (`single_day`) และช่วงเวลา (`time_range`), จองย้อนหลัง/ล่วงหน้าได้ตาม role, กันจองซ้อน
2. Availability Calendar: ดูสถานะจองรายวัน/รายเดือนตามสิทธิ์ role และฝ่าย
3. Department Management: จัดการฝ่ายและความจุแบบ `limited`/`unlimited`
4. Employee Management: จัดการข้อมูลพนักงานโดย `hr/admin`
5. Holiday Management: อนุญาตจองทับวันหยุดได้ แต่ต้อง warning + confirm
6. Reporting Dashboard: รายงานจาก views อย่างน้อย 5 มุมมอง
7. Users/Roles/RBAC: บทบาท `employee`, `hr`, `admin`
8. Authentication: Supabase Auth (รองรับ demo flow ในเฟสถัดไป)
9. Admin User Provisioning (Design): `admin` สร้างผู้ใช้ใน `auth.users` ผ่านหน้าเว็บได้ โดยบังคับ flow ผ่าน backend เท่านั้น

Reference requirements files:
- `docs/ai-context/REQUIREMENTS_SOURCE.md` (verbatim source)
- `docs/short-paper/requirements-for-paper.md` (structured + requirement IDs)

## 4) Tech Stack (Target Architecture)
- Frontend: React + TypeScript
- Backend: ASP.NET Core Web API (.NET 10)
- Database/Auth: Supabase PostgreSQL + Supabase Auth + RLS
- UI: Tailwind CSS + shadcn/ui
- Calendar: FullCalendar
- Reporting Table: TanStack Table
- Charts: Recharts
- Date/Time: dayjs + timezone plugin (`Asia/Bangkok`)

## 5) Architecture Overview
Logical architecture (target):
1. UI Layer (React): booking form, calendar, admin/hr screens, reporting dashboard
2. API Layer (.NET Web API): business orchestration, authorization, RPC calls
3. Data Layer (Supabase PostgreSQL): schema `co_desk`, constraints, views, RPC/functions, RLS

Admin provisioning design flow (planned):
1. Admin UI ส่งคำขอสร้างผู้ใช้ไปที่ backend endpoint
2. Backend ตรวจสิทธิ์ caller ว่าเป็น `admin`
3. Backend เรียก Supabase Admin API เพื่อสร้าง user ใน `auth.users`
4. Backend sync ข้อมูล `co_desk.profiles` (role/department/status)
5. Backend บันทึก audit log การจัดการผู้ใช้ (planned)

Current repository focus:
- เอกสารวิเคราะห์ + SQL design artifacts
- ยังไม่มี source code implementation ของ frontend/backend

## 6) Database Design Summary
Database-first artifacts ถูกออกแบบภายใต้ schema `co_desk` โดยตารางหลักประกอบด้วย:
1. `co_desk.roles`
2. `co_desk.departments`
3. `co_desk.profiles`
4. `co_desk.department_capacity_policies`
5. `co_desk.holidays`
6. `co_desk.bookings`
7. `co_desk.booking_audit_logs`
8. `co_desk.user_department_history` (optional)

สรุปความสัมพันธ์หลัก:
- `roles` 1:N `profiles`
- `departments` 1:N `profiles`
- `departments` 1:N `department_capacity_policies`
- `profiles` 1:N `bookings` (ทั้งผู้จอง/ผู้ถูกจอง)
- `departments` 1:N `bookings`
- `bookings` 1:N `booking_audit_logs`

เอกสารอ้างอิง:
- `docs/short-paper/erd-design-notes.md`
- `docs/short-paper/database-ddl-summary.md`

## 7) DDL / Constraints / Indexes
ไฟล์ SQL ที่ใช้:
1. `database/sql/01_create_schema_and_tables.sql`  
   รวม schema + enum types + tables + constraints + indexes (ไฟล์หลัก)
2. `database/sql/02_create_indexes_and_constraints.sql`  
   no-op placeholder เพื่อ compatibility (ถูก merge เข้าไฟล์ 01 แล้ว)

ข้อกำหนดข้อมูลสำคัญที่ enforce ใน DDL:
- ป้องกัน user เดิมจองซ้อนเวลา (`EXCLUDE` บน `booking_period`)
- ตรวจความถูกต้องโหมดจอง (`single_day`/`time_range`)
- ตรวจช่วงเวลาระดับชั่วโมง (ไม่ลงนาที)
- ตรวจ consistency ของสถานะยกเลิก
- ตรวจ capacity mode (`limited`/`unlimited`) และ policy range overlap

## 8) Reporting Views (Planned/Implemented in SQL Layer)
สร้าง SQL views แล้วอย่างน้อย 6 views:
1. `co_desk.vw_daily_booking_summary_by_department`
2. `co_desk.vw_department_capacity_utilization`
3. `co_desk.vw_employee_booking_frequency`
4. `co_desk.vw_holiday_bookings_detail`
5. `co_desk.vw_booking_cancellations_summary`
6. `co_desk.vw_peak_usage_by_day_hour`

ดูรายละเอียด:
- `database/sql/03_create_reporting_views.sql`
- `docs/short-paper/reporting-views-design.md`

หมายเหตุ: Excel-like filtering อยู่ที่ application layer (TanStack Table) ใน phase implementation

## 9) RPC / Functions (Planned/Placeholder)
ไฟล์: `database/sql/04_create_rpc_placeholders.sql`

Functions ที่กำหนด placeholder แล้ว:
1. `co_desk.check_booking_conflict(...)`
2. `co_desk.check_department_capacity(...)`
3. `co_desk.check_holiday_warning(...)`
4. `co_desk.create_booking_with_validation(...)`
5. `co_desk.update_booking_with_validation(...)`
6. `co_desk.cancel_booking(...)`

สถานะ:
- มี signature + expected return shape + TODO design intent
- ยังไม่ใช่ implementation ธุรกรรมสมบูรณ์ (ยังไม่ atomic write + full authorization)

## 10) Roles / RBAC / RLS
Role baseline:
- `employee`: จองเฉพาะตนเอง, ดูบริบทฝ่ายเดียวกัน
- `hr`: จองเฉพาะตนเอง, จัดการฝ่าย/พนักงานได้, ดูรายงานได้
- `admin`: สิทธิ์เต็ม, จองแทนได้, จัดการผู้ใช้/บทบาทได้ รวมถึง provisioning ผู้ใช้ใน Supabase Auth ผ่าน backend endpoint

RLS status:
- อยู่ในระดับ design intent และเอกสารกำกับ
- ยังต้องเขียน policy SQL จริงใน phase implementation

## 11) Authentication
- ใช้ Supabase Auth เป็นแหล่งตัวตนผู้ใช้
- `co_desk.profiles.profile_id` ออกแบบให้ map กับ `auth.users.id`
- การ provisioning user (`admin only`) ถูกออกแบบไว้แล้วสำหรับบทที่ 1-3 และยังเป็นงานใน phase implementation

หลักการ security สำหรับ provisioning:
1. Frontend เรียกเฉพาะ backend endpoint (ไม่เรียก Supabase Admin API โดยตรง)
2. `SUPABASE_SERVICE_ROLE_KEY` ต้องเก็บฝั่ง server เท่านั้น
3. Backend ต้อง authorize ว่า caller เป็น `admin` ก่อนทำ create user
4. หลัง create `auth.users` สำเร็จ ต้อง sync `co_desk.profiles` พร้อม role/department/status
5. ต้องมี validation ขั้นต่ำ: email ซ้ำ, role valid, department exists, status valid
6. ควรมี audit log สำหรับการจัดการผู้ใช้โดย admin

## 12) Date/Time Standards
มาตรฐานที่ต้องคงไว้ทุกชั้น:
- UI/document date format: `YYYY-MM-DD`
- Timezone baseline: `Asia/Bangkok`
- Database storage: ใช้ `timestamptz` และ `date` ตามเจตนาข้อมูล
- การจองช่วงเวลา: ระดับชั่วโมง (ไม่ลงนาที)

## 13) Setup / Run Instructions (Current Repo)
### 13.1 Prerequisites
1. PostgreSQL 14+ หรือ Supabase project
2. สิทธิ์สร้าง schema/extensions/functions/views
3. SQL client (เช่น Supabase SQL Editor / psql)

### 13.2 Apply SQL (recommended order)
1. `database/sql/01_create_schema_and_tables.sql`
2. `database/sql/02_create_indexes_and_constraints.sql` (no-op compatibility)
3. `database/sql/03_create_reporting_views.sql`
4. `database/sql/04_create_rpc_placeholders.sql`
5. `database/sql/05_seed_demo_minimal.sql` (optional)

### 13.3 Quick verification queries
```sql
-- ตารางหลัก
select table_name
from information_schema.tables
where table_schema = 'co_desk'
order by table_name;

-- views
select table_name
from information_schema.views
where table_schema = 'co_desk'
order by table_name;

-- functions
select routine_name
from information_schema.routines
where routine_schema = 'co_desk'
order by routine_name;
```

## 14) Environment Variables (Implementation Phase)
สถานะปัจจุบัน: ยังไม่มีไฟล์แอปสำหรับรัน frontend/backend ใน repo นี้

ตัวแปรที่คาดว่าจะต้องใช้ใน phase implementation:
- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Backend (.NET): connection string ไป Supabase Postgres
- Frontend: endpoint/API base URL และ key ตามแนวทางความปลอดภัย

## 15) Demo Data / Demo Users
ไฟล์ `database/sql/05_seed_demo_minimal.sql` มี:
1. seed roles (`employee/hr/admin`)
2. seed departments
3. seed capacity policies
4. seed holidays
5. optional seed profiles (เมื่อมี `auth.users` ตรง email)
6. optional sample booking 1 รายการ

หมายเหตุ: ไม่มีข้อมูลอ่อนไหวจริง

## 16) Testing / Verification Status
มีเฉพาะการตรวจระดับเอกสารและ SQL design readiness ในเฟสนี้

มีเอกสารตรวจ readiness:
- `docs/short-paper/ch1-3-submission-checklist.md`

สถานะล่าสุด: พร้อมส่งหลังแก้เล็กน้อย (มี blocker ความสอดคล้องบางจุดของบทที่ 3)

## 17) File Structure (Current)
```text
README.md
skills-lock.json

database/sql/
  01_create_schema_and_tables.sql
  02_create_indexes_and_constraints.sql
  03_create_reporting_views.sql
  04_create_rpc_placeholders.sql
  05_seed_demo_minimal.sql

docs/ai-context/
  DECISIONS.md
  HANDOFF.md
  MASTER_CONTEXT.md
  PROMPT_HISTORY.md
  REQUIREMENTS_SOURCE.md
  SESSION_LOG.md
  OPEN_TASKS.md

docs/short-paper/
  ch01-introduction-draft.md
  ch02-related-theory-draft.md
  ch03-methodology-draft.md
  ch1-3-submission-checklist.md
  requirements-for-paper.md
  erd-design-notes.md
  database-ddl-summary.md
  reporting-views-design.md
  reference-placeholders.md
  glossary.md
```

## 18) Short Paper Support Mapping (Chapter 1-3)
- Chapter 1 draft: `docs/short-paper/ch01-introduction-draft.md`
- Chapter 2 draft: `docs/short-paper/ch02-related-theory-draft.md`
- Chapter 3 draft: `docs/short-paper/ch03-methodology-draft.md`
- Requirements to chapter traceability: `docs/short-paper/requirements-for-paper.md`
- ERD-ready details: `docs/short-paper/erd-design-notes.md`
- DDL summary: `docs/short-paper/database-ddl-summary.md`
- Reporting design: `docs/short-paper/reporting-views-design.md`
- Submission readiness checklist: `docs/short-paper/ch1-3-submission-checklist.md`

## 19) AI Context Continuation Guide
เมื่อต้องทำงานต่อจากเครื่องอื่น ให้เปิดไฟล์ตามลำดับ:
1. `docs/ai-context/HANDOFF.md`
2. `docs/ai-context/MASTER_CONTEXT.md`
3. `docs/ai-context/OPEN_TASKS.md`
4. `docs/ai-context/SESSION_LOG.md`
5. `docs/ai-context/PROMPT_HISTORY.md`
6. `docs/short-paper/ch1-3-submission-checklist.md`

หลักฐาน requirement ต้นทาง:
- `docs/ai-context/REQUIREMENTS_SOURCE.md` (verbatim)

## 20) Known Issues / Limitations
1. `docs/short-paper/ch03-methodology-draft.md` ยังมีชื่อ field/view บางส่วนไม่ตรงกับ ERD/SQL ล่าสุด
2. RLS policies ยังไม่ implement จริงในฐานข้อมูล
3. RPC functions ยังเป็น placeholder (ยังไม่ทำ transaction + locking + full authorization)
4. ยังไม่มี source code frontend/backend ใน repo นี้ (เฟสเอกสาร/ออกแบบเป็นหลัก)
5. Admin user provisioning ใน Supabase Auth อยู่ในสถานะ design/documented เท่านั้น ยังไม่ implement endpoint จริง

## 21) Latest Session Change Summary (2026-02-21)
สรุปการเปลี่ยนแปลงล่าสุดของ session นี้:
1. สร้าง submission-readiness checklist บทที่ 1-3
2. ทำ ERD-ready spec ให้ละเอียดและพร้อมวาด ERD
3. รวม SQL ไฟล์ `01` และ `02` ตามคำสั่ง (โดยคง `02` เป็น no-op compatibility)
4. อัปเดตเอกสาร context/handoff สำหรับทำงานต่อข้ามเครื่อง
5. อัปเดต README ให้สอดคล้องกับเอกสารและ SQL artifacts ล่าสุด

รายละเอียดเชิง timeline:
- ดู `docs/ai-context/SESSION_LOG.md`

## 22) SQL Runtime Validation Status (2026-02-22)
สถานะล่าสุด: **ผ่านการรันทดสอบจริง (execution-verified)** บน PostgreSQL-compatible environment

สภาพแวดล้อมที่ใช้ตรวจ:
1. PostgreSQL `14.21` (Homebrew local instance)
2. รันด้วย `psql -v ON_ERROR_STOP=1`
3. ทดสอบตามลำดับจริง:
   - `database/sql/01_create_schema_and_tables.sql`
   - `database/sql/03_create_reporting_views.sql`
   - `database/sql/04_create_rpc_placeholders.sql`
   - `database/sql/05_seed_demo_minimal.sql`

ผลทดสอบ:
1. ทั้ง 4 ไฟล์รันผ่านครบโดยไม่เกิด error
2. verification ผ่าน:
   - schema `co_desk` ถูกสร้างสำเร็จ
   - tables ถูกสร้าง 8 ตาราง
   - views ถูกสร้าง 6 views (>= 5)
   - functions ถูกสร้าง 6 functions
   - seed data สำเร็จ (`roles=3`, `departments=3`, `department_capacity_policies=3`, `holidays=3`)
3. มีการทดสอบเรียกใช้งาน view/function แบบ smoke test และคืนผลได้ตามคาด

หมายเหตุ:
- ใน environment นี้ Docker daemon ไม่พร้อมใช้งาน จึงใช้ PostgreSQL local instance แทนสำหรับ dry-run
- placeholder business logic ใน RPC ยังคงเป็น design intent (compile/run ได้ แต่ยังไม่ใช่ transactional implementation เต็ม)

## 23) Future Implementation Plan (Admin User Provisioning)
สถานะปัจจุบันของฟีเจอร์นี้: **ออกแบบไว้ในบทที่ 1-3 แล้ว แต่ยังไม่ implement code**

แผนงาน phase ถัดไป:
1. สร้าง backend endpoint สำหรับ admin provisioning ใน .NET API
2. ตรวจสิทธิ์ caller ว่าเป็น `admin` ก่อนเรียก Supabase Admin API
3. เรียก Supabase Admin API เพื่อสร้าง user ใน `auth.users`
4. ทำ profile sync ใน `co_desk.profiles` พร้อม role/department/status แบบ transactional
5. เพิ่ม validation ครบ (email duplicate, role valid, department exists, status valid)
6. เพิ่ม audit log สำหรับการจัดการผู้ใช้โดย admin
7. ทดสอบ security regression เพื่อยืนยันว่า service role key ไม่ถูกใช้จาก frontend
