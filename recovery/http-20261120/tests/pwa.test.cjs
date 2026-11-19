const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../source/sw.js'),'utf8');
const reply=(status,text,type='text/html')=>new Response(text,{status,headers:{'content-type':type}});
function harness(handler,{cached,config=false,putError=false}={}){
 const handlers={};const key=config?'./config.js':'./index.html';const cache=new Map(cached?[[key,cached]]:[]);const puts=[];const calls=[];
 const context=vm.createContext({self:{location:{origin:'https://test.invalid'},addEventListener:(name,fn)=>handlers[name]=fn},
  URL,Response,fetch:async req=>{calls.push(req);return handler(req)},
  caches:{open:async()=>({
   match:async k=>cache.get(k)?.clone(),
   put:async(k,v)=>{if(putError)throw Error('quota');puts.push(k);cache.set(k,v)}
  })}
 });
 vm.runInContext(source,context);
 return {cache,puts,calls,key,dispatch:async()=>{
  let result;handlers.fetch({request:{url:'https://test.invalid/'+(config?'config.js':''),method:'GET',mode:config?'cors':'navigate'},respondWith:p=>result=p});return result;
 }};
}
for(const status of [404,503,555])test(`PWA navigation ${status} retains working cached HTML`,async()=>{
 const h=harness(()=>reply(status,'error'),{cached:reply(200,'working app')});
 assert.equal(await (await h.dispatch()).text(),'working app');assert.equal(h.puts.length,0);assert.equal(h.calls.length,1);
 assert.equal(await h.cache.get(h.key).clone().text(),'working app');
});
test('PWA never caches error HTML when no cached page exists',async()=>{
 const h=harness(()=>reply(555,'error'));assert.equal((await h.dispatch()).status,555);assert.equal(h.cache.size,0);assert.equal(h.puts.length,0);
});
test('PWA navigation network failure uses cached HTML',async()=>{
 const h=harness(()=>{throw new TypeError('offline')},{cached:reply(200,'working app')});assert.equal(await (await h.dispatch()).text(),'working app');
});
test('Successful HTML updates the cache',async()=>{
 const h=harness(()=>reply(200,'new app'),{cached:reply(200,'old app')});assert.equal(await (await h.dispatch()).text(),'new app');assert.equal(await h.cache.get(h.key).clone().text(),'new app');
});
test('Unexpected navigation MIME type does not replace cached HTML',async()=>{
 const h=harness(()=>reply(200,'{}','application/json'),{cached:reply(200,'working app')});assert.equal(await (await h.dispatch()).text(),'working app');assert.equal(h.puts.length,0);
});
test('PWA config 555 uses cached JavaScript and never stores error HTML',async()=>{
 const h=harness(()=>reply(555,'<html>error</html>'),{config:true,cached:reply(200,'window.WORK_CONFIG={};','application/javascript')});
 assert.equal(await (await h.dispatch()).text(),'window.WORK_CONFIG={};');assert.equal(h.puts.length,0);
});
test('Missing config returned as HTTP 200 HTML cannot poison the JS cache',async()=>{
 const h=harness(()=>reply(200,'<html>fallback</html>'),{config:true,cached:reply(200,'working config','application/javascript')});assert.equal(await (await h.dispatch()).text(),'working config');assert.equal(h.puts.length,0);
});
test('Successful config refreshes its cache',async()=>{
 const h=harness(()=>reply(200,'new config','application/javascript'),{config:true,cached:reply(200,'old config','application/javascript')});assert.equal(await (await h.dispatch()).text(),'new config');assert.equal(await h.cache.get(h.key).clone().text(),'new config');
});
test('Cache quota failure still returns successful network HTML',async()=>{
 const h=harness(()=>reply(200,'network works'),{putError:true});assert.equal(await (await h.dispatch()).text(),'network works');
});
test('Network failure without cache propagates instead of fabricating success',async()=>{
 const h=harness(()=>{throw new TypeError('offline')});await assert.rejects(h.dispatch(),/offline/);
});
