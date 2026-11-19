'use strict';
const frame = document.getElementById('frame');
const cases = document.getElementById('cases');
const statusLine = document.getElementById('result');
const win = () => frame.contentWindow;
const doc = () => frame.contentDocument;
const q = selector => doc()?.querySelector(selector);
const check = (ok, why) => { if (!ok) throw Error(why); };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const request = (endpoint, options) => fetch(`/qa/${endpoint}`, options).then(async res => {
  if (!res.ok) throw Error(`${endpoint} HTTP ${res.status}`);
  return res.json();
});
const post = (endpoint, body) => request(endpoint, {method:'POST', body});
let downloads = new Map();
async function until(poll, label, ms = 8500) {
  const end = Date.now()+ms;
  let toast='';
  while (Date.now()<end) { try { const value=poll(); if(value) return value; toast=q('.alert-toast')?.textContent||toast; } catch {} await wait(45); }
  const current = toast || q('#imei50-last')?.textContent || q('#invSessionSelect')?.textContent;
  throw Error(label+(current?' · '+current.trim().slice(0,130):''));
}
async function click(sel) { (await until(()=>q(sel),sel)).click(); }
function input(sel,value,event='input') {
  const el=q(sel); check(el,sel);el.value=value;
  el.dispatchEvent(new (win().Event)(event,{bubbles:true}));
}
async function open(build,shop='qa-a',collect=false) {
  localStorage.setItem('work112191_session', JSON.stringify({access_token:'fixture-access',refresh_token:'fixture-refresh',expires_at:Date.now()/1000+3600,user:{id:'qa-user'}}));
  localStorage.setItem('work112191_selected_shop',shop);
  await new Promise(resolve=>{
    frame.addEventListener('load',resolve,{once:true});
    frame.src=`/${build}/index.html?acceptance=${Date.now()}`;
  });
  await until(()=>q('#activeShop')?.value===shop,'Tải SHOP thử');
  check(win().WORK_CONFIG.supabaseUrl===location.origin+'/qa-api','API phải là fixture nội bộ');
  if (collect) {
    const makeURL=win().URL.createObjectURL.bind(win().URL);
    const nativeClick=win().HTMLAnchorElement.prototype.click;
    downloads = new Map();
    win().URL.createObjectURL=blob=>{const url=makeURL(blob);downloads.set(url,blob);return url;};
    win().HTMLAnchorElement.prototype.click=function(){if(!(this.download&&downloads.has(this.href))) nativeClick.call(this);};
  }
}
function vendor(name) {
  return new Promise((resolve,reject)=>{
    const js=doc().createElement('script');js.src='/qa/'+name;js.onload=resolve;js.onerror=()=>reject(Error(name));doc().head.append(js);
  });
}
const nav=name=>click(`[data-action="navigate"][data-screen="${name}"]`);
async function switchShop(id){
  input('#activeShop',id,'change');
  await until(()=>q('#activeShop')?.value===id&&localStorage.getItem('work112191_selected_shop')===id,'Đổi SHOP');
  await wait(180);
}
function attach(sel,name,bytes,type){
  const transfer=new (win().DataTransfer)();transfer.items.add(new (win().File)([bytes],name,{type}));
  const el=q(sel);check(el,sel);el.files=transfer.files;el.dispatchEvent(new (win().Event)('change',{bubbles:true}));
}
async function download(selector,name,accept){
  const existing=new Set(downloads.keys());
  await click(selector);
  const blob=await until(()=>[...downloads].find(([key,item])=>!existing.has(key)&&item.size>500&&accept(item))?.[1],`Thiếu file ${name}`,12000);
  await post('acceptance-output/'+name,blob);
  return blob;
}
function item(index,prop){return `[data-q-item="${index}"][data-q-prop="${prop}"]`;}
function quoteStore(){const select=q('#qStore');check(select?.options.length>1,'Có danh mục siêu thị');input('#qStore',select.options[1].value,'change');}
const photo = i=>fetch(`/qa/tile-${i}.png`).then(r=>r.blob());
const quoteRows=()=>[...doc().querySelectorAll('#quotePrint tbody tr')];
async function openQuote(build='stable'){await open(build,'qa-a',true);await nav('quote40');}
async function workbook(file){
  const XLSX=win().XLSX;
  const data=XLSX.read(new Uint8Array(await file.arrayBuffer()),{type:'array'});
  return name=>XLSX.utils.sheet_to_json(data.Sheets[name],{header:1,defval:''});
}
function xlsx(rows){const X=win().XLSX;const book=X.utils.book_new();X.utils.book_append_sheet(book,X.utils.aoa_to_sheet(rows),'QA');return X.write(book,{bookType:'xlsx',type:'array'});}
const sheetMime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
async function inventory(mode){
  await open('stable','qa-a',true);
  await Promise.all(['xlsx.full.min.js','html5-qrcode.min.js'].map(vendor));
  await nav('inventory40');await click(`[data-inv50-mode="${mode}"]`);
  const state=(mode==='imei'?win().IMEI50:win().INV40)._test.state;
  await until(()=>state.shop==='qa-a'&&!state.loading,'Kết thúc đồng bộ danh sách kỳ');
}
const entry=(tab,index,field)=>`[data-entry-tab="${tab}"][data-entry-index="${index}"][data-entry-field="${field}"]`;
const tab=mode=>click(`[data-mwgx="tab:${mode}"]`);
async function printModes(){
  await open('print','qa-a',true);await nav('mwgx_print');
  for(const [mode,field,n,marker] of [['popup-a7','title',4,'QA A7 CUOI'],['sales-slip','contractOwner',10,'QA PHIEU CUOI']]){
    await tab(mode); const svg=q('#mwgx-p-preview svg');check(svg?.getAttribute('viewBox')==='0 0 210 297',`Khổ A4 cho ${mode}`);
    check(doc().querySelectorAll(`[data-entry-tab="${mode}"][data-entry-field="${field}"]`).length===n,`Số mẫu ${mode}`);
    input(entry(mode,0,field),'QA DAU');input(entry(mode,n-1,field),marker);
    check(q('#mwgx-p-preview svg').textContent.includes(marker)&&q('#mwgx-p-preview svg').textContent.includes('QA DAU'),`Dữ liệu riêng ở hai mẫu ${mode}`);
  }
  await tab('golden-a4');check(q('#mwgx-p-preview svg')?.getAttribute('viewBox')==='0 0 210 297','Giờ Vàng A4');
  input('#mwgx-p-goldenTitle','GIO VANG QA');
  check(q('#mwgx-p-preview svg').textContent.includes('GIO VANG QA'),'Giờ Vàng cập nhật tiêu đề');
  await click('[data-mwgx="draft"]');await open('print','qa-a',true);await nav('mwgx_print');
  check(q('#mwgx-p-goldenTitle')?.value==='GIO VANG QA','Giữ nháp sau tải lại');
  await tab('sales-slip');check(q(entry('sales-slip',9,'contractOwner')).value==='QA PHIEU CUOI','Khôi phục riêng ô số 10');
  return {a7PerPage:4,salesSlipPerPage:10,goldenDraftRestored:true};
}
async function fullQuotation(){
  await openQuote();await Promise.all(['html2canvas.min.js','jspdf.umd.min.js'].map(vendor));
  quoteStore();input('#qClient','KHÁCH QA · 6 SẢN PHẨM');input(item(0,'url'),'https://fixture.invalid/san-pham/qa-01');
  await until(()=>q('#qStatus0')?.textContent.includes('nguồn dự phòng')&&q('#qThumb0 img')?.naturalWidth>0,'Ảnh thay thế sau khi ảnh chính lỗi');
  const local=await Promise.all([2,3,4,5,6].map(photo));
  for(let index=1;index<6;index++){
    input(item(index,'name'),`QA ${index+1} · Sản phẩm thử đủ khung`);
    attach(`[data-q-upload="${index}"]`,`qa-${index+1}.png`,local[index-1],'image/png');
    await until(()=>q(`#qThumb${index} img`)?.naturalWidth>0,`Ảnh thứ ${index+1}`);
  }
  for(let index=0;index<6;index++)input(item(index,'price'),35000000+index*1123000);
  check(quoteRows().length===6&&quoteRows().every(r=>r.querySelector('img')?.naturalWidth>0),'Đủ 6 dòng với 6 ảnh');
  check(q('#quotePrint tfoot').textContent.includes('226.845.000'),'Tổng tiền 226.845.000');
  frame.classList.add('mobile');
  await until(()=>win().innerWidth<=404,'Khung ngang 394 px');
  try {
    const png=await download('[data-q-action="capture-quote"]','quote-six-mobile.png',b=>b.type==='image/png');
    const pdf=await download('[data-q-action="export-pdf"]','quote-six-mobile.pdf',b=>b.type==='application/pdf');
    check((await pdf.slice(0,5).text())==='%PDF-','Header PDF');
    const im=await createImageBitmap(png);const dims=[im.width,im.height];im.close();
    check(dims[0]>=1800&&dims[1]>1000,'Khung PNG đầy đủ');
    const s=await request('acceptance-state');
    check(s.quote_images.some(x=>x.endsWith('unavailable.png'))&&s.quote_images.some(x=>x.endsWith('alternative.png')),'Đã gọi cả nguồn chính và nguồn thay thế');
    return {rows:6,png:dims,pdfBytes:pdf.size,mainImage404Recovered:true};
  } finally {frame.classList.remove('mobile');}
}
async function quoteIsolation(build='stable'){
  for(const shop of ['qa-a','qa-b'])localStorage.removeItem('work112191_quote_v1_'+shop);
  await openQuote(build); const fixture=await photo(2);quoteStore();
  input('#qClient','KHÁCH RIÊNG SHOP A');input(item(0,'name'),'Sản phẩm A');
  await switchShop('qa-b');check(q('#qClient')?.value==='','Dữ liệu SHOP A xuất hiện ở SHOP B');
  quoteStore();input('#qClient','KHÁCH RIÊNG SHOP B');input(item(0,'name'),'Sản phẩm B');
  const Native=win().FileReader;
  let readerStarted=false, readerDone=false;
  win().FileReader=class extends Native {
    readAsDataURL(file){readerStarted=true;this.addEventListener('loadend',()=>{readerDone=true;},{once:true});setTimeout(()=>super.readAsDataURL(file),650);}
  };
  try {
    attach('[data-q-upload="0"]','shop-b.png',fixture,'image/png');
    check(readerStarted,'Đã bắt đầu đính kèm ở SHOP B');
    await switchShop('qa-a');check(q('#qClient')?.value==='KHÁCH RIÊNG SHOP A','Nháp SHOP A bị ghi đè');
    await until(()=>readerDone,'Đọc ảnh SHOP B hoàn tất');await wait(140);
    check(!q('#qThumb0 img')&&!q('#quotePrint img'),'Ảnh đính kèm của SHOP B xuất hiện ở SHOP A');
    await switchShop('qa-b');check(q('#qClient')?.value==='KHÁCH RIÊNG SHOP B','Nháp SHOP B không khôi phục');
    return {shopRoundTrip:true,lateUploadIsolated:true};
  } finally {win().FileReader=Native;}
}
async function checkImportAfterRefresh(selector,title){
  const first=q(selector);
  check(first?.checkValidity() && first.querySelector('[type="file"]').files.length===1,'Đã chọn Excel hợp lệ trước khi làm mới');
  win().navigator.serviceWorker.dispatchEvent(new (win().MessageEvent)('message',{data:{type:'work-push-arrived'}}));
  await until(()=>q(selector)&&q(selector)!==first,'Biểu mẫu được dựng lại khi app làm mới dữ liệu');
  const after=q(selector);
  check(after.querySelector('[name="title"]').value===title && after.checkValidity(),'Mất tên kỳ và/hoặc file Excel đã chọn khi app làm mới dữ liệu');
}
async function inventoryCount(){
  await inventory('no-imei');await click('[data-inv-action="tab"][data-tab="stock"]');
  input('#invImportForm [name="title"]','Kỳ tồn QA không IMEI');
  attach('#invImportForm [type="file"]','ton-qa.xlsx',xlsx([['Mã sản phẩm','Tên sản phẩm','Tồn kho'],['QA-SHORT','Thiếu QA',3],['QA-EXTRA','Dư QA',0]]),sheetMime);
  await checkImportAfterRefresh('#invImportForm','Kỳ tồn QA không IMEI');
  await click('#invImportForm [type="submit"]');
  await until(()=>!win().INV40._test.state.importing&&!win().INV40._test.state.loading&&q('#invSessionSelect option:checked')?.textContent==='Kỳ tồn QA không IMEI','Mở kỳ mới từ Excel');
  await click('[data-inv-action="tab"][data-tab="count"]');
  await until(()=>q('#invScanCode'),'Màn hình nhập liệu mở');
  for(const code of ['QA-SHORT','QA-EXTRA']){
    input('#invScanCode',code); await click('#invScanForm [type="submit"]');
    await until(()=>q('#inv-last')?.textContent.includes(code),'Đã ghi '+code);
  }
  await click('[data-inv-action="tab"][data-tab="variance"]');
  const file=await download('[data-inv-action="export"]','inventory-variance.xlsx', b=>b.type===sheetMime||b.type==='application/octet-stream');
  const sheet=(await workbook(file))('CHÊNH LỆCH');
  check(sheet[5]?.[0]==='QA-SHORT'&&sheet[5]?.[4]===2&&sheet[5]?.[6]==='QA-EXTRA'&&sheet[5]?.[10]===1,'Excel phải ghi thiếu 2 và dư 1');
  const native=win().confirm;win().confirm=()=>true;
  try {
    await click('[data-inv-action="close-session"]');await until(()=>q('[data-inv-action="reopen-session"]'),'Kỳ đã khóa');
    await click('[data-inv-action="tab"][data-tab="count"]');
    await until(()=>q('[data-inv-action="tab"][data-tab="count"].selected'),'Mở màn hình nhập liệu kỳ đã khóa');
    check(!q('#invScanForm'),'Kỳ đã khóa vẫn cho đếm');
    await click('[data-inv-action="reopen-session"]');await until(()=>q('#invScanForm'),'Kỳ đã mở lại');
  } finally {win().confirm=native;}
  return {missingQuantity:2,extraQuantity:1,closeAndReopen:true};
}
async function inventoryIMEI(){
  await inventory('imei');await click('[data-imei-action="tab"][data-tab="stock"]');
  const exists='000123456789012', missing='000123456789013', extra='000123456789090';
  input('#imei50-import [name="title"]','Kỳ tồn QA IMEI');
  attach('#imei50-import [type="file"]','imei-qa.xlsx',xlsx([['Mã sản phẩm','Tên sản phẩm','IMEI'],['QA-I1','IMEI thử 1',exists],['QA-I1','IMEI thử 1',missing]]),sheetMime);
  await checkImportAfterRefresh('#imei50-import','Kỳ tồn QA IMEI');
  await click('#imei50-import [type="submit"]');await until(()=>!win().IMEI50._test.state.loading&&!win().IMEI50._test.state.importing&&q('#imei50-scan'),'Tự chuyển từ nhập Excel sang nhập IMEI');
  for(const [serial,cue] of [[exists,/thành công|đã lưu|đã ghi/i],[exists,/không cộng thêm/i],[extra,/thành công|đã lưu|đã ghi/i]]){
    input('#imei50-scan-code',serial);await click('#imei50-scan [type="submit"]');
    await until(()=>cue.test(q('#imei50-last')?.textContent||'')&&q('#imei50-last').textContent.includes(serial),`Ghi IMEI ${serial}`);
  }
  await click('[data-imei-action="tab"][data-tab="variance"]');
  const file=await download('[data-imei-action="export"]','inventory-imei-variance.xlsx',b=>b.type===sheetMime||b.type==='application/octet-stream');
  const sheet=await workbook(file);
  check(sheet('ĐÃ QUÉT IMEI').length===3&&sheet('IMEI THIẾU')[1]?.[2]===missing&&sheet('IMEI DƯ')[1]?.[2]===extra,'Thiếu/dư và chống trùng trong Excel');
  return {uniqueScanned:2,missing,extra};
}
async function activeInventory(){
  await open('stable','qa-a',true);await nav('inventory40');
  const enters=async()=>{await click('[data-inv50-mode="active"]');await click('.act56-choice[data-act56-select="noImei"]');};
  const expected=()=>q('.act56-table tbody tr td:nth-child(3)')?.textContent;
  const add=async qty=>{input('#act56-code','QA-ACTIVE');input('#act56-name','Kiểm kê SHOP A');input('#act56-qty',String(qty));await click('#act56-code-form [type="submit"]');};
  await enters();await add(2);await until(()=>expected()==='2','Lượt đầu 2');await add(3);await until(()=>expected()==='5','Tổng 5');
  await click('[data-act56-action="undo"]');await until(()=>expected()==='2','Hoàn tác giảm 5 → 2');
  await switchShop('qa-b');await enters();check(!expected(),'Dữ liệu dò SHOP A hiện trong SHOP B');
  await open('stable','qa-a',true);await nav('inventory40');await enters();check(expected()==='2','Giữ tổng sau tải lại');
  return {undoQuantity:2,otherShopEmpty:true,reloadRestored:true};
}
async function audioOrder(){
  await open('stable','qa-a',true);await nav('audio40');
  input('#audioScript','từ '.repeat(451));await click('[data-audio-action="contact"]');
  check(!q('#audioOrderForm')&&q('.alert-toast')?.textContent.includes('vượt 3 phút'),'Kịch bản dài phải bị chặn');
  input('#audioScript','Kịch bản nghiệm thu Audio giả. '.repeat(9));await click('[data-audio-action="contact"]');
  input('#audioOrderForm [name="contact"]','qa-line');input('#audioContactPlatform','LINE','change');
  await click('#audioOrderForm [type="submit"]');
  check((await request('acceptance-state')).audio_requests===0,'Không gửi khi chưa xác nhận điều kiện');
  q('#audioOrderForm [name="paymentClaimed"]').click();await click('#audioOrderForm [type="submit"]');
  await until(()=>q('.aud-order')?.textContent.includes('qa-line'),'Hiện lịch sử yêu cầu giả');
  check((await request('acceptance-state')).audio_requests===1&&q('.aud-order').textContent.includes('Chưa xác nhận thanh toán'),'Một yêu cầu vẫn chờ duyệt');
  return {simulatedRequests:1,realPayment:false};
}
async function notificationTask(){
  await open('stable','qa-a',true);await post('acceptance-new-task');
  win().navigator.serviceWorker.dispatchEvent(new (win().MessageEvent)('message',{data:{type:'work-push-arrived',task_id:'qa-priority'}}));
  await until(()=>q('.work-push-popup.urgent')?.textContent.includes('Việc gấp kiểm thử'),'Popup ưu tiên cao trong tab');
  await click('.work-push-open');await until(()=>q('.modal')?.textContent.includes('Việc gấp kiểm thử'),'Mở đúng chi tiết từ thông báo');
  return {priority:'high',visibleTask:'qa-priority',webPushTransport:'simulated browser message'};
}
const scenarios=[
 ['In A7, Giờ Vàng và 10 phiếu, giữ nháp khi tải lại',printModes],
 ['Báo giá 6 sản phẩm PNG/PDF, ảnh chính lỗi và ảnh dự phòng',fullQuotation],
 ['Báo giá tách SHOP kể cả lúc đang đọc ảnh',quoteIsolation],
 ['Kiểm kê 5.0 không IMEI, Excel dư/thiếu và khóa kỳ',inventoryCount],
 ['Kiểm kê 5.0 IMEI, Excel dư/thiếu và chống trùng',inventoryIMEI],
 ['Kiểm kê Chủ Động, hoàn tác và lưu theo SHOP',activeInventory],
 ['Audio, kiểm tra điều kiện và gửi yêu cầu giả',audioOrder],
 ['Thông báo ưu tiên cao mở đúng công việc',notificationTask]
];
async function run(group='all'){
  const buttons=[...document.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
  cases.replaceChildren();statusLine.textContent='Đang nghiệm thu trên Chrome…';
  const results=[];const selected=group==='quote'?scenarios.slice(1,3):group==='inventory'?scenarios.slice(3,5):group==='control'?[[scenarios[2][0],()=>quoteIsolation('stable-before')]]:scenarios;
  await post('acceptance-reset');
  for(const key of Object.keys(localStorage))if(/^(mwgx_print_draft_qa-user_|work112191_quote_v1_qa-|companion_mwg_active56_qa-user_)/.test(key))localStorage.removeItem(key);
  try {
    for(const [name,task] of selected){
      const row=document.createElement('li');row.textContent='Đang thử · '+name;cases.append(row);
      try {const detail=await task();results.push({name,result:'PASS',detail});row.className='pass';row.textContent='PASS · '+name;}
      catch(err){const diagnostic=await request('acceptance-state').catch(()=>({}));const sessionSummary=Object.values(diagnostic.sessions||{});results.push({name,result:'FAIL',error:err.message,sessionSummary});row.className='fail';row.textContent=`FAIL · ${name}: ${err.message}`;}
    }
    const n=results.filter(r=>r.result==='PASS').length;
    await post('acceptance-report',JSON.stringify({browser:navigator.userAgent,runAt:new Date().toISOString(),group,pass:n,fail:results.length-n,results}));
    statusLine.textContent=`HOÀN TẤT · ${n}/${results.length} PASS · ${results.length-n} FAIL`;
  } finally {buttons.forEach(b=>b.disabled=false);}
}
const handle=task=>()=>task().catch(err=>{statusLine.textContent=err.message;});
document.getElementById('run').onclick=handle(()=>run());
document.getElementById('quote-retest').onclick=handle(()=>run('quote'));
document.getElementById('print').onclick=handle(async()=>{await open('print');await nav('mwgx_print');});
document.getElementById('stable').onclick=handle(async()=>{
  await open('stable');
  await Promise.all(['html2canvas.min.js','jspdf.umd.min.js','xlsx.full.min.js','html5-qrcode.min.js'].map(vendor));
});
document.getElementById('inventory-retest').onclick=handle(()=>run('inventory'));
if(new URLSearchParams(location.search).has('control')){
  const control=document.createElement('button');control.textContent='Đối chứng Báo giá gốc';control.onclick=handle(()=>run('control'));document.getElementById('inventory-retest').after(control);
}
