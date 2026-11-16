/* 112191 WORK v2.0 | Đồng bộ Supabase, đăng nhập mã NV, 2 quản lý. */
const CONF = window.WORK_CONFIG || {};
const CLOUD = !!(CONF.supabaseUrl && CONF.supabasePublishableKey);
const BASE = (CONF.supabaseUrl || '').replace(/\/$/, '');
const ANON = CONF.supabasePublishableKey || '';
const TZ = 'Asia/Ho_Chi_Minh';
const KEY = 'work112191_demo_v1'; // di sản từ bản thử, không dùng trong v2 chính thức
const LOGIN_DOMAIN = '112191work.pages.dev';
const ROSTER_VERSION = 2;
const ROSTER = [
  {employee_code:'111566',full_name:'Minh'},
  {employee_code:'117046',full_name:'Mẫn'},
  {employee_code:'169601',full_name:'Viên'},
  {employee_code:'203451',full_name:'Thiện'},
  {employee_code:'208926',full_name:'Trọng'},
  {employee_code:'237393',full_name:'Trí'},
  {employee_code:'241093',full_name:'Luân'},
  {employee_code:'248431',full_name:'Đô'},
  {employee_code:'292406',full_name:'Khoa'},
  {employee_code:'57021',full_name:'Huyền'},
  {employee_code:'101154',full_name:'Nam'},
  {employee_code:'141592',full_name:'My'},
  {employee_code:'155609',full_name:'Phương'},
  {employee_code:'288315',full_name:'Thúy'}
];
const TOKEN_KEY = 'work112191_session';
const SHOP_VERSION = '3.2.2-login-no-username-hints';
const ICON_PATHS = {
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  clipboard:'<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 3-8 8-8s8 3 8 8"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M15 3a4 4 0 0 1 0 8M23 21v-2a4 4 0 0 0-3-3.9"/><circle cx="8.5" cy="7" r="4"/>',
  chart:'<path d="M3 3v18h18M8 16v-5M13 16V6M18 16v-8"/>',check:'<path d="m5 12 4 4L19 6"/>',checkcircle:'<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  receipt:'<path d="M4 3h16v18l-4-2-4 2-4-2-4 2zM8 8h8M8 12h8M8 16h5"/>',
  camera:'<path d="M14 4H9l-2 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4z"/><circle cx="12" cy="13" r="4"/>',
  repeat:'<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',chevron:'<path d="m9 18 6-6-6-6"/>',back:'<path d="m15 18-6-6 6-6"/>',close:'<path d="M18 6 6 18M6 6l12 12"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  warning:'<path d="M10.3 3.3 1.6 19a2 2 0 0 0 1.7 3h17.4a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0zM12 9v5M12 18h.01"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>',logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  download:'<path d="M12 3v12M7 10l5 5 5-5M4 17v4h16v-4"/>',refresh:'<path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/>',
  shield:'<path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6z"/><path d="m8 12 3 3 5-5"/>',
  filter:'<path d="M4 7h16M7 12h10M10 17h4"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/>'
};
const ic = (name, cls='') => `<svg class="${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]||ICON_PATHS.info}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const id = () => (globalThis.crypto?.randomUUID?.() || ('id'+Math.random().toString(36).slice(2)));
const nowDate = () => new Date().toISOString();
const dayLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const toDateInput = (d=new Date()) => `${dayLocal(d)}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
const addHours = h => new Date(Date.now()+h*3600000);
const fmt = (d, includeDate=true) => d ? new Intl.DateTimeFormat('vi-VN',{timeZone:TZ,day:includeDate?'2-digit':undefined,month:includeDate?'2-digit':undefined,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(d)) : '—';
const isLate = (a,t) => ['todo','rejected'].includes(a.status) && new Date(t.due_at) < new Date();
const assignStatus = (a,t) => isLate(a,t)?'overdue':a.status;
const NAMES={todo:'Chưa làm',submitted:'Chờ duyệt',approved:'Đã duyệt',rejected:'Làm lại',overdue:'Quá hạn'};
const STATUS_ICON={todo:'clock',submitted:'camera',approved:'checkcircle',rejected:'refresh',overdue:'warning'};
let state={shops:[],shopDeleting:null,staffDeleting:null,shopEditId:null,shopId:null,shopRoles:{},shopReady:false,shopReadyChecked:false,shopMembers:[],shopMemberLoading:false,shopSearch:'',pushEnabled:false,staffAccounts:null,staffAccountsError:'',staffAccountsLoading:false,oneTimeCredential:null,screen:'home',modal:null,filter:'all',search:'',loading:false,data:null,user:null,session:null,photos:{},signed:{},signedUntil:{},authRole:'staff',picked:[],editMode:false};
const root=document.getElementById('app');
let ticking=false;
const toast=(message)=>{document.querySelector('.alert-toast')?.remove();const a=document.createElement('div');a.className='alert-toast';a.textContent=message;document.body.appendChild(a);setTimeout(()=>a.remove(),3400)};
function newStaffProfiles(){return ROSTER.map(p=>({id:`nv-${p.employee_code}`,employee_code:p.employee_code,full_name:p.full_name,role:'staff',active:true}));}
function initDemo(){
 return {roster_version:ROSTER_VERSION,profiles:[{id:'mgr',full_name:'Quản lý siêu thị',role:'manager',active:true},...newStaffProfiles()],tasks:[],assignments:[],recurring_templates:[],recurring_members:[],notifications:[]};
}
function migrateDemoRoster(data){
 if(!data || data.roster_version===ROSTER_VERSION)return data;
 // Lưu toàn bộ bản cũ để tránh làm mất dữ liệu thử nghiệm trước khi cập nhật danh sách nhân viên.
 try {if(!localStorage.getItem('work112191_backup_truoc_v11'))localStorage.setItem('work112191_backup_truoc_v11',JSON.stringify(data))}catch(e){console.warn('Không thể sao lưu demo',e)}
 const seeded = new Set((data.tasks||[]).filter(t=>/^task(?:[0-9]|1[01])$/.test(t.id) && t.created_by==='mgr').map(t=>t.id));
 const assignments=(data.assignments||[]).filter(a=>!seeded.has(a.task_id));
 const activeAssignmentIds=new Set(assignments.map(a=>a.id));
 data.tasks=(data.tasks||[]).filter(t=>!seeded.has(t.id));
 data.assignments=assignments;
 data.notifications=(data.notifications||[]).filter(n=>!seeded.has(n.task_id) && (!n.assignment_id||activeAssignmentIds.has(n.assignment_id)) && n.title!=='Bản dùng thử đã sẵn sàng');
 // Giữ hồ sơ cũ dưới dạng lưu trữ để không đổi nhầm người nhận của việc đã tự tạo.
 const legacy=(data.profiles||[]).filter(p=>p.role==='staff'&&!p.employee_code).map(p=>({...p,role:'archived',active:false}));
 const other=(data.profiles||[]).filter(p=>p.role!=='staff'&&p.role!=='archived');
 data.profiles=[...(other.length?other:[{id:'mgr',full_name:'Quản lý siêu thị',role:'manager',active:true}]),...legacy,...newStaffProfiles()];
 data.roster_version=ROSTER_VERSION;
 return data;
}
function persist(){if(CLOUD)return;try{localStorage.setItem(KEY,JSON.stringify(state.data))}catch(e){toast('Bộ nhớ dùng thử gần đầy. Hãy giảm dung lượng ảnh.')}}
function demoGenerate(){if(CLOUD||!state.data)return;let changed=false;const day=dayLocal();for(const r of state.data.recurring_templates.filter(x=>x.active && (!x.start_on || x.start_on<=day))){
 if(state.data.tasks.some(t=>t.recurring_template_id===r.id&&t.recurring_on===day))continue;
 const t={id:id(),title:r.title,description:r.description,category:r.category,priority:r.priority,due_at:new Date(`${day}T${r.due_time}:00+07:00`).toISOString(),created_by:'mgr',created_at:nowDate(),recurring_template_id:r.id,recurring_on:day};state.data.tasks.unshift(t);
 for(const mem of state.data.recurring_members.filter(m=>m.template_id===r.id)){const a={id:id(),task_id:t.id,staff_id:mem.staff_id,status:'todo',report_notes:null,photo_paths:[],submitted_at:null,reviewed_at:null,review_feedback:null,created_at:nowDate()};state.data.assignments.push(a);notify(mem.staff_id,'Công việc hằng ngày',r.title,t.id,a.id)} changed=true;
 }if(changed)persist();}
function notify(recipient_id,title,body,task_id=null,assignment_id=null,event_key=null){
 if(!state.data)return;
 if(event_key && state.data.notifications.some(n=>n.event_key===event_key && n.recipient_id===recipient_id))return;
 state.data.notifications.unshift({id:id(),recipient_id,title,body,task_id,assignment_id,read_at:null,created_at:nowDate(),event_key});
 if(recipient_id===state.user?.id && 'Notification' in window && Notification.permission==='granted' && document.visibilityState==='visible'){
  try {new Notification(title,{body,icon:'./icon-192.png'})}catch{}
 }
}
function demoCheckOverdue(){if(CLOUD||!state.data)return;let changed=false;for(const a of state.data.assignments){const t=state.data.tasks.find(t=>t.id===a.task_id);if(t && isLate(a,t)){
  const key='late:'+a.id;if(!state.data.notifications.some(n=>n.event_key===key&&n.recipient_id===a.staff_id)){notify(a.staff_id,'Công việc quá hạn',t.title,t.id,a.id,key);changed=true;}
  if(!state.data.notifications.some(n=>n.event_key===key&&n.recipient_id==='mgr')){notify('mgr','Nhân viên trễ hạn',t.title,t.id,a.id,key);changed=true;}
 }}if(changed)persist()}
function sessionHeaders(){return {'apikey':ANON,'Authorization':`Bearer ${state.session?.access_token||ANON}`};}
async function cloudRequest(path,{method='GET',body,headers={}}={}){
 const r=await fetch(`${BASE}${path}`,{method,headers:{...sessionHeaders(),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
 if(r.status===204)return null;const raw=await r.text();let data;try{data=raw?JSON.parse(raw):null}catch{data=raw}
 if(!r.ok)throw new Error(data?.message||data?.msg||data?.error_description||data?.error||`Lỗi máy chủ ${r.status}`);
 return data;
}
async function authRequest(endpoint, payload){
 const r=await fetch(`${BASE}/auth/v1/${endpoint}`,{method:'POST',headers:{'apikey':ANON,'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const j=await r.json();if(!r.ok)throw new Error(j.msg||j.error_description||j.message||'Đăng nhập không thành công');return j;
}
async function ensureFreshToken(){if(!CLOUD||!state.session)return;const expires=state.session.expires_at||0;if(expires > Date.now()/1000+90)return;
 const s=await authRequest('token?grant_type=refresh_token',{refresh_token:state.session.refresh_token});storeSession(s);
}
function storeSession(s){state.session={access_token:s.access_token,refresh_token:s.refresh_token,expires_at:s.expires_at||Math.floor(Date.now()/1000)+(s.expires_in||3600),user:s.user};localStorage.setItem(TOKEN_KEY,JSON.stringify(state.session));}
async function shopAdminRequest(body) {
 if(!CLOUD)throw new Error('Chưa có kết nối Supabase');
 await ensureFreshToken();
 return cloudRequest('/functions/v1/manage-shops',{method:'POST',body});
}
async function loadShopMembers() {
 if(!state.shopId || !supervisor())return;
 state.shopMemberLoading=true;
 try{const data=await shopAdminRequest({action:'list_members',shop_id:state.shopId,page:0,limit:100});
     state.shopMembers=data.members||[];}
 catch(e){state.shopMembers=[];console.warn('SHOP members:',e)}
 finally{state.shopMemberLoading=false;if(state.screen==='shops')draw()}
}
async function loadCloud(){
 await ensureFreshToken();if(!state.session)return;
 const profile=await cloudRequest('/rest/v1/profiles?id=eq.'+encodeURIComponent(state.session.user.id)+'&select=*');
 state.user=profile?.[0]||null;
 if(!state.user)throw new Error('Chưa tìm thấy hồ sơ người dùng');
 if(!state.user.active||state.user.must_change_password){
  state.shops=[];state.shopRoles={};state.shopId=null;
  state.data={profiles:[state.user],tasks:[],assignments:[],recurring_templates:[],recurring_members:[],notifications:[]};
  return;
 }
 const [shops,memberships]=await Promise.all([
  cloudRequest('/rest/v1/work_shops?select=id,shop_code,shop_name,active,is_primary&order=shop_code.asc&limit=600'),
  cloudRequest('/rest/v1/work_shop_memberships?select=shop_id,shop_role,active&user_id=eq.'+state.user.id+'&active=eq.true&limit=600')
 ]);
 state.shops=shops||[];
 state.shopRoles=Object.fromEntries((memberships||[]).map(m=>[m.shop_id,m.shop_role]));
 const preferred=localStorage.getItem('work112191_selected_shop');
 state.shopId=state.shops.some(s=>s.id===(state.shopId||preferred))?(state.shopId||preferred):state.shops[0]?.id||null;
 if(!state.user.is_admin)state.user.role=state.shopRoles[state.shopId]||'staff';
 if(!state.shopReadyChecked){
  try{state.shopReady=(await shopAdminRequest({action:'status'})).ready===true}
  catch(e){state.shopReady=false;console.warn('SHOP management status unavailable',e)}
  state.shopReadyChecked=true;
 }
 if(!state.shopId){
  state.data={profiles:[state.user],tasks:[],assignments:[],recurring_templates:[],recurring_members:[],notifications:[]};
  return;
 }
 const shopId=encodeURIComponent(state.shopId);
 const [members,tasks,assignments,templates,recurringMembers,notifications]=await Promise.all([
  cloudRequest('/rest/v1/work_shop_memberships?shop_id=eq.'+shopId+'&select=user_id,shop_role,active,profile:profiles!work_shop_memberships_user_id_fkey(id,employee_code,full_name,role,is_admin,active,must_change_password,created_at)&limit=800'),
  cloudRequest('/rest/v1/tasks?shop_id=eq.'+shopId+'&select=*&order=due_at.desc&limit=400'),
  cloudRequest('/rest/v1/assignments?shop_id=eq.'+shopId+'&select=*&limit=1200'),
  cloudRequest('/rest/v1/recurring_templates?shop_id=eq.'+shopId+'&select=*&order=created_at.desc&limit=400'),
  cloudRequest('/rest/v1/recurring_members?shop_id=eq.'+shopId+'&select=*&limit=1200'),
  cloudRequest('/rest/v1/notifications?shop_id=eq.'+shopId+'&select=*&order=created_at.desc&limit=150')
 ]);
 const profiles=(members||[]).filter(m=>m.profile).map(m=>({...m.profile,role:m.shop_role,active:!!m.active&&!!m.profile.active}));
 if(!profiles.some(p=>p.id===state.user.id))profiles.unshift(state.user);
 state.data={profiles,tasks,assignments,recurring_templates:templates,recurring_members:recurringMembers,notifications};
}
async function refresh(){if(state.loading)return;state.loading=true;try{
 const hadLoadedData=!!state.data;const known=new Set((state.data?.notifications||[]).map(n=>n.id));
 if(CLOUD){await loadCloud();
  if(hadLoadedData){
   const fresh=myNotifications().filter(n=>!known.has(n.id));
   const newTask=fresh.find(n=>n.event_key?.startsWith('new:'));
   if(newTask&&document.visibilityState==='visible')showNewWorkPopup(newTask);
   // Web-link users see native browser notifications while tab is still open,
   // even in the background when the browser lets the timer run.
   if(!state.pushEnabled&&'Notification' in window&&Notification.permission==='granted'){
    for(const n of fresh.slice(0,2)){try{new Notification(n.title,{body:n.body,icon:'./icon-192.png',tag:'inapp-'+n.id})}catch{}}
   }
  }
 }else{demoGenerate();demoCheckOverdue()};draw()
 }catch(e){toast('Không tải được dữ liệu: '+e.message);draw()}finally{state.loading=false}}

/* PWA Web Push: public key in browser, VAPID private key kept on Supabase server. */
let lastPendingPushCheck=0;
function canPush(){return CLOUD&&window.isSecureContext&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window}
function base64KeyToBytes(key){
 const base=key.replace(/-/g,'+').replace(/_/g,'/');
 const raw=atob(base+'='.repeat((4-base.length%4)%4));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
async function pushService(body){
 await ensureFreshToken();
 return cloudRequest('/functions/v1/work-push',{method:'POST',body});
}
async function enablePhonePush(){
 if(!CLOUD)return;
 if(!('Notification' in window)){
  toast('Popup vẫn hoạt động khi đang mở link web. iPhone: thêm website vào Màn hình chính để nhận Push khi đóng trang.');
  return;
 }
 if(Notification.permission==='denied'){
  toast('Thông báo đang bị chặn. Hãy bật trong phần Cài đặt thông báo của điện thoại.');
  return;
 }
 try{
  // Must run directly from an explicit tap on iOS.
  const permission=await Notification.requestPermission();
  if(permission!=='granted'){toast('Chưa cấp quyền trình duyệt. Popup vẫn hoạt động khi đang mở web.');draw();return}
  if(!canPush()){
   state.pushEnabled=false;draw();
   toast('Đã bật cảnh báo khi mở link web. Muốn nhận khi đóng trang cần thiết bị hỗ trợ Push hoặc iPhone thêm app vào Màn hình chính.');
   return;
  }
  const cfg=await pushService({action:'key'});
  if(!cfg?.public_key)throw new Error('Máy chủ chưa trả về khóa Push');
  const key=base64KeyToBytes(cfg.public_key);
  const reg=await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();
  if(sub){
   const old=sub.options?.applicationServerKey;
   if(old){
    const a=new Uint8Array(old);
    if(a.length!==key.length||a.some((x,i)=>x!==key[i])){
     await sub.unsubscribe();sub=null;
    }
   }
  }
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
  await pushService({action:'subscribe',subscription:sub.toJSON(),user_agent:navigator.userAgent});
  state.pushEnabled=true;draw();
  toast('Đã bật thông báo công việc trên điện thoại.');
  pushService({action:'dispatch_pending'}).catch(err=>console.warn('Pending push retry',err));
 }catch(err){
  console.warn('Push subscribe failed',err);
  toast('Chưa đăng ký được Push khi đóng web; cảnh báo khi mở web vẫn hoạt động. '+(err?.message||''));
  draw();
 }
}
async function disablePhonePush(){
 if(!canPush())return;
 try{
  const reg=await navigator.serviceWorker.ready;
  const sub=await reg.pushManager.getSubscription();
  if(sub){
   await pushService({action:'unsubscribe',endpoint:sub.endpoint});
   await sub.unsubscribe();
  }
  state.pushEnabled=false;draw();toast('Đã tắt thông báo đẩy trên thiết bị này.');
 }catch(e){toast('Không thể tắt thông báo: '+e.message)}
}
async function resumeDevicePush(){
 if(!canPush()||!state.user||Notification.permission!=='granted')return;
 try{
  const reg=await navigator.serviceWorker.ready;
  const sub=await reg.pushManager.getSubscription();
  if(!sub)return;
  await pushService({action:'subscribe',subscription:sub.toJSON(),user_agent:navigator.userAgent});
  state.pushEnabled=true;
  if(state.screen==='account'||state.screen==='alerts')draw();
  maybeDispatchPendingPush();
 }catch(e){console.warn('Push device resync failed',e)}
}
function maybeDispatchPendingPush(){
 if(!CLOUD||!state.user||!state.user.active||state.user.must_change_password)return;
 if(Date.now()-lastPendingPushCheck<5*60000)return;
 lastPendingPushCheck=Date.now();
 pushService({action:'dispatch_pending'}).catch(err=>console.warn('Push outbox check',err));
}
function showNewWorkPopup(n){
 const t=getTask(n.task_id);
 if(!t||!n.task_id)return;
 document.querySelector('.work-push-popup')?.remove();
 const urgent=t.priority==='high';
 const box=document.createElement('div');
 box.className='work-push-popup'+(urgent?' urgent':'');
 box.setAttribute('role','alert');
 box.innerHTML='<div class="work-push-heading">'+(urgent?'🚨 ƯU TIÊN CAO':'📋 CÔNG VIỆC BÌNH THƯỜNG')
  +'<button class="work-push-dismiss" type="button" aria-label="Đóng">×</button></div>'
  +'<strong>'+esc(t.title)+'</strong><small>Hạn hoàn thành: '+esc(fmt(t.due_at))
  +'</small><button type="button" class="work-push-open">Xem công việc</button>';
 document.body.appendChild(box);
 const close=()=>box.remove();
 box.querySelector('.work-push-dismiss').addEventListener('click',close);
 box.querySelector('.work-push-open').addEventListener('click',()=>{close();openPushedTask(t.id)});
 setTimeout(()=>{if(box.isConnected)box.remove()},16000);
}
async function openPushedTask(taskId){
 if(!state.user||!state.data)return;
 if(new URLSearchParams(location.search).has('task'))history.replaceState(null,'',location.pathname);
 if(!getTask(taskId)){await refresh()}
 if(getTask(taskId)){
  state.screen='tasks';state.modal={type:'detail',taskId};draw();
  await signEvidence().catch(()=>{});
 }else{state.screen='alerts';draw()}
}

function manager(){return state.user?.role==='manager'}
function admin(){return manager()&&state.user?.is_admin===true&&state.user?.employee_code==='112191'}
function supervisor(){return manager()||state.user?.role==='shift_lead'}
function roleName(p){return p?.is_admin?'Admin':p?.role==='manager'?'Quản Lý':p?.role==='shift_lead'?'Trưởng Ca':'Nhân Viên'}
function users(){return state.data?.profiles.filter(x=>x.role==='staff'&&x.active)||[]}
function getTask(taskId){return state.data.tasks.find(t=>t.id===taskId)}
function taskAssignments(taskId){return state.data.assignments.filter(a=>a.task_id===taskId)}
function findUser(uid){return state.data.profiles.find(p=>p.id===uid)||{full_name:'Nhân viên',employee_code:''}}
function personLabel(p){return p.employee_code?`${p.employee_code} · ${p.full_name}`:p.full_name}
function myNotifications(){return (state.data?.notifications||[]).filter(n=>n.recipient_id===state.user?.id)}
function statusBadge(st){return `<span class="badge ${esc(st)}">${NAMES[st]||esc(st)}</span>`}
function myRows(){const assigns=supervisor()?state.data.assignments:state.data.assignments.filter(a=>a.staff_id===state.user.id);return assigns.map(a=>({a,t:getTask(a.task_id)})).filter(row=>row.t).sort((x,y)=>new Date(x.t.due_at)-new Date(y.t.due_at))}
function stats(){const rows=myRows();return {total:rows.length,approved:rows.filter(x=>x.a.status==='approved').length,submitted:rows.filter(x=>x.a.status==='submitted').length,overdue:rows.filter(x=>isLate(x.a,x.t)).length,todo:rows.filter(x=>x.a.status==='todo'||x.a.status==='rejected').length}}
function peopleLine(taskId){let a=taskAssignments(taskId);return `${a.length} người được giao · ${a.filter(x=>x.status==='approved').length} đã duyệt`}
function taskCard(t,a=null){const ass=a||taskAssignments(t.id)[0]||{status:'todo'};const st=a?assignStatus(a,t):taskAssignments(t.id).some(x=>x.status==='submitted')?'submitted':taskAssignments(t.id).every(x=>x.status==='approved')?'approved':taskAssignments(t.id).some(x=>isLate(x,t))?'overdue':'todo';
 return `<article class="task-card" role="button" tabindex="0" data-action="detail" data-id="${esc(t.id)}">
 <div class="task-symbol">${ic(STATUS_ICON[st]||'clipboard')}</div><div class="task-body"><div class="task-title">${esc(t.title)}</div>
 <div class="meta"><span>${ic('calendar')}${fmt(t.due_at)}</span><span>${ic('users')}${esc(a?personLabel(findUser(a.staff_id)):peopleLine(t.id))}</span>${t.recurring_template_id?`<span>${ic('repeat')}Hằng ngày</span>`:''}${t.priority==='high'?'<span class="task-priority-label high">🚨 ƯU TIÊN CAO</span>':'<span class="task-priority-label">BÌNH THƯỜNG</span>'}</div></div>${statusBadge(st)}${admin()?`<button type="button" class="task-delete-button" data-action="delete-task" data-id="${esc(t.id)}" title="Xóa vĩnh viễn công việc">${ic('trash')} Xóa</button>`:''}</article>`}
function navEntries(){return manager()?[
 ['home','Tổng quan','home'],['tasks','Công việc','list'],['create','Giao việc','plus'],['approvals','Duyệt việc','shield'],['recurring','Lặp hằng ngày','repeat'],['stats','Thống kê','chart'],['team','Nhân viên','users'],['shops','Quản lý SHOP','users'],['inventory40','Kiểm kê 4.0','camera'],['quote40','Báo giá','receipt'],...(admin()?[['accounts','Tài khoản SHOP chính','shield']]:[]),['alerts','Thông báo','bell'],['account','Tài khoản','user']]:
 supervisor()?[
 ['home','Tổng quan','home'],['tasks','Công việc','list'],['create','Giao việc','plus'],['approvals','Duyệt việc','shield'],['team','Nhân viên','users'],['inventory40','Kiểm kê 4.0','camera'],['quote40','Báo giá','receipt'],['alerts','Thông báo','bell'],['account','Tài khoản','user']]:
 [['home','Tổng quan','home'],['tasks','Việc của tôi','list'],['inventory40','Kiểm kê 4.0','camera'],['quote40','Báo giá','receipt'],['alerts','Thông báo','bell'],['account','Tài khoản','user']];}
function bottomItems(){return supervisor()?[['home','Trang chủ','home'],['tasks','Công việc','list'],['create','Giao việc','plus'],['approvals','Duyệt','shield'],['more','Thêm','more']]:[['home','Trang chủ','home'],['tasks','Công việc','list'],['quote40','Báo giá','receipt'],['alerts','Thông báo','bell'],['account','Tài khoản','user']];}
const desktopNav=()=>navEntries().map(([k,label,icon])=>`<button class="${state.screen===k?'active':''}" data-action="navigate" data-screen="${k}">${ic(icon)}${esc(label)}${k==='alerts'&&myNotifications().some(x=>!x.read_at)?'<span class="badge">Mới</span>':''}</button>`).join('');
function headerTitle(){return ({quote40:'Báo giá',inventory40:'Kiểm kê 4.0',shops:'Quản lý SHOP',home:'Tổng quan',tasks:supervisor()?'Danh sách công việc':'Công việc của tôi',create:'Giao công việc mới',approvals:'Duyệt công việc',recurring:'Công việc hằng ngày',stats:'Báo cáo & thống kê',team:'Nhân sự siêu thị',accounts:'Quản lý tài khoản',alerts:'Thông báo',account:'Tài khoản',more:'Tiện ích quản lý'})[state.screen]||'Tổng quan'}
function appShell(content){const unread=myNotifications().filter(n=>!n.read_at).length;return `<div class="layout"><aside class="sidebar"><div class="brand"><div class="logo">W</div><div><strong>112191 WORK</strong><small>Quản lý công việc siêu thị</small></div></div><nav class="menu">${desktopNav()}</nav><div class="sidefoot">ĐỒNG BỘ TRỰC TUYẾN · MULTI SHOP<br>112191 WORK · Phiên bản v3.2.2 LOGIN</div></aside><main class="content">
 <div class="topbar"><div><div class="eyebrow">112191 WORK / ${roleName(state.user)}</div><h1>${headerTitle()}</h1></div><div class="toptools"><button class="round-btn" data-action="navigate" data-screen="alerts" title="Thông báo">${ic('bell')}${unread?'<i class="dot"></i>':''}</button><button class="avatar" data-action="navigate" data-screen="account">${esc((state.user?.full_name||'W').trim()[0])}</button></div></div>
 ${!CLOUD?`<div class="notice note-amber" style="margin-bottom:15px">${ic('info')}<div><b>Chế độ dùng thử:</b> dữ liệu chỉ lưu trong trình duyệt này, chưa đồng bộ giữa các iPhone. Muốn dùng chung cần kết nối Supabase theo tài liệu trong gói mã nguồn.</div></div>`:''}
 ${state.shops?.length?`<div style="margin:0 0 15px;display:flex;align-items:center;gap:10px"><label for="activeShop" style="font-size:12px;font-weight:700;flex-shrink:0">SHOP:</label><select id="activeShop" aria-label="Chọn SHOP cần quản lý" style="min-width:0;flex:1;background:white;border:1px solid #dbe3f0;border-radius:12px;padding:11px;font-weight:700;color:#243b6b">${state.shops.map(s=>`<option value="${esc(s.id)}" ${s.id===state.shopId?'selected':''}>${esc(shopLabel(s))}</option>`).join('')}</select></div>`:''}
 ${content}<div class="footbar">112191 WORK · Built for store teams</div></main>
 <nav class="bottomnav">${bottomItems().map(([key,label,icon])=>`<button class="${state.screen===key?'on':''} ${key==='create'?'primary-nav':''}" data-action="navigate" data-screen="${key}">${ic(icon)}<span>${label}</span></button>`).join('')}</nav></div>${state.modal?modalHtml():''}`}
function displayStat(n,label,icon,extra=''){return `<div class="stat-card"><div class="stat-icon">${ic(icon)}</div><div class="stat-number">${n}</div><div class="stat-label">${label}</div>${extra?`<div class="stat-desc">${extra}</div>`:''}</div>`}
function empty(title,desc,icon='clipboard'){return `<div class="empty">${ic(icon)}<h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`}
function homeView(){const s=stats();let pending=myRows().filter(x=>supervisor()?x.a.status==='submitted':x.a.status!=='approved').slice(0,4);
 const percent=s.total?Math.round(s.approved/s.total*100):0;
 return `<div class="stack"><div class="hero"><div><div style="font-size:11px;color:#b4d3ff">CHÀO MỪNG TRỞ LẠI</div><h2>${esc(state.user.full_name)}</h2><p>${supervisor()?'Giao việc tập trung, duyệt phiếu và theo dõi tiến độ nhân viên.':'Kiểm tra nhiệm vụ hôm nay, báo cáo bằng hình ảnh và theo dõi kết quả duyệt.'}</p></div>${supervisor()?`<button class="btn white" data-action="navigate" data-screen="create">${ic('plus')} Giao việc</button>`:''}</div>
 <div class="stats">${displayStat(s.total,'Tổng lượt giao','clipboard')}${displayStat(s.approved,'Đã duyệt','checkcircle')}${displayStat(s.submitted,'Chờ duyệt','camera')}${displayStat(s.overdue,'Quá hạn','warning')}</div>
 <div class="split"><section class="panel"><div class="panel-head"><div><h2>${supervisor()?'Báo cáo chờ duyệt':'Công việc cần xử lý'}</h2><div class="subtitle">${supervisor()?'Danh sách báo cáo đang chờ duyệt':'Những nhiệm vụ chưa được duyệt'}</div></div><button class="btn sm outline" data-action="navigate" data-screen="${manager()?'approvals':'tasks'}">Xem tất cả ${ic('chevron')}</button></div>
 <div class="task-list">${pending.length?pending.map(x=>taskCard(x.t,x.a)).join(''):empty('Không có việc tồn','Các công việc đang được xử lý đúng tiến độ.','checkcircle')}</div></section>
 <section class="panel"><div class="panel-head"><div><h2>Tiến độ hoàn thành</h2><div class="subtitle">Dựa trên số lượt giao đã được duyệt</div></div></div><div style="display:flex;align-items:center;justify-content:space-between;margin:17px 0"><div><div style="font-size:36px;font-weight:850;letter-spacing:-1px">${percent}%</div><div class="subtitle">${s.approved}/${s.total} lượt công việc</div></div><div style="width:85px;height:85px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#1456dc ${percent}%, #edf2fb 0);"><div style="border-radius:50%;background:#fff;width:63px;height:63px;display:grid;place-items:center;color:#1456dc">${ic('chart')}</div></div></div><div class="progress"><span style="width:${percent}%"></span></div><div class="subtitle" style="margin-top:14px">Chỉ tính hoàn thành sau khi quản lý duyệt đạt.</div></section></div>
 </div>`}
function tasksView(){const q=state.search.toLowerCase().trim();let taskList=supervisor()?state.data.tasks.map(t=>({t})):myRows();
 if(q)taskList=taskList.filter(({t,a})=>`${t.title} ${t.category||''} ${a?personLabel(findUser(a.staff_id)):''}`.toLowerCase().includes(q));
 if(state.filter!=='all')taskList=taskList.filter(({t,a})=>{const aa=a||taskAssignments(t.id);return (Array.isArray(aa)?aa:[aa]).some(x=>assignStatus(x,t)===state.filter)});
 taskList.sort((x,y)=>new Date(x.t.due_at)-new Date(y.t.due_at));
 return `<div class="panel"><div class="toolbar"><div class="filter-search">${ic('search')}<input id="taskSearch" placeholder="Tìm tên công việc..." value="${esc(state.search)}" aria-label="Tìm công việc" /></div>${supervisor()?`<button class="btn" data-action="navigate" data-screen="create">${ic('plus')} Giao việc</button>`:''}</div>
 <div class="toolbar"><div class="tabs">${[['all','Tất cả'],['todo','Chưa làm'],['submitted','Chờ duyệt'],['approved','Đã duyệt'],['overdue','Quá hạn']].map(([val,label])=>`<button class="tab ${state.filter===val?'on':''}" data-action="filter" data-status="${val}">${label}</button>`).join('')}</div><div class="selected-counter">${taskList.length} công việc</div></div>
 <div class="task-list">${taskList.length?taskList.map(({t,a})=>taskCard(t,a)).join(''):empty('Không tìm thấy công việc','Thử tìm từ khóa khác hoặc chuyển bộ lọc.','search')}</div></div>`}
function createView(){if(!supervisor())return empty('Không có quyền','Chỉ trưởng ca hoặc quản lý được giao nhiệm vụ.','lock');const people=users().filter(p=>p.active);
 return `<section class="panel"><div class="panel-head"><div><h2>Thông tin nhiệm vụ</h2><div class="subtitle">Lựa chọn nhân viên và thời hạn hoàn thành</div></div></div>
 <form id="createTaskForm" class="stack" novalidate><div id="createTaskError" class="form-error" role="alert" hidden></div><div class="form-grid"><div class="form-field span-all"><label for="taskTitle">Tên công việc *</label><input id="taskTitle" name="title" required maxlength="180" placeholder="Ví dụ: Kiểm tra trưng bày quầy tivi" /></div>
 <div class="form-field span-all"><label for="taskDescription">Nội dung chi tiết</label><textarea id="taskDescription" name="description" maxlength="2000" placeholder="Yêu cầu thực hiện, tiêu chuẩn kiểm tra, hình ảnh cần chụp..."></textarea></div>
 <div class="form-field"><label>Nhóm công việc</label><select name="category"><option>Trưng bày</option><option>Kiểm tra</option><option>Vệ sinh</option><option>Kho</option><option>Công Việc Siêu Thị</option><option>Khác</option></select></div>
 <div class="form-field"><label>Mức ưu tiên</label><select name="priority"><option value="normal">Bình thường</option><option value="high">Ưu tiên cao</option></select></div>
 <div class="form-field span-all"><label for="deadline">Hạn hoàn thành *</label><input id="deadline" type="datetime-local" name="due" value="${toDateInput(addHours(3))}" required /></div></div>
 <div><div class="row space" style="margin-bottom:10px"><span class="mini-label">Giao cho nhân viên *</span><button type="button" class="btn outline sm" data-action="toggle-all-assignees">Chọn / bỏ chọn tất cả</button></div>
 <div class="employee-grid">${people.map(p=>`<label class="selection"><input type="checkbox" class="assignee" value="${esc(p.id)}" /><span class="main"><b>${esc(p.full_name)}</b><small>Mã NV: ${esc(p.employee_code||'Chưa có')}</small></span></label>`).join('')}</div></div>
 ${manager()?`<label class="selection" style="background:#f2f7ff"><input type="checkbox" name="daily" id="dailyToggle" /><span class="main"><b>${ic('repeat')} Lặp lại hằng ngày</b><small>Tự tạo một lượt nhiệm vụ mới mỗi ngày</small></span></label>`:''}
 <div class="notice">${ic('camera')}<div>Nhân viên phải gửi ít nhất <b>1 ảnh</b> minh chứng. Chỉ Trưởng ca hoặc Quản lý được duyệt đạt. Quản lý có thể bật lịch lặp hằng ngày.</div></div>
 <button type="submit" class="btn full" id="taskSubmit">${ic('plus')} Tạo và giao công việc</button></form></section>`}
function approvalsView(){if(!supervisor())return empty('Không có quyền','Chỉ trưởng ca hoặc quản lý được duyệt.','lock');const rows=myRows().filter(x=>x.a.status==='submitted');return `<section class="panel"><div class="panel-head"><div><h2>Báo cáo chờ duyệt</h2><div class="subtitle">Xem ảnh và đánh giá từng nhân viên</div></div><span class="badge submitted">${rows.length} chờ xử lý</span></div><div class="task-list">${rows.length?rows.map(({t,a})=>taskCard(t,a)).join(''):empty('Đã xử lý hết','Hiện không có báo cáo nào đang chờ duyệt.','checkcircle')}</div></section>`}
function recurringView(){if(!manager())return empty('Không có quyền','Chỉ quản lý quản lý lịch lặp.','lock');return `<div class="stack"><section class="notice">${ic('repeat')}<div>Nhiệm vụ lặp tạo một lượt mới mỗi ngày, lưu lịch sử độc lập. Khi dùng chung trên Supabase, cần bật lịch Cron bằng file SQL kèm theo để chạy ngay cả khi không ai mở app.</div></section><div class="panel"><div class="panel-head"><div><h2>Danh sách công việc định kỳ</h2><div class="subtitle">Các lịch hằng ngày đã tạo từ mục Giao việc</div></div><button class="btn outline sm" data-action="generate-today">${ic('refresh')} Tạo việc hôm nay</button></div>
 ${state.data.recurring_templates.length?state.data.recurring_templates.map(r=>`<div class="assignment"><div class="row space"><strong style="font-size:13px">${esc(r.title)}</strong><span class="badge ${r.active?'approved':'todo'}">${r.active?'Đang bật':'Đã tắt'}</span></div><div class="meta" style="margin:9px 0">${ic('clock')} Hằng ngày · ${esc(r.due_time?.slice(0,5))} · ${state.data.recurring_members.filter(m=>m.template_id===r.id).length} nhân viên</div><button class="btn sm outline" data-action="toggle-recurrence" data-id="${esc(r.id)}">${r.active?'Tạm dừng':'Bật lại'}</button></div>`).join(''):empty('Chưa có lịch định kỳ','Vào Giao việc và chọn “Lặp lại hằng ngày”.','repeat')}</div></div>`}
function statsView(){if(!manager())return empty('Không có quyền','Chỉ quản lý xem thống kê tổng.','lock');const data=users().map(p=>{const rows=myRows().filter(x=>x.a.staff_id===p.id);const done=rows.filter(x=>x.a.status==='approved').length;return {p,done,total:rows.length,pct:rows.length?Math.round(done/rows.length*100):0}}).sort((a,b)=>b.pct-a.pct);
 const s=stats();return `<div class="stack"><div class="stats">${displayStat(s.total,'Lượt giao việc','clipboard')}${displayStat(s.approved,'Đã duyệt','checkcircle')}${displayStat(s.submitted,'Chờ duyệt','camera')}${displayStat(s.overdue,'Quá hạn','warning')}</div><section class="panel"><div class="panel-head"><div><h2>Tiến độ theo nhân viên</h2><div class="subtitle">Tỷ lệ duyệt đạt trên tổng số lượt được giao</div></div><button class="btn outline sm" data-action="export-csv">${ic('download')} Xuất CSV</button></div>
 ${data.map(({p,done,total,pct})=>`<div class="progress-row"><div class="line"><b>${esc(personLabel(p))}</b><span>${done}/${total} · ${pct}%</span></div><div class="progress ${pct>=80?'good':''}"><span style="width:${pct}%"></span></div></div>`).join('')}</section></div>`}
function teamView(){
 if(!supervisor())return empty('Không có quyền','Chỉ trưởng ca hoặc quản lý được xem danh sách nhân sự.','lock');
 const active=(state.data?.profiles||[]).filter(p=>p.active);
 const leaders=active.filter(p=>p.role==='manager'||p.role==='shift_lead');
 const workers=active.filter(p=>p.role==='staff');
 return `<div class="stack">
 <div class="notice">${ic('info')}<div><b>${leaders.length} quản lý/trưởng ca</b> · <b>${workers.length} nhân viên đang hoạt động</b>. Admin 112191 là chủ quản trị cao nhất; tài khoản đã lưu trữ không xuất hiện tại đây.</div></div>
 <section class="panel"><div class="panel-head"><div><h2>Danh sách nhân sự</h2><div class="subtitle">Chỉ hiển thị người đang hoạt động</div></div>${manager()?`<button class="btn sm" data-action="navigate" data-screen="shops">${ic('plus')} Thêm nhân viên</button>`:''}</div><div class="person-list">
 ${leaders.map(p=>`<div class="person-row"><span class="initial">${esc((p.full_name||'?')[0])}</span><div class="info"><strong>${esc(p.full_name)}</strong><small>${esc(p.employee_code)} · ${roleName(p)} · Đang hoạt động</small></div><span class="badge approved">${roleName(p)}</span></div>`).join('')}
 ${workers.map(p=>`<div class="person-row"><span class="initial">${esc((p.full_name||'?')[0])}</span><div class="info"><strong>${esc(p.full_name)}</strong><small>Mã NV: ${esc(p.employee_code||'—')} · Nhân Viên</small></div><span class="badge approved">Hoạt động</span>${manager()?`<button class="btn sm outline" data-action="navigate" data-screen="shops">Quản lý trong SHOP</button>`:''}</div>`).join('')}
 </div></section></div>`;
}

function accountsView(){
 if(!admin())return empty('Không có quyền','Chỉ Admin 112191 được quản lý tài khoản toàn hệ thống.','lock');
 const rows=state.staffAccounts?.accounts||users(),events=state.staffAccounts?.events||[],active=rows.filter(p=>p.active).length,tab=state.staffAccountFilter==='archived'?'archived':'active',shownRows=rows.filter(p=>tab==='active'?p.active:!p.active);
 return `<div class="stack">
 <div class="notice">${ic('shield')}<div><b>Tài khoản SHOP chính (97 - ĐMX 102 LÊ VĂN KHƯƠNG)</b> · ${active} hoạt động / ${rows.length} tài khoản (không gồm Admin 112191). Không xóa lịch sử nhiệm vụ khi khóa người dùng. Mật khẩu riêng của nhân viên không thể xem lại.</div></div>
 ${state.staffAccountsError?`<div class="notice note-amber">${ic('warning')}<div>API quản trị chưa sẵn sàng: ${esc(state.staffAccountsError)}. Có thể xem danh sách, nhưng chưa thể tạo hoặc đặt lại mật khẩu.</div></div>`:''}
 ${state.oneTimeCredential?`<section class="panel"><div class="panel-head"><h2>Mật khẩu tạm thời · Chỉ hiển thị một lần</h2></div><p>Gửi riêng cho mã NV ${esc(state.oneTimeCredential.code)} và yêu cầu đổi ngay sau đăng nhập.</p><div class="row"><input aria-label="Mật khẩu tạm thời" readonly value="${esc(state.oneTimeCredential.password)}"><button class="btn" data-action="copy-temp-password">${ic('save')} Sao chép</button></div><button class="btn outline sm" data-action="dismiss-temp-password">Đóng và xóa khỏi màn hình</button></section>`:''}
 <section class="panel"><div class="panel-head"><div><h2>Thêm tài khoản theo vị trí</h2><div class="subtitle">Anh tự đặt mật khẩu ban đầu hoặc để hệ thống tạo tự động. Nhân viên phải đổi khi đăng nhập lần đầu.</div></div></div><form id="createStaffForm" class="stack"><div class="form-grid">
 <div class="form-field"><label for="newStaffCode">Mã NV *</label><input id="newStaffCode" name="code" pattern="[0-9]{4,8}" maxlength="8" required placeholder="Ví dụ: 257406"></div>
 <div class="form-field"><label for="newStaffName">Họ và tên *</label><input id="newStaffName" name="fullName" maxlength="120" required placeholder="Họ tên nhân viên"></div>
 <div class="form-field"><label for="newStaffRole">Chọn vị trí *</label><select id="newStaffRole" name="role" required><option value="staff">Nhân Viên</option><option value="shift_lead">Trưởng Ca</option>${admin()?'<option value="manager">Quản Lý</option>':''}</select></div>
 <div class="form-field"><label for="newStaffPassword">Mật khẩu ban đầu (tùy chọn)</label><input id="newStaffPassword" name="password" type="password" autocomplete="new-password" minlength="10" maxlength="72" placeholder="Để trống để hệ thống tạo"/></div></div>
 <p class="fineprint">Mật khẩu tự đặt: 10–72 ký tự, có cả chữ và số, không chứa mã nhân viên. Hệ thống không lưu mật khẩu dạng văn bản; chỉ hiển thị lại một lần khi tạo tài khoản.</p>
 <button class="btn" type="submit" ${!state.staffAccounts?'disabled':''}>${ic('plus')} Thêm tài khoản</button></form></section>
 <section class="panel"><div class="panel-head"><div><h2>Danh sách tài khoản</h2><div class="subtitle">${active} đang làm việc · ${rows.length-active} đã lưu trữ. Không xóa lịch sử công việc.</div></div><button class="btn outline sm" data-action="refresh-accounts">${ic('refresh')} Làm mới</button></div><div class="row" style="gap:8px;margin:12px 0"><button class="btn sm ${tab==='active'?'':'outline'}" data-action="account-filter" data-filter="active">Đang hoạt động (${active})</button><button class="btn sm ${tab==='archived'?'':'outline'}" data-action="account-filter" data-filter="archived">Đã xóa / lưu trữ (${rows.length-active})</button></div><div class="person-list">
 ${shownRows.map(p=>`<div class="person-row"><span class="initial">${esc((p.full_name||'?')[0])}</span><div class="info"><strong>${esc(p.full_name||'Chưa đặt tên')}</strong><small>Mã tài khoản: ${esc(p.employee_code||'—')} · <b>${roleName(p)}</b> · ${p.active?'Hoạt động':'Đã khóa'} · Tạo: ${esc(p.created_at?fmt(p.created_at):'—')}</small><small>Đổi MK gần nhất: ${esc(p.password_changed_at?fmt(p.password_changed_at):'Chưa có nhật ký')} · Đăng nhập: ${esc(p.last_sign_in_at?fmt(p.last_sign_in_at):'—')}</small></div><span class="badge ${p.active?'approved':'todo'}">${p.active?'Hoạt động':'Đã khóa'}</span>${admin()?`<button class="btn sm outline" data-action="edit-staff-role" data-id="${esc(p.id)}">Đổi vị trí</button>`:''}${state.staffAccounts&&(admin()||p.role!=='manager')?`<button class="btn sm outline" data-action="edit-staff-name" data-id="${esc(p.id)}">Sửa tên</button><button class="btn sm outline" data-action="reset-staff-password" data-id="${esc(p.id)}">Đặt lại MK</button><button class="btn sm ${p.active?'danger':'outline'}" data-action="toggle-staff-account" data-id="${esc(p.id)}">${p.active?'Xóa (lưu trữ)':'Khôi phục'}</button>${admin()?`<button class="btn danger sm" data-action="delete-staff" data-id="${esc(p.id)}" ${state.staffDeleting?'disabled':''}>Xóa tài khoản</button>`:''}`:''}</div>`).join('')}</div></section>
 <section class="panel"><div class="panel-head"><div><h2>Nhật ký quản trị tài khoản</h2><div class="subtitle">Không ghi mật khẩu, chỉ ghi sự kiện thay đổi</div></div></div><div class="person-list">${events.length?events.map(x=>`<div class="person-row"><div class="info"><strong>${esc(x.action||'Cập nhật')}</strong><small>Mã NV: ${esc(x.employee_code||'—')} · ${esc(x.created_at?fmt(x.created_at):'—')}</small></div></div>`).join(''):'<div class="subtitle">Chưa có sự kiện quản trị.</div>'}</div></section>
 </div>`;
}
async function taskAdminRequest(body){
 if(!admin()||!CLOUD)throw new Error('Chỉ Admin 112191 được xóa công việc.');
 await ensureFreshToken();
 const resp=await fetch(BASE+'/functions/v1/manage-tasks',{
  method:'POST',headers:{apikey:ANON,Authorization:'Bearer '+state.session.access_token,
   'Content-Type':'application/json'},body:JSON.stringify(body)
 });
 let data={};try{data=await resp.json()}catch{}
 if(!resp.ok)throw new Error(data.error||'Không xử lý được yêu cầu xóa công việc');
 return data;
}
async function deleteTaskForever(taskId){
 if(!admin())return;
 const task=getTask(taskId);if(!task)return;
 try{
  const info=await taskAdminRequest({action:'preview',task_id:taskId});
  const p=info.preview;
  if(!p||p.task_id!==taskId)throw new Error('Không tải được thông tin công việc');
  const title=String(p.title||task.title);
  const prompt=[
   'XÓA VĨNH VIỄN CÔNG VIỆC: '+title,
   '• '+p.assignments+' lượt giao/báo cáo sẽ bị xóa.',
   '• '+p.notifications+' thông báo liên quan sẽ bị xóa.',
   '• '+p.photos+' ảnh minh chứng sẽ bị xóa.',
   ...(p.is_recurring_occurrence?['• Lịch lặp hằng ngày vẫn giữ; chỉ xóa lượt công việc này.']:[]),
   '',
   'Thao tác không thể hoàn tác. Anh xác nhận xóa?'
  ].join('\n');
  // A click on Xóa is sufficient; no extra confirmation.

  const r=await taskAdminRequest({action:'delete',task_id:taskId,confirm:true,
   expected:{assignments:p.assignments,photos:p.photos}});
  state.modal=null;await loadCloud();draw();
  toast(r.warning?'Đã xóa công việc. '+r.warning:'Đã xóa vĩnh viễn công việc và các lượt giao liên quan.');
 }catch(err){toast('Không xóa được công việc: '+(err?.message||'Lỗi không xác định'));}
}

async function staffAdminRequest(body){
 if(!manager()||!CLOUD)throw new Error('Không có quyền quản lý');
 await ensureFreshToken();
 const res=await fetch(`${BASE}/functions/v1/manage-staff`,{method:'POST',headers:{apikey:ANON,Authorization:`Bearer ${state.session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
 let data={};try{data=await res.json()}catch{}
 if(!res.ok)throw new Error(data.error||data.message||`Lỗi máy chủ ${res.status}`);
 return data;
}
async function loadStaffAdmin(){
 if(!manager()||!CLOUD)return;
 state.staffAccountsLoading=true;
 try{state.staffAccounts=await staffAdminRequest({action:'list'});state.staffAccountsError=''}
 catch(e){state.staffAccounts=null;state.staffAccountsError=e.message}
 finally{state.staffAccountsLoading=false;if(state.screen==='accounts')draw()}
}
async function createStaff(e){
 e.preventDefault();if(!manager()||!state.staffAccounts)return;
 const form=e.target,fd=new FormData(form),code=String(fd.get('code')||'').trim(),name=String(fd.get('fullName')||'').trim(),password=String(fd.get('password')||''),role=String(fd.get('role')||'staff');
 if(!/^[0-9]{4,8}$/.test(code)||name.length<2||!['staff','shift_lead','manager'].includes(role)||(role==='manager'&&!admin())){toast('Kiểm tra mã tài khoản, họ tên hoặc vị trí.');return}
 const btn=form.querySelector('[type="submit"]');btn.disabled=true;
 try{const response=await staffAdminRequest({action:'create',employee_code:code,full_name:name,role,...(password?{temporary_password:password}:{})});state.oneTimeCredential={code,password:response.temporary_password};state.staffAccountFilter='active';await loadCloud();await loadStaffAdmin();toast('Đã tạo tài khoản '+({staff:'Nhân Viên',shift_lead:'Trưởng Ca',manager:'Quản Lý'}[role])+'. Gửi mật khẩu riêng cho người dùng.')}
 catch(e){toast('Không thêm được nhân viên: '+e.message);btn.disabled=false}
}
async function changeStaffActive(uid){
 if(!manager()||!state.staffAccounts)return;
 const p=state.staffAccounts.accounts.find(p=>p.id===uid);if(!p)return;

 try{await staffAdminRequest({action:'set_active',user_id:uid,active:!p.active});await loadCloud();await loadStaffAdmin();toast('Đã cập nhật trạng thái tài khoản.')}catch(e){toast(e.message)}
}
async function deleteStaffForever(uid){
 if(!admin()||state.staffDeleting)return;
 const p=(state.staffAccounts?.accounts||[]).find(x=>x.id===uid);
 if(!p||p.is_admin)return;
 state.staffDeleting=uid;draw();
 try{
  // Server validates the sole Super Admin identity and performs hard deletion.
  // No code input and no intermediate archive step needed in the UI.
  const r=await staffAdminRequest({action:'delete',user_id:uid,
   confirm_code:p.employee_code,ack_delete_history:true});
  if(!r.deleted)throw new Error('Tài khoản chưa được xóa');
  await loadCloud();await loadStaffAdmin();draw();
  toast('Đã xóa vĩnh viễn tài khoản '+p.employee_code+' tại toàn bộ SHOP.');
 }catch(e){toast('Không xóa được tài khoản: '+e.message)}
 finally{state.staffDeleting=null;draw()}
}
async function deleteMemberFromShop(uid){
 if(!manager()||!state.shopId||state.staffDeleting)return;
 const m=(state.shopMembers||[]).find(x=>x.user_id===uid);
 if(!m||m.profile?.is_admin)return;
 state.staffDeleting=uid;draw();
 try{
  const r=await shopAdminRequest({action:'remove_member',shop_id:state.shopId,user_id:uid});
  if(!r.removed)throw new Error('Chưa xóa khỏi SHOP');
  await loadCloud();await loadShopMembers();
  toast('Đã xóa '+(m.profile?.employee_code||'nhân sự')+' khỏi SHOP này.');
 }catch(e){toast('Không xóa khỏi SHOP: '+e.message)}
 finally{state.staffDeleting=null;draw()}
}
async function deleteMemberAccount(uid){
 if(!admin()||state.staffDeleting)return;
 const m=(state.shopMembers||[]).find(x=>x.user_id===uid);
 if(!m||m.profile?.is_admin)return;
 state.staffDeleting=uid;draw();
 try{
  const code=m.profile?.employee_code||'';
  if(!code)throw new Error('Không xác định được mã nhân viên');
  const r=await staffAdminRequest({action:'delete',user_id:uid,confirm_code:code,
   ack_delete_history:true});
  if(!r.deleted)throw new Error('Tài khoản chưa được xóa');
  await loadCloud();await loadShopMembers();
  toast('Đã xóa tài khoản '+code+' khỏi toàn bộ hệ thống.');
 }catch(e){toast('Không xóa được tài khoản: '+e.message)}
 finally{state.staffDeleting=null;draw()}
}
async function resetStaffPassword(uid){
 if(!manager()||!state.staffAccounts)return;
 const p=state.staffAccounts.accounts.find(p=>p.id===uid);if(!p)return;
 state.modal={type:'staff-reset',uid};draw();
}
async function editStaffRole(uid){
 if(!admin()||!state.staffAccounts)return;
 const p=state.staffAccounts.accounts.find(p=>p.id===uid);
 if(!p||p.is_admin)return;
 state.modal={type:'staff-role',uid};draw();
}
async function submitStaffRole(e){
 e.preventDefault();if(!admin()||!state.staffAccounts)return;
 const f=e.target,uid=f.dataset.id,role=String(new FormData(f).get('role')||'');
 if(!['staff','shift_lead','manager'].includes(role)){toast('Vị trí không hợp lệ');return}
 const p=state.staffAccounts.accounts.find(x=>x.id===uid);
 if(!p||p.is_admin)return;

 const btn=f.querySelector('[type=submit]');btn.disabled=true;
 try{await staffAdminRequest({action:'set_role',user_id:uid,role});state.modal=null;await loadCloud();await loadStaffAdmin();draw();toast('Đã cập nhật vị trí thành công.')}
 catch(err){toast('Không thay đổi được vị trí: '+err.message);btn.disabled=false}
}
async function editStaffName(uid){
 if(!manager()||!state.staffAccounts)return;
 const p=state.staffAccounts.accounts.find(p=>p.id===uid);if(!p)return;
 state.modal={type:'staff-edit',uid};draw();
}
async function submitStaffReset(e){
 e.preventDefault();if(!manager()||!state.staffAccounts)return;
 const f=e.target,uid=f.dataset.id,p=state.staffAccounts.accounts.find(x=>x.id===uid);if(!p)return;
 const pw=String(new FormData(f).get('password')||'');
 if(pw&&(pw.length<10||pw.length>72||!/[A-Za-z]/.test(pw)||!/[0-9]/.test(pw)||pw.includes(p.employee_code))){
  toast('Mật khẩu cần 10–72 ký tự, gồm chữ và số, không chứa mã nhân viên.');return
 }
 const btn=f.querySelector('[type=submit]');btn.disabled=true;
 try{
  const r=await staffAdminRequest({action:'reset_password',user_id:uid,...(pw?{temporary_password:pw}:{})});
  state.modal=null;state.oneTimeCredential={code:p.employee_code,password:r.temporary_password};
  await loadStaffAdmin();draw();toast('Đã đặt lại mật khẩu. Nhân viên cần đổi lại khi đăng nhập.');
 }catch(err){toast('Không đổi được mật khẩu: '+err.message);btn.disabled=false}
}
async function submitStaffEdit(e){
 e.preventDefault();if(!manager()||!state.staffAccounts)return;
 const f=e.target,uid=f.dataset.id,p=state.staffAccounts.accounts.find(x=>x.id===uid);if(!p)return;
 const fullName=String(new FormData(f).get('fullName')||'').trim().replace(/\s+/g,' ');
 if(fullName.length<2||fullName.length>120){toast('Họ tên cần từ 2 đến 120 ký tự.');return}
 const btn=f.querySelector('[type=submit]');btn.disabled=true;
 try{
  await staffAdminRequest({action:'update_name',user_id:uid,full_name:fullName});
  state.modal=null;await loadCloud();await loadStaffAdmin();draw();toast('Đã sửa tên nhân viên.');
 }catch(err){toast('Không sửa được tên: '+err.message);btn.disabled=false}
}

function alertsView(){const items=myNotifications();return `<section class="panel">
 ${CLOUD&&!state.pushEnabled?`<div class="notice" style="margin-bottom:12px">${ic('bell')}<div><b>Thông báo khi đăng nhập bằng link web</b><p>Không cần cài app: khi mở link sẽ có popup ƯU TIÊN CAO / BÌNH THƯỜNG. Hãy bật quyền để nhận thêm thông báo của trình duyệt.</p><button class="btn sm" data-action="enable-notifs">Bật thông báo web / điện thoại</button></div></div>`:''}<div class="panel-head"><div><h2>Thông báo của bạn</h2><div class="subtitle">Việc mới, trễ hạn, báo cáo và quyết định duyệt</div></div><button class="btn outline sm" data-action="read-all">Đánh dấu đã đọc</button></div>
 <div>${items.length?items.map(n=>`<div class="notification ${n.read_at?'read':''}" data-action="read-one" data-id="${esc(n.id)}" data-task="${esc(n.task_id||'')}"><span class="bulb">${ic('bell')}</span><div style="flex:1"><strong>${esc(n.title)}</strong><p>${esc(n.body)}</p><time>${fmt(n.created_at)}</time></div>${!n.read_at?'<span style="width:7px;height:7px;background:var(--blue);border-radius:50%"></span>':''}</div>`).join(''):empty('Không có thông báo','Khi có công việc hoặc thay đổi kết quả, thông báo sẽ hiển thị ở đây.','bell')}</div></section>`}
function moreView(){
 const items=manager()?[
  ['shops','Quản lý SHOP / Nhân sự','users'],['inventory40','Kiểm kê 4.0','camera'],['quote40','Báo giá','receipt'],...(admin()?[['accounts','Tài khoản SHOP chính','shield']]:[]),['recurring','Việc lặp hằng ngày','repeat'],['stats','Thống kê tiến độ','chart'],['team','Danh sách nhân viên','users'],['alerts','Thông báo','bell'],['account','Tài khoản / Đổi mật khẩu','user']
  ]:[['inventory40','Kiểm kê 4.0','camera'],['quote40','Báo giá','receipt'],['team','Danh sách nhân viên','users'],['alerts','Thông báo','bell'],['account','Tài khoản / Đổi mật khẩu','user']];
 return `<div class="stack"><section class="panel"><div class="panel-head"><div><h2>Tiện ích ${roleName(state.user)}</h2><div class="subtitle">Truy cập nhanh</div></div></div><div class="more-menu">${items.map(([screen,title,ico])=>`<button class="more-entry" data-action="navigate" data-screen="${screen}">${ic(ico)}<span>${title}</span>${ic('chevron')}</button>`).join('')}<button class="more-entry" type="button" data-action="logout" aria-label="Đăng xuất khỏi 112191 WORK" style="color:#b91c1c;font-weight:700">${ic('logout')}<span>Đăng xuất</span>${ic('chevron')}</button></div></section></div>`;
}


function shopLabel(s){return s ? s.shop_code+' - '+s.shop_name : 'Chưa chọn SHOP'}
function shopsView(){
 if(!supervisor())return empty('Không có quyền','Bạn chưa được ủy quyền quản lý SHOP','lock');
 const selected=state.shops.find(s=>s.id===state.shopId);
 const search=(state.shopSearch||'').trim().toLowerCase();
 const filtered=state.shops.filter(s=>shopLabel(s).toLowerCase().includes(search));
 const editing=state.shops.find(s=>s.id===state.shopEditId);
 const people=(state.shopMembers||[]).map(m=>{
   const p=m.profile||{},personName=p.full_name||'Chưa đặt tên',role=m.shop_role==='manager'?'Quản lý':m.shop_role==='shift_lead'?'Trưởng ca':'Nhân viên';
   const uid=esc(m.user_id);
   return `<div class="person-row"><span class="initial">${esc(personName[0]||'?')}</span><div class="info"><strong>${esc(personName)}</strong><small>${esc(p.employee_code||'—')} · ${role} · ${m.active?'Hoạt động':'Đã lưu trữ'}</small></div>
   ${state.shopReady && !p.is_admin && m.user_id!==state.user?.id?`<div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center">
   <select id="role-${uid}" aria-label="Chọn vai trò" style="max-width:125px;border-radius:9px;border:1px solid #d8e1f0;padding:8px;font-size:12px">
    <option value="staff" ${m.shop_role==='staff'?'selected':''}>Nhân viên</option>
    <option value="shift_lead" ${m.shop_role==='shift_lead'?'selected':''}>Trưởng ca</option>
    <option value="manager" ${m.shop_role==='manager'?'selected':''}>Quản lý</option>
   </select>
   <button type="button" class="btn sm outline" data-action="shop-member-set-role" data-uid="${uid}">Lưu vai trò</button>
   <button type="button" class="btn sm outline" data-action="shop-member-reset" data-uid="${uid}">Đặt lại MK</button>
   <button type="button" class="btn sm ${m.active?'outline':'outline'}" data-action="shop-member-active" data-uid="${uid}" data-active="${m.active?'false':'true'}">${m.active?'Lưu trữ':'Kích hoạt'}</button>
   <button type="button" class="btn sm danger" data-action="shop-member-remove" data-uid="${uid}" ${state.staffDeleting?'disabled':''}>Xóa khỏi SHOP</button>
   ${admin()?'<button type="button" class="btn sm danger" data-action="shop-member-delete-account" data-uid="'+uid+'" '+(state.staffDeleting?'disabled':'')+'>Xóa tài khoản</button>':''}</div>`:''}</div>`;
 }).join('');
 return `<div class="stack">
  <section class="panel"><div class="panel-head"><div><h2>Quản lý nhiều SHOP</h2><div class="subtitle">Danh mục kho / SHOP · Thiết kế phục vụ 500 SHOP</div></div></div>
   <div class="notice">${ic('shield')}<div><b>SHOP hiện tại: ${esc(shopLabel(selected))}</b><p>Chỉ Super Admin 112191 được thêm, sửa hoặc xóa SHOP. Quản lý từng SHOP chỉ quản lý nhân viên trong phạm vi được cấp.</p></div></div>
   ${!state.shopReady?`<div class="notice note-amber">${ic('warning')}<div><b>Quản lý danh mục SHOP đã mở.</b> Anh có thể thêm mã kho và tên SHOP, sửa hoặc xóa SHOP chưa có dữ liệu. SHOP tạo mới chưa được giao việc/cấp Quản lý cho đến khi hoàn tất kiểm thử cách ly dữ liệu.</div></div>`:''}
  </section>
  ${admin()?`<section class="panel"><div class="panel-head"><div><h2>Thêm SHOP</h2><div class="subtitle">Nhập Mã kho và Tên SHOP để hiển thị dưới dạng Mã kho - Tên SHOP</div></div></div>
  <form id="newShopForm" class="stack"><div class="form-grid">
  <div class="form-field"><label for="newWarehouseCode">MÃ KHO *</label><input id="newWarehouseCode" name="code" required pattern="[A-Za-z0-9_-]{2,32}" maxlength="32" placeholder="Ví dụ: 97" autocomplete="off"></div>
  <div class="form-field"><label for="newShopName">TÊN SHOP *</label><input id="newShopName" name="name" required minlength="3" maxlength="160" placeholder="Ví dụ: ĐMX 102 LÊ VĂN KHƯƠNG"></div></div>
  <div class="notice" style="padding:11px"><span style="font-size:12px">Tên hiển thị: <b id="newShopPreview">MÃ KHO - TÊN SHOP</b></span></div>
  <button type="submit" class="btn">${ic('plus')} Thêm SHOP</button></form></section>
  <section class="panel"><div class="panel-head"><div><h2>Danh sách SHOP (${state.shops.length})</h2><div class="subtitle">Chọn để xem · Sửa mã kho/tên SHOP · Xóa an toàn</div></div></div>
  <input id="shopSearch" placeholder="Tìm theo mã kho hoặc tên SHOP..." value="${esc(state.shopSearch||'')}" style="width:100%;margin-bottom:12px;border:1px solid #dbe3f0;padding:11px;border-radius:10px"/>
  <div class="person-list">${filtered.slice(0,100).map(sh=>`<div class="person-row" style="display:flex;gap:8px;flex-wrap:wrap">
    <button type="button" class="more-entry" data-action="select-shop" data-id="${esc(sh.id)}" style="flex:1;min-width:170px;text-align:left">
     <span>${esc(shopLabel(sh))}</span><span class="badge ${sh.active?'approved':''}">${sh.active?'Hoạt động':'Chưa kích hoạt / lưu trữ'}</span>
    </button>
    <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">
      <button type="button" class="btn sm outline" data-action="shop-edit" data-id="${esc(sh.id)}">Sửa</button>
      ${sh.is_primary?'<span class="fineprint">SHOP chính</span>':`
      <button type="button" class="btn sm danger" data-action="shop-delete" data-id="${esc(sh.id)}" ${state.shopDeleting?'disabled':''}>${state.shopDeleting===sh.id?'Đang xóa...':'Xóa'}</button>
      ${!sh.active&&state.shopReady?`<button type="button" class="btn sm outline" data-action="shop-restore" data-id="${esc(sh.id)}">Khôi phục</button>`:''}`}
    </div></div>`).join('')}${filtered.length>100?`<p class="fineprint">Đang hiển thị 100/${filtered.length} SHOP. Gõ mã kho để tìm chính xác.</p>`:''}${!filtered.length?'<p class="fineprint">Không có SHOP phù hợp.</p>':''}</div></section>
  ${editing?`<section class="panel" id="shopEditSection"><div class="panel-head"><div><h2>Chỉnh sửa SHOP</h2><div class="subtitle">Đang sửa: ${esc(shopLabel(editing))}</div></div></div>
    <form id="editShopForm" class="stack"><input type="hidden" name="id" value="${esc(editing.id)}">
    <div class="form-grid">
      <div class="form-field"><label for="editWarehouseCode">MÃ KHO *</label><input id="editWarehouseCode" name="code" required pattern="[A-Za-z0-9_-]{2,32}" maxlength="32" value="${esc(editing.shop_code)}"></div>
      <div class="form-field"><label for="editShopName">TÊN SHOP *</label><input id="editShopName" name="name" required minlength="3" maxlength="160" value="${esc(editing.shop_name)}"></div>
    </div><div class="notice" style="padding:11px"><span style="font-size:12px">Tên hiển thị: <b id="editShopPreview">${esc(shopLabel(editing))}</b></span></div>
    <div class="row"><button type="submit" class="btn">${ic('save')} Lưu thay đổi</button><button type="button" class="btn outline" data-action="shop-cancel-edit">Hủy</button></div></form></section>`:''}
  `:''}
  ${state.shopReady&&state.shopId&&selected?.active?`<section class="panel"><h2>Thêm nhân viên cho SHOP đang chọn</h2><form id="newShopStaffForm" class="stack"><div class="form-grid"><div class="form-field"><label>Mã nhân viên</label><input name="code" required pattern="[0-9]{4,8}" maxlength="8"></div><div class="form-field"><label>Họ và tên</label><input name="name" required maxlength="120"></div><div class="form-field"><label>Vai trò trong SHOP *</label><select name="shopRole" required><option value="staff">Nhân viên</option><option value="shift_lead">Trưởng ca</option><option value="manager">Quản lý</option></select></div></div><button type="submit" class="btn">Tạo tài khoản nhân sự SHOP</button></form></section>`:''}
  ${admin()&&state.shopReady&&state.shopId&&selected?.active?`<section class="panel"><h2>Ủy quyền Quản lý SHOP</h2><form id="grantShopManagerForm" class="stack"><div class="form-field"><label>Mã nhân viên đã có tài khoản</label><input name="code" required pattern="[0-9]{4,8}"></div><button type="submit" class="btn">Cấp quyền Quản lý SHOP</button><p class="fineprint">Chỉ Admin 112191 được cấp và thu hồi vai trò Quản lý.</p></form></section>`:''}
  ${state.oneTimeCredential?`<section class="panel"><h2>Mật khẩu ban đầu · chỉ hiện một lần</h2><p>Mã nhân viên: <b>${esc(state.oneTimeCredential.code)}</b></p><div class="row"><input readonly value="${esc(state.oneTimeCredential.password)}"><button class="btn sm" data-action="copy-temp-password">Sao chép</button><button class="btn sm outline" data-action="dismiss-temp-password">Đóng</button></div></section>`:''}
  <section class="panel"><div class="panel-head"><div><h2>Nhân sự SHOP đang chọn</h2><div class="subtitle">Quản lý được ủy quyền theo từng SHOP</div></div><button class="btn sm outline" data-action="refresh-shop-members">Làm mới</button></div>
  <div class="person-list">${state.shopMemberLoading?'<p>Đang tải nhân sự...</p>':people||'<p class="fineprint">SHOP chưa có nhân sự.</p>'}</div></section>
 </div>`;
}

function accountView(){return `<section class="panel"><div class="row" style="margin-bottom:16px"><div class="avatar" style="width:52px;height:52px;font-size:19px">${esc(state.user.full_name[0])}</div><div><b>${esc(state.user.full_name)}</b><div class="subtitle">${roleName(state.user)} · ${CLOUD?'Dữ liệu trực tuyến':'Dùng thử trên thiết bị'}</div></div></div>
 <div class="detail-item"><div class="k">Tài khoản</div><div class="v">${esc(state.user.employee_code)}</div></div><div class="detail-item"><div class="k">Ứng dụng</div><div class="v">112191 WORK · v3.0.4 PREVIEW · MULTI SHOP</div></div><div class="detail-item"><div class="k">Thông báo</div><div class="v">${'Notification' in window?`Trạng thái: ${state.pushEnabled?'Đã bật Push kể cả khi đóng web':Notification.permission==='granted'?'Đã bật thông báo khi link web còn mở':Notification.permission==='denied'?'Thông báo trình duyệt bị chặn; popup trong web vẫn bật':'Popup trong web luôn bật; chưa cấp quyền trình duyệt'}`:'Popup khi mở link web luôn bật. iPhone cần thêm Màn hình chính để nhận khi đóng web'}</div></div>
 <div class="row" style="margin-top:18px"><button class="btn outline" data-action="show-change-password">${ic('lock')} Đổi mật khẩu</button>${state.pushEnabled?`<button class="btn outline" data-action="disable-notifs">${ic('bell')} Tắt thông báo đẩy trên thiết bị</button>`:`<button class="btn outline" data-action="enable-notifs">${ic('bell')} Bật thông báo web / điện thoại</button>`}<button class="btn danger" data-action="logout">${ic('logout')} Đăng xuất</button></div>
 ${!CLOUD?`<hr class="divider"/><div class="mini-label" style="margin-bottom:9px">Đổi tài khoản dùng thử</div><div class="row"><button class="btn outline sm" data-action="switch-demo" data-user="mgr">Quản lý</button><select id="demoStaffSelect" aria-label="Chọn nhân viên dùng thử" style="max-width:230px"><option value="">Chọn nhân viên...</option>${users().map(p=>`<option value="${esc(p.id)}" ${p.id===state.user.id?'selected':''}>${esc(personLabel(p))}</option>`).join('')}</select></div><p class="fineprint">Chuyển vai trò để thử luồng công việc trên cùng một thiết bị. Đây không phải đăng nhập bảo mật.</p><button class="btn outline sm" data-action="reset-demo">Đặt lại dữ liệu dùng thử</button>`:''}
 <hr class="divider"/><p class="fineprint">${CLOUD?'Tài khoản dùng chung được kiểm soát bằng Supabase Auth và Row Level Security.':'Chế độ dùng thử lưu vào localStorage; ảnh và dữ liệu không tự sao lưu hoặc đồng bộ.'} Đăng nhập bằng link web vẫn nhận popup khi trang đang mở. Chrome/Android và trình duyệt có Web Push có thể nhận khi đóng tab nếu đã cấp quyền. Trên iPhone muốn nhận khi đóng Safari phải thêm website vào Màn hình chính rồi cấp quyền. Chế độ Không làm phiền hoặc tiết kiệm pin có thể làm chậm thông báo.</p></section>`}
function pendingView(){return `<section class="panel"><div class="notice note-amber">${ic('lock')}<div>Tài khoản <b>${esc(state.user.full_name)}</b> đang chờ quản lý kích hoạt. Đăng nhập với tài khoản quản lý và vào mục Nhân viên để cấp quyền.</div></div><button class="btn outline" style="margin-top:16px" data-action="logout">Đăng xuất</button></section>`}
function photoLink(path){if(!path)return '';if(path.startsWith('data:'))return path;return state.signed[path]||''}
function photoTiles(paths){return paths?.length?`<div class="photo-grid" style="margin-top:12px">${paths.map(path=>photoLink(path)?`<a href="${esc(photoLink(path))}" target="_blank" rel="noopener noreferrer"><img alt="Ảnh minh chứng công việc" loading="lazy" src="${esc(photoLink(path))}"/></a>`:`<div style="border:1px dashed var(--line);border-radius:9px;aspect-ratio:1;display:grid;place-items:center;color:var(--muted);font-size:10px">${ic('image')} Đang tải ảnh</div>`).join('')}</div>`:''}
function detailModal(t){const rows=taskAssignments(t.id).filter(a=>supervisor()||a.staff_id===state.user.id);
 return `<div class="modal-screen" data-action="close-overlay"><div class="modal" role="dialog" aria-modal="true" aria-label="Chi tiết công việc">
 <div class="modal-head"><div><div class="eyebrow">CHI TIẾT CÔNG VIỆC</div><h2>${esc(t.title)}</h2></div><button class="icononly" data-action="close-modal" aria-label="Đóng">${ic('close')}</button></div>
 <div class="chips">${t.priority==='high'?'<span class="chip" style="color:#ac7218;background:#fff6df">Ưu tiên cao</span>':''}<span class="chip">${esc(t.category||'Khác')}</span>${t.recurring_template_id?'<span class="chip">Hằng ngày</span>':''}</div>
 <div class="detail-item"><div class="k">Hạn hoàn thành</div><div class="v">${fmt(t.due_at)}</div></div><div class="detail-item"><div class="k">Yêu cầu thực hiện</div><div class="v">${esc(t.description||'Hoàn thành công việc theo hướng dẫn và chụp ảnh minh chứng.')}</div></div>
 <div style="margin-top:16px"><div class="section-title">${supervisor()?'Báo cáo của nhân viên':'Báo cáo của bạn'} (${rows.length})</div>${rows.map(a=>{
 const canSend=!supervisor()&&['todo','rejected'].includes(a.status); const canReview=supervisor()&&a.status==='submitted';const st=assignStatus(a,t);
 return `<div class="assignment"><div class="head"><div class="row"><div class="initial">${esc(findUser(a.staff_id).full_name[0])}</div><strong>${esc(personLabel(findUser(a.staff_id)))}</strong></div>${statusBadge(st)}</div>
 ${a.report_notes?`<div class="detail-item"><div class="k">Ghi chú báo cáo</div><div class="v">${esc(a.report_notes)}</div></div>`:''}
 ${a.submitted_at?`<div class="meta" style="margin-top:10px">${ic('clock')} Gửi lúc ${fmt(a.submitted_at)}</div>`:''}
 ${a.photo_paths?.length?photoTiles(a.photo_paths):a.status==='submitted'?'<p class="fineprint">Báo cáo dùng thử chưa có ảnh; báo cáo mới bắt buộc tải ít nhất 1 ảnh.</p>':''}
 ${a.review_feedback?`<div class="notice note-amber" style="margin-top:12px">${ic('info')}<div><b>Phản hồi quản lý:</b> ${esc(a.review_feedback)}</div></div>`:''}
 ${canReview?`<div class="row" style="margin-top:14px"><button class="btn success" data-action="approve" data-aid="${esc(a.id)}">${ic('check')} Duyệt đạt</button><button class="btn danger" data-action="reject-dialog" data-aid="${esc(a.id)}">${ic('refresh')} Yêu cầu làm lại</button></div>`:''}
 ${canSend?`<form id="reportForm" data-aid="${esc(a.id)}" class="stack" style="margin-top:14px;gap:12px"><div class="form-field"><label>Nội dung đã thực hiện</label><textarea name="report" maxlength="1000" placeholder="Ghi ngắn gọn kết quả thực hiện...">${esc(a.report_notes||'')}</textarea></div><label class="photo-input">${ic('camera')}<div style="font-size:12px;font-weight:700;margin-top:4px">Chụp hoặc chọn ảnh minh chứng *</div><div class="fineprint">Tối đa 3 ảnh, tự động giảm dung lượng</div><input name="photos" type="file" accept="image/*" multiple required /></label><button class="btn full" type="submit">${ic('check')} Gửi báo cáo chờ duyệt</button></form>`:''}
 </div>`}).join('')}
 </div><button class="btn outline full" data-action="close-modal" style="margin-top:12px">Đóng</button></div></div>`}
function modalHtml(){if(state.modal?.type==='detail'){const t=getTask(state.modal.taskId);return t?detailModal(t):''}
 if(state.modal?.type==='staff-role'){
  if(!admin()||!state.staffAccounts)return '';
  const p=state.staffAccounts.accounts.find(x=>x.id===state.modal.uid);if(!p||p.is_admin)return '';
  return `<div class="modal-screen" data-action="close-overlay"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2>Đổi vị trí nhân sự</h2><button class="icononly" data-action="close-modal">${ic('close')}</button></div><p>${esc(p.employee_code)} · ${esc(p.full_name)}</p><form id="staffRoleForm" data-id="${esc(p.id)}" class="stack"><div class="form-field"><label>Chọn vị trí *</label><select name="role" required><option value="staff" ${p.role==='staff'?'selected':''}>Nhân Viên</option><option value="shift_lead" ${p.role==='shift_lead'?'selected':''}>Trưởng Ca</option><option value="manager" ${p.role==='manager'?'selected':''}>Quản Lý</option></select></div><p class="fineprint">Chỉ Admin 112191 có thể cấp hoặc thu hồi quyền Quản Lý; lịch sử công việc giữ nguyên.</p><button class="btn full" type="submit">Lưu vị trí mới</button></form></div></div>`;
 }
 if(state.modal?.type==='staff-reset'||state.modal?.type==='staff-edit'){
  if(!manager()||!state.staffAccounts)return '';
  const p=state.staffAccounts.accounts.find(x=>x.id===state.modal.uid);if(!p)return '';
  if(state.modal.type==='staff-reset')return `<div class="modal-screen" data-action="close-overlay"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2>Đặt lại mật khẩu nhân viên</h2><button class="icononly" data-action="close-modal">${ic('close')}</button></div><p>${esc(p.employee_code)} · ${esc(p.full_name)}</p><form id="staffResetForm" data-id="${esc(p.id)}" class="stack"><div class="form-field"><label>Mật khẩu mới (tùy chọn)</label><input name="password" type="password" autocomplete="new-password" minlength="10" maxlength="72" placeholder="Để trống nếu muốn máy tự tạo"/></div><p class="fineprint">Tối thiểu 10 ký tự, có chữ và số, không chứa mã nhân viên. Mật khẩu cũ sẽ ngừng hoạt động, nhân viên phải đổi lại sau đăng nhập.</p><button class="btn danger full" type="submit">Xác nhận đặt lại mật khẩu</button></form></div></div>`;
  return `<div class="modal-screen" data-action="close-overlay"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2>Sửa tên nhân viên</h2><button class="icononly" data-action="close-modal">${ic('close')}</button></div><form id="staffEditForm" data-id="${esc(p.id)}" class="stack"><div class="form-field"><label>Mã tài khoản</label><input readonly value="${esc(p.employee_code)}"/></div><div class="form-field"><label>Họ và tên *</label><input name="fullName" required minlength="2" maxlength="120" value="${esc(p.full_name)}"/></div><button class="btn full" type="submit">Lưu tên nhân viên</button></form></div></div>`;
 }
 if(state.modal?.type==='reject')return `<div class="modal-screen" data-action="close-overlay"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2>Yêu cầu nhân viên làm lại</h2><button class="icononly" data-action="close-modal">${ic('close')}</button></div><form id="rejectForm" data-aid="${esc(state.modal.aid)}" class="stack"><div class="form-field"><label>Lý do cần chỉnh sửa *</label><textarea name="feedback" required minlength="5" maxlength="800" placeholder="Nêu rõ nội dung chưa đạt và yêu cầu thực hiện lại"></textarea></div><button class="btn danger full" type="submit">Gửi yêu cầu làm lại</button></form></div></div>`;
 return ''}
function configRequiredView(){return `<div class="login-wrap"><div class="login-box"><div class="login-head"><div class="login-logo">W</div><h1>112191 WORK</h1><p>Phiên bản dùng chung · Cấu hình chưa hoàn tất</p></div><div class="notice note-amber">${ic('lock')}<div>Ứng dụng cần kết nối Supabase trước khi nhân viên đăng nhập. Hãy nhập <b>Project URL</b> và <b>Publishable key</b> vào file <code>config.js</code> rồi triển khai lại. Không có chế độ dùng thử trong bản chính thức.</div></div></div></div>`}
function loginView(){if(!CLOUD)return configRequiredView();const isManager=state.authRole==='manager',isLead=state.authRole==='shift_lead';return `<div class="login-wrap"><div class="login-box"><div class="login-head"><div class="login-logo">W</div><h1>112191 WORK</h1><p>Quản lý và triển khai công việc siêu thị<br>ĐỒNG BỘ TRỰC TUYẾN</p></div>
 <div class="tabs login-role-tabs" style="justify-content:center;margin-bottom:18px"><button class="tab ${!isManager&&!isLead?'on':''}" type="button" data-action="auth-role" data-role="staff">${ic('user')} NHÂN VIÊN</button><button class="tab ${isLead?'on':''}" type="button" data-action="auth-role" data-role="shift_lead">${ic('checkcircle')} TRƯỞNG CA</button><button class="tab ${isManager?'on':''}" type="button" data-action="auth-role" data-role="manager">${ic('shield')} QUẢN LÝ</button></div>
 <form id="authForm" class="login-form" novalidate>
 <div class="form-field"><label>${isManager?'Mã quản lý':isLead?'Mã trưởng ca':'Mã nhân viên'} *</label><input name="username" required inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" aria-label="${isManager?'Mã quản lý':isLead?'Mã trưởng ca':'Mã nhân viên'}" /></div>
 <div class="form-field"><label>Mật khẩu *</label><input name="password" type="password" required autocomplete="current-password" placeholder="Nhập mật khẩu tài khoản" /></div>
 <div id="loginError" class="form-error" hidden role="alert"></div>
 <button class="btn full" type="submit">${ic('lock')} Đăng nhập</button></form><p class="fineprint" style="text-align:center;margin-top:14px">Tài khoản do quản lý cung cấp. Lần đầu đăng nhập cần đổi mật khẩu riêng. Không có chức năng tự đăng ký.</p></div></div>`}
function changePasswordView(force=true){return `<div class="login-wrap"><div class="login-box"><div class="login-head"><div class="login-logo">W</div><h1>${force?'Đổi mật khẩu lần đầu':'Đổi mật khẩu'}</h1><p>${esc(state.user?.full_name||'')} · ${esc(state.user?.employee_code||'')}</p></div>
 <div class="notice note-amber" style="margin-bottom:15px">${ic('shield')}<div>${force?'Mật khẩu ban đầu chỉ dùng một lần. Bạn phải đổi mật khẩu trước khi xem công việc hoặc báo cáo.':'Dùng mật khẩu mới của riêng bạn; không gửi cho người khác.'}</div></div>
 <form id="passwordChangeForm" class="login-form" novalidate><div class="form-field"><label>Mật khẩu mới (ít nhất 8 ký tự) *</label><input name="newPassword" type="password" minlength="8" required autocomplete="new-password" placeholder="Tối thiểu 8 ký tự, nên có chữ và số" /></div><div class="form-field"><label>Nhập lại mật khẩu mới *</label><input name="confirmPassword" type="password" required autocomplete="new-password" placeholder="Nhập lại mật khẩu mới" /></div><button class="btn full" type="submit">${ic('check')} Lưu mật khẩu mới</button></form>
 <div class="row" style="margin-top:15px"><button class="btn outline full" data-action="${force?'logout':'back-account'}">${force?'Đăng xuất':'Quay lại'}</button></div></div></div>`}
function draw(){if(state.screen==='inventory40'&&window.INV40?.isCameraRunning?.())return;
 if(!CLOUD){root.innerHTML=configRequiredView();return}if(!state.user){root.innerHTML=loginView();return}if(!state.data){root.innerHTML='<div class="splash"><span class="spinner"></span><b>Đang tải...</b></div>';return}
 if(CLOUD&&!state.user.active){root.innerHTML=appShell(pendingView());return}
 if(state.user.must_change_password || state.screen==='change-password'){root.innerHTML=changePasswordView(!!state.user.must_change_password);return}
 if(window.QUOTE40&&state.screen==='quote40'){
  window.QUOTE40.configure({shopId:()=>state.shopId,shopCode:()=>state.shops.find(s=>s.id===state.shopId)?.shop_code||'',
   user:()=>state.user,resolveProduct:resolveQuoteProduct,toast,draw});
 }
 if(window.INV40&&state.screen==='inventory40'){
  window.INV40.configure({shopId:()=>state.shopId,shopCode:()=>state.shops.find(s=>s.id===state.shopId)?.shop_code||'SHOP',
    manager:()=>manager(),api:cloudRequest,esc,toast,draw});
 }
 const views={home:homeView,tasks:tasksView,create:createView,approvals:approvalsView,recurring:recurringView,stats:statsView,team:teamView,quote40:()=>window.QUOTE40?window.QUOTE40.view():empty('Báo giá','Chưa tải bộ tạo báo giá','receipt'),inventory40:()=>window.INV40?window.INV40.view():empty('Kiểm kê 4.0','Chưa tải module kiểm kê.','camera'),shops:shopsView,accounts:accountsView,alerts:alertsView,account:accountView,more:moreView};
 // Điều hướng di động có thêm màn hình `more`, không xuất hiện trong navEntries của desktop.
 const allowedScreens=new Set([...navEntries(),...bottomItems()].map(([key])=>key));
 if(!allowedScreens.has(state.screen)&&state.screen!=='change-password')state.screen='home';
 root.innerHTML=appShell((views[state.screen]||homeView)());
}
async function loginDemo(uid){if(!state.data){state.data=migrateDemoRoster(JSON.parse(localStorage.getItem(KEY)||'null'))||initDemo()}state.user=state.data.profiles.find(p=>p.id===uid)||state.data.profiles[0];localStorage.setItem('work112191_user',state.user.id);state.screen='home';demoGenerate();demoCheckOverdue();persist();draw()}
function normalizeLogin(raw,role){
 const v=String(raw||'').trim().toUpperCase();
 // Chỉ chấp nhận mã số; không tự chuyển tên đăng nhập QUANLY.
 if(!/^[0-9]{4,8}$/.test(v))throw new Error('Mã tài khoản phải có 4–8 chữ số.');
 return v;
}
async function signIn(username,password){
 const role=state.authRole,normalized=normalizeLogin(username,role);
 // Chỉ nhận tên đăng nhập số. Email cũ bên dưới chỉ dùng làm fallback Auth trong giai đoạn chuyển đổi.
 let session;
 try{session=await authRequest('token?grant_type=password',{email:normalized.toLowerCase()+'@'+LOGIN_DOMAIN,password})}
 catch(e){
  if(role!=='manager'||normalized!=='112191')throw e;
   // Giữ truy cập Admin trong lúc chuẩn bị đổi định danh Auth ở Supabase.
   session=await authRequest('token?grant_type=password',{email:normalized.toLowerCase()+'quanly@'+LOGIN_DOMAIN,password});
 }
 storeSession(session);
 try{
  await loadCloud();
  if((!state.user?.is_admin && !(state.user?.must_change_password?state.user?.role===role:Object.values(state.shopRoles).includes(role))) || (state.user?.is_admin && role!=='manager') || String(state.user.employee_code||'').toUpperCase()!==normalized){
   await logout();throw new Error('Tài khoản không thuộc vị trí đăng nhập đã chọn.');
  }
  state.screen='home';draw();resumeDevicePush().catch(console.warn);
  const fromPush=new URLSearchParams(location.search).get('task');if(fromPush)openPushedTask(fromPush).catch(console.warn);
 }catch(e){if(state.user)await logout();throw e}
}
async function changePassword(e){e.preventDefault();const f=e.target,fd=new FormData(f);const p=String(fd.get('newPassword')||''),c=String(fd.get('confirmPassword')||'');if(p.length<8){toast('Mật khẩu mới phải có ít nhất 8 ký tự.');return}if(p!==c){toast('Hai mật khẩu không trùng nhau.');return}const init=state.user.must_change_password;const original=state.user.employee_code+(manager()?'QUANLY':'');if(p.toUpperCase()===original.toUpperCase()||p==='57021!'){toast('Không được sử dụng lại mật khẩu mặc định.');return}const btn=f.querySelector('[type=submit]');btn.disabled=true;btn.textContent='Đang thay đổi...';try{await ensureFreshToken();await cloudRequest('/auth/v1/user',{method:'PUT',body:{password:p}});if(init)await rpc('complete_initial_password');await loadCloud();state.screen='account';draw();toast('Đã đổi mật khẩu thành công.')}catch(err){toast('Không đổi được mật khẩu: '+err.message);btn.disabled=false;btn.textContent='Lưu mật khẩu mới'}}

// Không cho tự đăng ký: tài khoản được tạo bằng script quản trị chạy trên máy riêng.
async function logout(){if(CLOUD){
  if(canPush()&&state.session){
   try{const reg=await navigator.serviceWorker.ready;const sub=await reg.pushManager.getSubscription();
       if(sub){await pushService({action:'unsubscribe',endpoint:sub.endpoint}).catch(()=>{});await sub.unsubscribe()}}
   catch(e){console.warn('Device push signout',e)}
  }
  try{await cloudRequest('/auth/v1/logout',{method:'POST'})}catch{}
  localStorage.removeItem(TOKEN_KEY);state.session=null;state.pushEnabled=false;lastPendingPushCheck=0;
 }else localStorage.removeItem('work112191_user');state.user=null;state.data=CLOUD?null:state.data;state.screen='home';state.modal=null;state.staffAccounts=null;state.oneTimeCredential=null;state.shops=[];state.shopMembers=[];state.shopId=null;state.shopRoles={};state.shopReady=false;state.shopReadyChecked=false;draw()}
async function tableInsert(table,values){return await cloudRequest(`/rest/v1/${table}`,{method:'POST',body:values,headers:{'Prefer':'return=representation'}})}
async function tablePatch(table,match,values){return await cloudRequest(`/rest/v1/${table}?${match}`,{method:'PATCH',body:values,headers:{'Prefer':'return=representation'}})}
async function rpc(name,payload={}){return await cloudRequest(`/rest/v1/rpc/${name}`,{method:'POST',body:payload})}
function showCreateError(form,message,selector){
 const field=form.querySelector('#createTaskError');if(field){field.hidden=false;field.textContent=message;field.scrollIntoView?.({behavior:'smooth',block:'nearest'})}
 const control=selector?form.querySelector(selector):null;control?.focus?.();toast(message);
}
async function createTask(ev){ev.preventDefault();if(!supervisor())return;const f=ev.target;const fd=new FormData(f);
 const title=String(fd.get('title')||'').trim();
 const staff=[...f.querySelectorAll('.assignee:checked')].map(x=>x.value);
 const dateRaw=String(fd.get('due')||'');const due=new Date(dateRaw);
 if(!title){showCreateError(f,'Vui lòng nhập TÊN CÔNG VIỆC trước khi giao.','[name="title"]');return}
 if(title.length>180){showCreateError(f,'Tên công việc tối đa 180 ký tự.','[name="title"]');return}
 if(!dateRaw || !Number.isFinite(due.getTime())){showCreateError(f,'Vui lòng chọn HẠN HOÀN THÀNH hợp lệ.','[name="due"]');return}
 if(!staff.length){showCreateError(f,'Vui lòng CHỌN ÍT NHẤT 1 NHÂN VIÊN để giao việc.','.assignee');return}
 const error=f.querySelector('#createTaskError');if(error){error.hidden=true;error.textContent=''}
 const description=String(fd.get('description')||'').trim(),category=fd.get('category'),priority=fd.get('priority'),daily=manager()&&fd.get('daily')==='on';
 const button=f.querySelector('[type="submit"]');button.disabled=true;button.textContent='Đang tạo công việc...';
 let pushInfo=null;
 try{
  if(CLOUD){
   if(daily){const time=String(fd.get('due')).split('T')[1].slice(0,5);
    const rec=(await tableInsert('recurring_templates',{shop_id:state.shopId,title,description,category,priority,due_time:time,start_on:String(fd.get('due')).slice(0,10),active:true,created_by:state.user.id}))[0];
    await tableInsert('recurring_members',staff.map(staff_id=>({template_id:rec.id,staff_id})));
    await (admin()?rpc('generate_daily_tasks'):rpc('generate_daily_tasks_for_shop',{p_shop:state.shopId}));
    try{pushInfo=await pushService({action:'dispatch_pending'})}catch(err){console.warn('Daily task push failed',err)}
   }else{
    const t=(await tableInsert('tasks',{shop_id:state.shopId,title,description,category,priority,due_at:due.toISOString(),created_by:state.user.id}))[0];
    await tableInsert('assignments',staff.map(staff_id=>({task_id:t.id,staff_id})));
    try{pushInfo=await pushService({action:'dispatch_task',task_id:t.id})}catch(err){console.warn('Task saved, push retry pending',err)}
   }
   await loadCloud();
  }else{
   if(daily){const r={id:id(),title,description,category,priority,due_time:String(fd.get('due')).split('T')[1].slice(0,5),start_on:String(fd.get('due')).slice(0,10),active:true,created_by:state.user.id,created_at:nowDate()};state.data.recurring_templates.unshift(r);staff.forEach(staff_id=>state.data.recurring_members.push({template_id:r.id,staff_id}));demoGenerate();
   }else{
    const t={id:id(),title,description,category,priority,due_at:due.toISOString(),created_by:state.user.id,created_at:nowDate()};state.data.tasks.unshift(t);
    staff.forEach(staff_id=>{const a={id:id(),task_id:t.id,staff_id,status:'todo',report_notes:null,photo_paths:[],submitted_at:null,reviewed_at:null,review_feedback:null,created_at:nowDate()};state.data.assignments.push(a);notify(staff_id,'Nhiệm vụ mới',t.title,t.id,a.id)})
   }persist();
  }
  state.screen='tasks';state.filter='all';state.search='';draw();toast(pushInfo?.sent?'Đã giao việc và gửi '+pushInfo.sent+' thông báo đẩy.':'Đã giao việc. Nhân viên sẽ được thông báo trong ứng dụng; bật Push để nhận khi đóng app.');
 }catch(e){toast('Chưa thể giao việc: '+e.message);button.disabled=false;button.innerHTML=`${ic('plus')} Tạo và giao công việc`}
}
function imageBlob(file){return new Promise((resolve,reject)=>{
 if(!file.type.startsWith('image/'))return reject(new Error('Chỉ chấp nhận tệp ảnh.'));
 const picture=new Image();const obj=URL.createObjectURL(file);picture.onload=()=>{
  try{const max=1280,scale=Math.min(1,max/Math.max(picture.naturalWidth,picture.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.round(picture.naturalWidth*scale);canvas.height=Math.round(picture.naturalHeight*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(picture,0,0,canvas.width,canvas.height);canvas.toBlob(b=>{URL.revokeObjectURL(obj);b?resolve(b):reject(new Error('Không thể nén ảnh.'))},'image/jpeg',.70)}catch(e){URL.revokeObjectURL(obj);reject(e)}
 };picture.onerror=()=>{URL.revokeObjectURL(obj);reject(new Error('Không thể đọc ảnh.'))};picture.src=obj;
 })}
const blobDataUrl=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Lỗi đọc ảnh'));reader.readAsDataURL(blob)});
async function uploadEvidence(blob,assignmentId){const path=`${state.user.id}/${assignmentId}/${id()}.jpg`;
 const r=await fetch(`${BASE}/storage/v1/object/task-evidence/${path}`,{method:'POST',headers:{...sessionHeaders(),'Content-Type':'image/jpeg','x-upsert':'false'},body:blob});
 if(!r.ok){const body=await r.text();throw new Error('Không tải được ảnh: '+body.slice(0,150))};return path;
}
async function sendReport(ev){ev.preventDefault();if(manager())return;const form=ev.target,a=state.data.assignments.find(x=>x.id===form.dataset.aid);if(!a||a.staff_id!==state.user.id||!['todo','rejected'].includes(a.status))return;
 const files=[...(form.querySelector('input[type=file]')?.files||[])];if(!files.length){toast('Cần chọn ít nhất 1 ảnh.');return}if(files.length>3){toast('Mỗi báo cáo tối đa 3 ảnh.');return}
 if(files.some(file=>file.size>25*1024*1024)){toast('Mỗi ảnh gốc không được vượt 25 MB.');return}
 const report=String(new FormData(form).get('report')||'').trim();const button=form.querySelector('[type=submit]');button.disabled=true;button.textContent='Đang xử lý ảnh...';
 try{
  const blobs=await Promise.all(files.map(imageBlob));const paths=[];
  for(const blob of blobs)paths.push(CLOUD?await uploadEvidence(blob,a.id):await blobDataUrl(blob));
  if(CLOUD){await rpc('submit_assignment',{p_assignment_id:a.id,p_notes:report,p_photo_paths:paths});await loadCloud();}
  else{Object.assign(a,{status:'submitted',report_notes:report,submitted_at:nowDate(),reviewed_at:null,review_feedback:null,photo_paths:paths});notify('mgr','Có báo cáo chờ duyệt',getTask(a.task_id).title,a.task_id,a.id);persist();}
  state.modal={type:'detail',taskId:a.task_id};draw();await signEvidence();toast('Đã gửi báo cáo. Chờ quản lý duyệt.');
 }catch(e){toast('Không gửi được báo cáo: '+e.message);button.disabled=false;button.textContent='Gửi báo cáo chờ duyệt'}
}
async function review(aid,isApproved,feedback=''){if(!supervisor())return;const a=state.data.assignments.find(x=>x.id===aid);if(!a||a.status!=='submitted')return;
 try{if(CLOUD){await rpc('review_assignment',{p_assignment_id:aid,p_approved:isApproved,p_feedback:feedback});await loadCloud();}
 else{Object.assign(a,{status:isApproved?'approved':'rejected',review_feedback:feedback||null,reviewed_at:nowDate()});notify(a.staff_id,isApproved?'Đã duyệt hoàn thành':'Yêu cầu thực hiện lại',getTask(a.task_id).title+(feedback?' · '+feedback:''),a.task_id,a.id);persist();}
 state.modal={type:'detail',taskId:a.task_id};draw();await signEvidence();toast(isApproved?'Đã duyệt hoàn thành.':'Đã trả công việc để làm lại.');
 }catch(e){toast('Không duyệt được: '+e.message)}
}
async function signEvidence(){if(!CLOUD||state.modal?.type!=='detail')return;
 const as=taskAssignments(state.modal.taskId).filter(a=>supervisor()||a.staff_id===state.user.id);const paths=[...new Set(as.flatMap(a=>a.photo_paths||[]))].filter(p=>!state.signed[p]||state.signedUntil[p]<Date.now());if(!paths.length)return;
 await Promise.all(paths.map(async p=>{try{const encoded=p.split('/').map(encodeURIComponent).join('/');const j=await cloudRequest(`/storage/v1/object/sign/task-evidence/${encoded}`,{method:'POST',body:{expiresIn:600}});const u=j.signedURL||j.signedUrl||'';state.signed[p]=u.startsWith('http')?u:`${BASE}/storage/v1${u.startsWith('/')?u:'/'+u}`;state.signedUntil[p]=Date.now()+540000;}catch(e){console.warn('Không tạo được URL ảnh',e)}}));if(state.modal?.type==='detail')draw();
}
async function readOne(nid,taskid=''){
 const n=state.data.notifications.find(n=>n.id===nid);if(!n)return;
 if(!n.read_at){try{if(CLOUD)await tablePatch('notifications',`id=eq.${encodeURIComponent(nid)}`,{read_at:nowDate()});n.read_at=nowDate();persist()}catch(e){toast(e.message)}}
 if(taskid&&getTask(taskid)){state.modal={type:'detail',taskId:taskid};draw();await signEvidence()}else draw();
}
async function readAll(){const items=myNotifications().filter(n=>!n.read_at);try{if(CLOUD)await Promise.all(items.map(n=>tablePatch('notifications',`id=eq.${encodeURIComponent(n.id)}`,{read_at:nowDate()})));items.forEach(n=>n.read_at=nowDate());persist();draw()}catch(e){toast(e.message)}}
async function toggleRecurrence(idValue){if(!manager())return;const r=state.data.recurring_templates.find(r=>r.id===idValue);if(!r)return;try{if(CLOUD)await tablePatch('recurring_templates',`id=eq.${encodeURIComponent(r.id)}`,{active:!r.active});r.active=!r.active;persist();draw()}catch(e){toast(e.message)}}
async function toggleUser(uid){if(!manager()||!CLOUD)return;const p=state.data.profiles.find(p=>p.id===uid);if(!p||p.role==='manager')return;try{await staffAdminRequest({action:'set_active',user_id:uid,active:!p.active});await loadCloud();if(state.screen==='accounts')await loadStaffAdmin();draw();toast('Đã cập nhật tài khoản.')}catch(e){toast('Không cập nhật được: '+e.message)}}
function exportCsv(){const lines=[['Tên công việc','Nhóm','Hạn hoàn thành','Mã nhân viên','Nhân viên','Trạng thái','Thời gian gửi','Thời gian duyệt','Phản hồi quản lý']];for(const {t,a} of myRows())lines.push([t.title,t.category,fmt(t.due_at),findUser(a.staff_id).employee_code||'',findUser(a.staff_id).full_name,NAMES[assignStatus(a,t)]||a.status,fmt(a.submitted_at),fmt(a.reviewed_at),a.review_feedback||'']);const csv='\ufeff'+lines.map(line=>line.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`112191-work-${dayLocal()}.csv`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

async function resolveQuoteProduct(url){
 if(!CLOUD||!state.session)throw new Error('Cần đăng nhập để lấy dữ liệu sản phẩm');
 await ensureFreshToken();
 const response=await fetch(BASE+'/functions/v1/quote-product',{
  method:'POST',headers:{apikey:ANON,Authorization:'Bearer '+state.session.access_token,
   'Content-Type':'application/json'},body:JSON.stringify({url})});
 let data={};try{data=await response.json()}catch{}
 if(!response.ok)throw new Error(data.error||'Không lấy được thông tin sản phẩm');
 return data;
}
async function switchShop(shopId){
 if(state.screen==='quote40')window.QUOTE40?.onShopChange();
 if(state.screen==='inventory40')await window.INV40?.onShopChange();
 if(!state.shops.some(s=>s.id===shopId))throw new Error('Bạn chưa được cấp quyền cho SHOP này');
 state.shopId=shopId;
 localStorage.setItem('work112191_selected_shop',shopId);
 state.shopMembers=[];state.oneTimeCredential=null;
 await loadCloud();
 if(state.screen==='shops'&&supervisor())await loadShopMembers();
 draw();
 if(state.screen==='inventory40')window.INV40?.load();
 if(state.screen==='quote40')window.QUOTE40?.enter();
}
async function submitShopForm(f){
 const fd=new FormData(f);
 if(f.id==='newShopForm'){
   if(!admin())throw new Error('Chỉ Super Admin được tạo SHOP');
   const result=await shopAdminRequest({action:'create_shop',
     shop_code:String(fd.get('code')||'').trim().toUpperCase(),
     shop_name:String(fd.get('name')||'').trim()});
   state.shopId=result.shop.id;state.shopEditId=null;
   localStorage.setItem('work112191_selected_shop',state.shopId);
   await loadCloud();await loadShopMembers();draw();
   toast(result.operational?'Đã thêm SHOP thành công.':'Đã thêm SHOP vào danh mục. Chưa mở giao việc tới khi hoàn tất bảo mật.');
 }else if(f.id==='editShopForm'){
   if(!admin())throw new Error('Chỉ Super Admin được sửa SHOP');
   const shopId=String(fd.get('id')||'');
   if(!state.shops.some(s=>s.id===shopId))throw new Error('Không tìm thấy SHOP');
   const result=await shopAdminRequest({action:'update_shop',shop_id:shopId,
     shop_code:String(fd.get('code')||'').trim().toUpperCase(),
     shop_name:String(fd.get('name')||'').trim()});
   state.shopEditId=null;
   await loadCloud();await loadShopMembers();draw();
   toast('Đã lưu: '+shopLabel(result.shop));
 }else if(f.id==='newShopStaffForm'){
   if(!state.shopReady)throw new Error('Chưa hoàn tất bảo mật để thêm nhân viên vào nhiều SHOP');
   const code=String(fd.get('code')||'').trim();
   const result=await shopAdminRequest({action:'add_staff',shop_id:state.shopId,
     employee_code:code,full_name:String(fd.get('name')||'').trim(),shop_role:String(fd.get('shopRole')||'staff')});
   state.oneTimeCredential={code,password:result.temporary_password};
   await loadCloud();await loadShopMembers();draw();
   toast('Đã tạo nhân viên trong SHOP hiện tại.');
 }else if(f.id==='grantShopManagerForm'){
   if(!state.shopReady)throw new Error('Chưa hoàn tất bảo mật để cấp quyền Quản lý SHOP');
   if(!admin())throw new Error('Chỉ Super Admin được cấp quyền Quản lý');
   const code=String(fd.get('code')||'').trim();
   const rows=await cloudRequest('/rest/v1/profiles?employee_code=eq.'+encodeURIComponent(code)+'&select=id,full_name&limit=1');
   if(!rows?.[0])throw new Error('Mã nhân viên chưa có tài khoản. Hãy thêm nhân viên trước.');
   await shopAdminRequest({action:'grant_member',shop_id:state.shopId,user_id:rows[0].id,shop_role:'manager'});
   await loadCloud();await loadShopMembers();draw();
   toast('Đã ủy quyền Quản lý cho SHOP hiện tại.');
 }
}
async function updateShopMember(uid,action,extra={}){
 if(!state.shopReady||!state.shopId)throw new Error('Multi-SHOP chưa sẵn sàng');
 if(!uid)throw new Error('Thiếu tài khoản nhân viên');
 const result=await shopAdminRequest({action,shop_id:state.shopId,user_id:uid,...extra});
 if(result.temporary_password){
   const member=state.shopMembers.find(x=>x.user_id===uid);
   state.oneTimeCredential={code:member?.profile?.employee_code||'—',password:result.temporary_password};
 }
 await loadCloud();await loadShopMembers();draw();
 toast('Đã cập nhật quyền nhân viên của SHOP.');
}

async function action(el,e){const name=el.dataset.action;
 if(name==='close-overlay'){if(e.target===el){state.modal=null;draw()}return}
 if(name==='demo-login')return loginDemo(el.dataset.user);
 if(name==='auth-role'){state.authRole=['manager','shift_lead','staff'].includes(el.dataset.role)?el.dataset.role:'staff';draw();return}
 if(name==='show-change-password'){state.screen='change-password';draw();return}
 if(name==='back-account'){state.screen='account';draw();return}
 if(name==='navigate'){if(state.screen==='accounts'&&el.dataset.screen!=='accounts')state.oneTimeCredential=null;if(state.screen==='inventory40'&&el.dataset.screen!=='inventory40')await window.INV40?.leave();
 state.screen=el.dataset.screen;state.modal=null;state.filter='all';state.search='';draw();window.scrollTo(0,0);
 if(state.screen==='inventory40')window.INV40?.load();
 if(state.screen==='quote40')window.QUOTE40?.enter();
 if(state.screen==='accounts')await loadStaffAdmin();if(state.screen==='shops')await loadShopMembers();return}
 if(name==='select-shop')return switchShop(el.dataset.id);
 if(name==='shop-edit'){
  if(!admin())throw new Error('Chỉ Admin được sửa SHOP');
  state.shopEditId=el.dataset.id;draw();
  document.querySelector('#shopEditSection')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  return;
 }
 if(name==='shop-cancel-edit'){state.shopEditId=null;draw();return}
 if(name==='shop-delete'){
  if(!admin())throw new Error('Chỉ Admin 112191 được xóa SHOP');
  const sh=state.shops.find(x=>x.id===el.dataset.id);
  if(!sh)throw new Error('Không tìm thấy SHOP');
  if(sh.is_primary){toast('SHOP chính không thể xóa khi vẫn là mặc định hệ thống');return}
  if(state.shopDeleting)return;
  if(!window.confirm('Bạn xác nhận xóa '+shopLabel(sh)+'?'))return;
  state.shopDeleting=sh.id;
  draw();
  try{
   const result=await shopAdminRequest({action:'delete_shop',shop_id:sh.id});
   if(!result.deleted)throw new Error('SHOP chưa được xóa');
   if(state.shopEditId===sh.id)state.shopEditId=null;
   if(state.shopId===sh.id)state.shopId=null;
   await loadCloud();
   if(state.shopId)await loadShopMembers();
   draw();
   toast(result.media_cleanup_pending>0
     ?'Đã xóa SHOP '+sh.shop_code+' và dữ liệu. Có '+result.media_cleanup_pending+' ảnh chờ dọn khỏi Storage.'
     :'Đã xóa vĩnh viễn SHOP '+sh.shop_code+'.');
  }finally{
   state.shopDeleting=null;
   draw();
  }
  return;
 }
 if(name==='shop-restore'){
  if(!admin()||!state.shopReady)throw new Error('SHOP chưa thể kích hoạt trong giai đoạn kiểm thử');
  const result=await shopAdminRequest({action:'restore_shop',shop_id:el.dataset.id});
  await loadCloud();await loadShopMembers();draw();toast('Đã khôi phục SHOP');return;
 }
 if(name==='refresh-shop-members')return loadShopMembers();
 if(name==='shop-member-remove')return deleteMemberFromShop(el.dataset.uid);
 if(name==='shop-member-delete-account')return deleteMemberAccount(el.dataset.uid);
 if(name==='shop-member-active'){
  const active=el.dataset.active==='true';

  return updateShopMember(el.dataset.uid,'set_membership_active',{active});
 }
 if(name==='shop-member-reset'){

  return updateShopMember(el.dataset.uid,'reset_staff_password');
 }
 if(name==='shop-member-set-role'){
  const role=document.getElementById('role-'+el.dataset.uid)?.value;
  if(!['staff','shift_lead','manager'].includes(role))throw new Error('Vai trò không hợp lệ');

  return updateShopMember(el.dataset.uid,'set_member_role',{shop_role:role});
 }
 if(name==='shop-member-role'){
  const role=el.dataset.role;

  return updateShopMember(el.dataset.uid,'set_member_role',{shop_role:role});
 }
 if(name==='filter'){state.filter=el.dataset.status;draw();return}
 if(name==='detail'){state.modal={type:'detail',taskId:el.dataset.id};draw();await signEvidence();return}
 if(name==='delete-task')return deleteTaskForever(el.dataset.id);
 if(name==='close-modal'){state.modal=null;draw();return}
 if(name==='toggle-all-assignees'){const inputs=[...document.querySelectorAll('.assignee')];const every=inputs.every(x=>x.checked);inputs.forEach(x=>x.checked=!every);return}
 if(name==='reject-dialog'){state.modal={type:'reject',aid:el.dataset.aid};draw();return}
 if(name==='approve'){return review(el.dataset.aid,true)}
 if(name==='logout')return logout();
 if(name==='switch-demo')return loginDemo(el.dataset.user);
 if(name==='reset-demo'){state.data=initDemo();persist();state.screen='home';draw();toast('Đã đặt lại dữ liệu mẫu.');return}
 if(name==='toggle-recurrence')return toggleRecurrence(el.dataset.id);
 if(name==='toggle-user')return toggleUser(el.dataset.id);
 if(name==='refresh-accounts')return loadStaffAdmin();
 if(name==='account-filter'){state.staffAccountFilter=el.dataset.filter==='archived'?'archived':'active';draw();return}
 if(name==='edit-staff-name')return editStaffName(el.dataset.id);
 if(name==='edit-staff-role')return editStaffRole(el.dataset.id);
 if(name==='delete-staff')return deleteStaffForever(el.dataset.id);
 if(name==='toggle-staff-account')return changeStaffActive(el.dataset.id);
 if(name==='reset-staff-password')return resetStaffPassword(el.dataset.id);
 if(name==='copy-temp-password'){if(state.oneTimeCredential)await navigator.clipboard.writeText(state.oneTimeCredential.password);toast('Đã sao chép.');return}
 if(name==='dismiss-temp-password'){state.oneTimeCredential=null;draw();return}
 if(name==='read-one')return readOne(el.dataset.id,el.dataset.task);
 if(name==='read-all')return readAll();
 if(name==='export-csv')return exportCsv();
 if(name==='generate-today'){try{if(CLOUD){await (admin()?rpc('generate_daily_tasks'):rpc('generate_daily_tasks_for_shop',{p_shop:state.shopId}));await loadCloud()}else demoGenerate();draw();toast('Đã kiểm tra và tạo nhiệm vụ hôm nay nếu chưa tồn tại.')}catch(e){toast(e.message)}return}
 if(name==='enable-notifs')return enablePhonePush();
 if(name==='disable-notifs')return disablePhonePush();
}
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(el)action(el,e).catch?.(err=>toast(err.message))});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modal){state.modal=null;draw()};if((e.key==='Enter'||e.key===' ')&&e.target.matches('.task-card')){e.preventDefault();e.target.click()}});
document.addEventListener('submit',async e=>{const f=e.target;if(['newShopForm','editShopForm','newShopStaffForm','grantShopManagerForm','createTaskForm','createStaffForm','staffResetForm','staffEditForm','staffRoleForm','reportForm','rejectForm','authForm','passwordChangeForm'].includes(f.id))e.preventDefault();try{
 if(['newShopForm','editShopForm','newShopStaffForm','grantShopManagerForm'].includes(f.id))await submitShopForm(f);
  else if(f.id==='createTaskForm')await createTask(e);
 else if(f.id==='createStaffForm')await createStaff(e);
 else if(f.id==='staffResetForm')await submitStaffReset(e);
 else if(f.id==='staffEditForm')await submitStaffEdit(e);
 else if(f.id==='staffRoleForm')await submitStaffRole(e);
 else if(f.id==='reportForm')await sendReport(e);
 else if(f.id==='rejectForm'){const feedback=String(new FormData(f).get('feedback')||'').trim();if(feedback.length<5){toast('Hãy ghi rõ lý do làm lại.');return}await review(f.dataset.aid,false,feedback)}
 else if(f.id==='authForm'){const data=new FormData(f),username=String(data.get('username')||'').trim(),password=String(data.get('password')||'');if(!username||!password){toast('Vui lòng nhập tài khoản và mật khẩu.');return}const button=f.querySelector('[type=submit]');button.disabled=true;button.textContent='Đang đăng nhập...';try{await signIn(username,password)}finally{if(button.isConnected){button.disabled=false;button.textContent='Đăng nhập'}}}
 else if(f.id==='passwordChangeForm')await changePassword(e)
 }catch(err){toast(err.message)} });
document.addEventListener('change',e=>{
 if(e.target.id==='demoStaffSelect'&&e.target.value)loginDemo(e.target.value).catch(err=>toast(err.message));
 if(e.target.id==='activeShop'&&e.target.value)switchShop(e.target.value).catch(err=>toast(err.message));
});
document.addEventListener('input',e=>{
 if(['newWarehouseCode','newShopName','editWarehouseCode','editShopName'].includes(e.target.id)){
  const editing=e.target.id.startsWith('edit');
  const code=document.getElementById(editing?'editWarehouseCode':'newWarehouseCode')?.value.trim().toUpperCase()||'MÃ KHO';
  const name=document.getElementById(editing?'editShopName':'newShopName')?.value.trim()||'TÊN SHOP';
  const preview=document.getElementById(editing?'editShopPreview':'newShopPreview');
  if(preview)preview.textContent=code+' - '+name;
 }
});
document.addEventListener('input',e=>{if(e.target.id==='shopSearch'){state.shopSearch=e.target.value;const pos=e.target.selectionStart;draw();const input=document.querySelector('#shopSearch');if(input){input.focus();input.setSelectionRange(pos,pos)}return}if(e.target.id==='taskSearch'){state.search=e.target.value;const where=e.target.selectionStart;draw();const input=document.querySelector('#taskSearch');if(input){input.focus();input.setSelectionRange(where,where)}}});
async function boot(){
 if('serviceWorker' in navigator && location.protocol!=='file:'){
  navigator.serviceWorker.register('./sw.js').catch(console.warn);
  navigator.serviceWorker.addEventListener('message',event=>{
   if(event.data?.type==='work-push-click'&&event.data.task_id){
    openPushedTask(String(event.data.task_id)).catch(console.warn);
   }else if(event.data?.type==='work-push-arrived'&&state.user){
    refresh().catch(console.warn);
   }
  });
 }
 try{
  if(CLOUD){const saved=localStorage.getItem(TOKEN_KEY);if(saved){state.session=JSON.parse(saved);await loadCloud()}}
  else{state.data=null;state.user=null;}
 }catch(e){
  console.warn(e);
  if(CLOUD){localStorage.removeItem(TOKEN_KEY);state.user=null;state.session=null;
   toast('Phiên đăng nhập đã hết hạn hoặc chưa kết nối được máy chủ.')}
 }
 draw();
 if(state.user){
  resumeDevicePush().catch(console.warn);
  const taskId=new URLSearchParams(location.search).get('task');
  if(taskId)openPushedTask(taskId).catch(console.warn);
 }
 let managerLastRefresh=0;
 setInterval(()=>{
  if(!state.user)return;
  if(document.visibilityState==='hidden'&&state.pushEnabled)return;
  if(CLOUD){
   // Foreground staff see new work popups without requiring notification permission.
   if(!supervisor()||Date.now()-managerLastRefresh>60000){
    managerLastRefresh=Date.now();refresh();
   }
   maybeDispatchPendingPush();
  }else{demoGenerate();demoCheckOverdue();draw()}
 },20000);
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&state.user){
   refresh();
   maybeDispatchPendingPush();
  }
 });
}
boot();
