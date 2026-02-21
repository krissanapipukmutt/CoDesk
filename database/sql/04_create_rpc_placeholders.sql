-- ============================================================
-- co_desk | 04_create_rpc_placeholders.sql
-- Purpose: Placeholder RPC/functions for business rules that require
--          procedural logic + transaction/locking beyond static DDL.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Conflict check: same user cannot overlap booking period
-- ------------------------------------------------------------
create or replace function co_desk.check_booking_conflict(
  p_booked_for_profile_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_exclude_booking_id bigint default null
)
returns table (
  has_conflict boolean,
  conflict_count integer,
  conflicting_booking_ids bigint[],
  message text
)
language sql
stable
as $$
  with conflicts as (
    select b.booking_id
    from co_desk.bookings b
    where b.booked_for_profile_id = p_booked_for_profile_id
      and b.status_code = 'booked'
      and (p_exclude_booking_id is null or b.booking_id <> p_exclude_booking_id)
      and tstzrange(p_start_at, p_end_at, '[)') && b.booking_period
  )
  select
    count(*) > 0 as has_conflict,
    count(*)::int as conflict_count,
    coalesce(array_agg(booking_id), '{}'::bigint[]) as conflicting_booking_ids,
    case
      when count(*) > 0 then 'BOOKING_CONFLICT'
      else 'NO_CONFLICT'
    end as message
  from conflicts;
$$;

comment on function co_desk.check_booking_conflict(uuid, timestamptz, timestamptz, bigint) is
  'Checks overlap conflict for one user within requested booking period.';

-- ------------------------------------------------------------
-- 2) Capacity check: limited/unlimited by effective department policy
-- ------------------------------------------------------------
create or replace function co_desk.check_department_capacity(
  p_department_id bigint,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_exclude_booking_id bigint default null
)
returns table (
  is_available boolean,
  effective_capacity_mode co_desk.capacity_mode,
  effective_capacity_per_day integer,
  active_booking_count integer,
  message text
)
language sql
stable
as $$
  with request_ctx as (
    select (p_start_at at time zone 'Asia/Bangkok')::date as request_date
  ),
  dept_policy as (
    select
      d.department_id,
      coalesce(p.capacity_mode, d.capacity_mode) as effective_mode,
      coalesce(p.capacity_per_day, d.default_capacity_per_day) as effective_capacity
    from co_desk.departments d
    left join lateral (
      select p.capacity_mode, p.capacity_per_day
      from co_desk.department_capacity_policies p
      join request_ctx rc on true
      where p.department_id = d.department_id
        and p.is_active
        and rc.request_date between p.effective_start_date and coalesce(p.effective_end_date, 'infinity'::date)
      order by p.effective_start_date desc
      limit 1
    ) p on true
    where d.department_id = p_department_id
  ),
  usage_count as (
    select count(*)::int as cnt
    from co_desk.bookings b
    where b.department_id = p_department_id
      and b.status_code = 'booked'
      and (p_exclude_booking_id is null or b.booking_id <> p_exclude_booking_id)
      and tstzrange(p_start_at, p_end_at, '[)') && b.booking_period
  )
  select
    case
      when dp.effective_mode = 'unlimited' then true
      when dp.effective_mode = 'limited' then uc.cnt < dp.effective_capacity
      else false
    end as is_available,
    dp.effective_mode as effective_capacity_mode,
    dp.effective_capacity as effective_capacity_per_day,
    uc.cnt as active_booking_count,
    case
      when dp.effective_mode = 'unlimited' then 'CAPACITY_UNLIMITED'
      when uc.cnt < dp.effective_capacity then 'CAPACITY_AVAILABLE'
      else 'CAPACITY_EXCEEDED'
    end as message
  from dept_policy dp
  cross join usage_count uc;
$$;

comment on function co_desk.check_department_capacity(bigint, timestamptz, timestamptz, bigint) is
  'Checks effective department capacity for requested period.';

-- ------------------------------------------------------------
-- 3) Holiday warning check
-- ------------------------------------------------------------
create or replace function co_desk.check_holiday_warning(
  p_booking_date_start date,
  p_booking_date_end date
)
returns table (
  has_holiday boolean,
  holiday_count integer,
  holiday_dates date[],
  holiday_names text[],
  message text
)
language sql
stable
as $$
  with matched as (
    select h.holiday_date, h.holiday_name
    from co_desk.holidays h
    where h.is_active
      and h.holiday_date between p_booking_date_start and p_booking_date_end
    order by h.holiday_date
  )
  select
    count(*) > 0 as has_holiday,
    count(*)::int as holiday_count,
    coalesce(array_agg(holiday_date), '{}'::date[]) as holiday_dates,
    coalesce(array_agg(holiday_name), '{}'::text[]) as holiday_names,
    case
      when count(*) > 0 then 'HOLIDAY_WARNING_REQUIRED'
      else 'NO_HOLIDAY_WARNING'
    end as message
  from matched;
$$;

comment on function co_desk.check_holiday_warning(date, date) is
  'Finds whether booking date range overlaps active holidays.';

-- ------------------------------------------------------------
-- 4) Create booking (placeholder RPC)
-- Expected return shape: {
--   success: boolean,
--   error_code: text|null,
--   message: text,
--   warning: jsonb|null,
--   data: jsonb
-- }
-- ------------------------------------------------------------
create or replace function co_desk.create_booking_with_validation(
  p_booked_for_profile_id uuid,
  p_booked_by_profile_id uuid,
  p_department_id bigint,
  p_booking_mode co_desk.booking_mode,
  p_booking_date_start date,
  p_booking_date_end date,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_holiday_warning_acknowledged boolean default false,
  p_note_text text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_conflict record;
  v_capacity record;
  v_holiday record;
begin
  select * into v_conflict
  from co_desk.check_booking_conflict(
    p_booked_for_profile_id,
    p_start_at,
    p_end_at,
    null
  );

  if v_conflict.has_conflict then
    return jsonb_build_object(
      'success', false,
      'error_code', 'BOOKING_CONFLICT',
      'message', 'User has overlapping booking in requested period.',
      'warning', null,
      'data', jsonb_build_object('conflicting_booking_ids', v_conflict.conflicting_booking_ids)
    );
  end if;

  select * into v_capacity
  from co_desk.check_department_capacity(
    p_department_id,
    p_start_at,
    p_end_at,
    null
  );

  if not found then
    return jsonb_build_object(
      'success', false,
      'error_code', 'DEPARTMENT_NOT_FOUND',
      'message', 'Department not found for capacity validation.',
      'warning', null,
      'data', jsonb_build_object('department_id', p_department_id)
    );
  end if;

  if not v_capacity.is_available then
    return jsonb_build_object(
      'success', false,
      'error_code', 'CAPACITY_EXCEEDED',
      'message', 'Department capacity would be exceeded for requested period.',
      'warning', null,
      'data', jsonb_build_object(
        'effective_capacity_mode', v_capacity.effective_capacity_mode,
        'effective_capacity_per_day', v_capacity.effective_capacity_per_day,
        'active_booking_count', v_capacity.active_booking_count
      )
    );
  end if;

  select * into v_holiday
  from co_desk.check_holiday_warning(
    p_booking_date_start,
    p_booking_date_end
  );

  if v_holiday.has_holiday and not p_holiday_warning_acknowledged then
    return jsonb_build_object(
      'success', false,
      'error_code', 'HOLIDAY_CONFIRM_REQUIRED',
      'message', 'Booking overlaps holiday. User confirmation is required.',
      'warning', jsonb_build_object(
        'holiday_dates', v_holiday.holiday_dates,
        'holiday_names', v_holiday.holiday_names
      ),
      'data', jsonb_build_object()
    );
  end if;

  -- TODO(phase-implementation):
  -- 1) Enforce RBAC/RLS inside transaction context (admin override, hr limitation)
  -- 2) Use transaction + locking (SERIALIZABLE or SELECT ... FOR UPDATE)
  --    to prevent race conditions when capacity is nearly full.
  -- 3) Insert booking row and audit log atomically.

  return jsonb_build_object(
    'success', false,
    'error_code', 'NOT_IMPLEMENTED',
    'message', 'Validation passed but booking write transaction is not implemented in this phase.',
    'warning', null,
    'data', jsonb_build_object(
      'validated', true,
      'next_action', 'Implement atomic insert + audit in next phase'
    )
  );
end;
$$;

comment on function co_desk.create_booking_with_validation(
  uuid, uuid, bigint, co_desk.booking_mode, date, date, timestamptz, timestamptz, boolean, text
) is 'Placeholder RPC for create booking with conflict/capacity/holiday validation.';

-- ------------------------------------------------------------
-- 5) Update booking (placeholder RPC)
-- ------------------------------------------------------------
create or replace function co_desk.update_booking_with_validation(
  p_booking_id bigint,
  p_actor_profile_id uuid,
  p_department_id bigint,
  p_booking_mode co_desk.booking_mode,
  p_booking_date_start date,
  p_booking_date_end date,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_holiday_warning_acknowledged boolean default false,
  p_note_text text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_target co_desk.bookings%rowtype;
  v_conflict record;
  v_capacity record;
  v_holiday record;
begin
  select * into v_target
  from co_desk.bookings b
  where b.booking_id = p_booking_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error_code', 'BOOKING_NOT_FOUND',
      'message', 'Target booking not found.',
      'warning', null,
      'data', jsonb_build_object('booking_id', p_booking_id)
    );
  end if;

  select * into v_conflict
  from co_desk.check_booking_conflict(
    v_target.booked_for_profile_id,
    p_start_at,
    p_end_at,
    p_booking_id
  );

  if v_conflict.has_conflict then
    return jsonb_build_object(
      'success', false,
      'error_code', 'BOOKING_CONFLICT',
      'message', 'Updated period conflicts with existing booking.',
      'warning', null,
      'data', jsonb_build_object('conflicting_booking_ids', v_conflict.conflicting_booking_ids)
    );
  end if;

  select * into v_capacity
  from co_desk.check_department_capacity(
    p_department_id,
    p_start_at,
    p_end_at,
    p_booking_id
  );

  if not found then
    return jsonb_build_object(
      'success', false,
      'error_code', 'DEPARTMENT_NOT_FOUND',
      'message', 'Department not found for capacity validation.',
      'warning', null,
      'data', jsonb_build_object('department_id', p_department_id)
    );
  end if;

  if not v_capacity.is_available then
    return jsonb_build_object(
      'success', false,
      'error_code', 'CAPACITY_EXCEEDED',
      'message', 'Updated booking would exceed department capacity.',
      'warning', null,
      'data', jsonb_build_object(
        'effective_capacity_mode', v_capacity.effective_capacity_mode,
        'effective_capacity_per_day', v_capacity.effective_capacity_per_day,
        'active_booking_count', v_capacity.active_booking_count
      )
    );
  end if;

  select * into v_holiday
  from co_desk.check_holiday_warning(
    p_booking_date_start,
    p_booking_date_end
  );

  if v_holiday.has_holiday and not p_holiday_warning_acknowledged then
    return jsonb_build_object(
      'success', false,
      'error_code', 'HOLIDAY_CONFIRM_REQUIRED',
      'message', 'Updated booking overlaps holiday and needs confirmation.',
      'warning', jsonb_build_object(
        'holiday_dates', v_holiday.holiday_dates,
        'holiday_names', v_holiday.holiday_names
      ),
      'data', jsonb_build_object('booking_id', p_booking_id)
    );
  end if;

  -- TODO(phase-implementation):
  -- 1) Enforce owner/admin edit authorization.
  -- 2) Execute atomic UPDATE + INSERT audit_log in one transaction.
  -- 3) Add optimistic lock check via updated_at/version column.

  return jsonb_build_object(
    'success', false,
    'error_code', 'NOT_IMPLEMENTED',
    'message', 'Validation passed but update transaction is not implemented in this phase.',
    'warning', null,
    'data', jsonb_build_object('booking_id', p_booking_id)
  );
end;
$$;

comment on function co_desk.update_booking_with_validation(
  bigint, uuid, bigint, co_desk.booking_mode, date, date, timestamptz, timestamptz, boolean, text
) is 'Placeholder RPC for update booking with validation and audit intent.';

-- ------------------------------------------------------------
-- 6) Cancel booking (placeholder RPC)
-- ------------------------------------------------------------
create or replace function co_desk.cancel_booking(
  p_booking_id bigint,
  p_actor_profile_id uuid,
  p_actor_role_code co_desk.role_code,
  p_reason text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_target co_desk.bookings%rowtype;
begin
  select * into v_target
  from co_desk.bookings b
  where b.booking_id = p_booking_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error_code', 'BOOKING_NOT_FOUND',
      'message', 'Target booking not found.',
      'warning', null,
      'data', jsonb_build_object('booking_id', p_booking_id)
    );
  end if;

  -- TODO(phase-implementation):
  -- 1) Authorize cancellation (owner can cancel own booking, admin can cancel all).
  -- 2) Update status to cancelled + set cancelled_at/cancelled_by_profile_id.
  -- 3) Insert booking_audit_logs record in same transaction.

  return jsonb_build_object(
    'success', false,
    'error_code', 'NOT_IMPLEMENTED',
    'message', 'Cancel booking transaction is not implemented in this phase.',
    'warning', null,
    'data', jsonb_build_object(
      'booking_id', p_booking_id,
      'requested_by', p_actor_profile_id,
      'requested_role', p_actor_role_code,
      'reason', p_reason
    )
  );
end;
$$;

comment on function co_desk.cancel_booking(bigint, uuid, co_desk.role_code, text) is
  'Placeholder RPC for cancellation workflow with audit logging intent.';
