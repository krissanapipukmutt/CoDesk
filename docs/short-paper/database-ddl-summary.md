# Database DDL Summary (co_desk)

## 1) วัตถุประสงค์ของชุด SQL
เอกสารนี้สรุปชุด SQL สำหรับโครงการ `co_desk` ในระดับ database-first design เพื่อใช้อ้างอิงใน Short Paper บทที่ 3 โดยครอบคลุมการสร้าง schema/tables, constraints/indexes, reporting views และ RPC placeholders สำหรับกติกาที่ต้องใช้ธุรกรรมหรือเงื่อนไขข้ามตาราง

มาตรฐานที่ยืนยันในแบบจำลอง:
- ชื่อ schema: `co_desk`
- รูปแบบวันที่ที่ชั้น UI/เอกสาร: `YYYY-MM-DD`
- timezone กลางของระบบ: `Asia/Bangkok`
- field เวลาที่ชั้นฐานข้อมูลใช้ `timestamptz` และ `date` ตามกรณี

## 2) ภาพรวมไฟล์ SQL
| ไฟล์ | เนื้อหา |
|---|---|
| `database/sql/01_create_schema_and_tables.sql` | สร้าง schema, enum types, ตารางหลัก พร้อม constraints/indexes (ไฟล์รวม) |
| `database/sql/02_create_indexes_and_constraints.sql` | no-op placeholder เพื่อ compatibility (logic ถูกรวมเข้าไฟล์ 01 แล้ว) |
| `database/sql/03_create_reporting_views.sql` | สร้างรายงานด้วย views อย่างน้อย 5 รายการ |
| `database/sql/04_create_rpc_placeholders.sql` | สร้าง function/RPC placeholders สำหรับ business rules สำคัญ |
| `database/sql/05_seed_demo_minimal.sql` | seed ข้อมูล demo ระดับ minimal (ไม่อ่อนไหว) |

## 3) สรุปตารางหลัก (Purpose + Key Columns)
| Table | Purpose | Key Columns |
|---|---|---|
| `co_desk.roles` | นิยามบทบาท RBAC (`employee/hr/admin`) | `role_id`, `role_code`, `can_manage_users`, `can_manage_departments`, `can_view_reports` |
| `co_desk.departments` | เก็บข้อมูลฝ่ายและนโยบายความจุเริ่มต้น | `department_id`, `department_code`, `capacity_mode`, `default_capacity_per_day`, `effective_timezone` |
| `co_desk.profiles` | โปรไฟล์ผู้ใช้ที่ผูกกับ Supabase Auth | `profile_id`, `employee_code`, `email`, `department_id`, `role_id`, `timezone_name` |
| `co_desk.department_capacity_policies` | นโยบายความจุแบบมีผลตามช่วงเวลา | `policy_id`, `department_id`, `effective_start_date`, `effective_end_date`, `capacity_mode`, `capacity_per_day` |
| `co_desk.holidays` | วันหยุดสำหรับ warning/confirm ตอนจอง | `holiday_id`, `holiday_date`, `holiday_name`, `is_active` |
| `co_desk.bookings` | ธุรกรรมการจองหลัก | `booking_id`, `booked_for_profile_id`, `booked_by_profile_id`, `department_id`, `booking_mode`, `start_at`, `end_at`, `status_code`, `holiday_warning_acknowledged` |
| `co_desk.booking_audit_logs` | ประวัติ create/update/cancel เพื่อ audit | `audit_log_id`, `booking_id`, `action_code`, `actor_profile_id`, `old_values_json`, `new_values_json`, `action_at` |
| `co_desk.user_department_history` (optional) | เก็บประวัติการย้ายฝ่ายเพื่อรายงานย้อนหลัง | `history_id`, `profile_id`, `department_id`, `assigned_start_date`, `assigned_end_date` |

## 4) Constraints และ Indexes สำคัญ
### 4.1 Constraints ที่บังคับใช้แล้ว
- `EXCLUDE` ป้องกันผู้ใช้เดิมจองซ้อนเวลา (`bookings_no_overlap_per_user_excl`)
- `CHECK` สำหรับรูปแบบเวลาเป็นระดับชั่วโมง (ไม่ลงนาที)
- `CHECK` สำหรับกฎ `single_day` (ทั้งวัน) และ `time_range`
- `CHECK` สำหรับสถานะการยกเลิก (`status_code`, `cancelled_at`, `cancelled_by_profile_id`)
- `CHECK` สำหรับ capacity mode consistency (`limited/unlimited`)
- `UNIQUE` สำหรับข้อมูลหลัก เช่น `department_code`, `employee_code`, `holiday_date`
- `EXCLUDE` ป้องกันนโยบายความจุช่วงเวลาทับซ้อนในแผนกเดียวกัน

### 4.2 Indexes ที่เน้น query patterns
- FK indexes: `profiles.department_id`, `profiles.role_id`, `bookings.department_id`, `bookings.booked_for_profile_id`, `bookings.booked_by_profile_id`
- Calendar/report indexes: `bookings(start_at)`, `bookings(booking_date_start, booking_date_end)`
- Partial indexes สำหรับ active bookings (`status_code = 'booked'`)
- Expression unique index: `lower(profiles.email)`
- Audit indexes: `booking_audit_logs(booking_id, action_at)`

## 5) Business Rules: Enforce ได้แล้ว vs ต้องใช้ RPC/Logic เพิ่ม
| Business Rule | Enforced by DDL | ต้องใช้ RPC/Transaction เพิ่ม |
|---|---|---|
| ผู้ใช้เดิมห้ามจองซ้อนเวลา | ✅ (`EXCLUDE` + range) | - |
| กติกาช่วงเวลา (single_day/time_range, hour precision) | ✅ (`CHECK`) | - |
| กำหนดบทบาท RBAC หลัก | ✅ (roles + references) | ต้องเสริม RLS/policies ใน phase ถัดไป |
| ความจุแผนก limited/unlimited | ✅ โครงสร้างและค่าพื้นฐาน | ✅ ต้องตรวจนับเชิงธุรกรรม (concurrency-safe) |
| จองตรงวันหยุดต้อง warning+confirm | ✅ โครงสร้างรองรับ | ✅ ต้องตรวจข้ามตารางก่อน insert/update |
| สิทธิ์ HR จองได้เฉพาะตนเอง / Admin override | โครงสร้างรองรับ | ✅ ต้องบังคับใน RPC + RLS |

## 6) ความเชื่อมโยงกับบทที่ 3 (Methodology)
SQL artifacts ชุดนี้รองรับเนื้อหาในบทที่ 3 โดยตรงในประเด็น:
1. การออกแบบฐานข้อมูลแบบ database-first
2. การกำหนด entities/relationships/constraints
3. การออกแบบ validation และ business rules ระดับฐานข้อมูล
4. การเตรียม reporting layer ด้วย database views
5. การนิยาม RPC placeholders สำหรับ logic ที่ต้องใช้ transaction/locking

## 7) Requirement Coverage (สรุป)
### 7.1 ครอบคลุมแล้วในระดับ DDL/RPC design
- `SB-02`, `SB-03`, `SB-04`, `SB-05`, `SB-08`, `SB-09`, `SB-10`
- `DEP-03`, `DEP-03A`, `DEP-03B`
- `HOL-02`, `HOL-03`
- `UR-01`, `ROLE-01`, `ROLE-02`, `ROLE-03`
- `REP-01`, `REP-02`, `CLR-01`, `CLR-03`, `CLR-05`
- `AUTH-01`, `SEC-01`, `FMT-01`

### 7.2 ยังไม่ครอบคลุมเต็ม (รอ phase implementation)
- `REP-03`: Excel-like column filtering (ต้องทำที่ application layer ด้วย TanStack Table)
- `CAL-04`: พฤติกรรมเปลี่ยนเดือนในปฏิทิน (frontend behavior)
- `UR-03`, `UR-04`: หน้า/flow สร้างผู้ใช้และการจำกัดสิทธิ์ในระดับ API/UI
- `AUTH-02`: DEMO mode เชิง UI/README workflow
- RLS policies เชิงละเอียด (ตารางและคำสั่ง policy จะทำใน migration implementation phase)

## 8) หมายเหตุเชิงวิศวกรรม
แม้เอกสารนี้ยังไม่ใช่ implementation เต็มของ RPC แต่โครงสร้างตาราง, constraints, reporting views และ function signatures ถูกกำหนดให้ต่อยอดเป็น migration และ backend service ได้ทันที โดยยังคง traceability กับ requirement IDs ที่วิเคราะห์ไว้ก่อนหน้า
