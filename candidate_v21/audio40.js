/* Companion-MWG · Audio orders – no external tracking, separate drafts per account and SHOP. */
(function(){
'use strict';
const KEY='companion_mwg_audio_draft_v1';
const empty=()=>({
 shop:'',from:'',to:'',campaign:'',area:'',
 p1:'',p1offer:'',p2:'',p2percent:'',p3:'',p3percent:'',
 specialDay:'',specialOffer:'',lowProducts:'',lowPrice:'',
 customScript:'',manuallyEdited:false
});
let H=null,shopId=null,userId=null,form=empty(),contactOpen=false,
 contactPlatform='ZALO',contactValue='',paid=false,orders=[],loading=false,
 sending=false,fetchSerial=0,error='';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=x=>String(x??'').trim().replace(/\s+/g,' ');
const localKey=()=>KEY+':'+(userId||'anon')+':'+(shopId||'none');
const words=t=>clean(t)?clean(t).split(/\s+/).length:0;
const duration=t=>Math.ceil(words(t)/150*60);
const fmtD=x=>{try{return new Date(x).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}catch{return ''}};
function fillShop(){
 const s=H?.shopName?.()||'';
 if(!form.shop&&s)form.shop=clean(s.replace(/^ĐMX\s+/i,'ĐIỆN MÁY XANH '));
}
function init(){
 const sh=H?.shopId?.()||null,usr=H?.userId?.()||null;
 if(sh===shopId&&usr===userId)return;
 shopId=sh;userId=usr;orders=[];contactOpen=false;contactValue='';paid=false;error='';
 try{form={...empty(),...(JSON.parse(localStorage.getItem(localKey())||'null')||{})}}
 catch{form=empty()}
 fillShop();
}
function persist(){try{localStorage.setItem(localKey(),JSON.stringify(form))}catch(e){console.warn('Audio draft could not be saved',e)}}
const withShop=()=>clean(form.shop)||'ĐIỆN MÁY XANH';
function script(){
 const shop=withShop(),from=clean(form.from)||'…',to=clean(form.to)||'…',
 camp=clean(form.campaign)||'…',area=clean(form.area)||'…',
 p1=clean(form.p1)||'…',o1=clean(form.p1offer)||'…',
 p2=clean(form.p2)||'…',o2=clean(form.p2percent)||'…',
 p3=clean(form.p3)||'…',o3=clean(form.p3percent)||'…',
 special=clean(form.specialDay)||'…',chance=clean(form.specialOffer)||'…',
 low=clean(form.lowProducts)||'…',price=clean(form.lowPrice)||'…';
 return [
 'QUÝ KHÁCH ƠI! Cuối tuần này chưa biết đi đâu, thì MAU MAU ghé lại '+shop+'!',
 '',
 'Từ ngày '+from+' đến ngày '+to+', tưng bừng tổ chức chương trình '+camp+', với hàng loạt ưu đãi GIẢM GIÁ CỰC SỐC dành cho quý khách hàng tại khu vực '+area+'!',
 '',
 'Nhanh chân đến ngay '+shop+', để rinh về những sản phẩm chính hãng với mức giá SIÊU HỜI!',
 '',
 p1+', đồng loạt '+o1+'!',
 '',
 p2+', GIẢM ĐẾN '+o2+'%!',
 '',
 p3+', GIẢM ĐẾN '+o3+'%!',
 '',
 'CHƯA HẾT ĐÂU!',
 '',
 'Đặc biệt, tại '+shop+', duy nhất ngày '+special+', quý khách hàng có cơ hội '+chance+'!',
 '',
 'VÀ ĐẶC BIỆT HƠN NỮA!',
 '',
 'Hàng ngàn sản phẩm '+low+', với mức giá CỰC SỐC, CHỈ TỪ '+price+' ngàn ĐỒNG!',
 '',
 'KÍNH MỜI QUÝ ANH CHỊ!',
 '',
 'Từ ngày '+from+' đến ngày '+to+', cùng đến '+shop+' để tham quan, trải nghiệm và mua sắm!',
 '',
 'Đừng bỏ lỡ cơ hội sở hữu những sản phẩm chính hãng với mức giá ưu đãi SIÊU HỜI!',
 '',
 shop.toUpperCase()+'!',
 '',
 'HÂN HẠNH ĐƯỢC ĐÓN TIẾP VÀ PHỤC VỤ QUÝ KHÁCH!'
 ].join('\n');
}
const activeScript=()=>form.manuallyEdited?form.customScript:script();
function configure(cfg){H=cfg}
function onShopChange(){shopId=null;userId=null;init()}
function field(label,key,placeholder='',required=false,cl=''){
 return '<label class="aud-field '+cl+'"><span>'+esc(label)+(required?' <b>*</b>':'')+'</span>'+
 '<input data-audio-field="'+key+'" maxlength="450" value="'+esc(form[key])+'" placeholder="'+esc(placeholder)+'" '+(required?'required':'')+' autocomplete="off"></label>';
}
function sample(){
 return '<section class="panel aud-card aud-sample"><div class="aud-row"><div><h2>🎙️ AUDIO – MC LOA SIÊU THỊ</h2>'+
 '<p>Giọng đọc miền Nam · Quảng cáo & thông báo siêu thị</p></div>'+
 '<span class="aud-chip">NGHE MẪU</span></div>'+
 '<audio controls preload="metadata" playsinline src="./audio-demo.mp3" aria-label="Nghe bản Audio mẫu"></audio>'+
 '<p class="aud-hint">Đây là bản Audio mẫu do quản trị viên cung cấp, không phải bản Audio tự tạo sau khi gửi.</p></section>';
}
function formView(){
 return '<div class="aud-dark"><section class="aud-section"><h3>🏬 1. Chi nhánh & Thời gian Diễn ra</h3>'+
 field('Điện Máy Xanh chi nhánh / địa chỉ','shop','Ví dụ: ĐIỆN MÁY XANH 102 LÊ VĂN KHƯƠNG',true,'aud-full')+
 '<p class="aud-hint">Tên chi nhánh sẽ tự điền vào các vị trí tương ứng trong kịch bản.</p>'+
 '<div class="aud-grid">'+field('Từ ngày','from','mùng 6',true)+field('Đến ngày','to','11 tháng 11',true)+'</div>'+
 field('Tên chương trình khuyến mãi','campaign','ĐẠI TIỆC TRI ÂN SĂN DEAL SIÊU KHỦNG',true,'aud-full')+
 field('Khu vực khách hàng','area','Thủ Đức và TP. Hồ Chí Minh',true,'aud-full')+'</section>'+
 '<section class="aud-section"><h3>％ 2. Ba nhóm sản phẩm giảm giá sốc</h3>'+
 '<div class="aud-offer"><strong>MỤC 1 · ĐỒNG LOẠT ƯU ĐÃI</strong><div class="aud-grid">'+field('Tên sản phẩm 1','p1','Tủ lạnh, Máy giặt, Tivi AI màn hình lớn')+field('Đồng loạt (ưu đãi/quà)','p1offer','giảm sốc tặng quà gia dụng xịn')+'</div></div>'+
 '<div class="aud-offer"><strong>MỤC 2 · GIẢM ĐẾN %</strong><div class="aud-grid">'+field('Tên sản phẩm 2','p2','Gia dụng thông minh, Nồi cơm, Nồi chiên không dầu')+field('Giảm đến (%)','p2percent','50')+'</div></div>'+
 '<div class="aud-offer"><strong>MỤC 3 · GIẢM ĐẾN %</strong><div class="aud-grid">'+field('Tên sản phẩm 3','p3','Điện thoại, Laptop, Phụ kiện chính hãng')+field('Giảm đến (%)','p3percent','45')+'</div></div></section>'+
 '<section class="aud-section"><h3>🎁 3. Cơ hội đặc biệt & Deal chỉ từ</h3>'+
 '<div class="aud-grid">'+field('Duy nhất ngày','specialDay','Chủ Nhật tuần này')+
 field('Cơ hội đặc biệt','specialOffer','tham gia bốc thăm trúng thưởng')+'</div>'+
 '<div class="aud-grid">'+field('Hàng ngàn sản phẩm','lowProducts','đồ dùng tiện ích nhà bếp, chảo chống dính')+
 field('CHỈ TỪ (ngàn đồng)','lowPrice','39')+'</div></section></div>';
}
function payment(){
 return '<section class="panel aud-payment"><div><h2>NHẬN LÀM AUDIO – ĐỒNG GIÁ 49K</h2>'+
 '<p><b>Thời lượng tối đa:</b> 3 phút/bản Audio. Nhận qua Zalo hoặc LINE trong ngày sau khi Admin xác nhận yêu cầu.</p>'+
 '<p>Chuyển khoản 49.000đ bằng mã VietQR bên cạnh, sau đó bấm <b>Gửi yêu cầu Audio</b>.</p>'+
 '<p class="aud-hint">Thanh toán được Admin kiểm tra thủ công; ứng dụng không xác nhận giao dịch ngân hàng tự động.</p></div>'+
 '<img src="./vietqr-payment.png" alt="Mã VietQR thanh toán 49.000 đồng cho dịch vụ Audio" loading="lazy"></section>';
}
function message(){
 const txt=activeScript(),n=words(txt),sec=duration(txt);
 return '<section class="panel aud-script-panel"><div class="aud-row"><div><h2>📣 KỊCH BẢN HOÀN CHỈNH</h2>'+
 '<p>Thay đổi form bên trái thì kịch bản cập nhật ngay, hoặc sửa trực tiếp tại đây.</p></div>'+
 '<button type="button" class="aud-secondary" data-audio-action="reset-script">Lấy lại kịch bản từ form</button></div>'+
 '<textarea id="audioScript" class="aud-script" maxlength="3000" aria-label="Sửa kịch bản Audio trực tiếp">'+esc(txt)+'</textarea>'+
 '<div class="aud-stats"><span id="audioEstimate">'+n+' từ · Ước tính '+Math.floor(sec/60)+' phút '+String(sec%60).padStart(2,'0')+' giây</span>'+
 '<strong id="audioLimit" class="'+(n>450?'aud-danger':'')+'">'+(n>450?'Vượt giới hạn 3 phút':'Giới hạn tối đa 3 phút · ~450 từ')+'</strong></div>'+
 '<div class="aud-buttons"><button type="button" class="aud-secondary" data-audio-action="copy-script">Sao chép kịch bản</button>'+
 '<button type="button" class="btn" data-audio-action="contact">GỬI YÊU CẦU AUDIO · 49.000đ</button></div></section>';
}
function checkout(){
 if(!contactOpen)return '';
 return '<div class="aud-backdrop"><div class="aud-modal" role="dialog" aria-modal="true" aria-labelledby="audContactTitle">'+
 '<div class="aud-row"><h2 id="audContactTitle">Thông tin nhận Audio</h2><button type="button" class="aud-secondary" data-audio-action="cancel-contact">Đóng</button></div>'+
 '<p>Anh/chị vui lòng để lại Zalo hoặc LINE ID để nhận bản Audio sau khi Admin hoàn tất.</p>'+
 '<form id="audioOrderForm">'+
 '<label class="aud-field">Phương thức nhận<select name="platform" id="audioContactPlatform"><option value="ZALO" '+(contactPlatform==='ZALO'?'selected':'')+'>Zalo</option><option value="LINE" '+(contactPlatform==='LINE'?'selected':'')+'>LINE ID</option></select></label>'+
 '<label class="aud-field">Số Zalo / LINE ID <b>*</b><input name="contact" minlength="3" maxlength="120" required autocomplete="off" value="'+esc(contactValue)+'" placeholder="Nhập số Zalo hoặc LINE ID"></label>'+
 '<label class="aud-check"><input type="checkbox" name="paymentClaimed" '+(paid?'checked':'')+' required><span>Tôi đã chuyển khoản <b>49.000đ</b> qua mã QR và hiểu rằng Admin sẽ kiểm tra giao dịch trước khi thực hiện Audio.</span></label>'+
 '<p class="aud-hint">Admin sẽ nhận thông báo trong ứng dụng. Đây là yêu cầu thực hiện dịch vụ, không phải file Audio được tạo tự động.</p>'+
 '<button class="btn" type="submit" '+(sending?'disabled':'')+'>'+(sending?'Đang gửi…':'GỬI CHO ADMIN')+'</button></form>'+
 (error?'<p class="aud-error">'+esc(error)+'</p>':'')+'</div></div>';
}
const statusText={new:'Chờ Admin kiểm tra',processing:'Đang thực hiện',delivered:'Đã gửi Audio',cancelled:'Đã hủy'};
function orderHistory(){
 if(!orders.length)return '<section class="panel"><h2>Yêu cầu của tôi</h2><p class="aud-hint">Chưa có yêu cầu Audio nào.</p></section>';
 return '<section class="panel"><div class="aud-row"><h2>Yêu cầu của tôi</h2><button class="aud-secondary" data-audio-action="reload">Làm mới</button></div>'+
 orders.slice(0,20).map(o=>'<article class="aud-order"><div><strong>'+esc(o.shop_label)+'</strong><p>'+esc(fmtD(o.created_at))+' · '+esc(o.contact_platform)+' '+esc(o.contact_value)+'</p>'+
 '<small>'+esc(statusText[o.status]||o.status)+' · '+(o.payment_verified?'Đã xác nhận thanh toán':'Chưa xác nhận thanh toán')+'</small>'+
 (o.delivery_url?'<p><a href="'+esc(o.delivery_url)+'" target="_blank" rel="noopener noreferrer">Mở Audio đã hoàn tất</a></p>':'')+'</div></article>').join('')+'</section>';
}
function adminPanel(){
 if(!H?.admin?.())return '';
 const pending=orders.filter(o=>o.status==='new'||o.status==='processing');
 return '<section class="panel aud-admin"><div class="aud-row"><div><h2>QUẢN TRỊ · YÊU CẦU AUDIO</h2><p>Chỉ hiện đơn đang chờ/đang xử lý từ tất cả SHOP. Đơn đã hủy hoặc hoàn tất tự ẩn.</p></div>'+
 '<button type="button" class="aud-secondary" data-audio-action="reload">Làm mới</button></div>'+
 (!pending.length?'<p class="aud-hint">Không có yêu cầu Audio đang chờ xử lý.</p>':pending.slice(0,100).map(o=>{
  const hasPaid=o.payment_verified,status=o.status;
  return '<article class="aud-order"><div class="aud-row"><div><strong>'+esc(o.shop_label)+'</strong>'+
   '<p>'+esc(fmtD(o.created_at))+' · '+esc(o.contact_platform)+': <b>'+esc(o.contact_value)+'</b></p>'+
   '<small>'+esc(statusText[o.status]||o.status)+' · '+(hasPaid?'ĐÃ XÁC NHẬN 49K':'CHỜ XÁC NHẬN 49K')+'</small></div>'+
   '<span class="aud-chip">'+esc(o.price_vnd.toLocaleString('vi-VN'))+'đ</span></div>'+
   '<details><summary>Xem kịch bản nhận làm</summary><pre>'+esc(o.request_script)+'</pre></details>'+
   '<div class="aud-admin-fields"><label>Link bản Audio hoàn thành (nếu có)<input data-audio-admin-url="'+esc(o.id)+'" placeholder="https://..." value="'+esc(o.delivery_url||'')+'"></label>'+
   '<label>Ghi chú Admin<input data-audio-admin-note="'+esc(o.id)+'" maxlength="1200" value="'+esc(o.admin_note||'')+'" placeholder="Đã gửi qua Zalo / LINE"></label></div>'+
   '<div class="aud-buttons">'+(!hasPaid?'<button class="aud-secondary" data-audio-action="order" data-order-id="'+esc(o.id)+'" data-order-status="verify_payment">Xác nhận đã nhận 49K</button>':'')+
   (status!=='delivered'&&status!=='cancelled'?'<button class="btn" data-audio-action="order" data-order-id="'+esc(o.id)+'" data-order-status="delivered" '+(!hasPaid?'disabled title="Xác nhận thanh toán trước"':'')+'>Đã gửi Audio</button>':'')+
   (status!=='cancelled'&&status!=='delivered'?'<button class="aud-secondary" data-audio-action="order" data-order-id="'+esc(o.id)+'" data-order-status="cancelled">Hủy đơn</button>':'')+
   '</div></article>';
 }).join(''))+'</section>';
}
function view(){
 init();
 return '<div class="audio40">'+sample()+'<div class="aud-hero">'+
 '<div><h2>ĐẶT AUDIO QUẢNG CÁO CHO SIÊU THỊ</h2><p>Điền form → sửa kịch bản → chuyển khoản 49K → gửi Zalo/LINE → Admin xử lý</p></div>'+
 '<strong>49.000đ / Audio · tối đa 3 phút</strong></div><div class="aud-layout">'+
 '<div>'+formView()+'</div><div>'+message()+payment()+'</div></div>'+
 (H?.admin?.()?adminPanel():orderHistory())+checkout()+'</div>';
}
function refreshText(){
 const t=activeScript(),box=document.getElementById('audioScript');
 if(box&&document.activeElement!==box)box.value=t;
 const count=words(t),sec=duration(t),estimated=document.getElementById('audioEstimate'),limit=document.getElementById('audioLimit');
 if(estimated)estimated.textContent=count+' từ · Ước tính '+Math.floor(sec/60)+' phút '+String(sec%60).padStart(2,'0')+' giây';
 if(limit){limit.textContent=count>450?'Vượt giới hạn 3 phút':'Giới hạn tối đa 3 phút · ~450 từ';limit.classList.toggle('aud-danger',count>450)}
}
async function load(){
 init();const serial=++fetchSerial;
 if(!H?.userId?.())return;
 loading=true;try{
  const q=H.admin()?'/rest/v1/companion_audio_orders?select=*&status=in.(new,processing)&order=created_at.desc&limit=100':
   '/rest/v1/companion_audio_orders?requester_id=eq.'+encodeURIComponent(userId)+'&select=*&order=created_at.desc&limit=40';
  const list=await H.api(q);
  if(serial===fetchSerial){orders=Array.isArray(list)?list:[];if(H?.current?.()==='audio40')H.draw()}
 }catch(e){console.warn('Audio order load error',e)}
 finally{loading=false}
}
async function placeOrder(formNode){
 if(sending)return;
 contactPlatform=String(new FormData(formNode).get('platform')||'ZALO');
 contactValue=clean(new FormData(formNode).get('contact'));
 paid=Boolean(new FormData(formNode).get('paymentClaimed'));
 const t=activeScript();
 if(words(t)>450||duration(t)>180)throw Error('Audio tối đa 3 phút. Hãy rút gọn kịch bản.');
 if(t.length<100)throw Error('Nội dung Audio cần ít nhất 100 ký tự.');
 if(!/^(ZALO|LINE)$/.test(contactPlatform)||contactValue.length<3)throw Error('Vui lòng ghi số Zalo hoặc LINE ID.');
 if(!paid)throw Error('Anh/chị vui lòng xác nhận đã chuyển khoản.');
 sending=true;error='';
 try{
  const id=await H.api('/rest/v1/rpc/companion_submit_audio',{method:'POST',body:{
   p_shop:shopId,p_script:t,p_details:form,p_contact_platform:contactPlatform,
   p_contact_value:contactValue,p_claimed_paid:true
  }});
  if(!id)throw Error('Máy chủ chưa xác nhận yêu cầu');
  contactOpen=false;paid=false;contactValue='';
  H.toast('Đã gửi yêu cầu Audio. Admin sẽ kiểm tra thanh toán và liên hệ qua Zalo/LINE.');
  await load();
  H.refreshNotifications?.();
 }catch(e){error=e.message||'Không gửi được yêu cầu';H.toast(error)}
 finally{sending=false;if(contactOpen&&H?.current?.()==='audio40')H.draw()}
}
async function updateOrder(b){
 const orderId=b.dataset.orderId,action=b.dataset.orderStatus;
 if(!H?.admin?.())throw Error('Không có quyền xử lý đơn Audio');
 const url=document.querySelector('[data-audio-admin-url="'+orderId+'"]')?.value||'';
 const note=document.querySelector('[data-audio-admin-note="'+orderId+'"]')?.value||'';
 const res=await H.api('/rest/v1/rpc/companion_manage_audio',{method:'POST',
  body:{p_order:orderId,p_action:action,p_delivery_url:url,p_admin_note:note}});
 if(!res?.ok)throw Error('Chưa cập nhật đơn Audio');
 const updated=orders.find(o=>o.id===orderId);
 if(updated)updated.status=String(res.status||updated.status);
 if((action==='delivered'||action==='cancelled')&&H?.current?.()==='audio40')H.draw();
 H.toast(action==='verify_payment'?'Đã xác nhận nhận 49.000đ.':action==='delivered'?'Đã đánh dấu Audio đã gửi.':'Đã cập nhật trạng thái đơn.');
 await load();H.refreshNotifications?.();
}
document.addEventListener('input',e=>{
 if(!e.target.closest('.audio40'))return;
 const key=e.target.dataset.audioField;
 if(key&&Object.prototype.hasOwnProperty.call(form,key)){
  form[key]=e.target.value;
  form.manuallyEdited=false;
  persist();refreshText();
 }else if(e.target.id==='audioScript'){
  form.customScript=e.target.value;form.manuallyEdited=true;persist();refreshText();
 }
 if(e.target.name==='contact')contactValue=e.target.value;
});
document.addEventListener('change',e=>{
 if(!e.target.closest('.audio40'))return;
 if(e.target.id==='audioContactPlatform')contactPlatform=e.target.value;
 if(e.target.name==='paymentClaimed')paid=e.target.checked;
});
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-audio-action]');if(!b)return;
 e.preventDefault();
 try{
  switch(b.dataset.audioAction){
   case 'reset-script':form.manuallyEdited=false;form.customScript='';persist();H.draw();break;
   case 'copy-script':await navigator.clipboard.writeText(activeScript());H.toast('Đã sao chép kịch bản Audio.');break;
   case 'contact':
    if(words(activeScript())>450||duration(activeScript())>180)throw Error('Kịch bản vượt 3 phút. Rút gọn trước khi gửi.');
    contactOpen=true;error='';H.draw();break;
   case 'cancel-contact':contactOpen=false;error='';H.draw();break;
   case 'reload':await load();break;
   case 'order':b.disabled=true;try{await updateOrder(b)}finally{if(b.isConnected)b.disabled=false}break;
  }
 }catch(err){H?.toast?.(err.message||'Lỗi Audio')}
});
document.addEventListener('submit',e=>{
 if(e.target.id!=='audioOrderForm')return;
 e.preventDefault();placeOrder(e.target).catch(x=>{error=x.message||'Lỗi';H.toast(error);H.draw()});
});
window.AUDIO40={configure,view,load,onShopChange,_test:{empty,script,words,duration},getStatus:()=>({orders:orders.length,loading})};
})();