// Admin-only task management for 112191 WORK.
// All destructive operations are verified server-side and audited atomically.
const BASE=Deno.env.get('SUPABASE_URL')||'';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const ANON=Deno.env.get('SUPABASE_ANON_KEY')||'';
const ALLOWED_ORIGIN=/^https:\/\/(?:[a-z0-9-]+\.)?(?:112191work|112191work-v21-preview)\.pages\.dev$/i;
type Obj=Record<string,any>;
function headers(origin:string){return {
 'content-type':'application/json;charset=utf-8','cache-control':'no-store','vary':'Origin',
 'access-control-allow-origin':ALLOWED_ORIGIN.test(origin)?origin:'https://112191work.pages.dev',
 'access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'authorization,apikey,content-type'
};}
function reply(req:Request,status:number,value:Obj){return new Response(JSON.stringify(value),{status,headers:headers(req.headers.get('origin')||'')});}
async function svc(path:string,options:{method?:string,body?:unknown,prefer?:string}={}):Promise<any>{
 const response=await fetch(BASE+path,{method:options.method||'GET',
 headers:{apikey:SERVICE,authorization:'Bearer '+SERVICE,'content-type':'application/json',
 ...(options.prefer?{prefer:options.prefer}:{})},
 body:options.body===undefined?undefined:JSON.stringify(options.body)});
 const raw=await response.text();let json:any;
 try{json=raw?JSON.parse(raw):null}catch{json=raw}
 if(!response.ok)throw new Error('DB API '+response.status+' ['+path.slice(0,50)+']');
 return json;
}
function uuid(x:unknown):x is string{return typeof x==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(x)}
async function owner(req:Request){
 const auth=req.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer '))return null;
 const userRes=await fetch(BASE+'/auth/v1/user',{headers:{apikey:ANON,authorization:auth}});
 if(!userRes.ok)return null;
 const user=await userRes.json();
 if(!uuid(user.id))return null;
 const list=await svc('/rest/v1/profiles?select=id,employee_code,role,is_admin,active,must_change_password&id=eq.'+user.id+'&limit=1');
 const profile=list?.[0];
 return profile?.id===user.id && profile?.employee_code==='112191' && profile?.role==='manager'
  && profile?.is_admin===true && profile?.active===true && profile?.must_change_password===false?profile:null;
}
async function removeImages(paths:string[],auditId:string):Promise<{removed:number,warning:string|null}>{
 if(paths.length===0)return {removed:0,warning:null};
 if(paths.length>5000)return {removed:0,warning:'Nhiều ảnh minh chứng cần xử lý riêng. Công việc đã xóa, ảnh vẫn được lưu riêng tư.'};
 let done=0;
 for(let i=0;i<paths.length;i+=1000){
  const chunk=paths.slice(i,i+1000);
  if(chunk.some(path=>typeof path!=='string'||!path.includes('/')||path.startsWith('/')))
   return {removed:done,warning:'Không xác thực được đường dẫn ảnh; ảnh được giữ lại để kiểm tra.'};
  try{
   await svc('/storage/v1/object/task-evidence',{method:'DELETE',body:{prefixes:chunk}});
   done+=chunk.length;
  }catch(err){
   console.error('Storage cleanup failed for task audit '+auditId,err instanceof Error?err.message:'unknown');
   return {removed:done,warning:'Công việc đã xóa nhưng một số ảnh chưa dọn được; nhật ký đã giữ thông tin để xử lý lại.'};
  }
 }
 try{
  await svc('/rest/v1/work_deleted_task_audit?id=eq.'+auditId,{
   method:'PATCH',prefer:'return=minimal',
   body:{storage_cleanup_complete:true,storage_cleanup_at:new Date().toISOString()}
  });
 }catch(e){
  console.warn('Deletion completed; audit photo cleanup flag pending',e);
  return {removed:done,warning:'Đã xóa công việc và ảnh, nhưng chưa ghi được trạng thái dọn ảnh vào nhật ký.'};
 }
 return {removed:done,warning:null};
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:headers(req.headers.get('origin')||'')});
 if(req.method!=='POST')return reply(req,405,{error:'Phương thức không hỗ trợ'});
 if(!BASE||!SERVICE||!ANON)return reply(req,503,{error:'Dịch vụ chưa được cấu hình'});
 try{
  const admin=await owner(req);
  if(!admin)return reply(req,403,{error:'Chỉ tài khoản Admin 112191 được xóa công việc'});
  let data:Obj;
  try{data=await req.json()}catch{return reply(req,400,{error:'Yêu cầu không hợp lệ'})}
  const taskId=data.task_id;
  if(!uuid(taskId))return reply(req,400,{error:'Mã công việc không hợp lệ'});
  if(data.action==='preview'){
   const p=await svc('/rest/v1/rpc/work_admin_task_preview',{
    method:'POST',body:{p_task:taskId,p_actor:admin.id}});
   return reply(req,200,{ok:true,preview:p});
  }
  if(data.action==='delete'){
   if(data.confirm!==true)return reply(req,400,{error:'Cần xác nhận xóa công việc'});
   const expected=data.expected||{};
   if(!Number.isInteger(expected.assignments)||!Number.isInteger(expected.photos))
    return reply(req,400,{error:'Cần kiểm tra công việc lại trước khi xóa'});
   let deleted:Obj;
   try{
    deleted=await svc('/rest/v1/rpc/work_admin_delete_task',{
     method:'POST',body:{
      p_task:taskId,p_actor:admin.id,p_expected_assignments:expected.assignments,
      p_expected_photos:expected.photos}
    });
   }catch(e){
    console.error('Task deletion transaction rejected',e instanceof Error?e.message:'unknown');
    return reply(req,409,{error:'Không xóa được vì dữ liệu công việc đã thay đổi hoặc còn ràng buộc. Hãy làm mới rồi thử lại.'});
   }
   const paths=Array.isArray(deleted.photo_paths)?deleted.photo_paths:[];
   const auditId=String(deleted.audit_id||'');
   const photoCleanup=uuid(auditId)?await removeImages(paths,auditId):
    {removed:0,warning:'Không ghi nhận được nhật ký xóa ảnh; cần kiểm tra thêm'};
   return reply(req,200,{ok:true,deleted:true,task_id:taskId,
    assignments_removed:deleted.assignments_removed,photos_removed:photoCleanup.removed,
    warning:photoCleanup.warning});
  }
  return reply(req,400,{error:'Hành động không được hỗ trợ'});
 }catch(e){
  console.error('Manage tasks error',e instanceof Error?e.message:'unknown');
  return reply(req,503,{error:'Không thể xử lý công việc lúc này. Vui lòng thử lại.'});
 }
});
