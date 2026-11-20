'use strict';
const frame = id => document.getElementById(id);
const left = frame('left'), right = frame('right');
function load(node, actor, direct=true){
  node.src='/app/?fixture='+actor+(direct?'&tool=qlst-checklist':'');
}
function hiddenActor(actor){
  const node=document.createElement('iframe');
  node.title=actor;
  document.getElementById('extra').append(node);
  load(node,actor);
  return node;
}
document.querySelectorAll('[data-pane]').forEach(select=>select.addEventListener('change',()=>load(frame(select.dataset.pane),select.value)));
load(left,'manager');
load(right,'lead');

const find = (node, query) => node.contentDocument?.querySelector(query);
const check = (condition, message) => { if(!condition) throw Error(message); };
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function until(test,message,timeout=4000){
  const start=performance.now();
  while(performance.now()-start < timeout){
    const value=test();
    if(value) return value;
    await sleep(50);
  }
  throw Error(message);
}
function click(node, select){
  const element=find(node,select);
  check(element&&!element.disabled,'Không bấm được '+select);
  element.click();
}
function change(node, element, value){
  element.value=value;
  element.dispatchEvent(new node.contentWindow.Event('change',{bubbles:true}));
}
const card = (node,title) => [...(node.contentDocument?.querySelectorAll('.qlst-item')??[])].find(item=>item.querySelector('h3').textContent===title);
const live = node => find(node,'[data-qlst="connection"]')?.textContent==='Đồng bộ trực tiếp';
const pop = (node,title) => find(node,'.qlst-popup:not([hidden])')?.textContent.includes(title);
const tab = (node,id) => click(node,'[data-qlst-action="tab"][data-id="'+id+'"]');
const appTime = ms => new Intl.DateTimeFormat('sv-SE',{
  timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'
}).format(ms).replace(' ','T');
async function create(node,title,minutes,reminder=0){
  click(node,'[data-qlst-action="add"]');
  const form=find(node,'[data-qlst-form]');
  form.elements.title.value=title;
  form.elements.deadline.value=appTime(Date.now()+minutes*60_000);
  form.elements.reminder.value=reminder;
  form.requestSubmit();
  await until(()=>!find(node,'[data-qlst-form]'),'Form chưa lưu: '+title);
}
async function readRows(actor, shop){
  const auth={Authorization:'Bearer '+fixture.sessions[actor]};
  return (await fetch('/preview-db/rest/v1/qlst_checklist_items?shop_id=eq.'+shop,{headers:auth})).json();
}
async function browserTests(){
  const suffix=String(Date.now()).slice(-5);
  const title='Đối chiếu trưng bày · '+suffix;
  const overdue='Kiểm tra tồn kho trễ · '+suffix;
  const reminder='Báo cáo sắp đến hạn · '+suffix;
  const rowQuery = '[data-qlst-action="finish"]';
  const results=[];
  const report=document.getElementById('report');
  const outcomes=document.getElementById('outcomes');
  outcomes.replaceChildren();
  const staff=hiddenActor('staff'), other=hiddenActor('other'), multi=hiddenActor('multi');
  async function run(name, action){
    report.textContent='Đang thử · '+name;
    let obj={name};
    try { obj.detail=await action(); obj.result='PASS'; }
    catch(error){ obj.result='FAIL';obj.error=error.message; }
    results.push(obj);
    const item=document.createElement('li');item.className=obj.result.toLowerCase();
    item.textContent=obj.result+' · '+name+(obj.error?' · '+obj.error:'');
    outcomes.append(item);
  }

  await run('Menu dưới Tổng quan và chặn nhân viên mở đường dẫn trực tiếp',async()=>{
    for(const node of [left,right]) {
      await until(()=>find(node,'.qlst-checklist'),'Checklist không hiện ở tài khoản có quyền',8000);
      const overview=find(node,'.sidebar [data-screen="home"]');
      check(overview?.nextElementSibling?.dataset.screen==='qlst_checklist','Sai vị trí menu Checklist');
    }
    await until(()=>find(staff,'[data-screen="home"]'),'Nhân viên chưa tải xong giao diện');
    check(!find(staff,'[data-screen="qlst_checklist"],.qlst-checklist'),'Nhân viên lọt vào giao diện');
    const forbidden=await fetch('/preview-db/rest/v1/rpc/qlst_checklist_open',{
      method:'POST',headers:{Authorization:'Bearer '+fixture.sessions.staff,'Content-Type':'application/json'},
      body:JSON.stringify({p_shop_id:fixture.shops.a.id}),
    });
    check(forbidden.status===403,'API không từ chối nhân viên');
  });
  await run('Cùng SHOP có 8 công việc mặc định, kết nối trực tiếp đến hai tài khoản',async()=>{
    await until(()=>live(left)&&live(right),'Realtime chưa đăng ký được ở cả hai tài khoản',8000);
    check((await readRows('lead',fixture.shops.a.id)).filter(row=>row.daily_key).length===8,'Mẫu ngày bị thiếu hoặc trùng');
    check((await readRows('other',fixture.shops.a.id)).length===0,'SHOP-B đọc được dữ liệu SHOP-A');
  });
  await run('QLST tạo, TC thấy ngay và chỉnh ưu tiên',async()=>{
    tab(left,'todo');tab(right,'todo');
    const start=performance.now();
    await create(left,title,180);
    await until(()=>card(right,title),'TC chưa nhận được việc mới');
    const milliseconds=Math.round(performance.now()-start);
    card(right,title).querySelector('[data-qlst-action="edit"]').click();
    const form=find(right,'[data-qlst-form]');
    form.elements.priority.value='high';
    form.requestSubmit();
    await until(()=>card(left,title)?.textContent.includes('Ưu tiên cao'),'QLST chưa thấy ưu tiên mới');
    return {syncCreateMs:milliseconds};
  });
  await run('TC hoàn tất, QLST nhận thay đổi và lọc lịch sử theo TC/ngày/tuần/tháng',async()=>{
    const item=card(right,title);check(item,'Không có công việc để hoàn tất');
    item.querySelector(rowQuery).click();
    await until(()=>!card(left,title),'QLST vẫn xem công việc đã hoàn tất ở Cần làm');
    tab(left,'done');tab(right,'done');
    await until(()=>card(left,title)?.textContent.includes('TC Trưởng ca A · 70002'),'Thiếu tên/mã người hoàn tất bên QLST');
    await until(()=>card(right,title)?.textContent.includes('Đúng hạn'),'Thiếu kết quả Đúng hạn bên TC');
    const role=find(left,'[name="role"]'),period=find(left,'[name="period"]');
    change(left,role,'manager');
    await until(()=>find(left,'[data-qlst="results"]')?.textContent.includes('Không có công việc'),'Lọc QLST không loại công việc TC');
    change(left,role,'shift_lead');
    for(const range of ['day','week','month']){
      change(left,period,range);
      await until(()=>card(left,title),'Thiếu công việc khi lọc '+range);
    }
    change(left,role,'');
  });
  await run('Quá hạn chuyển sang Hoàn tất trễ ở cả hai tài khoản',async()=>{
    tab(left,'overdue');tab(right,'overdue');
    await create(left,overdue,-25);
    await until(()=>card(right,overdue)?.textContent.includes('Trễ'),'TC chưa thấy số phút trễ');
    card(right,overdue).querySelector(rowQuery).click();
    await until(()=>!card(left,overdue),'QLST vẫn thấy việc quá hạn sau khi hoàn tất');
    tab(left,'done');tab(right,'done');
    for(const node of [left,right]) {
      await until(()=>card(node,overdue)?.textContent.includes('Hoàn thành trễ'),'Thiếu dấu hoàn tất trễ');
    }
  });
  await run('Popup chỉ báo cùng SHOP, không lặp và biến mất khi TC hoàn tất',async()=>{
    tab(left,'todo');tab(right,'todo');
    await create(left,reminder,35,60);
    await until(()=>pop(left,reminder)&&pop(right,reminder),'Cùng SHOP chưa nhận popup');
    check(!pop(staff,reminder)&&!pop(other,reminder),'Popup gửi sai tài khoản hoặc SHOP');
    click(right,'[data-qlst-popup="close"]');
    right.contentWindow.dispatchEvent(new right.contentWindow.Event('online'));
    await sleep(450);
    check(!pop(right,reminder),'Popup lặp lại sau đồng bộ');
    const item=await until(()=>card(right,reminder),'Chưa có công việc đã được nhắc');
    item.querySelector(rowQuery).click();
    await until(()=>!pop(left,reminder),'Popup chưa được hủy khi công việc hoàn tất');
  });
  await run('Tài khoản được cấp nhiều SHOP chuyển cửa hàng và thấy đúng danh sách',async()=>{
    const marker='Công việc riêng SHOP-B · '+suffix;
    await until(()=>live(other)&&live(multi),'Không tải được QLST của hai SHOP',8000);
    await create(other,marker,150);
    check(!card(multi,marker),'Công việc SHOP-B lẫn sang SHOP-A');
    const chooser=find(multi,'#activeShop');
    change(multi,chooser,fixture.shops.b.id);
    await until(()=>find(multi,'[data-qlst="shop"]')?.textContent.startsWith('SHOP-B')&&card(multi,marker),'Đổi SHOP-B không tải đúng việc');
    change(multi,find(multi,'#activeShop'),fixture.shops.a.id);
    await until(()=>find(multi,'[data-qlst="shop"]')?.textContent.startsWith('SHOP-A'),'Không về được SHOP-A');
    check(!card(multi,marker),'Giữ dữ liệu SHOP-B sau khi chuyển về SHOP-A');
  });

  const pass=results.filter(row=>row.result==='PASS').length;
  report.className=pass===results.length?'pass':'fail';
  report.textContent=pass+'/'+results.length+' PASS · '+(results.length-pass)+' FAIL';
  await fetch('/result',{method:'POST',body:JSON.stringify({browser:navigator.userAgent,pass,fail:results.length-pass,results})});
  document.getElementById('extra').replaceChildren();
  if(find(left,'[data-qlst-action="tab"][data-id="done"]'))tab(left,'done');
  if(find(right,'[data-qlst-action="tab"][data-id="done"]'))tab(right,'done');
}
document.getElementById('run').addEventListener('click',async event=>{
  const button=event.currentTarget;
  button.disabled=true;
  if(document.getElementById('left-role').value!=='manager'){document.getElementById('left-role').value='manager';load(left,'manager');}
  if(document.getElementById('right-role').value!=='lead'){document.getElementById('right-role').value='lead';load(right,'lead');}
  try{await browserTests()}finally{button.disabled=false}
});
