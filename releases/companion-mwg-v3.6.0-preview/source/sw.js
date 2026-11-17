const CACHE_NAME = 'companion-mwg-v3.6.0-preview-mwgx';
const PRECACHE = ['./', './index.html', './styles.css?v=3.5.4', './app.js?v=3.6.0-preview', './config.js', './scanner_fast57.js?v=3.5.7', './inventory40.js?v=3.5.7', './imei_file51.js?v=3.5.1', './inventory40.css?v=3.5.0', './inventory_imei50.js?v=3.5.7', './lookup_camera51.js?v=3.5.7', './inventory50.js?v=3.5.6', './inventory50.css?v=3.5.7', './inventory_active56.js?v=3.5.6', './inventory_active56.css?v=3.5.6', './quote40.js?v=3.5.5', './quote40.css?v=3.3.2', './quote_stores.js?v=3.3.2', './audio40.js?v=3.3.7', './audio40.css?v=3.3.7', './manifest.webmanifest?v=3.3.4', './icon-192.png?v=3.3.5', './icon-512.png?v=3.3.5', './audio-demo.mp3', './MAU_NHAP_KIEM_KE_IMEI_5.1.xlsx','./modules/mwgx/style.css?v=3.6.0-preview','./modules/mwgx/core.js?v=3.6.0-preview','./modules/mwgx/qr_vendor.js?v=3.6.0-preview','./modules/mwgx/code128.js?v=3.6.0-preview','./modules/mwgx/excel.js?v=3.6.0-preview','./modules/mwgx/print_engine.js?v=3.6.0-preview','./modules/mwgx/print_studio.js?v=3.6.0-preview','./modules/mwgx/cash.js?v=3.6.0-preview','./modules/mwgx/warehouse.js?v=3.6.0-preview','./modules/mwgx/sales.js?v=3.6.0-preview','./modules/mwgx/inventory_extension.js?v=3.6.0-preview'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys =>
  Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if(event.request.method !== 'GET' || url.origin !== self.location.origin)return;
 // A cached complete MP3 also needs HTTP 206 for Safari/Chrome Range requests.
 // Returning a full 200 response for a byte-range request can stop playback early.
 if(url.pathname.endsWith('/audio-demo.mp3')){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME);
   let res=await cache.match('./audio-demo.mp3');
   if(!res){res=await fetch('./audio-demo.mp3');if(res.ok)await cache.put('./audio-demo.mp3',res.clone())}
   const range=event.request.headers.get('range');
   if(!range||!res?.ok)return res||fetch(event.request);
   const m=/^bytes=(\d*)-(\d*)$/.exec(range);
   if(!m)return res;
   const data=await res.arrayBuffer(),len=data.byteLength;
   let start=m[1]?Number(m[1]):null,end=m[2]?Number(m[2]):len-1;
   if(start===null){const suffix=Number(m[2]);start=Math.max(0,len-suffix);end=len-1}
   if(!Number.isFinite(start)||!Number.isFinite(end)||start>=len||end<start){
    return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+len}});
   }
   end=Math.min(len-1,end);
   return new Response(data.slice(start,end+1),{status:206,headers:{
    'Content-Type':'audio/mpeg','Content-Length':String(end-start+1),
    'Content-Range':'bytes '+start+'-'+end+'/'+len,'Accept-Ranges':'bytes'
   }});
  })());
  return;
 }
 if(url.pathname.endsWith('/config.js')){
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  return;
 }
 if(event.request.mode === 'navigate'){
  event.respondWith(fetch(event.request).then(res => {
   const clone=res.clone();caches.open(CACHE_NAME).then(c=>c.put('./index.html',clone));return res;
  }).catch(() => caches.match('./index.html')));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});

self.addEventListener('push', event => {
 let payload={title:'Companion-MWG · Công việc mới',body:'Bạn vừa được giao một công việc.'};
 try{if(event.data)payload={...payload,...event.data.json()}}catch{}
 const high=payload.priority==='high';
 const task=typeof payload.task_id==='string'?payload.task_id:'';
 const path=task?'/?task='+encodeURIComponent(task):'/';
 const options={
  body:String(payload.body||'Bạn có công việc mới.').slice(0,240),
  icon:'/icon-192.png?v=3.3.5',badge:'/icon-192.png?v=3.3.5',
  tag:String(payload.tag||('work-'+task)),renotify:high,
  vibrate:high?[200,100,200,100,350]:[120],
  data:{url:path,task_id:task,priority:payload.priority||'normal'},
  timestamp:Date.now()
 };
 event.waitUntil(Promise.all([
  self.registration.showNotification(String(payload.title||'Companion-MWG').slice(0,140),options),
  self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{
   for(const client of clients)client.postMessage({type:'work-push-arrived',task_id:task});
  })
 ]));
});

self.addEventListener('notificationclick', event => {
 const data=event.notification.data||{};
 const taskId=typeof data.task_id==='string'?data.task_id:'';
 const path=taskId?'/?task='+encodeURIComponent(taskId):'/';
 event.notification.close();
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
  const existing=clients.find(client=>client.url.startsWith(self.location.origin));
  if(existing){
   const focused=await existing.focus();
   (focused||existing).postMessage({type:'work-push-click',task_id:taskId});
   return;
  }
  return self.clients.openWindow(path);
 }));
});
