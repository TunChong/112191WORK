/* COMPANION-MWG / KIỂM KÊ 5.0: safe router between original non-IMEI and isolated IMEI tools. */
(function(){
 'use strict';
 let mode=null;let H=null;let changing=false;
 const esc=x=>H?.esc?H.esc(String(x??'')):String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
 const moduleFor=m=>m==='active'?window.INV_ACTIVE56:m==='imei'?window.IMEI50:window.INV40;
 const redraw=()=>H?.draw?.();
 function configure(h){H=h;window.INV40?.configure(h);window.IMEI50?.configure(h);window.INV_ACTIVE56?.configure(h)}
 function chooseView(){return '<div class="inv50-choose">'+
   '<div class="inv50-intro"><div class="inv50-chip">CÔNG CỤ QUẢN LÝ TỒN KHO</div><h2>KIỂM KÊ 5.0</h2><p>Chọn phương thức kiểm kê phù hợp. Kiểm kê từ file tồn kho hoặc chủ động quét từng sản phẩm. Các chế độ độc lập và không làm thay đổi dữ liệu cũ.</p></div>'+
   '<div class="inv50-options">'+
   '<button type="button" class="inv50-card" data-inv50-mode="no-imei"><span class="inv50-art">▥</span><span class="inv50-label">1 / KIỂM KÊ KHÔNG IMEI</span><strong>Mã sản phẩm · Tên sản phẩm · Số lượng</strong><span class="inv50-description">Giữ cách quét và tự cộng lượt hiện tại. Có báo cáo số lượng dư, thiếu và tra cứu sản phẩm nhanh.</span><span class="inv50-go">VÀO KIỂM KÊ KHÔNG IMEI ›</span></button>'+
   '<button type="button" class="inv50-card" data-inv50-mode="imei"><span class="inv50-art">▣</span><span class="inv50-label">2 / KIỂM KÊ CÓ IMEI</span><strong>Mã sản phẩm · Tên sản phẩm · IMEI</strong><span class="inv50-description">Mỗi IMEI là một thiết bị duy nhất, quét lại không cộng trùng. Báo cáo chính xác các IMEI dư và thiếu.</span><span class="inv50-go">VÀO KIỂM KÊ CÓ IMEI ›</span></button>'+
   '<button type="button" class="inv50-card inv50-active-card" data-inv50-mode="active"><span class="inv50-art">⚡</span><span class="inv50-label">3 / KIỂM KÊ CHỦ ĐỘNG</span><strong>Không cần tải file tồn kho</strong><span class="inv50-description">Có IMEI và Không IMEI. Quét mã sản phẩm, tự nhận tên, lưu kết quả và xuất Excel.</span><span class="inv50-go">VÀO KIỂM KÊ CHỦ ĐỘNG ›</span></button>'+
   '</div></div>'}
 function view(){
  if(!mode)return chooseView();
  const nav='<div class="inv50-nav"><button type="button" data-inv50-mode="choose">‹ KIỂM KÊ 5.0</button><span>'+(mode==='active'?'KIỂM KÊ CHỦ ĐỘNG':mode==='imei'?'KIỂM KÊ CÓ IMEI':'KIỂM KÊ KHÔNG IMEI')+'</span><button type="button" data-inv50-mode="'+(mode==='active'?'choose':mode==='imei'?'no-imei':'imei')+'">ĐỔI CHẾ ĐỘ ↔</button></div>';
  const mod=moduleFor(mode);
  return '<div class="inv50">'+nav+(mod?.view?.()||'<p>Chưa tải được công cụ kiểm kê, hãy làm mới trang.</p>')+'</div>';
 }
 async function select(value){
  if(changing||!['choose','no-imei','imei','active'].includes(value))return;
  changing=true;
  try{
   await window.MWG_LOOKUP_CAMERA?.stop?.();
   await moduleFor(mode)?.leave?.();
   mode=value==='choose'?null:value;
   redraw();
   if(mode)await moduleFor(mode)?.load?.();
  }catch(e){H?.toast?.('Kiểm kê 5.0: '+e.message)}
  finally{changing=false;redraw()}
 }
 async function load(){
  // Opening the tool always shows all three entry choices.
  await window.MWG_LOOKUP_CAMERA?.stop?.();await moduleFor(mode)?.leave?.();mode=null;redraw();
 }
 async function leave(){await window.MWG_LOOKUP_CAMERA?.stop?.();await moduleFor(mode)?.leave?.();mode=null}
 async function onShopChange(){
  await window.MWG_LOOKUP_CAMERA?.stop?.();
  await window.INV40?.onShopChange?.();
  await window.IMEI50?.onShopChange?.();
  await window.INV_ACTIVE56?.onShopChange?.();
  mode=null;
 }
 document.addEventListener('click',e=>{const button=e.target.closest?.('[data-inv50-mode]');if(!button)return;e.preventDefault();select(button.dataset.inv50Mode)});
 window.INV50={configure,view,load,leave,onShopChange,isCameraRunning:()=>!!window.MWG_LOOKUP_CAMERA?.isRunning?.()||!!moduleFor(mode)?.isCameraRunning?.()};
})();
