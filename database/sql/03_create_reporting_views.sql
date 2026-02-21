-- ============================================================
-- co_desk | 03_create_reporting_views.sql
-- Purpose: Reporting layer (design-time views for hr/admin dashboards)
-- Note: Row-level security and role-based visibility are enforced in app/RLS phase.
-- ============================================================

-- ------------------------------------------------------------
-- View 1: Daily booking summary by department
-- Business question: แต่ละแผนกมีการจองรายวันกี่รายการ/กี่คน
-- Source tables: bookings, departments
-- ------------------------------------------------------------
create or replace view co_desk.vw_daily_booking_summary_by_department as
with booking_days as (
  select
    b.booking_id,
    b.department_id,
    b.booked_for_profile_id,
    gs::date as booking_date
  from co_desk.bookings b
  cross join lateral generate_series(
    b.booking_date_start::timestamp,
    b.booking_date_end::timestamp,
    interval '1 day'
  ) gs
  where b.status_code = 'booked'
)
select
  bd.booking_date,
  d.department_id,
  d.department_code,
  d.department_name,
  count(*) as booking_count,
  count(distinct bd.booked_for_profile_id) as unique_employee_count
from booking_days bd
join co_desk.departments d on d.department_id = bd.department_id
group by
  bd.booking_date,
  d.department_id,
  d.department_code,
  d.department_name;

comment on view co_desk.vw_daily_booking_summary_by_department is
  'Daily booking count and unique users per department (for hr/admin).';

-- ------------------------------------------------------------
-- View 2: Department capacity utilization
-- Business question: อัตราการใช้ความจุรายแผนกในแต่ละวันเป็นเท่าไร
-- Source tables: bookings, departments, department_capacity_policies
-- ------------------------------------------------------------
create or replace view co_desk.vw_department_capacity_utilization as
with daily_counts as (
  select
    x.booking_date,
    x.department_id,
    count(*) as booked_count
  from (
    select
      b.department_id,
      gs::date as booking_date
    from co_desk.bookings b
    cross join lateral generate_series(
      b.booking_date_start::timestamp,
      b.booking_date_end::timestamp,
      interval '1 day'
    ) gs
    where b.status_code = 'booked'
  ) x
  group by x.booking_date, x.department_id
),
capacity_resolved as (
  select
    dc.booking_date,
    d.department_id,
    d.department_code,
    d.department_name,
    dc.booked_count,
    coalesce(p.capacity_mode, d.capacity_mode) as effective_capacity_mode,
    coalesce(p.capacity_per_day, d.default_capacity_per_day) as effective_capacity_per_day
  from daily_counts dc
  join co_desk.departments d
    on d.department_id = dc.department_id
  left join lateral (
    select
      p.capacity_mode,
      p.capacity_per_day
    from co_desk.department_capacity_policies p
    where p.department_id = dc.department_id
      and p.is_active
      and dc.booking_date between p.effective_start_date and coalesce(p.effective_end_date, 'infinity'::date)
    order by p.effective_start_date desc
    limit 1
  ) p on true
)
select
  booking_date,
  department_id,
  department_code,
  department_name,
  effective_capacity_mode,
  effective_capacity_per_day,
  booked_count,
  case
    when effective_capacity_mode = 'limited' then
      round((booked_count::numeric / nullif(effective_capacity_per_day, 0)::numeric) * 100.0, 2)
    else null
  end as utilization_percent
from capacity_resolved;

comment on view co_desk.vw_department_capacity_utilization is
  'Daily capacity utilization by department with effective policy resolution.';

-- ------------------------------------------------------------
-- View 3: Employee booking frequency
-- Business question: พนักงานแต่ละคนจองถี่แค่ไหนในแต่ละเดือน
-- Source tables: bookings, profiles, departments
-- ------------------------------------------------------------
create or replace view co_desk.vw_employee_booking_frequency as
select
  date_trunc('month', timezone('Asia/Bangkok', b.start_at))::date as booking_month,
  p.profile_id,
  p.employee_code,
  p.full_name,
  p.email,
  d.department_id,
  d.department_code,
  d.department_name,
  count(*) filter (where b.status_code = 'booked') as booked_count,
  count(*) filter (where b.status_code = 'cancelled') as cancelled_count,
  max(b.start_at) filter (where b.status_code = 'booked') as latest_booked_at
from co_desk.profiles p
join co_desk.departments d on d.department_id = p.department_id
join co_desk.bookings b on b.booked_for_profile_id = p.profile_id
group by
  date_trunc('month', timezone('Asia/Bangkok', b.start_at))::date,
  p.profile_id,
  p.employee_code,
  p.full_name,
  p.email,
  d.department_id,
  d.department_code,
  d.department_name;

comment on view co_desk.vw_employee_booking_frequency is
  'Monthly booking frequency per employee (booked/cancelled).';

-- ------------------------------------------------------------
-- View 4: Holiday bookings detail
-- Business question: รายการจองที่ทับวันหยุด และสถานะการยืนยันคำเตือน
-- Source tables: bookings, holidays, profiles, departments
-- ------------------------------------------------------------
create or replace view co_desk.vw_holiday_bookings_detail as
select
  b.booking_id,
  b.status_code,
  b.booking_mode,
  b.booking_date_start,
  b.booking_date_end,
  b.start_at,
  b.end_at,
  b.holiday_warning_acknowledged,
  h.holiday_date,
  h.holiday_name,
  p.profile_id as employee_profile_id,
  p.employee_code,
  p.full_name,
  d.department_id,
  d.department_code,
  d.department_name
from co_desk.bookings b
join co_desk.holidays h
  on h.is_active
 and h.holiday_date between b.booking_date_start and b.booking_date_end
join co_desk.profiles p
  on p.profile_id = b.booked_for_profile_id
join co_desk.departments d
  on d.department_id = b.department_id;

comment on view co_desk.vw_holiday_bookings_detail is
  'Holiday-overlapping bookings with warning acknowledgement status.';

-- ------------------------------------------------------------
-- View 5: Booking cancellations summary
-- Business question: แนวโน้มการยกเลิกจองรายแผนกเป็นอย่างไร
-- Source tables: bookings, departments
-- ------------------------------------------------------------
create or replace view co_desk.vw_booking_cancellations_summary as
select
  date_trunc('month', timezone('Asia/Bangkok', b.cancelled_at))::date as cancellation_month,
  d.department_id,
  d.department_code,
  d.department_name,
  count(*) as cancellation_count,
  count(distinct b.booked_for_profile_id) as unique_cancelled_users
from co_desk.bookings b
join co_desk.departments d on d.department_id = b.department_id
where b.status_code = 'cancelled'
group by
  date_trunc('month', timezone('Asia/Bangkok', b.cancelled_at))::date,
  d.department_id,
  d.department_code,
  d.department_name;

comment on view co_desk.vw_booking_cancellations_summary is
  'Monthly cancellation summary by department.';

-- ------------------------------------------------------------
-- View 6 (recommended): Peak usage by day/time slot
-- Business question: ช่วงวัน/ชั่วโมงใดมีการใช้งานสูงสุด
-- Source tables: bookings, departments
-- ------------------------------------------------------------
create or replace view co_desk.vw_peak_usage_by_day_hour as
with hourly_slots as (
  select
    b.department_id,
    timezone('Asia/Bangkok', slot_ts) as slot_local_ts
  from co_desk.bookings b
  cross join lateral generate_series(
    b.start_at,
    b.end_at - interval '1 hour',
    interval '1 hour'
  ) as slot_ts
  where b.status_code = 'booked'
)
select
  d.department_id,
  d.department_code,
  d.department_name,
  extract(isodow from hs.slot_local_ts)::int as iso_weekday,
  extract(hour from hs.slot_local_ts)::int as hour_24,
  count(*) as occupied_slot_count
from hourly_slots hs
join co_desk.departments d on d.department_id = hs.department_id
group by
  d.department_id,
  d.department_code,
  d.department_name,
  extract(isodow from hs.slot_local_ts)::int,
  extract(hour from hs.slot_local_ts)::int;

comment on view co_desk.vw_peak_usage_by_day_hour is
  'Peak occupancy by weekday/hour for capacity planning.';
