# ERD Design Notes (ERD-Ready Specification) - `co_desk`

## 1) ขอบเขตเอกสารและหลักการตั้งชื่อ
เอกสารฉบับนี้เป็นสเปกเชิงโครงสร้างข้อมูลสำหรับวาด ERD ของระบบ `co_desk` โดยตรง และสามารถส่งต่อให้ผู้ออกแบบ/AI ตัวอื่นใช้งานต่อได้โดยไม่ต้องอ้างอิงประวัติแชต

หลักการตั้งชื่อ (Naming Conventions):
1. ใช้ schema เดียว: `co_desk`
2. ชื่อตาราง/คอลัมน์ใช้ `snake_case`
3. คีย์หลักลงท้าย `_id`
4. คีย์ต่างประเทศใช้ชื่อเดียวกับคีย์ที่อ้างอิง เช่น `department_id`, `role_id`
5. ชื่อ view ใช้ prefix `vw_`
6. ฟิลด์วันเวลาใช้ `timestamptz` หรือ `date` ตามเจตนาเชิงธุรกิจ

มาตรฐานเวลา/วันที่:
- UI และเอกสารแสดงวันที่รูปแบบ `YYYY-MM-DD`
- timezone มาตรฐานระบบ: `Asia/Bangkok`
- ในฐานข้อมูลเก็บเวลาเป็น `timestamptz` และเก็บวันที่สำหรับ reporting/calendar เป็น `date`

## 2) Entity Catalog (อย่างน้อย 6 entities)

### 2.1 Entity: `co_desk.roles`
วัตถุประสงค์: เก็บนิยามบทบาท RBAC หลักของระบบ (`employee`, `hr`, `admin`)

| Attribute | Logical Data Type | หมายเหตุ |
|---|---|---|
| `role_id` | bigint (identity) | Primary Key |
| `role_code` | enum(`role_code`) | ค่าคงที่ `employee/hr/admin` |
| `role_name` | text | ชื่อบทบาทที่อ่านง่าย |
| `role_description` | text | คำอธิบายบทบาท |
| `can_manage_users` | boolean | สิทธิ์จัดการผู้ใช้ |
| `can_manage_departments` | boolean | สิทธิ์จัดการฝ่าย |
| `can_view_reports` | boolean | สิทธิ์เข้าถึงรายงาน |
| `is_system_role` | boolean | ระบุบทบาทระบบ |
| `created_at` | timestamptz | เวลาสร้าง |
| `updated_at` | timestamptz | เวลาแก้ไขล่าสุด |

Primary Key: `role_id`  
Foreign Keys: ไม่มี

### 2.2 Entity: `co_desk.departments`
วัตถุประสงค์: เก็บข้อมูลฝ่ายงานและนโยบายความจุพื้นฐานระดับฝ่าย

| Attribute | Logical Data Type | หมายเหตุ |
|---|---|---|
| `department_id` | bigint (identity) | Primary Key |
| `department_code` | text | รหัสฝ่าย (unique) |
| `department_name` | text | ชื่อฝ่าย |
| `capacity_mode` | enum(`capacity_mode`) | `limited`/`unlimited` |
| `default_capacity_per_day` | integer | ความจุพื้นฐานต่อวัน |
| `is_active` | boolean | สถานะใช้งานฝ่าย |
| `effective_timezone` | text | บังคับ `Asia/Bangkok` |
| `created_by_profile_id` | uuid | ผู้สร้างข้อมูลฝ่าย |
| `created_at` | timestamptz | เวลาสร้าง |
| `updated_at` | timestamptz | เวลาแก้ไขล่าสุด |

Primary Key: `department_id`  
Foreign Keys: `created_by_profile_id -> co_desk.profiles.profile_id` (nullable)

### 2.3 Entity: `co_desk.profiles`
วัตถุประสงค์: เก็บโปรไฟล์ผู้ใช้ในระบบที่เชื่อมกับ Supabase Auth

| Attribute | Logical Data Type | หมายเหตุ |
|---|---|---|
| `profile_id` | uuid | Primary Key, map กับ `auth.users.id` |
| `employee_code` | text | รหัสพนักงาน (unique) |
| `full_name` | text | ชื่อพนักงาน |
| `email` | text | อีเมลสำหรับติดต่อ/ระบบ |
| `department_id` | bigint | ฝ่ายที่สังกัด |
| `role_id` | bigint | บทบาท RBAC |
| `is_active` | boolean | สถานะการใช้งาน |
| `timezone_name` | text | บังคับ `Asia/Bangkok` |
| `created_at` | timestamptz | เวลาสร้าง |
| `updated_at` | timestamptz | เวลาแก้ไขล่าสุด |

Primary Key: `profile_id`  
Foreign Keys:
- `department_id -> co_desk.departments.department_id`
- `role_id -> co_desk.roles.role_id`
- (implementation target) `profile_id -> auth.users.id`

### 2.4 Entity: `co_desk.department_capacity_policies`
วัตถุประสงค์: เก็บนโยบายความจุแบบมีผลตามช่วงเวลา (policy history)

| Attribute | Logical Data Type | หมายเหตุ |
|---|---|---|
| `policy_id` | bigint (identity) | Primary Key |
| `department_id` | bigint | ฝ่ายที่นโยบายนี้ใช้บังคับ |
| `effective_start_date` | date | วันเริ่มใช้ |
| `effective_end_date` | date | วันสิ้นสุด (nullable) |
| `capacity_mode` | enum(`capacity_mode`) | `limited`/`unlimited` |
| `capacity_per_day` | integer | ต้องมีเมื่อ `limited` |
| `note_text` | text | คำอธิบายนโยบาย |
| `is_active` | boolean | สถานะนโยบาย |
| `created_by_profile_id` | uuid | ผู้สร้างนโยบาย |
| `created_at` | timestamptz | เวลาสร้าง |
| `updated_at` | timestamptz | เวลาแก้ไขล่าสุด |
| `effective_date_range` | daterange (generated) | ใช้กับ exclusion constraint |

Primary Key: `policy_id`  
Foreign Keys:
- `department_id -> co_desk.departments.department_id`
- `created_by_profile_id -> co_desk.profiles.profile_id` (nullable)

### 2.5 Entity: `co_desk.holidays`
วัตถุประสงค์: เก็บวันหยุดเพื่อใช้เตือนและยืนยันก่อนบันทึกการจอง

| Attribute | Logical Data Type | หมายเหตุ |
|---|---|---|
| `holiday_id` | bigint (identity) | Primary Key |
| `holiday_date` | date | วันหยุด (unique) |
| `holiday_name` | text | ชื่อวันหยุด |
| `holiday_description` | text | รายละเอียด |
| `is_active` | boolean | เปิด/ปิดใช้งาน |
| `created_by_profile_id` | uuid | ผู้สร้างข้อมูลวันหยุด |
| `created_at` | timestamptz | เวลาสร้าง |
| `updated_at` | timestamptz | เวลาแก้ไขล่าสุด |

Primary Key: `holiday_id`  
Foreign Keys: `created_by_profile_id -> co_desk.profiles.profile_id` (nullable)

### 2.6 Entity: `co_desk.bookings`
วัตถุประสงค์: ธุรกรรมการจองหลักของระบบ รองรับทั้งรายวันและช่วงเวลา

| Attribute | Logical Data Type | หมายเหตุ |
|---|---|---|
| `booking_id` | bigint (identity) | Primary Key |
| `booked_for_profile_id` | uuid | ผู้ถูกจอง (target user) |
| `booked_by_profile_id` | uuid | ผู้ทำรายการ |
| `department_id` | bigint | ฝ่ายของรายการจอง |
| `booking_mode` | enum(`booking_mode`) | `single_day`/`time_range` |
| `booking_date_start` | date | วันที่เริ่ม (สำหรับ UI/report) |
| `booking_date_end` | date | วันที่สิ้นสุด (สำหรับ UI/report) |
| `start_at` | timestamptz | เวลาเริ่มจริง |
| `end_at` | timestamptz | เวลาสิ้นสุดจริง |
| `booking_period` | tstzrange (generated) | ใช้ตรวจ overlap |
| `holiday_warning_acknowledged` | boolean | ยืนยัน warning วันหยุดแล้วหรือไม่ |
| `status_code` | enum(`booking_status`) | `booked`/`cancelled` |
| `note_text` | text | หมายเหตุ |
| `cancelled_at` | timestamptz | เวลายกเลิก |
| `cancelled_by_profile_id` | uuid | ผู้ยกเลิก |
| `created_at` | timestamptz | เวลาสร้าง |
| `updated_at` | timestamptz | เวลาแก้ไขล่าสุด |

Primary Key: `booking_id`  
Foreign Keys:
- `booked_for_profile_id -> co_desk.profiles.profile_id`
- `booked_by_profile_id -> co_desk.profiles.profile_id`
- `department_id -> co_desk.departments.department_id`
- `cancelled_by_profile_id -> co_desk.profiles.profile_id` (nullable)

### 2.7 Entity: `co_desk.booking_audit_logs`
วัตถุประสงค์: บันทึกประวัติการ create/update/cancel สำหรับตรวจสอบย้อนหลัง

| Attribute | Logical Data Type | หมายเหตุ |
|---|---|---|
| `audit_log_id` | bigint (identity) | Primary Key |
| `booking_id` | bigint | รายการจองที่เกี่ยวข้อง |
| `action_code` | enum(`audit_action`) | `create/update/cancel` |
| `actor_profile_id` | uuid | ผู้ทำรายการ |
| `actor_role_code` | enum(`role_code`) | role ณ ขณะทำรายการ |
| `action_reason` | text | เหตุผล |
| `old_values_json` | jsonb | ข้อมูลก่อนแก้ไข |
| `new_values_json` | jsonb | ข้อมูลหลังแก้ไข |
| `action_at` | timestamptz | เวลาเกิดเหตุการณ์ |
| `request_id` | uuid | correlation id |
| `ip_address` | inet | client ip |
| `user_agent` | text | client agent |

Primary Key: `audit_log_id`  
Foreign Keys:
- `booking_id -> co_desk.bookings.booking_id`
- `actor_profile_id -> co_desk.profiles.profile_id`

### 2.8 Entity (Optional): `co_desk.user_department_history`
วัตถุประสงค์: รองรับการเก็บประวัติย้ายฝ่ายเพื่อรายงานย้อนหลังในอนาคต

| Attribute | Logical Data Type | หมายเหตุ |
|---|---|---|
| `history_id` | bigint (identity) | Primary Key |
| `profile_id` | uuid | พนักงาน |
| `department_id` | bigint | ฝ่ายที่ถูก assign |
| `assigned_start_date` | date | วันเริ่ม |
| `assigned_end_date` | date | วันสิ้นสุด (nullable) |
| `assigned_by_profile_id` | uuid | ผู้แก้ไข |
| `note_text` | text | หมายเหตุ |
| `created_at` | timestamptz | เวลาสร้าง |
| `updated_at` | timestamptz | เวลาแก้ไขล่าสุด |

Primary Key: `history_id`  
Foreign Keys:
- `profile_id -> co_desk.profiles.profile_id`
- `department_id -> co_desk.departments.department_id`
- `assigned_by_profile_id -> co_desk.profiles.profile_id` (nullable)

## 3) Relationships และ Cardinality
| Relationship | Cardinality | Optionality |
|---|---|---|
| `roles` -> `profiles` | 1 : N | profile ต้องมี role เสมอ |
| `departments` -> `profiles` | 1 : N | profile ต้องมี department เสมอ |
| `departments` -> `department_capacity_policies` | 1 : N | policy ต้องมี department |
| `profiles` -> `bookings` (`booked_for_profile_id`) | 1 : N | booking ต้องมีผู้ถูกจอง |
| `profiles` -> `bookings` (`booked_by_profile_id`) | 1 : N | booking ต้องมีผู้ทำรายการ |
| `departments` -> `bookings` | 1 : N | booking ต้องมี department |
| `profiles` -> `bookings` (`cancelled_by_profile_id`) | 1 : N | optional เมื่อยังไม่ยกเลิก |
| `bookings` -> `booking_audit_logs` | 1 : N | log ต้องมี booking |
| `profiles` -> `booking_audit_logs` | 1 : N | log ต้องมี actor |
| `profiles` -> `user_department_history` | 1 : N | optional table |
| `departments` -> `user_department_history` | 1 : N | optional table |

หมายเหตุเชิง concept:
- ความสัมพันธ์ `bookings` กับ `holidays` เป็นความสัมพันธ์เชิงเงื่อนไขจากช่วงวันที่ (ไม่มี FK ตรง) โดยใช้เงื่อนไข `holiday_date between booking_date_start and booking_date_end`

## 4) Business Rules Mapping (Entity/Relationship)
| Rule ID | Business Rule | Entity/Relationship ที่เกี่ยวข้อง | วิธี enforce |
|---|---|---|---|
| `BR-01` | User เดิมห้ามจองซ้อนเวลา | `bookings` | `EXCLUDE` บน `booked_for_profile_id + booking_period` |
| `BR-02` | รองรับ `single_day` และ `time_range` | `bookings` | CHECK (`booking_mode`, `start_at/end_at`, date order) |
| `BR-03` | Capacity แบบ `limited/unlimited` | `departments`, `department_capacity_policies`, `bookings` | CHECK + RPC capacity check |
| `BR-04` | จองวันหยุดได้แต่ต้องยืนยัน warning | `holidays`, `bookings` | field `holiday_warning_acknowledged` + RPC holiday check |
| `BR-05` | RBAC 3 roles (`employee/hr/admin`) | `roles`, `profiles`, `bookings` | role model + RLS/API (phase ถัดไป) |
| `BR-06` | HR จองให้คนอื่นไม่ได้, Admin จองแทนได้ | `profiles`, `bookings`, `roles` | RPC authorization + RLS (phase ถัดไป) |
| `BR-07` | รายงานสำหรับ hr/admin | reporting views + `profiles/roles` | view layer + RLS policy (phase ถัดไป) |
| `BR-08` | Date format `YYYY-MM-DD`, timezone `Asia/Bangkok` | `bookings`, `departments`, `profiles` | date columns + timestamptz + timezone checks |

## 5) Candidate Constraints และ Indexes

### 5.1 Candidate Constraints
1. `roles.role_code` unique
2. `departments.department_code` unique
3. `profiles.employee_code` unique
4. `holidays.holiday_date` unique
5. `bookings` date/time consistency checks
6. `bookings_no_overlap_per_user_excl` (GiST exclude)
7. `department_capacity_policy_no_overlap_excl` (GiST exclude)
8. capacity mode consistency checks (`limited` vs `unlimited`)

### 5.2 Candidate Indexes
1. FK indexes ทุกจุดที่ join บ่อย (`profiles.department_id`, `profiles.role_id`, `bookings.*_profile_id`, `bookings.department_id`)
2. Calendar/report indexes (`bookings.start_at`, `bookings.booking_date_start`, `bookings.booking_date_end`)
3. Partial index สำหรับ active bookings (`status_code = 'booked'`)
4. Audit index (`booking_audit_logs(booking_id, action_at desc)`)
5. Email lookup index (`lower(profiles.email)`)

## 6) หมายเหตุสำหรับ Supabase PostgreSQL Implementation
1. ใช้ schema `co_desk` สำหรับ object หลักทั้งหมด
2. `profiles.profile_id` ออกแบบให้ map กับ `auth.users.id`
3. แนะนำลำดับ migration: types -> master tables -> dependent tables -> constraints/indexes -> views -> RPC -> RLS
4. ในรอบ design นี้ RLS ยังเป็น design intent; ให้ implement policy แยกใน phase ถัดไป
5. กรณี capacity และ holiday confirmation ต้องใช้ transactional RPC/function เพิ่มเติมเพื่อกัน race condition

## 7) ฟิลด์ที่จำเป็นสำหรับ Reporting Views

| View | Required Fields |
|---|---|
| `vw_daily_booking_summary_by_department` | `bookings.booking_date_start`, `bookings.booking_date_end`, `bookings.status_code`, `departments.department_code`, `departments.department_name` |
| `vw_department_capacity_utilization` | `bookings.booking_date_start`, `bookings.booking_date_end`, `bookings.status_code`, `departments.capacity_mode`, `departments.default_capacity_per_day`, `department_capacity_policies.*` |
| `vw_employee_booking_frequency` | `bookings.start_at`, `bookings.status_code`, `profiles.employee_code`, `profiles.full_name`, `departments.department_code` |
| `vw_holiday_bookings_detail` | `bookings.booking_date_start`, `bookings.booking_date_end`, `bookings.holiday_warning_acknowledged`, `holidays.holiday_date`, `holidays.holiday_name`, `profiles.full_name` |
| `vw_booking_cancellations_summary` | `bookings.status_code`, `bookings.cancelled_at`, `bookings.booked_for_profile_id`, `departments.department_code` |
| `vw_peak_usage_by_day_hour` | `bookings.start_at`, `bookings.end_at`, `bookings.status_code`, `departments.department_code` |

## 8) แนวทางการวาดรูป ERD
เพื่อให้วาด ERD ได้สอดคล้องกันไม่ว่าใช้คนหรือ AI ตัวอื่น ให้ใช้กติกานี้:
1. ใช้ Crow's Foot notation
2. วางตาราง master ซ้ายไปขวา: `roles`, `departments`, `profiles`, `department_capacity_policies`, `holidays`, `bookings`, `booking_audit_logs`
3. แสดง PK/FK ชัดเจนทุกตาราง (tag `PK`, `FK`)
4. แสดง optionality ที่คีย์ nullable เช่น `cancelled_by_profile_id`, `created_by_profile_id`
5. แสดง relationship เชิงเงื่อนไข `bookings` <-> `holidays` เป็นเส้น dashed/annotation (logical relation, no direct FK)
6. แยก reporting views ไว้ใน logical layer ใต้ ERD หลัก (ไม่ต้องวาดเป็น physical table)
7. ใส่ note กลางรูปว่า "UI date format = YYYY-MM-DD, timezone = Asia/Bangkok"
8. ระบุว่าไม่มี seat master รายตัว และ capacity คิดระดับ department

## 9) Gap Analysis และข้อเสนอการแก้ไข
| Gap ID | ประเด็นที่ยังไม่รองรับครบ | ผลกระทบ | แนวทางแก้ไข |
|---|---|---|---|
| `GAP-01` | การบังคับ HR/Admin scope ยังไม่ enforce ด้วย RLS จริง | เสี่ยง access เกินสิทธิ์ถ้าเรียก DB ตรง | เพิ่ม RLS policies + secure RPC ใน phase implementation |
| `GAP-02` | Capacity check เชิง concurrency ยังไม่ปิดจบด้วย constraint อย่างเดียว | เสี่ยง over-capacity กรณีจองพร้อมกัน | Implement transactional RPC (lock + recheck + atomic write) |
| `GAP-03` | Holiday confirm เป็น cross-table rule | CHECK constraint ทำไม่ได้ตรง | ใช้ RPC validate ก่อน insert/update และบันทึก audit |
| `GAP-04` | User provisioning flow (`admin only`) ยังไม่ผูกกับ API/UI | ไม่ครบ flow เชิงปฏิบัติการ | ผูก Supabase Auth admin flow + backend authorization |

## 10) สรุปความพร้อมสำหรับการวาด ERD
สเปกนี้พร้อมนำไปวาด ERD ได้ทันที โดยมี entities, keys, relationships, business rules, constraints/index candidates, และ implementation notes ครบตาม requirement ของเฟสบทที่ 3 และรักษาความสอดคล้องกับ schema `co_desk` สำหรับการพัฒนาระยะถัดไป
