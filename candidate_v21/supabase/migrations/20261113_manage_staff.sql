-- 112191 WORK v2.1. Apply only after inspecting the CURRENT production schema/RLS.
-- No plaintext passwords, hashes, secret keys, or sessions are stored here.
create table if not exists public.staff_account_audit (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id) on delete set null,
 target_user_id uuid references auth.users(id) on delete set null,
 employee_code text not null,
 action text not null check(action in('created','activated','deactivated','password_reset')),
 created_at timestamptz not null default now()
);
alter table public.staff_account_audit enable row level security;
revoke all on public.staff_account_audit from anon, authenticated;
alter table public.profiles add column if not exists password_changed_at timestamptz;

-- Record only that the Auth password hash changed, without ever copying the hash.
create or replace function public.track_staff_password_change()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.encrypted_password is distinct from old.encrypted_password then
   update public.profiles set password_changed_at=now() where id=new.id;
 end if;
 return new;
end;
$$;
revoke all on function public.track_staff_password_change() from public,anon,authenticated;
drop trigger if exists trg_track_staff_password_change on auth.users;
create trigger trg_track_staff_password_change after update of encrypted_password on auth.users
for each row execute function public.track_staff_password_change();

-- Verify tasks.category/recurring_templates.category constraints before
-- permitting the new 'Công Việc Siêu Thị' choice; never drop an existing constraint blindly.
-- Verify profiles RLS forbids staff updates to role, active, must_change_password.
