// Companion-MWG Web Push (PWA). No service secrets in public assets.
// Use W3C Web Push over Supabase Edge Functions; server-side VAPID keys stay
// in the app_private schema and can only be retrieved via service_role RPCs.
import * as webpush from 'jsr:@negrel/webpush@0.5.0';

const BASE=Deno.env.get('SUPABASE_URL')||'';
const ANON=Deno.env.get('SUPABASE_ANON_KEY')||'';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const ORIGINS=/^https:\/\/(?:[a-z0-9-]+\.)?(?:112191work|112191work-v21-preview|supportmwg)\.pages\.dev$/i;
type J=Record<string,any>;
function cors(origin:string){return {
 'content-type':'application/json;charset=utf-8',
 'cache-control':'no-store',
 'vary':'Origin',
 'access-control-allow-origin':ORIGINS.test(origin)?origin:'https://supportmwg.pages.dev',
 'access-control-allow-headers':'authorization,apikey,content-type',
 'access-control-allow-methods':'POST,OPTIONS',
};}
function result(req:Request,status:number,payload:J){return new Response(JSON.stringify(payload),{status,headers:cors(req.headers.get('origin')||'')});}
async function db(path:string,{method='GET',body,prefer}: {method?:string;body?:unknown;prefer?:string}={}):Promise<any>{
 const r=await fetch(BASE+path,{method,headers:{
  'apikey':SERVICE,'authorization':'Bearer '+SERVICE,
  'content-type':'application/json',...(prefer?{'prefer':prefer}:{})
 },body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await r.text();let x:any;
 try{x=raw?JSON.parse(raw):null}catch{x=raw}
 if(!r.ok)throw new Error('Server API '+r.status+' '+path.slice(0,80));
 return x;
}
async function member(token:string){
 const r=await fetch(BASE+'/auth/v1/user',{headers:{'apikey':ANON,'authorization':'Bearer '+token}});
 if(!r.ok)return null;
 const user=await r.json();if(!user?.id)return null;
 const rows=await db('/rest/v1/profiles?select=id,employee_code,role,active,must_change_password,is_admin&id=eq.'+encodeURIComponent(user.id)+'&limit=1');
 const p=rows?.[0];
 if(!p||p.active!==true||p.must_change_password!==false)return null;
 return p as {id:string;employee_code:string;role:string;active:boolean;is_admin:boolean};
}
function validUUID(x:unknown):x is string{return typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x)}
function endpointAllowed(endpoint:string):boolean{
 try{
  if(endpoint.length>2048||!endpoint.startsWith('https://'))return false;
  const h=new URL(endpoint).hostname.toLowerCase();
  return h==='fcm.googleapis.com'||h==='updates.push.services.mozilla.com'
   ||h==='push.services.mozilla.com'||h.endsWith('.push.apple.com')
   ||h==='notify.windows.com'||h.endsWith('.notify.windows.com');
 }catch{return false}
}
function validKey(v:unknown,min:number,max:number){return typeof v==='string'&&v.length>=min&&v.length<=max&&/^[a-zA-Z0-9_-]+$/.test(v)}
async function keysConfig(){
 const existing=await db('/rest/v1/rpc/work_push_get_keys',{method:'POST',body:{}});
 if(existing?.[0]?.keys&&existing[0]?.public_key)return existing[0];
 const fresh=await webpush.generateVapidKeys({extractable:true});
 const exported=await webpush.exportVapidKeys(fresh);
 const publicKey=await webpush.exportApplicationServerKey(fresh);
 // ON CONFLICT DO NOTHING ensures simultaneous phone subscriptions share
 // exactly one stable key pair.
 await db('/rest/v1/rpc/work_push_set_keys',{method:'POST',body:{p_keys:exported,p_public_key:publicKey}});
 const saved=await db('/rest/v1/rpc/work_push_get_keys',{method:'POST',body:{}});
 if(!saved?.[0]?.keys||!saved[0]?.public_key)throw new Error('Could not initialize private VAPID keys');
 return saved[0];
}
async function dispatchAssignments(assignments:J[],actor:J):Promise<J>{
 const cfg=await keysConfig();
 const pair=await webpush.importVapidKeys(cfg.keys);
 const sender=await webpush.ApplicationServer.new({
  contactInformation:'mailto:tuantrong17082000@gmail.com',vapidKeys:pair
 });
 const ids=[...new Set(assignments.map(x=>x.task_id).filter(validUUID))];
 const tasks=new Map<string,J>();
 for(const id of ids){
  const rows=await db('/rest/v1/tasks?select=id,title,priority,due_at,created_by&id=eq.'+encodeURIComponent(id)+'&limit=1');
  if(rows?.[0])tasks.set(id,rows[0]);
 }
 const stats={assignments:assignments.length,sent:0,already_sent:0,no_subscription:0,failed:0,expired_removed:0};
 for(const a of assignments){
  const t=tasks.get(a.task_id);if(!t||!validUUID(a.staff_id)||a.status!=='todo')continue;
  const profiles=await db('/rest/v1/profiles?select=id,role,active,must_change_password&id=eq.'+encodeURIComponent(a.staff_id)+'&limit=1');
  if(!profiles?.[0]||profiles[0].active!==true||profiles[0].must_change_password===true)continue;
  const subscriptions=await db('/rest/v1/work_push_subscriptions?select=id,endpoint,p256dh,auth_secret&user_id=eq.'+encodeURIComponent(a.staff_id)+'&limit=20');
  if(!subscriptions.length){stats.no_subscription++;continue}
  const high=t.priority==='high';
  const due=new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t.due_at));
  const payload={title:high?'🚨 CÔNG VIỆC ƯU TIÊN CAO':'📋 CÔNG VIỆC MỚI · BÌNH THƯỜNG',
   body:String(t.title).slice(0,180)+' · Hạn: '+due,
   priority:high?'high':'normal',task_id:t.id,assignment_id:a.id,tag:'task-'+a.id,
   url:'/?task='+encodeURIComponent(t.id)};
  for(const sub of subscriptions){
   let claimed=false;
   try{
    const claim=await db('/rest/v1/rpc/work_push_claim_delivery',{method:'POST',body:{p_assignment:a.id,p_subscription:sub.id}});
    claimed=claim===true;if(!claimed){stats.already_sent++;continue}
    await sender.subscribe({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_secret}})
      .pushTextMessage(JSON.stringify(payload),{ttl:86400,urgency:high?webpush.Urgency.High:webpush.Urgency.Normal});
    await db('/rest/v1/work_push_deliveries?assignment_id=eq.'+a.id+'&subscription_id=eq.'+sub.id,
      {method:'PATCH',body:{state:'sent',sent_at:new Date().toISOString(),last_error:null},prefer:'return=minimal'});
    stats.sent++;
   }catch(e){
    const status=(e as any)?.response?.status;
    if(status===404||status===410){
     try{await db('/rest/v1/work_push_subscriptions?id=eq.'+sub.id,{method:'DELETE'});stats.expired_removed++}catch{}
    }else if(claimed){
     try{await db('/rest/v1/work_push_deliveries?assignment_id=eq.'+a.id+'&subscription_id=eq.'+sub.id,
       {method:'PATCH',body:{state:'failed',last_error:'push delivery failed'},prefer:'return=minimal'})}catch{}
    }
    stats.failed++;
    console.error('push delivery failed',typeof status==='number'?status:(e as Error)?.message||'unknown');
   }
  }
 }
 return stats;
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(req.headers.get('origin')||'')});
 if(req.method!=='POST')return result(req,405,{error:'Phương thức không hỗ trợ'});
 if(!BASE||!ANON||!SERVICE)return result(req,503,{error:'Push chưa được cấu hình'});
 const h=req.headers.get('authorization')||'';
 if(!h.startsWith('Bearer '))return result(req,401,{error:'Chưa đăng nhập'});
 try{
  const actor=await member(h.slice(7));
  if(!actor)return result(req,403,{error:'Tài khoản không hợp lệ hoặc đã khóa'});
  let data:J;
  try{data=await req.json()}catch{return result(req,400,{error:'Dữ liệu JSON không hợp lệ'})}
  const action=String(data.action||'');
  if(action==='key'){
   const cfg=await keysConfig();
   return result(req,200,{public_key:cfg.public_key});
  }
  if(action==='subscribe'){
   const sub=data.subscription;
   if(typeof sub!=='object'||!sub||!endpointAllowed(String(sub.endpoint||''))||
      !validKey(sub.keys?.p256dh,40,256)||!validKey(sub.keys?.auth,12,256))
       return result(req,400,{error:'Thiết bị không cung cấp đăng ký thông báo hợp lệ'});
   await keysConfig();
   await db('/rest/v1/work_push_subscriptions?on_conflict=endpoint',{method:'POST',
    body:{user_id:actor.id,endpoint:sub.endpoint,p256dh:sub.keys.p256dh,auth_secret:sub.keys.auth,
      user_agent:String(data.user_agent||'').slice(0,200),updated_at:new Date().toISOString()},
    prefer:'resolution=merge-duplicates,return=minimal'});
   return result(req,200,{ok:true});
  }
  if(action==='unsubscribe'){
   if(typeof data.endpoint!=='string'||data.endpoint.length>2048)return result(req,400,{error:'Endpoint không hợp lệ'});
   await db('/rest/v1/work_push_subscriptions?endpoint=eq.'+encodeURIComponent(data.endpoint)+'&user_id=eq.'+actor.id,
    {method:'DELETE'});
   return result(req,200,{ok:true});
  }
  if(action==='dispatch_task'){
   if(!validUUID(data.task_id))return result(req,400,{error:'Mã công việc không hợp lệ'});
   if(!['manager','shift_lead'].includes(actor.role))return result(req,403,{error:'Chỉ quản lý hoặc trưởng ca được gửi thông báo giao việc'});
   const t=await db('/rest/v1/tasks?select=id,created_by,created_at,shop_id&id=eq.'+data.task_id+'&limit=1');
   if(!t?.[0])return result(req,404,{error:'Công việc không tồn tại'});
   const superAdmin=actor.is_admin===true&&actor.employee_code==='112191';
   if(!superAdmin){
     const grants=await db('/rest/v1/work_shop_memberships?select=shop_role,active&user_id=eq.'+actor.id+'&shop_id=eq.'+t[0].shop_id+'&active=eq.true&limit=1');
     if(!['manager','shift_lead'].includes(grants?.[0]?.shop_role))
       return result(req,403,{error:'Không có quyền gửi thông báo SHOP khác'});
   }
   if(t[0].created_by!==actor.id&&!superAdmin)return result(req,403,{error:'Không có quyền gửi thông báo của công việc này'});
   if(Date.now()-new Date(t[0].created_at).getTime()>7*86400000)return result(req,403,{error:'Chỉ gửi thông báo công việc mới'});
   const ass=await db('/rest/v1/assignments?select=id,task_id,staff_id,status&task_id=eq.'+data.task_id+'&limit=100');
   return result(req,200,{ok:true,...await dispatchAssignments(ass,actor)});
  }
  if(action==='dispatch_pending'){
   const since=new Date(Date.now()-48*3600000).toISOString();
   const superAdmin=actor.is_admin===true&&actor.employee_code==='112191';
   const myMemberships=await db('/rest/v1/work_shop_memberships?select=shop_id,shop_role&user_id=eq.'+actor.id+'&active=eq.true&limit=1000');
   const allowedShopIds=myMemberships.filter((m:J)=>actor.role==='staff'?m.shop_role==='staff':['manager','shift_lead'].includes(m.shop_role)).map((m:J)=>m.shop_id).filter(validUUID);
   if(!superAdmin&&!allowedShopIds.length)return result(req,200,{ok:true,assignments:0,sent:0,already_sent:0,no_subscription:0,failed:0,expired_removed:0});
   let query='/rest/v1/assignments?select=id,task_id,staff_id,status,created_at,shop_id&status=eq.todo&created_at=gte.'+encodeURIComponent(since)+'&order=created_at.desc&limit=30';
   if(!superAdmin)query+='&shop_id=in.('+allowedShopIds.join(',')+')';
   if(actor.role==='staff')query+='&staff_id=eq.'+actor.id;
   const ass=await db(query);
   return result(req,200,{ok:true,...await dispatchAssignments(ass,actor)});
  }
  return result(req,400,{error:'Hành động không hỗ trợ'});
 }catch(e){
  console.error('work-push internal error',e instanceof Error?e.message:'unknown');
  return result(req,503,{error:'Dịch vụ thông báo chưa sẵn sàng. Công việc vẫn được lưu trong ứng dụng.'});
 }
});
