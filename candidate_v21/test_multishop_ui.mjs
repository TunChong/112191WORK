import fs from 'node:fs';
import assert from 'node:assert/strict';
const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
const backend=fs.readFileSync(new URL('./supabase/functions/manage-shops/index.ts',import.meta.url),'utf8');
const isolation=fs.readFileSync(new URL('./supabase/migrations/20261115_v3_PHASE2_ISOLATION_STAGING_ONLY.sql',import.meta.url),'utf8');

const start=app.indexOf('function shopLabel(s)');
const end=app.indexOf('function accountView(){',start);
assert.ok(start>0&&end>start,'Shop view must exist');
const fn=new Function('state','supervisor','admin','empty','esc','ic',app.slice(start,end)+';return shopsView();');
const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const state={
  shopId:'11111111-1111-4111-8111-111111111111',shopReady:true,shopSearch:'',
  shops:[{id:'11111111-1111-4111-8111-111111111111',shop_code:'97',shop_name:'ĐMX 102 LÊ VĂN KHƯƠNG',active:true,is_primary:true}],
  shopMembers:[{user_id:'22222222-2222-4222-8222-222222222222',shop_role:'staff',active:true,profile:{employee_code:'257406',full_name:'Nhân viên Demo'}}],
  shopMemberLoading:false,oneTimeCredential:null
};
const render=(admin,ready=true)=>{state.shopReady=ready;return fn(state,()=>true,()=>admin,()=>'<p>Không có quyền</p>',esc,()=>'<i></i>');};
const managerHTML=render(false);
assert.match(managerHTML,/newShopStaffForm/,'Shop manager can add staff');
assert.doesNotMatch(managerHTML,/newShopForm/,'Shop manager cannot create shops');
assert.doesNotMatch(managerHTML,/grantShopManagerForm/,'Shop manager cannot grant manager role');
assert.match(managerHTML,/Nhân viên Demo/);
const adminHTML=render(true);
assert.match(adminHTML,/newShopForm/);
assert.match(adminHTML,/grantShopManagerForm/);
assert.match(adminHTML,/select-shop/);
const waiting=render(true,false);
assert.match(waiting,/id="newShopForm"/);
assert.doesNotMatch(waiting,/id="newShopStaffForm"/);
assert.doesNotMatch(waiting,/id="grantShopManagerForm"/);
assert.match(waiting,/SHOP tạo mới chưa được giao việc/);
assert.match(backend,/if\(!await enabled\(\)\)return answer\(req,423/);
assert.match(backend,/if\(!isAdmin\)return answer\(req,403,\{error:'Chỉ Super Admin được tạo SHOP'/);
assert.match(backend,/if\(!managerFor\(shop\)\)return answer\(req,403/);
assert.match(isolation,/work_can_supervise_shop\(shop_id\)/);
assert.match(isolation,/work_is_shop_staff/);
assert.match(isolation,/work_evidence_read/);
assert.match(app,/shop_id:state\.shopId/);
assert.match(app,/data-action="navigate" data-screen="\$\{screen\}"/);
console.log('PASS: shop manager/admin UI, guarded mutations, tenant RLS and shop-scoped writes');

// Regression: exactly one of the two membership -> profiles foreign keys must be selected.
assert.match(app, /profile:profiles!work_shop_memberships_user_id_fkey\(/);
assert.match(app, /filter\(m=>m\.profile\)\.map\(m=>\(\{\.\.\.m\.profile/);
assert.doesNotMatch(app, /profiles\(id,employee_code,full_name/);
const css=fs.readFileSync(new URL('./styles.css',import.meta.url),'utf8');
assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(css, /\.login-wrap\{width:100%;max-width:100%;grid-template-columns:minmax\(0,1fr\)/);
console.log('PASS: explicit user_id foreign key and iPhone three-column login');

// Catalog CRUD is Super Admin-only and may operate before shop work isolation.
assert.match(app,/action:'update_shop'/);
assert.match(app,/action:'delete_shop'/);
assert.match(app,/data-action="shop-edit"/);
assert.match(app,/data-action="shop-delete"/);
assert.match(app,/id="newWarehouseCode"/);
assert.match(app,/id="newShopName"/);
assert.match(app,/id="newShopPreview"/);
assert.match(app,/shopLabel\(s\)/);
assert.match(backend,/if\(action==='update_shop'\)/);
assert.match(backend,/if\(action==='delete_shop'\)/);
assert.match(backend,/work_delete_shop_permanently/);
assert.doesNotMatch(backend,/data\.confirm_code!==targetShop\.shop_code/);
assert.doesNotMatch(backend,/archive_shop_has_history/);
assert.match(backend,/active:operational,created_by:actor\.id/);
assert.match(backend,/if\(!await enabled\(\)\)return answer\(req,423/);
console.log('PASS: MÃ KHO - TÊN SHOP catalog add/edit/archive controls');

assert.match(managerHTML, /name="shopRole"/);
assert.match(managerHTML, /option value="manager"/);
assert.match(managerHTML, /option value="shift_lead"/);
assert.match(managerHTML, /shop-member-set-role/);
assert.match(backend, /shop_role:shopRole/);
assert.match(backend, /if\(!managerFor\(shop\)\)/);
assert.match(app, /function accountsView\(\)\{\s*if\(!admin\(\)\)/);
assert.match(app, /generate_daily_tasks_for_shop/);
console.log('PASS: Admin accounts, SHOP manager role delegation, lead and staff forms');
