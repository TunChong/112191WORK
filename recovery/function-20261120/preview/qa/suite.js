'use strict';
const frame = document.querySelector('#frame');
const results = document.querySelector('#cases');
const status = document.querySelector('#result');
const outcomes = [];
const build = ['0270d99', '67bc22a'];
let files = new Map();
const doc = () => frame.contentDocument;
const win = () => frame.contentWindow;
const q = selector => doc().querySelector(selector);
const must = (condition, message) => { if (!condition) throw new Error(message); };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, label, max = 7000) {
  const end = Date.now() + max;
  while (Date.now() < end) { try { const result = fn(); if (result) return result; } catch {} await pause(35); }
  throw new Error(`Hết thời gian: ${label} ${q('.alert-toast')?.textContent || ''}`);
}
function fill(selector, value, type = 'input') {
  const el = q(selector);
  must(el, selector);
  el.value = value;
  el.dispatchEvent(new (win().Event)(type, { bubbles: true }));
}
async function click(selector) { (await until(() => q(selector), selector)).click(); }
async function load(asset) {
  localStorage.setItem('work112191_session', JSON.stringify({ access_token: 'qa-fictional', refresh_token: 'qa-fictional', expires_at: Date.now()/1000+3600, user:{id:'qa-user'} }));
  localStorage.setItem('work112191_selected_shop','qa-a');
  await new Promise(resolve => { frame.addEventListener('load', resolve, {once:true}); frame.src=`/${asset}/index.html?run=${Date.now()}`; });
  await until(() => q('select#activeShop'), 'ứng dụng và danh sách SHOP');
  files = new Map();
  const createURL = win().URL.createObjectURL.bind(win().URL);
  win().URL.createObjectURL = blob => { const url = createURL(blob); files.set(url, blob); return url; };
  const nativeClick = win().HTMLAnchorElement.prototype.click;
  win().HTMLAnchorElement.prototype.click = function () {
    // Keep real blob bytes for inspection without flooding the browser with downloads.
    if (this.download && files.has(this.href)) return;
    return nativeClick.call(this);
  };
}
function save(name, bytes) {return fetch('/qa/output/' + name, {method:'POST', body: bytes}).then(r => {must(r.ok, 'lưu bằng chứng thử nghiệm');});}
async function output(selector, name, mime) {
  const before = new Set(files.keys());
  await click(selector);
  const blob = await until(() => [...files].find(([url, blob]) => !before.has(url) && blob.type === mime)?.[1], name, 9500);
  await save(name, blob);
  return blob;
}
async function go(screen) {
  await click(`[data-action="navigate"][data-screen="${screen}"]`);
}
async function changeShop(id) { fill('#activeShop', id, 'change'); await until(() => q('#activeShop')?.value===id && localStorage.getItem('work112191_selected_shop')===id,'đổi SHOP'); await pause(220); }
async function step(name, fn) {
  const row = document.createElement('li'); row.textContent = 'Đang thử · ' + name; results.appendChild(row);
  let outcome;
  try { outcome={name, result:'PASS', evidence:await fn() || ''}; }
  catch (err) { outcome={name, result:'FAIL', evidence:err.message}; }
  outcomes.push(outcome);
  row.className = outcome.result.toLowerCase(); row.textContent = `${outcome.result} · ${name}${outcome.result==='FAIL' ? ': ' + outcome.evidence : ''}`;
}
const entry = (index, field) => `[data-entry-tab="sticker"][data-entry-index="${index}"][data-entry-field="${field}"]`;
const textSvg = () => q('#mwgx-p-preview svg')?.textContent || '';
const printTab = mode => click(`[data-mwgx="tab:${mode}"]`);
const stickerSize = size => click(`[data-mwgx="sticker-size:cheap:${size}"]`);
async function openStudio() {
  await load('print'); await go('mwgx_print');
  await until(() => q('[data-mwgx-screen="mwgx_print"]'), 'Print Studio');
}
async function readPng(blob) {
  const view = new DataView(await blob.arrayBuffer()); let ppm=[];
  for (let offset=8;offset+12<=view.byteLength;) {
    const length=view.getUint32(offset); const type=view.getUint32(offset+4);
    if(type===0x70485973)ppm.push([view.getUint32(offset+8),view.getUint32(offset+12),view.getUint8(offset+16)]);
    offset+=12+length;
  }
  return { width:view.getUint32(16), height:view.getUint32(20), ppm, bytes:blob.size };
}
async function quoteData(name='Sản phẩm thử') {
  await until(() => q('#qStore')?.options.length>1, 'danh sách siêu thị');
  if (!q('#qStore').value) fill('#qStore',q('#qStore').options[1].value,'change');
  fill('[data-q-item="0"][data-q-prop="name"]', name);
  fill('[data-q-item="0"][data-q-prop="price"]','3490000');
  const blob=await fetch('/qa/marker.png').then(r=>r.blob());
  const transfer = new (win().DataTransfer)();
  transfer.items.add(new (win().File)([blob], 'fixture.png', {type:'image/png'}));
  const input = q('[data-q-upload="0"]'); input.files = transfer.files;
  input.dispatchEvent(new (win().Event)('change',{ bubbles:true }));
  await until(() => q('#quotePrint img')?.naturalWidth, 'ảnh sản phẩm xem trước');
}
function loadVendor(path) {
  return new Promise((resolve,reject)=>{const script=doc().createElement('script');script.onload=resolve;script.onerror=reject;script.src='/qa/'+path;doc().head.appendChild(script);});
}
async function enterInventory(mode){
 await go('inventory40'); await click('[data-inv50-mode="active"]');
 await until(()=>q(`.act56-choice[data-act56-select="${mode}"]`), 'kiểm kê chủ động');
 await click(`.act56-choice[data-act56-select="${mode}"]`);
}
const invRows = () => [...doc().querySelectorAll('.act56-table tbody tr')].filter(r=>r.cells.length>1);
const invQty = () => invRows()[0]?.cells[2].textContent;
async function submitInvCode(code, name, qty) {
  fill('#act56-code',code);
  if (name) fill('#act56-name',name);
  if (qty) fill('#act56-qty',qty);
  await click('#act56-code-form [type="submit"]');
}
async function run(functionOnly=false) {
  const button=document.querySelector('#run');button.disabled=true;
  status.textContent='Đang chạy trên Chrome…';results.replaceChildren();outcomes.length=0;
  await fetch('/qa/reset',{method:'POST'});
  for (const key of Object.keys(localStorage)) if (/^(mwgx_print_draft_qa-user_|work112191_quote_v1_qa-|companion_mwg_active56_qa-user_)/.test(key)) localStorage.removeItem(key);
  await step('POPUP A4/A5, Sticker 6/2/1 và lệnh In ngay', async()=>{
    await openStudio();
    const viewBox=()=>q('#mwgx-p-preview svg')?.getAttribute('viewBox');
    must(viewBox()==='0 0 210 297','POPUP A4 không đúng khổ');
    await printTab('popup-a5'); must(viewBox()==='0 0 210 148','POPUP A5 không đúng khổ ngang');
    await printTab('sticker'); await stickerSize(6);
    fill(entry(0,'title'),'AAA QA'); fill(entry(5,'title'),'FFF QA');
    for(const size of [2,1,6]) {
      await stickerSize(size);
      must(doc().querySelectorAll('[data-entry-tab="sticker"][data-entry-field="title"]').length===size, `Số tem ${size}`);
    }
    must(q(entry(0,'title')).value==='AAA QA'&&q(entry(5,'title')).value==='FFF QA','Ô 1 và ô 6 phải độc lập');
    must(textSvg().includes('AAA QA')&&textSvg().includes('FFF QA'),'SVG phải có cả hai nội dung');
    const nested=doc().createElement('iframe');doc().body.append(nested);
    const child=nested.contentWindow;const oldOpen=win().open;let htmlPrinted='';
    child.focus=()=>{}; child.print=()=>{htmlPrinted=child.document.documentElement.outerHTML;};win().open=()=>child;
    try { await click('[data-mwgx="print"]'); await until(()=>htmlPrinted, 'ứng dụng gọi print()'); }
    finally { win().open=oldOpen; nested.remove(); }
    must(htmlPrinted.includes('@page{size:210mm 297mm;margin:0}')&&htmlPrinted.includes('AAA QA')&&htmlPrinted.includes('FFF QA'),'HTML in vector thiếu nội dung hoặc khổ giấy');
    await save('print-sticker-vector.html',htmlPrinted);
    return 'A4 dọc, A5 ngang, Sticker giữ dữ liệu riêng. Cửa sổ thử nhận SVG và lệnh print().';
  });
  await step('Sticker PNG có đúng khổ và một mốc 450 DPI',async()=>{
    const blob=await output('[data-mwgx="png450"]','print-sticker-450.png','image/png');
    const meta=await readPng(blob);
    must(meta.width===3720 && meta.height===5262,'Kích thước PNG: '+JSON.stringify(meta));
    must(meta.ppm.length===1 && meta.ppm[0][0]===17717 && meta.ppm[0][1]===17717 && meta.ppm[0][2]===1,'PNG có khai báo độ phân giải sai hoặc trùng: '+JSON.stringify(meta.ppm));
    return meta;
  });
  await step('Nháp Print Studio giữ riêng theo SHOP',async()=>{
    await printTab('popup-a4');
    const title='[data-entry-tab="popup-a4"][data-entry-index="0"][data-entry-field="title"]';
    fill(title,'NHÁP RIÊNG A'); await click('[data-mwgx="draft"]');
    await changeShop('qa-b'); await printTab('popup-a4');
    must(q(title).value==='','Sau đổi SHOP A → B, thấy: '+q(title).value);
    fill(title,'NHÁP RIÊNG B');await click('[data-mwgx="draft"]');
    await changeShop('qa-a');await printTab('popup-a4');
    must(q(title).value==='NHÁP RIÊNG A','Không tải lại đúng nháp SHOP A');
    return 'SHOP B mở với form trống và SHOP A tải lại đúng nháp.';
  });
  await step('Báo giá PNG/PDF trên desktop và màn nhỏ',async()=>{
    await load('stable'); await go('quote40');
    await Promise.all(['html2canvas.min.js','jspdf.umd.min.js'].map(loadVendor));
    await quoteData();
    const png=await output('[data-q-action="capture-quote"]','quote-desktop.png','image/png');
    const meta=await readPng(png);must(meta.bytes>3000&&meta.width>=700,'PNG desktop rỗng');
    const pdf=await output('[data-q-action="export-pdf"]','quote-desktop.pdf','application/pdf');
    must((await pdf.slice(0,5).text())==='%PDF-' && pdf.size>5000,'PDF rỗng hoặc sai định dạng');
    frame.classList.add('mobile');await until(()=>win().innerWidth<=410,'viewport hẹp');
    const mobile=await output('[data-q-action="capture-quote"]','quote-mobile.png','image/png');
    const mobilePdf=await output('[data-q-action="export-pdf"]','quote-mobile.pdf','application/pdf');
    frame.classList.remove('mobile');
    const mobileMeta=await readPng(mobile);
    must(mobileMeta.width>=1800 && mobileMeta.bytes>3000 && mobilePdf.size>5000,'PNG màn nhỏ rộng '+mobileMeta.width+' px');
    return {desktop:meta,mobile:mobileMeta,pdfDesktopBytes:pdf.size,pdfMobileBytes:mobilePdf.size};
  });
  frame.classList.remove('mobile');
  await step('Báo giá gỡ ảnh cũ ngay khi thay link sản phẩm',async()=>{
    await until(()=>q('#quotePrint img')?.naturalWidth,'ảnh cũ hiện đủ');
    fill('[data-q-item="0"][data-q-prop="url"]','https://example.invalid/new-item');
    must(!q('#quotePrint img')&&!q('#qThumb0 img')&&q('[data-q-item="0"][data-q-prop="name"]').value===''&&!q('#quotePrint').textContent.includes('Sản phẩm thử'),'Bảng xem trước vẫn giữ tên và ảnh sản phẩm cũ trong lúc tra cứu');
    await until(()=>q('#quotePrint').textContent.includes('Mặt hàng mới QA')&&q('#quotePrint img')?.naturalWidth,'tên và ảnh sản phẩm mới');
  });
  if (!functionOnly) {
  await step('Kiểm kê IMEI chống trùng, xuất Excel giữ số 0',async()=>{
    await enterInventory('imei');await submitInvCode('QA0001','Sản phẩm kiểm kê QA');
    await until(()=>q('.act56-feedback')?.textContent.includes('Đã chọn'),'chọn mã');
    const imei='001234567890123';
    fill('#act56-imei',imei);await click('#act56-imei-form [type="submit"]');
    await until(()=>invRows().length===1,'đã ghi IMEI');
    must(invQty()===imei,'Mất số 0 đầu của IMEI');
    fill('#act56-imei',imei);await click('#act56-imei-form [type="submit"]');
    await until(()=>q('.act56-feedback')?.textContent.includes('Không cộng trùng'),'thông báo IMEI trùng');
    must(invRows().length===1,'Ghi IMEI trùng thành dòng thứ hai');
    const file=await output('[data-act56-action="export"]','inventory-imei.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    must(file.size>1500,'Tệp Excel rỗng'); return {imei,bytes:file.size};
  });
  await step('Kiểm kê không IMEI tự nhận tên, gộp số lượng và xuất Excel',async()=>{
    await click('.act56-nav [data-act56-select="noImei"]');
    fill('#act56-code','QA0001');
    await until(()=>q('#act56-name')?.value==='Sản phẩm kiểm kê QA','tên mã QA0001');
    await submitInvCode('QA0001',null,2);await until(()=>invQty()==='2','số lượng 2');
    await submitInvCode('QA0001',null,3);await until(()=>invQty()==='5','gộp tổng 5');
    must(invRows().length===1,'Một mã phải có đúng một dòng');
    const file=await output('[data-act56-action="export"]','inventory-count.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return {quantity:5,bytes:file.size};
  });
  await step('Audio mẫu phát, tua và tạm dừng',async()=>{
    await go('audio40'); await click('#audioSamplePlay');
    const media=await until(()=>{const audio=win().AUDIO40._test.getSampleAudio();return audio?.currentTime>0.05?audio:null;},'audio bắt đầu phát');
    must(Number.isFinite(media.duration)&&media.duration>10,'Thời lượng audio không hợp lệ');
    fill('#audioSampleSeek','500');await until(()=>Math.abs(media.currentTime-media.duration/2)<2,'tua 50%');
    await click('#audioSamplePlay');await until(()=>media.paused,'tạm dừng');
    return {seconds:Math.round(media.duration),pausedAt:Math.round(media.currentTime)};
  });
  await step('Chuông thông báo và trạng thái đã đọc',async()=>{
    await until(()=>q('.mwg-notification-count')?.textContent==='2','chuông 2 thông báo');
    await click('.mwg-notification-bell'); await click('[data-action="read-one"][data-id="qa-note-1"]');
    await until(()=>q('.mwg-notification-count')?.textContent==='1','chuông giảm còn 1');
    await click('[data-action="read-all"]'); await until(()=>!q('.mwg-notification-count'),'chuông hết mục mới');
    await load('stable'); must(!q('.mwg-notification-count'),'Đã đọc phải được giữ sau tải lại');
  });
  }
  const pass=outcomes.filter(o=>o.result==='PASS').length;
  const elapsed=new Date().toISOString();
  await fetch('/qa/report',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({build,elapsed,browser:navigator.userAgent,pass,fail:outcomes.length-pass,outcomes})});
  status.textContent=`HOÀN TẤT · ${pass}/${outcomes.length} PASS · ${outcomes.length-pass} FAIL`;
  button.disabled=false;
}
document.querySelector('#run').addEventListener('click', () => run().catch(err=>{status.textContent=err.message;document.querySelector('#run').disabled=false;}));
document.querySelector('#retest').addEventListener('click', () => run(true).catch(err=>{status.textContent=err.message;document.querySelector('#run').disabled=false;}));
document.querySelector('#print').addEventListener('click', () => openStudio().catch(err=>status.textContent=err.message));
