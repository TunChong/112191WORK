import {PGlite} from '@electric-sql/pglite';
import {readFile, readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';

export const shops = {
  a: {id:'aaaaaaaa-0000-4000-8000-000000000001',shop_code:'SHOP-A',shop_name:'Siêu thị A',active:true},
  b: {id:'bbbbbbbb-0000-4000-8000-000000000002',shop_code:'SHOP-B',shop_name:'Siêu thị B',active:true},
  inactive: {id:'cccccccc-0000-4000-8000-000000000003',shop_code:'SHOP-C',shop_name:'Siêu thị đã ngưng',active:false},
};
const member = (number, name, assignments, options={}) => ({
  id:'10000000-0000-4000-8000-'+String(number).padStart(12,'0'),
  employee_code:String(number),full_name:name,role:Object.values(assignments)[0]||'manager',
  active:true,must_change_password:false,is_admin:false,assignments,...options,
});
export const users = {
  manager: member(70001,'Quản lý A', {a:'manager'}),
  lead: member(70002,'Trưởng ca A', {a:'shift_lead'}),
  staff: member(70003,'Nhân viên A', {a:'staff'}),
  other: member(70004,'Quản lý B', {b:'manager'}),
  multi: member(70005,'Quản lý nhiều SHOP', {a:'manager',b:'shift_lead'}),
  admin: member(70006,'Quản trị chưa được cấp SHOP', {}, {is_admin:true}),
  expired: member(70007,'Tài khoản ngưng hoạt động', {a:'manager'}, {active:false}),
  password: member(70008,'Tài khoản cần đổi mật khẩu', {a:'shift_lead'}, {must_change_password:true}),
  inactive: member(70009,'Quản lý SHOP ngưng', {inactive:'manager'}),
  revoked: member(70010,'Quản lý membership ngưng', {a:'manager'}, {membershipActive:false}),
};

export const rpcArguments = {
  qlst_checklist_open: ['p_shop_id'],
  qlst_checklist_save: [
    'p_shop_id','p_id','p_expected_revision','p_title','p_due_at','p_priority','p_remind_minutes','p_assigned_to','p_apply_future'
  ],
  qlst_checklist_finish: ['p_shop_id','p_id','p_expected_revision'],
  qlst_checklist_claim_due: ['p_shop_id','p_ids'],
};

export const TABLE = 'public.qlst_checklist_items';
const fixture = `
create role anon;
create role authenticated;
create schema auth;
create function auth.uid() returns uuid
  language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
grant usage on schema auth to anon, authenticated;

create table public.profiles (
 id uuid primary key, full_name text not null, employee_code text, role text not null,
 active boolean not null, must_change_password boolean not null, is_admin boolean not null
);
create table public.work_shops (
 id uuid primary key, shop_code text not null unique, shop_name text not null, active boolean not null
);
create table public.work_shop_memberships (
 shop_id uuid references public.work_shops(id), user_id uuid references public.profiles(id),
 shop_role text not null check(shop_role in ('manager','shift_lead','staff')), active boolean not null,
 primary key(shop_id,user_id)
);
create publication supabase_realtime;
alter table public.profiles enable row level security;
alter table public.work_shops enable row level security;
alter table public.work_shop_memberships enable row level security;
`;

export async function startDatabase() {
  const url = new URL('../../../supabase/migrations/', import.meta.url);
  const names = (await readdir(url)).filter(name => name.endsWith('_qlst_checklist.sql'));
  if (names.length !== 1) throw Error('A single Checklist migration is required');
  const db = new PGlite();
  await db.exec(fixture);
  for (const shop of Object.values(shops)) {
    await db.query('insert into public.work_shops values ($1,$2,$3,$4)', [shop.id,shop.shop_code,shop.shop_name,shop.active]);
  }
  for (const u of Object.values(users)) {
    await db.query('insert into public.profiles values ($1,$2,$3,$4,$5,$6,$7)',
      [u.id,u.full_name,u.employee_code,u.role,u.active,u.must_change_password,u.is_admin]);
    for (const [shop, role] of Object.entries(u.assignments)) {
      await db.query('insert into public.work_shop_memberships values ($1,$2,$3,$4)',
        [shops[shop].id,u.id,role,u.membershipActive??true]);
    }
  }
  await db.exec(await readFile(new URL(names[0],url),'utf8'));
  const as = (user, query, parameters = []) => db.transaction(async tx => {
    if (user) {
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user.id]);
      await tx.exec('set local role authenticated');
    } else await tx.exec('set local role anon');
    return (await tx.query(query, parameters)).rows;
  });
  const rpc = async (user, name, body) => {
    const args = rpcArguments[name];
    if (!args) throw Error('Unknown RPC');
    const parameters = args.map(arg => body[arg]??null);
    const slots = parameters.map((_, index) => '$'+(index+1)).join(',');
    return (await as(user, `select public.${name}(${slots}) as result`, parameters))[0].result;
  };
  return {db, as, rpc, migration: names[0]};
}

export const fixtureItem = (options={}) => ({
  p_shop_id: shops.a.id, p_id: randomUUID(), p_expected_revision: null,
  p_title:'Kiểm tra trưng bày', p_due_at:new Date(Date.now()+60*60_000).toISOString(),
  p_priority:'normal', p_remind_minutes:60, p_assigned_to:null, p_apply_future:false,
  ...options,
});
