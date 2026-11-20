import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {startDatabase,shops,users,TABLE,fixtureItem} from './database.mjs';

const {db,as,rpc,migration} = await startDatabase();
const {manager,lead,staff,other,multi} = users;
const a = shops.a.id, b = shops.b.id;
const failed = error => error.code === '42501';
const open = (user, shop=a) => rpc(user,'qlst_checklist_open',{p_shop_id:shop});
const save = (user, obj) => rpc(user,'qlst_checklist_save',obj);
const finish = (user, shop, row, version=row.revision) =>
  rpc(user,'qlst_checklist_finish',{p_shop_id:shop,p_id:row.id,p_expected_revision:version});
const claim = (user, shop, ids) =>
  rpc(user,'qlst_checklist_claim_due',{p_shop_id:shop,p_ids:ids});
const rows = (user, shop=a) =>
  as(user,`select to_jsonb(i) as record from ${TABLE} i where shop_id=$1 order by daily_key,id`,[shop]).then(r=>r.map(x=>x.record));

const results = [];
async function test(name, run) {
  try { await run(); results.push({name,result:'PASS'}); }
  catch (error) { results.push({name,result:'FAIL',error:error.message}); }
}
await test('QLST và TC cùng mở chỉ sinh 8 mẫu một lần cho mỗi SHOP/ngày', async () => {
  const [one,two] = await Promise.all([open(manager), open(lead)]);
  assert.equal(one.day,two.day);
  assert.equal(one.members.length,3);
  assert.equal((await rows(lead)).length,8);
  assert.ok((await rows(manager)).find(row=>row.title==='Check Mail Nội Bộ'));
  await open(other,b);
  assert.equal((await rows(other,b)).length,8);
});
await test('Nhân viên thường không thấy dòng nào và không gọi được RPC checklist', async () => {
  assert.equal((await as(staff,`select id from ${TABLE}`)).length,0);
  await assert.rejects(open(staff),failed);
  await assert.rejects(save(staff,fixtureItem()),failed);
  let [row] = await rows(manager);
  await assert.rejects(finish(staff,a,row),failed);
  await assert.rejects(claim(staff,a,[row.id]),failed);
});
await test('Ngoài SHOP, admin thiếu membership, tài khoản ngưng hoặc đổi mật khẩu bị chặn', async () => {
  for (const u of [other, users.admin, users.expired, users.password, users.revoked]) {
    assert.equal((await rows(u,a)).length,0);
    await assert.rejects(open(u,a),failed);
  }
  assert.equal((await rows(users.inactive,shops.inactive.id)).length,0);
  await assert.rejects(open(users.inactive,shops.inactive.id),failed);
  const [row] = await rows(manager);
  await assert.rejects(finish(other,b,row),error=>error.code==='P0002');
});
await test('Chưa đăng nhập không đọc bảng hoặc trực tiếp gọi các RPC', async () => {
  await assert.rejects(as(null,`select id from ${TABLE}`),failed);
  await assert.rejects(open(null),failed);
  await assert.rejects(save(null,fixtureItem()),failed);
});
await test('Người được cấp hai SHOP chỉ thấy dữ liệu trong phạm vi cả hai SHOP hợp lệ', async () => {
  assert.equal((await rows(multi,a)).length,8);
  assert.equal((await rows(multi,b)).length,8);
  await assert.rejects(open(multi,shops.inactive.id),failed);
});
await test('QLST tạo, TC hoàn tất và cả hai xem đúng người, giờ và vai trò trong lịch sử', async () => {
  const input=fixtureItem({p_assigned_to:lead.id,p_remind_minutes:35});
  const [first,second] = await Promise.all([save(manager,input),save(manager,input)]);
  assert.equal(first.item.id,second.item.id);
  const completed = (await finish(lead,a,first.item)).item;
  assert.equal(completed.created_by,manager.id);
  assert.equal(completed.assigned_to,lead.id);
  assert.equal(completed.completed_by,lead.id);
  assert.equal(completed.completed_name,lead.full_name);
  assert.equal(completed.completed_code,lead.employee_code);
  assert.equal(completed.completed_role,'shift_lead');
  assert.equal(completed.completed_late,false);
  assert.ok(Math.abs(Date.parse(completed.completed_at)-Date.now())<30_000);
  assert.deepEqual((await rows(manager)).find(row=>row.id===completed.id),completed);
});
await test('Hai lần cùng hoàn tất chỉ ghi người thắng, giữ nguyên dấu thời gian', async () => {
  const {item} = await save(manager,fixtureItem());
  const actions = await Promise.all([finish(lead,a,item),finish(manager,a,item)]);
  assert.deepEqual(actions.map(r=>r.status).sort(),['already_completed','completed']);
  assert.deepEqual(actions[0].item,actions[1].item);
  const winner = actions.findIndex(r=>r.status==='completed')===0?lead:manager;
  assert.equal(actions[0].item.completed_by,winner.id);
});
await test('Hai lần cùng sửa: chỉ một lần thắng; hoàn tất dùng phiên bản cũ báo xung đột', async () => {
  const input = fixtureItem();
  const {item} = await save(manager,input);
  const stale = {...input,p_expected_revision:item.revision};
  const changes = await Promise.all([
    save(manager,{...stale,p_priority:'high',p_remind_minutes:39}),
    save(lead,{...stale,p_priority:'low',p_remind_minutes:15}),
  ]);
  assert.deepEqual(changes.map(r=>r.status).sort(),['conflict','saved']);
  assert.deepEqual(changes[0].item,changes[1].item);
  assert.equal((await finish(lead,a,item)).status,'conflict');
  assert.equal((await finish(lead,a,changes[0].item)).status,'completed');
  assert.equal((await save(manager,{...stale,p_expected_revision:3})).status,'conflict');
});
await test('Không thể gán người thuộc SHOP khác, spoof người hoàn tất hoặc ghi thẳng vào bảng', async () => {
  await assert.rejects(save(manager,fixtureItem({p_assigned_to:other.id})),error=>error.code==='22023');
  await assert.rejects(save(manager,fixtureItem({p_assigned_to:staff.id})),error=>error.code==='22023');
  const {item} = await save(manager,fixtureItem());
  await assert.rejects(as(manager,`update ${TABLE} set completed_by=$1 where id=$2`,[lead.id,item.id]),failed);
  await assert.rejects(as(lead,`delete from ${TABLE} where id=$1`,[item.id]),failed);
});
await test('Quá hạn chuyển sang Hoàn tất trễ và còn bản ghi trước đó', async () => {
  const {item} = await save(lead,fixtureItem({p_due_at:new Date(Date.now()-20*60_000).toISOString()}));
  assert.equal(item.completed_at,null);
  const {item:completed} = await finish(manager,a,item);
  assert.equal(completed.completed_late,true);
  assert.ok((await rows(lead)).find(row=>row.id===completed.id&&row.completed_late));
});
await test('Nhắc 60 phút theo SHOP, mỗi người nhận một lần; đã xong và tắt nhắc bị bỏ qua', async () => {
  const near = new Date(Date.now()+30*60_000).toISOString();
  const {item} = await save(manager,fixtureItem({p_due_at:near}));
  const {item:off} = await save(manager,fixtureItem({p_due_at:near,p_remind_minutes:0}));
  const {item:done} = await save(manager,fixtureItem({p_due_at:near}));
  const {item:later} = await save(manager,fixtureItem({p_due_at:new Date(Date.now()+170*60_000).toISOString()}));
  await finish(lead,a,done);
  const ids = [item.id,off.id,done.id,later.id];
  const checks = await Promise.all([
    claim(manager,a,ids),claim(manager,a,ids),claim(lead,a,ids),claim(other,b,ids),
  ]);
  assert.deepEqual(checks[0].map(r=>r.id),[item.id]);
  assert.deepEqual(checks[1],[]);
  assert.deepEqual(checks[2].map(r=>r.id),[item.id]);
  assert.deepEqual(checks[3],[]);
  await finish(lead,a,item);
  assert.deepEqual(await claim(multi,a,[item.id]),[]);
});
await test('Ngày mới giữ lịch sử và quá hạn, sinh đủ ngày bỏ lỡ và áp dụng giờ của SHOP', async () => {
  const [preset] = await rows(manager);
  await save(lead,fixtureItem({
    p_id:preset.id,p_expected_revision:preset.revision,p_title:preset.title,
    p_due_at:'2026-11-20T09:42:00+07:00',p_priority:'high',p_remind_minutes:31,p_apply_future:true,
  }));
  await db.query(`update ${TABLE} set work_day=work_day-2,due_at=due_at-interval '2 days' where shop_id=$1 and daily_key is not null`,[a]);
  await db.query('update qlst_checklist_private.days set last_seeded=last_seeded-2 where shop_id=$1',[a]);
  await Promise.all([open(lead),open(manager)]);
  const all = await rows(lead);
  const defaultRows = all.filter(row=>row.daily_key!==null);
  assert.equal(defaultRows.length,24);
  assert.equal(new Set(defaultRows.map(row=>row.work_day+'-'+row.daily_key)).size,24);
  assert.ok(defaultRows.find(row=> row.id===preset.id&&Date.parse(row.due_at)<Date.now()));
  assert.ok(all.find(row=>row.completed_at));
  const recent = defaultRows.filter(row=>row.daily_key===preset.daily_key&&row.id!==preset.id);
  assert.ok(recent.every(row=>row.priority==='high'&&row.remind_minutes===31&&row.due_at.includes('02:42')));
});
await test('Publication và RLS của checklist được bật, không nới quyền trực tiếp', async () => {
  const data = (await db.query(`select
    (select relrowsecurity from pg_class where oid='${TABLE}'::regclass) as rls,
    exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='qlst_checklist_items') as published,
    has_table_privilege('authenticated','${TABLE}','UPDATE') as writable,
    has_function_privilege('anon','public.qlst_checklist_open(uuid)','EXECUTE') as anon_open
  `)).rows[0];
  assert.deepEqual(data,{rls:true,published:true,writable:false,anon_open:false});
});

console.table(results);
const passed=results.filter(row=>row.result==='PASS').length;
await writeFile(new URL('../database-result.json',import.meta.url),
  JSON.stringify({migration,engine:(await db.query('select version()')).rows[0].version,pass:passed,fail:results.length-passed,results},null,2)+'\n');
await db.close();
if (passed!==results.length) process.exitCode=1;
