-- Enums
create type codesk.department_strategy as enum ('ASSIGNED', 'UNASSIGNED');
create type codesk.booking_type as enum ('SINGLE_DAY', 'DATE_RANGE');
create type codesk.booking_status as enum ('CONFIRMED', 'CANCELLED', 'NO_SHOW');
create type codesk.holiday_rule as enum ('CLOSED', 'WARNING');
create type codesk.app_role as enum ('employee', 'hr', 'admin');

-- Offices
create table codesk.offices (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  tz text not null default 'Asia/Bangkok',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Departments
create table codesk.departments (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references codesk.offices(id) on delete restrict,
  name text not null,
  strategy codesk.department_strategy not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seats
create table codesk.seats (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references codesk.offices(id) on delete restrict,
  department_id uuid not null references codesk.departments(id) on delete restrict,
  seat_code text not null,
  seat_name text,
  is_active boolean not null default true,
  is_bookable boolean not null default true,
  created_at timestamptz not null default now(),
  constraint seats_office_code_uniq unique (office_id, seat_code)
);

-- Employees
create table codesk.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  name text not null,
  email text not null unique,
  department_id uuid not null references codesk.departments(id) on delete restrict,
  start_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Profiles (link to Supabase Auth)
create table codesk.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  employee_id uuid not null unique references codesk.employees(id) on delete restrict,
  role codesk.app_role not null,
  created_at timestamptz not null default now()
);

-- Holidays
create table codesk.holidays (
  id uuid primary key default gen_random_uuid(),
  office_id uuid references codesk.offices(id) on delete restrict,
  holiday_date date not null,
  name text not null,
  rule codesk.holiday_rule not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Bookings
create table codesk.bookings (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references codesk.offices(id) on delete restrict,
  department_id uuid not null references codesk.departments(id) on delete restrict,
  employee_id uuid not null references codesk.employees(id) on delete restrict,
  seat_id uuid references codesk.seats(id) on delete restrict,
  booking_type codesk.booking_type not null,
  status codesk.booking_status not null default 'CONFIRMED',
  start_at timestamptz not null,
  end_at timestamptz not null,
  booking_range tstzrange generated always as (tstzrange(start_at, end_at, '[)')) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancel_reason text,
  constraint bookings_time_valid check (end_at > start_at),
  constraint bookings_single_day_check check (
    (booking_type = 'SINGLE_DAY' and (start_at at time zone 'Asia/Bangkok')::date = (end_at at time zone 'Asia/Bangkok')::date)
    or booking_type = 'DATE_RANGE'
  )
);
