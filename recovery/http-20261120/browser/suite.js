'use strict';
const frame=document.getElementById('app'),results=document.getElementById('results'),status=document.getElementById('status');
const CACHE='companion-mwg-v3.5.5-active-inventory-http2';
const rows=[];
const doc=()=>frame.contentDocument;
const assert=(value,message)=>{if(!value)throw Error(message)};
async function until(check,label,timeout=12000){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){try{if(await check())return}catch{}await new Promise(r=>setTimeout(r,60))}
 throw Error('Hết thời gian: '+label);
}
const control=(mode,reset=false)=>fetch('/qa/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,reset})});
const stats=()=>fetch('/qa/stats').then(r=>r.json());
async function loadFrame(url){
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{frame.removeEventListener('load',done);reject(Error('iframe load timeout'))},15000);
  function done(){clearTimeout(timer);resolve()}
  frame.addEventListener('load',done,{once:true});frame.src=url;
 });
}
const ready=()=>!!doc()?.querySelector('[data-action="navigate"][data-screen="home"]');
const reconnect=()=>doc()?.querySelector('[data-action="retry-session"]');
const text=()=>doc()?.getElementById('app')?.textContent||'';
async function boot(mode,expired=false){
 await loadFrame('about:blank');await control(mode,true);
 await loadFrame('/qa/seed?'+(expired?'expired=1':'fresh=1')+'&run='+Date.now());
}
async function working(mode='healthy'){
 await boot(mode);await until(ready,'giao diện chính');
 assert(frame.contentWindow.WORK_CONFIG.supabaseUrl===location.origin+'/qa-api','API phải được cô lập');
}
function count(requests,path,method='GET'){return requests.filter(r=>r.path===path&&r.method===method).length}
async function cacheText(key){const cache=await caches.open(CACHE);const r=await cache.match('/app/'+key);return r?await r.text():null}
async function runCase(name,fn){
 const li=document.createElement('li');li.textContent='Đang kiểm tra: '+name;results.append(li);
 try{
  const detail=await fn();const evidence=await stats();
  rows.push({name,status:'PASS',detail:detail||'',requests:evidence.requests});li.textContent='PASS · '+name;li.className='pass';
 }catch(error){rows.push({name,status:'FAIL',error:error.message,requests:(await stats()).requests});li.textContent='FAIL · '+name+' · '+error.message;li.className='fail'}
 status.textContent=`Đã kiểm thử ${rows.length}/10 · ${rows.filter(r=>r.status==='FAIL').length} lỗi`;
}
document.getElementById('run').addEventListener('click',async event=>{
 event.target.disabled=true;rows.length=0;results.replaceChildren();status.textContent='Đang chạy trên trình duyệt thực tế...';
 await runCase('Cài PWA và tải đúng bản vá',async()=>{
  await working();await until(()=>frame.contentWindow.navigator.serviceWorker.controller,'service worker kiểm soát iframe',20000);
  await until(async()=>(await caches.open(CACHE)).match('/app/app.js?v=3.5.5-active56-http1'),'cache app mới');
  assert((await cacheText('config.js')).includes('/qa-api'),'cache config giả');return navigator.userAgent;
 });
 await runCase('GET 555 → 200: đúng một lần thử lại',async()=>{
  await working('once555');const requests=(await stats()).requests;
  assert(count(requests,'/qa-api/rest/v1/profiles')===2,'Số GET hồ sơ phải bằng 2');
  assert(requests.filter(r=>r.path==='/qa-api/rest/v1/profiles').map(r=>r.status).join(',')==='555,200','Phải có chuỗi HTTP 555,200');
 });
 await runCase('555 kéo dài: giữ phiên và Kết nối lại thành công',async()=>{
  await boot('persistent555');await until(reconnect,'nút Kết nối lại');
  assert(count((await stats()).requests,'/qa-api/rest/v1/profiles')===2,'Chỉ thử tối đa 2 GET');
  const saved=localStorage.getItem('work112191_session');assert(saved?.includes('qa-fictional-refresh'),'Phiên không được xóa');
  assert(text().includes('HTTP 555'),'Hiển thị đúng HTTP 555');
  await control('healthy');reconnect().click();await until(ready,'khôi phục giao diện');
  assert(localStorage.getItem('work112191_session')===saved,'Giữ nguyên phiên sau kết nối lại');
 });
 await runCase('404 API: không thử lặp và không xóa phiên',async()=>{
  await boot('api404');await until(reconnect,'màn hình 404');
  assert(text().includes('HTTP 404'),'Hiển thị đúng HTTP 404');
  assert(count((await stats()).requests,'/qa-api/rest/v1/profiles')===1,'404 chỉ có một GET');
  assert(localStorage.getItem('work112191_session'),'Giữ phiên khi thiếu tài nguyên');
 });
 await runCase('Auth trả HTML 555: giữ HTTP status và phiên',async()=>{
  await boot('auth555',true);await until(reconnect,'lỗi Auth 555');
  assert(text().includes('HTTP 555'),'Không được biến lỗi HTML thành lỗi JSON/hết phiên');
  assert(count((await stats()).requests,'/qa-api/auth/v1/token','POST')===1,'Không tự gửi lặp refresh POST');
  assert(localStorage.getItem('work112191_session'),'Giữ refresh token khi máy chủ lỗi');
 });
 await runCase('Giao việc gặp 555: chỉ một POST, không tạo phân công',async()=>{
  await working('write555');
  let create=doc().querySelector('[data-action="navigate"][data-screen="create"]');
  if(!create){doc().querySelector('[data-action="navigate"][data-screen="workhub"]').click();create=doc().querySelector('[data-action="navigate"][data-screen="create"]')}
  assert(create,'Có mục Giao việc');create.click();
  const form=doc().getElementById('createTaskForm');assert(form,'Có form Giao việc');
  form.querySelector('[name="title"]').value='QA HTTP 555 · dữ liệu giả';
  form.querySelector('.assignee[value="qa-staff"]').checked=true;
  form.querySelector('[type="submit"]').click();
  await until(()=>doc().querySelector('.alert-toast')?.textContent.includes('HTTP 555'),'thông báo lỗi ghi');
  const requests=(await stats()).requests;assert(count(requests,'/qa-api/rest/v1/tasks','POST')===1,'Không được gửi lại POST');
  assert(count(requests,'/qa-api/rest/v1/assignments','POST')===0,'Không ghi phân công sau lỗi tạo nhiệm vụ');
 });
 for(const code of [555,404])await runCase('PWA điều hướng HTTP '+code+': giữ trang tốt trong cache',async()=>{
  await working();const before=await cacheText('index.html');assert(before?.includes('<title>Companion-MWG</title>'),'Có HTML tốt trong cache');
  await control('nav'+code,true);await loadFrame('/app/index.html?navigation='+Date.now());await until(ready,'HTML dự phòng');
  const requests=(await stats()).requests;assert(requests.some(r=>r.path==='/app/index.html'&&r.status===code),'Server thực sự trả HTTP '+code);
  assert(await cacheText('index.html')===before,'Cache HTML không bị ghi đè bởi lỗi');
 });
 for(const mode of ['config555','configHtml'])await runCase(mode==='config555'?'PWA config HTTP 555: dùng JavaScript đã lưu':'PWA config HTTP 200 nhưng là HTML: không làm hỏng cache',async()=>{
  await working();const before=await cacheText('config.js');await control(mode,true);
  await loadFrame('/app/index.html?configuration='+Date.now());await until(ready,'config dự phòng');
  assert((await stats()).requests.some(r=>r.path==='/app/config.js'&&r.status===(mode==='config555'?555:200)),'Có request config lỗi từ server');
  assert(await cacheText('config.js')===before,'Cache config không bị ghi đè');
  assert(frame.contentWindow.WORK_CONFIG.supabaseUrl===location.origin+'/qa-api','Ứng dụng vẫn dùng API cô lập');
 });
 await working();
 const report={tested_commit:'eb2496303532fa26a3077d873d5e72ae96160d54',finished_at:new Date().toISOString(),browser:navigator.userAgent,secure_context:isSecureContext,preview_origin:location.origin,production_api_base_replaced:true,api:'fictional local fixtures only',pass:rows.filter(r=>r.status==='PASS').length,fail:rows.filter(r=>r.status==='FAIL').length,results:rows};
 await fetch('/qa/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
 status.textContent=`HOÀN TẤT · ${report.pass}/10 PASS · ${report.fail} FAIL`;event.target.disabled=false;
});
