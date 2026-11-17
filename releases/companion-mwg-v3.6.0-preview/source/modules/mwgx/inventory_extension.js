/* Read-only extended inventory reports. Existing inventory flow never intercepted. */
(function(){'use strict';const X=window.MWGX;
const S={kind:'noImei',sessions:[],sessionId:'',stock:[],counts:[],expected:[],scans:[],busy:false,loaded:false,lastError:''};
const sessionTable=()=>S.kind==='imei'?'inventory_imei_sessions':'inventory_sessions';
async function fetchAll(table,filters,limit=10000){const c=X.needShop();const out=[];for(let offset=0;offset<limit;offset+=500){const data=await X.api(`/rest/v1/${table}?select=*&shop_id=eq.${encodeURIComponent(c.shopId)}&${filters||''}&limit=500&offset=${offset}`);if(!Array.isArray(data))throw Error('API không trả dữ liệu danh sách');out.push(...data);if(data.length<500)return out;}throw Error('Giới hạn 10.000 dòng/bảng. Vui lòng tách kỳ kiểm kê hoặc mở rộng phân trang.');}
async function refreshSessions(){S.busy=true;try{S.sessions=await fetchAll(sessionTable(),'order=created_at.desc');S.sessionId=S.sessions.find(x=>x.id===S.sessionId)?.id||S.sessions[0]?.id||'';S.loaded=false;S.lastError=''}catch(e){S.lastError=e.message;throw e}finally{S.busy=false;X.draw()}}
async function refreshData(){if(!S.sessionId)throw Error('Chưa chọn kỳ kiểm kê');S.busy=true;try{const p='session_id=eq.'+encodeURIComponent(S.sessionId);if(S.kind==='imei'){
 const [e,s]=await Promise.all([fetchAll('inventory_imei_expected',p),fetchAll('inventory_imei_scans',p)]);S.expected=e;S.scans=s;
 }else{
 const [stock,counts]=await Promise.all([fetchAll('inventory_stock',p),fetchAll('inventory_counts',p)]);S.stock=stock;S.counts=counts;
 }S.loaded=true;S.lastError='';}catch(e){S.loaded=false;S.lastError=e.message;throw e}finally{S.busy=false;X.draw()}}
function report(){if(S.kind==='imei'){
 const wanted=new Map(S.expected.map(v=>[String(v.imei),v]));const found=new Map(S.scans.map(v=>[String(v.imei),v]));
 const missing=S.expected.filter(v=>!found.has(String(v.imei))),extra=S.scans.filter(v=>!wanted.has(String(v.imei)));
 const matched=S.expected.filter(v=>found.has(String(v.imei)));
 const grouped=new Map();for(const row of [...S.expected,...S.scans]){const code=String(row.product_code||'').trim()||'CHƯA RÕ';let g=grouped.get(code);if(!g){g={code,name:row.product_name||'',expected:0,counted:0,missing:0,extra:0};grouped.set(code,g)}}
 for(const r of S.expected){const g=grouped.get(r.product_code||'CHƯA RÕ');g.expected++;if(!found.has(String(r.imei)))g.missing++}
 for(const r of S.scans){const g=grouped.get(r.product_code||'CHƯA RÕ');g.counted++;if(!wanted.has(String(r.imei)))g.extra++}
 return {kind:'imei',detail:[...grouped.values()],missing,extra,matched,notChecked:missing,duplicates:[],unexpected:extra,totals:{models:grouped.size,expected:S.expected.length,counted:S.scans.length,matched:matched.length,missing:missing.length,extra:extra.length,duplicate:0}};
 }
 const byCode=new Map();for(const r of S.stock){const k=String(r.product_code||'');if(!k)continue;let x=byCode.get(k)||{code:k,name:r.product_name||'',expected:0,counted:0};x.expected+=Number(r.expected_qty)||0;byCode.set(k,x)}
 for(const r of S.counts){const k=String(r.product_code||'');if(!k)continue;let x=byCode.get(k)||{code:k,name:r.product_name||'',expected:0,counted:0};x.counted+=Number(r.counted_qty)||0;byCode.set(k,x)}
 const detail=[...byCode.values()].map(x=>({...x,variance:x.counted-x.expected}));const missing=detail.filter(x=>x.variance<0),extra=detail.filter(x=>x.variance>0),matched=detail.filter(x=>x.variance===0),notChecked=detail.filter(x=>x.expected>0&&x.counted===0);
 return {kind:'noImei',detail,missing,extra,matched,notChecked,duplicates:[],unexpected:[],totals:{models:detail.length,expected:detail.reduce((a,x)=>a+x.expected,0),counted:detail.reduce((a,x)=>a+x.counted,0),matched:matched.length,missing:missing.reduce((a,x)=>a-x.variance,0),extra:extra.reduce((a,x)=>a+x.variance,0),duplicate:0}};
}
function toRows(arr){const head=S.kind==='imei'?['Mã sản phẩm','Tên sản phẩm','IMEI']:['Mã sản phẩm','Tên sản phẩm','Dự kiến','Đã kiểm','Chênh lệch'];return [head,...arr.map(x=>S.kind==='imei'?[String(x.product_code||''),String(x.product_name||''),String(x.imei||'')]:[x.code,x.name,x.expected,x.counted,x.variance])];}
function exportReport(){if(!S.loaded)throw Error('Phải tải dữ liệu kỳ kiểm kê trước');const r=report(),t=r.totals;const summary=[['Chỉ tiêu','Số lượng'],['Sản phẩm',t.models],['Số dự kiến',t.expected],['Số đã kiểm',t.counted],['Sản phẩm/IMEI khớp',t.matched],['Số lượng thiếu',t.missing],['Số lượng dư',t.extra],['IMEI trùng phát hiện',t.duplicate]];
 const sheets=[{title:'TỔNG HỢP',rows:summary,numeric:[1]},{title:'CHI TIẾT',rows:S.kind==='imei'?[['Mã sản phẩm','Tên sản phẩm','Dự kiến','Đã kiểm','Thiếu','Dư'],...r.detail.map(x=>[x.code,x.name,x.expected,x.counted,x.missing,x.extra])]:toRows(r.detail),numeric:S.kind==='imei'?[2,3,4,5]:[2,3,4]},
 {title:'THIẾU',rows:toRows(r.missing),numeric:S.kind==='imei'?[]:[2,3,4]}, {title:'DƯ',rows:toRows(r.extra),numeric:S.kind==='imei'?[]:[2,3,4]}, {title:'CHƯA KIỂM',rows:toRows(r.notChecked),numeric:S.kind==='imei'?[]:[2,3,4]}];
 if(S.kind==='imei')sheets.push({title:'IMEI BẤT THƯỜNG',rows:toRows(r.unexpected)});
 const c=X.context();X.xlsx(sheets,`BAO_CAO_KIEM_KE_MO_RONG_${X.safeFilename(c.shopName)}_${X.date()}.xlsx`);
}
function view(){const r=S.loaded?report():null;return `<div data-mwgx-screen="mwgx_inventory">${X.heading('BÁO CÁO KIỂM KÊ MỞ RỘNG','Chỉ đọc dữ liệu các kỳ kiểm kê đã có. Quy trình quét → +1 → dừng → QUÉT TIẾP giữ nguyên.')}<section class="mwgx-card"><div class="mwgx-fields">${X.selectField('Loại kiểm kê','mwgx-i-kind',[['noImei','Không IMEI'],['imei','Có IMEI']],S.kind)}${X.selectField('Kỳ kiểm kê','mwgx-i-session',S.sessions.map(s=>[s.id,s.title])||[],S.sessionId)}</div><div class="mwgx-actions">${X.button('Tải danh sách kỳ','sessions')}${X.button('Xem kết quả kỳ','load','primary')}${X.button('Xuất Excel 5–6 sheet','excel')}</div>${S.lastError?`<p class="mwgx-error">${X.esc(S.lastError)}</p>`:''}${S.busy?'<p>Đang đọc dữ liệu từ Supabase...</p>':''}</section>${r?`<section class="mwgx-card"><h3>Thống kê tổng hợp</h3><div class="mwgx-metrics">${Object.entries(r.totals).map(([k,v])=>`<div><small>${X.esc(({models:'Sản phẩm',expected:'Dự kiến',counted:'Đã kiểm',matched:'Khớp',missing:'Thiếu',extra:'Dư',duplicate:'Trùng'}[k]||k))}</small><strong>${Number(v).toLocaleString('vi-VN')}</strong></div>`).join('')}</div><p>Chi tiết: ${r.detail.length} mã · Thiếu: ${r.missing.length} dòng · Dư: ${r.extra.length} dòng · Chưa kiểm: ${r.notChecked.length} dòng.</p></section>`:''}<div class="mwgx-info">Không thay đổi các form Excel đang có. Đây là lựa chọn xuất báo cáo mở rộng. Các dữ liệu IMEI trùng đã bị chặn khi ghi từ hệ thống nên số trùng lưu trữ có thể là 0; muốn thống kê lượt quét trùng cần bổ sung nhật ký quét từ hệ thống trong tương lai.</div></div>`}
async function action(a){if(a==='sessions')return refreshSessions();if(a==='load')return refreshData();if(a==='excel')return exportReport()}
function change(t){if(t.id==='mwgx-i-kind'){S.kind=t.value==='imei'?'imei':'noImei';S.loaded=false;S.sessions=[];S.sessionId='';X.draw();return}if(t.id==='mwgx-i-session'){S.sessionId=t.value;S.loaded=false;X.draw()}}
function onShopChange(){S.sessions=[];S.sessionId='';S.loaded=false;S.stock=[];S.counts=[];S.expected=[];S.scans=[];}
X.register('mwgx_inventory',{view,onShopChange,action,change,_test:{report,toRows}});
})();
