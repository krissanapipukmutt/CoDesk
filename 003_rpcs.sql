-- Helper functions for RLS and RPCs
create or replace function codesk.current_profile()
returns table (
  user_id uuid,
  employee_id uuid,
  department_id uuid,
  office_id uuid,
  role codesk.app_role
)
language sql
stable
security definer
set search_path = codesk, public
set row_security = off
as $$
  select p.user_id, p.employee_id, e.department_id, d.office_id, p.role
  from codesk.profiles p
  join codesk.employees e on e.id = p.employee_id
  join codesk.departments d on d.id = e.department_id
  where p.user_id = auth.uid();
$$;

create or replace function codesk.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = codesk, public
set row_security = off
as $$
  select auth.uid();
$$;

create or replace function codesk.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = codesk, public
set row_security = off
as $$
  select employee_id from codesk.current_profile();
$$;

create or replace function codesk.current_department_id()
returns uuid
language sql
stable
security definer
set search_path = codesk, public
set row_security = off
as $$
  select department_id from codesk.current_profile();
$$;

create or replace function codesk.current_office_id()
returns uuid
language sql
stable
security definer
set search_path = codesk, public
set row_security = off
as $$
  select office_id from codesk.current_profile();
$$;

create or replace function codesk.current_role()
returns codesk.app_role
language sql
stable
security definer
set search_path = codesk, public
set row_security = off
as $$
  select role from codesk.current_profile();
$$;

-- RPC: create booking
create or replace function codesk.create_booking(
  p_employee_id uuid,
  p_department_id uuid,
  p_office_id uuid,
  p_seat_id uuid,
  p_booking_type codesk.booking_type,
  p_start_at timestamptz,
  p_end_at timestamptz
)
returns table (
  booking_id uuid,
  status codesk.booking_status,
  seat_id uuid,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = codesk, public
set row_security = off
as $$
declare
  v_role codesk.app_role;
  v_requestor_employee_id uuid;
  v_requestor_department_id uuid;
  v_requestor_office_id uuid;
  v_emp_department_id uuid;
  v_emp_office_id uuid;
  v_capacity integer;
  v_max_concurrent integer;
  v_local_date date;
  v_has_overlap boolean;
begin
  if p_end_at <= p_start_at then
    raise exception using errcode = 'P0001', message = 'INVALID_RANGE';
  end if;

  select role, employee_id, department_id, office_id
    into v_role, v_requestor_employee_id, v_requestor_department_id, v_requestor_office_id
  from codesk.current_profile();

  if v_role is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  -- Validate target employee and department
  select e.department_id, d.office_id
    into v_emp_department_id, v_emp_office_id
  from codesk.employees e
  join codesk.departments d on d.id = e.department_id
  where e.id = p_employee_id
    and e.active = true;

  if not found then
    raise exception using errcode = 'P0001', message = 'INACTIVE_EMPLOYEE';
  end if;

  if p_department_id <> v_emp_department_id or p_office_id <> v_emp_office_id then
    raise exception using errcode = 'P0001', message = 'DEPARTMENT_MISMATCH';
  end if;

  -- Authorization
  if v_role = 'employee' then
    if p_employee_id <> v_requestor_employee_id then
      raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
    end if;
  elsif v_role = 'hr' then
    if v_emp_department_id <> v_requestor_department_id then
      raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
    end if;
  elsif v_role = 'admin' then
    -- ok
  else
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  -- Holiday closed enforcement (Asia/Bangkok date)
  if exists (
    select 1
    from codesk.holidays h
    where h.is_active = true
      and h.rule = 'CLOSED'
      and (h.office_id is null or h.office_id = p_office_id)
      and h.holiday_date in (
        select d::date
        from generate_series(
          (p_start_at at time zone 'Asia/Bangkok')::date,
          ((p_end_at - interval '1 second') at time zone 'Asia/Bangkok')::date,
          interval '1 day'
        ) d
      )
  ) then
    raise exception using errcode = 'P0001', message = 'HOLIDAY_CLOSED';
  end if;

  -- Concurrency: advisory locks per day for capacity check
  for v_local_date in
    select d::date from generate_series(
      (p_start_at at time zone 'Asia/Bangkok')::date,
      ((p_end_at - interval '1 second') at time zone 'Asia/Bangkok')::date,
      interval '1 day'
    ) d
  loop
    perform pg_advisory_xact_lock(
      hashtext(p_department_id::text || ':' || p_office_id::text || ':' || v_local_date::text)
    );
  end loop;

  select coalesce(d.daily_capacity,
    (select count(*) from codesk.seats s
      where s.department_id = p_department_id
        and s.office_id = p_office_id
        and s.is_active = true
        and s.is_bookable = true))
    into v_capacity
  from codesk.departments d
  where d.id = p_department_id and d.is_active = true;

  if v_capacity is null or v_capacity = 0 then
    raise exception using errcode = 'P0001', message = 'OVER_CAPACITY';
  end if;

  -- Employee cannot overlap own bookings
  select exists (
    select 1
    from codesk.bookings b
    where b.employee_id = p_employee_id
      and b.status = 'CONFIRMED'
      and b.booking_range && tstzrange(p_start_at, p_end_at, '[)')
  ) into v_has_overlap;

  if v_has_overlap then
    raise exception using errcode = 'P0001', message = 'CONFLICT';
  end if;

  with overlapping as (
    select b.start_at, b.end_at
    from codesk.bookings b
    where b.status = 'CONFIRMED'
      and b.department_id = p_department_id
      and b.office_id = p_office_id
      and b.booking_range && tstzrange(p_start_at, p_end_at, '[)')
  ),
  timepoints as (
    select o.start_at as ts from overlapping o
    union all select p_start_at
  ),
  counts as (
    select t.ts,
      (select count(*) from overlapping o where o.start_at <= t.ts and o.end_at > t.ts) as cnt
    from timepoints t
  )
  select coalesce(max(cnt), 0)
    into v_max_concurrent
  from counts;

  if v_max_concurrent + 1 > v_capacity then
    raise exception using errcode = 'P0001', message = 'OVER_CAPACITY';
  end if;

  insert into codesk.bookings as b (
    office_id, department_id, employee_id, seat_id,
    booking_type, status, start_at, end_at, created_at, updated_at
  ) values (
    p_office_id, p_department_id, p_employee_id, null,
    p_booking_type, 'CONFIRMED', p_start_at, p_end_at, now(), now()
  )
  returning b.id, b.status, b.seat_id, b.start_at, b.end_at, b.created_at
    into booking_id, status, seat_id, start_at, end_at, created_at;

  return;
exception
  when exclusion_violation then
    raise exception using errcode = 'P0001', message = 'CONFLICT';
end;
$$;

comment on function codesk.create_booking(uuid, uuid, uuid, uuid, codesk.booking_type, timestamptz, timestamptz)
  is 'Error codes: INVALID_RANGE, UNAUTHORIZED, INACTIVE_EMPLOYEE, DEPARTMENT_MISMATCH, HOLIDAY_CLOSED, OVER_CAPACITY, CONFLICT';

-- RPC: cancel booking
create or replace function codesk.cancel_booking(
  p_booking_id uuid,
  p_reason text default null
)
returns table (
  booking_id uuid,
  status codesk.booking_status,
  cancelled_at timestamptz
)
language plpgsql
security definer
set search_path = codesk, public
set row_security = off
as $$
declare
  v_role codesk.app_role;
  v_requestor_employee_id uuid;
  v_requestor_department_id uuid;
begin
  select role, employee_id, department_id
    into v_role, v_requestor_employee_id, v_requestor_department_id
  from codesk.current_profile();

  if v_role is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  update codesk.bookings b
  set status = 'CANCELLED', cancelled_at = now(), updated_at = now(), cancel_reason = p_reason
  where b.id = p_booking_id
    and b.status = 'CONFIRMED'
    and (
      (v_role = 'admin')
      or (v_role = 'hr' and b.department_id = v_requestor_department_id)
      or (v_role = 'employee' and b.employee_id = v_requestor_employee_id)
    )
  returning b.id, b.status, b.cancelled_at
    into booking_id, status, cancelled_at;

  if not found then
    if exists (select 1 from codesk.bookings where id = p_booking_id and status = 'CANCELLED') then
      raise exception using errcode = 'P0001', message = 'ALREADY_CANCELLED';
    elsif exists (select 1 from codesk.bookings where id = p_booking_id) then
      raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
    else
      raise exception using errcode = 'P0001', message = 'NOT_FOUND';
    end if;
  end if;

  return;
end;
$$;

comment on function codesk.cancel_booking(uuid, text)
  is 'Error codes: UNAUTHORIZED, NOT_FOUND, ALREADY_CANCELLED';
