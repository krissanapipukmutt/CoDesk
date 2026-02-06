-- Demo data
insert into codesk.offices (id, code, name, tz, is_active)
values ('11111111-1111-1111-1111-111111111111', 'BKK-01', 'Bangkok HQ', 'Asia/Bangkok', true);

insert into codesk.departments (id, office_id, name, strategy, is_active)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Engineering', 'ASSIGNED', true),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Support', 'UNASSIGNED', true);

insert into codesk.seats (id, office_id, department_id, seat_code, seat_name, is_active, is_bookable)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'ENG-A1', 'Eng Seat A1', true, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'ENG-A2', 'Eng Seat A2', true, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'ENG-A3', 'Eng Seat A3', true, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'SUP-U1', 'Support Seat U1', true, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'SUP-U2', 'Support Seat U2', true, true);

insert into codesk.employees (id, employee_code, name, email, department_id, start_date, active)
values
  ('44444444-4444-4444-4444-444444444444', 'ENG-001', 'Alice Eng', 'alice.eng@codesk.example', '22222222-2222-2222-2222-222222222222', '2025-01-10', true),
  ('55555555-5555-5555-5555-555555555555', 'ENG-002', 'Bob Eng', 'bob.eng@codesk.example', '22222222-2222-2222-2222-222222222222', '2025-02-01', true),
  ('66666666-6666-6666-6666-666666666666', 'SUP-001', 'Nok Support', 'nok.sup@codesk.example', '33333333-3333-3333-3333-333333333333', '2025-02-01', true),
  ('77777777-7777-7777-7777-777777777777', 'SUP-002', 'Ploy Support', 'ploy.sup@codesk.example', '33333333-3333-3333-3333-333333333333', '2025-02-01', true),
  ('88888888-8888-8888-8888-888888888888', 'ADM-001', 'Admin User', 'admin@codesk.example', '22222222-2222-2222-2222-222222222222', '2025-01-01', true);

-- Seed auth users (minimal fields for testing RPC locally)
insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'alice.eng@codesk.example', crypt('password', gen_salt('bf')), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'nok.sup@codesk.example', crypt('password', gen_salt('bf')), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'authenticated', 'authenticated', 'ploy.sup@codesk.example', crypt('password', gen_salt('bf')), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'authenticated', 'authenticated', 'admin@codesk.example', crypt('password', gen_salt('bf')), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into codesk.profiles (user_id, employee_id, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'employee'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', 'employee'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777777', 'hr'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '88888888-8888-8888-8888-888888888888', 'admin');

insert into codesk.holidays (id, office_id, holiday_date, name, rule, is_active)
values
  ('99999999-9999-9999-9999-999999999991', '11111111-1111-1111-1111-111111111111', '2026-02-12', 'Makha Bucha (Closed)', 'CLOSED', true),
  ('99999999-9999-9999-9999-999999999992', '11111111-1111-1111-1111-111111111111', '2026-02-13', 'Company Event (Warning)', 'WARNING', true);

-- Bookings (stored as timestamptz; values below are Asia/Bangkok)
insert into codesk.bookings (
  id, office_id, department_id, employee_id, seat_id,
  booking_type, status, start_at, end_at, created_at, updated_at
) values
  ('f0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
   'SINGLE_DAY', 'CONFIRMED', '2026-02-10 09:00:00+07', '2026-02-10 12:00:00+07', now(), now()),
  ('f0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
   'SINGLE_DAY', 'CONFIRMED', '2026-02-10 12:00:00+07', '2026-02-10 15:00:00+07', now(), now()),
  ('f0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
   'SINGLE_DAY', 'CONFIRMED', '2026-02-10 09:00:00+07', '2026-02-10 12:00:00+07', now(), now()),

  ('f0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', null,
   'SINGLE_DAY', 'CONFIRMED', '2026-02-10 09:00:00+07', '2026-02-10 12:00:00+07', now(), now()),
  ('f0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', null,
   'SINGLE_DAY', 'CONFIRMED', '2026-02-10 09:30:00+07', '2026-02-10 11:30:00+07', now(), now()),
  ('f0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', null,
   'SINGLE_DAY', 'CONFIRMED', '2026-02-10 13:00:00+07', '2026-02-10 15:00:00+07', now(), now()),

  ('f0000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', null,
   'DATE_RANGE', 'CONFIRMED', '2026-02-13 09:00:00+07', '2026-02-14 18:00:00+07', now(), now());

-- Example conflict (should fail due to exclusion constraint)
-- insert into codesk.bookings (
--   office_id, department_id, employee_id, seat_id, booking_type, status, start_at, end_at
-- ) values (
--   '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
--   'SINGLE_DAY', 'CONFIRMED', '2026-02-10 11:00:00+07', '2026-02-10 13:00:00+07'
-- );
