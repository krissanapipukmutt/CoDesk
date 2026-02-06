-- Exclusion constraint for seat-assigned overlap prevention
alter table codesk.bookings
  add constraint bookings_seat_no_overlap
  exclude using gist (
    seat_id with =,
    booking_range with &&
  )
  where (status = 'CONFIRMED' and seat_id is not null);

-- Indexes for calendar and reports
create index bookings_booking_range_gist on codesk.bookings using gist (booking_range);
create index bookings_seat_id_idx on codesk.bookings (seat_id);
create index bookings_dept_office_start_idx on codesk.bookings (department_id, office_id, start_at);
create index bookings_employee_start_idx on codesk.bookings (employee_id, start_at);
create index bookings_status_idx on codesk.bookings (status);

create index seats_capacity_idx on codesk.seats (department_id, office_id) where is_active and is_bookable;

create index employees_department_idx on codesk.employees (department_id);

create index departments_office_idx on codesk.departments (office_id);

create index holidays_office_date_idx on codesk.holidays (office_id, holiday_date);
create index holidays_date_idx on codesk.holidays (holiday_date);

create index profiles_employee_idx on codesk.profiles (employee_id);
create index profiles_role_idx on codesk.profiles (role);
