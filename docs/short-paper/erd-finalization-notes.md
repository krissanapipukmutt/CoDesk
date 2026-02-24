# ERD Finalization Notes (CoDesk / `co_desk`)

เอกสารนี้สรุปสิ่งที่ต้องใช้ทันทีในขั้นตอนวาด ER Diagram จากแบบจำลองข้อมูลปัจจุบัน

## 1) สถานะการรีวิว
สถานะ: **ผ่านแต่ควรแก้เล็กน้อย** และได้ปรับใน `docs/short-paper/erd-design-notes.md` แล้ว

จุดที่ยืนยันแล้ว:
1. entity/attribute/key ตรงกับ SQL ปัจจุบัน
2. FK และ cardinality ถูกระบุครบ
3. business rules หลักถูก map กับ data model ครบระดับ design
4. แยกขอบเขต physical baseline กับ future proposal ชัดเจน

## 2) Entities ที่ต้องวาด
1. `co_desk.roles`
2. `co_desk.departments`
3. `co_desk.profiles`
4. `co_desk.department_capacity_policies`
5. `co_desk.holidays`
6. `co_desk.bookings`
7. `co_desk.booking_audit_logs`
8. `co_desk.user_department_history`

ตัวเลือกเพิ่มเติม:
1. `auth.users` (วาดเป็น external boundary)
2. `co_desk.user_admin_audit_logs` (วาดได้เฉพาะกรณีต้องการสื่อ future phase)

## 3) PK/FK ที่ต้องใส่
1. `roles.role_id` (PK), `profiles.role_id` (FK)
2. `departments.department_id` (PK), `profiles.department_id` (FK)
3. `profiles.profile_id` (PK)
4. `department_capacity_policies.policy_id` (PK), `department_capacity_policies.department_id` (FK), `department_capacity_policies.created_by_profile_id` (FK)
5. `holidays.holiday_id` (PK), `holidays.created_by_profile_id` (FK)
6. `bookings.booking_id` (PK), `bookings.booked_for_profile_id` (FK), `bookings.booked_by_profile_id` (FK), `bookings.department_id` (FK), `bookings.cancelled_by_profile_id` (FK)
7. `booking_audit_logs.audit_log_id` (PK), `booking_audit_logs.booking_id` (FK), `booking_audit_logs.actor_profile_id` (FK)
8. `user_department_history.history_id` (PK), `user_department_history.profile_id` (FK), `user_department_history.department_id` (FK), `user_department_history.assigned_by_profile_id` (FK)

## 4) Relationships + Cardinality ที่ต้องใส่
1. `roles (1) -> (N) profiles`
2. `departments (1) -> (N) profiles`
3. `profiles (1) -> (N) departments` ผ่าน `departments.created_by_profile_id` (optional)
4. `departments (1) -> (N) department_capacity_policies`
5. `profiles (1) -> (N) department_capacity_policies` ผ่าน `created_by_profile_id` (optional)
6. `profiles (1) -> (N) holidays` ผ่าน `created_by_profile_id` (optional)
7. `profiles (1) -> (N) bookings` ผ่าน `booked_for_profile_id`
8. `profiles (1) -> (N) bookings` ผ่าน `booked_by_profile_id`
9. `departments (1) -> (N) bookings`
10. `profiles (1) -> (N) bookings` ผ่าน `cancelled_by_profile_id` (optional)
11. `bookings (1) -> (N) booking_audit_logs`
12. `profiles (1) -> (N) booking_audit_logs` ผ่าน `actor_profile_id`
13. `profiles (1) -> (N) user_department_history`
14. `departments (1) -> (N) user_department_history`
15. `profiles (1) -> (N) user_department_history` ผ่าน `assigned_by_profile_id` (optional)

ความสัมพันธ์เชิงแนวคิด (ใส่เป็น note ได้):
1. `bookings` เชื่อม `holidays` ด้วยเงื่อนไขช่วงวันที่ (ไม่ใช่ FK)
2. `auth.users (1) -> (1) profiles` เป็น external identity mapping

## 5) Attributes สำคัญที่ควรแสดงในภาพ
1. `roles`: `role_id`, `role_code`
2. `departments`: `department_id`, `department_code`, `capacity_mode`, `default_capacity_per_day`, `created_by_profile_id`
3. `profiles`: `profile_id`, `employee_code`, `email`, `department_id`, `role_id`, `is_active`
4. `department_capacity_policies`: `policy_id`, `department_id`, `effective_start_date`, `effective_end_date`, `capacity_mode`, `capacity_per_day`, `created_by_profile_id`
5. `holidays`: `holiday_id`, `holiday_date`, `holiday_name`, `created_by_profile_id`
6. `bookings`: `booking_id`, `booked_for_profile_id`, `booked_by_profile_id`, `department_id`, `booking_mode`, `booking_date_start`, `booking_date_end`, `start_at`, `end_at`, `status_code`, `holiday_warning_acknowledged`, `cancelled_by_profile_id`
7. `booking_audit_logs`: `audit_log_id`, `booking_id`, `action_code`, `actor_profile_id`, `actor_role_code`, `action_at`
8. `user_department_history`: `history_id`, `profile_id`, `department_id`, `assigned_start_date`, `assigned_end_date`, `assigned_by_profile_id`

## 6) Notes/Assumptions ใต้ภาพที่ควรใส่
1. ระบบไม่มี seat master รายตัว และคุมความจุระดับฝ่าย
2. Date format ฝั่ง UI/เอกสารคือ `YYYY-MM-DD`
3. Timezone มาตรฐานคือ `Asia/Bangkok`
4. ตาราง reporting views และ RPC functions ไม่อยู่ใน ERD
5. RLS กับ admin provisioning flow เป็น implementation scope ของ phase ถัดไป
6. `user_admin_audit_logs` ยังเป็น proposal (ยังไม่อยู่ใน SQL baseline)

## 7) สิ่งที่ไม่ต้องวาดใน ERD แต่ควรอธิบายในบทที่ 3
1. `co_desk.vw_*` reporting views
2. `co_desk.check_*`, `co_desk.create_booking_with_validation`, `co_desk.update_booking_with_validation`, `co_desk.cancel_booking`
3. seed data scripts
4. ชื่อ index/constraint แบบละเอียดระดับ migration

## 8) ERD Drawing Checklist (สั้น)
- Entities ที่ต้องวาด: 8 ตารางหลักใน `co_desk`
- PK/FK ที่ต้องใส่: ทุกคีย์ตามหัวข้อ 3
- Relationships + cardinality: ครบ 15 เส้นตามหัวข้อ 4
- Attributes สำคัญที่ต้องแสดง: ตามหัวข้อ 5
- Notes/assumptions ใต้รูป: ตามหัวข้อ 6
- สิ่งที่ไม่ต้องวาด: views/functions/seed (อธิบายในบทที่ 3)
