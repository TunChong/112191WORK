import {createServer} from 'node:http';
import {createHmac} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {extname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer} from 'ws';
import {startDatabase,shops,users,rpcArguments,TABLE} from './database.mjs';

const dir = fileURLToPath(new URL('.',import.meta.url));
const staticRoot = resolve(dir,'site');
const {as,rpc} = await startDatabase();
const demoKey = 'Companion-MWG-QLST-local-test-only';
function tokenFor(user) {
  const parts = [{typ:'JWT',alg:'HS256'}, {sub:user.id,role:'authenticated',exp:Math.floor(Date.now()/1000)+86_400}];
  const claim=parts.map(value=>Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
  return claim+'.'+createHmac('sha256',demoKey).update(claim).digest('base64url');
}
const sessions=Object.fromEntries(Object.entries(users).map(([name,user])=>[name,tokenFor(user)]));
const tokens=new Map(Object.entries(sessions).map(([name,token])=>[token,users[name]]));
const demoConfig = `(() => {
  const role = new URLSearchParams(location.search).get('fixture') || 'manager';
  const sessions = ${JSON.stringify(sessions)};
  const profiles = ${JSON.stringify(Object.fromEntries(Object.entries(users).map(([name,{id}])=>[name,{id}])))};
  const nativeStorage = window.sessionStorage;
  const prefix = 'qlst-fixture:' + role + ':';
  const localFixtureStorage = {
    getItem(key) { return nativeStorage.getItem(prefix+key); },
    setItem(key,value) { nativeStorage.setItem(prefix+key,value); },
    removeItem(key) { nativeStorage.removeItem(prefix+key); },
  };
  Object.defineProperty(window,'localStorage',{value:localFixtureStorage});
  window.WORK_CONFIG = {supabaseUrl:location.origin+'/preview-db',supabasePublishableKey:'local-fixture'};
  if (Object.hasOwn(sessions,role))
    localStorage.setItem('work112191_session',JSON.stringify({access_token:sessions[role],user:profiles[role],expires_at:Date.now()/1000+3600}));
})();`;

const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css',
  '.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
function send(res,status,body,type='application/json'){
  res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(type==='application/json'?JSON.stringify(body):body);
}
async function requestBody(req){
  let body='';
  for await (const chunk of req) {
    body+=chunk;if(body.length>90000)throw Error('Fixture request too large');
  }
  return body?JSON.parse(body):{};
}
const userFrom = req => tokens.get(req.headers.authorization?.replace(/^Bearer /,''));
const accessibleShops = user => Object.entries(shops).filter(([key])=>user.is_admin||Object.hasOwn(user.assignments,key));
async function readTasks(user, query) {
  const conditions=[],values=[];
  const param=(column,op,value)=>{
    values.push(value);conditions.push(column+' '+op+' $'+values.length);
  };
  for(const [field,value] of query) {
    if (field==='shop_id'&&value.startsWith('eq.')) param('shop_id','=',value.slice(3));
    if (field==='completed_role'&&value.startsWith('eq.')) param('completed_role','=',value.slice(3));
    if (field==='completed_by'&&value.startsWith('eq.')) param('completed_by','=',value.slice(3));
    if (field==='completed_at'&&value==='is.null') conditions.push('completed_at is null');
    if (field==='completed_at'&&value.startsWith('gte.')) param('completed_at','>=',value.slice(4));
    if (field==='completed_at'&&value.startsWith('lt.')) param('completed_at','<',value.slice(3));
  }
  const where = conditions.length ? ' where '+conditions.join(' and ') : '';
  const order = query.get('order')?.startsWith('completed_at') ? 'completed_at desc,id asc' : 'due_at asc,id asc';
  values.push(Math.min(Number(query.get('limit')||250),1000), Number(query.get('offset')||0));
  const rows = await as(user,`select to_jsonb(i) as item from ${TABLE} i${where} order by ${order} limit $${values.length-1} offset $${values.length}`,values);
  return rows.map(row=>row.item);
}
const subscriptions=new Map();
function message(ws,event,payload,ref=null,joined=ws.joined,topic=ws.topic) {
  if(ws.readyState!==1)return;
  ws.send(JSON.stringify(ws.binaryProtocol?[joined,ref,topic,event,payload]:{join_ref:joined,ref,topic,event,payload}));
}
async function signal(row,type) {
  if (!row) return;
  for(const [ws,subscription] of subscriptions) {
    if (subscription.shop!==row.shop_id || ws.readyState!==1) continue;
    const allowed = await as(subscription.user,`select id from ${TABLE} where id=$1`,[row.id]);
    if (!allowed.length) continue;
    message(ws,'postgres_changes',{ids:[1],data:{
      type,schema:'public',table:'qlst_checklist_items',record:row,old_record:null,columns:[],
    }});
  }
}
async function appAPI(req,res,url) {
  const endpoint=url.pathname.slice('/preview-db'.length);
  const user=userFrom(req);
  if(endpoint==='/rest/v1/qlst_checklist_items'&&req.method==='GET') return send(res,200,await readTasks(user,url.searchParams));
  const rpcName=endpoint.startsWith('/rest/v1/rpc/')?endpoint.split('/').pop():'';
  if(Object.hasOwn(rpcArguments,rpcName)&&req.method==='POST'){
    const body=await requestBody(req);
    const result=await rpc(user,rpcName,body);
    send(res,200,result);
    if (result.status==='saved'||result.status==='completed')
      await signal(result.item, result.item.revision===1?'INSERT':'UPDATE');
    return;
  }
  if (!user) return send(res,401,{message:'Phiên Preview không hợp lệ'});
  if (endpoint==='/rest/v1/profiles') return send(res,200,[user]);
  if (endpoint==='/rest/v1/work_shops') return send(res,200,accessibleShops(user).map(([,shop])=>shop));
  if (endpoint==='/rest/v1/work_shop_memberships') {
    const filter=url.searchParams.get('shop_id');
    if (!filter) return send(res,200,accessibleShops(user).map(([key,shop])=>({shop_id:shop.id,shop_role:user.assignments[key],active:true})));
    const linked=accessibleShops(user).find(([,s])=>'eq.'+s.id===filter);
    const rows = linked ? Object.values(users).filter(u=>u.assignments[linked[0]]).map(u=>
      ({user_id:u.id,shop_role:u.assignments[linked[0]],active:u.active,profile:u})) : [];
    return send(res,200,rows);
  }
  if (endpoint==='/functions/v1/manage-shops') return send(res,200,{ready:true,members:[]});
  if (endpoint.startsWith('/functions/v1/')) return send(res,200,{});
  if (endpoint.startsWith('/rest/v1/')) return send(res,200,[]);
  return send(res,404,{message:'Chỉ có chức năng thử nghiệm nội bộ'});
}
const server=createServer(async (req,res)=>{
  const url=new URL(req.url,'http://localhost');
  try {
    if (url.pathname.startsWith('/preview-db/')) return await appAPI(req,res,url);
    if (url.pathname==='/result'&&req.method==='POST') {
      await writeFile(join(dir,'../browser-result.json'),JSON.stringify(await requestBody(req),null,2)+'\n');
      return send(res,204,null);
    }
    if (url.pathname==='/demo-data.js') return send(res,200,'window.fixture=Object.freeze('+JSON.stringify({shops,sessions})+');','application/javascript');
    if (url.pathname==='/app/config.js') return send(res,200,demoConfig,'application/javascript');
    if (url.pathname.startsWith('/app/')) {
      const rel=decodeURIComponent(url.pathname.slice('/app/'.length))||'index.html';
      const file=resolve(staticRoot,rel);
      if(!file.startsWith(staticRoot+'/'))return send(res,404,{message:'Không tìm thấy trang'});
      return send(res,200,await readFile(file),types[extname(file)]||'application/octet-stream');
    }
    const page = {'/':'preview.html','/qa.js':'browser.test.js'}[url.pathname];
    if(page)return send(res,200,await readFile(join(dir,page)),types[extname(page)]);
    return send(res,404,{message:'Không tìm thấy trang'});
  } catch(error) {
    if (res.headersSent) { console.error('Fixture signal:',error.message); return; }
    const status=error.code==='42501'?403:error.code==='P0002'||error.code==='ENOENT'?404:400;
    return send(res,status,{message:error.message,code:error.code});
  }
});
const wss=new WebSocketServer({noServer:true});
server.on('upgrade',(req,socket,head)=>{
  const url = new URL(req.url,'http://localhost');
  if(url.pathname!=='/preview-db/realtime/v1/websocket'){socket.destroy();return}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws));
});
wss.on('connection',ws=>{
  ws.on('message',async raw=>{
    try{
      const decoded=JSON.parse(raw);
      ws.binaryProtocol=Array.isArray(decoded);
      const [joined,ref,topic,event,payload]=ws.binaryProtocol?decoded:
        [decoded.join_ref,decoded.ref,decoded.topic,decoded.event,decoded.payload];
      const reply=(response={},status='ok')=>message(ws,'phx_reply',{status,response},ref,joined,topic);
      if(event==='heartbeat') { reply(); return; }
      if(event==='phx_leave') { subscriptions.delete(ws); reply(); return; }
      if(event==='access_token') {
        const member=tokens.get(payload.access_token);
        if(subscriptions.has(ws)&&member)subscriptions.get(ws).user=member;
        reply();
        return;
      }
      if(event!=='phx_join')return;
      const user=tokens.get(payload.access_token);
      const filter=payload.config.postgres_changes[0];
      const shop=filter?.filter?.replace(/^shop_id=eq\./,'');
      if (!user||!shop||filter.table!=='qlst_checklist_items') { reply({reason:'Unknown fixture channel'},'error'); return; }
      const [{allowed}]=await as(user,'select qlst_checklist_private.can_access($1) as allowed',[shop]);
      if(!allowed) { reply({reason:'Scope denied'},'error'); return; }
      ws.joined=joined;
      ws.topic=topic;
      subscriptions.set(ws,{shop,user});
      reply({postgres_changes:[{...filter,id:1}]});
    }catch(error){ console.error('Fixture websocket:',error.message); ws.close(); }
  });
  ws.on('close',()=>subscriptions.delete(ws));
});
function arg(name, fallback) {
  const i=process.argv.indexOf(name);
  return i===-1?fallback:process.argv[i+1];
}
server.listen(Number(arg('--port',4173)),arg('--host','127.0.0.1'),()=>console.log('Checklist preview. PostgreSQL fixture ready.'));
