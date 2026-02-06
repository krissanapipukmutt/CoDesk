create or replace view codesk.v_bookings_per_day as
with b as (
  select b.*, (b.start_at at time zone 'Asia/Bangkok') as start_local,
         (b.end_at at time zone 'Asia/Bangkok') as end_local
  from codesk.bookings b
), days as (
  select
    b.office_id,
    b.department_id,
    b.status,
    (gs)::date as local_date
  from b
  join generate_series(
    date_trunc('day', b.start_local),
    date_trunc('day', b.end_local - interval '1 second'),
    interval '1 day'
  ) gs on true
)
select
  office_id,
  department_id,
  local_date,
  count(*) as total_bookings,
  count(*) filter (where status = 'CONFIRMED') as confirmed_bookings,
  count(*) filter (where status = 'CANCELLED') as cancelled_bookings
from days
group by office_id, department_id, local_date;

create or replace view codesk.v_booking_status_summary as
with b as (
  select b.*, (b.start_at at time zone 'Asia/Bangkok') as start_local,
         (b.end_at at time zone 'Asia/Bangkok') as end_local
  from codesk.bookings b
), days as (
  select
    b.office_id,
    b.department_id,
    b.status,
    (gs)::date as local_date
  from b
  join generate_series(
    date_trunc('day', b.start_local),
    date_trunc('day', b.end_local - interval '1 second'),
    interval '1 day'
  ) gs on true
)
select
  office_id,
  department_id,
  local_date,
  status,
  count(*) as booking_count
from days
group by office_id, department_id, local_date, status;

create or replace view codesk.v_popular_seats as
with b as (
  select
    b.id,
    b.office_id,
    b.department_id,
    b.seat_id,
    (b.start_at at time zone 'Asia/Bangkok') as start_local,
    (b.end_at at time zone 'Asia/Bangkok') as end_local
  from codesk.bookings b
  where b.status = 'CONFIRMED' and b.seat_id is not null
), segments as (
  select
    b.office_id,
    b.department_id,
    b.seat_id,
    gs as day_start_local,
    greatest(b.start_local, gs) as seg_start,
    least(b.end_local, gs + interval '1 day') as seg_end
  from b
  join generate_series(
    date_trunc('day', b.start_local),
    date_trunc('day', b.end_local - interval '1 second'),
    interval '1 day'
  ) gs on true
)
select
  s.office_id,
  s.department_id,
  s.seg_start::date as local_date,
  s.seat_id,
  seat.seat_code,
  count(*) as booking_count,
  sum(extract(epoch from (s.seg_end - s.seg_start)) / 60) as booked_minutes
from segments s
join codesk.seats seat on seat.id = s.seat_id
group by s.office_id, s.department_id, s.seg_start::date, s.seat_id, seat.seat_code;

create or replace view codesk.v_utilization_by_department as
with b as (
  select
    b.office_id,
    b.department_id,
    (b.start_at at time zone 'Asia/Bangkok') as start_local,
    (b.end_at at time zone 'Asia/Bangkok') as end_local
  from codesk.bookings b
  where b.status = 'CONFIRMED'
), segments as (
  select
    b.office_id,
    b.department_id,
    gs as day_start_local,
    greatest(b.start_local, gs) as seg_start,
    least(b.end_local, gs + interval '1 day') as seg_end
  from b
  join generate_series(
    date_trunc('day', b.start_local),
    date_trunc('day', b.end_local - interval '1 second'),
    interval '1 day'
  ) gs on true
), booked as (
  select
    office_id,
    department_id,
    seg_start::date as local_date,
    sum(extract(epoch from (seg_end - seg_start)) / 60) as booked_minutes
  from segments
  group by office_id, department_id, seg_start::date
), seats as (
  select
    office_id,
    department_id,
    count(*) as seat_count
  from codesk.seats
  where is_active = true and is_bookable = true
  group by office_id, department_id
)
select
  b.office_id,
  b.department_id,
  b.local_date,
  b.booked_minutes,
  (coalesce(s.seat_count, 0) * 1440) as capacity_minutes,
  case
    when coalesce(s.seat_count, 0) = 0 then 0
    else round((b.booked_minutes / nullif(s.seat_count * 1440, 0)) * 100, 2)
  end as utilization_pct
from booked b
left join seats s
  on s.office_id = b.office_id and s.department_id = b.department_id;

create or replace view codesk.v_peak_times as
with b as (
  select
    b.office_id,
    b.department_id,
    (b.start_at at time zone 'Asia/Bangkok') as start_local,
    (b.end_at at time zone 'Asia/Bangkok') as end_local
  from codesk.bookings b
  where b.status = 'CONFIRMED'
), slots as (
  select
    b.office_id,
    b.department_id,
    gs as slot_start_local,
    gs + interval '30 minutes' as slot_end_local
  from b
  join generate_series(
    date_trunc('day', b.start_local),
    date_trunc('day', b.end_local - interval '1 second') + interval '23 hours 30 minutes',
    interval '30 minutes'
  ) gs on true
  where b.start_local < gs + interval '30 minutes'
    and b.end_local > gs
)
select
  office_id,
  department_id,
  slot_start_local::date as local_date,
  slot_start_local,
  slot_end_local,
  count(*) as concurrent_bookings
from slots
group by office_id, department_id, slot_start_local, slot_end_local;
