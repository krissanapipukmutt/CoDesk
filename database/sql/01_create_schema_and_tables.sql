-- ============================================================
-- co_desk | 01_create_schema_and_tables.sql
-- Purpose: Combined schema/tables/constraints/indexes (database-first)
-- Note:
--   - UI/document date format: YYYY-MM-DD
--   - Timezone baseline: Asia/Bangkok
--   - Time in DB uses timestamptz/date as appropriate
-- ============================================================

create schema if not exists co_desk;
comment on schema co_desk is
  'Schema for co_desk office seat booking system (database-first design baseline).';

create extension if not exists btree_gist;

-- ------------------------------------------------------------
-- Enum types
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'co_desk' and t.typname = 'role_code'
  ) then
    create type co_desk.role_code as enum ('employee', 'hr', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'co_desk' and t.typname = 'capacity_mode'
  ) then
    create type co_desk.capacity_mode as enum ('limited', 'unlimited');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'co_desk' and t.typname = 'booking_mode'
  ) then
    create type co_desk.booking_mode as enum ('single_day', 'time_range');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'co_desk' and t.typname = 'booking_status'
  ) then
    create type co_desk.booking_status as enum ('booked', 'cancelled');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'co_desk' and t.typname = 'audit_action'
  ) then
    create type co_desk.audit_action as enum ('create', 'update', 'cancel');
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) roles
-- ------------------------------------------------------------
create table if not exists co_desk.roles (
  role_id bigint generated always as identity primary key,
  role_code co_desk.role_code not null,
  role_name text not null,
  role_description text,
  can_manage_users boolean not null default false,
  can_manage_departments boolean not null default false,
  can_view_reports boolean not null default false,
  is_system_role boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_role_code_uk unique (role_code),
  constraint roles_role_name_uk unique (role_name)
);

comment on table co_desk.roles is
  'Role definitions for RBAC (employee, hr, admin).';

-- ------------------------------------------------------------
-- 2) departments (created_by_profile_id FK added after profiles)
-- ------------------------------------------------------------
create table if not exists co_desk.departments (
  department_id bigint generated always as identity primary key,
  department_code text not null,
  department_name text not null,
  capacity_mode co_desk.capacity_mode not null default 'limited',
  default_capacity_per_day integer not null default 0,
  is_active boolean not null default true,
  effective_timezone text not null default 'Asia/Bangkok',
  created_by_profile_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_department_code_uk unique (department_code),
  constraint departments_capacity_non_negative_chk check (default_capacity_per_day >= 0),
  constraint departments_capacity_mode_consistency_chk check (
    (capacity_mode = 'limited' and default_capacity_per_day > 0)
    or
    (capacity_mode = 'unlimited' and default_capacity_per_day = 0)
  ),
  constraint departments_timezone_chk check (effective_timezone = 'Asia/Bangkok')
);

comment on table co_desk.departments is
  'Department master with baseline capacity policy (limited/unlimited).';

-- ------------------------------------------------------------
-- 3) profiles (mapped to auth.users concept)
-- ------------------------------------------------------------
create table if not exists co_desk.profiles (
  profile_id uuid primary key,
  employee_code text not null,
  full_name text not null,
  email text not null,
  department_id bigint not null references co_desk.departments(department_id),
  role_id bigint not null references co_desk.roles(role_id),
  is_active boolean not null default true,
  timezone_name text not null default 'Asia/Bangkok',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_employee_code_uk unique (employee_code),
  constraint profiles_timezone_chk check (timezone_name = 'Asia/Bangkok')
);

comment on table co_desk.profiles is
  'Application profile mapped to Supabase Auth user (auth.users.id).';
comment on column co_desk.profiles.profile_id is
  'Expected to match auth.users.id (FK added when auth schema exists).';

create index if not exists idx_profiles_department_id
  on co_desk.profiles (department_id);

create index if not exists idx_profiles_role_id
  on co_desk.profiles (role_id);

create unique index if not exists uidx_profiles_email_lower
  on co_desk.profiles (lower(email));

-- Optional FK to Supabase auth.users (when available in target DB)
do $$
begin
  if to_regclass('auth.users') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'profiles_auth_user_fk'
        and conrelid = 'co_desk.profiles'::regclass
    ) then
      alter table co_desk.profiles
        add constraint profiles_auth_user_fk
        foreign key (profile_id)
        references auth.users(id)
        on delete cascade;
    end if;
  end if;
end $$;

-- departments.created_by_profile_id FK (resolved after profiles exists)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'departments_created_by_profile_fk'
      and conrelid = 'co_desk.departments'::regclass
  ) then
    alter table co_desk.departments
      add constraint departments_created_by_profile_fk
      foreign key (created_by_profile_id)
      references co_desk.profiles(profile_id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_departments_created_by_profile_id
  on co_desk.departments (created_by_profile_id);

-- ------------------------------------------------------------
-- 4) department_capacity_policies
-- ------------------------------------------------------------
create table if not exists co_desk.department_capacity_policies (
  policy_id bigint generated always as identity primary key,
  department_id bigint not null references co_desk.departments(department_id) on delete cascade,
  effective_start_date date not null,
  effective_end_date date,
  capacity_mode co_desk.capacity_mode not null,
  capacity_per_day integer,
  note_text text,
  is_active boolean not null default true,
  created_by_profile_id uuid references co_desk.profiles(profile_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  effective_date_range daterange generated always as (
    daterange(
      effective_start_date,
      coalesce(effective_end_date + 1, 'infinity'::date),
      '[)'
    )
  ) stored,
  constraint department_capacity_policy_date_order_chk check (
    effective_end_date is null or effective_end_date >= effective_start_date
  ),
  constraint department_capacity_policy_mode_chk check (
    (capacity_mode = 'limited' and capacity_per_day is not null and capacity_per_day > 0)
    or
    (capacity_mode = 'unlimited' and capacity_per_day is null)
  )
);

comment on table co_desk.department_capacity_policies is
  'Date-effective capacity policy per department (supports policy history).';

create index if not exists idx_department_capacity_policies_department_id
  on co_desk.department_capacity_policies (department_id);

create index if not exists idx_department_capacity_policies_effective_dates
  on co_desk.department_capacity_policies (department_id, effective_start_date, effective_end_date);

-- No overlapping active policies in the same department.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'department_capacity_policy_no_overlap_excl'
      and conrelid = 'co_desk.department_capacity_policies'::regclass
  ) then
    alter table co_desk.department_capacity_policies
      add constraint department_capacity_policy_no_overlap_excl
      exclude using gist (
        department_id with =,
        effective_date_range with &&
      )
      where (is_active);
  end if;
end $$;

-- ------------------------------------------------------------
-- 5) holidays
-- ------------------------------------------------------------
create table if not exists co_desk.holidays (
  holiday_id bigint generated always as identity primary key,
  holiday_date date not null,
  holiday_name text not null,
  holiday_description text,
  is_active boolean not null default true,
  created_by_profile_id uuid references co_desk.profiles(profile_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint holidays_holiday_date_uk unique (holiday_date)
);

comment on table co_desk.holidays is
  'Holiday master used for booking warning/confirmation flow.';

create index if not exists idx_holidays_active_date
  on co_desk.holidays (holiday_date)
  where is_active;

create index if not exists idx_holidays_created_by_profile_id
  on co_desk.holidays (created_by_profile_id);

-- ------------------------------------------------------------
-- 6) bookings
-- ------------------------------------------------------------
create table if not exists co_desk.bookings (
  booking_id bigint generated always as identity primary key,
  booked_for_profile_id uuid not null references co_desk.profiles(profile_id),
  booked_by_profile_id uuid not null references co_desk.profiles(profile_id),
  department_id bigint not null references co_desk.departments(department_id),
  booking_mode co_desk.booking_mode not null,
  booking_date_start date not null,
  booking_date_end date not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  booking_period tstzrange generated always as (tstzrange(start_at, end_at, '[)')) stored,
  holiday_warning_acknowledged boolean not null default false,
  status_code co_desk.booking_status not null default 'booked',
  note_text text,
  cancelled_at timestamptz,
  cancelled_by_profile_id uuid references co_desk.profiles(profile_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_date_order_chk check (booking_date_end >= booking_date_start),
  constraint bookings_time_order_chk check (end_at > start_at),
  constraint bookings_hour_precision_chk check (
    date_trunc('hour', start_at) = start_at
    and date_trunc('hour', end_at) = end_at
  ),
  constraint bookings_mode_consistency_chk check (
    (
      booking_mode = 'single_day'
      and booking_date_start = booking_date_end
      and (start_at at time zone 'Asia/Bangkok')::time = time '00:00'
      and (end_at at time zone 'Asia/Bangkok')::time = time '00:00'
      and end_at = start_at + interval '1 day'
    )
    or
    (
      booking_mode = 'time_range'
      and end_at > start_at
    )
  ),
  constraint bookings_cancel_state_chk check (
    (status_code = 'booked' and cancelled_at is null and cancelled_by_profile_id is null)
    or
    (status_code = 'cancelled' and cancelled_at is not null and cancelled_by_profile_id is not null)
  )
);

comment on table co_desk.bookings is
  'Seat booking transactions. Uses timestamptz for robust overlap/timezone handling.';
comment on column co_desk.bookings.booking_date_start is
  'Date in UI context (YYYY-MM-DD), used for calendar/reporting.';
comment on column co_desk.bookings.booking_date_end is
  'Inclusive end date in UI context (YYYY-MM-DD).';

create index if not exists idx_bookings_booked_for_profile_id
  on co_desk.bookings (booked_for_profile_id);

create index if not exists idx_bookings_booked_by_profile_id
  on co_desk.bookings (booked_by_profile_id);

create index if not exists idx_bookings_department_id
  on co_desk.bookings (department_id);

create index if not exists idx_bookings_start_at
  on co_desk.bookings (start_at);

create index if not exists idx_bookings_status_code
  on co_desk.bookings (status_code);

create index if not exists idx_bookings_date_start_end
  on co_desk.bookings (booking_date_start, booking_date_end);

create index if not exists idx_bookings_active_department_start
  on co_desk.bookings (department_id, start_at)
  where status_code = 'booked';

create index if not exists idx_bookings_active_profile_start
  on co_desk.bookings (booked_for_profile_id, start_at)
  where status_code = 'booked';

-- Prevent overlap for the same user on active bookings.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_no_overlap_per_user_excl'
      and conrelid = 'co_desk.bookings'::regclass
  ) then
    alter table co_desk.bookings
      add constraint bookings_no_overlap_per_user_excl
      exclude using gist (
        booked_for_profile_id with =,
        booking_period with &&
      )
      where (status_code = 'booked');
  end if;
end $$;

-- ------------------------------------------------------------
-- 7) booking_audit_logs
-- ------------------------------------------------------------
create table if not exists co_desk.booking_audit_logs (
  audit_log_id bigint generated always as identity primary key,
  booking_id bigint not null references co_desk.bookings(booking_id) on delete cascade,
  action_code co_desk.audit_action not null,
  actor_profile_id uuid not null references co_desk.profiles(profile_id),
  actor_role_code co_desk.role_code not null,
  action_reason text,
  old_values_json jsonb not null default '{}'::jsonb,
  new_values_json jsonb not null default '{}'::jsonb,
  action_at timestamptz not null default now(),
  request_id uuid,
  ip_address inet,
  user_agent text
);

comment on table co_desk.booking_audit_logs is
  'Audit trail for create/update/cancel booking operations.';

create index if not exists idx_booking_audit_logs_booking_id_action_at
  on co_desk.booking_audit_logs (booking_id, action_at desc);

create index if not exists idx_booking_audit_logs_actor_action_at
  on co_desk.booking_audit_logs (actor_profile_id, action_at desc);

-- ------------------------------------------------------------
-- 8) user_department_history (optional support)
-- ------------------------------------------------------------
create table if not exists co_desk.user_department_history (
  history_id bigint generated always as identity primary key,
  profile_id uuid not null references co_desk.profiles(profile_id) on delete cascade,
  department_id bigint not null references co_desk.departments(department_id),
  assigned_start_date date not null,
  assigned_end_date date,
  assigned_by_profile_id uuid references co_desk.profiles(profile_id),
  note_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_department_history_date_order_chk check (
    assigned_end_date is null or assigned_end_date >= assigned_start_date
  )
);

comment on table co_desk.user_department_history is
  'Optional table for preserving department movement history per profile.';

create index if not exists idx_user_department_history_profile_dates
  on co_desk.user_department_history (profile_id, assigned_start_date, assigned_end_date);

-- ------------------------------------------------------------
-- Constraint boundaries for this phase
-- ------------------------------------------------------------
-- Enforced directly in schema:
-- 1) Role/domain validity (enum + CHECK)
-- 2) Booking overlap per user (EXCLUDE with tstzrange)
-- 3) Date/time structure and cancellation consistency
--
-- Enforced by RPC/transaction in next phase:
-- 1) Capacity counting under concurrent writes
-- 2) Holiday-warning confirmation across tables
-- 3) HR/Admin action scope with RLS + API authorization
