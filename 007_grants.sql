-- Grant permissions for authenticated role to use codesk schema, RPCs, and reporting views
-- Run as database owner/admin

grant usage on schema codesk to authenticated;

-- Base tables used by reporting views (RLS still enforces row visibility)
grant select on table codesk.bookings to authenticated;
grant select on table codesk.seats to authenticated;

-- Reporting views (GRANT uses the same syntax as tables)
grant select on codesk.v_bookings_per_day to authenticated;
grant select on codesk.v_utilization_by_department to authenticated;
grant select on codesk.v_popular_seats to authenticated;
grant select on codesk.v_booking_status_summary to authenticated;
grant select on codesk.v_peak_times to authenticated;

-- Sequences (if any)
grant usage, select on all sequences in schema codesk to authenticated;

-- RPCs
grant execute on function codesk.create_booking(
  uuid, uuid, uuid, uuid, codesk.booking_type, timestamptz, timestamptz
) to authenticated;

grant execute on function codesk.cancel_booking(uuid, text) to authenticated;

grant execute on function codesk.current_profile() to authenticated;

grant execute on function codesk.current_user_id() to authenticated;

grant execute on function codesk.current_employee_id() to authenticated;

grant execute on function codesk.current_department_id() to authenticated;

grant execute on function codesk.current_office_id() to authenticated;

grant execute on function codesk.current_role() to authenticated;

-- Default privileges for future objects in codesk
alter default privileges in schema codesk grant select on tables to authenticated;
alter default privileges in schema codesk grant usage, select on sequences to authenticated;
alter default privileges in schema codesk grant execute on functions to authenticated;
