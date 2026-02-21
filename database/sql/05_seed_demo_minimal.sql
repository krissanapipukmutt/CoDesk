-- ============================================================
-- co_desk | 05_seed_demo_minimal.sql
-- Purpose: Minimal non-sensitive seed data for chapter demonstration
-- ============================================================

-- 1) Seed RBAC roles
insert into co_desk.roles (
  role_code,
  role_name,
  role_description,
  can_manage_users,
  can_manage_departments,
  can_view_reports,
  is_system_role
)
values
  ('employee', 'Employee', 'Book own seat and view calendar within department.', false, false, false, true),
  ('hr', 'HR', 'Manage departments/employees and view reports. Cannot book for others.', false, true, true, true),
  ('admin', 'Admin', 'Full access including user provisioning and cross-user booking.', true, true, true, true)
on conflict (role_code) do update
set
  role_name = excluded.role_name,
  role_description = excluded.role_description,
  can_manage_users = excluded.can_manage_users,
  can_manage_departments = excluded.can_manage_departments,
  can_view_reports = excluded.can_view_reports,
  is_system_role = excluded.is_system_role,
  updated_at = now();

-- 2) Seed departments
insert into co_desk.departments (
  department_code,
  department_name,
  capacity_mode,
  default_capacity_per_day,
  is_active,
  effective_timezone
)
values
  ('ENG', 'Engineering', 'limited', 20, true, 'Asia/Bangkok'),
  ('HR', 'Human Resources', 'limited', 8, true, 'Asia/Bangkok'),
  ('ADM', 'Administration', 'unlimited', 0, true, 'Asia/Bangkok')
on conflict (department_code) do update
set
  department_name = excluded.department_name,
  capacity_mode = excluded.capacity_mode,
  default_capacity_per_day = excluded.default_capacity_per_day,
  is_active = excluded.is_active,
  effective_timezone = excluded.effective_timezone,
  updated_at = now();

-- 3) Seed capacity policies (optional overrides)
insert into co_desk.department_capacity_policies (
  department_id,
  effective_start_date,
  effective_end_date,
  capacity_mode,
  capacity_per_day,
  note_text,
  is_active
)
select
  d.department_id,
  current_date,
  null,
  d.capacity_mode,
  case when d.capacity_mode = 'limited' then d.default_capacity_per_day else null end,
  'Initial demo policy',
  true
from co_desk.departments d
where not exists (
  select 1
  from co_desk.department_capacity_policies p
  where p.department_id = d.department_id
    and p.is_active
);

-- 4) Seed holidays
insert into co_desk.holidays (
  holiday_date,
  holiday_name,
  holiday_description,
  is_active
)
values
  (date '2026-04-06', 'Chakri Memorial Day', 'Demo holiday record for warning flow.', true),
  (date '2026-05-01', 'National Labour Day', 'Demo holiday record for warning flow.', true),
  (date '2026-12-10', 'Constitution Day', 'Demo holiday record for warning flow.', true)
on conflict (holiday_date) do update
set
  holiday_name = excluded.holiday_name,
  holiday_description = excluded.holiday_description,
  is_active = excluded.is_active,
  updated_at = now();

-- 5) Optional demo profiles (insert only if matching auth.users exists)
do $$
begin
  if to_regclass('auth.users') is not null then
    with seed_users as (
      select * from (
        values
          ('admin.demo@co-desk.local', 'ADM-001', 'Admin Demo', 'ADM', 'admin'::co_desk.role_code),
          ('hr.demo@co-desk.local', 'HR-001', 'HR Demo', 'HR', 'hr'::co_desk.role_code),
          ('emp.demo@co-desk.local', 'EMP-001', 'Employee Demo', 'ENG', 'employee'::co_desk.role_code)
      ) as t(email, employee_code, full_name, department_code, role_code)
    )
    insert into co_desk.profiles (
      profile_id,
      employee_code,
      full_name,
      email,
      department_id,
      role_id,
      is_active,
      timezone_name
    )
    select
      au.id,
      su.employee_code,
      su.full_name,
      su.email,
      d.department_id,
      r.role_id,
      true,
      'Asia/Bangkok'
    from seed_users su
    join auth.users au
      on lower(au.email) = lower(su.email)
    join co_desk.departments d
      on d.department_code = su.department_code
    join co_desk.roles r
      on r.role_code = su.role_code
    on conflict (profile_id) do update
    set
      employee_code = excluded.employee_code,
      full_name = excluded.full_name,
      email = excluded.email,
      department_id = excluded.department_id,
      role_id = excluded.role_id,
      is_active = excluded.is_active,
      timezone_name = excluded.timezone_name,
      updated_at = now();
  end if;
end $$;

-- 6) Optional sample booking (only when at least one profile exists)
do $$
declare
  v_profile_id uuid;
  v_department_id bigint;
  v_start_at timestamptz;
  v_end_at timestamptz;
begin
  select p.profile_id, p.department_id
  into v_profile_id, v_department_id
  from co_desk.profiles p
  order by p.created_at
  limit 1;

  if v_profile_id is not null then
    v_start_at := ((current_date + 1)::timestamp at time zone 'Asia/Bangkok');
    v_end_at := v_start_at + interval '1 day';

    insert into co_desk.bookings (
      booked_for_profile_id,
      booked_by_profile_id,
      department_id,
      booking_mode,
      booking_date_start,
      booking_date_end,
      start_at,
      end_at,
      holiday_warning_acknowledged,
      status_code,
      note_text
    )
    values (
      v_profile_id,
      v_profile_id,
      v_department_id,
      'single_day',
      current_date + 1,
      current_date + 1,
      v_start_at,
      v_end_at,
      false,
      'booked',
      'Demo booking for chapter-3 design walkthrough'
    )
    on conflict do nothing;
  end if;
end $$;
