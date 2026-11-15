// 112191 WORK v3 multi-shop privileged control plane.
// IMPORTANT: all write actions remain LOCKED until work_multi_shop_config.isolation_ready=true.
// The flag may only be activated after *all* data/Storage/RPC/shop policies are tested.
const BASE = Deno.env.get('SUPABASE_URL') || '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') || '';
type Row = Record<string, any>;
type Body = Record<string, unknown>;
const SHOP_DOMAIN = '@112191work.pages.dev';
const validUUID = (x: unknown): x is string => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
const codeOK = (x: unknown) => typeof x === 'string' && /^[0-9]{4,8}$/.test(x);
const shopCodeOK = (x: unknown) => typeof x === 'string' && /^[A-Za-z0-9_-]{2,32}$/.test(x);
const originOK = (o: string) => /^https:\/\/([a-z0-9-]+\.)?112191work\.pages\.dev$/i.test(o);
function cors(origin: string) {
 return {'content-type':'application/json','cache-control':'no-store','vary':'Origin',
 'access-control-allow-origin':originOK(origin) ? origin : 'https://112191work.pages.dev',
 'access-control-allow-headers':'authorization,apikey,content-type',
 'access-control-allow-methods':'OPTIONS,POST'};
}
function answer(req: Request,status:number,data:Body) {return new Response(JSON.stringify(data),{status,headers:cors(req.headers.get('origin')||'')});}
async function api(path:string,opts:{method?:string;body?:unknown;token?:string;prefer?:string}={}):Promise<any> {
 const r=await fetch(BASE+path,{method:opts.method||'GET',
 headers:{apikey:opts.token?ANON:SERVICE,authorization:'Bearer '+(opts.token||SERVICE),
 'content-type':'application/json',...(opts.prefer?{Prefer:opts.prefer}:{})},
 ...(opts.body===undefined?{}:{body:JSON.stringify(opts.body)})});
 const raw=await r.text();let parsed:any;try{parsed=raw?JSON.parse(raw):null}catch{parsed=raw}
 if(!r.ok)throw new Error('Database/Auth operation rejected ('+r.status+')');
 return parsed;
}
const one = async(path:string)=>{const out=await api(path);return Array.isArray(out)?out[0]||null:null};
function newPassword() {
 const pool='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
 const bytes=crypto.getRandomValues(new Uint8Array(22));
 return 'W!'+Array.from(bytes,b=>pool[b%pool.length]).join('');
}
async function logAction(shop:string|null,actor:string,target:string|null,action:string) {
 await api('/rest/v1/work_shop_action_audit',{method:'POST',prefer:'return=minimal',
 body:{shop_id:shop,actor_id:actor,target_id:target,action}});
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors(req.headers.get('origin')||'')});
 if(req.method!=='POST')return answer(req,405,{error:'Chỉ hỗ trợ POST'});
 if(!BASE||!SERVICE||!ANON)return answer(req,503,{error:'Chưa cấu hình máy chủ'});
 try {
  const auth=req.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer '))return answer(req,401,{error:'Cần đăng nhập'});
  const signed=await api('/auth/v1/user',{token:auth.slice(7)});
  if(!validUUID(signed?.id))return answer(req,401,{error:'Phiên đăng nhập không hợp lệ'});
  const actor=await one('/rest/v1/profiles?id=eq.'+signed.id+'&select=id,employee_code,role,is_admin,active,must_change_password');
  if(!actor?.active||actor.must_change_password||!actor.employee_code)
    return answer(req,403,{error:'Tài khoản chưa được kích hoạt đầy đủ'});
  const isAdmin=actor.is_admin===true&&actor.employee_code==='112191'&&actor.role==='manager';
  let data:Body; try{data=await req.json() as Body}catch{return answer(req,400,{error:'Dữ liệu JSON không hợp lệ'})}
  const action=String(data.action||''),shop=String(data.shop_id||'');
  const page=Math.max(0,Math.min(10000,Number(data.page)||0)),limit=Math.max(1,Math.min(100,Number(data.limit)||50));
  const own=await api('/rest/v1/work_shop_memberships?select=shop_id,shop_role,active&user_id=eq.'+signed.id+'&active=eq.true&limit=1000');
  const managerFor=(shopID:string)=>isAdmin||own.some((x:Row)=>x.shop_id===shopID&&x.shop_role==='manager');
  const accessFor=(shopID:string)=>isAdmin||own.some((x:Row)=>x.shop_id===shopID);
  const enabled=async()=>{const state=await one('/rest/v1/work_multi_shop_config?key=eq.production&select=isolation_ready');
   return state?.isolation_ready===true};
  if(action==='status')return answer(req,200,{ready:await enabled(),super_admin:isAdmin,shop_count:own.length});
  if(action==='list_shops'){
   const all=isAdmin? await api('/rest/v1/work_shops?select=id,shop_code,shop_name,active&order=shop_code.asc&limit='+limit+'&offset='+(page*limit))
     : await api('/rest/v1/work_shops?select=id,shop_code,shop_name,active&id=in.('+own.map((x:Row)=>x.shop_id).filter(validUUID).join(',')+')&order=shop_code.asc&limit='+limit+'&offset='+(page*limit));
   const byShop=new Map(own.map((x:Row)=>[x.shop_id,x.shop_role]));
   return answer(req,200,{shops:all.map((s:Row)=>({...s,shop_role:isAdmin?'super_admin':byShop.get(s.id)||null})),page,limit});
  }
  if(!validUUID(shop))return answer(req,400,{error:'Thiếu mã SHOP hợp lệ'});
  const targetShop=await one('/rest/v1/work_shops?id=eq.'+shop+'&select=id,shop_code,shop_name,active');
  if(!targetShop)return answer(req,404,{error:'SHOP không tồn tại'});
  if(action==='list_members'){
   if(!managerFor(shop))return answer(req,403,{error:'Không được xem nhân sự của SHOP này'});
   const memberships=await api('/rest/v1/work_shop_memberships?select=user_id,shop_role,active,created_at&shop_id=eq.'+shop+'&order=created_at.asc&limit='+limit+'&offset='+(page*limit));
   const ids=memberships.map((m:Row)=>m.user_id).filter(validUUID);
   const profiles=ids.length ? await api('/rest/v1/profiles?select=id,employee_code,full_name,active,is_admin,must_change_password&id=in.('+ids.join(',')+')'):[];
   const byId=new Map(profiles.map((p:Row)=>[p.id,p]));
   return answer(req,200,{members:memberships.map((m:Row)=>({...m,profile:byId.get(m.user_id)||null})),page,limit});
  }
  // Legacy single-shop policies still grant global access to managers.
  // WRITE MUTATIONS MUST NOT RUN until the full isolation migration and secure frontend are live.
  if(!await enabled())return answer(req,423,{error:'Multi-SHOP đang chuẩn bị bảo mật; chưa bật thao tác quản lý SHOP'});
  if(!targetShop.active&&action!=='set_shop_active')return answer(req,409,{error:'SHOP đang bị khóa'});
  if(action==='set_shop_active'){
   if(!isAdmin)return answer(req,403,{error:'Chỉ Super Admin được khóa hoặc mở SHOP'});
   if(typeof data.active!=='boolean')return answer(req,400,{error:'Trạng thái không hợp lệ'});
   await api('/rest/v1/work_shops?id=eq.'+shop,{method:'PATCH',body:{active:data.active,updated_at:new Date().toISOString()},prefer:'return=minimal'});
   await logAction(shop,actor.id,null,data.active?'activate_shop':'archive_shop');
   return answer(req,200,{ok:true});
  }
  if(action==='add_staff'){
   if(!managerFor(shop))return answer(req,403,{error:'Chỉ Quản lý SHOP được tạo nhân viên'});
   const code=String(data.employee_code||'').trim(),fullName=String(data.full_name||'').trim().replace(/\s+/g,' ');
   if(!codeOK(code)||fullName.length<2||fullName.length>120||code==='112191')
      return answer(req,400,{error:'Mã nhân viên hoặc tên không hợp lệ'});
   const existing=await one('/rest/v1/profiles?employee_code=eq.'+code+'&select=id');
   if(existing)return answer(req,409,{error:'Mã nhân viên đã tồn tại. Nhờ Super Admin liên kết người này với SHOP mới'});
   const password=newPassword();
   const created=await api('/auth/v1/admin/users',{method:'POST',body:{email:code+SHOP_DOMAIN,password,email_confirm:true,user_metadata:{employee_code:code,full_name:fullName}}});
   const userId=created?.user?.id||created?.id;
   if(!validUUID(userId))return answer(req,503,{error:'Không tạo được tài khoản đăng nhập'});
   try {
    await api('/rest/v1/profiles?on_conflict=id',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',
     body:{id:userId,employee_code:code,full_name:fullName,role:'staff',active:true,must_change_password:true,is_admin:false}});
    await api('/rest/v1/work_shop_memberships?on_conflict=shop_id,user_id',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',
     body:{shop_id:shop,user_id:userId,shop_role:'staff',active:true,granted_by:actor.id}});
   }catch(err){try{await api('/auth/v1/admin/users/'+userId,{method:'DELETE'})}catch{};throw err}
   await logAction(shop,actor.id,userId,'create_staff');
   return answer(req,200,{ok:true,employee_code:code,temporary_password:password});
  }
  if(action==='grant_member'){
   if(!isAdmin)return answer(req,403,{error:'Chỉ Super Admin được liên kết tài khoản có sẵn hoặc cấp quyền Quản lý'});
   if(!validUUID(data.user_id))return answer(req,400,{error:'Tài khoản không hợp lệ'});
   const role=String(data.shop_role||'');
   if(!['manager','shift_lead','staff'].includes(role))return answer(req,400,{error:'Vai trò không hợp lệ'});
   const userId=data.user_id;
   const target=await one('/rest/v1/profiles?id=eq.'+userId+'&select=id,active,is_admin,role');
   if(!target?.active||target.is_admin)return answer(req,403,{error:'Không thể gán tài khoản này'});
   await api('/rest/v1/work_shop_memberships?on_conflict=shop_id,user_id',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',
    body:{shop_id:shop,user_id:userId,shop_role:role,active:true,granted_by:actor.id,updated_at:new Date().toISOString()}});
   if(role==='manager'&&target.role!=='manager')
    await api('/rest/v1/profiles?id=eq.'+userId,{method:'PATCH',prefer:'return=minimal',body:{role:'manager'}});
   if(role==='shift_lead'&&target.role==='staff')
    await api('/rest/v1/profiles?id=eq.'+userId,{method:'PATCH',prefer:'return=minimal',body:{role:'shift_lead'}});
   await logAction(shop,actor.id,userId,'grant_'+role);
   return answer(req,200,{ok:true});
  }
  if(action==='set_membership_active'){
   if(!managerFor(shop)||!validUUID(data.user_id)||typeof data.active!=='boolean')
     return answer(req,403,{error:'Không có quyền cập nhật nhân sự'});
   const member=await one('/rest/v1/work_shop_memberships?shop_id=eq.'+shop+'&user_id=eq.'+data.user_id+'&select=user_id,shop_role');
   if(!member)return answer(req,404,{error:'Nhân viên chưa thuộc SHOP'});
   if(!isAdmin&&member.shop_role==='manager')return answer(req,403,{error:'Chỉ Super Admin được khóa Quản lý'});
   if(data.user_id===actor.id||data.user_id===signed.id&&isAdmin)return answer(req,403,{error:'Không thể tự thu hồi quyền của mình'});
   await api('/rest/v1/work_shop_memberships?shop_id=eq.'+shop+'&user_id=eq.'+data.user_id,
    {method:'PATCH',prefer:'return=minimal',body:{active:data.active,updated_at:new Date().toISOString()}});
   await logAction(shop,actor.id,String(data.user_id),data.active?'activate_member':'archive_member');
   return answer(req,200,{ok:true});
  }
  if(action==='reset_staff_password'){
   if(!managerFor(shop)||!validUUID(data.user_id))return answer(req,403,{error:'Không có quyền cấp lại mật khẩu'});
   const member=await one('/rest/v1/work_shop_memberships?shop_id=eq.'+shop+'&user_id=eq.'+data.user_id+'&select=shop_role,active');
   if(!member||!member.active||member.shop_role==='manager'||data.user_id===actor.id)return answer(req,403,{error:'Không được đặt lại mật khẩu này'});
   const all=await api('/rest/v1/work_shop_memberships?user_id=eq.'+data.user_id+'&active=eq.true&select=shop_id&limit=2');
   if(!isAdmin&&all.length>1)return answer(req,409,{error:'Nhân sự thuộc nhiều SHOP; cần Super Admin cấp lại mật khẩu'});
   const p=await one('/rest/v1/profiles?id=eq.'+data.user_id+'&select=employee_code,active,is_admin');
   if(!p?.active||p.is_admin)return answer(req,403,{error:'Không được sửa tài khoản này'});
   const pw=newPassword();
   await api('/rest/v1/profiles?id=eq.'+data.user_id,{method:'PATCH',prefer:'return=minimal',body:{must_change_password:true}});
   await api('/auth/v1/admin/users/'+data.user_id,{method:'PUT',body:{password:pw}});
   await logAction(shop,actor.id,String(data.user_id),'reset_staff_password');
   return answer(req,200,{ok:true,temporary_password:pw});
  }
  return answer(req,400,{error:'Hành động không được hỗ trợ'});
 }catch(e){
  console.error('manage-shops request failed',e instanceof Error?e.message:'unknown');
  return answer(req,500,{error:'Không xử lý được yêu cầu. Vui lòng liên hệ Admin'});
 }
});
