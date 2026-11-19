/* KIỂM KÊ 5.0 CÓ IMEI — isolated from original inventory40 data & RPCs. */
(function(){
'use strict';
const S={shop:null,sessions:[],sessionId:null,expected:[],scanned:[],tab:'stock',query:'',loading:false,importing:false,progress:'',busy:false,last:null,scanStatus:'',scanError:'',scanQueue:Promise.resolve(),requestSerial:0,cam:null,camActive:false,camMounting:false,camPhase:'idle',camEpoch:0,camAccepted:false,camReady:false,camStarting:null,camStopping:null,camObserver:null};
let H=null,loadSheetScript=null,loadScannerScript=null;
let importDraft={scope:'',title:'',file:null};
const unknown='CHƯA CÓ TRONG DANH MỤC';
const esc=x=>H?.esc?H.esc(String(x??'')):String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const nfmt=x=>Number(x||0).toLocaleString('vi-VN');
const note=x=>H?.toast?H.toast(x):console.log(x);
const redraw=()=>H?.draw?.();
const current=()=>S.sessions.find(x=>x.id===S.sessionId);
const shopId=()=>H?.shopId?.();
function currentImportDraft(){
 const scope=`${H?.userId?.()||''}:${shopId()||''}`;
 if(importDraft.scope!==scope)importDraft={scope,title:'',file:null};
 return importDraft;
}
const manage=()=>!!H?.manager?.();
const rpc=(name,args)=>H.api('/rest/v1/rpc/'+name,{method:'POST',body:args});
const text=x=>String(x??'').trim();
function configure(helper){H=helper;}
function normHeading(x){return text(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ')}
function normalizeIMEI(raw){
 const val=text(raw);
 if(/^[A-Za-z0-9]{2,30}$/.test(val))return val;
 const fromLabel=val.match(/^(?:IMEI(?:\s*[12])?|IMEISV|SERIAL(?:\s*NUMBER)?|S\/N|SN)\s*[:=\-]\s*([A-Za-z0-9]{2,30})$/i);
 return fromLabel?fromLabel[1]:val;
}
function validIMEI(x){return /^[A-Za-z0-9]{2,30}$/.test(x)}
function currentKey(shop){return 'companion_imei50_session_'+shop;}
function compute(expected,scanned){
 const expectedMap=new Map(expected.map(r=>[String(r.imei),r]));
 const scannedMap=new Map(scanned.map(r=>[String(r.imei),r]));
 const missing=expected.filter(r=>!scannedMap.has(String(r.imei)));
 const extra=scanned.filter(r=>!expectedMap.has(String(r.imei)));
 missing.sort((a,b)=>text(a.product_code).localeCompare(text(b.product_code))||text(a.imei).localeCompare(text(b.imei)));
 extra.sort((a,b)=>text(a.product_code).localeCompare(text(b.product_code))||text(a.imei).localeCompare(text(b.imei)));
 return {missing,extra,expectedCount:expectedMap.size,scannedCount:scannedMap.size,matched:expectedMap.size-missing.length};
}
function scriptOnce(url,test){
 if(test())return Promise.resolve();
 return new Promise((res,rej)=>{
  const el=document.createElement('script');el.src=url;el.async=true;let done=false;
  const end=err=>{if(done)return;done=true;clearTimeout(timer);if(err){el.remove?.();rej(err)}else res()};
  const timer=setTimeout(()=>end(new Error('Hết thời gian chờ thư viện')),9000);
  el.onload=()=>end(test()?null:new Error('Thư viện không hoạt động'));
  el.onerror=()=>end(new Error('Không thể tải thư viện quét / Excel'));
  document.head.append(el);
 });
}
async function excelLib(){
 if(window.XLSX)return;
 if(!loadSheetScript)loadSheetScript=scriptOnce('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',()=>!!window.XLSX).catch(e=>{loadSheetScript=null;throw e});
 return loadSheetScript;
}
async function scannerLib(){
 if(window.Html5Qrcode)return;
 if(!loadScannerScript)loadScannerScript=scriptOnce('https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',()=>!!window.Html5Qrcode)
  .catch(()=>scriptOnce('https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',()=>!!window.Html5Qrcode))
  .catch(e=>{loadScannerScript=null;throw e});
 return loadScannerScript;
}
async function lookup(code){
 const fromStock=S.expected.find(x=>x.product_code===code)||S.scanned.find(x=>x.product_code===code);
 if(fromStock&&fromStock.product_name!==unknown)return fromStock.product_name;
 try{return await window.MWG_CATALOG?.lookup?.(code)||''}catch(e){return ''}
}
let lookupTimer=null,lookupSerial=0;
const quick={code:'',name:'',status:'idle'};
function renderQuickResult(){
 const el=document.getElementById('imei50-quick-result');if(!el)return;
 el.textContent=quick.status==='idle'?'Nhập mã để tra cứu tên sản phẩm.':quick.status==='loading'?'Đang tra cứu...':quick.status==='found'?quick.name:quick.status==='error'?'Không tải được danh mục mã.':'Không tìm thấy mã sản phẩm.';
 el.className='inv-quick-result is-'+quick.status;
}
function quickChanged(value){
 const code=text(value),n=++lookupSerial;
 if(lookupTimer){clearTimeout(lookupTimer);lookupTimer=null}
 quick.code=code;quick.name='';quick.status=code?'loading':'idle';renderQuickResult();
 if(!code||code.length>100)return;
 lookupTimer=setTimeout(async()=>{
  try{const name=await lookup(code);if(n!==lookupSerial)return;quick.name=name;quick.status=name?'found':'missing'}
  catch(e){if(n!==lookupSerial)return;quick.status='error'}
  finally{if(n===lookupSerial)renderQuickResult()}
 },120);
}
function quickView(){return '<section class="panel inv-quick-panel"><h2>🔎 TRA CỨU SẢN PHẨM NHANH</h2><p class="inv-hint">Nhập hoặc quét QR/mã vạch. Chỉ tra cứu, không cộng số kiểm kê.</p><label for="imei50-quick-code">MÃ SẢN PHẨM</label><div class="inv51-lookup-tools"><input id="imei50-quick-code" type="text" inputmode="text" autocomplete="off" placeholder="Nhập mã sản phẩm..." value="'+esc(quick.code)+'"><button type="button" class="inv51-camera-btn" data-lookup-camera="imei50-quick-code">📷 Quét QR / mã vạch</button></div><div id="imei50-quick-result" class="inv-quick-result is-'+quick.status+'" role="status" aria-live="polite">'+esc(quick.status==='found'?quick.name:quick.status==='loading'?'Đang tra cứu...':quick.status==='missing'?'Không tìm thấy mã sản phẩm.':'Nhập mã để tra cứu tên sản phẩm.')+'</div></section>'}
async function parseIMEIFile(file){
 if(!window.MWG_IMEI_FILE)throw new Error('Chưa tải được bộ đọc Excel IMEI, anh hãy tải lại trang');
 // Local .xlsx + CSV reader does not require an external CDN. Legacy .xls uses optional SheetJS.
 if(/\.xls$/i.test(file?.name||'')&&!window.XLSX)await excelLib();
 let sheet;
 try{sheet=await window.MWG_IMEI_FILE.read(file)}
 catch(e){
  if(/\.xlsx$/i.test(file?.name||'')&&!window.XLSX){
   try{await excelLib();sheet=await window.MWG_IMEI_FILE.read(file)}
   catch(e2){throw new Error(e.message+'; dự phòng cũng lỗi: '+e2.message)}
  }else throw e;
 }
 const rows=sheet.rows||[];
 let header=-1,cols=null;
 for(let i=0;i<Math.min(35,rows.length);i++){
  const hd=(rows[i]||[]).map(normHeading);
  const c=hd.findIndex(h=>h==='MA SAN PHAM'||h==='MA SP'||h==='MA HANG');
  const n=hd.findIndex(h=>h==='TEN SAN PHAM'||h==='TEN SP'||h==='TEN HANG');
  const x=hd.findIndex(h=>h==='IMEI'||h==='SO IMEI'||h==='IMEI/ SERIAL'||h==='IMEI/SERIAL');
  if(c>=0&&n>=0&&x>=0){header=i;cols={code:c,name:n,imei:x};break}
 }
 if(header<0)throw new Error('Không thấy đủ 3 tiêu đề Mã Sản Phẩm | Tên Sản Phẩm | IMEI. Anh dùng file mẫu có sẵn và giữ đúng hàng tiêu đề.');
 const map=new Map(),issues=[];
 for(let i=header+1;i<rows.length;i++){
  const r=rows[i]||[],rowNo=r._excelRow||i+1;
  const code=text(r[cols.code]),imei=normalizeIMEI(r[cols.imei]),name=text(r[cols.name]);
  if(!code&&!imei&&!name)continue;
  if(sheet.numericCells?.has(rowNo+':'+cols.imei)&&imei.length>=16){
   issues.push('dòng '+rowNo+': IMEI từ 16 chữ số đang là Number (Excel có thể làm tròn). Đổi cột IMEI thành Text rồi nhập lại giá trị gốc.');
  }else if(!code||code.length>100||/[\x00-\x1f]/.test(code)){
   issues.push('dòng '+rowNo+': thiếu hoặc sai Mã Sản Phẩm');
  }else if(!name||name.length>300){
   issues.push('dòng '+rowNo+': thiếu hoặc sai Tên Sản Phẩm');
  }else if(!validIMEI(imei)){
   issues.push('dòng '+rowNo+': IMEI/Serial phải gồm 2–30 ký tự chữ hoặc số; dữ liệu hiện tại: '+imei.slice(0,22));
  }else if(map.has(imei)){
   issues.push('dòng '+rowNo+': trùng IMEI '+imei+' với dòng '+map.get(imei)._row);
  }else map.set(imei,{code,name,imei,_row:rowNo});
  if(issues.length>=12)break;
 }
 if(issues.length)throw new Error('File IMEI chưa hợp lệ: '+issues.slice(0,3).join(' | ')+(issues.length>3?' (và lỗi khác)':'')+'. Không tạo kỳ kiểm kê.');
 if(!map.size)throw new Error('File chưa có dòng IMEI hợp lệ. Anh hãy điền từ dòng 2 theo file mẫu.');
 if(map.size>50000)throw new Error('Mỗi kỳ tối đa 50.000 IMEI. Hãy chia kỳ kiểm kê.');
 return [...map.values()].map(({code,name,imei})=>({code,name,imei}));
}

async function paged(table,id,columns){
 let all=[];
 for(let offset=0;offset<50000;offset+=1000){
  const q='/rest/v1/'+table+'?session_id=eq.'+encodeURIComponent(id)+'&select='+columns+'&order=imei.asc&offset='+offset+'&limit=1000';
  const data=await H.api(q);
  if(!Array.isArray(data))throw new Error('Máy chủ trả dữ liệu không hợp lệ');
  all.push(...data);
  if(data.length<1000)return all;
 }
 return all;
}
async function readSession(id,serial=S.requestSerial){
 const [expected,scanned]=await Promise.all([
  paged('inventory_imei_expected',id,'imei,product_code,product_name'),
  paged('inventory_imei_scans',id,'imei,product_code,product_name,scanned_at')
 ]);
 if(serial!==S.requestSerial||id!==S.sessionId)return;
 S.expected=expected;S.scanned=scanned;
}
async function load(){
 const shop=shopId();if(!shop)return;
 if(shop!==S.shop){await leave();S.shop=shop;S.sessions=[];S.sessionId=null;S.expected=[];S.scanned=[];S.query='';S.last=null;quickChanged('')}
 const serial=++S.requestSerial;S.loading=true;redraw();
 if(navigator.mediaDevices?.getUserMedia)scannerLib().then(()=>{S.camReady=true;}).catch(()=>{});
 try{
  const sessions=await H.api('/rest/v1/inventory_imei_sessions?shop_id=eq.'+encodeURIComponent(shop)+'&select=*&order=created_at.desc&limit=50');
  if(serial!==S.requestSerial)return;
  S.sessions=sessions||[];
  const selected=localStorage.getItem(currentKey(shop));
  S.sessionId=S.sessions.find(x=>x.id===S.sessionId)?.id||S.sessions.find(x=>x.id===selected)?.id||S.sessions[0]?.id||null;
  if(S.sessionId)await readSession(S.sessionId,serial);else{S.expected=[];S.scanned=[]}
 }catch(e){note('Kiểm kê IMEI: '+e.message)}
 finally{if(serial===S.requestSerial){S.loading=false;redraw()}}
}
async function changeSession(id){
 if(!S.sessions.some(x=>x.id===id))throw new Error('Kỳ kiểm kê không thuộc SHOP');
 await leave();S.sessionId=id;S.last=null;S.scanStatus='';localStorage.setItem(currentKey(S.shop),id);
 S.loading=true;const serial=++S.requestSerial;redraw();
 try{await readSession(id,serial)}finally{S.loading=false;redraw()}
}
async function createFromFile(form){
 if(!manage())throw new Error('Chỉ Admin và Quản lý SHOP được tạo kỳ IMEI');
 if(S.importing)throw new Error('Đang nhập file tồn IMEI');
 const draft=currentImportDraft(),shop=shopId();
 const file=form.querySelector('input[type=file]')?.files?.[0]||draft.file;if(!file)throw new Error('Chưa chọn file tồn IMEI');
 const titleFromForm=text(new FormData(form).get('title'));
 S.importing=true;S.progress='Đang đọc dữ liệu IMEI...';redraw();let id=null;
 try{
  const parsed=await parseIMEIFile(file);
  if(currentImportDraft()!==draft)throw new Error('SHOP hoặc tài khoản đã thay đổi. Chọn lại file tại SHOP cần kiểm kê.');
  S.progress='Đã đọc đúng '+nfmt(parsed.length)+' IMEI. Đang tạo kỳ kiểm kê...';redraw();
  const title=titleFromForm||'Kiểm kê IMEI '+new Date().toLocaleDateString('vi-VN');
  id=await rpc('inventory_imei_create_session',{p_shop:shop,p_title:title,p_filename:file.name});
  if(!id||typeof id!=='string')throw new Error('Không tạo được kỳ IMEI');
  for(let i=0;i<parsed.length;i+=200){
   await rpc('inventory_imei_import_batch',{p_session:id,p_items:parsed.slice(i,i+200)});
   S.progress='Đã nhập '+nfmt(Math.min(i+200,parsed.length))+' / '+nfmt(parsed.length)+' IMEI';
   const el=document.getElementById('imei50-import-progress');if(el)el.textContent=S.progress;
  }
  await rpc('inventory_imei_finish_import',{p_session:id});
  draft.file=null;draft.title='';
  if(currentImportDraft()!==draft)return;
  S.sessionId=id;localStorage.setItem(currentKey(S.shop),id);S.tab='count';
  note('Đã nhận '+nfmt(parsed.length)+' IMEI. Có thể bắt đầu quét ngay.');
  await load();
 }catch(e){S.progress='LỖI TẢI FILE: '+e.message;throw new Error(e.message+(id?' (Kỳ nhập chưa hoàn tất được giữ lại để kiểm tra.)':''))}
 finally{S.importing=false;redraw()}
}
function visibleRows(rows){
 const q=S.query.toLowerCase().trim();if(!q)return rows;
 return rows.filter(x=>text(x.product_code).toLowerCase().includes(q)||text(x.product_name).toLowerCase().includes(q)||text(x.imei).includes(q));
}
function imeiTable(rows,emptyLabel='Không có dữ liệu'){
 const filtered=visibleRows(rows),shown=filtered.slice(0,120);
 if(!shown.length)return '<p class="inv-hint">'+emptyLabel+'</p>';
 return '<div class="inv-scroll"><table class="inv-table inv50-imei-table"><thead><tr><th>MÃ SP</th><th>TÊN SẢN PHẨM</th><th>IMEI</th></tr></thead><tbody>'+shown.map(x=>'<tr><td class="inv-code">'+esc(x.product_code)+'</td><td>'+esc(x.product_name)+'</td><td class="inv-code">'+esc(x.imei)+'</td></tr>').join('')+'</tbody></table></div>'+(filtered.length>120?'<p class="inv-hint">Hiển thị 120 / '+nfmt(filtered.length)+' IMEI. Xuất Excel để xem toàn bộ.</p>':'');
}
function reportPanel(label,rows,type){return '<section class="inv-variance '+(type==='missing'?'is-missing':'is-extra')+'"><h3>'+label+'</h3>'+imeiTable(rows,'Không có IMEI '+(type==='missing'?'thiếu':'dư')+'.')+'</section>'}
function view(){
 const sh=current(),r=compute(S.expected,S.scanned),open=sh?.state==='open';
 const draft=currentImportDraft();
 const disabled=S.busy||S.importing||S.loading;
 const opts=S.sessions.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===S.sessionId?'selected':'')+'>'+esc(x.title)+(x.state==='closed'?' · Đã khóa':x.state==='importing'?' · Đang nhập':'')+'</option>').join('');
 const lifecycle=manage()&&sh?'<div class="inv-session-actions">'+
  (sh.state==='open'?'<button class="btn inv-complete" data-imei-action="close" '+(disabled?'disabled':'')+'>✓ Hoàn tất kiểm kê IMEI</button>':'')+
  (sh.state==='closed'?'<button class="inv-sm inv-unlock" data-imei-action="reopen" '+(disabled?'disabled':'')+'>🔓 Mở khóa kỳ IMEI</button>':'')+
  '<button class="inv-sm inv-delete" data-imei-action="delete" '+(disabled?'disabled':'')+'>Xóa kỳ IMEI</button></div>':'';
 const stats='<div class="inv-stats"><div><small>IMEI TỒN SỔ SÁCH</small><strong>'+nfmt(r.expectedCount)+'</strong></div><div><small>IMEI ĐÃ QUÉT</small><strong>'+nfmt(r.scannedCount)+'</strong></div><div><small>IMEI THIẾU</small><strong class="inv-red">'+nfmt(r.missing.length)+'</strong></div><div><small>IMEI DƯ</small><strong class="inv-green">'+nfmt(r.extra.length)+'</strong></div></div>';
 const tabs=['stock','count','variance'].map((k,i)=>'<button type="button" data-imei-action="tab" data-tab="'+k+'" class="'+(S.tab===k?'selected':'')+'">'+['TỒN IMEI','QUÉT IMEI','DƯ / THIẾU'][i]+'</button>').join('');
 let body='';
 if(S.tab==='stock'){
  body=(manage()?'<section class="panel"><h2>TẢI DANH SÁCH IMEI TỒN KHO</h2><p class="inv-hint">File gồm <b>3 cột: Mã Sản Phẩm | Tên Sản Phẩm | IMEI</b>. Mỗi IMEI là một dòng. Định dạng cột IMEI là <b>Text</b> để giữ nguyên mã 2–30 ký tự, kể cả số 0 đầu. Nhập file xong sẽ chuyển thẳng đến màn hình quét IMEI.</p><a class="inv-sm inv51-template" href="./MAU_NHAP_KIEM_KE_IMEI_5.1.xlsx" download="MAU_NHAP_KIEM_KE_IMEI_5.1.xlsx">↓ Tải file Excel mẫu IMEI (3 cột)</a><form id="imei50-import" class="inv-form"><label>TÊN KỲ KIỂM KÊ<input name="title" maxlength="150" placeholder="Ví dụ: IMEI tháng 11/2026" value="'+esc(draft.title)+'"></label><label>FILE TỒN IMEI<input type="file" name="file" accept=".xlsx,.xls,.csv" '+(draft.file?'':'required')+'><span id="imei50-selected-file" class="inv51-file-name">'+(draft.file?'Đã chọn: '+esc(draft.file.name):'Hỗ trợ .xlsx, .csv (ưu tiên Excel .xlsx)')+'</span></label><button type="submit" class="btn" '+(S.importing?'disabled':'')+'>TẢI FILE VÀ BẮT ĐẦU KIỂM KÊ</button></form><p id="imei50-import-progress" class="inv-hint">'+esc(S.progress)+'</p></section>':'<section class="panel"><p class="inv-hint">Admin / Quản lý SHOP tạo kỳ và nhập danh sách IMEI tồn. Nhân viên có thể tham gia quét sau khi kỳ mở.</p></section>');
  body+='<section class="panel"><h2>DANH SÁCH IMEI CẦN KIỂM</h2>'+imeiTable(S.expected,'Chưa nhập danh sách IMEI tồn.')+'</section>';
 }else if(S.tab==='count'){
  const cameraLabel=S.camPhase==='starting'?'Đang mở camera...':S.camPhase==='processing'?'Đang lưu IMEI...':S.camActive?'TẮT CAMERA':S.scanStatus==='saved'?'📷 QUÉT TIẾP':'📷 MỞ CAMERA QUÉT IMEI';
  body='<section class="panel"><h2>📷 NHẬP / QUÉT IMEI</h2>'+
   (!open?'<p class="inv-hint">Chọn kỳ IMEI đang mở trước khi quét.</p>':
   '<p class="inv-hint">Đưa mã IMEI vào khung, camera tự nhận ngay khi đọc rõ mã. Mỗi IMEI chỉ được ghi <b>một lần</b>, quét lại sẽ báo trùng và không cộng thêm.</p><div class="inv-camera-actions"><button type="button" class="btn" data-imei-action="'+(S.camActive?'stop-camera':'start-camera')+'" '+(['starting','processing','stopping'].includes(S.camPhase)?'disabled':'')+'>'+cameraLabel+'</button></div>'+
   (S.camActive?'<div id="imei50-reader" class="inv-reader"></div>':'')+
   '<form id="imei50-scan" class="inv-form"><label>IMEI<input id="imei50-scan-code" name="imei" inputmode="text" type="text" maxlength="30" required placeholder="Quét hoặc nhập mã IMEI/Serial (2–30 ký tự)..."></label><label>MÃ SP (dành cho IMEI dư, không có trong tồn)<input name="code" type="text" maxlength="100" placeholder="Tùy chọn – mã sản phẩm"></label><button class="btn" type="submit">+ GHI NHẬN IMEI</button></form>')+
   '<div id="imei50-last" class="inv-last '+(S.scanStatus==='saved'?'inv-scan-success':S.scanStatus==='duplicate'?'inv50-duplicate':S.scanStatus==='error'?'inv-scan-error':'')+'">'+
   (S.scanStatus==='saved'&&S.last?'✅ ĐÃ GHI IMEI '+esc(S.last.imei)+' · '+esc(S.last.product_code)+' · '+esc(S.last.product_name):
   S.scanStatus==='duplicate'?'⚠️ IMEI '+esc(S.last?.imei)+' ĐÃ ĐƯỢC QUÉT TRƯỚC ĐÓ – KHÔNG CỘNG THÊM':
   S.scanStatus==='error'?'⚠️ CHƯA GHI: '+esc(S.scanError):S.camActive?'Camera đang nhận mã IMEI...':'Chưa có lượt quét IMEI mới')+'</div></section>'+
   '<section class="panel"><h2>IMEI ĐÃ GHI NHẬN</h2>'+imeiTable(S.scanned,'Chưa quét IMEI nào.')+'</section>';
 }else{
  body='<section class="panel"><h2>BÁO CÁO CHÊNH LỆCH IMEI</h2><p class="inv-hint">Thiếu = IMEI có trong tồn nhưng chưa quét. Dư = IMEI đã quét nhưng không có trong tồn. Mỗi IMEI tính là một thiết bị.</p><div class="inv-camera-actions"><button class="btn" data-imei-action="export">Xuất báo cáo Excel</button></div></section>'+
   '<div class="inv-sidebyside">'+reportPanel('IMEI THIẾU • CÓ TRÊN SỔ NHƯNG CHƯA QUÉT',r.missing,'missing')+reportPanel('IMEI DƯ • ĐÃ QUÉT NHƯNG KHÔNG CÓ TRÊN SỔ',r.extra,'extra')+'</div>'+
   (r.extra.length?'<section class="panel"><h2>GÁN MÃ CHO IMEI DƯ</h2><p class="inv-hint">Nếu IMEI ngoài danh sách tồn chưa biết mã sản phẩm, nhập IMEI và mã đúng tại đây để báo cáo đầy đủ.</p><form id="imei50-assign" class="inv-form"><label>IMEI DƯ<input name="imei" maxlength="30" inputmode="text" required placeholder="2–30 ký tự chữ hoặc số"></label><label>MÃ SẢN PHẨM<input name="code" maxlength="100" required placeholder="Mã sản phẩm"></label><button class="btn" type="submit">Lưu mã sản phẩm</button></form></section>':'');
 }
 return '<div class="inv40 inv50-imei"><section class="panel"><div class="panel-head"><div><h2>KIỂM KÊ CÓ IMEI</h2><div class="subtitle">Mỗi IMEI duy nhất • Dữ liệu riêng theo SHOP • Không cần số lượng</div></div></div><div class="inv-line"><label for="imei50-session">KỲ IMEI</label><select id="imei50-session" '+(S.sessions.length?'':'disabled')+'>'+(opts||'<option>Chưa có kỳ IMEI</option>')+'</select><button class="inv-sm" data-imei-action="refresh">Làm mới</button></div>'+
 (S.loading?'<p class="inv-hint">Đang đồng bộ IMEI...</p>':'')+(sh?'<p class="inv-hint">'+esc(sh.title)+' · '+(sh.state==='open'?'Đang kiểm kê':sh.state==='closed'?'Đã khóa':'Đang nhập tồn')+'</p>':'<p class="inv-hint">Chưa có kỳ IMEI. Quản lý cần tải danh sách IMEI tồn trước.</p>')+lifecycle+'</section>'+stats+quickView()+'<nav class="inv-tabs">'+tabs+'</nav><div class="inv-search"><input id="imei50-search" placeholder="Tìm mã / tên / IMEI..." autocomplete="off" value="'+esc(S.query)+'"></div>'+body+'</div>';
}
async function recordIMEI(raw,rawCode=''){
 if(current()?.state!=='open')throw new Error('Kỳ IMEI chưa mở');
 const imei=normalizeIMEI(raw),code=text(rawCode);
 if(!validIMEI(imei))throw new Error('IMEI/Serial cần có 2–30 ký tự chữ hoặc số. Không ghi mã sản phẩm thay cho IMEI.');
 if(code.length>100)throw new Error('Mã sản phẩm quá dài');
 const selectedSession=S.sessionId,selectedShop=S.shop;
 const write=async()=>{
  const expected=S.expected.find(x=>x.imei===imei);
  const knownCode=expected?.product_code||code;
  const knownName=knownCode?await lookup(knownCode):'';
  const res=await rpc('inventory_imei_scan',{p_session:selectedSession,p_imei:imei,p_code:knownCode||null,p_name:knownName||null});
  if(selectedSession!==S.sessionId||selectedShop!==S.shop)return res;
  S.last={imei,product_code:res.product_code||knownCode||'CHƯA XÁC ĐỊNH',product_name:res.product_name||knownName||unknown};
  S.scanStatus=res.status==='duplicate'?'duplicate':'saved';S.scanError='';
  if(res.status!=='duplicate')S.scanned.unshift({...S.last,scanned_at:new Date().toISOString()});
  if(res.status!=='duplicate'&&navigator.vibrate)navigator.vibrate(70);
  redraw();return res;
 };
 S.scanQueue=S.scanQueue.catch(()=>{}).then(write);
 return S.scanQueue;
}
function prepareVideo(container){
 const fix=()=>{const video=container?.querySelector?.('video');if(video){video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.setAttribute('muted','');video.muted=true;video.playsInline=true}};
 fix();if(typeof MutationObserver==='undefined')return null;
 const observer=new MutationObserver(fix);observer.observe(container,{subtree:true,childList:true});return observer;
}
async function startCamera(){
 if(current()?.state!=='open')throw new Error('Chưa có kỳ IMEI đang mở');
 if(S.camPhase!=='idle'||S.camActive)return;
 if(!navigator.mediaDevices?.getUserMedia)throw new Error('Không có quyền camera. Mở bằng HTTPS trên Safari hoặc Chrome.');
 if(!window.Html5Qrcode){scannerLib().then(()=>note('Bộ quét đã sẵn sàng. Bấm MỞ CAMERA lại.')).catch(e=>note(e.message));return;}
 S.camActive=true;S.camMounting=true;S.camPhase='starting';S.camAccepted=false;S.scanStatus='';S.scanError='';
 const epoch=++S.camEpoch;
 try{redraw()}finally{S.camMounting=false}
 try{
  const reader=document.getElementById('imei50-reader');if(!reader)throw new Error('Không có vùng camera');
  S.camObserver=prepareVideo(reader);
  const formats=window.Html5QrcodeSupportedFormats||{};
  const support=['CODE_128','QR_CODE','ITF','CODE_39','CODE_93','EAN_13'].map(n=>formats[n]).filter(Number.isInteger);
  const cam=new window.Html5Qrcode('imei50-reader',{verbose:false,useBarCodeDetectorIfSupported:true,...(support.length>2?{formatsToSupport:support}:{})});S.cam=cam;
  S.camStarting=Promise.resolve(cam.start({facingMode:'environment'},
   {fps:30,disableFlip:true,qrbox:(w,h)=>({width:Math.max(130,Math.min(w-14,450)),height:Math.max(110,Math.min(h-14,230))})},
   data=>{if(epoch===S.camEpoch)acceptCamera(data,epoch).catch(e=>{S.scanStatus='error';S.scanError=e.message;S.camPhase='idle';redraw()})},()=>{}));
  await S.camStarting;
  if(epoch!==S.camEpoch)return;
  if(S.camPhase==='starting'){S.camPhase='scanning';const el=document.getElementById('imei50-last');if(el)el.textContent='Đã mở camera · Đưa IMEI vào khung, nhận khi bắt mã.'}
 }catch(e){if(epoch===S.camEpoch){await stopCamera();S.scanStatus='error';S.scanError='Camera không mở được: '+e.message;redraw();note(S.scanError)}}
}
async function acceptCamera(raw,epoch){
 if(epoch!==S.camEpoch||S.camAccepted||S.camPhase!=='scanning')return;
 const imei=normalizeIMEI(raw);
 if(!validIMEI(imei))return; // Ignore other product barcodes; IMEI is the only valid scan in this mode.
 S.camAccepted=true;S.camPhase='processing';
 const status=document.getElementById('imei50-last');if(status)status.textContent='✓ ĐÃ NHẬN IMEI '+imei+' · Đang lưu...';
 const sid=S.sessionId;
 await stopCamera({keepEpoch:true});
 if(epoch!==S.camEpoch||sid!==S.sessionId)return;
 try{await recordIMEI(imei)}catch(e){S.scanStatus='error';S.scanError=e.message;note('Kiểm kê IMEI: '+e.message)}
 finally{S.camPhase='idle';redraw()}
}
async function stopCamera(options={}){
 if(!options.keepEpoch)S.camEpoch++;
 S.camAccepted=true;
 if(S.camStopping)return S.camStopping;
 const cam=S.cam;S.camActive=false;S.camMounting=false;
 if(!options.keepEpoch)S.camPhase='stopping';
 S.camObserver?.disconnect?.();S.camObserver=null;
 S.camStopping=(async()=>{
  if(S.camStarting)try{await Promise.race([S.camStarting,new Promise(res=>setTimeout(res,1000))])}catch(e){}
  if(cam){try{await Promise.race([cam.stop(),new Promise(res=>setTimeout(res,1800))])}catch(e){}try{await cam.clear()}catch(e){}}
  const el=document.getElementById('imei50-reader');for(const video of el?.querySelectorAll?.('video')||[]){for(const t of video.srcObject?.getTracks?.()||[])try{t.stop()}catch(e){}}
  if(S.cam===cam)S.cam=null;S.camStarting=null;
 })();
 try{await S.camStopping}finally{S.camStopping=null;if(!options.keepEpoch)S.camPhase='idle'}
}
async function leave(){await stopCamera()}
async function onShopChange(){await leave();S.shop=null;S.requestSerial++;S.sessions=[];S.sessionId=null;S.expected=[];S.scanned=[];S.last=null}
async function template(){
 await excelLib();const wb=window.XLSX.utils.book_new();const sh=window.XLSX.utils.aoa_to_sheet([['Mã sản phẩm','Tên sản phẩm','IMEI'],['4842053000373','Ví dụ – xóa dòng mẫu','123456789012345']]);
 sh['!cols']=[{wch:22},{wch:46},{wch:25}];window.XLSX.utils.book_append_sheet(wb,sh,'TỒN IMEI');
 window.XLSX.writeFile(wb,'MAU_TON_IMEI_KIEM_KE_5.0.xlsx');
}
async function exportExcel(){
 await excelLib();const report=compute(S.expected,S.scanned);const wb=window.XLSX.utils.book_new();
 const make=(head,rows,name)=>{const ws=window.XLSX.utils.aoa_to_sheet([head,...rows.map(x=>[x.product_code,x.product_name,x.imei])]);ws['!cols']=[{wch:22},{wch:55},{wch:25}];window.XLSX.utils.book_append_sheet(wb,ws,name)};
 make(['MÃ SP','TÊN SP','IMEI'],S.expected,'TỒN IMEI');make(['MÃ SP','TÊN SP','IMEI'],S.scanned,'ĐÃ QUÉT IMEI');
 make(['MÃ SP','TÊN SP','IMEI THIẾU'],report.missing,'IMEI THIẾU');make(['MÃ SP','TÊN SP','IMEI DƯ'],report.extra,'IMEI DƯ');
 const code=String(H?.shopCode?.()||'SHOP').replace(/[^a-z0-9_-]/ig,'_');
 window.XLSX.writeFile(wb,'KIEM_KE_5.0_CO_IMEI_'+code+'_'+new Date().toISOString().slice(0,10)+'.xlsx');
}
async function action(button){
 const act=button.dataset.imeiAction;
 try{
  if(act==='tab'){await leave();S.tab=button.dataset.tab||'stock';S.query='';redraw();return}
  if(act==='refresh'){await load();return}
  if(act==='start-camera'){await startCamera();return}
  if(act==='stop-camera'){await stopCamera();redraw();return}
  if(act==='template'){const a=document.createElement('a');a.href='./MAU_NHAP_KIEM_KE_IMEI_5.1.xlsx';a.download='MAU_NHAP_KIEM_KE_IMEI_5.1.xlsx';a.click();return}
  if(act==='export'){await exportExcel();return}
  if(['close','reopen','delete'].includes(act)){
   if(!manage())throw new Error('Chỉ Quản lý SHOP hoặc Admin được thay đổi kỳ IMEI');
   if(S.busy||S.importing)return;
   const session=current();if(!session)throw new Error('Chưa chọn kỳ IMEI');S.busy=true;
   try{
    await leave();const sid=S.sessionId;
    if(act==='close'){await rpc('inventory_imei_close_session',{p_session:sid});note('Đã hoàn tất kiểm kê IMEI')}
    if(act==='reopen'){await rpc('inventory_imei_reopen_session',{p_session:sid});note('Đã mở khóa kỳ IMEI')}
    if(act==='delete'){
     const res=await rpc('inventory_imei_delete_session',{p_session:sid});if(!res?.deleted)throw new Error('Máy chủ chưa xác nhận xóa kỳ IMEI');
     if(localStorage.getItem(currentKey(S.shop))===sid)localStorage.removeItem(currentKey(S.shop));
     S.sessionId=null;S.expected=[];S.scanned=[];S.last=null;note('Đã xóa kỳ IMEI đã chọn (không ảnh hưởng kỳ kiểm kê thường)');
    }
    await load();
   }finally{S.busy=false;redraw()}
  }
 }catch(e){note('Kiểm kê 5.0 IMEI: '+e.message)}
}
document.addEventListener('click',e=>{
 const btn=e.target.closest?.('[data-imei-action]');if(!btn)return;e.preventDefault();action(btn);
});
document.addEventListener('change',e=>{
 if(e.target.id==='imei50-session')changeSession(e.target.value).catch(err=>note(err.message));
 if(e.target.matches?.('#imei50-import input[type=file]')&&e.target.files?.[0]){
  const draft=currentImportDraft();
  draft.file=e.target.files[0];e.target.required=false;
  const out=document.getElementById('imei50-selected-file');if(out)out.textContent='Đã chọn: '+draft.file.name;
 }
});
document.addEventListener('input',e=>{
 if(e.target.matches?.('#imei50-import [name=title]'))currentImportDraft().title=e.target.value;
 if(e.target.id==='imei50-quick-code'){quickChanged(e.target.value);return}
 if(e.target.id==='imei50-search'){
  S.query=e.target.value;const pos=e.target.selectionStart;redraw();const el=document.getElementById('imei50-search');if(el){el.focus();el.setSelectionRange(pos,pos)}
 }
});
document.addEventListener('submit',async e=>{
 const form=e.target;if(!['imei50-import','imei50-scan','imei50-assign'].includes(form.id))return;
 e.preventDefault();const btn=form.querySelector('[type=submit]');if(btn)btn.disabled=true;
 try{
  if(form.id==='imei50-import')await createFromFile(form);
  else if(form.id==='imei50-scan'){
   const fd=new FormData(form);await recordIMEI(fd.get('imei'),fd.get('code'));
   const el=document.getElementById('imei50-scan-code');if(el){el.value='';el.focus()}
  }else{
   const fd=new FormData(form),imei=normalizeIMEI(fd.get('imei')),code=text(fd.get('code'));
   if(!validIMEI(imei)||!code)throw new Error('Cần IMEI hợp lệ và mã sản phẩm');
   const name=await lookup(code);
   await rpc('inventory_imei_assign_code',{p_session:S.sessionId,p_imei:imei,p_code:code,p_name:name||null});
   await readSession(S.sessionId);redraw();note('Đã cập nhật mã sản phẩm cho IMEI dư')
  }
 }catch(err){S.scanStatus='error';S.scanError=err.message;note('Kiểm kê IMEI: '+err.message);redraw()}
 finally{if(btn&&btn.isConnected)btn.disabled=false}
});
window.IMEI50={configure,view,load,onShopChange,leave,isCameraRunning:()=>S.camActive&&!S.camMounting,compute,parseIMEIFile};
})();
