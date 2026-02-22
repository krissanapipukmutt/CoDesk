# MASTER_CONTEXT

- Project: `co_desk`
- PostgreSQL Schema: `co_desk`
- Branch: `feature/CoDesk-03`
- Snapshot Time: `2026-02-22 00:35:58 +07 (UTC+0700)`
- Current Phase: อัปเดตเอกสารบทที่ 1-3 ให้รองรับ requirement เพิ่มเติมเรื่อง Admin User Provisioning (design-only, no implementation code)

## 1) เป้าหมายหลักของเฟสปัจจุบัน
1. จัดทำ deliverables สำหรับ Short Paper บทที่ 1-3 ให้พร้อมส่งในเชิงโครงสร้าง
2. คง requirement traceability แบบละเอียดและตรวจย้อนกลับได้
3. สร้าง SQL artifacts ระดับออกแบบ (`DDL + views + RPC placeholders + demo seed`)
4. อัปเดต context docs ให้ทำงานต่อข้ามเครื่องได้ทันที

## 2) Tech Stack Baseline (ตรึงตาม requirement)
- Frontend: React + TypeScript
- Backend: ASP.NET Core Web API (.NET 10)
- Database/Auth: Supabase PostgreSQL + Supabase Auth + RLS
- UI: Tailwind CSS + shadcn/ui
- Calendar: FullCalendar
- Reporting Table: TanStack Table
- Charts: Recharts
- Date/Time: dayjs + timezone plugin (`Asia/Bangkok`)

## 3) Best-Practice Baseline
ไฟล์ `skills.sh` ไม่พบใน repo จึงใช้แนวทางจาก skills ที่มีจริงใน `.agents`:
1. `.agents/skills/database-schema-designer/SKILL.md`
2. `.agents/skills/postgresql-table-design/SKILL.md`
3. `.agents/skills/supabase-postgres-best-practices/SKILL.md`

หลักปฏิบัติที่ใช้ต่อเนื่อง:
1. Database-first + traceability-first
2. ใช้ PostgreSQL data types ให้ตรง semantic (`timestamptz`, `date`, range types)
3. บังคับ constraints/indexes ใน schema เท่าที่ทำได้
4. แยก business rules ที่ต้อง transactional logic ไป RPC layer
5. เอกสารต้องส่งต่อข้ามเครื่องได้โดยไม่พึ่งประวัติแชต

## 4) Requirement Baseline (Confirmed)
- Source verbatim: `docs/ai-context/REQUIREMENTS_SOURCE.md`
- Structured analysis: `docs/short-paper/requirements-for-paper.md`
- Requirement units tracked รวม: **66 ข้อ/ข้อย่อย**
  - Business requirement IDs: 49
  - Guardrail IDs: 1 (`SEC-01`)
  - Clarification IDs: 5 (`CLR-01..CLR-05`)
  - Provisioning extension IDs: 11 (`UR-05..UR-07`, `SEC-02..SEC-03`, `VAL-01..VAL-04`, `AUD-01`)

กติกาธุรกิจที่ต้องไม่ตกหล่น:
1. Roles: `employee`, `hr`, `admin`
2. Booking conflict prevention
3. Department capacity `limited/unlimited`
4. Holiday warning + confirm
5. Reporting views อย่างน้อย 5
6. Supabase Auth + RLS narrative/design
7. Timezone `Asia/Bangkok` และเวลา 24 ชั่วโมง
8. Date format `YYYY-MM-DD`
9. Admin provisioning ใน `auth.users` ต้องผ่าน backend endpoint เท่านั้น
10. Service role key เป็น server-only secret และ backend ต้อง authorize caller ว่าเป็น admin

## 5) Deliverables Status (Current)
### 5.1 Short Paper Drafts
- `docs/short-paper/ch01-introduction-draft.md` (ร่างบทที่ 1)
- `docs/short-paper/ch02-related-theory-draft.md` (ร่างบทที่ 2)
- `docs/short-paper/ch03-methodology-draft.md` (ร่างบทที่ 3)
- `docs/short-paper/ch1-3-submission-checklist.md` (ผลประเมิน readiness)

### 5.2 Requirements / Traceability
- `docs/ai-context/REQUIREMENTS_SOURCE.md` (verbatim)
- `docs/short-paper/requirements-for-paper.md` (grouping + IDs + chapter mapping)

### 5.3 Database-First Artifacts
- `database/sql/01_create_schema_and_tables.sql` (รวม tables + constraints + indexes)
- `database/sql/02_create_indexes_and_constraints.sql` (no-op compatibility)
- `database/sql/03_create_reporting_views.sql` (6 views)
- `database/sql/04_create_rpc_placeholders.sql` (6 functions)
- `database/sql/05_seed_demo_minimal.sql` (optional demo seed)
- Runtime validation status: รันจริงผ่านครบลำดับ `01 -> 03 -> 04 -> 05` ด้วย PostgreSQL-compatible executor (no errors)

### 5.4 Design Support Docs
- `docs/short-paper/erd-design-notes.md` (ERD-ready)
- `docs/short-paper/database-ddl-summary.md`
- `docs/short-paper/reporting-views-design.md`
- `docs/short-paper/reference-placeholders.md`
- `docs/short-paper/glossary.md`

## 6) Readiness Snapshot
จาก checklist ล่าสุด (`docs/short-paper/ch1-3-submission-checklist.md`):
- Result: **พร้อมส่งหลังแก้เล็กน้อย**
- PASS: 12
- PARTIAL: 2
- FAIL: 0

บล็อกเกอร์สำคัญที่ยังคงต้องเก็บงาน:
1. `B-01`: เนื้อหาในบทที่ 3 ยังมีชื่อ field/view บางส่วนไม่ตรง ERD/SQL ล่าสุด
2. RLS policies ยังเป็น design intent (ยังไม่ลง SQL policy implementation)

## 7) Assumptions / Decisions Reference
- ดูรายละเอียดที่ `docs/ai-context/DECISIONS.md` (DEC-01..DEC-08)
- จุดสำคัญ:
  1. ใช้ Bangkok timezone baseline
  2. Single day = ทั้งวัน
  3. Overlap enforce ด้วย exclusion constraint
  4. Capacity/Holiday checks ใช้ RPC transactional logic ใน phase ถัดไป

## 8) Open Tasks Summary
รายละเอียดเต็ม: `docs/ai-context/OPEN_TASKS.md`
- High:
  1. ปรับ `ch03-methodology-draft.md` ให้ชื่อ object สอดคล้อง ERD/SQL 100%
  2. ตรวจภาษาเชิงวิชาการและความพร้อมส่งโดยมนุษย์
- Medium:
  1. เพิ่ม RLS policy SQL + grants สำหรับ `employee/hr/admin`
  2. ยกระดับ RPC placeholders เป็น transactional implementation
- Low:
  1. ปรับแต่งรายงานและ dashboard integration ใน phase implementation

## 9) เอกสารนำทางสำหรับการทำงานต่อ
เปิดไฟล์ตามลำดับนี้:
1. `docs/ai-context/HANDOFF.md`
2. `docs/ai-context/OPEN_TASKS.md`
3. `docs/short-paper/ch1-3-submission-checklist.md`
4. `docs/short-paper/ch03-methodology-draft.md`
5. `docs/short-paper/erd-design-notes.md`
6. `database/sql/01_create_schema_and_tables.sql`
