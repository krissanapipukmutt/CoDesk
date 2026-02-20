-- Ensure extension for GIST on equality
create extension if not exists btree_gist;

-- Prevent same employee from overlapping bookings when status = CONFIRMED
alter table codesk.bookings
  add constraint bookings_no_overlap_per_employee
  exclude using gist (
    employee_id with =,
    booking_range with &&
  )
  where (status = 'CONFIRMED');
