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
const ICON_PATHS = {
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  clipboard:'<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 3-8 8-8s8 3 8 8"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M15 3a4 4 0 0 1 0 8M23 21v-2a4 4 0 0 0-3-3.9"/><circle cx="8.5" cy="7" r="4"/>',
  chart:'<path d="M3 3v18h18M8 16v-5M13 16V6M18 16v-8"/>',check:'<path d="m5 12 4 4L19 6"/>',checkcircle:'<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
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
  save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8"/>'
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
let state={staffAccounts:null,staffAccountsError:'',staffAccountsLoading:false,oneTimeCredential:null,screen:'home',modal:null,filter:'all',search:'',loading:false,data:null,user:null,session:null,photos:{},signed:{},signedUntil:{},authRole:'staff',picked:[],editMode:false};
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
async function loadCloud(){
 await ensureFreshToken();if(!state.session)return;
 const profile=await cloudRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(state.session.user.id)}&select=*`);
 state.user=profile?.[0]||null;
 if(!state.user){throw new Error('Chưa tìm thấy hồ sơ. Kiểm tra SQL khởi tạo dữ liệu.');}
 if(!state.user.active || state.user.must_change_password){state.data={profiles:[state.user],tasks:[],assignments:[],recurring_templates:[],recurring_members:[],notifications:[]};return;}
 const [profiles,tasks,assignments,templates,members,notifications]=await Promise.all([
  cloudRequest('/rest/v1/profiles?select=id,employee_code,full_name,role,is_admin,active,must_change_password,created_at&order=full_name.asc'),
  cloudRequest('/rest/v1/tasks?select=*&order=due_at.desc&limit=400'),
  cloudRequest('/rest/v1/assignments?select=*&limit=1200'),
  cloudRequest('/rest/v1/recurring_templates?select=*&order=created_at.desc'),
  cloudRequest('/rest/v1/recurring_members?select=*&limit=300'),
  cloudRequest('/rest/v1/notifications?select=*&order=created_at.desc&limit=150')]);
 state.data={profiles,tasks,assignments,recurring_templates:templates,recurring_members:members,notifications};
}
async function refresh(){if(state.loading)return;state.loading=true;try{
 const known=new Set((state.data?.notifications||[]).map(n=>n.id));
 if(CLOUD){await loadCloud();
  if(known.size && 'Notification' in window && Notification.permission==='granted' && document.visibilityState==='visible'){
   const fresh=myNotifications().filter(n=>!known.has(n.id));
   for(const n of fresh.slice(0,3)){try{new Notification(n.title,{body:n.body,icon:'./icon-192.png'})}catch{}}
  }
 }else{demoGenerate();demoCheckOverdue()};draw()
 }catch(e){toast('Không tải được dữ liệu: '+e.message);draw()}finally{state.loading=false}}
function manager(){return state.user?.role==='manager'}
function admin(){return manager()&&state.user?.is_admin===true}
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
 <div class="meta"><span>${ic('calendar')}${fmt(t.due_at)}</span><span>${ic('users')}${esc(a?personLabel(findUser(a.staff_id)):peopleLine(t.id))}</span>${t.recurring_template_id?`<span>${ic('repeat')}Hằng ngày</span>`:''}</div></div>${statusBadge(st)}</article>`}
function navEntries(){return manager()?[
 ['home','Tổng quan','home'],['tasks','Công việc','list'],['create','Giao việc','plus'],['approvals','Duyệt việc','shield'],['recurring','Lặp hằng ngày','repeat'],['stats','Thống kê','chart'],['team','Nhân viên','users'],['accounts','Quản lý tài khoản','shield'],['alerts','Thông báo','bell'],['account','Tài khoản','user']]:
 supervisor()?[
 ['home','Tổng quan','home'],['tasks','Công việc','list'],['create','Giao việc','plus'],['approvals','Duyệt việc','shield'],['team','Nhân viên','users'],['alerts','Thông báo','bell'],['account','Tài khoản','user']]:
 [['home','Tổng quan','home'],['tasks','Việc của tôi','list'],['alerts','Thông báo','bell'],['account','Tài khoản','user']];}
function bottomItems(){return supervisor()?[['home','Trang chủ','home'],['tasks','Công việc','list'],['create','Giao việc','plus'],['approvals','Duyệt','shield'],['more','Thêm','more']]:[['home','Trang chủ','home'],['tasks','Công việc','list'],['alerts','Thông báo','bell'],['account','Tài khoản','user']];}
const desktopNav=()=>navEntries().map(([k,label,icon])=>`<button class="${state.screen===k?'active':''}" data-action="navigate" data-screen="${k}">${ic(icon)}${esc(label)}${k==='alerts'&&myNotifications().some(x=>!x.read_at)?'<span class="badge">Mới</span>':''}</button>`).join('');
function headerTitle(){return ({home:'Tổng quan',tasks:supervisor()?'Danh sách công việc':'Công việc của tôi',create:'Giao công việc mới',approvals:'Duyệt công việc',recurring:'Công việc hằng ngày',stats:'Báo cáo & thống kê',team:'Nhân sự siêu thị',accounts:'Quản lý tài khoản',alerts:'Thông báo',account:'Tài khoản',more:'Tiện ích quản lý'})[state.screen]||'Tổng quan'}
function appShell(content){const unread=myNotifications().filter(n=>!n.read_at).length;return `<div class="layout"><aside class="sidebar"><div class="brand"><div class="logo">W</div><div><strong>112191 WORK</strong><small>Quản lý công việc siêu thị</small></div></div><nav class="menu">${desktopNav()}</nav><div class="sidefoot">ĐỒNG BỘ TRỰC TUYẾN · 1 SIÊU THỊ<br>112191 WORK · Phiên bản 2.1</div></aside><main class="content">
 <div class="topbar"><div><div class="eyebrow">112191 WORK / ${roleName(state.user)}</div><h1>${headerTitle()}</h1></div><div class="toptools"><button class="round-btn" data-action="navigate" data-screen="alerts" title="Thông báo">${ic('bell')}${unread?'<i class="dot"></i>':''}</button><button class="avatar" data-action="navigate" data-screen="account">${esc((state.user?.full_name||'W').trim()[0])}</button></div></div>
 ${!CLOUD?`<div class="notice note-amber" style="margin-bottom:15px">${ic('info')}<div><b>Chế độ dùng thử:</b> dữ liệu chỉ lưu trong trình duyệt này, chưa đồng bộ giữa các iPhone. Muốn dùng chung cần kết nối Supabase theo tài liệu trong gói mã nguồn.</div></div>`:''}
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
 <section class="panel"><div class="panel-head"><div><h2>Danh sách nhân sự</h2><div class="subtitle">Chỉ hiển thị người đang hoạt động</div></div></div><div class="person-list">
 ${leaders.map(p=>`<div class="person-row"><span class="initial">${esc((p.full_name||'?')[0])}</span><div class="info"><strong>${esc(p.full_name)}</strong><small>${esc(p.employee_code)} · ${roleName(p)} · Đang hoạt động</small></div><span class="badge approved">${roleName(p)}</span></div>`).join('')}
 ${workers.map(p=>`<div class="person-row"><span class="initial">${esc((p.full_name||'?')[0])}</span><div class="info"><strong>${esc(p.full_name)}</strong><small>Mã NV: ${esc(p.employee_code||'—')} · Nhân Viên</small></div><span class="badge approved">Hoạt động</span>${manager()?`<button class="btn sm outline" data-action="toggle-user" data-id="${esc(p.id)}">Lưu trữ</button>`:''}</div>`).join('')}
 </div></section></div>`;
}

function accountsView(){
 if(!manager())return empty('Không có quyền','Chỉ quản lý được xem tài khoản.','lock');
 const rows=state.staffAccounts?.accounts||users(),events=state.staffAccounts?.events||[],active=rows.filter(p=>p.active).length,tab=state.staffAccountFilter==='archived'?'archived':'active',shownRows=rows.filter(p=>tab==='active'?p.active:!p.active);
 return `<div class="stack">
 <div class="notice">${ic('shield')}<div><b>Kho tài khoản nhân viên</b> · ${active} hoạt động / ${rows.length} tổng số. Không xóa lịch sử nhiệm vụ khi khóa người dùng. Mật khẩu riêng của nhân viên không thể xem lại.</div></div>
 ${state.staffAccountsError?`<div class="notice note-amber">${ic('warning')}<div>API quản trị chưa sẵn sàng: ${esc(state.staffAccountsError)}. Có thể xem danh sách, nhưng chưa thể tạo hoặc đặt lại mật khẩu.</div></div>`:''}
 ${state.oneTimeCredential?`<section class="panel"><div class="panel-head"><h2>Mật khẩu tạm thời · Chỉ hiển thị một lần</h2></div><p>Gửi riêng cho mã NV ${esc(state.oneTimeCredential.code)} và yêu cầu đổi ngay sau đăng nhập.</p><div class="row"><input aria-label="Mật khẩu tạm thời" readonly value="${esc(state.oneTimeCredential.password)}"><button class="btn" data-action="copy-temp-password">${ic('save')} Sao chép</button></div><button class="btn outline sm" data-action="dismiss-temp-password">Đóng và xóa khỏi màn hình</button></section>`:''}
 <section class="panel"><div class="panel-head"><div><h2>Thêm tài khoản nhân viên</h2><div class="subtitle">Anh tự đặt mật khẩu ban đầu hoặc để hệ thống tạo tự động. Nhân viên phải đổi khi đăng nhập lần đầu.</div></div></div><form id="createStaffForm" class="stack"><div class="form-grid">
 <div class="form-field"><label for="newStaffCode">Mã NV *</label><input id="newStaffCode" name="code" pattern="[0-9]{4,8}" maxlength="8" required placeholder="Ví dụ: 257406"></div>
 <div class="form-field"><label for="newStaffName">Họ và tên *</label><input id="newStaffName" name="fullName" maxlength="120" required placeholder="Họ tên nhân viên"></div>
 <div class="form-field"><label for="newStaffPassword">Mật khẩu ban đầu (tùy chọn)</label><input id="newStaffPassword" name="password" type="password" autocomplete="new-password" minlength="10" maxlength="72" placeholder="Để trống để hệ thống tạo"/></div></div>
 <p class="fineprint">Mật khẩu tự đặt: 10–72 ký tự, có cả chữ và số, không chứa mã nhân viên. Hệ thống không lưu mật khẩu dạng văn bản; chỉ hiển thị lại một lần khi tạo tài khoản.</p>
 <button class="btn" type="submit" ${!state.staffAccounts?'disabled':''}>${ic('plus')} Thêm nhân viên</button></form></section>
 <section class="panel"><div class="panel-head"><div><h2>Danh sách tài khoản</h2><div class="subtitle">${active} đang làm việc · ${rows.length-active} đã lưu trữ. Không xóa lịch sử công việc.</div></div><button class="btn outline sm" data-action="refresh-accounts">${ic('refresh')} Làm mới</button></div><div class="row" style="gap:8px;margin:12px 0"><button class="btn sm ${tab==='active'?'':'outline'}" data-action="account-filter" data-filter="active">Đang hoạt động (${active})</button><button class="btn sm ${tab==='archived'?'':'outline'}" data-action="account-filter" data-filter="archived">Đã xóa / lưu trữ (${rows.length-active})</button></div><div class="person-list">
 ${shownRows.map(p=>`<div class="person-row"><span class="initial">${esc((p.full_name||'?')[0])}</span><div class="info"><strong>${esc(p.full_name||'Chưa đặt tên')}</strong><small>Mã NV: ${esc(p.employee_code||'—')} · ${p.active?'Hoạt động':'Đã khóa'} · Tạo: ${esc(p.created_at?fmt(p.created_at):'—')}</small><small>Đổi MK gần nhất: ${esc(p.password_changed_at?fmt(p.password_changed_at):'Chưa có nhật ký')} · Đăng nhập: ${esc(p.last_sign_in_at?fmt(p.last_sign_in_at):'—')}</small></div><span class="badge ${p.active?'approved':'todo'}">${p.active?'Hoạt động':'Đã khóa'}</span>${state.staffAccounts?`<button class="btn sm outline" data-action="edit-staff-name" data-id="${esc(p.id)}">Sửa tên</button><button class="btn sm outline" data-action="reset-staff-password" data-id="${esc(p.id)}">Đặt lại MK</button><button class="btn sm ${p.active?'danger':'outline'}" data-action="toggle-staff-account" data-id="${esc(p.id)}">${p.active?'Xóa (lưu trữ)':'Khôi phục'}</button>${!p.active?`<button class="btn danger sm" data-action="delete-staff" data-id="${esc(p.id)}">Xóa vĩnh viễn</button>`:''}`:''}</div>`).join('')}</div></section>
 <section class="panel"><div class="panel-head"><div><h2>Nhật ký quản trị tài khoản</h2><div class="subtitle">Không ghi mật khẩu, chỉ ghi sự kiện thay đổi</div></div></div><div class="person-list">${events.length?events.map(x=>`<div class="person-row"><div class="info"><strong>${esc(x.action||'Cập nhật')}</strong><small>Mã NV: ${esc(x.employee_code||'—')} · ${esc(x.created_at?fmt(x.created_at):'—')}</small></div></div>`).join(''):'<div class="subtitle">Chưa có sự kiện quản trị.</div>'}</div></section>
 </div>`;
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
 const form=e.target,fd=new FormData(form),code=String(fd.get('code')||'').trim(),name=String(fd.get('fullName')||'').trim(),password=String(fd.get('password')||'');
 if(!/^[0-9]{4,8}$/.test(code)||name.length<2){toast('Kiểm tra mã NV hoặc họ tên.');return}
 const btn=form.querySelector('[type="submit"]');btn.disabled=true;
 try{const response=await staffAdminRequest({action:'create',employee_code:code,full_name:name,...(password?{temporary_password:password}:{})});state.oneTimeCredential={code,password:response.temporary_password};state.staffAccountFilter='active';await loadCloud();await loadStaffAdmin();toast('Đã tạo tài khoản. Gửi mật khẩu tạm riêng cho nhân viên.')}
 catch(e){toast('Không thêm được nhân viên: '+e.message);btn.disabled=false}
}
async function changeStaffActive(uid){
 if(!manager()||!state.staffAccounts)return;
 const p=state.staffAccounts.accounts.find(p=>p.id===uid);if(!p)return;
 if(!confirm(`${p.active?'Xóa (lưu trữ)':'Khôi phục'} tài khoản ${p.employee_code} - ${p.full_name}? Không xóa dữ liệu hay lịch sử đã giao việc.`))return;
 try{await staffAdminRequest({action:'set_active',user_id:uid,active:!p.active});await loadCloud();await loadStaffAdmin();toast('Đã cập nhật trạng thái tài khoản.')}catch(e){toast(e.message)}
}
async function deleteStaffForever(uid){
 if(!manager()||!state.staffAccounts)return;
 const p=state.staffAccounts.accounts.find(p=>p.id===uid);if(!p||p.active)return;
 const code=window.prompt('Xóa VĨNH VIỄN tài khoản '+p.employee_code+'?\nChỉ tài khoản CHƯA có công việc, thông báo hoặc ảnh mới được xóa.\nGõ lại mã nhân viên để xác nhận:','');
 if(code===null)return;
 if(code.trim()!==p.employee_code){toast('Mã xác nhận không trùng. Không xóa tài khoản.');return}
 if(!confirm('Đây là thao tác không thể khôi phục. Xác nhận XÓA tài khoản '+p.employee_code+'?'))return;
 try{await staffAdminRequest({action:'delete',user_id:uid,confirm_code:code.trim()});await loadCloud();await loadStaffAdmin();toast('Đã xóa vĩnh viễn tài khoản chưa có lịch sử.')}catch(e){toast(e.message)}
}
async function resetStaffPassword(uid){
 if(!manager()||!state.staffAccounts)return;
 const p=state.staffAccounts.accounts.find(p=>p.id===uid);if(!p)return;
 state.modal={type:'staff-reset',uid};draw();
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

function alertsView(){const items=myNotifications();return `<section class="panel"><div class="panel-head"><div><h2>Thông báo của bạn</h2><div class="subtitle">Việc mới, trễ hạn, báo cáo và quyết định duyệt</div></div><button class="btn outline sm" data-action="read-all">Đánh dấu đã đọc</button></div>
 <div>${items.length?items.map(n=>`<div class="notification ${n.read_at?'read':''}" data-action="read-one" data-id="${esc(n.id)}" data-task="${esc(n.task_id||'')}"><span class="bulb">${ic('bell')}</span><div style="flex:1"><strong>${esc(n.title)}</strong><p>${esc(n.body)}</p><time>${fmt(n.created_at)}</time></div>${!n.read_at?'<span style="width:7px;height:7px;background:var(--blue);border-radius:50%"></span>':''}</div>`).join(''):empty('Không có thông báo','Khi có công việc hoặc thay đổi kết quả, thông báo sẽ hiển thị ở đây.','bell')}</div></section>`}
function moreView(){
 const items=manager()?[
  ['recurring','Việc lặp hằng ngày','repeat'],['stats','Thống kê tiến độ','chart'],['team','Danh sách nhân viên','users'],['accounts','Quản lý tài khoản','shield'],['alerts','Thông báo','bell'],['account','Tài khoản / Đổi mật khẩu','user']
 ]:[['team','Danh sách nhân viên','users'],['alerts','Thông báo','bell'],['account','Tài khoản / Đổi mật khẩu','user']];
 return `<div class="stack"><section class="panel"><div class="panel-head"><div><h2>Tiện ích ${roleName(state.user)}</h2><div class="subtitle">Truy cập nhanh</div></div></div><div class="more-menu">${items.map(([screen,title,ico])=>`<button class="more-entry" data-action="navigate" data-screen="${screen}">${ic(ico)}<span>${title}</span>${ic('chevron')}</button>`).join('')}</div></section></div>`;
}

function accountView(){return `<section class="panel"><div class="row" style="margin-bottom:16px"><div class="avatar" style="width:52px;height:52px;font-size:19px">${esc(state.user.full_name[0])}</div><div><b>${esc(state.user.full_name)}</b><div class="subtitle">${roleName(state.user)} · ${CLOUD?'Dữ liệu trực tuyến':'Dùng thử trên thiết bị'}</div></div></div>
 <div class="detail-item"><div class="k">Tài khoản</div><div class="v">${esc(state.user.employee_code)}</div></div><div class="detail-item"><div class="k">Ứng dụng</div><div class="v">112191 WORK · v2.1 · Đồng bộ</div></div><div class="detail-item"><div class="k">Thông báo</div><div class="v">${'Notification' in window?`Trạng thái: ${Notification.permission==='granted'?'Đã cấp quyền':Notification.permission==='denied'?'Đã từ chối':'Chưa cấp quyền'}`:'Trình duyệt chưa hỗ trợ Notification API'}</div></div>
 <div class="row" style="margin-top:18px"><button class="btn outline" data-action="show-change-password">${ic('lock')} Đổi mật khẩu</button><button class="btn outline" data-action="enable-notifs">${ic('bell')} Bật thông báo khi mở app</button><button class="btn danger" data-action="logout">${ic('logout')} Đăng xuất</button></div>
 ${!CLOUD?`<hr class="divider"/><div class="mini-label" style="margin-bottom:9px">Đổi tài khoản dùng thử</div><div class="row"><button class="btn outline sm" data-action="switch-demo" data-user="mgr">Quản lý</button><select id="demoStaffSelect" aria-label="Chọn nhân viên dùng thử" style="max-width:230px"><option value="">Chọn nhân viên...</option>${users().map(p=>`<option value="${esc(p.id)}" ${p.id===state.user.id?'selected':''}>${esc(personLabel(p))}</option>`).join('')}</select></div><p class="fineprint">Chuyển vai trò để thử luồng công việc trên cùng một thiết bị. Đây không phải đăng nhập bảo mật.</p><button class="btn outline sm" data-action="reset-demo">Đặt lại dữ liệu dùng thử</button>`:''}
 <hr class="divider"/><p class="fineprint">${CLOUD?'Tài khoản dùng chung được kiểm soát bằng Supabase Auth và Row Level Security.':'Chế độ dùng thử lưu vào localStorage; ảnh và dữ liệu không tự sao lưu hoặc đồng bộ.'} Thông báo ngoài app khi đóng ứng dụng cần cài đặt dịch vụ Web Push máy chủ riêng.</p></section>`}
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
 <div class="form-field"><label>${isManager?'Mã quản lý':isLead?'Mã trưởng ca':'Mã nhân viên'} *</label><input name="username" required inputmode="text" autocapitalize="characters" autocomplete="username" spellcheck="false" placeholder="${isManager?'Ví dụ: 112191':'Ví dụ: 111566'}" /></div>
 <div class="form-field"><label>Mật khẩu *</label><input name="password" type="password" required autocomplete="current-password" placeholder="Nhập mật khẩu tài khoản" /></div>
 <div id="loginError" class="form-error" hidden role="alert"></div>
 <button class="btn full" type="submit">${ic('lock')} Đăng nhập</button></form><p class="fineprint" style="text-align:center;margin-top:14px">Tài khoản do quản lý cung cấp. Lần đầu đăng nhập cần đổi mật khẩu riêng. Không có chức năng tự đăng ký.</p></div></div>`}
function changePasswordView(force=true){return `<div class="login-wrap"><div class="login-box"><div class="login-head"><div class="login-logo">W</div><h1>${force?'Đổi mật khẩu lần đầu':'Đổi mật khẩu'}</h1><p>${esc(state.user?.full_name||'')} · ${esc(state.user?.employee_code||'')}</p></div>
 <div class="notice note-amber" style="margin-bottom:15px">${ic('shield')}<div>${force?'Mật khẩu ban đầu chỉ dùng một lần. Bạn phải đổi mật khẩu trước khi xem công việc hoặc báo cáo.':'Dùng mật khẩu mới của riêng bạn; không gửi cho người khác.'}</div></div>
 <form id="passwordChangeForm" class="login-form" novalidate><div class="form-field"><label>Mật khẩu mới (ít nhất 8 ký tự) *</label><input name="newPassword" type="password" minlength="8" required autocomplete="new-password" placeholder="Tối thiểu 8 ký tự, nên có chữ và số" /></div><div class="form-field"><label>Nhập lại mật khẩu mới *</label><input name="confirmPassword" type="password" required autocomplete="new-password" placeholder="Nhập lại mật khẩu mới" /></div><button class="btn full" type="submit">${ic('check')} Lưu mật khẩu mới</button></form>
 <div class="row" style="margin-top:15px"><button class="btn outline full" data-action="${force?'logout':'back-account'}">${force?'Đăng xuất':'Quay lại'}</button></div></div></div>`}
function draw(){if(!CLOUD){root.innerHTML=configRequiredView();return}if(!state.user){root.innerHTML=loginView();return}if(!state.data){root.innerHTML='<div class="splash"><span class="spinner"></span><b>Đang tải...</b></div>';return}
 if(CLOUD&&!state.user.active){root.innerHTML=appShell(pendingView());return}
 if(state.user.must_change_password || state.screen==='change-password'){root.innerHTML=changePasswordView(!!state.user.must_change_password);return}
 const views={home:homeView,tasks:tasksView,create:createView,approvals:approvalsView,recurring:recurringView,stats:statsView,team:teamView,accounts:accountsView,alerts:alertsView,account:accountView,more:moreView};
 if(!navEntries().some(([key])=>key===state.screen)&&state.screen!=='change-password')state.screen='home';root.innerHTML=appShell((views[state.screen]||homeView)());
}
async function loginDemo(uid){if(!state.data){state.data=migrateDemoRoster(JSON.parse(localStorage.getItem(KEY)||'null'))||initDemo()}state.user=state.data.profiles.find(p=>p.id===uid)||state.data.profiles[0];localStorage.setItem('work112191_user',state.user.id);state.screen='home';demoGenerate();demoCheckOverdue();persist();draw()}
function normalizeLogin(raw,role){
 let v=String(raw||'').trim().toUpperCase();
 if(role==='manager'&&/^[0-9]{4,8}QUANLY$/.test(v))v=v.slice(0,-6);
 if(!/^[0-9]{4,8}$/.test(v))throw new Error('Nhập mã tài khoản gồm 4–8 chữ số, ví dụ 112191.');
 return v;
}
async function signIn(username,password){
 const role=state.authRole,normalized=normalizeLogin(username,role);
 // All new accounts use numeric login. Legacy 2026 managers used 'codeQUANLY'.
 let session;
 try{session=await authRequest('token?grant_type=password',{email:normalized.toLowerCase()+'@'+LOGIN_DOMAIN,password})}
 catch(e){
  if(role!=='manager')throw e;
  session=await authRequest('token?grant_type=password',{email:normalized.toLowerCase()+'quanly@'+LOGIN_DOMAIN,password});
 }
 storeSession(session);
 try{
  await loadCloud();
  if(state.user?.role!==role || String(state.user.employee_code||'').toUpperCase()!==normalized){
   await logout();throw new Error('Tài khoản không thuộc vị trí đăng nhập đã chọn.');
  }
  state.screen='home';draw();
 }catch(e){if(state.user)await logout();throw e}
}
async function changePassword(e){e.preventDefault();const f=e.target,fd=new FormData(f);const p=String(fd.get('newPassword')||''),c=String(fd.get('confirmPassword')||'');if(p.length<8){toast('Mật khẩu mới phải có ít nhất 8 ký tự.');return}if(p!==c){toast('Hai mật khẩu không trùng nhau.');return}const init=state.user.must_change_password;const original=state.user.employee_code+(manager()?'QUANLY':'');if(p.toUpperCase()===original.toUpperCase()||p==='57021!'){toast('Không được sử dụng lại mật khẩu mặc định.');return}const btn=f.querySelector('[type=submit]');btn.disabled=true;btn.textContent='Đang thay đổi...';try{await ensureFreshToken();await cloudRequest('/auth/v1/user',{method:'PUT',body:{password:p}});if(init)await rpc('complete_initial_password');await loadCloud();state.screen='account';draw();toast('Đã đổi mật khẩu thành công.')}catch(err){toast('Không đổi được mật khẩu: '+err.message);btn.disabled=false;btn.textContent='Lưu mật khẩu mới'}}

// Không cho tự đăng ký: tài khoản được tạo bằng script quản trị chạy trên máy riêng.
async function logout(){if(CLOUD){try{await cloudRequest('/auth/v1/logout',{method:'POST'})}catch{}localStorage.removeItem(TOKEN_KEY);state.session=null}else localStorage.removeItem('work112191_user');state.user=null;state.data=CLOUD?null:state.data;state.screen='home';state.modal=null;state.staffAccounts=null;state.oneTimeCredential=null;draw()}
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
 try{
  if(CLOUD){
   if(daily){const time=String(fd.get('due')).split('T')[1].slice(0,5);
    const rec=(await tableInsert('recurring_templates',{title,description,category,priority,due_time:time,start_on:String(fd.get('due')).slice(0,10),active:true,created_by:state.user.id}))[0];
    await tableInsert('recurring_members',staff.map(staff_id=>({template_id:rec.id,staff_id})));
    await rpc('generate_daily_tasks');
   }else{
    const t=(await tableInsert('tasks',{title,description,category,priority,due_at:due.toISOString(),created_by:state.user.id}))[0];
    await tableInsert('assignments',staff.map(staff_id=>({task_id:t.id,staff_id})));
   }
   await loadCloud();
  }else{
   if(daily){const r={id:id(),title,description,category,priority,due_time:String(fd.get('due')).split('T')[1].slice(0,5),start_on:String(fd.get('due')).slice(0,10),active:true,created_by:state.user.id,created_at:nowDate()};state.data.recurring_templates.unshift(r);staff.forEach(staff_id=>state.data.recurring_members.push({template_id:r.id,staff_id}));demoGenerate();
   }else{
    const t={id:id(),title,description,category,priority,due_at:due.toISOString(),created_by:state.user.id,created_at:nowDate()};state.data.tasks.unshift(t);
    staff.forEach(staff_id=>{const a={id:id(),task_id:t.id,staff_id,status:'todo',report_notes:null,photo_paths:[],submitted_at:null,reviewed_at:null,review_feedback:null,created_at:nowDate()};state.data.assignments.push(a);notify(staff_id,'Nhiệm vụ mới',t.title,t.id,a.id)})
   }persist();
  }
  state.screen='tasks';state.filter='all';state.search='';draw();toast('Đã tạo và giao nhiệm vụ.');
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
async function toggleUser(uid){if(!manager()||!CLOUD)return;const p=state.data.profiles.find(p=>p.id===uid);if(!p||p.role==='manager')return;if(!confirm(`${p.active?'Lưu trữ':'Khôi phục'} tài khoản ${p.employee_code||''} - ${p.full_name}? Lịch sử công việc được giữ nguyên.`))return;try{await staffAdminRequest({action:'set_active',user_id:uid,active:!p.active});await loadCloud();if(state.screen==='accounts')await loadStaffAdmin();draw();toast('Đã cập nhật tài khoản.')}catch(e){toast('Không cập nhật được: '+e.message)}}
function exportCsv(){const lines=[['Tên công việc','Nhóm','Hạn hoàn thành','Mã nhân viên','Nhân viên','Trạng thái','Thời gian gửi','Thời gian duyệt','Phản hồi quản lý']];for(const {t,a} of myRows())lines.push([t.title,t.category,fmt(t.due_at),findUser(a.staff_id).employee_code||'',findUser(a.staff_id).full_name,NAMES[assignStatus(a,t)]||a.status,fmt(a.submitted_at),fmt(a.reviewed_at),a.review_feedback||'']);const csv='\ufeff'+lines.map(line=>line.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`112191-work-${dayLocal()}.csv`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function action(el,e){const name=el.dataset.action;
 if(name==='close-overlay'){if(e.target===el){state.modal=null;draw()}return}
 if(name==='demo-login')return loginDemo(el.dataset.user);
 if(name==='auth-role'){state.authRole=['manager','shift_lead','staff'].includes(el.dataset.role)?el.dataset.role:'staff';draw();return}
 if(name==='show-change-password'){state.screen='change-password';draw();return}
 if(name==='back-account'){state.screen='account';draw();return}
 if(name==='navigate'){if(state.screen==='accounts'&&el.dataset.screen!=='accounts')state.oneTimeCredential=null;state.screen=el.dataset.screen;state.modal=null;state.filter='all';state.search='';draw();window.scrollTo(0,0);if(state.screen==='accounts')await loadStaffAdmin();return}
 if(name==='filter'){state.filter=el.dataset.status;draw();return}
 if(name==='detail'){state.modal={type:'detail',taskId:el.dataset.id};draw();await signEvidence();return}
 if(name==='close-modal'){state.modal=null;draw();return}
 if(name==='toggle-all-assignees'){const inputs=[...document.querySelectorAll('.assignee')];const every=inputs.every(x=>x.checked);inputs.forEach(x=>x.checked=!every);return}
 if(name==='reject-dialog'){state.modal={type:'reject',aid:el.dataset.aid};draw();return}
 if(name==='approve'){return review(el.dataset.aid,true)}
 if(name==='logout')return logout();
 if(name==='switch-demo')return loginDemo(el.dataset.user);
 if(name==='reset-demo'){if(!confirm('Xóa toàn bộ dữ liệu dùng thử trên thiết bị này?'))return;state.data=initDemo();persist();state.screen='home';draw();toast('Đã đặt lại dữ liệu mẫu.');return}
 if(name==='toggle-recurrence')return toggleRecurrence(el.dataset.id);
 if(name==='toggle-user')return toggleUser(el.dataset.id);
 if(name==='refresh-accounts')return loadStaffAdmin();
 if(name==='account-filter'){state.staffAccountFilter=el.dataset.filter==='archived'?'archived':'active';draw();return}
 if(name==='edit-staff-name')return editStaffName(el.dataset.id);
 if(name==='delete-staff')return deleteStaffForever(el.dataset.id);
 if(name==='toggle-staff-account')return changeStaffActive(el.dataset.id);
 if(name==='reset-staff-password')return resetStaffPassword(el.dataset.id);
 if(name==='copy-temp-password'){if(state.oneTimeCredential)await navigator.clipboard.writeText(state.oneTimeCredential.password);toast('Đã sao chép.');return}
 if(name==='dismiss-temp-password'){state.oneTimeCredential=null;draw();return}
 if(name==='read-one')return readOne(el.dataset.id,el.dataset.task);
 if(name==='read-all')return readAll();
 if(name==='export-csv')return exportCsv();
 if(name==='generate-today'){try{if(CLOUD){await rpc('generate_daily_tasks');await loadCloud()}else demoGenerate();draw();toast('Đã kiểm tra và tạo nhiệm vụ hôm nay nếu chưa tồn tại.')}catch(e){toast(e.message)}return}
 if(name==='enable-notifs'){if(!('Notification' in window)){toast('Trình duyệt này chưa hỗ trợ thông báo.');return}try{const perm=await Notification.requestPermission();toast(perm==='granted'?'Đã cấp quyền thông báo khi app đang hoạt động.':'Bạn chưa cấp quyền thông báo.');draw()}catch(e){toast('Hãy mở app từ màn hình chính iPhone rồi thử lại.')}return}
}
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(el)action(el,e).catch?.(err=>toast(err.message))});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modal){state.modal=null;draw()};if((e.key==='Enter'||e.key===' ')&&e.target.matches('.task-card')){e.preventDefault();e.target.click()}});
document.addEventListener('submit',async e=>{const f=e.target;if(['createTaskForm','createStaffForm','staffResetForm','staffEditForm','reportForm','rejectForm','authForm','passwordChangeForm'].includes(f.id))e.preventDefault();try{
 if(f.id==='createTaskForm')await createTask(e);
 else if(f.id==='createStaffForm')await createStaff(e);
 else if(f.id==='staffResetForm')await submitStaffReset(e);
 else if(f.id==='staffEditForm')await submitStaffEdit(e);
 else if(f.id==='reportForm')await sendReport(e);
 else if(f.id==='rejectForm'){const feedback=String(new FormData(f).get('feedback')||'').trim();if(feedback.length<5){toast('Hãy ghi rõ lý do làm lại.');return}await review(f.dataset.aid,false,feedback)}
 else if(f.id==='authForm'){const data=new FormData(f),username=String(data.get('username')||'').trim(),password=String(data.get('password')||'');if(!username||!password){toast('Vui lòng nhập tài khoản và mật khẩu.');return}const button=f.querySelector('[type=submit]');button.disabled=true;button.textContent='Đang đăng nhập...';try{await signIn(username,password)}finally{if(button.isConnected){button.disabled=false;button.textContent='Đăng nhập'}}}
 else if(f.id==='passwordChangeForm')await changePassword(e)
 }catch(err){toast(err.message)} });
document.addEventListener('change',e=>{if(e.target.id==='demoStaffSelect'&&e.target.value)loginDemo(e.target.value).catch(err=>toast(err.message));});
document.addEventListener('input',e=>{if(e.target.id==='taskSearch'){state.search=e.target.value;const where=e.target.selectionStart;draw();const input=document.querySelector('#taskSearch');if(input){input.focus();input.setSelectionRange(where,where)}}});
async function boot(){
 if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(console.warn);
 try{
 if(CLOUD){const saved=localStorage.getItem(TOKEN_KEY);if(saved){state.session=JSON.parse(saved);await loadCloud()}}
 else{state.data=null;state.user=null;}
 }catch(e){console.warn(e);if(CLOUD){localStorage.removeItem(TOKEN_KEY);state.user=null;state.session=null;toast('Phiên đăng nhập đã hết hạn hoặc chưa kết nối được máy chủ.')}}
 draw();setInterval(()=>{if(!state.user||document.visibilityState==='hidden')return;if(CLOUD)refresh();else{demoGenerate();demoCheckOverdue();draw()}},60000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.user)refresh()});
}
boot();
