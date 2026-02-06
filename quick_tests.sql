-- Quick tests for codesk schema

-- 1) Seat conflict via RPC (should raise CONFLICT)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}', true);

do $$
begin
  begin
    perform codesk.create_booking(
      '44444444-4444-4444-4444-444444444444', -- employee
      '22222222-2222-2222-2222-222222222222', -- department (ASSIGNED)
      '11111111-1111-1111-1111-111111111111', -- office
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', -- seat ENG-A1
      'SINGLE_DAY',
      '2026-02-10 11:00:00+07',
      '2026-02-10 13:00:00+07'
    );
    raise exception 'EXPECTED_CONFLICT_NOT_RAISED';
  exception
    when others then
      if sqlerrm = 'CONFLICT' then
        raise notice 'Expected CONFLICT received';
      else
        raise;
      end if;
  end;
end $$;

-- 2) Over-capacity via RPC (should raise OVER_CAPACITY)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}', true);

do $$
begin
  begin
    perform codesk.create_booking(
      '66666666-6666-6666-6666-666666666666', -- employee
      '33333333-3333-3333-3333-333333333333', -- department (UNASSIGNED)
      '11111111-1111-1111-1111-111111111111', -- office
      null,
      'SINGLE_DAY',
      '2026-02-10 10:00:00+07',
      '2026-02-10 11:00:00+07'
    );
    raise exception 'EXPECTED_OVER_CAPACITY_NOT_RAISED';
  exception
    when others then
      if sqlerrm = 'OVER_CAPACITY' then
        raise notice 'Expected OVER_CAPACITY received';
      else
        raise;
      end if;
  end;
end $$;

-- 3) Views
select * from codesk.v_bookings_per_day order by local_date;
select * from codesk.v_utilization_by_department order by local_date;
select * from codesk.v_popular_seats order by local_date, seat_code;
select * from codesk.v_booking_status_summary order by local_date, status;
select * from codesk.v_peak_times order by local_date, slot_start_local limit 50;
