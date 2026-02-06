-- Enable RLS (deny-by-default)
alter table codesk.offices enable row level security;
alter table codesk.departments enable row level security;
alter table codesk.seats enable row level security;
alter table codesk.employees enable row level security;
alter table codesk.profiles enable row level security;
alter table codesk.holidays enable row level security;
alter table codesk.bookings enable row level security;

-- Offices
create policy offices_select_own on codesk.offices
for select
using (
  codesk.current_role() = 'admin'
  or id = codesk.current_office_id()
);

create policy offices_admin_write on codesk.offices
for all
using (codesk.current_role() = 'admin')
with check (codesk.current_role() = 'admin');

-- Departments
create policy departments_select_employee on codesk.departments
for select
using (
  codesk.current_role() in ('employee', 'hr')
  and id = codesk.current_department_id()
);

create policy departments_select_hr_office on codesk.departments
for select
using (
  codesk.current_role() = 'hr'
  and office_id = codesk.current_office_id()
);

create policy departments_select_admin on codesk.departments
for select
using (codesk.current_role() = 'admin');

create policy departments_hr_write on codesk.departments
for insert
with check (
  codesk.current_role() = 'hr'
  and office_id = codesk.current_office_id()
);

create policy departments_hr_update on codesk.departments
for update
using (
  codesk.current_role() = 'hr'
  and office_id = codesk.current_office_id()
)
with check (
  codesk.current_role() = 'hr'
  and office_id = codesk.current_office_id()
);

create policy departments_admin_write on codesk.departments
for all
using (codesk.current_role() = 'admin')
with check (codesk.current_role() = 'admin');

-- Seats
create policy seats_select_employee on codesk.seats
for select
using (
  codesk.current_role() in ('employee', 'hr')
  and department_id = codesk.current_department_id()
);

create policy seats_select_admin on codesk.seats
for select
using (codesk.current_role() = 'admin');

create policy seats_hr_write on codesk.seats
for insert
with check (
  codesk.current_role() = 'hr'
  and department_id = codesk.current_department_id()
  and office_id = codesk.current_office_id()
);

create policy seats_hr_update on codesk.seats
for update
using (
  codesk.current_role() = 'hr'
  and department_id = codesk.current_department_id()
)
with check (
  codesk.current_role() = 'hr'
  and department_id = codesk.current_department_id()
);

create policy seats_admin_write on codesk.seats
for all
using (codesk.current_role() = 'admin')
with check (codesk.current_role() = 'admin');

-- Employees
create policy employees_select_own on codesk.employees
for select
using (id = codesk.current_employee_id());

create policy employees_select_hr on codesk.employees
for select
using (
  codesk.current_role() = 'hr'
  and department_id = codesk.current_department_id()
);

create policy employees_select_admin on codesk.employees
for select
using (codesk.current_role() = 'admin');

create policy employees_hr_insert on codesk.employees
for insert
with check (
  codesk.current_role() = 'hr'
  and department_id = codesk.current_department_id()
);

create policy employees_hr_update on codesk.employees
for update
using (
  codesk.current_role() = 'hr'
  and department_id = codesk.current_department_id()
)
with check (
  codesk.current_role() = 'hr'
  and department_id = codesk.current_department_id()
);

create policy employees_admin_write on codesk.employees
for all
using (codesk.current_role() = 'admin')
with check (codesk.current_role() = 'admin');

-- Profiles
create policy profiles_select_own on codesk.profiles
for select
using (user_id = codesk.current_user_id());

create policy profiles_select_hr on codesk.profiles
for select
using (
  codesk.current_role() = 'hr'
  and employee_id in (
    select e.id from codesk.employees e where e.department_id = codesk.current_department_id()
  )
);

create policy profiles_select_admin on codesk.profiles
for select
using (codesk.current_role() = 'admin');

create policy profiles_admin_write on codesk.profiles
for all
using (codesk.current_role() = 'admin')
with check (codesk.current_role() = 'admin');

-- Holidays
create policy holidays_select_office on codesk.holidays
for select
using (
  codesk.current_role() in ('employee', 'hr')
  and (office_id is null or office_id = codesk.current_office_id())
);

create policy holidays_select_admin on codesk.holidays
for select
using (codesk.current_role() = 'admin');

create policy holidays_hr_write on codesk.holidays
for insert
with check (
  codesk.current_role() = 'hr'
  and (office_id is null or office_id = codesk.current_office_id())
);

create policy holidays_hr_update on codesk.holidays
for update
using (
  codesk.current_role() = 'hr'
  and (office_id is null or office_id = codesk.current_office_id())
)
with check (
  codesk.current_role() = 'hr'
  and (office_id is null or office_id = codesk.current_office_id())
);

create policy holidays_admin_write on codesk.holidays
for all
using (codesk.current_role() = 'admin')
with check (codesk.current_role() = 'admin');

-- Bookings (read-only via RLS; write through RPCs)
create policy bookings_select_dept on codesk.bookings
for select
using (
  codesk.current_role() in ('employee', 'hr')
  and department_id = codesk.current_department_id()
);

create policy bookings_select_admin on codesk.bookings
for select
using (codesk.current_role() = 'admin');
