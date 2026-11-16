// Companion-MWG / BÁO GIÁ: read public product metadata from approved TGDD domains.
// Server-side only (browser fetch to retail sites would be blocked by CORS).
const BASE=Deno.env.get('SUPABASE_URL')||'';
const ANON=Deno.env.get('SUPABASE_ANON_KEY')||'';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const APPROVED=['dienmayxanh.com','thegioididong.com'];
const allowedHost=(h:string)=>APPROVED.some(d=>h===d||h.endsWith('.'+d));
const cors=(origin:string)=>({
 'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin',
 'access-control-allow-origin':/^https:\/\/([a-z0-9-]+\.)?(?:112191work|supportmwg)\.pages\.dev$/i.test(origin)?origin:'https://supportmwg.pages.dev',
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
function readMeta(html:string,target:URL){
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
 const candidates:{url:string;source:string}[]=[];
 const add=(v:unknown,source:string)=>{
  if(typeof v==='string'&&v.length>5)candidates.push({url:v,source});
  else if(v&&typeof v==='object'){
   if(Array.isArray(v))v.slice(0,30).forEach(x=>add(x,source));
   else{
    const x=v as Record<string,unknown>;
    add(x.url||x.contentUrl||x.src,source);
   }
  }
 };
 // Prioritize actual Product schema images over generic share-card / advertising banners.
 const ldBlocks=html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
 for(const block of ldBlocks){
  try{
   const raw=JSON.parse(block[1]);
   const nodes=Array.isArray(raw)?raw:Array.isArray(raw['@graph'])?raw['@graph']:[raw];
   for(const n of nodes){
    const obj=n as Record<string,unknown>;
    if(!obj||typeof obj!=='object')continue;
    const type=Array.isArray(obj['@type'])?obj['@type'].join(' '):String(obj['@type']||'');
    if(!/\bProduct\b/i.test(type))continue;
    if(typeof obj.name==='string'&&obj.name.trim())title=obj.name.trim();
    add(obj.image,'schema-product');
   }
  }catch{ /* ignore malformed JSON-LD */ }
 }
 add(found.get('og:image:secure_url'),'og');
 add(found.get('og:image'),'og');
 add(found.get('twitter:image'),'twitter');
 // Image src attributes are only a fallback. Marketing photos are filtered below.
 for(const m of html.matchAll(/<(?:img|source)\b[^>]*(?:data-src|src|data-original)\s*=\s*["']([^"']+)["'][^>]*>/gi)){
  if(candidates.length>150)break;
  if(/Products\/Images|timerseo/i.test(m[1]))add(decode(m[1]),'gallery');
 }
 const image=chooseHeroImage(candidates,target);
 title=String(title||'').replace(/\s*\|\s*(Điện máy XANH|Thế Giới Di Động|Thegioididong).*$/i,'').replace(/\s+/g,' ').trim().slice(0,250);
 return {title,image};
}

async function readPage(url:URL){
 let current=url;
 for(let i=0;i<4;i++){
  const response=await fetch(current,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(5000),
   headers:{'accept':'text/html,application/xhtml+xml','accept-language':'vi-VN,vi;q=0.9,en;q=0.6',
    'user-agent':'Mozilla/5.0 (compatible; CompanionMWG-QuotationBot/1.0)'}});
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
  const info=readMeta(raw,current);
  let image='';
  if(info.image){
   try{const img=new URL(info.image,current);if(img.protocol==='https:')image=img.href}catch{ /* no image */ }
  }
  return {title:info.title,image,url:current.href};
 }
 throw new Error('Trang sản phẩm chuyển hướng quá nhiều lần');
}

type ProductResult={title:string;image:string;url:string;source?:string;warning?:string;cached?:boolean};
const cacheHeaders={apikey:SERVICE,Authorization:'Bearer '+SERVICE,'content-type':'application/json'};
function cacheKey(u:URL):string{
 // Remove campaign/tracking query parameters while keeping the product SKU variant.
 const key=u.origin+u.pathname.replace(/\/+$/,'')+(u.searchParams.get('code')?'?code='+encodeURIComponent(u.searchParams.get('code')||''):'');
 return key.slice(0,2400);
}
function safeImage(value:string):string{
 try{
  const uri=new URL(value);
  const h=uri.hostname.toLowerCase();
  if(uri.protocol!=='https:'||uri.username||uri.password||(!h.endsWith('.tgdd.vn')&&h!=='tgdd.vn'))return '';
  return uri.href;
 }catch{return ''}
}
type CandidateImage={url:string;source:string};
function normalizeRetailImage(raw:string):string{
 // Image CDN often exposes resizer URLs wrapping the real product image.
 const value=decode(String(raw||'')).replace(/\\_/g,'_').replace(/\\-/g,'-');
 const nested=value.lastIndexOf('https://cdn.tgdd.vn/');
 const link=nested>=0?value.slice(nested):value;
 return safeImage(link);
}
function heroImageScore(raw:string,target:URL,source:string):number{
 const candidate=normalizeRetailImage(raw);
 if(!candidate)return -1000;
 const path=new URL(candidate).pathname;
 const low=decodeURIComponent(path).toLowerCase();
 // These photos contain banners, feature text, collages or promotions.
 if(/\/slider\/|\/banner\/|(?:banner|promo|promotion|khuyen-mai|khuyenmai|tra-gop|tragop|gia-hop-ly|marketing|infographic|feature-)/i.test(low))
   return -1000;
 if(/\.gif(?:$|\?)/i.test(low))return -1000;
 const clean=/-clean(?:[-_.]|$)|-isolated(?:[-_.]|$)|-main(?:[-_.]|$)/i.test(low);
 const productImage=/\/products\/images\//i.test(low);
 const timer=/\/timerseo\//i.test(low);
 if(!clean&&!productImage)return -1000;
 // Do not accept editorial gallery frames as hero shots unless the product SKU
 // or actual model is represented by their file path.
 if(productImage&&!clean){
   const code=target.searchParams.get('code')||'';
   const slug=target.pathname.split('/').filter(Boolean).at(-1)||'';
   const models=slug.toLowerCase().split('-').filter(x=>x.length>=4&&/\d/.test(x));
   if(!(code&&low.includes(code))&&!models.some(x=>low.includes(x)))return -1000;
 }
 if(timer&&!clean)return -1000; // SEO feature banners are not isolated product photographs.
 let score=clean?250:0;
 if(productImage)score+=95;
 if(timer)score+=10;
 if(source==='schema-product')score+=55;
 else if(source==='og')score+=30;
 else if(source==='cache')score+=25;
 else if(source==='reader')score+=10;
 const itemCode=target.searchParams.get('code');
 if(itemCode&&path.includes(itemCode))score+=60;
 const slugPieces=target.pathname.split('/').filter(Boolean).at(-1)?.toLowerCase().split('-')||[];
 const modelTokens=slugPieces.filter(t=>/\d/.test(t)&&t.length>=3);
 if(modelTokens.some(token=>low.includes(token)))score+=25;
 if(/\b(?:600x600|700x700|500x500|400x400|450x450|300x300)\b/i.test(low))score+=8;
 if(/-1020x570|-1460x940|_banner|loi-gia/i.test(low))score-=75;
 return score;
}
function chooseHeroImage(candidates:CandidateImage[],target:URL):string{
 let best='',max=85;
 for(const item of candidates){
  const url=normalizeRetailImage(item.url);
  if(!url)continue;
  const score=heroImageScore(url,target,item.source);
  if(score>max){max=score;best=url;}
 }
 return best;
}

async function cached(key:string):Promise<ProductResult|null>{
 try{
  const link=BASE+'/rest/v1/quote_product_cache?url_key=eq.'+encodeURIComponent(key)+'&select=title,image,source,expires_at&limit=1';
  const res=await fetch(link,{headers:cacheHeaders,signal:AbortSignal.timeout(2500)});
  if(!res.ok)return null;
  const rows=await res.json();
  if(!Array.isArray(rows)||!rows.length||!rows[0]?.title||!rows[0]?.image)return null;
  if(Date.parse(rows[0].expires_at)<Date.now())return null;
  const image=chooseHeroImage([{url:rows[0].image,source:'cache'}],new URL(key));
  return image?{title:String(rows[0].title),image,url:key,source:rows[0].source||'cache',cached:true}:null;
 }catch{return null}
}
async function writeCache(key:string,item:ProductResult){
 if(!item.title||!item.image)return;
 try{
  await fetch(BASE+'/rest/v1/quote_product_cache?on_conflict=url_key',{
   method:'POST',signal:AbortSignal.timeout(3000),
   headers:{...cacheHeaders,Prefer:'resolution=merge-duplicates,return=minimal'},
   body:JSON.stringify({url_key:key,title:item.title,image:item.image,source:item.source||'metadata',
     fetched_at:new Date().toISOString(),expires_at:new Date(Date.now()+14*86400000).toISOString()})
  });
 }catch{ /* Metadata cache is best-effort; never break quotation */ }
}
function parseReaderMarkdown(body:string,target:URL):ProductResult{
 const titleText=(body.match(/^Title:\s*(.+)$/m)||body.match(/^#\s+(.+)$/m)||[])[1]||'';
 const title=decode(titleText).replace(/\s+-\s+(giá rẻ|giao ngay|mua ngay|chính hãng).*$/i,'').replace(/\s+/g,' ').trim().slice(0,250);
 const matches=[...body.matchAll(/!\[([^\]]{0,300})\]\((https:\/\/[^)\s]{1,1200})\)/gi)];
 const images=matches.map(m=>({url:m[2],source:'reader'}));
 const image=chooseHeroImage(images,target);
 return {title,image,url:target.href,source:'reader-fallback'};
}

async function readerFallback(target:URL):Promise<ProductResult>{
 // Reader accesses only the already validated public product page. Do not forward
 // authentication headers or customer data to the external extraction service.
 const source=new URL(target.href);
 source.hash='';
 const u='https://r.jina.ai/'+source.href;
 const response=await fetch(u,{signal:AbortSignal.timeout(15000),
  headers:{Accept:'text/plain','X-Return-Format':'markdown'}});
 if(!response.ok)throw new Error('Fallback reader HTTP '+response.status);
 const type=response.headers.get('content-type')||'';
 if(!/text|json|markdown/i.test(type))throw new Error('Fallback reader content type unsupported');
 const text=await response.text();
 if(text.length>600000)throw new Error('Fallback reader too large');
 const item=parseReaderMarkdown(text,target);
 if(!item.title||!item.image)throw new Error('Fallback reader thiếu tên hoặc hình');
 item.url=target.href;
 return item;
}
async function resolveProduct(target:URL):Promise<ProductResult>{
 const key=cacheKey(target);
 const existing=await cached(key);
 if(existing)return existing;
 const partials:ProductResult[]=[];
 const requireComplete=async(p:Promise<ProductResult>):Promise<ProductResult>=>{
  const item=await p;
  item.image=chooseHeroImage([{url:item.image,source:item.source||'metadata'}],target);
  if(item.title&&item.image)return item;
  if(item.title)partials.push(item);
  throw new Error('Thiếu hình sản phẩm');
 };
 let item:ProductResult;
 try{
  item=await Promise.any([
   requireComplete(readPage(target).then(x=>({...x,source:'official-metadata'}))),
   requireComplete(readerFallback(target))
  ]);
 }catch{
  // Return a partial title only when an actual source supplied it; do not fabricate a photo.
  const p=partials.find(x=>x.title);
  if(p)return {...p,image:'',warning:'Trang nguồn chưa cung cấp ảnh; hãy dán link ảnh dự phòng.'};
  throw new Error('Không đọc được trang Điện Máy Xanh tự động. Anh thử lại hoặc dùng tên và ảnh dự phòng.');
 }
 // Save cache asynchronously? Await to ensure subsequent devices see this immediately.
 await writeCache(key,item);
 return item;
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
  const meta=await resolveProduct(target);
  return result(req,200,{ok:true,...meta});
 }catch(e){
  const reason=e instanceof Error?e.message:'Không nhận diện được sản phẩm';
  return result(req,422,{error:reason.slice(0,250)});
 }
});
