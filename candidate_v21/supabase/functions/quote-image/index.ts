// Companion-MWG · authenticated image resolver for quotation exports only.
// Browser cannot embed non-CORS retail images into html2canvas/PDF.
// Restrict to the public TGDD CDN. Never proxy arbitrary URLs or private networks.
const BASE=Deno.env.get('SUPABASE_URL')||'';
const ANON=Deno.env.get('SUPABASE_ANON_KEY')||'';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const originOk=(o:string)=>/^https:\/\/([a-z0-9-]+\.)?(?:112191work|supportmwg)\.pages\.dev$/i.test(o);
const cors=(o:string)=>({
 'content-type':'application/json;charset=utf-8',
 'cache-control':'no-store',
 'vary':'Origin',
 'access-control-allow-origin':originOk(o)?o:'https://supportmwg.pages.dev',
 'access-control-allow-headers':'authorization,apikey,content-type',
 'access-control-allow-methods':'POST,OPTIONS'
});
const answer=(req:Request,status:number,payload:Record<string,unknown>)=>
 new Response(JSON.stringify(payload),{status,headers:cors(req.headers.get('origin')||'')});
const allowedImageHost=(host:string)=>[
 'cdn.tgdd.vn','cdnv2.tgdd.vn','cdn2.tgdd.vn','cdn.tgdd.vn',
 'cdn.dienmayxanh.com','cdn.thegioididong.com'
].includes(host);
function checked(raw:string){
 const u=new URL(raw);
 if(u.protocol!=='https:'||u.username||u.password||u.port||!allowedImageHost(u.hostname.toLowerCase())||
   raw.length>1800)
  throw Error('Ảnh phải thuộc máy chủ hình sản phẩm chính thức');
 return u;
}
async function getImage(url:URL){
 let target=url;
 for(let redirect=0;redirect<=2;redirect++){
  const res=await fetch(target,{redirect:'manual',signal:AbortSignal.timeout(10000),
   headers:{'Accept':'image/jpeg,image/png,image/webp,*/*;q=0.1',
    'User-Agent':'Mozilla/5.0 (compatible; Companion-MWG/1.0)'}});
  if(res.status>=300&&res.status<400){
   const next=res.headers.get('location');
   if(!next)throw Error('Không lấy được đường dẫn ảnh');
   target=checked(new URL(next,target).href);
   continue;
  }
  if(!res.ok)throw Error('Máy chủ ảnh trả lỗi '+res.status);
  const type=(res.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  if(!['image/jpeg','image/png','image/webp'].includes(type))
   throw Error('Ảnh không đúng định dạng JPG/PNG/WebP');
  const size=Number(res.headers.get('content-length')||0);
  if(size>3500000)throw Error('Ảnh sản phẩm quá lớn');
  const reader=res.body?.getReader();
  if(!reader)throw Error('Máy chủ ảnh không có dữ liệu');
  const chunks:Uint8Array[]=[];let total=0;
  for(;;){
   const {value,done}=await reader.read();
   if(done)break;
   total+=value?.byteLength||0;
   if(total>3500000){reader.cancel().catch(()=>{});throw Error('Ảnh sản phẩm vượt 3,5MB')}
   if(value)chunks.push(value);
  }
  if(total<100)throw Error('Ảnh sản phẩm không có nội dung');
  const data=new Uint8Array(total);
  let pos=0;
  for(const chunk of chunks){data.set(chunk,pos);pos+=chunk.byteLength}
  // Chunked encoding avoids exceeding the maximum argument length in V8.
  let bin='';
  for(let i=0;i<data.length;i+=0x4000)
   bin+=String.fromCharCode(...data.subarray(i,i+0x4000));
  return {data_url:'data:'+type+';base64,'+btoa(bin),bytes:total};
 }
 throw Error('Ảnh chuyển hướng quá nhiều lần');
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(req.headers.get('origin')||'')});
 if(req.method!=='POST')return answer(req,405,{error:'Chỉ hỗ trợ POST'});
 try{
  if(!BASE||!ANON||!SERVICE)return answer(req,503,{error:'Máy chủ ảnh chưa cấu hình'});
  const token=req.headers.get('authorization')||'';
  if(!token.startsWith('Bearer '))return answer(req,401,{error:'Cần đăng nhập để tải ảnh'});
  const userRes=await fetch(BASE+'/auth/v1/user',{headers:{apikey:ANON,Authorization:token},
   signal:AbortSignal.timeout(4500)});
  if(!userRes.ok)return answer(req,401,{error:'Phiên đăng nhập đã hết hạn'});
  const user=await userRes.json();
  const id=String(user?.id||'');
  if(!/^[0-9a-f-]{36}$/i.test(id))return answer(req,401,{error:'Tài khoản không hợp lệ'});
  const p=await fetch(BASE+'/rest/v1/profiles?id=eq.'+encodeURIComponent(id)+'&select=active,must_change_password&limit=1',{
   headers:{apikey:SERVICE,Authorization:'Bearer '+SERVICE},signal:AbortSignal.timeout(5000)});
  const users=await p.json();
  if(!p.ok||!Array.isArray(users)||!users[0]?.active||users[0]?.must_change_password)
   return answer(req,403,{error:'Tài khoản không có quyền tải ảnh'});
  const body=await req.json();
  const url=checked(String(body?.url||''));
  const img=await getImage(url);
  return answer(req,200,{ok:true,...img});
 }catch(e){
  const msg=e instanceof Error?e.message:'Không đọc được ảnh';
  return answer(req,422,{error:msg.slice(0,220)});
 }
});