import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';

const listeners={};
const shown=[];
const focused=[];
const appWindow={url:'https://112191work.pages.dev/',focus:async()=>appWindow,
 postMessage:(payload)=>focused.push(payload)};
const self={
 location:{origin:'https://112191work.pages.dev'},
 addEventListener:(name,fn)=>listeners[name]=fn,
 skipWaiting:async()=>{},
 clients:{claim:async()=>{},matchAll:async()=>[appWindow],openWindow:async(path)=>focused.push({opened:path})},
 registration:{showNotification:async(title,options)=>shown.push({title,options})}
};
const caches={open:async()=>({addAll:async()=>{},put:async()=>{}}),keys:async()=>[]};
runInNewContext(readFileSync(new URL('./sw.js',import.meta.url),'utf8'),
 {self,caches,URL,Promise,Date,console,fetch:async()=>({ok:true,clone(){return this}}),Response});

async function push(data){
 let finished;listeners.push({data:{json:()=>data},waitUntil:p=>finished=p});
 await finished;
}
await push({title:'🚨 CÔNG VIỆC ƯU TIÊN CAO',body:'Kiểm tra giá bán · Hạn 20:00',
 priority:'high',task_id:'f0000000-0000-4000-8000-000000000001'});
assert.equal(shown.length,1);
assert.match(shown[0].title,/ƯU TIÊN CAO/);
assert.equal(shown[0].options.renotify,true);
assert.match(shown[0].options.data.url,/\?task=f000/);
await push({title:'📋 CÔNG VIỆC BÌNH THƯỜNG',body:'Vệ sinh tủ lạnh · Hạn 19:00',
 priority:'normal',task_id:'f0000000-0000-4000-8000-000000000002'});
assert.equal(shown.length,2);
assert.match(shown[1].title,/BÌNH THƯỜNG/);
assert.equal(shown[1].options.renotify,false);
let closeCalled=false;
let clicked;
listeners.notificationclick({notification:{data:shown[0].options.data,close:()=>{closeCalled=true}},
 waitUntil:p=>clicked=p});
await clicked;
assert.equal(closeCalled,true);
assert.deepEqual(JSON.parse(JSON.stringify(focused.at(-1))),{
 type:'work-push-click',task_id:'f0000000-0000-4000-8000-000000000001'
});
console.log('PASS: work push high/normal priority and tap-to-open service worker behavior');
