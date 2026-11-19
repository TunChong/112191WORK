const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../source/app.js'),'utf8').replace(/\nboot\(\);\s*$/,'\n');
const tokenKey='work112191_session';
const session=()=>({access_token:'test-access',refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'test-user'}});
const reply=(status,data)=>new Response(typeof data==='string'?data:JSON.stringify(data),{status});
function harness(handler,{saved=session()}={}){
 const storage=new Map(saved===null?[]:[[tokenKey,typeof saved==='string'?saved:JSON.stringify(saved)]]);
 const root={innerHTML:''};const calls=[];const delays=[];
 const context=vm.createContext({
  window:{WORK_CONFIG:{supabaseUrl:'https://test.invalid',supabasePublishableKey:'test-public'}},
  document:{getElementById:()=>root,addEventListener(){},querySelector:()=>null,
   body:{appendChild(){}},createElement:()=>({remove(){}}),visibilityState:'visible'},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  navigator:{},location:{protocol:'file:',search:''},URLSearchParams,Response,
  setTimeout:(fn,ms)=>{delays.push(ms);queueMicrotask(fn);return 1},clearTimeout(){},setInterval(){},
  console:{warn(){},log(){}},fetch:async(url,options)=>{calls.push({url,...options});return handler(url,options,calls.length)},
 });
 vm.runInContext(source+'\nglobalThis.api={cloudRequest,authRequest,boot,signIn,retrySession,invalidSession,state,draw};',context);
 if(saved&&typeof saved!=='string')context.api.state.session=JSON.parse(JSON.stringify(saved));
 return {context,api:context.api,storage,root,calls,delays,run:code=>vm.runInContext(code,context)};
}

for(const status of [500,502,503,504,555])test(`GET ${status} recovers with exactly one retry`,async()=>{
 const h=harness((u,o,n)=>n===1?reply(status,'<html>unavailable</html>'):reply(200,[{ok:true}]));
 const data=await h.api.cloudRequest('/rest/v1/profiles');
 assert.equal(data[0].ok,true);assert.equal(h.calls.length,2);assert.deepEqual(h.delays,[500]);
 assert.equal(h.api.state.session.access_token,'test-access');
});
test('Persistent 555 stops after two reads and preserves HTTP metadata',async()=>{
 const h=harness(()=>reply(555,'<html>gateway</html>'));
 await assert.rejects(h.api.cloudRequest('/rest/v1/work_shop_memberships'),e=>e.status===555&&e.path==='/rest/v1/work_shop_memberships'&&!e.message.includes('<html>'));
 assert.equal(h.calls.length,2);assert.equal(h.api.state.session.access_token,'test-access');
});
for(const method of ['POST','PATCH','PUT','DELETE'])test(`${method} 555 is never automatically replayed`,async()=>{
 const h=harness(()=>reply(555,'down'));
 await assert.rejects(h.api.cloudRequest('/rest/v1/rpc/submit_assignment',{method,body:{id:'test'}}),e=>e.status===555);
 assert.equal(h.calls.length,1);assert.equal(h.calls[0].body,'{"id":"test"}');
});
test('404 is reported once, without treating a missing resource as expired login',async()=>{
 const h=harness(()=>reply(404,{code:'NOT_FOUND',message:'missing'}));
 await assert.rejects(h.api.cloudRequest('/functions/v1/missing'),e=>e.status===404&&e.code==='NOT_FOUND'&&!h.api.invalidSession(e));
 assert.equal(h.calls.length,1);
});
test('Read network failure retries once',async()=>{
 const h=harness((u,o,n)=>{if(n===1)throw new TypeError('Failed to fetch');return reply(200,[])});
 assert.equal((await h.api.cloudRequest('/rest/v1/profiles')).length,0);assert.equal(h.calls.length,2);
});
test('Write network failure is not replayed',async()=>{
 const h=harness(()=>{throw new TypeError('Failed to fetch')});
 await assert.rejects(h.api.cloudRequest('/rest/v1/tasks',{method:'POST',body:{title:'test'}}));assert.equal(h.calls.length,1);
});
test('204 response does not require JSON',async()=>{
 const h=harness(()=>new Response(null,{status:204}));assert.equal(await h.api.cloudRequest('/rest/v1/tasks',{method:'PATCH',body:{}}),null);
});
test('HTML error from Auth retains status and is not a JSON/session error',async()=>{
 const h=harness(()=>reply(555,'<html>unavailable</html>'));
 await assert.rejects(h.api.authRequest('token?grant_type=refresh_token',{}),e=>e.status===555&&!h.api.invalidSession(e));assert.equal(h.calls.length,1);
});
test('Boot 555 retains saved session, hides partial data and renders reconnect',async()=>{
 const h=harness(()=>reply(555,'unavailable'));await h.api.boot();
 assert.ok(h.storage.has(tokenKey));assert.ok(h.api.state.session);assert.equal(h.api.state.user,null);assert.equal(h.api.state.data,null);
 assert.match(h.root.innerHTML,/data-action="retry-session"/);assert.equal(h.calls.length,2);
});
test('Auth refresh 555 retains session without pretending it expired',async()=>{
 const s=session();s.expires_at=0;const h=harness(()=>reply(555,'unavailable'),{saved:s});await h.api.boot();
 assert.ok(h.storage.has(tokenKey));assert.ok(h.api.state.connectionError);assert.equal(h.calls.length,1);
});
test('Expired refresh token clears session and returns to login',async()=>{
 const h=harness(u=>u.includes('/auth/')?reply(400,{code:'refresh_token_not_found',msg:'Refresh token not found'}):reply(401,{message:'Invalid JWT'}));
 await h.api.boot();assert.equal(h.storage.has(tokenKey),false);assert.equal(h.api.state.session,null);assert.match(h.root.innerHTML,/id="authForm"/);
});
test('Invalid saved JSON returns to login without a request',async()=>{
 const h=harness(()=>{throw Error('unexpected fetch')},{saved:'{invalid'});await h.api.boot();assert.equal(h.storage.has(tokenKey),false);assert.equal(h.calls.length,0);
});
test('Login interrupted by 555 preserves identity checks for reconnect',async()=>{
 const h=harness(u=>u.includes('/auth/')?reply(200,session()):reply(555,'down'),{saved:null});
 await assert.rejects(h.api.signIn('123456','test-password'));
 assert.equal(h.api.state.pendingLogin.normalized,'123456');assert.equal(h.api.state.pendingLogin.role,'staff');
 assert.ok(h.api.state.session);assert.match(h.root.innerHTML,/Kết nối lại/);assert.equal(h.calls.filter(c=>c.method==='POST').length,1);
});
test('Reconnect remains single-flight and clears recovery screen on success',async()=>{
 const h=harness(()=>{throw Error('no real request expected')});
 h.api.state.connectionError='HTTP 555';h.run('loadCloud=async()=>{await Promise.resolve();state.user={id:"test-user"};state.data={}};draw=()=>{};resumeDevicePush=async()=>{};');
 await Promise.all([h.api.retrySession(),h.api.retrySession()]);assert.equal(h.api.state.connectionError,'');assert.equal(h.api.state.loading,false);assert.ok(h.api.state.user);
});
test('Reconnect still rejects a mismatched login role',async()=>{
 const h=harness(()=>reply(204,null));
 h.api.state.pendingLogin={role:'manager',normalized:'123456'};h.api.state.connectionError='HTTP 555';
 h.run('loadCloud=async()=>{state.user={employee_code:"123456",is_admin:false,role:"staff"};state.shopRoles={shop:"staff"};state.data={}};draw=()=>{};');
 await h.api.retrySession();assert.equal(h.api.state.session,null);assert.equal(h.storage.has(tokenKey),false);
});
test('Manager login 555 does not attempt the legacy password endpoint',async()=>{
 const h=harness(()=>reply(555,'down'),{saved:null});h.api.state.authRole='manager';
 await assert.rejects(h.api.signIn('112191','test-password'),e=>e.status===555);assert.equal(h.calls.length,1);
});
test('Permission-denied 403 is not refreshed or replayed',async()=>{
 const h=harness(()=>reply(403,{message:'Permission denied'}));
 await assert.rejects(h.api.cloudRequest('/rest/v1/profiles'),e=>e.status===403);assert.equal(h.calls.length,1);
});
test('Concurrent 401 responses refresh the token once',async()=>{
 const h=harness((u,o)=>{
  if(u.includes('/auth/'))return reply(200,{...session(),access_token:'test-new'});
  return o.headers.Authorization==='Bearer test-new'?reply(200,[]):reply(401,{message:'Invalid JWT'});
 });
 await Promise.all([h.api.cloudRequest('/rest/v1/profiles'),h.api.cloudRequest('/rest/v1/tasks')]);
 assert.equal(h.calls.filter(c=>c.url.includes('/auth/')).length,1);assert.equal(h.calls.length,5);
});
