-- Tighten profiles RLS: admin write only, non-admin can see own profile only
-- Run as database owner/admin

alter table codesk.profiles enable row level security;

drop policy if exists profiles_select_hr on codesk.profiles;
drop policy if exists profiles_select_admin on codesk.profiles;
drop policy if exists profiles_select_own on codesk.profiles;
drop policy if exists profiles_admin_write on codesk.profiles;

create policy profiles_select_own on codesk.profiles
for select
using (user_id = auth.uid());

create policy profiles_select_admin on codesk.profiles
for select
using (codesk.current_role() = 'admin');

create policy profiles_admin_insert on codesk.profiles
for insert
with check (codesk.current_role() = 'admin');

create policy profiles_admin_update on codesk.profiles
for update
using (codesk.current_role() = 'admin')
with check (codesk.current_role() = 'admin');

create policy profiles_admin_delete on codesk.profiles
for delete
using (codesk.current_role() = 'admin');

-- Grants required for admin user listing (RLS still applies)
grant select on codesk.profiles to authenticated;
grant select on codesk.employees to authenticated;
grant update, delete on codesk.profiles to authenticated;
