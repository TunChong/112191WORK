// 112191 WORK: privileged staff account API. Deploy only to the matching Supabase project.
// Requires SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
// Verification of the caller's JWT and manager role is mandatory on every request.
const BASE=Deno.env.get('SUPABASE_URL')||'';
const ANON=Deno.env.get('SUPABASE_ANON_KEY')||'';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
type Obj=Record<string,unknown>;
function headers(origin:string){return {'content-type':'application/json','cache-control':'no-store','vary':'Origin','access-control-allow-origin':/^https:\/\/(?:[a-z0-9-]+\.)?112191work\.pages\.dev$/i.test(origin)?origin:'https://112191work.pages.dev','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'authorization,apikey,content-type'};}
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
async function audit(actor:string,target:string,code:string,action:string){await request('/rest/v1/staff_account_audit',{method:'POST',prefer:'return=minimal',body:{actor_id:actor,target_user_id:target,employee_code:code,action}})}
Deno.serve(async (req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:headers(req.headers.get('origin')||'')});
 if(req.method!=='POST')return reply(req,405,{error:'Phương thức không hỗ trợ'});
 if(!BASE||!ANON||!SERVICE)return reply(req,503,{error:'API quản trị chưa cấu hình'});
 try{
  const token=req.headers.get('authorization')||'';
  if(!token.startsWith('Bearer '))return reply(req,401,{error:'Cần đăng nhập'});
  const signed=await request('/auth/v1/user',{userToken:token.slice(7)});
  if(!signed?.id)return reply(req,401,{error:'Phiên đăng nhập không hợp lệ'});
  const managerProfiles=await request('/rest/v1/profiles?select=role,active,must_change_password&id=eq.'+encodeURIComponent(signed.id)+'&limit=1');
  if(managerProfiles[0]?.role!=='manager'||managerProfiles[0]?.active!==true||managerProfiles[0]?.must_change_password!==false)return reply(req,403,{error:'Chỉ quản lý được phép'});
  const data=await req.json() as Obj,action=String(data.action||'');
  if(action==='list'){
   const accounts=await request('/rest/v1/profiles?select=id,employee_code,full_name,role,active,created_at,must_change_password,password_changed_at&role=eq.staff&order=full_name.asc&limit=500');
   // Use paginated Auth admin listing rather than a privileged request per employee.
   const signins=new Map<string,string|null>();
   for(let page=1;page<=5;page++){
     const batch=await request('/auth/v1/admin/users?per_page=1000&page='+page);
     const identities=Array.isArray(batch?.users)?batch.users:[];
     for(const u of identities)if(typeof u.id==='string')signins.set(u.id,u.last_sign_in_at||null);
     if(identities.length<1000)break;
   }
   const enriched=accounts.map((p:Obj)=>({...p,last_sign_in_at:signins.get(String(p.id))||null}));
   const events=await request('/rest/v1/staff_account_audit?select=action,employee_code,created_at&order=created_at.desc&limit=50');
   return reply(req,200,{accounts:enriched,events});
  }
  if(action==='create'){
   const code=String(data.employee_code||'').trim(),name=String(data.full_name||'').trim().replace(/\s+/g,' ');
   if(!/^\d{4,8}$/.test(code)||name.length<2||name.length>120)return reply(req,400,{error:'Mã hoặc họ tên không hợp lệ'});
   const dup=await request('/rest/v1/profiles?select=id&employee_code=eq.'+encodeURIComponent(code)+'&limit=1');
   if(dup.length)return reply(req,409,{error:'Mã nhân viên đã tồn tại'});
   const pw=newPassword();
   const created=await request('/auth/v1/admin/users',{method:'POST',body:{email:code+'@112191work.pages.dev',password:pw,email_confirm:true,user_metadata:{employee_code:code,full_name:name}}});
   const uid=created?.user?.id||created?.id;
   if(!validId(uid))throw new Error('Could not create auth identity');
   try{await request('/rest/v1/profiles?on_conflict=id',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:{id:uid,employee_code:code,full_name:name,role:'staff',active:true,must_change_password:true}})}
   catch(e){try{await request('/auth/v1/admin/users/'+uid,{method:'DELETE'})}catch{};throw e}
   let auditWarning=false;
   try{await audit(signed.id,uid,code,'created')}catch{auditWarning=true;console.error('staff audit insert failed after creation')}
   return reply(req,200,{ok:true,employee_code:code,temporary_password:pw,audit_warning:auditWarning});
  }
  if(action==='set_active'||action==='reset_password'){
   if(!validId(data.user_id))return reply(req,400,{error:'ID không hợp lệ'});
   const uid=data.user_id;
   const rows=await request('/rest/v1/profiles?select=id,employee_code,role,active,must_change_password&id=eq.'+encodeURIComponent(uid)+'&limit=1'),p=rows[0];
   if(!p||p.role!=='staff')return reply(req,404,{error:'Không tìm thấy tài khoản nhân viên'});
   const code=String(p.employee_code||'');
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
   const pw=newPassword();
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
