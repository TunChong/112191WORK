-- 112191 WORK v2.1 — Review against the actual Supabase project before applying.
-- Never store plaintext passwords, hashes, temporary passwords or sessions in public tables.
-- Avoid deleting profiles: work assignment history refers to existing staff user IDs.

create table if not exists public.staff_account_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  employee_code text not null,
  action text not null check (action in ('created', 'activated', 'deactivated', 'password_reset', 'updated')),
  created_at timestamptz not null default now()
);
alter table public.staff_account_audit enable row level security;
revoke all on public.staff_account_audit from anon, authenticated;
-- Backend service-role must be explicitly granted access on newly created tables.
grant select, insert on table public.staff_account_audit to service_role;
grant usage, select on sequence public.staff_account_audit_id_seq to service_role;

alter table public.profiles add column if not exists password_changed_at timestamptz;

-- Keep privileged trigger functions outside the API-exposed public schema.
create schema if not exists app_private;
revoke all on schema app_private from public;

create or replace function app_private.track_staff_password_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update public.profiles
      set password_changed_at = now()
      where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function app_private.track_staff_password_change() from public, anon, authenticated;
drop trigger if exists trg_track_staff_password_change on auth.users;
create trigger trg_track_staff_password_change
after update of encrypted_password on auth.users
for each row execute function app_private.track_staff_password_change();

-- The source v2.0 SQL was verified against the 2026-10-23 original ZIP.
-- profiles.role is checked to manager/staff; profiles must_change_password
-- is an existing boolean; tasks.category and recurring_templates.category
-- are unrestricted text (no category enum/check migration needed).
-- Defensive guard: no direct client may alter role, active, or the
-- first-login flag. Trusted service_role and the original SECURITY DEFINER
-- complete_initial_password RPC still work.
-- A trusted service_role API can still manage these fields.
create or replace function app_private.guard_profile_permissions()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated'
     and (
       new.role is distinct from old.role
       or new.active is distinct from old.active
       or new.must_change_password is distinct from old.must_change_password
     ) then
    raise exception 'Only server administration may change account privileges';
  end if;
  return new;
end;
$$;
revoke all on function app_private.guard_profile_permissions() from public, anon, authenticated;
drop trigger if exists trg_guard_profile_permissions on public.profiles;
create trigger trg_guard_profile_permissions
before update on public.profiles
for each row execute function app_private.guard_profile_permissions();

-- REQUIRED PRE-DEPLOY CHECKS on the real database:
-- 1. Inspect every profile RLS SELECT/UPDATE policy. Staff must never update
--    profiles.role, profiles.active, profiles.must_change_password via direct
--    REST requests. Preserve the existing complete_initial_password RPC flow.
-- 2. All task, assignment, notification and storage RLS policies must deny
--    inactive profiles; an Auth ban alone does not revoke existing JWTs.
-- 3. The verified v2.0 baseline has no category CHECK/ENUM. Check production
--    separately for changes made after deployment; never drop constraints blindly.
-- 4. Verify the existing managers' IDs against auth.users and profiles.
-- 5. Test manager vs staff permissions using separate test accounts.
