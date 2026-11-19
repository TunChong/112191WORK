/* COMPANION-MWG / MWGX extension v3.6.0 — additive only. */
(function(){'use strict';
 const KEYS=['mwgx_print','mwgx_cash','mwgx_warehouse','mwgx_sales'];
 const TITLE={mwgx_print:'Thiết kế & In ấn',mwgx_cash:'Kiểm quỹ',mwgx_warehouse:'Kho & In tem',mwgx_sales:'Bán hàng & Biểu mẫu'};
 const TEMP_LOCKED_KEYS=new Set(KEYS);
 let H={};let lastShop=null;let lastUser=null;
 function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 const get=(id)=>document.getElementById(id);
 const money=x=>new Intl.NumberFormat('vi-VN').format(Math.round(Number(x)||0))+' ₫';
 const num=x=>{let z=String(x??'').trim().replace(/[^0-9-]/g,'');let n=Number(z);return Number.isFinite(n)?Math.trunc(n):0};
 const date=()=>new Date().toISOString().slice(0,10);
 function safeFilename(s){return String(s||'MWG').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,50);}
 function toast(s){H.toast?.(s);}
 function draw(){H.draw?.();}
 function context(){return {shopId:H.shopId?.(),userId:H.userId?.(),shopName:H.shopName?.()||'SHOP',userName:H.userName?.()||'',canManage:!!H.canManage?.(),canTest:!!H.canTest?.()};}
 function isTemporarilyLocked(screen){return TEMP_LOCKED_KEYS.has(screen);}
 function canUse(screen){return !isTemporarilyLocked(screen)||!!H.canTest?.();}
 function lockedView(screen){const title=TITLE[screen]||'Công cụ';return `<section class="mwgx-update-lock"><div class="mwgx-update-lock-icon">⏳</div><h2>${esc(title)}</h2><span class="mwgx-glow-update">Chờ Update</span><p>Công cụ đang được hoàn thiện. Hiện chỉ tài khoản kiểm thử được phép mở.</p></section>`;}
 function needShop(){let c=context();if(!c.shopId||!c.userId)throw Error('Cần đăng nhập và chọn SHOP đang làm việc.');return c;}
 async function api(path,opts={}){needShop();if(typeof H.api!=='function')throw Error('Chưa kết nối hệ thống dữ liệu.');try{return await H.api(path,opts)}catch(e){if(e?.message?.includes('404')||e?.message?.includes('relation')||e?.message?.includes('not found'))throw Error('Chức năng đồng bộ mới chưa được cài lên Supabase. Cần áp dụng migration MWGX trước khi lưu.');throw e}}
 async function lookup(code){let s=String(code||'').replace(/\s/g,'');if(!s)return '';return (await window.MWG_CATALOG?.lookup?.(s))||'';}
 function download(blob,name){if(!blob||!blob.size)throw Error('File xuất rỗng.');const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
 function xlsx(sheets,name){if(!window.MWGX_EXCEL?.buildXlsx)throw Error('Bộ xuất Excel chưa sẵn sàng.');download(window.MWGX_EXCEL.buildXlsx(sheets),name.endsWith('.xlsx')?name:name+'.xlsx')}
 function htmlField(label,id,value='',type='text',attrs=''){return `<label class="mwgx-field"><span>${esc(label)}</span><input id="${esc(id)}" type="${esc(type)}" value="${esc(value)}" ${attrs}></label>`}
 function selectField(label,id,options,selected){return `<label class="mwgx-field"><span>${esc(label)}</span><select id="${esc(id)}">${options.map(([v,t])=>`<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`}
 function button(label,doit,kind=''){return `<button type="button" data-mwgx="${esc(doit)}" class="mwgx-btn ${kind}">${esc(label)}</button>`}
 function heading(t,sub=''){return `<header class="mwgx-heading"><h2>${esc(t)}</h2>${sub?`<p>${esc(sub)}</p>`:''}</header>`}
 function banner(){return `<div class="mwgx-info">Phần mở rộng độc lập · Chỉ dùng dữ liệu của SHOP được cấp quyền · Những mẫu chưa kiểm chứng từ mientay2.pro ghi “CẦN ĐỐI CHIẾU”.</div>`}
 function reportError(e){toast(e?.message||String(e));}
 const handlers={};function register(screen,entry){handlers[screen]=entry}
 function configure(h){H=h||{};const next=H.shopId?.()||null,who=H.userId?.()||null;if((lastShop!==null&&lastShop!==next)||(lastUser!==null&&lastUser!==who))Object.values(handlers).forEach(x=>x.onShopChange?.());lastShop=next;lastUser=who;Object.values(handlers).forEach(x=>x.configure?.(H));}
 function view(screen){if(!canUse(screen))return `<section class="mwgx-root">${banner()}${lockedView(screen)}</section>`;return `<section class="mwgx-root">${banner()}${handlers[screen]?.view?.()||heading('Chưa có module')}</section>`}
 function enter(screen){if(!canUse(screen)){toast('Tool này đang Chờ Update. Chỉ tài khoản kiểm thử được mở.');return false;}handlers[screen]?.enter?.();return true;}
 function leave(screen){handlers[screen]?.leave?.();}
 // events delegated after legacy handlers; target namespace prevents interference with old actions.
 document.addEventListener('click',async e=>{const el=e.target.closest('[data-mwgx]');if(!el)return;e.preventDefault();e.stopPropagation();const screen=el.closest('[data-mwgx-screen]')?.dataset.mwgxScreen;const handler=handlers[screen];if(!handler)return;try{el.disabled=true;await handler.action?.(el.dataset.mwgx,el); }catch(err){reportError(err)}finally{el.disabled=false}},true);
 document.addEventListener('change',e=>{const screen=e.target.closest('[data-mwgx-screen]')?.dataset.mwgxScreen;const h=handlers[screen];if(h?.change)Promise.resolve(h.change(e.target)).catch(reportError)},true);
 document.addEventListener('input',e=>{const screen=e.target.closest('[data-mwgx-screen]')?.dataset.mwgxScreen;const h=handlers[screen];if(h?.input)Promise.resolve(h.input(e.target)).catch(reportError)},true);
 window.MWGX={KEYS,TITLE,TEMP_LOCKED_KEYS,register,configure,view,enter,leave,canUse,isTemporarilyLocked,esc,get,money,num,date,safeFilename,toast,draw,context,needShop,api,lookup,download,xlsx,htmlField,selectField,button,heading};
})();
