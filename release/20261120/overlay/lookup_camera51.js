/* Companion-MWG v3.5.1: read-only camera to look up a product code; NEVER invokes inventory scan RPC. */
(function(){
'use strict';
const FORMATS=['qr_code','ean_13','ean_8','upc_a','upc_e','code_128','code_39','code_93','itf','data_matrix'];
const C={id:null,active:false,epoch:0,starting:null,decoder:null,stream:null,video:null,reader:null,loop:0,html5:null,stopping:null,accepted:false};
let libPromise=null;
function preload(){
 if(window.Html5Qrcode)return Promise.resolve();
 if(libPromise)return libPromise;
 libPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';script.async=true;
  let done=false;const timeout=setTimeout(()=>finish(new Error('Bộ giải mã QR tải quá lâu')),12000);
  function finish(err){if(done)return;done=true;clearTimeout(timeout);if(err){script.remove();reject(err)}else resolve()}
  script.onload=()=>finish(window.Html5Qrcode?null:new Error('Bộ giải mã QR không khởi động'));
  script.onerror=()=>finish(new Error('Không kết nối được CDN bộ quét QR'));
  document.head.appendChild(script);
 }).catch(async()=>{
  if(window.Html5Qrcode)return;
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';script.async=true;
   script.onload=()=>window.Html5Qrcode?resolve():reject(new Error('Bộ quét QR không hoạt động'));
   script.onerror=()=>reject(new Error('Không tải được bộ quét QR. Kiểm tra Internet.'));
   document.head.appendChild(script);
  });
 }).catch(err=>{libPromise=null;throw err});
 return libPromise;
}
function decodeCode(raw){
 let s=String(raw??'').trim();if(!s)return '';
 if(s.length>600)return '';
 if(s[0]==='{'&&s.endsWith('}')){try{const j=JSON.parse(s);s=String(j.product_code||j.productCode||j.sku||j.code||'').trim()}catch{return ''}}
 if(/^https?:\/\//i.test(s)){
  try{
   const u=new URL(s);
   s=u.searchParams.get('sku')||u.searchParams.get('product_code')||u.searchParams.get('productCode')||u.searchParams.get('ma_sp')||u.searchParams.get('code')||'';
  }catch{return ''}
 }
 s=s.replace(/^(?:MÃ\s*SẢN\s*PHẨM|MA\s*SAN\s*PHAM|MÃ\s*SP|MA\s*SP|SKU|PRODUCT\s*CODE|CODE)\s*[:=\-]\s*/i,'').trim();
 // Reject arbitrary paragraphs, control characters, URLs or very long QR content.
 if(!s||s.length>100||/\s/.test(s)||/[\x00-\x1f<>"'{}]/.test(s)||/^(?:https?|www)[:/.]/i.test(s))return '';
 return s;
}
function message(x){
 const n=document.getElementById('inv51-lookup-status');if(n){n.textContent=x;n.setAttribute('role','status')}
}
function buttonText(){const b=document.querySelector('[data-lookup-camera="'+C.id+'"]');if(b){b.textContent=C.active?'✕ Tắt camera':'📷 Quét QR / mã vạch';b.disabled=false}}
function panelFor(id){
 const input=document.getElementById(id);if(!input)throw new Error('Ô mã sản phẩm không còn hiển thị');
 const tools=input.closest('.inv51-lookup-tools');if(!tools)throw new Error('Không tìm thấy vùng tra cứu');
 let holder=document.getElementById('inv51-lookup-reader');
 if(!holder){holder=document.createElement('div');holder.id='inv51-lookup-reader';holder.className='inv51-lookup-reader';holder.innerHTML='<div class="inv51-camera-screen" id="inv51-camera-screen"></div><div class="inv51-lookup-status" id="inv51-lookup-status" role="status">Đang khởi tạo camera...</div>';tools.insertAdjacentElement('afterend',holder)}
 C.reader=holder;return holder;
}
async function accept(raw,epoch){
 if(epoch!==C.epoch||!C.active||C.accepted)return;
 const id=C.id;
 const code=id==='act56-imei'?String(raw??'').trim().replace(/^(?:IMEI(?:\s*[12])?|IMEISV|SERIAL(?:\s*NUMBER)?|S\/?N|SN)\s*[:=\-]\s*/i,'').replace(/\s+/g,''):decodeCode(raw);
 if(!code||code.length>100||/[\x00-\x1f<>"'{}]/.test(code)){message('Mã QR chưa phải mã '+(id==='act56-imei'?'IMEI':'sản phẩm')+' hợp lệ.');return}
 C.accepted=true;message('✓ ĐÃ NHẬN MÃ: '+code+' · Đang tra cứu...');
 // Always stop before updating lookup, to avoid a scan writing to any inventory quantity.
 await stop();
 const input=document.getElementById(id);
 if(input){input.value=code;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();if(id==='act56-code'||id==='act56-imei')document.dispatchEvent(new CustomEvent('mwg-active-scan',{detail:{targetId:id,code}}))}
 if(navigator.vibrate)try{navigator.vibrate(40)}catch{}
}
function active(){return C.active||!!C.starting}
async function startNative(id,epoch){
 const video=document.createElement('video');video.autoplay=true;video.muted=true;video.playsInline=true;
 video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.setAttribute('muted','');
 const container=document.getElementById('inv51-camera-screen');if(!container)throw new Error('Mất vùng camera');
 container.appendChild(video);C.video=video;
 // Call getUserMedia in the original user-gesture stack for iPhone Safari.
 const streamPromise=navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}});
 C.starting=streamPromise;
 const stream=await streamPromise;
 if(epoch!==C.epoch){stream.getTracks().forEach(t=>t.stop());return}
 C.stream=stream;video.srcObject=stream;
 try{await video.play()}catch(e){throw new Error('Không phát được hình camera: '+e.message)}
 if(epoch!==C.epoch)return;
 let detector;
 try{detector=new window.BarcodeDetector({formats:FORMATS})}
 catch(e){detector=new window.BarcodeDetector()}
 C.decoder=detector;message('Đưa mã QR hoặc mã vạch vào khung. Tự tra cứu ngay khi nhận.');
 let checking=false,previous=0;
 const loop=async time=>{
  if(epoch!==C.epoch||!C.active||C.accepted)return;
  C.loop=requestAnimationFrame(loop);
  if(checking||time-previous<100||video.readyState<2)return;
  checking=true;previous=time;
  try{
   const barcodes=await detector.detect(video);
   if(epoch!==C.epoch||!C.active)return;
   for(const barcode of barcodes){const code=C.id==='act56-imei'?String(barcode.rawValue??'').trim():decodeCode(barcode.rawValue);if(code){await accept(code,epoch);break}}
  }catch(err){if(epoch===C.epoch)message('Camera đang nhận diện, vui lòng giữ mã rõ nét.');}
  finally{checking=false}
 };
 C.loop=requestAnimationFrame(loop);
}
async function startHtml5(id,epoch){
 const reader=document.getElementById('inv51-camera-screen');if(!reader)throw new Error('Mất khung quét QR');
 reader.style.minHeight='260px';
 const fmt=window.Html5QrcodeSupportedFormats||{};
 const enabled=['QR_CODE','EAN_13','EAN_8','UPC_A','UPC_E','CODE_128','CODE_39','CODE_93','ITF'].map(x=>fmt[x]).filter(Number.isInteger);
 const scanner=new window.Html5Qrcode('inv51-camera-screen',{verbose:false,useBarCodeDetectorIfSupported:true,...(enabled.length>2?{formatsToSupport:enabled}:{})});
 C.html5=scanner;
 // html5.start is called before any await on the click's stack.
 const promise=scanner.start({facingMode:'environment'},
  {fps:30,disableFlip:true,qrbox:(w,h)=>({width:Math.max(130,Math.min(460,w-12)),height:Math.max(120,Math.min(260,h-12))})},
  data=>{if(epoch===C.epoch)accept(data,epoch).catch(err=>message('Lỗi quét: '+err.message))},()=>{});
 C.starting=Promise.resolve(promise);
 await C.starting;
 if(epoch===C.epoch)message('Đưa mã QR hoặc mã vạch vào khung. Tự tra cứu khi nhận được mã.');
}
async function start(id){
 if(!['invQuickCode','imei50-quick-code','act56-code','act56-imei'].includes(id))return;
 if(C.active){if(C.id===id)return stop();await stop()}
 if(!navigator.mediaDevices?.getUserMedia)throw new Error('Cần mở ứng dụng trên HTTPS và cho phép sử dụng camera');
 C.id=id;C.active=true;C.accepted=false;const epoch=++C.epoch;
 panelFor(id);buttonText();
 try{
  if(typeof window.BarcodeDetector==='function')await startNative(id,epoch);
  else if(window.Html5Qrcode)await startHtml5(id,epoch);
  else{
   C.active=false;C.starting=null;buttonText();message('Đang tải bộ quét QR... Anh bấm lại nút CAMERA sau khi tải xong.');
   preload().then(()=>message('Bộ quét đã sẵn sàng. Anh bấm nút CAMERA để mở.')).catch(e=>message(e.message));
  }
 }catch(e){await stop();throw e}
}
async function stop(){
 if(C.stopping)return C.stopping;
 ++C.epoch;C.active=false;C.accepted=true;
 if(C.loop)cancelAnimationFrame(C.loop);C.loop=0;
 // Preserve id until scan result gets delivered; stop is called from a click or a scan result.
 const scanner=C.html5, stream=C.stream,video=C.video,boot=C.starting;
 C.html5=null;C.stream=null;C.video=null;C.decoder=null;C.starting=null;
 C.stopping=(async()=>{
  if(boot)try{await Promise.race([boot,new Promise(res=>setTimeout(res,850))])}catch(e){}
  if(scanner){try{await Promise.race([scanner.stop(),new Promise(res=>setTimeout(res,1200))])}catch{}try{await scanner.clear()}catch{}}
  if(stream)stream.getTracks().forEach(t=>{try{t.stop()}catch{}});
  if(video){for(const t of video.srcObject?.getTracks?.()||[])try{t.stop()}catch{};video.srcObject=null}
  C.reader?.remove();C.reader=null;
 })();
 try{await C.stopping}finally{C.stopping=null;buttonText()}
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-lookup-camera]');if(!b)return;
 e.preventDefault();
 // Do not put an await before the camera operation on iOS.
 start(b.dataset.lookupCamera).catch(err=>{console.warn('Camera tra cứu:',err);const target=document.getElementById(b.dataset.lookupCamera);if(target){let n=document.getElementById('inv51-lookup-status');if(!n){panelFor(target.id);n=document.getElementById('inv51-lookup-status')}if(n)n.textContent='Không thể mở camera: '+err.message}});
});
// Load fallback decoder without opening camera or requesting camera permission.
if(typeof window.BarcodeDetector!=='function')preload().catch(()=>{});
window.MWG_LOOKUP_CAMERA={start,stop,isRunning:active};
})();
