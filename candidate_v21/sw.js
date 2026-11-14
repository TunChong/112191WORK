const CACHE_NAME = '112191-work-v2.5.0';
const PRECACHE = ['./', './index.html', './styles.css?v=2.5', './app.js?v=2.5', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
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
 let payload={title:'112191 WORK · Công việc mới',body:'Bạn vừa được giao một công việc.'};
 try{if(event.data)payload={...payload,...event.data.json()}}catch{}
 const high=payload.priority==='high';
 const task=typeof payload.task_id==='string'?payload.task_id:'';
 const path=task?'/?task='+encodeURIComponent(task):'/';
 const options={
  body:String(payload.body||'Bạn có công việc mới.').slice(0,240),
  icon:'/icon-192.png',badge:'/icon-192.png',
  tag:String(payload.tag||('work-'+task)),renotify:high,
  vibrate:high?[200,100,200,100,350]:[120],
  data:{url:path,task_id:task,priority:payload.priority||'normal'},
  timestamp:Date.now()
 };
 event.waitUntil(Promise.all([
  self.registration.showNotification(String(payload.title||'112191 WORK').slice(0,140),options),
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
