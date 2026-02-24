# ERD Design Notes (ERD-Ready) สำหรับ Schema `co_desk`

## 1) ขอบเขตการรีวิวและผลสรุป
เอกสารฉบับนี้เป็นผลทบทวนการออกแบบฐานข้อมูลของโครงการ CoDesk โดยเทียบกับแหล่งอ้างอิงหลัก ได้แก่ `docs/ai-context/REQUIREMENTS_SOURCE.md`, `docs/short-paper/requirements-for-paper.md`, `docs/short-paper/ch03-methodology-draft.md`, และ SQL ปัจจุบัน (`database/sql/01_create_schema_and_tables.sql`, `database/sql/03_create_reporting_views.sql`, `database/sql/04_create_rpc_placeholders.sql`, `database/sql/05_seed_demo_minimal.sql`) เพื่อให้พร้อมนำไปวาด ER Diagram ได้ทันที

ผลรีวิว: **ผ่านแต่ควรแก้เล็กน้อย และได้ปรับแก้แล้วในเอกสารนี้** โดยยึด SQL ปัจจุบันเป็น physical baseline และแยกส่วนที่เป็น proposed design สำหรับ phase ถัดไปอย่างชัดเจน

ประเด็นที่ปรับให้ชัดเจนในรอบนี้:
1. แยก entity ที่มีอยู่จริงใน SQL ออกจาก entity ที่เป็น proposal
2. ยืนยัน FK/relationship/cardinality ให้ตรงกับ DDL ทุกจุด
3. เพิ่มขอบเขตว่าอะไรควรใส่ในภาพ ERD และอะไรควรเก็บไว้ใน notes
4. เพิ่มสรุป assumptions/limitations สำหรับใช้เป็นหมายเหตุใต้ภาพ

## 2) Conventions สำหรับการวาด ERD
1. ใช้ schema หลัก: `co_desk`
2. ชื่อตารางและคอลัมน์ใช้ `snake_case`
3. Primary key ลงท้ายด้วย `_id`
4. วันที่เก็บเป็น `date`, เวลาเก็บเป็น `timestamptz`
5. มาตรฐานการแสดงผลระดับธุรกิจ: `YYYY-MM-DD` และ timezone `Asia/Bangkok`
6. หากแสดงระบบภายนอก (`auth.users`) ให้ใช้กรอบเส้นประ (external boundary)

## 3) Entity Catalog (Physical Baseline จาก SQL ปัจจุบัน)

### 3.1 `co_desk.roles`
วัตถุประสงค์: เก็บบทบาทหลักของ RBAC (`employee`, `hr`, `admin`)

| Attribute | Logical Type | Key/Constraint |
|---|---|---|
| `role_id` | bigint (identity) | PK |
| `role_code` | `co_desk.role_code` (enum) | UNIQUE, NOT NULL |
| `role_name` | text | UNIQUE, NOT NULL |
| `role_description` | text | nullable |
| `can_manage_users` | boolean | NOT NULL |
| `can_manage_departments` | boolean | NOT NULL |
| `can_view_reports` | boolean | NOT NULL |
| `is_system_role` | boolean | NOT NULL |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

PK: `role_id`  
FK: ไม่มี

### 3.2 `co_desk.departments`
วัตถุประสงค์: เก็บข้อมูลฝ่ายงานและนโยบายความจุพื้นฐานระดับฝ่าย

| Attribute | Logical Type | Key/Constraint |
|---|---|---|
| `department_id` | bigint (identity) | PK |
| `department_code` | text | UNIQUE, NOT NULL |
| `department_name` | text | NOT NULL |
| `capacity_mode` | `co_desk.capacity_mode` (enum) | NOT NULL |
| `default_capacity_per_day` | integer | CHECK, NOT NULL |
| `is_active` | boolean | NOT NULL |
| `effective_timezone` | text | CHECK (`Asia/Bangkok`), NOT NULL |
| `created_by_profile_id` | uuid | FK, nullable |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

PK: `department_id`  
FK: `created_by_profile_id -> co_desk.profiles.profile_id` (`ON DELETE SET NULL`)

### 3.3 `co_desk.profiles`
วัตถุประสงค์: เก็บโปรไฟล์ผู้ใช้เชิงธุรกิจเพื่อเชื่อม Supabase Auth กับข้อมูลระบบ

| Attribute | Logical Type | Key/Constraint |
|---|---|---|
| `profile_id` | uuid | PK |
| `employee_code` | text | UNIQUE, NOT NULL |
| `full_name` | text | NOT NULL |
| `email` | text | NOT NULL, unique index on `lower(email)` |
| `department_id` | bigint | FK, NOT NULL |
| `role_id` | bigint | FK, NOT NULL |
| `is_active` | boolean | NOT NULL |
| `timezone_name` | text | CHECK (`Asia/Bangkok`), NOT NULL |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

PK: `profile_id`  
FK:
- `department_id -> co_desk.departments.department_id`
- `role_id -> co_desk.roles.role_id`
- Optional runtime FK: `profile_id -> auth.users.id` (สร้างเมื่อ schema `auth` มีอยู่)

### 3.4 `co_desk.department_capacity_policies`
วัตถุประสงค์: เก็บนโยบายความจุแบบมีช่วงวันที่มีผล (รองรับประวัตินโยบาย)

| Attribute | Logical Type | Key/Constraint |
|---|---|---|
| `policy_id` | bigint (identity) | PK |
| `department_id` | bigint | FK, NOT NULL |
| `effective_start_date` | date | NOT NULL |
| `effective_end_date` | date | nullable |
| `capacity_mode` | `co_desk.capacity_mode` (enum) | NOT NULL |
| `capacity_per_day` | integer | conditional check |
| `note_text` | text | nullable |
| `is_active` | boolean | NOT NULL |
| `created_by_profile_id` | uuid | FK, nullable |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |
| `effective_date_range` | daterange (generated) | ใช้กับ exclusion constraint |

PK: `policy_id`  
FK:
- `department_id -> co_desk.departments.department_id` (`ON DELETE CASCADE`)
- `created_by_profile_id -> co_desk.profiles.profile_id` (`ON DELETE SET NULL`)

### 3.5 `co_desk.holidays`
วัตถุประสงค์: เก็บวันหยุดเพื่อรองรับเงื่อนไข warning/confirmation ขณะจอง

| Attribute | Logical Type | Key/Constraint |
|---|---|---|
| `holiday_id` | bigint (identity) | PK |
| `holiday_date` | date | UNIQUE, NOT NULL |
| `holiday_name` | text | NOT NULL |
| `holiday_description` | text | nullable |
| `is_active` | boolean | NOT NULL |
| `created_by_profile_id` | uuid | FK, nullable |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

PK: `holiday_id`  
FK: `created_by_profile_id -> co_desk.profiles.profile_id` (`ON DELETE SET NULL`)

### 3.6 `co_desk.bookings`
วัตถุประสงค์: เก็บธุรกรรมการจองที่นั่ง (ทั้งรายวันและช่วงเวลา)

| Attribute | Logical Type | Key/Constraint |
|---|---|---|
| `booking_id` | bigint (identity) | PK |
| `booked_for_profile_id` | uuid | FK, NOT NULL |
| `booked_by_profile_id` | uuid | FK, NOT NULL |
| `department_id` | bigint | FK, NOT NULL |
| `booking_mode` | `co_desk.booking_mode` (enum) | NOT NULL |
| `booking_date_start` | date | NOT NULL |
| `booking_date_end` | date | NOT NULL |
| `start_at` | timestamptz | NOT NULL |
| `end_at` | timestamptz | NOT NULL |
| `booking_period` | tstzrange (generated) | ใช้กับ exclusion constraint |
| `holiday_warning_acknowledged` | boolean | NOT NULL |
| `status_code` | `co_desk.booking_status` (enum) | NOT NULL |
| `note_text` | text | nullable |
| `cancelled_at` | timestamptz | nullable |
| `cancelled_by_profile_id` | uuid | FK, nullable |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

PK: `booking_id`  
FK:
- `booked_for_profile_id -> co_desk.profiles.profile_id`
- `booked_by_profile_id -> co_desk.profiles.profile_id`
- `department_id -> co_desk.departments.department_id`
- `cancelled_by_profile_id -> co_desk.profiles.profile_id`

### 3.7 `co_desk.booking_audit_logs`
วัตถุประสงค์: บันทึกเหตุการณ์ create/update/cancel ของการจองเพื่อการตรวจสอบย้อนหลัง

| Attribute | Logical Type | Key/Constraint |
|---|---|---|
| `audit_log_id` | bigint (identity) | PK |
| `booking_id` | bigint | FK, NOT NULL |
| `action_code` | `co_desk.audit_action` (enum) | NOT NULL |
| `actor_profile_id` | uuid | FK, NOT NULL |
| `actor_role_code` | `co_desk.role_code` (enum) | NOT NULL |
| `action_reason` | text | nullable |
| `old_values_json` | jsonb | NOT NULL |
| `new_values_json` | jsonb | NOT NULL |
| `action_at` | timestamptz | NOT NULL |
| `request_id` | uuid | nullable |
| `ip_address` | inet | nullable |
| `user_agent` | text | nullable |

PK: `audit_log_id`  
FK:
- `booking_id -> co_desk.bookings.booking_id` (`ON DELETE CASCADE`)
- `actor_profile_id -> co_desk.profiles.profile_id`

### 3.8 `co_desk.user_department_history`
วัตถุประสงค์: เก็บประวัติการย้ายฝ่ายของผู้ใช้ (สนับสนุนรายงานย้อนหลัง)

| Attribute | Logical Type | Key/Constraint |
|---|---|---|
| `history_id` | bigint (identity) | PK |
| `profile_id` | uuid | FK, NOT NULL |
| `department_id` | bigint | FK, NOT NULL |
| `assigned_start_date` | date | NOT NULL |
| `assigned_end_date` | date | nullable |
| `assigned_by_profile_id` | uuid | FK, nullable |
| `note_text` | text | nullable |
| `created_at` | timestamptz | NOT NULL |
| `updated_at` | timestamptz | NOT NULL |

PK: `history_id`  
FK:
- `profile_id -> co_desk.profiles.profile_id` (`ON DELETE CASCADE`)
- `department_id -> co_desk.departments.department_id`
- `assigned_by_profile_id -> co_desk.profiles.profile_id`

## 4) Proposed/External Entities (ไม่ใช่ Physical Baseline ใน SQL ปัจจุบัน)

### 4.1 `co_desk.user_admin_audit_logs` (Proposed)
วัตถุประสงค์: รองรับ requirement `AUD-01` สำหรับ audit การจัดการผู้ใช้โดย admin (create/update/activate/deactivate)

สถานะ: ยังไม่อยู่ใน `database/sql/01_create_schema_and_tables.sql` และควรเพิ่มใน phase implementation

### 4.2 `auth.users` (External)
วัตถุประสงค์: แหล่ง identity ของ Supabase Auth

สถานะใน ERD: แนะนำวาดเป็น external entity พร้อมเส้นเชื่อมเชิงแนวคิด 1:1 กับ `co_desk.profiles`

## 5) Relationships และ Cardinality ที่ต้องใส่ใน ERD

### 5.1 Physical FK Relationships (อ้างอิง DDL โดยตรง)
| From | To | Cardinality | Optionality |
|---|---|---|---|
| `profiles.role_id` | `roles.role_id` | N:1 | mandatory |
| `profiles.department_id` | `departments.department_id` | N:1 | mandatory |
| `departments.created_by_profile_id` | `profiles.profile_id` | N:1 | optional |
| `department_capacity_policies.department_id` | `departments.department_id` | N:1 | mandatory |
| `department_capacity_policies.created_by_profile_id` | `profiles.profile_id` | N:1 | optional |
| `holidays.created_by_profile_id` | `profiles.profile_id` | N:1 | optional |
| `bookings.booked_for_profile_id` | `profiles.profile_id` | N:1 | mandatory |
| `bookings.booked_by_profile_id` | `profiles.profile_id` | N:1 | mandatory |
| `bookings.department_id` | `departments.department_id` | N:1 | mandatory |
| `bookings.cancelled_by_profile_id` | `profiles.profile_id` | N:1 | optional |
| `booking_audit_logs.booking_id` | `bookings.booking_id` | N:1 | mandatory |
| `booking_audit_logs.actor_profile_id` | `profiles.profile_id` | N:1 | mandatory |
| `user_department_history.profile_id` | `profiles.profile_id` | N:1 | mandatory |
| `user_department_history.department_id` | `departments.department_id` | N:1 | mandatory |
| `user_department_history.assigned_by_profile_id` | `profiles.profile_id` | N:1 | optional |

### 5.2 Conceptual Relationships (ไม่ใช่ FK ตรง)
| Relation | Cardinality | หมายเหตุ |
|---|---|---|
| `bookings` ↔ `holidays` | 0..N (ตามช่วงวันที่จอง) | ใช้เงื่อนไข `holiday_date between booking_date_start and booking_date_end` |
| `auth.users` ↔ `co_desk.profiles` | 1:1 (target model) | มีการสร้าง FK แบบ conditional เมื่อมี `auth.users` |

## 6) Requirement Mapping: Business Rules ระดับแบบจำลองข้อมูล
| Rule ID | Requirement ID | สาระของกติกา | การรองรับปัจจุบัน |
|---|---|---|---|
| `BR-01` | `SB-04`, `SB-09` | ห้ามผู้ใช้เดิมจองซ้อนเวลา | DDL (`EXCLUDE`) + RPC placeholder |
| `BR-02` | `DEP-03`, `DEP-03A`, `DEP-03B`, `CLR-05` | คุม capacity แบบ limited/unlimited | โครงสร้าง DDL + RPC placeholder |
| `BR-03` | `HOL-03` | จองทับวันหยุดได้ แต่ต้องเตือนและยืนยัน | DDL field + RPC placeholder |
| `BR-04` | `UR-01`, `ROLE-01..03`, `SEC-01` | RBAC + RLS ตามบทบาท | โครงสร้าง role/profile รองรับ; RLS ยังเป็น phase ถัดไป |
| `BR-05` | `REP-01`, `REP-02` | รองรับรายงานสำหรับ hr/admin | มี reporting views แล้ว |
| `BR-06` | `UR-05..UR-07`, `SEC-02`, `SEC-03` | Admin provisioning ผ่าน backend และ server-only secret | design intent ในเอกสารบทที่ 2-3 |
| `BR-07` | `VAL-01..VAL-04` | validation email/role/department/status ก่อน sync profile | phase implementation |
| `BR-08` | `AUD-01` | audit การจัดการผู้ใช้โดย admin | มี proposal table ยังไม่สร้างจริง |
| `BR-09` | `FMT-01`, `SB-10` | `YYYY-MM-DD` + `Asia/Bangkok` | กำกับทั้ง schema/docs |

## 7) Candidate Constraints และ Indexes (ที่ควรอ้างในบทที่ 3)

### 7.1 Constraints สำคัญใน SQL ปัจจุบัน
1. `bookings_no_overlap_per_user_excl` (GiST exclusion)
2. `department_capacity_policy_no_overlap_excl` (GiST exclusion)
3. `bookings_mode_consistency_chk`, `bookings_hour_precision_chk`, `bookings_cancel_state_chk`
4. `departments_capacity_mode_consistency_chk`
5. `holidays_holiday_date_uk`, `roles_role_code_uk`, `departments_department_code_uk`, `profiles_employee_code_uk`

### 7.2 Indexes สำคัญใน SQL ปัจจุบัน
1. `uidx_profiles_email_lower`
2. `idx_bookings_active_profile_start`, `idx_bookings_active_department_start`
3. `idx_department_capacity_policies_effective_dates`
4. `idx_holidays_active_date`
5. `idx_booking_audit_logs_booking_id_action_at`

### 7.3 Logic ที่ยังต้องพึ่ง RPC/transaction
1. ตรวจ capacity แบบ concurrent-safe ใกล้เต็มความจุ
2. flow holiday warning + explicit confirmation ก่อน write
3. owner/admin scope check และ RLS policy enforcement
4. transactional sync `auth.users` กับ `co_desk.profiles`

## 8) หมายเหตุสำหรับ Supabase PostgreSQL
1. ใช้ schema-qualified names (`co_desk.<object>`) อย่างสม่ำเสมอ
2. `profiles.profile_id` ออกแบบให้ตรงกับ `auth.users.id` เพื่อรองรับ provisioning flow
3. ฟิลด์ `timestamptz` ใช้เก็บเวลาเพื่อป้องกันปัญหา timezone drift; ส่วนรายงาน UI ใช้ `YYYY-MM-DD`
4. RLS เป็น requirement บังคับเชิงสถาปัตยกรรม แต่ policy ยังไม่ประกาศใน SQL ชุดนี้
5. ฟังก์ชันใน `04_create_rpc_placeholders.sql` compile/run ได้ แต่ยังเป็น placeholder สำหรับธุรกรรมจริง

## 9) ฟิลด์ที่จำเป็นต่อ Reporting Views
| View | ตารางต้นทางหลัก | ฟิลด์สำคัญที่ต้องมี |
|---|---|---|
| `vw_daily_booking_summary_by_department` | `bookings`, `departments` | `booking_date_start`, `booking_date_end`, `status_code`, `department_id`, `booked_for_profile_id` |
| `vw_department_capacity_utilization` | `bookings`, `departments`, `department_capacity_policies` | `department_id`, `capacity_mode`, `default_capacity_per_day`, `effective_start_date`, `effective_end_date`, `capacity_per_day` |
| `vw_employee_booking_frequency` | `bookings`, `profiles`, `departments` | `start_at`, `status_code`, `booked_for_profile_id`, `employee_code`, `full_name`, `department_code` |
| `vw_holiday_bookings_detail` | `bookings`, `holidays`, `profiles`, `departments` | `booking_date_start`, `booking_date_end`, `holiday_warning_acknowledged`, `holiday_date`, `holiday_name`, `booked_for_profile_id` |
| `vw_booking_cancellations_summary` | `bookings`, `departments` | `cancelled_at`, `status_code`, `department_id`, `booked_for_profile_id` |
| `vw_peak_usage_by_day_hour` | `bookings`, `departments` | `start_at`, `end_at`, `status_code`, `department_id` |

## 10) แนวทางการวาดรูป ERD (ให้วาดได้ตรงกัน)
1. วาด entities ชุดหลัก 8 ตาราง: `roles`, `departments`, `profiles`, `department_capacity_policies`, `holidays`, `bookings`, `booking_audit_logs`, `user_department_history`
2. วาด `auth.users` เป็น external entity (เส้นประ) หากต้องการสื่อ boundary ของ Supabase Auth
3. ใส่ PK/FK ทุกจุดตามตารางในหัวข้อ 5.1 และกำกับ optionality (mandatory/optional) ให้ชัด
4. ใส่ cardinality บนเส้นสัมพันธ์ทุกรายการ (1:N หรือ N:1 ตามมุมมองที่ใช้)
5. ในกล่อง entity ให้แสดงเฉพาะ key attributes และ business-critical attributes เพื่อไม่ให้ภาพแน่นเกินไป
6. เก็บคอลัมน์ metadata (`updated_at`, `request_id`, `ip_address`, `user_agent`) ไว้ในคำอธิบาย ไม่จำเป็นต้องใส่ในภาพ
7. ไม่ต้องวาด views และ functions ในภาพ ERD แต่ให้กล่าวในบทที่ 3
8. หากต้องการวาด proposed entity (`user_admin_audit_logs`) ให้แยกสีหรือป้าย “Future Phase”

## 11) Notes ใต้ภาพ ERD (Assumptions / Limitations)
1. ระบบคิด capacity ระดับฝ่าย (`department`) และไม่มี seat master รายตัว
2. ความสัมพันธ์ booking กับ holiday เป็น logical relation ไม่ใช่ FK ตรง
3. มาตรฐานวันเวลาในเอกสาร/UI คือ `YYYY-MM-DD` และ `Asia/Bangkok`; DB ใช้ `date` + `timestamptz`
4. RLS, secure admin provisioning endpoint, และธุรกรรมแบบ atomic ยังเป็น scope ของ phase implementation
5. ตาราง `co_desk.user_admin_audit_logs` เป็น design proposal เพื่อรองรับ `AUD-01` ยังไม่ใช่ physical table ใน SQL ปัจจุบัน

## 12) Gap Analysis และข้อเสนอแก้ไข
1. Gap: ยังไม่มี physical table สำหรับ audit การจัดการผู้ใช้โดย admin (`AUD-01`)  
   ข้อเสนอ: เพิ่ม `co_desk.user_admin_audit_logs` ใน phase implementation พร้อม index ตาม `actor_profile_id`, `target_auth_user_id`, `action_at`
2. Gap: `VAL-04` ระบุการ validate status แต่ model ปัจจุบันใช้ `profiles.is_active` (boolean)  
   ข้อเสนอ: หากต้องการหลายสถานะ ให้เพิ่ม enum `profile_status` และแผน migration
3. Gap: concurrency-safe capacity enforcement ยังไม่ครบในระดับ DDL  
   ข้อเสนอ: ใช้ transactional RPC พร้อม locking strategy ใน phase implementation
4. Gap: RLS policies ยังไม่ลง SQL migration  
   ข้อเสนอ: เพิ่มเอกสาร policy matrix และ migration script ใน phase implementation
