/* COMPANION-MWG v3.5.6 · KIỂM KÊ CHỦ ĐỘNG
   Local-first tool. No stock file, no inventory RPCs, no change to existing inventory records.
   Code -> catalog name -> quantity (no IMEI) OR unique IMEI -> Excel XLSX export.
*/
(function(){
'use strict';
let H=null,shop='',identity='',mode=null,lookupEpoch=0,lookupTimer=null,processing=false;
const MAX_ROWS=35000,UNKNOWN='CHƯA CÓ TRONG DANH MỤC';
const S={noImei:[],imei:[],code:'',name:'',nameState:'idle',imeiInput:'',quantity:1,last:'',lastType:'',lastCode:'',undo:null,scanBusy:false};
const esc=x=>H?.esc?H.esc(String(x??'')):String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=x=>H?.toast?.(x);
const draw=()=>H?.draw?.();
const str=x=>String(x??'').trim();
const sku=x=>str(x).replace(/\s+/g,'');
function normalizeImei(x){let v=str(x).replace(/^(?:IMEI(?:\s*[12])?|IMEISV|SERIAL(?:\s*NUMBER)?|S\/?N|SN)\s*[:=\-]\s*/i,'').replace(/\s/g,'');return v.toUpperCase()}
function validImei(v){return /^[A-Z0-9]{2,30}$/.test(v)}
function validSku(v){return v.length>0&&v.length<=100&&!/[\x00-\x1f<>"'{}]/.test(v)}
function storageKey(){return 'companion_mwg_active56_'+identity+'_'+shop}
function save(){
 try{localStorage.setItem(storageKey(),JSON.stringify({version:1,noImei:S.noImei,imei:S.imei}))}
 catch(e){toast('Bộ nhớ thiết bị sắp đầy. Hãy xuất Excel ngay để lưu dữ liệu.');console.warn('Active inventory storage:',e)}
}
function restore(){
 S.noImei=[];S.imei=[];S.code='';S.name='';S.nameState='idle';S.imeiInput='';S.quantity=1;S.last='';S.lastType='';S.lastCode='';S.undo=null;
 try{
  const data=JSON.parse(localStorage.getItem(storageKey())||'null');
  if(data&&data.version===1){
   if(Array.isArray(data.noImei))S.noImei=data.noImei.filter(x=>validSku(sku(x.code))&&Number.isSafeInteger(x.qty)&&x.qty>0).slice(0,MAX_ROWS).map(x=>({code:sku(x.code),name:str(x.name)||UNKNOWN,qty:x.qty}));
   if(Array.isArray(data.imei)){
    const known=new Set();
    S.imei=data.imei.filter(x=>{const i=normalizeImei(x.imei);if(!validImei(i)||!validSku(sku(x.code))||known.has(i))return false;known.add(i);return true}).slice(0,MAX_ROWS).map(x=>({code:sku(x.code),name:str(x.name)||UNKNOWN,imei:normalizeImei(x.imei)}));
   }
  }
 }catch(e){console.warn('Cannot restore active inventory',e)}
}
function configure(helpers){H=helpers}
async function load(){const next=H?.shopId?.()||'LOCAL',user=H?.userId?.()||'anonymous';if(next!==shop||user!==identity){shop=next;identity=user;restore()}mode=null;draw()}
async function leave(){mode=null;await window.MWG_LOOKUP_CAMERA?.stop?.()}
async function onShopChange(){await window.MWG_LOOKUP_CAMERA?.stop?.();shop=H?.shopId?.()||'LOCAL';identity=H?.userId?.()||'anonymous';restore();mode=null}
function choose(){return `<section class="act56-wrap"><div class="act56-hero"><div class="act56-eyebrow">KIỂM KÊ 5.0 / CHỦ ĐỘNG</div><h2>Kiểm Kê Chủ Động</h2><p>Không cần tải file tồn kho. Quét mã sản phẩm, ghi nhận kết quả và xuất Excel khi hoàn tất.</p></div>
<div class="act56-cards">
<button class="act56-choice" type="button" data-act56-select="noImei"><span class="act56-choice-icon">▥</span><strong>KHÔNG IMEI</strong><span>Quét mã → Tự nhận tên → Cộng số lượng mỗi lần quét. Mã trùng tự gộp.</span><b>VÀO KIỂM KÊ ›</b></button>
<button class="act56-choice" type="button" data-act56-select="imei"><span class="act56-choice-icon">▣</span><strong>CÓ IMEI</strong><span>Quét mã sản phẩm → Tự nhận tên → Quét hoặc nhập IMEI. Mỗi IMEI chỉ ghi một lần.</span><b>VÀO KIỂM KÊ ›</b></button>
</div><p class="act56-privacy">Dữ liệu chủ động được lưu trên trình duyệt/thiết bị này, không làm thay đổi tồn kho hay các kỳ kiểm kê trên Supabase. Hãy xuất Excel để lưu và chia sẻ.</p></section>`}
const fmt=x=>Number(x||0).toLocaleString('vi-VN');
function summary(){return S.imei.reduce((acc,r)=>{const item=acc.get(r.code)||{code:r.code,name:r.name,qty:0};item.qty++;if(item.name===UNKNOWN&&r.name!==UNKNOWN)item.name=r.name;acc.set(r.code,item);return acc},new Map())}
function list(){
 const source=mode==='imei'?S.imei:S.noImei;
 const entries=mode==='imei'?[...source].reverse():[...source].reverse();
 const shown=entries.slice(0,160);
 const rows=shown.map((r,i)=>`<tr><td>${esc(r.code)}</td><td>${esc(r.name)}</td><td>${mode==='imei'?`<span class="act56-imei">${esc(r.imei)}</span>`:`<strong>${fmt(r.qty)}</strong>`}</td><td><button type="button" class="act56-remove" data-act56-delete="${mode==='imei'?esc(r.imei):esc(r.code)}" title="Xóa dòng này">✕</button></td></tr>`).join('');
 const count=mode==='imei'?S.imei.length:S.noImei.reduce((n,r)=>n+r.qty,0);
 return `<div class="act56-stat"><span>${mode==='imei'?'ĐÃ GHI NHẬN IMEI':'TỔNG SỐ LƯỢNG'}<b>${fmt(count)}</b></span><span>${mode==='imei'?'MÃ SẢN PHẨM':'MODEL / MÃ KHÁC NHAU'}<b>${fmt(mode==='imei'?summary().size:S.noImei.length)}</b></span></div>
 <div class="act56-table-head"><h3>Danh sách đã ghi nhận</h3><button class="act56-export" type="button" data-act56-action="export">⇩ XUẤT EXCEL (.XLSX)</button></div>
 <div class="act56-table-scroll"><table class="act56-table"><thead><tr><th>MÃ SẢN PHẨM</th><th>TÊN SẢN PHẨM</th><th>${mode==='imei'?'IMEI':'SỐ LƯỢNG'}</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="act56-empty">Chưa có dữ liệu. Bắt đầu quét mã sản phẩm ở phía trên.</td></tr>'}</tbody></table></div>
 ${entries.length>shown.length?`<p class="act56-notice">Đang hiển thị ${shown.length} dòng gần nhất. File Excel sẽ xuất đầy đủ ${fmt(entries.length)} dòng.</p>`:''}
 <div class="act56-foot"><button type="button" data-act56-action="undo" ${!S.undo||S.undo.mode!==mode?'disabled':''}>↶ Hoàn tác lần ghi cuối</button><button type="button" data-act56-action="clear" class="act56-danger" ${!source.length?'disabled':''}>Xóa dữ liệu chế độ này</button></div>`;
}
function view(){
 if(!mode)return choose();
 return `<section class="act56-wrap">
 <div class="act56-nav"><button type="button" data-act56-select="choose">‹ KIỂM KÊ CHỦ ĐỘNG</button><b>${mode==='imei'?'CÓ IMEI':'KHÔNG IMEI'}</b><button type="button" data-act56-select="${mode==='imei'?'noImei':'imei'}">ĐỔI CHẾ ĐỘ ↔</button></div>
 <section class="act56-entry"><h2>${mode==='imei'?'▣ KIỂM KÊ CHỦ ĐỘNG CÓ IMEI':'▥ KIỂM KÊ CHỦ ĐỘNG KHÔNG IMEI'}</h2>
 <p class="act56-help">${mode==='imei'?'Bước 1: nhập/quét mã sản phẩm. Bước 2: quét hoặc nhập IMEI, nhấn Enter để ghi.':'Quét mã hoặc nhập mã rồi nhấn Enter. Mỗi lần ghi sẽ tự cộng số lượng cho mã đó.'}</p>
 <form id="act56-code-form" autocomplete="off"><label for="act56-code">MÃ SẢN PHẨM</label><div class="inv51-lookup-tools act56-tools"><input id="act56-code" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="100" placeholder="Bắn mã sản phẩm hoặc nhập mã..." value="${esc(S.code)}" required><button type="button" class="inv51-camera-btn" data-lookup-camera="act56-code">📷 Quét QR / Mã vạch</button></div>
 <label for="act56-name">TÊN SẢN PHẨM <small>(tự tra cứu, có thể chỉnh sửa)</small></label><input id="act56-name" type="text" maxlength="300" value="${esc(S.name)}" placeholder="${S.nameState==='loading'?'Đang tra cứu tên...':'Tên sản phẩm sẽ tự hiện khi nhập mã'}"><div class="act56-name-status" id="act56-status" role="status">${S.nameState==='found'?'✓ Đã nhận diện tên sản phẩm.':S.nameState==='loading'?'Đang tra cứu danh mục sản phẩm...':S.nameState==='missing'?'Không thấy tên trong danh mục; có thể nhập tên thủ công.':''}</div>
 ${mode==='noImei'?`<label for="act56-qty">SỐ LƯỢNG CỘNG THÊM</label><input id="act56-qty" type="number" min="1" max="100000" step="1" inputmode="numeric" value="${S.quantity}" required><button type="submit" class="act56-primary">+ GHI NHẬN / CỘNG SỐ LƯỢNG</button>`:`<button type="submit" class="act56-primary">✓ CHỌN SẢN PHẨM → QUÉT IMEI</button>`}
 </form>
 ${mode==='imei'?`<form id="act56-imei-form" autocomplete="off"><label for="act56-imei">IMEI CỦA SẢN PHẨM ĐANG CHỌN</label><div class="inv51-lookup-tools act56-tools"><input id="act56-imei" type="text" inputmode="text" maxlength="40" autocomplete="off" spellcheck="false" placeholder="Bắn IMEI hoặc nhập thủ công, nhấn Enter" value="${esc(S.imeiInput)}" required><button type="button" class="inv51-camera-btn" data-lookup-camera="act56-imei">📷 Quét IMEI</button></div><button type="submit" class="act56-primary">+ LƯU IMEI</button></form>`:''}
 <p class="act56-feedback ${S.lastType==='error'?'act56-error':S.lastType==='ok'?'act56-success':''}" role="status" aria-live="polite">${esc(S.last||'')}</p>
 </section>${list()}
 </section>`;
}
function setStatus(){const n=document.getElementById('act56-status');if(n)n.textContent=S.nameState==='found'?'✓ Đã nhận diện tên sản phẩm.':S.nameState==='loading'?'Đang tra cứu danh mục sản phẩm...':S.nameState==='missing'?'Không tìm thấy trong danh mục. Anh có thể nhập tên thủ công.':S.nameState==='error'?'Danh mục đang lỗi kết nối; có thể nhập tên thủ công.':'';}
function setNameInDom(){const el=document.getElementById('act56-name');if(el&&document.activeElement!==el)el.value=S.name;setStatus()}
async function findName(code,serial){
 try{
  const exist=S.noImei.find(r=>r.code===code)||S.imei.find(r=>r.code===code);
  const n=exist?.name&&exist.name!==UNKNOWN?exist.name:await window.MWG_CATALOG.lookup(code);
  if(serial!==lookupEpoch||S.code!==code)return;
  if(!S.name||S.name===UNKNOWN){S.name=str(n);S.nameState=n?'found':'missing'}
  else S.nameState='found';
 }catch(e){if(serial===lookupEpoch&&S.code===code)S.nameState='error'}
 finally{if(serial===lookupEpoch)setNameInDom()}
}
function setCode(value){
 const code=sku(value);const changed=S.code!==code;S.code=code;
 if(changed){S.name='';S.nameState=code?'loading':'idle';lookupEpoch++;if(lookupTimer)clearTimeout(lookupTimer);const serial=lookupEpoch;if(validSku(code))lookupTimer=setTimeout(()=>{lookupTimer=null;findName(code,serial)},90)}
 setNameInDom();
}
async function currentName(){
 const code=sku(document.getElementById('act56-code')?.value||S.code);
 if(!validSku(code))throw Error('Mã sản phẩm không hợp lệ');
 if(code!==S.code)setCode(code);
 const edited=str(document.getElementById('act56-name')?.value||S.name);
 let name=edited&&edited!==UNKNOWN?edited:'';
 if(!name){
  try{name=str(await window.MWG_CATALOG.lookup(code))}catch(e){}
 }
 S.code=code;S.name=(name||UNKNOWN).slice(0,300);S.nameState=name?'found':'missing';setNameInDom();
 return {code,name:S.name};
}
function feedback(s,error=false){S.last=String(s);S.lastType=error?'error':'ok';const n=document.querySelector('.act56-feedback');if(n){n.textContent=S.last;n.className='act56-feedback '+(error?'act56-error':'act56-success')}if(error)toast(s)}
function addNoImei(code,name,qty=1){
 if(!validSku(code))throw Error('Mã sản phẩm không hợp lệ');
 if(!Number.isSafeInteger(qty)||qty<1||qty>100000)throw Error('Số lượng phải là số nguyên từ 1 đến 100.000');
 const entry=S.noImei.find(x=>x.code===code);
 if(entry){if(entry.qty+qty>100000000)throw Error('Tổng số lượng vượt giới hạn');entry.qty+=qty;if((entry.name===UNKNOWN||!entry.name)&&name!==UNKNOWN)entry.name=name}
 else{if(S.noImei.length>=MAX_ROWS)throw Error('Đã vượt giới hạn số model; hãy xuất Excel rồi xóa phiên kiểm kê.');S.noImei.push({code,name,qty})}
 S.lastCode=code;S.undo={mode:'noImei',code,qty};S.lastType='ok';S.last=`Đã cộng ${fmt(qty)} sản phẩm ${code}. Tổng model: ${fmt((S.noImei.find(x=>x.code===code)||{}).qty)}.`;
 save();return S.noImei.find(x=>x.code===code);
}
function addImei(code,name,imei){
 if(!validSku(code))throw Error('Cần chọn mã sản phẩm trước khi nhập IMEI');
 const id=normalizeImei(imei);
 if(!validImei(id))throw Error('IMEI không hợp lệ (chỉ chữ/số, 2–30 ký tự)');
 if(S.imei.some(x=>x.imei===id))throw Error('IMEI '+id+' đã được ghi nhận. Không cộng trùng.');
 if(S.imei.length>=MAX_ROWS)throw Error('Đã đạt giới hạn IMEI trên thiết bị. Hãy xuất Excel để lưu trước.');
 S.imei.push({code,name,imei:id});S.lastCode=id;S.undo={mode:'imei',imei:id};S.lastType='ok';S.last='✓ Đã ghi IMEI '+id+' · '+code;
 save();return id;
}
function clearCodeInput(){S.code='';S.name='';S.nameState='idle';lookupEpoch++;if(lookupTimer){clearTimeout(lookupTimer);lookupTimer=null}const c=document.getElementById('act56-code'),n=document.getElementById('act56-name');if(c)c.value='';if(n)n.value='';setStatus()}
async function submitCode(){
 if(processing)return;processing=true;
 try{
  const {code,name}=await currentName();
  if(mode==='noImei'){
   const raw=document.getElementById('act56-qty')?.value||'1';const qty=Number(raw);
   addNoImei(code,name,qty);S.quantity=1;clearCodeInput();draw();document.getElementById('act56-code')?.focus();
  }else{S.last='Đã chọn '+code+' · '+name+'. Tiếp tục quét IMEI.';S.lastType='ok';draw();document.getElementById('act56-imei')?.focus()}
 }catch(e){feedback(e.message,true)}finally{processing=false}
}
async function submitImei(){
 if(processing)return;processing=true;
 try{
  const {code,name}=await currentName();
  const raw=document.getElementById('act56-imei')?.value||S.imeiInput;
  addImei(code,name,raw);S.imeiInput='';draw();document.getElementById('act56-imei')?.focus();
 }catch(e){feedback(e.message,true)}finally{processing=false}
}
function undo(){
 const action=S.undo;if(!action||action.mode!==mode)return;
 if(mode==='imei'){const idx=S.imei.findIndex(x=>x.imei===action.imei);if(idx>=0)S.imei.splice(idx,1)}
 else{const item=S.noImei.find(x=>x.code===action.code);if(item){item.qty-=action.qty;if(item.qty<=0)S.noImei=S.noImei.filter(x=>x!==item)}}
 S.undo=null;S.lastCode='';S.lastType='';S.last='Đã hoàn tác lần ghi cuối.';save();draw();
}
function removeItem(key){
 if(mode==='imei')S.imei=S.imei.filter(x=>x.imei!==key);
 else S.noImei=S.noImei.filter(x=>x.code!==key);
 S.undo=null;S.lastType='';S.lastCode='';S.last='Đã xóa dòng đã chọn.';save();draw();
}
function removeAll(){if(!confirm('Xóa toàn bộ dữ liệu Kiểm Kê Chủ Động '+(mode==='imei'?'CÓ IMEI':'KHÔNG IMEI')+' đang lưu trên thiết bị này? Hành động không thể hoàn tác.'))return;
 if(mode==='imei')S.imei=[];else S.noImei=[];S.undo=null;S.lastType='';S.lastCode='';S.last='Đã làm trống dữ liệu chế độ này.';save();draw()}
// Minimal Excel Open XML writer with local ZIP (no remote CDN, no macros, codes/IMEIs as text).
const encoder=new TextEncoder();
function xml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'')}
function colName(n){let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s}
function sheetXml(rows,numbers){
 const count=rows.length;const colCount=Math.max(1,...rows.map(r=>r.length));
 let s='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
 s+=`<dimension ref="A1:${colName(colCount)}${count}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="16"/>`;
 s+='<cols>'+Array.from({length:colCount},(_,i)=>`<col min="${i+1}" max="${i+1}" width="${i===1?55:i===2?24:22}" customWidth="1"/>`).join('')+'</cols><sheetData>';
 for(let r=0;r<rows.length;r++){
  s+=`<row r="${r+1}">`;
  for(let c=0;c<rows[r].length;c++){
   const v=rows[r][c];const ref=colName(c+1)+(r+1);
   if(r>0&&numbers.includes(c)&&Number.isFinite(v)){s+=`<c r="${ref}"><v>${v}</v></c>`}
   else s+=`<c r="${ref}" s="${r===0?1:0}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  }
  s+='</row>';
 }
 s+=`</sheetData><autoFilter ref="A1:${colName(colCount)}${count}"/></worksheet>`;
 return s;
}
function crc(bytes){let x=0xffffffff;for(const b of bytes){x^=b;for(let i=0;i<8;i++)x=(x&1)?(x>>>1)^0xedb88320:x>>>1;}return(x^0xffffffff)>>>0}
function zipParts(files){
 const out=[],directory=[];let offset=0;
 const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
 function emit(part){out.push(part);offset+=part.length}
 for(const [filename,body] of files){
  const path=encoder.encode(filename),bytes=encoder.encode(body),check=crc(bytes),start=offset;
  emit(new Uint8Array([80,75,3,4,...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(check),...u32(bytes.length),...u32(bytes.length),...u16(path.length),...u16(0)]));emit(path);emit(bytes);
  directory.push(new Uint8Array([80,75,1,2,...u16(20),...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(check),...u32(bytes.length),...u32(bytes.length),...u16(path.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(start),...path]));
 }
 const dirOffset=offset;for(const d of directory)emit(d);const dirSize=offset-dirOffset;
 emit(new Uint8Array([80,75,5,6,...u16(0),...u16(0),...u16(directory.length),...u16(directory.length),...u32(dirSize),...u32(dirOffset),...u16(0)]));
 return new Blob(out,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function buildXlsx(sheets){
 const content=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
 const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((v,i)=>`<sheet name="${xml(v.title)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`;
 const rels=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((v,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
 const styles=`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF155BD4"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`;
 const files=[['[Content_Types].xml',content],['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',rels],['xl/styles.xml',styles]];
 sheets.forEach((sheet,i)=>files.push([`xl/worksheets/sheet${i+1}.xml`,sheetXml(sheet.rows,sheet.numeric||[])]));
 return zipParts(files);
}
function exportExcel(){
 const count=mode==='imei'?S.imei.length:S.noImei.length;
 if(!count)throw Error('Chưa có sản phẩm nào để xuất Excel.');
 const sorted=mode==='imei'?[...S.imei].sort((a,b)=>a.code.localeCompare(b.code)||a.imei.localeCompare(b.imei)):[...S.noImei].sort((a,b)=>a.code.localeCompare(b.code));
 const sheets=mode==='imei'?[{title:'CHI TIẾT IMEI',rows:[['Mã Sản Phẩm','Tên Sản Phẩm','IMEI'],...sorted.map(x=>[x.code,x.name,x.imei])]},
 {title:'TỔNG HỢP THEO MÃ',numeric:[2],rows:[['Mã Sản Phẩm','Tên Sản Phẩm','Số Lượng'],...[...summary().values()].sort((a,b)=>a.code.localeCompare(b.code)).map(x=>[x.code,x.name,x.qty])]}]:
 [{title:'KIỂM KÊ KHÔNG IMEI',numeric:[2],rows:[['Mã Sản Phẩm','Tên Sản Phẩm','Số Lượng'],...sorted.map(x=>[x.code,x.name,x.qty])]}];
 const data=buildXlsx(sheets);
 const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;
 const safeShop=String(H?.shopCode?.()||'SHOP').replace(/[^a-z0-9_-]/gi,'_');
 a.download=`KIEM_KE_CHU_DONG_${mode==='imei'?'CO_IMEI':'KHONG_IMEI'}_${safeShop}_${new Date().toISOString().slice(0,10)}.xlsx`;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 S.last='Đã tạo file Excel đầy đủ '+fmt(count)+' dòng.';S.lastType='ok';feedback(S.last);
}
function select(value){if(!['choose','noImei','imei'].includes(value))return;window.MWG_LOOKUP_CAMERA?.stop?.();mode=value==='choose'?null:value;lookupEpoch++;clearCodeInput();S.imeiInput='';S.last='';S.undo=null;S.lastType='';S.lastCode='';draw();setTimeout(()=>document.getElementById('act56-code')?.focus(),0)}
document.addEventListener('click',e=>{
 const option=e.target.closest?.('[data-act56-select]');if(option){e.preventDefault();select(option.dataset.act56Select);return}
 const action=e.target.closest?.('[data-act56-action]');if(action){e.preventDefault();try{
  if(action.dataset.act56Action==='export')exportExcel();
  else if(action.dataset.act56Action==='undo')undo();
  else if(action.dataset.act56Action==='clear')removeAll();
 }catch(err){feedback(err.message,true)}return}
 const del=e.target.closest?.('[data-act56-delete]');if(del){e.preventDefault();removeItem(del.dataset.act56Delete)}
});
document.addEventListener('submit',e=>{if(e.target.id==='act56-code-form'){e.preventDefault();submitCode()}else if(e.target.id==='act56-imei-form'){e.preventDefault();submitImei()}});
document.addEventListener('input',e=>{if(e.target.id==='act56-code')setCode(e.target.value);else if(e.target.id==='act56-name'){S.name=e.target.value;S.nameState='found'}else if(e.target.id==='act56-imei')S.imeiInput=e.target.value;else if(e.target.id==='act56-qty')S.quantity=Number(e.target.value)||1});
document.addEventListener('mwg-active-scan',e=>{if(e.detail?.targetId==='act56-code')submitCode();else if(e.detail?.targetId==='act56-imei')submitImei()});
window.INV_ACTIVE56={configure,view,load,leave,onShopChange,isCameraRunning:()=>!!window.MWG_LOOKUP_CAMERA?.isRunning?.()};
})();
