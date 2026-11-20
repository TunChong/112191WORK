begin;

create schema qlst_checklist_private;
revoke all on schema qlst_checklist_private from public, anon, authenticated;
grant usage on schema qlst_checklist_private to authenticated;

-- Keep history independent of legacy shop/account deletion or role changes.
-- All writes below validate the current membership in Companion MWG.
create table public.qlst_checklist_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  work_day date not null,
  daily_key smallint check (daily_key between 1 and 8),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  due_at timestamptz not null check (isfinite(due_at)),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  remind_minutes integer not null default 60 check (remind_minutes between 0 and 1440),
  assigned_to uuid,
  assigned_name text,
  assigned_code text,
  created_at timestamptz not null default clock_timestamp(),
  created_by uuid,
  created_name text not null,
  created_code text,
  completed_at timestamptz,
  completed_by uuid,
  completed_name text,
  completed_code text,
  completed_role text check (completed_role in ('manager','shift_lead')),
  completed_late boolean generated always as (completed_at > due_at) stored,
  revision integer not null default 1 check (revision > 0),
  unique (shop_id, work_day, daily_key),
  check (
    (completed_at is null and completed_by is null and completed_name is null and completed_role is null)
    or
    (completed_at is not null and completed_by is not null and completed_name is not null and completed_role is not null)
  )
);
create index qlst_checklist_pending on public.qlst_checklist_items (shop_id, due_at, id)
  where completed_at is null;
create index qlst_checklist_history on public.qlst_checklist_items (shop_id, completed_at desc, id)
  where completed_at is not null;

create table qlst_checklist_private.days (
  shop_id uuid primary key,
  last_seeded date not null
);
create table qlst_checklist_private.daily_overrides (
  shop_id uuid not null,
  daily_key smallint not null check (daily_key between 1 and 8),
  local_due time not null,
  priority text not null check (priority in ('low','normal','high')),
  remind_minutes integer not null check (remind_minutes between 0 and 1440),
  primary key (shop_id, daily_key)
);
create table qlst_checklist_private.reminder_receipts (
  item_id uuid not null references public.qlst_checklist_items (id) on delete cascade,
  user_id uuid not null,
  due_at timestamptz not null,
  remind_minutes integer not null,
  shown_at timestamptz not null default clock_timestamp(),
  primary key (item_id, user_id, due_at, remind_minutes)
);

-- The existing supervise policy includes global administrators. This tool
-- requires a manager or shift_lead membership in the selected shop itself.
create function qlst_checklist_private.members(p_shop_id uuid)
returns table (user_id uuid, shop_role text, full_name text, employee_code text)
language sql stable set search_path = '' as $$
  select m.user_id, m.shop_role, p.full_name, p.employee_code
    from public.work_shop_memberships m
    join public.work_shops s on s.id = m.shop_id
    join public.profiles p on p.id = m.user_id
   where m.shop_id = p_shop_id and m.active and s.active and p.active
     and not p.must_change_password and m.shop_role in ('manager','shift_lead')
$$;
create function qlst_checklist_private.can_access(p_shop_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from qlst_checklist_private.members(p_shop_id) m
    where m.user_id = (select auth.uid())
  )
$$;
create function qlst_checklist_private.actor(p_shop_id uuid)
returns table (user_id uuid, shop_role text, full_name text, employee_code text)
language plpgsql stable set search_path = '' as $$
begin
  return query select m.* from qlst_checklist_private.members(p_shop_id) m
    where m.user_id = (select auth.uid());
  if not found then
    raise exception 'Checklist yêu cầu quyền QLST hoặc TC tại siêu thị này.' using errcode = '42501';
  end if;
end;
$$;

alter table public.qlst_checklist_items enable row level security;
alter table qlst_checklist_private.days enable row level security;
alter table qlst_checklist_private.daily_overrides enable row level security;
alter table qlst_checklist_private.reminder_receipts enable row level security;
revoke all on public.qlst_checklist_items from public, anon, authenticated;
revoke all on all tables in schema qlst_checklist_private from public, anon, authenticated;
grant select on public.qlst_checklist_items to authenticated;
create policy qlst_checklist_read on public.qlst_checklist_items
  for select to authenticated using (qlst_checklist_private.can_access(shop_id));

create function qlst_checklist_private.open_shop(p_shop_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (clock_timestamp() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_last date;
begin
  perform 1 from qlst_checklist_private.actor(p_shop_id);
  insert into qlst_checklist_private.days (shop_id, last_seeded)
    values (p_shop_id, v_today - 1) on conflict (shop_id) do nothing;
  select last_seeded into v_last from qlst_checklist_private.days
    where shop_id = p_shop_id for update;

  if v_last < v_today then
    insert into public.qlst_checklist_items
      (shop_id, work_day, daily_key, title, due_at, priority, remind_minutes, created_name)
    select p_shop_id, day.start_at::date, preset.key, preset.title,
      (day.start_at::date + coalesce(o.local_due, preset.local_due)) at time zone 'Asia/Ho_Chi_Minh',
      coalesce(o.priority, preset.priority), coalesce(o.remind_minutes, 60), 'Công việc mặc định'
    from generate_series((v_last + 1)::timestamp, v_today::timestamp, interval '1 day') day(start_at)
    cross join (values
      (1, 'Công việc siêu thị', time '10:00', 'normal'),
      (2, 'Báo cáo hình ảnh đầu ngày', time '09:00', 'high'),
      (3, 'Check Mail Nội Bộ', time '09:30', 'normal'),
      (4, 'Kiểm tra nhân sự và phân ca', time '10:30', 'high'),
      (5, 'Kiểm tra doanh thu', time '12:00', 'normal'),
      (6, 'Kiểm tra trưng bày, bảng giá', time '13:30', 'normal'),
      (7, 'Kiểm tra hàng hóa và tồn kho', time '16:00', 'normal'),
      (8, 'Báo cáo cuối ngày', time '21:00', 'high')
    ) preset(key, title, local_due, priority)
    left join qlst_checklist_private.daily_overrides o
      on o.shop_id = p_shop_id and o.daily_key = preset.key
    on conflict (shop_id, work_day, daily_key) do nothing;
    update qlst_checklist_private.days set last_seeded = v_today where shop_id = p_shop_id;
  end if;

  return jsonb_build_object(
    'day', v_today, 'server_now', clock_timestamp(),
    'members', coalesce((select jsonb_agg(to_jsonb(m) order by m.full_name, m.user_id)
                        from qlst_checklist_private.members(p_shop_id) m), '[]'::jsonb)
  );
end;
$$;

create function qlst_checklist_private.save_item(
  p_shop_id uuid, p_id uuid, p_expected_revision integer, p_title text, p_due_at timestamptz,
  p_priority text, p_remind_minutes integer, p_assigned_to uuid, p_apply_future boolean
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor record;
  v_item public.qlst_checklist_items;
  v_assigned_name text;
  v_assigned_code text;
begin
  select * into v_actor from qlst_checklist_private.actor(p_shop_id);
  if p_id is null or nullif(btrim(p_title), '') is null or char_length(btrim(p_title)) > 160
     or p_due_at is null or not isfinite(p_due_at)
     or p_priority is null or p_priority not in ('low','normal','high')
     or p_remind_minutes is null or p_remind_minutes not between 0 and 1440 then
    raise exception 'Tiêu đề, thời hạn, mức ưu tiên hoặc số phút nhắc không hợp lệ.' using errcode = '22023';
  end if;
  if p_expected_revision is not null then
    select * into v_item from public.qlst_checklist_items
      where id = p_id and shop_id = p_shop_id for update;
    if not found then
      raise exception 'Công việc không còn trong siêu thị này.' using errcode = 'P0002';
    end if;
    if v_item.completed_at is not null or v_item.revision <> p_expected_revision then
      return jsonb_build_object('status','conflict','item',to_jsonb(v_item));
    end if;
  end if;
  if p_assigned_to is not null then
    select m.full_name, m.employee_code into v_assigned_name, v_assigned_code
      from qlst_checklist_private.members(p_shop_id) m where m.user_id = p_assigned_to;
    if not found then
      raise exception 'Người phụ trách phải là QLST hoặc TC đang hoạt động ở siêu thị này.' using errcode = '22023';
    end if;
  end if;

  if p_expected_revision is null then
    insert into public.qlst_checklist_items
      (id, shop_id, work_day, title, due_at, priority, remind_minutes,
       assigned_to, assigned_name, assigned_code, created_by, created_name, created_code)
    values
      (p_id, p_shop_id, (p_due_at at time zone 'Asia/Ho_Chi_Minh')::date, btrim(p_title), p_due_at,
       p_priority, p_remind_minutes, p_assigned_to, v_assigned_name, v_assigned_code,
       v_actor.user_id, v_actor.full_name, v_actor.employee_code)
    on conflict (id) do nothing returning * into v_item;
    if not found then
      select * into v_item from public.qlst_checklist_items
        where id = p_id and shop_id = p_shop_id and created_by = v_actor.user_id;
      if not found then
        raise exception 'Không thể lưu yêu cầu này. Vui lòng tạo lại công việc.' using errcode = '23505';
      end if;
    end if;
  else
    update public.qlst_checklist_items
      set title = case when daily_key is null then btrim(p_title) else title end,
          due_at = p_due_at, priority = p_priority, remind_minutes = p_remind_minutes,
          assigned_to = p_assigned_to, assigned_name = v_assigned_name, assigned_code = v_assigned_code,
          revision = revision + 1
      where id = p_id and shop_id = p_shop_id returning * into v_item;
    if p_apply_future and v_item.daily_key is not null then
      insert into qlst_checklist_private.daily_overrides (shop_id,daily_key,local_due,priority,remind_minutes)
      values (p_shop_id,v_item.daily_key,(p_due_at at time zone 'Asia/Ho_Chi_Minh')::time,p_priority,p_remind_minutes)
      on conflict (shop_id,daily_key) do update
        set local_due = excluded.local_due, priority = excluded.priority, remind_minutes = excluded.remind_minutes;
    end if;
  end if;
  return jsonb_build_object('status','saved','item',to_jsonb(v_item));
end;
$$;

create function qlst_checklist_private.finish_item(p_shop_id uuid, p_id uuid, p_expected_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor record;
  v_item public.qlst_checklist_items;
begin
  select * into v_actor from qlst_checklist_private.actor(p_shop_id);
  select * into v_item from public.qlst_checklist_items
    where id = p_id and shop_id = p_shop_id for update;
  if not found then
    raise exception 'Công việc không còn trong siêu thị này.' using errcode = 'P0002';
  end if;
  if v_item.completed_at is not null then
    return jsonb_build_object('status','already_completed','item',to_jsonb(v_item));
  end if;
  if v_item.revision is distinct from p_expected_revision then
    return jsonb_build_object('status','conflict','item',to_jsonb(v_item));
  end if;
  update public.qlst_checklist_items
    set completed_at = clock_timestamp(), completed_by = v_actor.user_id, completed_name = v_actor.full_name,
        completed_code = v_actor.employee_code, completed_role = v_actor.shop_role, revision = revision + 1
    where id = p_id and shop_id = p_shop_id returning * into v_item;
  return jsonb_build_object('status','completed','item',to_jsonb(v_item));
end;
$$;

create function qlst_checklist_private.claim_due(p_shop_id uuid, p_ids uuid[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_user uuid;
  v_result jsonb;
begin
  select a.user_id into v_user from qlst_checklist_private.actor(p_shop_id) a;
  with ready as (
    select i.id, i.title, i.due_at, i.remind_minutes
      from public.qlst_checklist_items i
     where i.shop_id = p_shop_id and i.id = any(p_ids) and i.completed_at is null and i.remind_minutes > 0
       and i.due_at > v_now and i.due_at <= v_now + interval '1 day'
       and i.due_at <= v_now + make_interval(mins => i.remind_minutes)
       and not exists (
         select 1 from qlst_checklist_private.reminder_receipts r
          where r.item_id = i.id and r.user_id = v_user
            and r.due_at = i.due_at and r.remind_minutes = i.remind_minutes
       )
     order by i.due_at, i.id
     for update of i
  ), claimed as (
    insert into qlst_checklist_private.reminder_receipts (item_id,user_id,due_at,remind_minutes)
      select id,v_user,due_at,remind_minutes from ready
      on conflict do nothing returning item_id
  )
  select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'due_at',r.due_at) order by r.due_at,r.id),'[]'::jsonb)
    into v_result from ready r join claimed c on c.item_id = r.id;
  return v_result;
end;
$$;

-- PostgREST exposes these invoker wrappers. The private functions validate
-- auth.uid() and current membership before crossing the write privilege boundary.
create function public.qlst_checklist_open(p_shop_id uuid)
returns jsonb language sql set search_path = '' as $$
  select qlst_checklist_private.open_shop($1)
$$;
create function public.qlst_checklist_save(
  p_shop_id uuid, p_id uuid, p_expected_revision integer, p_title text, p_due_at timestamptz,
  p_priority text, p_remind_minutes integer, p_assigned_to uuid, p_apply_future boolean
)
returns jsonb language sql set search_path = '' as $$
  select qlst_checklist_private.save_item($1,$2,$3,$4,$5,$6,$7,$8,$9)
$$;
create function public.qlst_checklist_finish(p_shop_id uuid, p_id uuid, p_expected_revision integer)
returns jsonb language sql set search_path = '' as $$
  select qlst_checklist_private.finish_item($1,$2,$3)
$$;
create function public.qlst_checklist_claim_due(p_shop_id uuid, p_ids uuid[])
returns jsonb language sql set search_path = '' as $$
  select qlst_checklist_private.claim_due($1,$2)
$$;

revoke execute on all functions in schema qlst_checklist_private from public, anon, authenticated;
grant execute on function
  qlst_checklist_private.can_access(uuid),
  qlst_checklist_private.open_shop(uuid),
  qlst_checklist_private.save_item(uuid,uuid,integer,text,timestamptz,text,integer,uuid,boolean),
  qlst_checklist_private.finish_item(uuid,uuid,integer),
  qlst_checklist_private.claim_due(uuid,uuid[]) to authenticated;
revoke all on function
  public.qlst_checklist_open(uuid),
  public.qlst_checklist_save(uuid,uuid,integer,text,timestamptz,text,integer,uuid,boolean),
  public.qlst_checklist_finish(uuid,uuid,integer),
  public.qlst_checklist_claim_due(uuid,uuid[]) from public, anon, authenticated;
grant execute on function
  public.qlst_checklist_open(uuid),
  public.qlst_checklist_save(uuid,uuid,integer,text,timestamptz,text,integer,uuid,boolean),
  public.qlst_checklist_finish(uuid,uuid,integer),
  public.qlst_checklist_claim_due(uuid,uuid[]) to authenticated;

alter publication supabase_realtime add table public.qlst_checklist_items;
notify pgrst, 'reload schema';
commit;
