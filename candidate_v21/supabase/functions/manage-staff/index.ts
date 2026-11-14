// 112191 WORK: privileged staff account API. Deploy only to the matching Supabase project.
// Requires SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
// Verification of the caller's JWT and manager role is mandatory on every request.
const BASE=Deno.env.get('SUPABASE_URL')||'';
const ANON=Deno.env.get('SUPABASE_ANON_KEY')||'';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
type Obj=Record<string,unknown>;
function headers(origin:string){return {'content-type':'application/json','cache-control':'no-store','vary':'Origin','access-control-allow-origin':/^https:\/\/(?:[a-z0-9-]+\.)?(?:112191work|112191work-v21-preview)\.pages\.dev$/i.test(origin)?origin:'https://112191work.pages.dev','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'authorization,apikey,content-type'};}
function reply(req:Request,status:number,data:Obj){return new Response(JSON.stringify(data),{status,headers:headers(req.headers.get('origin')||'')});}
async function request(path:string,o:{method?:string;body?:unknown;userToken?:string;prefer?:string}={}):Promise<any>{
 const jwt=o.userToken||SERVICE;
 const r=await fetch(BASE+path,{method:o.method||'GET',headers:{apikey:o.userToken?ANON:SERVICE,Authorization:'Bearer '+jwt,'Content-Type':'application/json',...(o.prefer?{Prefer:o.prefer}:{})},body:o.body===undefined?undefined:JSON.stringify(o.body)});
 const raw=await r.text();let j:any;try{j=raw?JSON.parse(raw):null}catch{j=raw}
 if(!r.ok)throw new Error('Backend error '+r.status);
 return j;
}
function validId(v:unknown):v is string{return typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)}
function newPassword(){const letters='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';return 'W!'+Array.from(crypto.getRandomValues(new Uint8Array(18)),x=>letters[x%letters.length]).join('')}
function chooseInitialPassword(value:unknown,code:string):string{
 if(value===undefined||value===null||value==='')return newPassword();
 if(typeof value!=='string')throw new Error('Mật khẩu ban đầu không hợp lệ');
 if(value.length<10||value.length>72||!/[A-Za-z]/.test(value)||!/[0-9]/.test(value)||value.includes(code))
   throw new Error('Mật khẩu cần 10–72 ký tự, gồm chữ và số, không chứa mã nhân viên');
 return value;
}
async function audit(actor:string,target:string|null,code:string,action:string){await request('/rest/v1/staff_account_audit',{method:'POST',prefer:'return=minimal',body:{actor_id:actor,target_user_id:target,employee_code:code,action}})}
Deno.serve(async (req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:headers(req.headers.get('origin')||'')});
 if(req.method!=='POST')return reply(req,405,{error:'Phương thức không hỗ trợ'});
 if(!BASE||!ANON||!SERVICE)return reply(req,503,{error:'API quản trị chưa cấu hình'});
 try{
  const token=req.headers.get('authorization')||'';
  if(!token.startsWith('Bearer '))return reply(req,401,{error:'Cần đăng nhập'});
  const signed=await request('/auth/v1/user',{userToken:token.slice(7)});
  if(!signed?.id)return reply(req,401,{error:'Phiên đăng nhập không hợp lệ'});
  const managerProfiles=await request('/rest/v1/profiles?select=role,active,must_change_password,is_admin&id=eq.'+encodeURIComponent(signed.id)+'&limit=1');
  if(managerProfiles[0]?.role!=='manager'||managerProfiles[0]?.active!==true||managerProfiles[0]?.must_change_password!==false)return reply(req,403,{error:'Chỉ quản lý được phép'});
  const actorAdmin=managerProfiles[0]?.is_admin===true;
  const data=await req.json() as Obj,action=String(data.action||'');
  const validRole=(r:unknown):r is string=>r==='staff'||r==='shift_lead'||r==='manager';
  const positionName=(r:string)=>r==='manager'?'Quản lý':r==='shift_lead'?'Trưởng ca':'Nhân viên';
  if(action==='list'){
   const accounts=await request('/rest/v1/profiles?select=id,employee_code,full_name,role,active,is_admin,created_at,must_change_password,password_changed_at&is_admin=eq.false&order=full_name.asc&limit=500');
   // Use paginated Auth admin listing rather than a privileged request per employee.
   const signins=new Map<string,string|null>();
   for(let page=1;page<=5;page++){
     const batch=await request('/auth/v1/admin/users?per_page=1000&page='+page);
     const identities=Array.isArray(batch?.users)?batch.users:[];
     for(const u of identities)if(typeof u.id==='string')signins.set(u.id,u.last_sign_in_at||null);
     if(identities.length<1000)break;
   }
   const enriched=accounts.map((p:Obj)=>({...p,last_sign_in_at:signins.get(String(p.id))||null,position:positionName(String(p.role))}));
   const events=await request('/rest/v1/staff_account_audit?select=action,employee_code,created_at&order=created_at.desc&limit=50');
   return reply(req,200,{accounts:enriched,events,viewer_is_admin:actorAdmin});
  }
  if(action==='create'){
   const code=String(data.employee_code||'').trim(),name=String(data.full_name||'').trim().replace(/\s+/g,' '),role=String(data.role||'staff');
   if(!/^\d{4,8}$/.test(code)||name.length<2||name.length>120||!validRole(role))return reply(req,400,{error:'Mã, họ tên hoặc vị trí không hợp lệ'});
   if(role==='manager'&&!actorAdmin)return reply(req,403,{error:'Chỉ Admin 112191 được tạo tài khoản Quản lý'});
   if(code==='112191')return reply(req,403,{error:'Không thể tạo trùng tài khoản Admin'});
   const dup=await request('/rest/v1/profiles?select=id&employee_code=eq.'+encodeURIComponent(code)+'&limit=1');
   if(dup.length)return reply(req,409,{error:'Mã nhân viên đã tồn tại'});
   let pw:string;
   try{pw=chooseInitialPassword(data.temporary_password,code)}
   catch{return reply(req,400,{error:'Mật khẩu cần 10–72 ký tự, gồm chữ và số, không chứa mã nhân viên'})}
   const created=await request('/auth/v1/admin/users',{method:'POST',body:{email:code+'@112191work.pages.dev',password:pw,email_confirm:true,user_metadata:{employee_code:code,full_name:name}}});
   const uid=created?.user?.id||created?.id;
   if(!validId(uid))throw new Error('Could not create auth identity');
   try{await request('/rest/v1/profiles?on_conflict=id',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:{id:uid,employee_code:code,full_name:name,role,active:true,must_change_password:true,is_admin:false}})}
   catch(e){try{await request('/auth/v1/admin/users/'+uid,{method:'DELETE'})}catch{};throw e}
   let auditWarning=false;
   try{await audit(signed.id,uid,code,'created')}catch{auditWarning=true;console.error('staff audit insert failed after creation')}
   return reply(req,200,{ok:true,employee_code:code,temporary_password:pw,audit_warning:auditWarning});
  }
  if(action==='set_active'||action==='reset_password'||action==='update_name'||action==='delete'||action==='set_role'){
   if(!validId(data.user_id))return reply(req,400,{error:'ID không hợp lệ'});
   const uid=data.user_id;
   const rows=await request('/rest/v1/profiles?select=id,employee_code,role,active,is_admin,must_change_password&id=eq.'+encodeURIComponent(uid)+'&limit=1'),p=rows[0];
   if(!p)return reply(req,404,{error:'Không tìm thấy tài khoản'});
   if(p.is_admin===true||p.employee_code==='112191')return reply(req,403,{error:'Không được chỉnh sửa tài khoản Admin'});
   if(p.role==='manager'&&!actorAdmin)return reply(req,403,{error:'Chỉ Admin được chỉnh sửa tài khoản Quản lý'});
   const code=String(p.employee_code||'');
   if(action==='set_role'){
    if(!actorAdmin)return reply(req,403,{error:'Chỉ Admin 112191 được thay đổi vị trí'});
    const role=String(data.role||'');
    if(!validRole(role))return reply(req,400,{error:'Vị trí không hợp lệ'});
    if(role===p.role)return reply(req,200,{ok:true});
    await request('/rest/v1/profiles?id=eq.'+encodeURIComponent(uid),{method:'PATCH',prefer:'return=minimal',body:{role}});
    try{await audit(signed.id,uid,code,'role_changed')}catch{console.error('role change audit failed')}
    return reply(req,200,{ok:true,role});
   }
   if(action==='delete'){
    if(p.role==='manager')return reply(req,403,{error:'Không xóa vĩnh viễn tài khoản Quản lý; hãy lưu trữ'});
    if(p.active)return reply(req,409,{error:'Hãy lưu trữ tài khoản trước khi xóa vĩnh viễn'});
    if(data.confirm_code!==code)return reply(req,400,{error:'Xác nhận mã nhân viên chưa chính xác'});
    // Strong safety barrier: do not remove linked tasks, reports, audit-worthy events or evidence.
    const relationships=[
      ['assignments','staff_id'],['recurring_members','staff_id'],
      ['notifications','recipient_id'],['tasks','created_by'],['recurring_templates','created_by']
    ] as const;
    for(const [table,col] of relationships){
      const linked=await request('/rest/v1/'+table+'?select=*&'+col+'=eq.'+encodeURIComponent(uid)+'&limit=1');
      if(Array.isArray(linked)&&linked.length)return reply(req,409,{error:'Tài khoản đã có lịch sử công việc. Hãy giữ ở trạng thái lưu trữ để bảo toàn dữ liệu.'});
    }
    const evidence=await request('/storage/v1/object/list/task-evidence',{method:'POST',body:{prefix:uid,limit:1}});
    if(Array.isArray(evidence)&&evidence.length)return reply(req,409,{error:'Tài khoản còn ảnh minh chứng. Không thể xóa vĩnh viễn.'});
    try{await request('/auth/v1/admin/users/'+uid,{method:'DELETE'})}
    catch{return reply(req,409,{error:'Không thể xóa: tài khoản còn dữ liệu liên kết. Hãy giữ lưu trữ.'})}
    try{await audit(signed.id,null,code,'deleted')}catch{console.error('staff deletion audit failed')}
    return reply(req,200,{ok:true});
   }
   if(action==='update_name'){
    const name=String(data.full_name||'').trim().replace(/\s+/g,' ');
    if(name.length<2||name.length>120)return reply(req,400,{error:'Tên nhân viên cần từ 2 đến 120 ký tự'});
    await request('/rest/v1/profiles?id=eq.'+encodeURIComponent(uid),{method:'PATCH',prefer:'return=minimal',body:{full_name:name}});
    try{await audit(signed.id,uid,code,'updated')}catch{console.error('staff name audit failed')}
    return reply(req,200,{ok:true});
   }
   if(action==='set_active'){
    if(typeof data.active!=='boolean')return reply(req,400,{error:'Trạng thái không hợp lệ'});
    // Archive instead of deleting: preserve assignments and activity history.
    // A ban prevents new sign-ins, but existing access tokens require RLS checks.
    await request('/rest/v1/profiles?id=eq.'+encodeURIComponent(uid),{method:'PATCH',prefer:'return=minimal',body:{active:data.active}});
    try{
      await request('/auth/v1/admin/users/'+uid,{method:'PUT',body:{ban_duration:data.active?'none':'876000h'}});
    }catch(e){
      try{await request('/rest/v1/profiles?id=eq.'+encodeURIComponent(uid),{method:'PATCH',prefer:'return=minimal',body:{active:p.active}})}catch{}
      throw e;
    }
    await audit(signed.id,uid,code,data.active?'activated':'deactivated');
    return reply(req,200,{ok:true});
   }
   let pw:string;
   try{pw=chooseInitialPassword(data.temporary_password,code)}
   catch{return reply(req,400,{error:'Mật khẩu cần 10–72 ký tự, gồm chữ và số, không chứa mã nhân viên'})}
   // Block work access while the employee changes their one-time password.
   // If the Auth update fails, restore the previous first-login flag.
   await request('/rest/v1/profiles?id=eq.'+encodeURIComponent(uid),{method:'PATCH',prefer:'return=minimal',body:{must_change_password:true}});
   try{
     await request('/auth/v1/admin/users/'+uid,{method:'PUT',body:{password:pw}});
   }catch(e){
     try{await request('/rest/v1/profiles?id=eq.'+encodeURIComponent(uid),{method:'PATCH',prefer:'return=minimal',body:{must_change_password:p.must_change_password===true}})}catch{}
     throw e;
   }
   let auditWarning=false;
   try{await audit(signed.id,uid,code,'password_reset')}catch{auditWarning=true;console.error('staff audit insert failed after password reset')}
   return reply(req,200,{ok:true,temporary_password:pw,audit_warning:auditWarning});
  }
  return reply(req,400,{error:'Hành động không hợp lệ'});
 }catch(e){
  console.error('manage-staff failed',e instanceof Error?e.message:'unknown');
  return reply(req,500,{error:'Không xử lý được yêu cầu, kiểm tra log quản trị'});
 }
});
