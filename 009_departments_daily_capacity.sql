alter table codesk.departments
  add column if not exists departments integer;

comment on column codesk.departments.daily_capacity is 'Optional per-day capacity override; when null fall back to count of active & bookable seats';

-- ensure non-negative when provided
alter table codesk.departments
  add constraint departments_daily_capacity_nonneg check (daily_capacity is null or daily_capacity >= 0);
