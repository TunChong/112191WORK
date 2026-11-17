/* Warehouse labels, barcode and QR generator. No changes to legacy inventory/camera. */
(function(){'use strict';const X=window.MWGX,QR=()=>window.MWGX_QR,Code=()=>window.MWGX_CODE128;
const modes=[['fifo','In tem FIFO'],['package','In tem kiện hàng'],['imei_qr','In tem IMEI QR'],['imei_barcode','In tem IMEI Barcode'],['product','In tem sản phẩm'],['accessory','Kiểm phụ kiện'],['history','Lịch sử in tem'],['settings','Cấu hình máy in']];
const S={tab:'fifo',code:'',name:'',imei:'',packageCode:'',warehouseCode:'',fromShop:'',toShop:'',location:'',inDate:X.date(),checkDate:X.date(),createDate:X.date(),qty:1,notes:'',accessory:'',expected:0,actual:0,printer:'Máy in 1',paper:'A4',width:70,height:40,diameter:35,margin:5,gap:3,cols:2,rows:5,fontSize:4,codeHeight:15,profiles:[],history:[],imeiBulk:''};
let seq=0,timer=null;
function selectOptions(){return modes.map(([v,t])=>`<button type="button" data-mwgx="mode:${v}" class="${v===S.tab?'selected':''}">${X.esc(t)}</button>`).join('')}
function baseForm(){return `<div class="mwgx-fields">${X.htmlField('Mã sản phẩm','mwgx-w-code',S.code)}${X.htmlField('Tên sản phẩm','mwgx-w-name',S.name)}${X.htmlField('Vị trí kho','mwgx-w-location',S.location)}${X.htmlField('Số lượng tem','mwgx-w-qty',S.qty,'number','min="1" max="200"')}</div>`}
function form(){const mode=S.tab;let out='';
 if(mode==='fifo')out=baseForm()+`<div class="mwgx-fields">${X.htmlField('Ngày nhập','mwgx-w-inDate',S.inDate,'date')}${X.htmlField('Ngày kiểm','mwgx-w-checkDate',S.checkDate,'date')}${X.htmlField('Đường kính tem tròn (mm)','mwgx-w-diameter',S.diameter,'number','min="15" max="150"')}</div>`;
 else if(mode==='package')out=`<div class="mwgx-fields">${X.htmlField('Mã kiện','mwgx-w-packageCode',S.packageCode)}${X.htmlField('Mã kho','mwgx-w-warehouseCode',S.warehouseCode)}${X.htmlField('Kho gửi','mwgx-w-fromShop',S.fromShop)}${X.htmlField('Kho nhận','mwgx-w-toShop',S.toShop)}${X.htmlField('Số kiện','mwgx-w-qty',S.qty,'number','min="1" max="200"')}${X.htmlField('Ngày tạo','mwgx-w-createDate',S.createDate,'date')}${X.htmlField('Ghi chú','mwgx-w-notes',S.notes)}</div>`;
 else if(mode==='imei_qr'||mode==='imei_barcode')out=baseForm().replace(X.htmlField('Số lượng tem','mwgx-w-qty',S.qty,'number','min="1" max="200"'),'')+`<label class="mwgx-field"><span>Danh sách IMEI (mỗi dòng một IMEI, tối đa 200 dòng)</span><textarea id="mwgx-w-imeiBulk" rows="5" placeholder="Quét hoặc nhập IMEI, bấm Enter sang dòng">${X.esc(S.imeiBulk)}</textarea></label>`;
 else if(mode==='product')out=baseForm();
 else if(mode==='accessory')out=`<div class="mwgx-fields">${X.htmlField('Mã sản phẩm','mwgx-w-code',S.code)}${X.htmlField('Tên sản phẩm','mwgx-w-name',S.name)}${X.htmlField('Loại phụ kiện','mwgx-w-accessory',S.accessory)}${X.htmlField('Dự kiến','mwgx-w-expected',S.expected,'number','min="0" step="1"')}${X.htmlField('Thực tế','mwgx-w-actual',S.actual,'number','min="0" step="1"')}${X.htmlField('Ngày kiểm','mwgx-w-checkDate',S.checkDate,'date')}${X.htmlField('Người kiểm','mwgx-w-user',X.context().userName,'text','readonly')}${X.htmlField('Ghi chú','mwgx-w-notes',S.notes)}</div><p class="mwgx-info">Dư/Thiếu: <strong id="mwgx-w-variance">${Number(S.actual)-Number(S.expected)}</strong></p>`;
 return out;
}
function settings(){return `<div class="mwgx-fields">${X.htmlField('Tên máy in','mwgx-w-printer',S.printer)}${X.selectField('Khổ giấy','mwgx-w-paper',[['A4','A4'],['A5','A5'],['CUSTOM','Tem nhiệt / tùy chỉnh']],S.paper)}${X.htmlField('Rộng tem (mm)','mwgx-w-width',S.width,'number','min="10" max="400"')}${X.htmlField('Cao tem (mm)','mwgx-w-height',S.height,'number','min="10" max="400"')}${X.htmlField('Lề (mm)','mwgx-w-margin',S.margin,'number','min="0" max="40"')}${X.htmlField('Khoảng cách (mm)','mwgx-w-gap',S.gap,'number','min="0" max="25"')}${X.htmlField('Số tem mỗi hàng','mwgx-w-cols',S.cols,'number','min="1" max="10"')}${X.htmlField('Số hàng','mwgx-w-rows',S.rows,'number','min="1" max="20"')}${X.htmlField('Cỡ chữ (mm)','mwgx-w-fontSize',S.fontSize,'number','min="2" max="20" step="0.5"')}${X.htmlField('Độ cao barcode (mm)','mwgx-w-codeHeight',S.codeHeight,'number','min="5" max="60"')}</div><div class="mwgx-actions">${X.button('Lưu cấu hình máy in','saveProfile','primary')}${X.button('Tải cấu hình','loadProfiles')}</div><div class="mwgx-small">Epson TM-T82: chọn khổ giấy đúng theo driver và cuộn nhiệt đang lắp. Không có lệnh cắt tự động từ trình duyệt web nếu driver không hỗ trợ.</div>${S.profiles.map(p=>`<button type="button" class="mwgx-btn" data-mwgx="profile:${X.esc(p.id)}">${X.esc(p.name)}</button>`).join('')}`}
function labelInfo(){const m=S.tab;if(m==='package')return {title:S.packageCode,subtitle:`${S.fromShop} → ${S.toShop}`,foot:`Kho ${S.warehouseCode} · ${S.createDate}`,code:S.packageCode};if(m==='fifo')return {title:S.name||S.code,subtitle:'FIFO · '+S.inDate,foot:'Vị trí: '+S.location,code:S.code};return {title:S.name||S.code,subtitle:'Mã sản phẩm: '+S.code,foot:S.location,code:S.code}}
function imeis(){let vals=S.imeiBulk.split(/[\n\r\t;,]+/).map(v=>v.trim().toUpperCase()).filter(Boolean);if(vals.length>200)throw Error('Tối đa 200 IMEI/lượt');if(vals.some(x=>!/^[A-Z0-9]{2,35}$/.test(x)))throw Error('Danh sách IMEI có ký tự không hợp lệ.');if(new Set(vals).size!==vals.length)throw Error('Phát hiện IMEI trùng. Vui lòng kiểm tra trước khi in.');return vals}
function labelMarkup(x,y,w,h,info,codeType){let svg='',font=Math.min(Number(S.fontSize)||4,h/9),pads=Math.min(3,w*.07);
 if(S.tab==='fifo'){const diameter=Math.min(w,h,Number(S.diameter)||35),cx=x+w/2,cy=y+h/2;svg+=`<circle cx="${cx}" cy="${cy}" r="${diameter/2-.4}" fill="#fff" stroke="#115bc9" stroke-width=".8"/>`;}
 else svg+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="#fff" stroke="#115bc9" stroke-width=".4"/>`;
 const txt=(yy,t,bold=false)=>`<text x="${x+w/2}" y="${yy}" text-anchor="middle" font-family="Arial" font-size="${font*(bold?1.06:.78)}" font-weight="${bold?'700':'400'}" fill="#172a47">${X.esc(String(t).slice(0,48))}</text>`;
 svg+=txt(y+h*.19,info.title||'SẢN PHẨM',true)+txt(y+h*.34,info.subtitle||'');
 if(codeType==='qr'){
  const mat=QR()?.matrix(info.code);if(!mat)throw Error('Chưa tải thư viện QR cục bộ');const n=mat.length;
  const size=Math.min(w*.35,h*.43),step=size/(n+8),mx=x+(w-size)/2,my=y+h*.39;
  svg+=`<rect x="${mx}" y="${my}" width="${size}" height="${size}" fill="white"/>`;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(mat[r][c])svg+=`<rect x="${(mx+(c+4)*step).toFixed(4)}" y="${(my+(r+4)*step).toFixed(4)}" width="${(step+.01).toFixed(4)}" height="${(step+.01).toFixed(4)}" fill="#000"/>`;
 }
 if(codeType==='barcode'){
  const bars=Code()?.bars(info.code);if(!bars)throw Error('Chưa tải bộ mã Code128');const units=bars.reduce((a,b)=>a+b,0),width=w*.83,ratio=width/units,by=y+h*.43,bh=Math.min(h*.35,Number(S.codeHeight)||15);let xx=x+(w-width)/2;bars.forEach((v,i)=>{if(i%2===0)svg+=`<rect x="${xx.toFixed(4)}" y="${by}" width="${(v*ratio).toFixed(4)}" height="${bh}" fill="#000"/>`;xx+=v*ratio});
 }
 svg+=txt(y+h*.89,info.code||info.foot||'');return svg;
}
function printPages(){const v=labelInfo(),arr=(S.tab==='imei_qr'||S.tab==='imei_barcode')?imeis().map(i=>({...v,code:i})):Array.from({length:Math.max(1,Math.min(200,Number(S.qty)||1))},()=>v);
 if(arr.length===0)throw Error('Chưa nhập IMEI cần in');
 if(!v.code&&S.tab!=='fifo')throw Error('Thiếu mã sản phẩm hoặc mã kiện');
 const pages=[];
 const paper=S.paper==='A5'?[148,210]:S.paper==='CUSTOM'?[Number(S.width)+2*Number(S.margin),Number(S.height)+2*Number(S.margin)]:[210,297];
 const [W,H]=paper,mar=Math.max(0,Number(S.margin)||0),gap=Math.max(0,Number(S.gap)||0),w=Number(S.width),h=Number(S.height);
 if(!(w>10&&h>10&&W>0&&H>0)||W>400||H>400)throw Error('Kích thước in không hợp lệ');
 const ncols=Math.floor((W-2*mar+gap)/(w+gap)),nrows=Math.floor((H-2*mar+gap)/(h+gap));
 if(ncols<1||nrows<1)throw Error('Tem không vừa khổ giấy');
 const max=Math.min(Math.max(1,Number(S.cols)||1),ncols)*Math.min(Math.max(1,Number(S.rows)||1),nrows);
 let ix=0;while(ix<arr.length){let chunk=arr.slice(ix,ix+max);let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm"><rect width="${W}" height="${H}" fill="#fff"/>`;
  const usedCols=Math.min(ncols,Math.max(1,Number(S.cols)||1));chunk.forEach((entry,i)=>{let x=mar+(i%usedCols)*(w+gap),y=mar+Math.floor(i/usedCols)*(h+gap);svg+=labelMarkup(x,y,w,h,entry,S.tab==='imei_qr'?'qr':S.tab==='imei_barcode'?'barcode':S.tab==='package'?'barcode':'')});pages.push(svg+'</svg>');ix+=chunk.length;}
 return {pages,w:W,h:H,count:arr.length};
}
function printAll(p){const html=`<!doctype html><html lang="vi"><meta charset="utf-8"><title>Tem MWG</title><style>@page{size:${p.w}mm ${p.h}mm;margin:0}html,body{margin:0;padding:0}.sheet{width:${p.w}mm;height:${p.h}mm;break-after:page;page-break-after:always;overflow:hidden}.sheet:last-child{break-after:auto;page-break-after:auto}svg{width:100%;height:100%}@media print{*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style>${p.pages.map(svg=>`<section class="sheet">${svg}</section>`).join('')}</html>`;const win=window.open('','_blank');if(!win)throw Error('Hãy cho phép popup để in tem');win.document.open();win.document.write(html);win.document.close();win.focus();win.onload=()=>win.print();}
async function logPrint(p){const c=X.needShop();await X.api('/rest/v1/mwgx_print_jobs',{method:'POST',body:{shop_id:c.shopId,created_by:c.userId,module:'warehouse',template_id:S.tab,action:'print',payload:{product_code:S.code,quantity:p.count,printer:S.printer}}})}
async function saveAccessory(){const c=X.needShop();if(!S.code||!S.accessory)throw Error('Nhập mã sản phẩm và loại phụ kiện');const exp=Number(S.expected),count=Number(S.actual);if(!Number.isSafeInteger(exp)||!Number.isSafeInteger(count)||exp<0||count<0)throw Error('Số lượng phải là số nguyên không âm');await X.api('/rest/v1/mwgx_accessory_checks',{method:'POST',body:{shop_id:c.shopId,created_by:c.userId,product_code:S.code,product_name:S.name,accessory_type:S.accessory,expected_qty:exp,actual_qty:count,checked_on:S.checkDate,notes:S.notes}});X.toast('Đã lưu biên bản kiểm phụ kiện lên Supabase.')}
async function loadHistory(){let c=X.needShop();const r=await X.api('/rest/v1/mwgx_print_jobs?select=created_at,template_id,payload,created_by&shop_id=eq.'+encodeURIComponent(c.shopId)+'&module=eq.warehouse&order=created_at.desc&limit=100');S.history=Array.isArray(r)?r:[];X.draw()}
async function saveProfile(){let c=X.needShop();const conf={paper:S.paper,width:Number(S.width),height:Number(S.height),margin:Number(S.margin),gap:Number(S.gap),cols:Number(S.cols),rows:Number(S.rows),fontSize:Number(S.fontSize),codeHeight:Number(S.codeHeight)};if(!S.printer.trim())throw Error('Nhập tên máy in');await X.api('/rest/v1/mwgx_printer_profiles?on_conflict=shop_id,user_id,name',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{shop_id:c.shopId,user_id:c.userId,name:S.printer,settings:conf}});X.toast('Đã lưu cấu hình máy in');await loadProfiles()}
async function loadProfiles(){let c=X.needShop();const r=await X.api('/rest/v1/mwgx_printer_profiles?select=*&shop_id=eq.'+encodeURIComponent(c.shopId)+'&user_id=eq.'+encodeURIComponent(c.userId));S.profiles=Array.isArray(r)?r:[];X.draw()}
function history(){return `${X.heading('Lịch sử in tem','Lưu theo SHOP trên Supabase')}<div class="mwgx-actions">${X.button('Tải lịch sử','loadHistory')}</div><div class="mwgx-table-wrap"><table class="mwgx-table"><thead><tr><th>Ngày</th><th>Mẫu</th><th>Số tem</th></tr></thead><tbody>${S.history.map(v=>`<tr><td>${X.esc(new Date(v.created_at).toLocaleString('vi-VN'))}</td><td>${X.esc(v.template_id)}</td><td>${Number(v.payload?.quantity)||0}</td></tr>`).join('')||'<tr><td colspan="3">Chưa có bản ghi.</td></tr>'}</tbody></table></div>`}
function view(){
 let content='';
 if(S.tab==='history')content=history();
 else if(S.tab==='settings')content=settings();
 else{
  const actions=S.tab==='accessory'? X.button('Lưu kết quả kiểm','saveAccessory','primary')+X.button('Xuất Excel','excelAccessory')+X.button('In / Lưu PDF','printAccessory'):
    X.button('In / Lưu PDF','print','primary')+X.button('Xuất PNG 300 DPI trang đầu','png')+X.button('Cấu hình máy in','mode:settings');
  content=`<h3>${X.esc(modes.find(x=>x[0]===S.tab)?.[1])}</h3>${form()}<div class="mwgx-actions">${actions}</div>`;
  if(S.tab!=='accessory')content+='<p class="mwgx-small">Khổ, lề và tem phải đo thực tế trước khi in hàng loạt. CẦN ĐỐI CHIẾU kích thước tem nguyên bản.</p>';
 }
 return `<div data-mwgx-screen="mwgx_warehouse">${X.heading('KHO & IN TEM','Tạo tem QR/Code128 trên thiết bị, không gửi IMEI ra ngoài.')}<div class="mwgx-tabs">${selectOptions()}</div><section class="mwgx-card">${content}</section></div>`;
}
async function action(a){if(a.startsWith('mode:')){S.tab=a.split(':')[1];X.draw();return}
 if(a.startsWith('profile:')){const p=S.profiles.find(x=>x.id===a.split(':')[1]);if(p){Object.assign(S,p.settings,{printer:p.name});X.draw()}return}
 if(a==='saveProfile')return saveProfile();if(a==='loadProfiles')return loadProfiles();if(a==='loadHistory')return loadHistory();if(a==='saveAccessory')return saveAccessory();
 if(a==='excelAccessory'){
  const header=['Mã sản phẩm','Tên sản phẩm','Loại phụ kiện','Dự kiến','Thực tế','Chênh lệch','Ngày kiểm','Người kiểm'];
  const row=[S.code,S.name,S.accessory,Number(S.expected),Number(S.actual),Number(S.actual)-Number(S.expected),S.checkDate,X.context().userName];
  return X.xlsx([{title:'KIỂM PHỤ KIỆN',numeric:[3,4,5],rows:[header,row]}],`PHU_KIEN_${X.date()}.xlsx`);
 }
 if(a==='printAccessory'){
  const data={kind:'accessory',label:'BIÊN BẢN KIỂM PHỤ KIỆN',heading:S.name,oldPrice:Number(S.expected),salePrice:Number(S.actual),subtitle:`${S.code} · ${S.accessory} · Chênh lệch ${Number(S.actual)-Number(S.expected)}`,paper:'A4',count:1,margin:9};return window.MWGX_PRINT_ENGINE.openPrint(window.MWGX_PRINT_ENGINE.pageData('warehouse',data));
 }
 if(a==='print'){const p=printPages();printAll(p);await logPrint(p);X.toast('Đã mở lệnh in.');return}
 if(a==='png'){const p=printPages(),blob=new Blob([p.pages[0]],{type:'image/svg+xml'}),url=URL.createObjectURL(blob);try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Không vẽ được trang tem'));img.src=url});const scale=300/25.4,w=Math.round(p.w*scale),h=Math.round(p.h*scale);if(w*h>33000000)throw Error('Trang in quá lớn để xuất PNG');const cv=document.createElement('canvas');cv.width=w;cv.height=h;const ct=cv.getContext('2d');ct.fillStyle='#fff';ct.fillRect(0,0,w,h);ct.drawImage(img,0,0,w,h);const out=await new Promise((res,rej)=>cv.toBlob(b=>b?.size?res(b):rej(Error('Tệp PNG rỗng')),'image/png'));X.download(out,`TEM_${X.safeFilename(S.tab)}_${X.date()}.png`)}finally{URL.revokeObjectURL(url)}return}
}
let lookupTimer;
async function input(t){if(t.dataset.mwgxDenom)return;if(!t.id.startsWith('mwgx-w-'))return;const key=t.id.slice(7);if(Object.hasOwn(S,key))S[key]=t.value;
 if(key==='code'){const curr=t.value,turn=++seq;clearTimeout(lookupTimer);S.name='';let f=X.get('mwgx-w-name');if(f)f.value='';if(!curr){return}lookupTimer=setTimeout(async()=>{try{const n=await X.lookup(curr);if(seq!==turn||S.code!==curr)return;if(n){S.name=n;let f=X.get('mwgx-w-name');if(f)f.value=n}}catch{}},170)}
 if(key==='expected'||key==='actual'){let el=X.get('mwgx-w-variance');if(el)el.textContent=String((Number(S.actual)||0)-(Number(S.expected)||0))}
}
function change(t){return input(t)}
function onShopChange(){S.history=[];S.profiles=[];}
X.register('mwgx_warehouse',{view,onShopChange,action,input,change,_test:{imeis,printPages,labelMarkup}});
})();
