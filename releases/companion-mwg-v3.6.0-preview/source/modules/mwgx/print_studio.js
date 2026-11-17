/* Print Studio — original editable template families, independent of existing quotation tool. */
(function(){'use strict';
const X=window.MWGX, E=window.MWGX_PRINT_ENGINE;
const defs=[
 ['ICT / Thế Giới Di Động',[
  ['Bàn trải nghiệm – Giá giảm','A4','A7','tgd'],['Bàn trải nghiệm – Gạch giá','A4','A7','tgd'],['LED điện thoại – Giá giảm','A4','LED','tgd'],
  ['Phụ kiện – Giảm phần trăm','A4','A7','tgd'],['Laptop HSSV','A4','A4','tgd'],['Giá sốc bàn trải nghiệm','A4','A7','sale'],['Giá sốc LED','A4','LED','sale']]],
 ['Máy lạnh', [['Giá giảm','A5','A6','dmx'],['Gạch giá','A5','A6','dmx'],['Ưu đãi','A5','A6','dmx']]],
 ['Tivi & Tủ lạnh', [['Giá giảm mẫu 1','A4','A5','dmx'],['Gạch giá mẫu 1','A4','A5','dmx'],['Giá giảm mẫu 2','A5','A5','sale'],['Gạch giá mẫu 2','A5','A5','sale']]],
 ['Máy giặt',[['Giá giảm','A5','A6','dmx'],['Gạch giá','A5','A6','dmx']]],
 ['Máy lọc nước',[['Giảm và gạch giá','A5','MLN','dmx'],['Mẫu lớn 1','A4','A4','dmx'],['Mẫu lớn 2','A4','A4','sale']]],
 ['Gia dụng',[['Quạt điều hòa – Gạch giá','A4','A4','dmx'],['Giá giảm','A4','A7','dmx'],['Gạch giá','A4','A7','dmx'],['Giá gốc – Giảm – Còn','A4','A7','sale']]],
 ['Trả chậm',[['LED điện thoại','A4','LED','finance'],['Bàn trải nghiệm','A4','A7','finance'],['Tivi và tủ lạnh','A4','A5','finance'],['Máy giặt','A5','A6','finance'],['Máy lạnh','A5','A6','finance']]],
 ['Dịch vụ',[['Máy lọc nước','A4','A5','service'],['Tivi và tủ lạnh','A4','A5','service'],['Máy giặt','A4','A5','service'],['Máy lạnh','A4','A5','service']]],
 ['Tiêu đề quảng cáo', ['Giá Rẻ Quá','Giờ Vàng Giá Sốc','Giá Sốc Cuối Tuần','Mega Sale','Duy Nhất','Xả Kho','Thu Cũ Đổi Mới','Vượt Trội Dịch Vụ','Máy Hút Ẩm','Quạt Hiệu Giá Rẻ','Theo ngành hàng','Theo thương hiệu'].map(x=>[x,'A4','A4','sale'])]
];
const stickers=['Phần trăm giảm','Gạch giá dưới 1 triệu','Gạch giá trên 1 triệu','Phiếu mua hàng','Giá Rẻ Quá','Giá chéo','Trả chậm 0%','Bảo hiểm rơi vỡ','Bảo hành mở rộng','Bảo hiểm 1 đổi 1','Tặng bảo hành','Sản phẩm đặc biệt ICT','Sản phẩm đặc biệt CE','Trợ giá thu cũ đổi mới'];
const templates=defs.flatMap(([category,arr],k)=>arr.map(([label,paper,finish,style],i)=>({id:`p${k}_${i}`,category,label,paper,finish,style})));
const S={pageIndex:0,tab:'popup',template:templates[0].id,sticker:stickers[0],values:{channel:'DMX',paper:'A4',orientation:'portrait',quantity:1,margin:6,gap:4,cutLines:false,oldPrice:'',salePrice:'',title:'',sku:'',subtitle:'',label:'GIÁ ƯU ĐÃI',count:1,width:74,height:105,sheetCount:'6',program:'',condition:'',validDate:'',shop:'',image:''},history:[],draftSaved:false,loaded:false,busy:false};
let lookupSeq=0;
function activeTemplate(){return templates.find(x=>x.id===S.template)||templates[0]}
function tplOptions(){return templates.map(t=>[t.id,`${t.category} / ${t.label} (${t.paper} → ${t.finish})`])}
function setTemplate(id){const t=templates.find(x=>x.id===id);if(!t)return;S.template=id;S.pageIndex=0;const finish=E.mmPage[t.finish];Object.assign(S.values,{paper:t.paper,width:finish?.[0]||100,height:finish?.[1]||70,label:t.label.toUpperCase(),count:1});if(!finish)S.values.finishWarning='CẦN ĐỐI CHIẾU: kích thước LED/MLN chưa được xác minh, đang dùng kích thước tùy chỉnh.';else S.values.finishWarning='';X.draw()}
function fields(){const v=S.values;return { ...v,heading:v.title||v.productName||'Tên sản phẩm',title:v.title||v.productName||'Tên sản phẩm',count:v.count||1,salePrice:Number(v.salePrice)||0,oldPrice:Number(v.oldPrice)||0};}
function documentData(){const v=fields(),t=activeTemplate();if(S.tab==='sticker')v.count=Math.max(Number(v.count)||1,Number(v.sheetCount)||6);return E.pageData(S.tab==='sticker'?'sticker':t.style,{...v,sheetCount:v.sheetCount||6,margin:v.margin??6,gap:v.gap??4,paper:v.paper},{});}
function inputControls(){const v=S.values, options=[['A4','A4 · 210×297mm'],['A5','A5 · 148×210mm'],['A6','A6 · 105×148mm'],['A7','A7 · 74×105mm']];
 let form=`<div class="mwgx-fields">${X.selectField('Kênh','mwgx-p-channel',[['DMX','Điện Máy Xanh'],['TGDĐ','Thế Giới Di Động']],v.channel)}
 ${X.htmlField('Siêu thị','mwgx-p-shop',v.shop||X.context().shopName)}
 ${S.tab==='popup'?X.selectField('Loại POPUP / Ngành hàng','mwgx-p-template',tplOptions(),S.template):X.selectField('Sticker khuyến mãi','mwgx-p-sticker',stickers.map((x,i)=>[String(i),x]),String(stickers.indexOf(S.sticker)))}
 ${S.tab==='sticker'?X.selectField('Sticker/trang','mwgx-p-sheetCount',[['6','Nhỏ · 6/trang'],['2','Vừa · 2/trang'],['1','Lớn · 1/trang']],String(v.sheetCount||6)):''}
 ${X.htmlField('Mã sản phẩm','mwgx-p-sku',v.sku,'text','autocomplete="off"')}${X.htmlField('Tên sản phẩm','mwgx-p-title',v.title)}
 ${X.htmlField('Giá gốc (VND)','mwgx-p-oldPrice',v.oldPrice,'number','min="0" step="1"')}${X.htmlField('Giá bán (VND)','mwgx-p-salePrice',v.salePrice,'number','min="0" step="1"')}
 ${X.htmlField('Nội dung chương trình','mwgx-p-label',v.label)}${X.htmlField('Điều kiện áp dụng','mwgx-p-subtitle',v.subtitle)}
 ${X.htmlField('Ngày hiệu lực','mwgx-p-validDate',v.validDate,'date')}
 ${X.selectField('Khổ giấy','mwgx-p-paper',options,v.paper)}${X.selectField('Hướng giấy','mwgx-p-orientation',[['portrait','Dọc'],['landscape','Ngang']],v.orientation)}
 ${X.htmlField('Số lượng mẫu','mwgx-p-count',v.count,'number','min="1" max="30"')}
 ${X.htmlField('Lề (mm)','mwgx-p-margin',v.margin,'number','min="0" max="30" step="0.5"')}${X.htmlField('Khoảng cách (mm)','mwgx-p-gap',v.gap,'number','min="0" max="25" step="0.5"')}
 ${S.tab==='popup'?X.htmlField('Chiều rộng thành phẩm (mm)','mwgx-p-width',v.width,'number','min="20" max="300"')+X.htmlField('Chiều cao thành phẩm (mm)','mwgx-p-height',v.height,'number','min="20" max="400"'):''}
 <label class="mwgx-field"><span>Hình sản phẩm (tải từ thiết bị)</span><input id="mwgx-p-file" type="file" accept="image/png,image/jpeg,image/webp"></label>
 <label class="mwgx-check"><input type="checkbox" id="mwgx-p-cutLines" ${v.cutLines?'checked':''}> In đường cắt</label></div>`;
 const old=Number(v.oldPrice),sale=Number(v.salePrice),pct=old>0&&sale>=0&&sale<=old?Math.round((old-sale)*10000/old)/100:null;
 return form+`<div class="mwgx-info">% giảm: <b>${pct===null?'—':pct.toLocaleString('vi-VN')+'%'}</b> · làm tròn 2 chữ số thập phân theo quy tắc half-up cho giá trị không âm.</div>`
}
function preview(){try{const d=documentData();S.pageIndex=Math.max(0,Math.min(S.pageIndex,d.pages-1));return `<div class="mwgx-preview-holder"><div class="mwgx-preview" id="mwgx-p-preview">${E.vectorPage(d,S.pageIndex)}</div><small>${d.w}×${d.h} mm · trang ${S.pageIndex+1}/${d.pages} · ${d.perPage} mẫu tối đa/trang</small><div class="mwgx-actions">${X.button('Trang trước','pagePrev')}${X.button('Trang tiếp','pageNext')}</div></div>`}catch(e){return `<p class="mwgx-error">${X.esc(e.message)}</p>`}}
function historyView(){return `${X.heading('Lịch sử thiết kế','Lịch sử in/xuất được lưu theo SHOP trên Supabase, không lưu mật khẩu.')}<div class="mwgx-actions">${X.button('Tải lại lịch sử','history')}</div><div class="mwgx-table-wrap"><table class="mwgx-table"><thead><tr><th>Thời gian</th><th>Mẫu</th><th>Thao tác</th><th>SHOP</th></tr></thead><tbody>${S.history.map(x=>`<tr><td>${X.esc(new Date(x.created_at).toLocaleString('vi-VN'))}</td><td>${X.esc(x.template_id)}</td><td>${X.esc(x.action)}</td><td>${X.esc(x.shop_id)}</td></tr>`).join('')||'<tr><td colspan="4">Chưa có bản ghi hoặc chưa tải lịch sử.</td></tr>'}</tbody></table></div>`}
function view(){return `<div data-mwgx-screen="mwgx_print">${X.heading('THIẾT KẾ & IN ẤN','Mẫu giá bán, sticker, trả chậm, dịch vụ và mẫu trang trí.')}<div class="mwgx-tabs">${[['popup','POPUP giá bán / dịch vụ'],['sticker','Sticker'],['history','Lịch sử thiết kế']].map(([id,t])=>`<button type="button" class="${S.tab===id?'selected':''}" data-mwgx="tab:${id}">${X.esc(t)}</button>`).join('')}</div>${S.tab==='history'?historyView():`<div class="mwgx-two"><section class="mwgx-card"><h3>Chỉnh mẫu trực tiếp</h3>${inputControls()}${S.values.finishWarning?`<p class="mwgx-warning">${X.esc(S.values.finishWarning)}</p>`:''}<div class="mwgx-actions">${X.button('Lưu nháp','draft')}${X.button('Nhân bản mẫu','duplicate')}${X.button('PNG 300 DPI','png300')}${X.button('PNG 2K','png2k')}${X.button('In / Lưu PDF vector','print','primary')}</div></section><section class="mwgx-card"><h3>Xem trước đúng tỷ lệ</h3>${preview()}<p class="mwgx-small">PDF được tạo qua hộp thoại In của trình duyệt → chọn “Lưu dưới dạng PDF” để bảo toàn font và vector. Ảnh tải từ thiết bị được nhúng vào mẫu.</p></section></div>`}</div>`}
function recalcPreview(){const v=document.getElementById('mwgx-p-preview');if(!v)return;try{const d=documentData();v.innerHTML=E.vectorPage(d,Math.max(0,Math.min(S.pageIndex,d.pages-1)))}catch(err){v.textContent='CẦN SỬA: '+err.message}}
function getDraftKey(){let c=X.context();return 'mwgx_print_draft_'+(c.userId||'u')+'_'+(c.shopId||'s')}
function saveDraft(){localStorage.setItem(getDraftKey(),JSON.stringify({template:S.template,tab:S.tab,values:S.values}));X.toast('Đã lưu nháp trên thiết bị này.');}
function onShopChange(){S.history=[];S.loaded=false;}
function enter(){try{const d=JSON.parse(localStorage.getItem(getDraftKey())||'null');if(d?.values){Object.assign(S.values,d.values);if(templates.some(t=>t.id===d.template))S.template=d.template}}catch{}}
async function saveHistory(action){let c=X.needShop();return X.api('/rest/v1/mwgx_print_jobs',{method:'POST',body:{shop_id:c.shopId,created_by:c.userId,module:'print_studio',template_id:S.tab==='sticker'?S.sticker:S.template,action,payload:{...S.values,image:S.values.image?'[tệp ảnh cục bộ]':null}}});}
async function readHistory(){let c=X.needShop();let res=await X.api('/rest/v1/mwgx_print_jobs?select=id,created_at,template_id,action,shop_id&shop_id=eq.'+encodeURIComponent(c.shopId)+'&order=created_at.desc&limit=100');S.history=Array.isArray(res)?res:[];X.draw()}
async function action(act){if(act==='pagePrev'||act==='pageNext'){const d=documentData();S.pageIndex=Math.max(0,Math.min(d.pages-1,S.pageIndex+(act==='pageNext'?1:-1)));X.draw();return}if(act.startsWith('tab:')){S.tab=act.split(':')[1];S.pageIndex=0;if(S.tab==='sticker'&&Number(S.values.count)<Number(S.values.sheetCount))S.values.count=Number(S.values.sheetCount);X.draw();if(S.tab==='history')await readHistory();return}
 if(act==='draft')return saveDraft();if(act==='duplicate'){saveDraft();S.values.label+=' · Bản sao';X.draw();return}
 if(act==='history')return readHistory();
 const d=documentData();if(act==='print'){E.openPrint(d);await saveHistory('print');return}
 if(act==='png300'||act==='png2k'){const blob=await E.png(d,act==='png2k'?'2k':'300',S.pageIndex);X.download(blob,`MWG_${X.safeFilename(S.tab==='sticker'?S.sticker:S.template)}_TRANG_${S.pageIndex+1}_${Date.now()}.png`);await saveHistory(act);X.toast('Đã xuất PNG.');return}
}
async function change(t){if(t.id==='mwgx-p-file'){
 const file=t.files?.[0];if(!file)return;if(file.size>5000000||!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('Chỉ hỗ trợ PNG/JPG/WebP tối đa 5MB.');
 const reader=new FileReader();const data=await new Promise((res,rej)=>{reader.onload=()=>res(reader.result);reader.onerror=rej;reader.readAsDataURL(file)});
 S.values.image=String(data);recalcPreview();return;
 }
 if(t.id==='mwgx-p-template')return setTemplate(t.value);
 if(t.id==='mwgx-p-sticker'){S.sticker=stickers[Number(t.value)]||stickers[0];S.values.label=S.sticker.toUpperCase();X.draw();return}
 if(t.id==='mwgx-p-paper'||t.id==='mwgx-p-sheetCount'||t.id==='mwgx-p-orientation'){S.values[t.id.split('-').pop()]=t.value;X.draw();return}
}
let lookupTimer;
async function input(t){if(!t.id.startsWith('mwgx-p-')||t.type==='file')return;
 const name=t.id.slice('mwgx-p-'.length);S.values[name]=t.type==='checkbox'?t.checked:t.value;
 if(name==='sku'){const sku=String(t.value).trim(),turn=++lookupSeq;S.values.sku=sku;clearTimeout(lookupTimer);S.values.title='';const target=document.getElementById('mwgx-p-title');if(target)target.value='';if(!sku){recalcPreview();return}
 lookupTimer=setTimeout(async()=>{try{const n=await X.lookup(sku);if(turn!==lookupSeq||S.values.sku!==sku)return;if(n){S.values.title=n;const target=document.getElementById('mwgx-p-title');if(target)target.value=n;recalcPreview()}}catch{}},220);
 }
 recalcPreview();
}
X.register('mwgx_print',{view,enter,onShopChange,action,input,change,_test:{templates,stickers,documentData}});
})();
