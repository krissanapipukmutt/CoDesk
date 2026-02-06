# วิธีจำลองผู้ใช้ (Set JWT Claims) เพื่อทดสอบ RLS ใน SQL Editor

เอกสารนี้ครอบคลุมตั้งแต่สร้างผู้ใช้ใน Supabase Auth → ผูกกับ `codesk` → จำลอง JWT เพื่อทดสอบ RLS ใน SQL Editor

## ขั้นตอน A: สร้างผู้ใช้ใน Supabase Auth
1. Supabase Dashboard → Authentication → Users → Create user
1. ใส่ Email และ Password (จำไว้ใช้ล็อกอิน)
1. กด Create

## ขั้นตอน B: เตรียมข้อมูลใน schema `codesk`
ต้องมี chain ครบ: `auth.users → codesk.profiles → codesk.employees → codesk.departments → codesk.offices`

รัน SQL (ด้วย role ที่มีสิทธิ์ admin เช่น `postgres` หรือ service role)

### 1) สร้าง office (ถ้ายังไม่มี)
```sql
insert into codesk.offices (code, name)
values ('BKK-01', 'Bangkok HQ')
returning id;
```

### 2) สร้าง department
```sql
insert into codesk.departments (office_id, name, strategy, is_active)
values ('<office_id>', 'Engineering', 'ASSIGNED', true)
returning id;
```

### 3) สร้าง employee
```sql
insert into codesk.employees (employee_code, name, email, department_id, start_date, active)
values ('EMP-001', 'Alice Eng', 'your@email.com', '<department_id>', '2025-01-01', true)
returning id;
```

### 4) ผูก auth user กับ employee
```sql
select id from auth.users where email = 'your@email.com';

insert into codesk.profiles (user_id, employee_id, role)
values ('<auth_user_uuid>', '<employee_id>', 'hr');
```

## ขั้นตอน C: จำลองผู้ใช้ใน SQL Editor (Set JWT Claims)
### 1) ตั้ง JWT claims
```sql
select set_config('request.jwt.claim.sub', '<auth_user_uuid>', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
```

### 2) ตรวจว่า RLS เห็นโปรไฟล์แล้ว
```sql
select * from codesk.current_profile();
```

### 3) ทดสอบ query กับตารางที่มี RLS
```sql
select * from codesk.offices;
select * from codesk.departments;
```

## เช็คการตั้งค่าสิทธิ์ (GRANT) สำหรับ role `authenticated`
ถ้าเห็นว่างแม้ chain ถูกต้อง ให้ตรวจสิทธิ์ดังนี้
```sql
select
  has_schema_privilege('authenticated','codesk','usage') as schema_usage,
  has_table_privilege('authenticated','codesk.offices','select') as offices_select,
  has_table_privilege('authenticated','codesk.departments','select') as departments_select,
  has_table_privilege('authenticated','codesk.departments','insert') as departments_insert;
```

## วิธี GRANT สิทธิ์ (รันด้วย postgres/service role เท่านั้น)
> GRANT จะเปิดสิทธิ์ระดับตาราง แต่ **RLS ยังเป็นตัวคุม row visibility** ตาม policy เดิม

```sql
-- Schema usage
grant usage on schema codesk to authenticated;

-- Tables (ขั้นต่ำที่จำเป็นต่อการใช้งานหลัก)
grant select on codesk.offices to authenticated;
grant select on codesk.seats to authenticated;
grant select, insert, update, delete on codesk.departments to authenticated;
grant select, insert, update, delete on codesk.employees to authenticated;
grant select, insert, update, delete on codesk.holidays to authenticated;
grant select on codesk.bookings to authenticated;

-- Views (reports)
grant select on codesk.v_bookings_per_day to authenticated;
grant select on codesk.v_utilization_by_department to authenticated;
grant select on codesk.v_popular_seats to authenticated;
grant select on codesk.v_booking_status_summary to authenticated;
grant select on codesk.v_peak_times to authenticated;

-- RPCs
grant execute on function codesk.create_booking(
  uuid, uuid, uuid, uuid, codesk.booking_type, timestamptz, timestamptz
) to authenticated;
grant execute on function codesk.cancel_booking(uuid, text) to authenticated;
grant execute on function codesk.current_profile() to authenticated;
grant execute on function codesk.current_user_id() to authenticated;
grant execute on function codesk.current_employee_id() to authenticated;
grant execute on function codesk.current_department_id() to authenticated;
grant execute on function codesk.current_office_id() to authenticated;
grant execute on function codesk.current_role() to authenticated;

-- (แนะนำ) Default privileges สำหรับ object ใหม่ใน schema codesk
alter default privileges in schema codesk grant select on tables to authenticated;
alter default privileges in schema codesk grant usage, select on sequences to authenticated;
alter default privileges in schema codesk grant execute on functions to authenticated;
```

## หมายเหตุสำคัญ
- ถ้า `current_profile()` ไม่คืนค่า แปลว่า chain ไม่ครบ หรือ `profiles.user_id` ไม่ตรงกับ `auth.users.id`
- ต้องรัน `set_config` ใหม่ทุกครั้งเมื่อเปิด SQL Editor session ใหม่
