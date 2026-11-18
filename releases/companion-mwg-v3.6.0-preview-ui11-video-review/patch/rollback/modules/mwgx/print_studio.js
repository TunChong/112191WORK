/* MWGX Print Studio: isolated paper-size templates, rendered as printable vector SVG. */
(function(){'use strict';
const X=window.MWGX,E=window.MWGX_PRINT_ENGINE;
const tabList=[
 ['popup-a4','POPUP A4'],['popup-a5','POPUP A5'],['golden-a4','GIỜ VÀNG GIÁ SỐC'],
 ['popup-a7','POPUP A7'],['sticker','Sticker'],['sales-slip','Phiếu bán hàng'],['history','Lịch sử']
];
const titlePresets=['GIÁ RẺ QUÁ','GIỜ VÀNG GIÁ SỐC','GIÁ SỐC CUỐI TUẦN','MEGA SALE','DUY NHẤT','MÁY HÚT ẨM','QUẠT HIỆU GIÁ RẺ','VƯỢT TRỘI DỊCH VỤ','THU CŨ ĐỔI MỚI','XẢ KHO','HÀNG: SONY','HÀNG: DAIKIN','HÀNG: SAMSUNG','HÀNG: AQUA','HÀNG: HISENSE','HÀNG: TOSHIBA','HÀNG: TCL','HÀNG: HITACHI','HÀNG: PANASONIC','HÀNG: LG'];
const stickerTypes=[
 {id:'percent',name:'Phần trăm giảm',title:'GIẢM SỐC',note:'THỜI GIAN ÁP DỤNG'},
 {id:'cut-under1',name:'Gạch giá',title:'GIẢM SỐC',note:'SẢN PHẨM DƯỚI 1 TRIỆU'},
 {id:'cut-over1',name:'Gạch giá',title:'GIẢM SỐC',note:'SẢN PHẨM TRÊN 1 TRIỆU'},
 {id:'voucher',name:'Phiếu mua hàng',title:'ƯU ĐÃI',note:'TẶNG PHIẾU MUA HÀNG'},
 {id:'cheap',name:'Giá rẻ quá',title:'GIÁ RẺ QUÁ',note:'VERY GOOD!'}
];
const S={tab:'popup-a4',titlePreset:'GIÁ RẺ QUÁ',goldenPreset:'GIÁ SỐC',values:{bannerTitle:'GIÁ RẺ QUÁ',goldenTitle:'GIÁ SỐC',productCategory:'MÁY LỌC NƯỚC',title:'',oldPrice:'',salePrice:'',discountPercent:'',installmentText:'+ TRẢ GÓP 0% LÃI SUẤT',subtitle:'',validDate:'',stickerType:'percent',stickerNote:'THỜI GIAN ÁP DỤNG',sheetCount:'6',slipTitle:'THẺ THANH TOÁN'},stickerNotes:{},items:{},history:[]};
const defaults=Object.fromEntries(stickerTypes.map(t=>[t.id,t.note]));
function esc(v){return X.esc(v??'')}
function field(key,label,value,type='text',attrs=''){return `<label class="mwgx-field"><span>${esc(label)}</span><input id="mwgx-p-${esc(key)}" type="${esc(type)}" value="${esc(value)}" ${attrs}></label>`}
function area(key,label,value,attrs=''){return `<label class="mwgx-field"><span>${esc(label)}</span><textarea id="mwgx-p-${esc(key)}" ${attrs}>${esc(value)}</textarea></label>`}
function select(key,label,options,selected){return `<label class="mwgx-field"><span>${esc(label)}</span><select id="mwgx-p-${esc(key)}">${options.map(([v,t])=>`<option value="${esc(v)}" ${String(v)===String(selected)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`}
function entryField(tab,index,key,label,value,type='text',attrs=''){return `<label class="mwgx-field"><span>${esc(label)}</span><input data-entry-tab="${esc(tab)}" data-entry-index="${index}" data-entry-field="${esc(key)}" type="${esc(type)}" value="${esc(value)}" ${attrs}></label>`}
function entryDefaults(tab){
 if(tab==='popup-a4'||tab==='popup-a7')return{bannerTitle:S.values.bannerTitle||'GIÁ RẺ QUÁ',title:'',oldPrice:'',salePrice:'',installmentText:S.values.installmentText,validDate:S.values.validDate};
 if(tab==='sticker'){const type=stickerTypes.find(t=>t.id===S.values.stickerType)||stickerTypes[0];return{bannerTitle:S.values.bannerTitle||type.title,title:'',discountPercent:'',oldPrice:'',salePrice:'',subtitle:S.values.subtitle||stickerNote(type)}}
 if(tab==='sales-slip')return{slipTitle:S.values.slipTitle||'THẺ THANH TOÁN',department:'',contractOwner:'',contractNo:'',amount:'',fromDate:'',toDate:''};
 return{};
}
function entryData(tab,index){return{...entryDefaults(tab),...(S.items[tab]?.[index]||{})}}
function setEntry(tab,index,key,value){const rows=[...(S.items[tab]||[])];rows[index]={...entryData(tab,index),[key]:value};S.items[tab]=rows}
function entryList(tab,count){return Array.from({length:count},(_,i)=>entryData(tab,i))}
function syncBanner(oldValue,newValue){for(const tab of ['popup-a4','popup-a7','sticker'])for(const row of S.items[tab]||[])if(!row.bannerTitle||row.bannerTitle===oldValue)row.bannerTitle=newValue}
function entryEditor(tab,index,label){
 const d=entryData(tab,index);let fields='';
 if(tab==='popup-a4'||tab==='popup-a7')fields=entryField(tab,index,'bannerTitle','Tiêu đề trên mẫu',d.bannerTitle,'text','maxlength="70"')+entryField(tab,index,'title','Tên sản phẩm',d.title)+entryField(tab,index,'oldPrice','Giá gạch (VNĐ)',d.oldPrice,'number','min="0" step="1"')+entryField(tab,index,'salePrice','Giá bán (VNĐ)',d.salePrice,'number','min="0" step="1"')+entryField(tab,index,'installmentText','Dòng trả góp',d.installmentText)+entryField(tab,index,'validDate','Ngày in',d.validDate,'date');
 else if(tab==='sticker')fields=entryField(tab,index,'bannerTitle','Tiêu đề sticker',d.bannerTitle,'text','maxlength="70"')+entryField(tab,index,'title','Tên sản phẩm',d.title)+entryField(tab,index,'discountPercent','Phần trăm giảm',d.discountPercent,'number','min="0" max="100" step="1"')+entryField(tab,index,'oldPrice','Giá gốc (VNĐ)',d.oldPrice,'number','min="0" step="1"')+entryField(tab,index,'salePrice','Giá bán / giá trị phiếu (VNĐ)',d.salePrice,'number','min="0" step="1"')+entryField(tab,index,'subtitle','Ghi chú in trên sticker',d.subtitle,'text','maxlength="50"');
 else if(tab==='sales-slip')fields=entryField(tab,index,'slipTitle','Tiêu đề phiếu',d.slipTitle,'text','maxlength="40"')+entryField(tab,index,'department','Ngành hàng',d.department)+entryField(tab,index,'contractOwner','Chủ hợp đồng',d.contractOwner)+entryField(tab,index,'contractNo','Số hợp đồng',d.contractNo)+entryField(tab,index,'amount','Số tiền đóng (VNĐ)',d.amount,'number','min="0" step="1"')+entryField(tab,index,'fromDate','Ngày bắt đầu',d.fromDate,'date')+entryField(tab,index,'toDate','Ngày kết thúc',d.toDate,'date');
 const opened=index===0?' open':'';
 return `<details class="mwgx-entry-card"${opened}><summary>${esc(label)} <span>· Dữ liệu riêng</span></summary><div class="mwgx-entry-grid">${fields}</div></details>`;
}
function entryEditors(tab,count,label){return `<div class="mwgx-entry-list">${Array.from({length:count},(_,i)=>entryEditor(tab,i,`${label} ${i+1}`)).join('')}</div>`}
function currentTab(){return tabList.find(([id])=>id===S.tab)?.[0]||'popup-a4'}
function titleControl(){
 const selected=titlePresets.includes(S.titlePreset)?S.titlePreset:'__custom__';
 return `<div class="mwgx-title-control">${select('titlePreset','Chọn tiêu đề',[...titlePresets.map(t=>[t,t]),['__custom__','Tùy chỉnh tiêu đề']],selected)}${field('bannerTitle','Tiêu đề đang in',S.values.bannerTitle,'text','maxlength="70"')}</div>`;
}
function goldenTitleControl(){
 const selected=['GIÁ SỐC','GIẢM SỐC','ƯU ĐÃI'].includes(S.goldenPreset)?S.goldenPreset:'__custom__';
 return `<div class="mwgx-title-control">${select('goldenPreset','Chọn tiêu đề', [['GIÁ SỐC','GIÁ SỐC'],['GIẢM SỐC','GIẢM SỐC'],['ƯU ĐÃI','ƯU ĐÃI'],['__custom__','Tùy chỉnh tiêu đề']],selected)}${field('goldenTitle','Tiêu đề đang in',S.values.goldenTitle,'text','maxlength="40"')}</div>`;
}
function popupFields(){
 if(S.tab==='popup-a4')return `${titleControl()}<p class="mwgx-template-note">Hai POPUP có ô nhập độc lập. Mở từng mẫu để nhập riêng.</p>${entryEditors('popup-a4',2,'POPUP')}`;
 return `${titleControl()}<div class="mwgx-print-form-grid">${field('title','Tên sản phẩm',S.values.title)}${field('oldPrice','Giá gạch (VNĐ)',S.values.oldPrice,'number','min="0" step="1"')}${field('salePrice','Giá bán (VNĐ)',S.values.salePrice,'number','min="0" step="1"')}${field('installmentText','Dòng trả góp',S.values.installmentText)}${field('validDate','Ngày in',S.values.validDate,'date')}</div><p class="mwgx-template-note">POPUP A5 là một mẫu ngang vừa khổ giấy A5.</p>`
}
function goldenFields(){return `<div class="mwgx-print-form-grid">${field('productCategory','Ngành hàng / dòng đầu',S.values.productCategory)}${goldenTitleControl()}${field('title','Tên sản phẩm',S.values.title)}${field('discountPercent','Phần trăm giảm',S.values.discountPercent,'number','min="0" max="100" step="1"')}${field('oldPrice','Giá gốc (VNĐ)',S.values.oldPrice,'number','min="0" step="1"')}${field('salePrice','Giá bán (VNĐ)',S.values.salePrice,'number','min="0" step="1"')}${area('subtitle','Khuyến mãi / lưu ý',S.values.subtitle,'maxlength="100"')}</div><p class="mwgx-template-note">Mẫu GIỜ VÀNG GIÁ SỐC được căn vừa một tờ A4 dọc.</p>`}
function popupA7Fields(){return `${titleControl()}<p class="mwgx-template-note">Mỗi POPUP A7 nhập riêng tiêu đề, sản phẩm, giá, trả góp và ngày in.</p>${entryEditors('popup-a7',4,'POPUP A7')}`}
function stickerNote(type){return S.stickerNotes[type.id]??type.note}
function stickerCard(type){
 const selected=S.values.stickerType===type.id;
 const note=stickerNote(type);
 const thumb=E.markSVG(2,2,70,80,'sticker',{sheetCount:'6',stickerType:type.id,bannerTitle:type.title,title:'TÊN SẢN PHẨM',oldPrice:0,salePrice:0,discountPercent:'00',subtitle:note});
 return `<article class="mwgx-sticker-card ${selected?'selected':''}"><div class="mwgx-sticker-art"><svg viewBox="0 0 74 84" role="img" aria-label="${esc(type.name)}">${thumb}</svg></div><div class="mwgx-sticker-card-body"><strong>${esc(type.name.toLocaleUpperCase('vi-VN'))}</strong><label><span>Ghi chú</span><input data-sticker-note="${esc(type.id)}" value="${esc(note)}" maxlength="50" aria-label="Ghi chú ${esc(type.name)}"></label><button type="button" class="mwgx-size-choice small" data-mwgx="sticker-size:${esc(type.id)}:6">SIZE NHỎ · 6 STICKER</button><button type="button" class="mwgx-size-choice medium" data-mwgx="sticker-size:${esc(type.id)}:2">SIZE VỪA · 2 STICKER</button><button type="button" class="mwgx-size-choice large" data-mwgx="sticker-size:${esc(type.id)}:1">SIZE LỚN · 1 STICKER</button></div></article>`;
}
function stickerLibrary(){return `<section class="mwgx-sticker-library"><div class="mwgx-sticker-library-head"><div><h4>CHỌN FORM STICKER</h4><p>Chọn ghi chú và cỡ sticker. Khổ in mặc định là A4.</p></div><span>A4 · IN 6, 2 HOẶC 1 TEM / TỜ</span></div><div class="mwgx-sticker-grid">${stickerTypes.map(stickerCard).join('')}</div></section>`}
function stickerFields(){
 const current=S.values.sheetCount||'6';
 return `${titleControl()}<div class="mwgx-print-form-grid">${select('sheetCount','Số sticker trên mỗi tờ A4',[['6','Nhỏ · 6 sticker'],['2','Vừa · 2 sticker'],['1','Lớn · 1 sticker']],current)}</div><p class="mwgx-template-note">Mỗi sticker có ô nhập riêng. Chọn kích thước rồi mở từng sticker để sửa nội dung.</p>${entryEditors('sticker',Number(current),'STICKER')}`;
}
function salesFields(){return `<div class="mwgx-print-slip-note"><b>Khổ in: A4 dọc</b><span>10 phiếu / tờ · mỗi phiếu nhập riêng · 2 cột × 5 hàng.</span></div>${entryEditors('sales-slip',10,'PHIẾU')}`}
function documentData(){
 const f={...S.values};let kind,paper='A4',orientation='portrait';
 if(S.tab==='popup-a4'){kind='popup-a4';f.bannerTitle=f.bannerTitle||'GIÁ RẺ QUÁ';f.items=entryList('popup-a4',2)}
 else if(S.tab==='popup-a5'){kind='popup-a5';paper='A5';orientation='landscape';f.bannerTitle=f.bannerTitle||'GIÁ RẺ QUÁ'}
 else if(S.tab==='golden-a4'){kind='golden-a4'}
 else if(S.tab==='popup-a7'){kind='popup-a7';f.items=entryList('popup-a7',4)}
 else if(S.tab==='sticker'){kind='sticker';f.sheetCount=String(S.values.sheetCount||6);f.stickerType=S.values.stickerType||'percent';f.subtitle=S.values.subtitle||stickerNote(stickerTypes.find(t=>t.id===f.stickerType)||stickerTypes[0]);f.items=entryList('sticker',Number(f.sheetCount))}
 else if(S.tab==='sales-slip'){kind='sales-slip';f.count=10;f.items=entryList('sales-slip',10)}
 else throw Error('Chọn một mẫu in trước.');
 f.paper=paper;f.orientation=orientation;
 return E.pageData(kind,f);
}
function preview(){
 try{const d=documentData();return `<div class="mwgx-print-preview-wrap"><div class="mwgx-print-preview" id="mwgx-p-preview">${E.vectorPage(d,0)}</div><div class="mwgx-print-preview-meta"><span>${d.paper}${S.tab==='popup-a5'?' ngang':''}</span><span>${d.w} × ${d.h} mm</span><span>${d.count} mẫu · ${d.perPage}/tờ</span></div></div>`}
 catch(e){return `<div class="mwgx-error">${esc(e.message)}</div>`}
}
function fieldsForTab(){
 if(S.tab==='popup-a4'||S.tab==='popup-a5')return popupFields();
 if(S.tab==='golden-a4')return goldenFields();
 if(S.tab==='popup-a7')return popupA7Fields();
 if(S.tab==='sticker')return stickerFields();
 if(S.tab==='sales-slip')return salesFields();
 return '';
}
function tabContent(){
 if(S.tab==='history')return historyView();
 const isSticker=S.tab==='sticker',name=tabList.find(([id])=>id===S.tab)?.[1]||'POPUP A4';
 return `${isSticker?stickerLibrary():''}<div class="mwgx-print-workspace"><section class="mwgx-print-controls"><div class="mwgx-control-heading"><span>THÔNG TIN MẪU</span><small>Thay đổi được cập nhật ngay lên bản xem trước</small></div>${fieldsForTab()}<div class="mwgx-print-actions"><button type="button" class="mwgx-print-now" data-mwgx="print"><span aria-hidden="true">🖨</span> In ngay</button>${X.button('Lưu nháp trên máy','draft')}${X.button('Tải PNG 450 DPI','png450')}</div><p class="mwgx-print-help">In trực tiếp từ trình duyệt sẽ giữ nét vector. PNG xuất ở 450 DPI.</p></section><section class="mwgx-print-preview-panel"><div class="mwgx-preview-heading"><div><span class="mwgx-eyebrow">BẢN IN · ${esc(name)}</span><h4>Xem trước theo đúng khổ giấy</h4></div><span class="mwgx-live-dot">Cập nhật trực tiếp</span></div>${preview()}</section></div>`;
}
function historyView(){return `<section class="mwgx-card"><div class="mwgx-card-head"><div><h3>Lịch sử in trên thiết bị</h3><p>Chỉ lưu các lần bấm in trên trình duyệt này; không ghi sang Supabase.</p></div><button class="mwgx-btn" type="button" data-mwgx="clear-history">Xóa lịch sử cục bộ</button></div>${S.history.length?`<div class="mwgx-table-wrap"><table class="mwgx-table"><thead><tr><th>Thời gian</th><th>Mẫu</th><th>Khổ giấy</th></tr></thead><tbody>${S.history.map(h=>`<tr><td>${esc(new Date(h.at).toLocaleString('vi-VN'))}</td><td>${esc(h.name)}</td><td>${esc(h.paper)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="mwgx-empty">Chưa có lần in nào được ghi trên thiết bị này.</div>'}</section>`}
function view(){return `<div data-mwgx-screen="mwgx_print" class="mwgx-print-studio">${X.heading('POPUP · STICKER · PHIẾU BÁN HÀNG','Mẫu in đúng khổ giấy, xem trước theo tỷ lệ và in trực tiếp từ trình duyệt.') }<div class="mwgx-tabs mwgx-print-tabs">${tabList.map(([id,label])=>`<button type="button" class="${S.tab===id?'selected':''}" data-mwgx="tab:${id}">${esc(label)}</button>`).join('')}</div>${tabContent()}</div>`}
function recalcPreview(){const el=document.getElementById('mwgx-p-preview');if(!el)return;try{el.innerHTML=E.vectorPage(documentData(),0)}catch(e){el.innerHTML=`<div class="mwgx-error">${esc(e.message)}</div>`}}
function draftKey(){const c=X.context();return'mwgx_print_draft_'+(c.userId||'u')+'_'+(c.shopId||'s')+'_v2'}
function saveDraft(){localStorage.setItem(draftKey(),JSON.stringify({tab:S.tab,values:S.values,stickerNotes:S.stickerNotes,items:S.items,titlePreset:S.titlePreset,goldenPreset:S.goldenPreset}));X.toast('Đã lưu bản nháp trên thiết bị này.');}
function loadHistory(){try{const d=JSON.parse(localStorage.getItem('mwgx_print_history_v2')||'[]');S.history=Array.isArray(d)?d:[]}catch{S.history=[]}}
function addHistory(){const d=documentData(),h={at:new Date().toISOString(),name:tabList.find(([id])=>id===S.tab)?.[1]||S.tab,paper:d.paper};S.history.unshift(h);S.history=S.history.slice(0,100);localStorage.setItem('mwgx_print_history_v2',JSON.stringify(S.history));}
function enter(){try{const d=JSON.parse(localStorage.getItem(draftKey())||'null');if(d?.values)Object.assign(S.values,d.values);if(d?.stickerNotes)S.stickerNotes={...S.stickerNotes,...d.stickerNotes};if(d?.items)S.items={...S.items,...d.items};if(d?.titlePreset)S.titlePreset=d.titlePreset;if(d?.goldenPreset)S.goldenPreset=d.goldenPreset;if(tabList.some(([id])=>id===d?.tab))S.tab=d.tab}catch{}loadHistory()}
function onShopChange(){loadHistory()}
async function action(act){
 if(act.startsWith('tab:')){S.tab=act.slice(4);X.draw();return}
 if(act.startsWith('sticker-size:')){const[,type,size]=act.split(':');const def=stickerTypes.find(t=>t.id===type);if(!def)return;const previous=stickerTypes.find(t=>t.id===S.values.stickerType)||stickerTypes[0];for(const row of S.items.sticker||[]){if(row.bannerTitle===previous.title)row.bannerTitle=def.title;if(row.subtitle===previous.note)row.subtitle=stickerNote(def)}S.tab='sticker';S.values.stickerType=type;S.values.sheetCount=size;S.values.bannerTitle=def.title;S.titlePreset=titlePresets.includes(def.title)?def.title:'__custom__';S.values.subtitle=stickerNote(def);X.draw();return}
 if(act==='draft')return saveDraft();
 if(act==='clear-history'){localStorage.removeItem('mwgx_print_history_v2');S.history=[];X.draw();return}
 if(act==='print'){const d=documentData();E.openPrint(d);addHistory();X.toast('Đã mở hộp thoại in. Chọn máy in và bấm In để xác nhận.');return}
 if(act==='png450'){const d=documentData(),blob=await E.png(d,'450',0);X.download(blob,`MWG_${X.safeFilename(tabList.find(([id])=>id===S.tab)?.[1]||S.tab)}_450DPI_${Date.now()}.png`);return}
}
function input(t){
 const entryTab=t.dataset?.entryTab;if(entryTab){setEntry(entryTab,Number(t.dataset.entryIndex),t.dataset.entryField,t.value);recalcPreview();return}
 const noteId=t.dataset?.stickerNote;if(noteId){const previous=S.stickerNotes[noteId]??defaults[noteId];S.stickerNotes[noteId]=t.value;if(S.values.stickerType===noteId){S.values.subtitle=t.value;for(const row of S.items.sticker||[])if(row.subtitle===previous)row.subtitle=t.value}recalcPreview();return}
 if(!t.id?.startsWith('mwgx-p-')||t.type==='file')return;
 const key=t.id.slice('mwgx-p-'.length);if(key==='titlePreset'||key==='goldenPreset'||key==='sheetCount')return;
 const previous=S.values[key];S.values[key]=t.value;if(key==='bannerTitle'){syncBanner(previous,t.value);S.titlePreset='__custom__';const s=document.getElementById('mwgx-p-titlePreset');if(s)s.value='__custom__'}if(key==='goldenTitle'){S.goldenPreset='__custom__';const s=document.getElementById('mwgx-p-goldenPreset');if(s)s.value='__custom__'}
 if(key==='subtitle'&&S.tab==='sticker')S.stickerNotes[S.values.stickerType]=t.value;
 recalcPreview();
}
function change(t){
 const entryTab=t.dataset?.entryTab;if(entryTab){setEntry(entryTab,Number(t.dataset.entryIndex),t.dataset.entryField,t.value);recalcPreview();return}
 if(!t.id?.startsWith('mwgx-p-'))return;
 const key=t.id.slice('mwgx-p-'.length),value=t.value;
 if(key==='titlePreset'){S.titlePreset=value;if(value!=='__custom__'){const old=S.values.bannerTitle;S.values.bannerTitle=value;syncBanner(old,value)}X.draw();return}
 if(key==='goldenPreset'){S.goldenPreset=value;if(value!=='__custom__')S.values.goldenTitle=value;X.draw();return}
 if(key==='sheetCount'){S.values.sheetCount=value;X.draw();return}
 S.values[key]=value;recalcPreview();
}
loadHistory();
X.register('mwgx_print',{view,enter,onShopChange,action,input,change,_test:{documentData,stickerTypes,tabList}});
})();
