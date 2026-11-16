// 112191 WORK / BÁO GIÁ: read public product metadata from approved TGDD domains.
// Server-side only (browser fetch to retail sites would be blocked by CORS).
const BASE=Deno.env.get('SUPABASE_URL')||'';
const ANON=Deno.env.get('SUPABASE_ANON_KEY')||'';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const APPROVED=['dienmayxanh.com','thegioididong.com'];
const allowedHost=(h:string)=>APPROVED.some(d=>h===d||h.endsWith('.'+d));
const cors=(origin:string)=>({
 'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin',
 'access-control-allow-origin':/^https:\/\/([a-z0-9-]+\.)?112191work\.pages\.dev$/i.test(origin)?origin:'https://112191work.pages.dev',
 'access-control-allow-headers':'authorization,apikey,content-type',
 'access-control-allow-methods':'POST,OPTIONS'
});
function result(req:Request,status:number,value:Record<string,unknown>){
 return new Response(JSON.stringify(value),{status,headers:cors(req.headers.get('origin')||'')});
}
function permitted(raw:string){
 const u=new URL(raw);
 if(u.protocol!=='https:'||u.username||u.password||u.port||!allowedHost(u.hostname.toLowerCase()))
  throw new Error('Chỉ hỗ trợ link sản phẩm HTTPS của Điện Máy Xanh / Thế Giới Di Động');
 if(raw.length>2048)throw new Error('Link quá dài');
 return u;
}
const decode=(t:string)=>t.replace(/&(?:amp|quot|lt|gt|apos|nbsp|#39|#x27|#34|#(\d+)|#x([0-9a-f]+));/gi,(m,decimal,hex)=>{
 const map:{[key:string]:string}={'&amp;':'&','&quot;':'"','&lt;':'<','&gt;':'>','&apos;':"'",'&#39;':"'",'&#x27;':"'",'&#34;':'"','&nbsp;':' '};
 if(decimal||hex){const n=parseInt(decimal||hex,hex?16:10);return n>=32&&n<0x110000?String.fromCodePoint(n):''}
 return map[m.toLowerCase()]||m;
});
function readMeta(html:string){
 const tags=html.match(/<meta\b[^>]*>/gi)||[];
 const found=new Map<string,string>();
 for(const tag of tags){
  const attrs=new Map<string,string>();
  const rx=/\b([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m:RegExpExecArray|null;
  while((m=rx.exec(tag))!==null)attrs.set(m[1].toLowerCase(),decode(m[2]??m[3]??m[4]??''));
  const key=(attrs.get('property')||attrs.get('name')||'').toLowerCase();
  const value=attrs.get('content')||'';
  if(key&&value&&!found.has(key))found.set(key,value);
 }
 const txt=(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'';
 let title=found.get('og:title')||found.get('twitter:title')||decode(txt.replace(/<[^>]*>/g,''));
 let image=found.get('og:image:secure_url')||found.get('og:image')||found.get('twitter:image')||'';
 if(!image){
  const ld=html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if(ld){
   try{
    const raw=JSON.parse(ld[1]);
    const arr=Array.isArray(raw)?raw:Array.isArray(raw['@graph'])?raw['@graph']:[raw];
    const product=arr.find((x:Record<string,unknown>)=>String(x?.['@type']||'').toLowerCase().includes('product'));
    if(product){title=title||String(product.name||'');const images=product.image;image=typeof images==='string'?images:Array.isArray(images)?String(images[0]||''):'';}
   }catch{ /* Keep OG fallback */ }
  }
 }
 title=String(title||'').replace(/\s*\|\s*(Điện máy XANH|Thế Giới Di Động|Thegioididong).*$/i,'').replace(/\s+/g,' ').trim().slice(0,250);
 return {title,image};
}
async function readPage(url:URL){
 let current=url;
 for(let i=0;i<4;i++){
  const response=await fetch(current,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(9000),
   headers:{'accept':'text/html,application/xhtml+xml','accept-language':'vi-VN,vi;q=0.9,en;q=0.6',
    'user-agent':'Mozilla/5.0 (compatible; 112191WORK-QuotationBot/1.0)'}});
  if([301,302,303,307,308].includes(response.status)){
   const next=response.headers.get('location');
   if(!next)throw new Error('Sản phẩm chuyển hướng không hợp lệ');
   current=permitted(new URL(next,current).href);continue;
  }
  if(!response.ok)throw new Error('Trang sản phẩm không cho truy cập tự động (HTTP '+response.status+')');
  const type=response.headers.get('content-type')||'';
  if(!/text\/html|application\/xhtml/i.test(type))throw new Error('Đây không phải trang sản phẩm HTML');
  const reader=response.body?.getReader();
  if(!reader)throw new Error('Không tải được nội dung trang');
  const chunks:Uint8Array[]=[];let size=0;
  const MAX_BYTES=1400000;
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   if(value){
    const remaining=MAX_BYTES-size;
    if(remaining<=0){await reader.cancel();break}
    const bounded=value.byteLength>remaining?value.slice(0,remaining):value;
    chunks.push(bounded);size+=bounded.byteLength;
    if(size===MAX_BYTES){await reader.cancel();break}
   }
  }
  const merged=new Uint8Array(size);
  let off=0;for(const chunk of chunks){merged.set(chunk,off);off+=chunk.byteLength;}
  const raw=new TextDecoder().decode(merged);
  const info=readMeta(raw);
  let image='';
  if(info.image){
   try{const img=new URL(info.image,current);if(img.protocol==='https:')image=img.href}catch{ /* no image */ }
  }
  return {title:info.title,image,url:current.href};
 }
 throw new Error('Trang sản phẩm chuyển hướng quá nhiều lần');
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(req.headers.get('origin')||'')});
 if(req.method!=='POST')return result(req,405,{error:'Chỉ hỗ trợ POST'});
 try{
  if(!BASE||!ANON||!SERVICE)return result(req,503,{error:'Máy chủ chưa cấu hình'});
  const auth=req.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer '))return result(req,401,{error:'Cần đăng nhập'});
  const token=auth.slice(7);
  const userResponse=await fetch(BASE+'/auth/v1/user',{headers:{apikey:ANON,Authorization:'Bearer '+token}});
  if(!userResponse.ok)return result(req,401,{error:'Phiên đăng nhập không hợp lệ'});
  const user=await userResponse.json();
  const id=String(user.id||'');
  if(!/^[a-f0-9-]{36}$/i.test(id))return result(req,401,{error:'Tài khoản không hợp lệ'});
  const profile=await fetch(BASE+'/rest/v1/profiles?id=eq.'+encodeURIComponent(id)+'&select=active,must_change_password&limit=1',{
   headers:{apikey:SERVICE,Authorization:'Bearer '+SERVICE}});
  const users=await profile.json();
  if(!profile.ok||!Array.isArray(users)||!users[0]?.active||users[0]?.must_change_password)
   return result(req,403,{error:'Tài khoản chưa được kích hoạt'});
  const body=await req.json();
  const target=permitted(String(body?.url||'').trim());
  const meta=await readPage(target);
  return result(req,200,{ok:true,...meta});
 }catch(e){
  const reason=e instanceof Error?e.message:'Không nhận diện được sản phẩm';
  return result(req,400,{error:reason.slice(0,250)});
 }
});
