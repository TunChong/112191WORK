/* KIỂM KÊ 4.0 — 112191 WORK. Per-shop stock upload, atomic camera/USB scans and shortage/surplus reports. */
(function(){
'use strict';
const S={shop:null,tab:'stock',sessions:[],sessionId:null,stock:[],counts:[],busy:false,loading:false,
 importing:false,progress:'',query:'',last:null,camera:null,cameraActive:false,lastCameraCode:'',lastCameraAt:0,
 scanBusy:false,scanQueue:Promise.resolve(),sessionBusy:false,requestSerial:0,
 cameraEpoch:0,cameraPhase:'idle',cameraStartPromise:null,cameraStopping:null,scanAccepted:false,scanResult:'',scanError:''};
let H=null;let xlsxLoading=null;let scannerLoading=null;
const unknown='CHƯA CÓ TRONG DANH MỤC';
const esc=x=>H&&H.esc?H.esc(String(x==null?'':x)):String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const notify=x=>H&&H.toast?H.toast(x):console.log(x);
const current=()=>S.sessions.find(x=>x.id===S.sessionId);
const int=x=>Number.isFinite(Number(x))?Math.trunc(Number(x)):0;
const format=x=>int(x).toLocaleString('vi-VN');
function configure(helpers){H=helpers;}
function rpc(name,args){return H.api('/rest/v1/rpc/'+name,{method:'POST',body:args});}
function selectedShop(){return H&&H.shopId?H.shopId():null;}
function manage(){return H&&H.manager&&H.manager();}
function redraw(){if(H&&H.draw)H.draw();}
function compute(stock,counts){
 const byCode=new Map();
 for(const r of stock){
  const code=String(r.product_code||'').trim();if(!code)continue;
  const v=byCode.get(code)||{code,name:r.product_name||unknown,expected:0,counted:0};
  v.expected+=int(r.expected_qty);
  if(v.name===unknown&&r.product_name)v.name=r.product_name;
  byCode.set(code,v);
 }
 for(const r of counts){
  const code=String(r.product_code||'').trim();if(!code)continue;
  const v=byCode.get(code)||{code,name:r.product_name||unknown,expected:0,counted:0};
  v.counted+=int(r.counted_qty);
  if(v.name===unknown&&r.product_name)v.name=r.product_name;
  byCode.set(code,v);
 }
 const missing=[],extra=[];let missingQty=0,extraQty=0;
 for(const v of byCode.values()){
  const delta=v.counted-v.expected;
  if(delta<0){missing.push({...v,variance:-delta});missingQty-=delta;}
  else if(delta>0){extra.push({...v,variance:delta});extraQty+=delta;}
 }
 missing.sort((a,b)=>b.variance-a.variance||a.code.localeCompare(b.code));
 extra.sort((a,b)=>b.variance-a.variance||a.code.localeCompare(b.code));
 return {missing,extra,missingQty,extraQty,all:[...byCode.values()]};
}
function scriptOnce(url,test){
 if(test())return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const el=document.createElement('script');el.src=url;el.async=true;
  el.onload=()=>test()?resolve():reject(new Error('Thư viện không khởi tạo được'));
  el.onerror=()=>reject(new Error('Không thể tải thư viện. Kiểm tra kết nối Internet'));
  document.head.append(el);
 });
}
async function excelLib(){
 if(window.XLSX)return;
 if(!xlsxLoading)xlsxLoading=scriptOnce('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',()=>!!window.XLSX).catch(e=>{xlsxLoading=null;throw e});
 return xlsxLoading;
}
async function scannerLib(){
 if(window.Html5Qrcode)return;
 if(!scannerLoading)scannerLoading=scriptOnce('https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',()=>!!window.Html5Qrcode).catch(e=>{scannerLoading=null;throw e});
 return scannerLoading;
}
// Prefer mainstream retail formats; gracefully retain all when enumeration unavailable.
function fastScannerOptions(){
 const f=window.Html5QrcodeSupportedFormats;
 const names=['QR_CODE','CODE_128','CODE_39','CODE_93','EAN_13','EAN_8','UPC_A','UPC_E','ITF','DATA_MATRIX'];
 const formats=f?names.map(n=>f[n]).filter(n=>Number.isInteger(n)):null;
 return {verbose:false,useBarCodeDetectorIfSupported:true,
  ...(formats&&formats.length===names.length?{formatsToSupport:formats}:{})};
}
function fastScanRegion(w,h){
 // Favor enough height for QR and enough width for traditional 1D barcodes.
 return {width:Math.max(120,Math.min(w-16,360)),height:Math.max(110,Math.min(h-16,250))};
}
const normalizeCode=s=>String(s==null?'':s).trim();
function normalizeQuantity(value){
 const t=String(value==null?'':value).trim().replace(/\s/g,'');
 if(!t)return null;
 if(/^[0-9]+$/.test(t))return Number(t);
 if(/^\d{1,3}([.,]\d{3})+$/.test(t))return Number(t.replace(/[.,]/g,''));
 return null;
}
async function parseFile(file){
 if(!file||!/\.(xlsx|xls|csv)$/i.test(file.name))throw new Error('Chọn file Excel (.xlsx, .xls) hoặc CSV');
 if(file.size>25*1024*1024)throw new Error('File vượt quá 25 MB');
 await excelLib();
 const book=window.XLSX.read(new Uint8Array(await file.arrayBuffer()),{type:'array',cellText:true,cellDates:false});
 const normalized=n=>String(n).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
 const sheetName=book.SheetNames.find(x=>normalized(x)==='TON KHO')||book.SheetNames[0];
 const sh=book.Sheets[sheetName];
 if(!sh)throw new Error('Không thấy sheet TỒN KHO');
 const rows=window.XLSX.utils.sheet_to_json(sh,{header:1,defval:'',raw:false,blankrows:false});
 let header=-1;
 for(let i=0;i<Math.min(30,rows.length);i++){
  const r=rows[i]||[];
  if(normalized(r[0]).includes('MA SAN PHAM')&&normalized(r[1]).includes('TEN SAN PHAM')&&
     (normalized(r[2]).includes('TON')||normalized(r[2]).includes('SO LUONG'))) {header=i;break;}
 }
 if(header<0)throw new Error('Không thấy 3 cột: Mã sản phẩm / Tên sản phẩm / Tồn kho');
 const codeLookup=new Map();
 const catalogName=book.SheetNames.find(x=>normalized(x)==='DANH MUC SAN PHAM');
 if(catalogName){
  const cat=window.XLSX.utils.sheet_to_json(book.Sheets[catalogName],{header:1,raw:false,defval:'',blankrows:false});
  for(let i=1;i<cat.length;i++){
   const c=normalizeCode(cat[i]?.[0]),n=String(cat[i]?.[1]||'').trim();
   if(c&&n&&!codeLookup.has(c))codeLookup.set(c,n);
  }
 }
 const aggregate=new Map();let invalid=0;
 for(let i=header+1;i<rows.length;i++){
  const r=rows[i]||[];
  const code=normalizeCode(r[0]);if(!code)continue;
  const quantity=normalizeQuantity(r[2]);
  if(quantity===null||!Number.isSafeInteger(quantity)||quantity<0||quantity>100000000){invalid++;continue;}
  const rawName=String(r[1]||'').trim();
  const name=rawName||codeLookup.get(code)||unknown;
  if(code.length>100){invalid++;continue;}
  const existing=aggregate.get(code);
  if(existing){
   existing.qty+=quantity;
   if(existing.name===unknown&&name!==unknown)existing.name=name;
  }else aggregate.set(code,{code,name:name.slice(0,300),qty:quantity});
 }
 if(aggregate.size===0)throw new Error('Sheet TỒN KHO chưa có dữ liệu sản phẩm. Anh hãy điền mã và số lượng tồn rồi tải lại.');
 if(invalid>0)throw new Error('Có '+invalid+' dòng tồn kho sai số lượng. Hãy sửa file rồi tải lại để tránh lệch dữ liệu.');
 if(aggregate.size>20000)throw new Error('Mỗi kỳ tối đa 20.000 mã sản phẩm. Hãy tách file kiểm kê');
 return [...aggregate.values()];
}
function keyForShop(shop){return 'work112191_inv_session_'+shop;}
async function load(){
 const shop=selectedShop();if(!shop)return;
 if(shop!==S.shop){await leave();S.shop=shop;S.sessions=[];S.stock=[];S.counts=[];S.sessionId=null;S.last=null;S.query='';}
 const serial=++S.requestSerial;
 S.loading=true;redraw();
 // Preload decoder on opening Inventory without requesting camera permissions.
 if(navigator.mediaDevices?.getUserMedia)scannerLib().catch(()=>{});
 try{
  const q='/rest/v1/inventory_sessions?shop_id=eq.'+encodeURIComponent(shop)+'&select=*&order=created_at.desc&limit=50';
  const sessions=await H.api(q);
  if(serial!==S.requestSerial)return;
  S.sessions=sessions||[];
  const selected=localStorage.getItem(keyForShop(shop));
  S.sessionId=S.sessions.find(x=>x.id===S.sessionId)?.id||S.sessions.find(x=>x.id===selected)?.id||S.sessions[0]?.id||null;
  if(S.sessionId)await readSession(S.sessionId,serial);
  else{S.stock=[];S.counts=[];}
 }catch(e){notify('Kiểm kê 4.0: '+e.message)}
 finally{if(serial===S.requestSerial){S.loading=false;redraw();}}
}
async function readSession(id,serial=S.requestSerial){
 const [stock,counts]=await Promise.all([
  H.api('/rest/v1/inventory_stock?session_id=eq.'+encodeURIComponent(id)+'&select=product_code,product_name,expected_qty&order=product_code.asc&limit=20000'),
  H.api('/rest/v1/inventory_counts?session_id=eq.'+encodeURIComponent(id)+'&select=product_code,product_name,counted_qty,updated_at&order=product_code.asc&limit=20000')
 ]);
 if(serial!==S.requestSerial||S.sessionId!==id)return;
 S.stock=stock||[];S.counts=counts||[];
}
async function changeSession(id){
 if(!S.sessions.some(x=>x.id===id))throw new Error('Kỳ kiểm kê không thuộc SHOP');
 await leave();S.sessionId=id;S.last=null;
 localStorage.setItem(keyForShop(S.shop),id);
 const serial=++S.requestSerial;S.loading=true;redraw();
 try{await readSession(id,serial)}finally{S.loading=false;redraw();}
}
async function createFromFile(form){
 if(!manage())throw new Error('Chỉ Admin hoặc Quản lý SHOP được tải tồn kho');
 if(S.importing)throw new Error('Đang tải file khác');
 const fd=new FormData(form),file=form.querySelector('input[type=file]')?.files?.[0];
 if(!file)throw new Error('Anh chưa chọn file tồn kho');
 S.importing=true;S.progress='Đang đọc file Excel...';redraw();
 let id=null;
 try{
  const parsed=await parseFile(file);
  const title=String(fd.get('title')||'').trim()||'Kiểm kê '+new Date().toLocaleDateString('vi-VN');
  id=await rpc('inventory_create_session',{p_shop:selectedShop(),p_title:title,p_filename:file.name});
  if(!id||typeof id!=='string')throw new Error('Không tạo được kỳ kiểm kê');
  const batches=Math.ceil(parsed.length/200);
  for(let i=0;i<parsed.length;i+=200){
   await rpc('inventory_import_batch',{p_session:id,p_items:parsed.slice(i,i+200)});
   S.progress='Đã ghi '+Math.min(i+200,parsed.length)+' / '+parsed.length+' mã sản phẩm ('+(Math.floor(i/200)+1)+'/'+batches+' lô)';
   const bar=document.getElementById('inv-import-progress');if(bar)bar.textContent=S.progress;
  }
  await rpc('inventory_finish_import',{p_session:id});
  S.importing=false;S.progress='';S.sessionId=id;
  localStorage.setItem(keyForShop(S.shop),id);
  S.tab='stock';notify('Đã tải '+format(parsed.length)+' mã tồn kho. Đã có thể kiểm đếm.');
  await load();
 }catch(e){
  S.importing=false;
  S.progress='';
  // An interrupted session stays "importing" and cannot be scanned, preventing partial stock counts.
  throw new Error(e.message+(id?' (Kỳ chưa hoàn tất được giữ lại để kiểm tra, chưa dùng để kiểm kê)':''));
 }finally{S.importing=false;redraw();}
}
function filterRows(a){const q=S.query.trim().toLowerCase();return q?a.filter(x=>String(x.product_code||x.code).toLowerCase().includes(q)||String(x.product_name||x.name).toLowerCase().includes(q)):a;}
function stockTable(){
 const rows=filterRows(S.stock),shown=rows.slice(0,100);
 return '<div class="inv-scroll"><table class="inv-table"><thead><tr><th>MÃ SẢN PHẨM</th><th>TÊN SẢN PHẨM</th><th>TỒN KHO</th></tr></thead><tbody>'+
 shown.map(r=>'<tr><td class="inv-code">'+esc(r.product_code)+'</td><td>'+esc(r.product_name)+'</td><td class="inv-num">'+format(r.expected_qty)+'</td></tr>').join('')+
 '</tbody></table></div><p class="inv-hint">Hiển thị '+format(shown.length)+' / '+format(rows.length)+' mã. Dùng ô tìm kiếm để xem mã cụ thể.</p>';
}
function countTable(){
 const rows=filterRows(S.counts).sort((a,b)=>(b.updated_at||'').localeCompare(a.updated_at||'')),shown=rows.slice(0,100);
 return '<div class="inv-scroll"><table class="inv-table"><thead><tr><th>MÃ SẢN PHẨM</th><th>TÊN SẢN PHẨM</th><th>ĐÃ QUÉT (TỰ CỘNG)</th></tr></thead><tbody>'+
 shown.map(r=>'<tr><td class="inv-code">'+esc(r.product_code)+'</td><td>'+esc(r.product_name)+'</td><td class="inv-num">'+format(r.counted_qty)+'</td></tr>').join('')+
 '</tbody></table></div><p class="inv-hint">Số lượng chỉ tăng sau khi quét thành công. Không có chức năng sửa số lượng.</p>';
}

function varianceTable(label,rows,type){
 const shown=filterRows(rows.map(r=>({...r,product_code:r.code,product_name:r.name}))).slice(0,100);
 return '<section class="inv-variance '+(type==='missing'?'is-missing':'is-extra')+'"><h3>'+label+'</h3>'+
 '<div class="inv-scroll"><table class="inv-table"><thead><tr><th>MÃ SP</th><th>TÊN SP</th><th>TỒN</th><th>ĐẾM</th><th>SL '+(type==='missing'?'THIẾU':'DƯ')+'</th></tr></thead><tbody>'+
 shown.map(r=>'<tr><td class="inv-code">'+esc(r.code)+'</td><td>'+esc(r.name)+'</td><td class="inv-num">'+format(r.expected)+'</td><td class="inv-num">'+format(r.counted)+'</td><td class="inv-num"><strong>'+format(r.variance)+'</strong></td></tr>').join('')+
 '</tbody></table></div>'+(shown.length===0?'<p class="inv-hint">Không có sản phẩm '+(type==='missing'?'thiếu':'dư')+'.</p>':'')+
 (rows.length>100?'<p class="inv-hint">Hiển thị 100 / '+format(rows.length)+' mã (xuất Excel để xem toàn bộ).</p>':'')+'</section>';
}
function view(){
 const sh=current();const variance=compute(S.stock,S.counts);
 const canScan=sh?.state==='open',importing=S.importing;
 const lifecycleDisabled=S.sessionBusy||S.importing||S.loading;
 const lifecycle=manage()&&sh?'<div class="inv-session-actions" role="group" aria-label="Quản lý kỳ kiểm kê">'+
 (sh.state==='open'?'<button type="button" class="btn inv-complete" data-inv-action="close-session" '+(lifecycleDisabled?'disabled':'')+'>✓ Hoàn tất kiểm kê</button>':'')+
 (sh.state==='closed'?'<button type="button" class="inv-sm inv-unlock" data-inv-action="reopen-session" '+(lifecycleDisabled?'disabled':'')+'>🔓 Mở khóa kỳ kiểm kê</button>':'')+
 '<button type="button" class="inv-sm inv-delete" data-inv-action="delete-session" '+(lifecycleDisabled?'disabled':'')+'>Xóa kỳ kiểm kê</button>'+
 '</div>':'';
 const opts=S.sessions.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===S.sessionId?'selected':'')+'>'+esc(x.title)+(x.state==='closed'?' · Đã khóa':x.state==='importing'?' · Đang nhập':'')+'</option>').join('');
 const stats='<div class="inv-stats"><div><small>MÃ TỒN KHO</small><strong>'+format(S.stock.length)+'</strong></div><div><small>LƯỢT QUÉT</small><strong>'+format(S.counts.reduce((a,r)=>a+int(r.counted_qty),0))+'</strong></div><div><small>SL THIẾU</small><strong class="inv-red">'+format(variance.missingQty)+'</strong></div><div><small>SL DƯ</small><strong class="inv-green">'+format(variance.extraQty)+'</strong></div></div>';
 const tabs=['stock','count','variance'].map((k,i)=>'<button type="button" data-inv-action="tab" data-tab="'+k+'" class="'+(S.tab===k?'selected':'')+'">'+['TỒN KHO','NHẬP LIỆU','CHÊNH LỆCH'][i]+'</button>').join('');
 let body='';
 if(S.tab==='stock'){
  body=(manage()?'<section class="panel"><h2>TẢI FILE TỒN KHO</h2><p class="inv-hint">Mỗi lần tải sẽ tạo một kỳ kiểm kê mới, không ghi đè dữ liệu các kỳ cũ. Hỗ trợ Excel/CSV từ điện thoại hoặc máy tính.</p>'+
   '<form id="invImportForm" class="inv-form"><label>Tên kỳ kiểm kê<input name="title" type="text" maxlength="150" placeholder="Ví dụ: Kiểm kê tháng 11/2026"></label>'+
   '<label>File tồn kho (.xlsx / .xls / .csv)<input type="file" name="file" accept=".xlsx,.xls,.csv" required></label>'+
   '<button class="btn" type="submit" '+(importing?'disabled':'')+'>Tải tồn kho lên</button></form>'+
   '<p class="inv-hint" id="inv-import-progress">'+esc(S.progress)+'</p></section>':'<section class="panel"><p>Chỉ Admin và Quản lý SHOP được tải hoặc thay đổi file tồn kho. Anh có thể kiểm đếm khi có kỳ đang mở.</p></section>');
  body+='<section class="panel"><h2>TỒN KHO ĐANG CHỌN</h2>'+(!S.stock.length?'<p class="inv-hint">Chưa có danh sách tồn kho trong kỳ này.</p>':stockTable())+'</section>';
 }else if(S.tab==='count'){
  body='<section class="panel"><h2>NHẬP LIỆU – QUÉT QR / BARCODE</h2>'+
  (!canScan?'<p class="inv-hint">Chọn kỳ kiểm kê đang mở và đã có tồn kho trước khi quét.</p>':
  '<p class="inv-hint">Mỗi lượt camera chỉ nhận <b>1 mã và cộng 1 sản phẩm</b>. Khi nhận mã, camera tự tắt và hiện kết quả. Bấm QUÉT TIẾP để quét thêm.</p>'+
  '<div class="inv-camera-actions"><button class="btn" type="button" data-inv-action="'+(S.cameraActive?'stop-camera':'start-camera')+'" '+(S.cameraPhase==='processing'||S.cameraPhase==='stopping'||S.cameraPhase==='starting'?'disabled':'')+'>'+
   (S.cameraPhase==='processing'?'Đang ghi nhận...':S.cameraPhase==='stopping'?'Đang tắt camera...':S.cameraPhase==='starting'?'Đang mở camera...':S.cameraActive?'Tắt camera':S.scanResult==='success'?'📷 QUÉT TIẾP':'📷 MỞ CAMERA QUÉT MÃ')+'</button></div>'+
  (S.cameraActive?'<div id="inv-reader" class="inv-reader"></div>':'')+
  '<form id="invScanForm" class="inv-form"><label>MÃ SẢN PHẨM<input id="invScanCode" name="code" type="text" maxlength="100" autocapitalize="off" autocomplete="off" required placeholder="Quét mã hoặc nhập mã..."></label>'+
  '<label>TÊN SẢN PHẨM (nếu chưa có trong tồn kho)<input name="name" type="text" maxlength="300" placeholder="Tùy chọn – mã chưa có trong file tồn"></label>'+
  '<button type="submit" class="btn">+ Ghi nhận 1 lượt</button></form>')+
  '<div class="inv-last '+(S.scanResult==='success'?'inv-scan-success':S.scanResult==='error'?'inv-scan-error':'')+'" id="inv-last">'+
   (S.scanResult==='success'&&S.last?'✅ ĐÃ QUÉT THÀNH CÔNG · Mã '+esc(S.last.product_code)+' · '+esc(S.last.product_name)+' · ĐÃ ĐẾM: '+format(S.last.counted_qty):
   S.scanResult==='error'?'⚠️ CHƯA GHI NHẬN · '+esc(S.scanError)+' · Bấm QUÉT TIẾP để thử lại':
   S.cameraPhase==='processing'?'Đang lưu 1 sản phẩm lên hệ thống...':
   S.cameraActive?'Đưa mã QR/barcode vào khung quét. Camera sẽ tự tắt khi nhận mã.':
   S.last?'Lượt gần nhất: '+esc(S.last.product_code)+' · Số lượng '+format(S.last.counted_qty):'Chưa có lượt quét mới trong phiên này')+
   '</div></section>'+
  '<section class="panel"><h2>DANH SÁCH ĐÃ QUÉT</h2>'+(S.counts.length?countTable():'<p class="inv-hint">Chưa quét sản phẩm nào.</p>')+'</section>';
 }else{
  body='<section class="panel"><h2>BÁO CÁO THIẾU / DƯ</h2>'+
   '<div class="inv-stats"><div><small>SỐ MÃ THIẾU</small><strong class="inv-red">'+format(variance.missing.length)+'</strong></div><div><small>TỔNG SL THIẾU</small><strong class="inv-red">'+format(variance.missingQty)+'</strong></div><div><small>SỐ MÃ DƯ</small><strong class="inv-green">'+format(variance.extra.length)+'</strong></div><div><small>TỔNG SL DƯ</small><strong class="inv-green">'+format(variance.extraQty)+'</strong></div></div>'+
   '<div class="inv-camera-actions"><button class="btn" type="button" data-inv-action="export">Xuất báo cáo Excel</button></div></section>'+
   '<div class="inv-sidebyside">'+varianceTable('HÀNG THIẾU • TỒN SỔ SÁCH > THỰC ĐẾM',variance.missing,'missing')+
    varianceTable('HÀNG DƯ • THỰC ĐẾM > TỒN SỔ SÁCH',variance.extra,'extra')+'</div>';
 }
 return '<div class="inv40"><section class="panel"><div class="panel-head"><div><h2>KIỂM KÊ 4.0</h2><div class="subtitle">Dữ liệu kiểm kê được tách riêng theo từng SHOP</div></div></div>'+
 '<div class="inv-line"><label for="invSessionSelect">KỲ KIỂM KÊ</label><select id="invSessionSelect" '+(S.sessions.length?'':'disabled')+'>'+
 (opts||'<option>Chưa có kỳ kiểm kê</option>')+'</select><button type="button" class="inv-sm" data-inv-action="refresh">Làm mới</button></div>'+
 (S.loading?'<p class="inv-hint">Đang đồng bộ dữ liệu...</p>':'')+
 (sh?'<p class="inv-hint">Kỳ: '+esc(sh.title)+' · '+(sh.state==='open'?'Đang kiểm đếm':sh.state==='closed'?'Đã hoàn tất / đã khóa':'Chưa hoàn tất tải tồn kho')+'</p>':'<p class="inv-hint">Chưa có kỳ kiểm kê cho SHOP này. Admin hoặc Quản lý tạo kỳ mới bằng file Excel.</p>')+
 lifecycle+'</section>'+stats+'<nav class="inv-tabs">'+tabs+'</nav>'+
 '<div class="inv-search"><input id="invSearch" placeholder="Tìm mã / tên sản phẩm..." value="'+esc(S.query)+'" autocomplete="off"></div>'+
 body+'</div>';
}
async function countCode(code,name=''){
 if(!current()||current().state!=='open')throw new Error('Kỳ kiểm kê chưa mở');
 code=normalizeCode(code);
 if(!code||code.length>100)throw new Error('Mã sản phẩm phải có từ 1–100 ký tự');
 const selectedSession=S.sessionId,selectedShop=S.shop;
 const writeOne=async()=>{
  S.scanBusy=true;
  try{
   const res=await rpc('inventory_scan',{p_session:selectedSession,p_code:code,p_name:name||null});
   if(selectedSession!==S.sessionId||selectedShop!==S.shop)return res;
   const item=S.counts.find(x=>x.product_code===code);
   const update={product_code:code,product_name:res.product_name||unknown,counted_qty:res.counted_qty,updated_at:new Date().toISOString()};
   if(item)Object.assign(item,update);else S.counts.unshift(update);
   S.last=res;S.scanResult='success';S.scanError='';
   if(window.navigator&&navigator.vibrate)navigator.vibrate(60);
   redraw();
   return res;
  }finally{S.scanBusy=false;}
 };
 // Queued USB/manual events each represent one deliberate Enter; never drop them.
 S.scanQueue=S.scanQueue.catch(()=>{}).then(writeOne);
 return S.scanQueue;
}
async function acceptCameraCode(decoded,epoch){
 // Lock synchronously before ANY await: a QR library often emits 10+ callbacks/second.
 if(epoch!==S.cameraEpoch||S.scanAccepted||S.cameraPhase!=='scanning')return;
 S.scanAccepted=true;
 S.cameraPhase='processing';
 S.scanResult='';S.scanError='';
 const code=normalizeCode(decoded);
 // Give immediate visual feedback before slow camera shutdown or database acknowledgment.
 const receipt=document.getElementById('inv-last');
 if(receipt)receipt.textContent='✓ ĐÃ NHẬN MÃ '+code+' · Đang lưu 1 sản phẩm...';
 const selectedSession=S.sessionId;
 // Turn camera OFF before writing to database; never leave it reading while saving.
 await stopCamera({keepProcessing:true});
 if(epoch!==S.cameraEpoch||selectedSession!==S.sessionId)return;
 if(!code||code.length>100){
  S.scanResult='error';S.scanError='Mã quét không hợp lệ';S.cameraPhase='idle';redraw();return;
 }
 try{
  await countCode(code);
 }catch(e){
  S.scanResult='error';S.scanError=e?.message||'Lỗi mạng khi ghi nhận';
  notify('Kiểm kê 4.0: '+S.scanError);
 }finally{
  S.cameraPhase='idle';redraw();
 }
}
async function startCamera(){
 if(!current()||current().state!=='open')throw new Error('Chưa có kỳ kiểm kê đang mở');
 if(S.cameraPhase!=='idle'||S.cameraActive)return;
 if(!navigator.mediaDevices?.getUserMedia)throw new Error('Trình duyệt không hỗ trợ camera. Hãy dùng HTTPS hoặc nhập mã thủ công.');
 S.cameraPhase='starting';
 const epoch=++S.cameraEpoch;
 S.scanAccepted=false;
 S.scanResult='';S.scanError='';
 try{
  await scannerLib();
  if(epoch!==S.cameraEpoch)return;
  S.cameraActive=true;
  redraw(); // Mount reader before Html5Qrcode.start; do not redraw while video is live.
  const camera=new window.Html5Qrcode('inv-reader',fastScannerOptions());
  S.camera=camera;
  S.cameraStartPromise=camera.start({facingMode:'environment'},
   {fps:20,disableFlip:true,qrbox:fastScanRegion},
   decoded=>{if(epoch!==S.cameraEpoch)return;acceptCameraCode(decoded,epoch).catch(e=>{S.scanError=e?.message||'Lỗi khi quét';S.scanResult='error';S.cameraPhase='idle';redraw();});},
   ()=>{});
  await S.cameraStartPromise;
  if(epoch===S.cameraEpoch&&S.cameraPhase==='starting')S.cameraPhase='scanning';
 }catch(e){
  if(epoch===S.cameraEpoch){
   await stopCamera();
   S.cameraPhase='idle';S.scanResult='error';S.scanError='Không mở được camera: '+(e?.message||e);
   redraw();
  }
  throw new Error('Không mở được camera: '+(e?.message||e)+'. Kiểm tra quyền Camera.');
 }
}
async function stopCamera(options={}){
 // Invalidate callbacks immediately for manual stop. For a recognized code keep
 // its generation token so the single accepted scan can finish saving.
 if(!options.keepProcessing)S.cameraEpoch++;
 S.scanAccepted=true;
 if(S.cameraStopping)return S.cameraStopping;
 const camera=S.camera;
 S.cameraActive=false;
 if(!options.keepProcessing)S.cameraPhase='stopping';
 S.cameraStopping=(async()=>{
  const boot=S.cameraStartPromise;
  if(boot){try{await boot}catch(_){}}
  if(camera){
   try{await camera.stop()}catch(_){}
   try{await camera.clear()}catch(_){}
  }
  if(S.camera===camera)S.camera=null;
  S.cameraStartPromise=null;
 })();
 try{await S.cameraStopping;}finally{
  S.cameraStopping=null;
  if(!options.keepProcessing)S.cameraPhase='idle';
 }
}
async function leave(){await stopCamera();}
async function onShopChange(){await leave();S.shop=null;S.sessionId=null;S.sessions=[];S.stock=[];S.counts=[];S.requestSerial++;}
async function exportExcel(){
 if(!S.sessionId)throw new Error('Chưa có kỳ kiểm kê');
 await excelLib();
 const variance=compute(S.stock,S.counts),wb=window.XLSX.utils.book_new();
 const bookstock=[['MÃ SẢN PHẨM','TÊN SẢN PHẨM','TỒN KHO'],...S.stock.map(x=>[x.product_code,x.product_name,int(x.expected_qty)])];
 const bookcount=[['MÃ SẢN PHẨM','TÊN SẢN PHẨM','ĐÃ QUÉT (TỰ CỘNG)'],...S.counts.map(x=>[x.product_code,x.product_name,int(x.counted_qty)])];
 const report=[['BÁO CÁO CHÊNH LỆCH TỒN KHO'],[],['SỐ MÃ THIẾU',variance.missing.length,'TỔNG SL THIẾU',variance.missingQty,'','SỐ MÃ DƯ',variance.extra.length,'TỔNG SL DƯ',variance.extraQty],[],['MÃ SP','TÊN SP','TỒN SỔ SÁCH','THỰC TẾ','SL THIẾU','','MÃ SP','TÊN SP','TỒN SỔ SÁCH','THỰC TẾ','SL DƯ']];
 const max=Math.max(variance.missing.length,variance.extra.length);
 for(let i=0;i<max;i++){
  const a=variance.missing[i],b=variance.extra[i];
  report.push([...(a?[a.code,a.name,a.expected,a.counted,a.variance]:['','','','','']),'',...(b?[b.code,b.name,b.expected,b.counted,b.variance]:['','','','',''])]);
 }
 const make=(rows,label)=>{const ws=window.XLSX.utils.aoa_to_sheet(rows);window.XLSX.utils.book_append_sheet(wb,ws,label);};
 make(bookstock,'TỒN KHO');make(bookcount,'NHẬP LIỆU');make(report,'CHÊNH LỆCH');
 const code=(H.shopCode?H.shopCode():'SHOP').replace(/[^A-Za-z0-9_-]/g,'_');
 window.XLSX.writeFile(wb,'KIEM_KE_4.0_'+code+'_'+new Date().toISOString().slice(0,10)+'.xlsx');
}
async function performAction(btn){
 const act=btn.dataset.invAction;
 try{
 if(act==='tab'){await stopCamera();S.tab=btn.dataset.tab||'stock';S.query='';redraw();return;}
 if(act==='refresh')return load();
 if(act==='start-camera')return startCamera();
 if(act==='stop-camera'){await stopCamera();redraw();return;}
 if(act==='export')return exportExcel();
 if(['close-session','reopen-session','delete-session'].includes(act)){
  if(!manage())throw new Error('Chỉ Quản lý SHOP hoặc Admin được thao tác kỳ kiểm kê');
  if(S.sessionBusy||S.importing)return;
  const session=current(),id=S.sessionId,shop=S.shop;
  if(!session||!id||!shop||shop!==selectedShop())throw new Error('Chưa chọn đúng kỳ kiểm kê trong SHOP');
  if(act==='close-session'&&session.state!=='open')throw new Error('Kỳ kiểm kê không ở trạng thái đang mở');
  if(act==='reopen-session'&&session.state!=='closed')throw new Error('Chỉ mở khóa kỳ kiểm kê đã hoàn tất');
  S.sessionBusy=true;
  try{
   await stopCamera();
   if(act==='delete-session'){
    // User chose the explicit permanent DELETE button. Do not ask for another input.
    const done=await rpc('inventory_delete_session',{p_session:id});
    if(!done?.deleted)throw new Error('Máy chủ chưa xác nhận xóa kỳ kiểm kê');
    if(localStorage.getItem(keyForShop(shop))===id)localStorage.removeItem(keyForShop(shop));
    S.sessionId=null;S.stock=[];S.counts=[];S.last=null;S.scanResult='';S.scanError='';
    notify('Đã xóa vĩnh viễn kỳ kiểm kê "'+session.title+'".');
   }else if(act==='reopen-session'){
    await rpc('inventory_reopen_session',{p_session:id});
    notify('Đã mở khóa "'+session.title+'". Nhân viên có thể quét tiếp.');
   }else{
    await rpc('inventory_close_session',{p_session:id});
    notify('Đã hoàn tất kiểm kê "'+session.title+'". Số đếm đã khóa.');
   }
   if(S.shop===shop)await load();
  }finally{S.sessionBusy=false;redraw();}
  return;
 }
 }catch(e){notify('Kiểm kê 4.0: '+e.message);}
}
document.addEventListener('click',function(ev){
 const b=ev.target.closest('[data-inv-action]');
 if(!b)return;ev.preventDefault();performAction(b);
});
document.addEventListener('submit',async function(ev){
 const form=ev.target;if(!['invImportForm','invScanForm'].includes(form.id))return;
 ev.preventDefault();
 const button=form.querySelector('[type=submit]');if(button)button.disabled=true;
 try{
  if(form.id==='invImportForm')await createFromFile(form);
  else{
   const fd=new FormData(form);
   await countCode(fd.get('code'),String(fd.get('name')||'').trim());
   const code=document.getElementById('invScanCode');
   if(code){code.value='';code.focus();}
  }
 }catch(e){notify('Kiểm kê 4.0: '+e.message)}
 finally{if(button&&button.isConnected)button.disabled=false;}
});
document.addEventListener('change',function(ev){
 if(ev.target.id==='invSessionSelect')changeSession(ev.target.value).catch(e=>notify(e.message));
});
document.addEventListener('input',function(ev){
 if(ev.target.id==='invSearch'){
  S.query=ev.target.value;
  const n=ev.target.selectionStart;redraw();
  const fresh=document.getElementById('invSearch');
  if(fresh){fresh.focus();fresh.setSelectionRange(n,n);}
 }
});
window.INV40={configure,view,load,onShopChange,leave,compute,parseFile,stopCamera,isCameraRunning:()=>S.cameraActive && !!S.cameraStartPromise,_test:{startCamera,acceptCameraCode,countCode,state:S}};
})();