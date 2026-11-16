/* BÁO GIÁ 4.0 — 112191 WORK. Sheet reference: BẢNG BÁO GIÁ, 6 sản phẩm. */
(function(){
'use strict';
const SOURCE='https://docs.google.com/spreadsheets/d/1A_ejAz3RKIpMOFOz6y4xeEp-ut76USMZBSB4RKn6sFM/edit?gid=1265564069';
const CHANNELS=['ĐIỆN MÁY XANH','THẾ GIỚI DI ĐỘNG'],DEFAULT_STORE='ĐML_HCM_Q12 - 102 Lê Văn Khương';
const emptyProduct=()=>({url:'',name:'',image:'',price:'',discount:'',status:'',fallback:''});
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const initial=()=>({channel:CHANNELS[0],store:'',search:'',extra:'',date:today(),valid:today(),client:'',clientAddress:'',clientTax:'',clientEmail:'',contact:'',contactPhone:'',products:Array.from({length:6},emptyProduct)});
let helper=null,shopId=null,model=initial();const activeLookups=new Map(),timers=new Map();
const h=x=>String(x==null?'':x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const el=id=>document.getElementById(id),toast=m=>helper?.toast?.('Báo giá: '+m);
const money=n=>Math.max(0,Math.round(Number(n)||0)).toLocaleString('vi-VN')+' đ';
const total=p=>Math.max(0,(Number(p.price)||0)-(Number(p.discount)||0));
const LIST=()=>Array.isArray(window.QUOTE_STORES)?window.QUOTE_STORES:[];
const options=(channel,q='')=>LIST().filter(s=>s.channel===channel&&(!q||String(s.label+' '+s.address).toLocaleLowerCase('vi').includes(q.toLocaleLowerCase('vi'))));
const currentStore=()=>LIST().find(s=>s.label===model.store&&s.channel===model.channel);
const storageKey=()=> 'work112191_quote_v1_'+(shopId||'default');
function restore(){
 try{
  const raw=JSON.parse(localStorage.getItem(storageKey())||'null');
  model=raw&&typeof raw==='object'?{...initial(),...raw,products:Array.from({length:6},(_,i)=>({...emptyProduct(),...(raw.products?.[i]||{})}))}:initial();
 }catch{model=initial()}
 if(!model.store&&helper?.shopCode?.()==='97')model.store=DEFAULT_STORE;
 if(!CHANNELS.includes(model.channel))model.channel=CHANNELS[0];
}
function persist(){try{localStorage.setItem(storageKey(),JSON.stringify(model))}catch(e){console.warn('Quote draft localStorage full',e)}}
function configure(x){helper=x}
function enter(){const next=helper?.shopId?.()||null;if(next!==shopId){shopId=next;restore()}}
function onShopChange(){timers.forEach(clearTimeout);timers.clear();activeLookups.clear();shopId=null;model=initial()}
function data(){enter();return model}
const filled=()=>model.products.filter(p=>p.url||p.name||p.price);
function storeOptions(){
 const filtered=options(model.channel,model.search);
 return '<option value="">-- Chọn siêu thị --</option>'+filtered.map(s=>'<option value="'+h(s.label)+'" '+(model.store===s.label?'selected':'')+'>'+h(s.label)+'</option>').join('');
}
function field(label,id,value,placeholder='',type='text'){
 return '<label class="q-field"><span>'+h(label)+'</span><input id="'+id+'" data-q-field="'+id+'" type="'+type+'" value="'+h(value)+'" placeholder="'+h(placeholder)+'" autocomplete="off"></label>';
}
function formatDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v)))return v||'';const [y,m,d]=v.split('-');return d+'/'+m+'/'+y}
function printPreview(){
 const s=currentStore(),name=model.store||'CHƯA CHỌN SIÊU THỊ',fullAddress=[s?.address,model.extra].filter(Boolean).join(', ');
 const rows=filled(),sum=rows.reduce((v,p)=>v+total(p),0);
 return '<div class="q-print" id="quotePrint">'+
 '<div class="q-company"><div><b>CÔNG TY CỔ PHẦN ĐẦU TƯ ĐIỆN MÁY XANH</b><small>Địa chỉ: 128 Trần Quang Khải, P. Tân Định, TP. Hồ Chí Minh</small>'+
 '<small>Địa chỉ liên hệ: Lô T2-1.2, Đường D1, Khu Công Nghệ Cao, Phường Tăng Nhơn Phú, TP.HCM</small>'+
 '<small>Điện thoại: 18001060 • Mã số thuế: 0303217354</small></div><div class="q-branch"><strong>'+h(model.channel)+'</strong><span>'+h(name)+'</span><small>Địa chỉ: '+h(fullAddress||'—')+'</small></div></div>'+
 '<div class="q-document-title"><h2>BẢNG BÁO GIÁ</h2><div>Ngày báo giá: <b>'+h(formatDate(model.date))+'</b><div>Hiệu lực đến: <b>'+h(formatDate(model.valid))+'</b></div></div></div>'+
 '<div class="q-client"><div><b>Kính gửi anh/chị:</b> '+h(model.client||'........................................................')+'</div>'+
 '<div><b>Địa chỉ:</b> '+h(model.clientAddress||'—')+'</div><div><b>Mã số thuế:</b> '+h(model.clientTax||'—')+
 '</div><div><b>Email:</b> '+h(model.clientEmail||'—')+'</div></div>'+
 '<div class="q-print-table-wrap"><table class="q-print-table"><thead><tr><th>STT</th><th>Hình ảnh sản phẩm</th><th>Tên sản phẩm</th><th>Giá gốc</th><th>Chiết khấu</th><th>Giá bán lẻ</th></tr></thead><tbody>'+
 (rows.length?rows.map((p,i)=>'<tr><td>'+(i+1)+'</td><td>'+(p.image?'<img src="'+h(p.image)+'" alt="" referrerpolicy="no-referrer">':'<div class="q-no-photo">Chưa có ảnh</div>')+'</td>'+
 '<td><b>'+h(p.name||'Chưa có tên sản phẩm')+'</b></td><td>'+money(p.price)+'</td><td>'+money(p.discount)+'</td><td><b>'+money(total(p))+'</b></td></tr>').join(''):
 '<tr><td colspan="6" class="q-empty-preview">Dán link sản phẩm để tạo báo giá</td></tr>')+
 '</tbody><tfoot><tr><td colspan="5">TỔNG CỘNG (VND)</td><td>'+money(sum)+'</td></tr></tfoot></table></div>'+
 '<div class="q-terms"><div><b>ĐIỀU KHOẢN THANH TOÁN</b><p>1. Giá trên đã bao gồm 8% VAT.<br>2. Thanh toán bằng chuyển khoản hoặc tiền mặt trước khi nhận hàng.</p></div>'+
 '<div><b>BẢO HÀNH & GIAO NHẬN</b><p>3. Hàng hóa được bảo hành theo tiêu chuẩn nhà sản xuất và phân phối.<br>4. Hàng hóa được giao tại 34 tỉnh thành.</p></div></div>'+
 '<div class="q-sign"><div>Nếu quý khách cần hỗ trợ thêm thông tin, vui lòng liên hệ với:</div><strong>QUẢN LÝ SIÊU THỊ'+(model.contact?' | '+h(model.contact):'')+
 (model.contactPhone?' - '+h(model.contactPhone):'')+'</strong><small>Địa chỉ: '+h(fullAddress||'—')+'</small>'+
 '<p>Cảm ơn Quý khách đã cộng tác với Thegioididong.com!</p></div></div>';
}
function view(){
 enter();
 return '<div class="quote40"><section class="panel q-head"><div><h2>BÁO GIÁ</h2><div class="subtitle">Theo Google Sheet: chọn siêu thị, dán 6 link sản phẩm và tự nhận tên / hình</div></div>'+
 '<div class="q-actions"><a class="q-secondary" href="'+h(SOURCE)+'" target="_blank" rel="noopener noreferrer">Mở Google Sheet gốc</a>'+
 '<button class="btn" type="button" data-q-action="print">In / Xuất PDF A4 ngang</button></div></section>'+
 '<section class="panel"><h2>1. CHỌN SIÊU THỊ</h2><div class="q-grid">'+
 '<label class="q-field"><span>KÊNH</span><select id="qChannel" data-q-field="qChannel">'+CHANNELS.map(x=>'<option '+(model.channel===x?'selected':'')+'>'+h(x)+'</option>').join('')+'</select></label>'+
 field('TÌM KIẾM','qSearch',model.search,'Gõ địa chỉ hoặc mã siêu thị')+
 '<label class="q-field q-wide"><span>SIÊU THỊ</span><select id="qStore" data-q-field="qStore">'+storeOptions()+'</select></label>'+
 field('BỔ SUNG ĐỊA CHỈ','qExtra',model.extra,'Phường, quận, số nhà...')+'</div>'+
 '<p class="q-hint">'+LIST().length+' điểm bán từ danh mục Sheet gốc tại thời điểm tích hợp. Danh sách mới trên Sheet không tự đồng bộ vào bản này.</p></section>'+
 '<section class="panel"><h2>2. THÔNG TIN BÁO GIÁ</h2><div class="q-grid">'+
 field('Ngày báo giá','qDate',model.date,'','date')+field('Hiệu lực đến','qValid',model.valid,'','date')+
 field('Kính gửi anh/chị / Đơn vị','qClient',model.client,'Tên khách hàng hoặc công ty')+
 field('Địa chỉ khách hàng','qClientAddress',model.clientAddress,'Địa chỉ khách hàng')+
 field('Mã số thuế','qClientTax',model.clientTax,'Nếu có')+field('Email','qClientEmail',model.clientEmail,'Email khách hàng','email')+
 field('Tên quản lý / người liên hệ','qContact',model.contact,'Người báo giá')+
 field('Điện thoại liên hệ','qContactPhone',model.contactPhone,'Số điện thoại')+'</div></section>'+
 '<section class="panel"><h2>3. DÁN LINK SẢN PHẨM (TỐI ĐA 6)</h2><p class="q-hint">Dán link sản phẩm, hệ thống sẽ tìm tên và ảnh. Nếu trang nguồn chặn nhận diện, anh có thể nhập tên và tải ảnh thủ công.</p>'+
 '<div class="q-products">'+model.products.map((v,i)=>'<div class="q-item"><div class="q-item-head"><strong>Sản phẩm '+(i+1)+'</strong><small id="qStatus'+i+'">'+h(v.status||'Chưa dán link')+'</small></div>'+
 '<div class="q-url-row"><input data-q-item="'+i+'" data-q-prop="url" type="url" value="'+h(v.url)+'" placeholder="https://www.dienmayxanh.com/..." autocomplete="off">'+
 '<button type="button" class="q-secondary" data-q-action="lookup" data-index="'+i+'">Lấy tên & hình</button></div>'+
 '<div class="q-item-detail"><div class="q-thumb" id="qThumb'+i+'">'+(v.image?'<img src="'+h(v.image)+'" referrerpolicy="no-referrer" alt="Ảnh sản phẩm">':'<span>HÌNH SẢN PHẨM</span>')+'</div>'+
 '<div class="q-grid q-item-fields"><label class="q-field q-wide"><span>TÊN SẢN PHẨM</span><input data-q-item="'+i+'" data-q-prop="name" value="'+h(v.name)+'" placeholder="Tự nhận diện, có thể sửa"></label>'+
 '<label class="q-field"><span>GIÁ GỐC (VND)</span><input type="number" min="0" step="1" inputmode="numeric" data-q-item="'+i+'" data-q-prop="price" value="'+h(v.price)+'" placeholder="0"></label>'+
 '<label class="q-field"><span>CHIẾT KHẤU (VND)</span><input type="number" min="0" step="1" inputmode="numeric" data-q-item="'+i+'" data-q-prop="discount" value="'+h(v.discount)+'" placeholder="0"></label>'+
 '<label class="q-field q-wide"><span>LINK HÌNH DỰ PHÒNG</span><input type="url" data-q-item="'+i+'" data-q-prop="fallback" value="'+h(v.fallback)+'" placeholder="https://...jpg/png"></label>'+
 '<label class="q-field q-wide"><span>Hoặc chọn ảnh trên điện thoại / máy tính</span><input type="file" accept="image/jpeg,image/png,image/webp" data-q-upload="'+i+'"></label></div></div>'+
 '<div class="q-item-foot"><small>Giá bán lẻ: <strong id="qPrice'+i+'">'+money(total(v))+'</strong></small>'+
 '<button type="button" class="q-secondary q-danger" data-q-action="clear-product" data-index="'+i+'">Xóa sản phẩm</button></div></div>').join('')+'</div></section>'+
 '<section class="panel q-preview-wrap"><div class="q-preview-head"><h2>4. XEM TRƯỚC BẢNG BÁO GIÁ</h2><button class="btn" data-q-action="print" type="button">In / Lưu PDF</button></div>'+
 '<div id="qPreview">'+printPreview()+'</div></section></div>';
}
const FIELDS={qChannel:'channel',qSearch:'search',qStore:'store',qExtra:'extra',qDate:'date',qValid:'valid',
 qClient:'client',qClientAddress:'clientAddress',qClientTax:'clientTax',qClientEmail:'clientEmail',qContact:'contact',qContactPhone:'contactPhone'};
function updatePreview(){const dest=el('qPreview');if(dest)dest.innerHTML=printPreview()}
function updatePrice(i){const d=el('qPrice'+i);if(d)d.textContent=money(total(model.products[i]));updatePreview()}
async function lookup(i){
 const p=model.products[i];if(!p)return;
 const url=p.url.trim();
 if(!/^https:\/\//i.test(url)){p.status='Link cần bắt đầu bằng https://';persist();helper.draw();return}
 const run=(activeLookups.get(i)||0)+1;activeLookups.set(i,run);
 p.status='Đang tự nhận diện tên và hình...';const status=el('qStatus'+i);if(status)status.textContent=p.status;
 try{
  const result=await helper.resolveProduct(url);
  if(activeLookups.get(i)!==run||p.url.trim()!==url)return;
  if(result?.error)throw Error(result.error);
  p.status=result.title||result.image?'Đã nhận diện tự động':'Không lấy được tên/hình, hãy nhập dự phòng';
  if(result.title)p.name=result.title;
  if(result.image&&/^https:\/\//.test(result.image))p.image=result.image;
 }catch(e){if(activeLookups.get(i)!==run)return;p.status='Không lấy được tự động: '+(e.message||e)+'. Hãy nhập dự phòng.'}
 persist();helper.draw();
}
function scheduleLookup(i){clearTimeout(timers.get(i));timers.set(i,setTimeout(()=>lookup(i),500))}
async function uploadImage(i,file){
 if(!file||!file.type.startsWith('image/'))return;
 if(file.size>12*1024*1024){toast('Ảnh vượt 12 MB');return}
 try{
  const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=reject;r.onload=()=>resolve(r.result);r.readAsDataURL(file)});
  const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=data});
  const canvas=document.createElement('canvas'),ratio=Math.min(1,600/Math.max(image.width,image.height));
  canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  model.products[i].image=canvas.toDataURL('image/jpeg',.78);
  model.products[i].status='Đã thêm ảnh từ thiết bị';persist();helper.draw();
 }catch(e){toast('Không đọc được ảnh: '+(e.message||e))}
}
function onInput(target){
 const fld=target.dataset.qField;
 if(fld){
  const k=FIELDS[fld];if(!k)return;
  model[k]=target.value;
  if(k==='channel'){model.store='';model.search='';persist();helper.draw();return}
  if(k==='search'){const select=el('qStore');if(select)select.innerHTML=storeOptions()}
  if(k==='store'){persist();helper.draw()}else{persist();if(k!=='search')updatePreview()}
  return;
 }
 const index=Number(target.dataset.qItem),prop=target.dataset.qProp;
 if(Number.isInteger(index)&&index>=0&&index<6&&['url','name','price','discount','fallback'].includes(prop)){
  const p=model.products[index];p[prop]=target.value;
  if(prop==='url'){
   activeLookups.set(index,(activeLookups.get(index)||0)+1);
   p.name='';p.image='';p.status=target.value?'Đang chờ nhận diện...':'Chưa dán link';
   if(target.value.trim())scheduleLookup(index);
   else{clearTimeout(timers.get(index));updatePreview()}
  }
  if(prop==='fallback'&&/^https:\/\//.test(target.value.trim())){p.image=target.value.trim();updatePreview()}
  if(prop==='name')updatePreview();
  if(prop==='price'||prop==='discount')updatePrice(index);
  persist();
 }
}
function printQuote(){
 if(!filled().length){toast('Anh cần thêm ít nhất 1 sản phẩm trước khi in');return}
 if(!currentStore()){toast('Anh cần chọn siêu thị trong danh mục trước khi in');return}
 window.print();
}
document.addEventListener('input',e=>{if(e.target.closest('.quote40'))onInput(e.target)});
document.addEventListener('change',e=>{
 if(!e.target.closest('.quote40'))return;
 if(e.target.dataset.qUpload!==undefined&&e.target.files?.[0])uploadImage(Number(e.target.dataset.qUpload),e.target.files[0]);
 else if(e.target.dataset.qField)onInput(e.target);
});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-q-action]');if(!b)return;e.preventDefault();enter();
 if(b.dataset.qAction==='lookup')lookup(Number(b.dataset.index));
 if(b.dataset.qAction==='print')printQuote();
 if(b.dataset.qAction==='clear-product'){
  const i=Number(b.dataset.index);activeLookups.set(i,(activeLookups.get(i)||0)+1);
  clearTimeout(timers.get(i));model.products[i]=emptyProduct();persist();helper.draw();
 }
});
window.QUOTE40={configure,enter,onShopChange,view,data,printPreview,lookup,_test:{options,total,formatDate}};
})();