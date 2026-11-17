/* Vector SVG print engine — all coordinates in mm, no foreignObject or external asset fetches. */
(function(){'use strict';
 const NS=window.MWGX;
 const mmPage={A4:[210,297],A5:[148,210],A6:[105,148],A7:[74,105]};
 const esc=NS.esc;
 function nice(value){return String(value??'').trim().slice(0,300)}
 function money(value){return new Intl.NumberFormat('vi-VN').format(Math.round(Number(value)||0))+'đ'}
 function xml(s){return esc(String(s)).replace(/\r/g,' ')}
 function palette(kind){return {
  tgd:['#ffdf08','#111827','#d71920'],dmx:['#08a6d6','#ffffff','#e62935'],sale:['#f2a900','#111827','#cf202d'],
  finance:['#07577c','#ffffff','#f3a712'],service:['#08765b','#ffffff','#ffc247'],sticker:['#f0a800','#111827','#d71920'],
  warehouse:['#0e3765','#ffffff','#0b111b'],cash:['#135ec8','#ffffff','#15a34a'],insurance:['#145bb2','#ffffff','#d72a37']
 }[kind]||['#1456dc','#fff','#ef3340']}
 function unit(v){return Number.isFinite(v)?Math.max(0,v):0}
 function lineParts(text,max=28){const tokens=nice(text).split(/\s+/).filter(Boolean);const lines=[];let curr='';for(const t of tokens){if(curr&&curr.length+t.length+1>max){lines.push(curr);curr=t}else curr=curr?curr+' '+t:t;}if(curr)lines.push(curr);return lines.slice(0,4)}
 function text(x,y,size,str,{fill='#142238',bold=false,anchor='start',maxWidth=null}={}){return `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, sans-serif" font-size="${size}" ${bold?'font-weight="700"':''} text-anchor="${anchor}" ${maxWidth?`textLength="${maxWidth}" lengthAdjust="spacingAndGlyphs"`:''}>${xml(str)}</text>`}
 function rect(x,y,w,h,fill,stroke='none',rx=0){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`}
 function pageData(kind,fields={},options={}){
  const paper=(mmPage[fields.paper]||mmPage.A4);
  const pageW=paper[0],pageH=paper[1];
  const margin=Math.max(0,Math.min(30,Number(fields.margin??7)));
  const gap=Math.max(0,Math.min(25,Number(fields.gap??4)));
  const count=Math.max(1,Math.min(30,Math.floor(Number(fields.count)||1)));
  const paperOrientation=fields.orientation==='landscape';
  const w=paperOrientation?pageH:pageW,h=paperOrientation?pageW:pageH;
  let labelW=Number(fields.width)||w-2*margin, labelH=Number(fields.height)||h-2*margin;
  if(kind==='sticker'||kind==='sticker-cheap'){
   const size=Number(fields.sheetCount||6);
   const cols=size===6?2:1,rows=size===6?3:size===2?2:1;
   labelW=(w-2*margin-(cols-1)*gap)/cols;
   labelH=(h-2*margin-(rows-1)*gap)/rows;
  }
  if(labelW<=0||labelH<=0||labelW>w-2*margin+0.1||labelH>h-2*margin+0.1)throw Error('Kích thước mẫu vượt ngoài khổ giấy.');
  const cols=Math.max(1,Math.floor((w-2*margin+gap)/(labelW+gap)+1e-5));
  const rows=Math.max(1,Math.floor((h-2*margin+gap)/(labelH+gap)+1e-5));
  const perPage=cols*rows, pages=Math.ceil(count/perPage);
  if(pages>40)throw Error('Số lượng mẫu quá lớn; hãy chia lệnh in.');
  return {w,h,paper:fields.paper||'A4',margin,gap,count,labelW,labelH,cols,rows,perPage,pages,kind,fields};
 }
 function markSVG(x,y,w,h,kind,f){
  if(kind==='sticker-cheap')return markCheapSticker(x,y,w,h,f);
  const [primary,ink,highlight]=palette(kind),pad=Math.min(6,w*.065),title=nice(f.heading||f.title||'TÊN SẢN PHẨM'),label=nice(f.label||'GIÁ ƯU ĐÃI');
  const price=Number(f.salePrice)||0,base=Number(f.oldPrice)||0,scale=Math.min(1.45,w/74,h/105),s=n=>Math.max(2.2,n*scale);
  const brand=kind==='tgd'?'THẾ GIỚI DI ĐỘNG':kind==='dmx'?'ĐIỆN MÁY XANH':kind==='finance'?'TRẢ CHẬM 0%':kind==='service'?'DỊCH VỤ':kind==='sticker'?'STICKER ƯU ĐÃI':'ƯU ĐÃI SIÊU THỊ';
  const landscape=w>h,headH=Math.min(h*.24,Math.max(11,s(17))),innerW=w-pad*2;
  let g=rect(x,y,w,h,'#fff',primary,Math.min(3,w*.035));
  g+=rect(x,y,w,headH,primary,'none',Math.min(3,w*.035));
  g+=rect(x,y+headH-1,w,Math.max(1,s(1.3)),highlight,'none',0);
  g+=text(x+pad,y+headH*.34,s(2.6),brand,{fill:ink,bold:true,maxWidth:innerW*.76});
  g+=text(x+w/2,y+headH*.76,s(5.2),label,{fill:ink,bold:true,anchor:'middle',maxWidth:innerW*.9});
  const titleY=y+headH+s(8),titleLines=lineParts(title,Math.max(12,Math.round(innerW/s(3.2)))).slice(0,2);
  g+=titleLines.map((line,i)=>text(x+pad,titleY+i*s(5.7),s(4.5),line,{fill:'#162b46',bold:true,maxWidth:innerW})).join('');
  const imgOk=f.image&&/^data:image\/(?:png|jpeg|webp);base64,/i.test(f.image);
  const midY=y+h*(landscape?.43:.40),midH=h*(landscape?.2:.22);
  if(imgOk){
   const ix=x+pad,iy=midY,iw=innerW,ih=midH;
   g+=rect(ix,iy,iw,ih,'#f6f8fb','#e2e8f0',1.5);
   g+=`<image href="${f.image}" x="${ix+1}" y="${iy+1}" width="${iw-2}" height="${ih-2}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  const oldY=y+h*(landscape?.72:.69),priceBoxY=y+h*(landscape?.75:.73),priceBoxH=h*(landscape?.16:.17);
  if(base>0){
   const oldLabel=price>0&&price<base?'GIÁ CŨ':'GIÁ NIÊM YẾT';
   g+=text(x+pad,oldY,s(2.8),oldLabel,{fill:'#727d8f',bold:true});
   const oldText=money(base),oldW=Math.min(innerW*.82,Math.max(s(22),oldText.length*s(2.8)));
   g+=text(x+pad+innerW*.42,oldY,s(3.6),oldText,{fill:'#667085',anchor:'middle',maxWidth:oldW});
   if(price>0&&price<base)g+=`<line x1="${x+pad+innerW*.11}" y1="${oldY-s(1.2)}" x2="${x+pad+innerW*.77}" y2="${oldY-s(1.2)}" stroke="#d13c42" stroke-width=".65"/>`;
  }
  g+=rect(x+pad,priceBoxY,innerW,priceBoxH,'#fff7e8','none',Math.min(2,w*.025));
  if(price>0){
   const priceText=money(price),priceSize=Math.min(9.2,innerW/(priceText.length*.62));
   g+=text(x+w/2,priceBoxY+priceBoxH*.68,s(priceSize),priceText,{fill:highlight,bold:true,anchor:'middle',maxWidth:innerW*.92});
   if(base>price){const pct=Math.round((base-price)*100/base);g+=rect(x+w-pad-s(16),y+headH+s(2),s(16),s(8),'#d71920','none',2)+text(x+w-pad-s(8),y+headH+s(7.6),s(2.8),`-${pct}%`,{fill:'#fff',bold:true,anchor:'middle'});}
  }else{
   g+=text(x+w/2,priceBoxY+priceBoxH*.6,s(3.2),'NHẬP GIÁ BÁN',{fill:'#98a2b3',bold:true,anchor:'middle'});
  }
  const footY=y+h-s(3.4),sku=nice(f.sku),subtitle=nice(f.subtitle);
  if(subtitle)g+=text(x+pad,y+h*.94,s(2.8),subtitle.slice(0,55),{fill:'#43536b',maxWidth:innerW});
  if(sku)g+=text(x+pad,footY,s(2.35),`MÃ ${sku}`,{fill:'#738096',maxWidth:innerW*.66});
  if(f.validDate)g+=text(x+w-pad,footY,s(2.35),`ĐẾN ${nice(f.validDate)}`,{fill:'#738096',anchor:'end',maxWidth:innerW*.52});
  return g;
 }
 function printDate(value){
  if(value){const d=new Date(`${value}T12:00:00`);if(!Number.isNaN(d.valueOf()))return new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}).format(d)}
  return new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());
 }
 function priceDigits(value){const n=Math.round(Number(value)||0);return n>0?new Intl.NumberFormat('vi-VN').format(n):'00.000.000'}
 function giftSVG(x,y,sx=1,sy=sx){
  const t=n=>x+n*sx,u=n=>y+n*sy,sw=Math.min(sx,sy);
  return `<g stroke="#050505" stroke-linejoin="round" stroke-linecap="round">
   <rect x="${t(10)}" y="${u(35)}" width="${34*sx}" height="${29*sy}" fill="#fff" stroke-width="${2.5*sw}"/>
   <rect x="${t(5)}" y="${u(28)}" width="${44*sx}" height="${9*sy}" fill="#fff" stroke-width="${1.6*sw}"/>
   <rect x="${t(25)}" y="${u(28)}" width="${7*sx}" height="${36*sy}" fill="#050505" stroke="none"/>
   <path d="M${t(27)} ${u(28)}C${t(7)} ${u(24)},${t(4)} ${u(8)},${t(15)} ${u(8)}C${t(25)} ${u(8)},${t(29)} ${u(18)},${t(29)} ${u(27)}C${t(30)} ${u(16)},${t(37)} ${u(5)},${t(46)} ${u(10)}C${t(56)} ${u(16)},${t(43)} ${u(27)},${t(32)} ${u(30)}Z" fill="#fff" stroke-width="${2.6*sw}"/>
   <ellipse cx="${t(30)}" cy="${u(28)}" rx="${3.4*sx}" ry="${2.7*sy}" fill="#050505" stroke="none"/>
   <path d="M${t(36)} ${u(23)}L${t(52)} ${u(8)}L${t(69)} ${u(27)}L${t(52)} ${u(42)}Z" fill="#fff" stroke-width="${sw}"/>
   <path d="M${t(56)} ${u(9)}L${t(59)} ${u(4)}L${t(63)} ${u(9)}L${t(69)} ${u(10)}L${t(64)} ${u(14)}L${t(65)} ${u(20)}L${t(59)} ${u(17)}L${t(53)} ${u(20)}L${t(54)} ${u(14)}L${t(49)} ${u(10)}Z" fill="#050505" stroke="none"/>
   <path d="M${t(48)} ${u(45)}L${t(65)} ${u(40)}L${t(72)} ${u(62)}L${t(55)} ${u(67)}Z" fill="#fff" stroke-width="${sw}"/>
   <path d="M${t(52)} ${u(50)}L${t(65)} ${u(46)}M${t(54)} ${u(56)}L${t(67)} ${u(52)}" fill="none" stroke="#050505" stroke-width="${sw*1.3}"/>
   <text x="${t(59)}" y="${u(57)}" text-anchor="middle" fill="#050505" stroke="none" font-family="Arial,sans-serif" font-size="${5.3*sw}" font-weight="900">SALE</text>
   <path d="M${t(4)} ${u(20)}L${t(7)} ${u(16)}L${t(10)} ${u(20)}L${t(15)} ${u(21)}L${t(11)} ${u(24)}L${t(12)} ${u(29)}L${t(7)} ${u(27)}L${t(3)} ${u(29)}L${t(4)} ${u(24)}L${t(0)} ${u(21)}Z" fill="#fff" stroke="none"/><circle cx="${t(3)}" cy="${u(47)}" r="${1.4*sw}" fill="#fff" stroke="none"/><circle cx="${t(72)}" cy="${u(29)}" r="${1.5*sw}" fill="#fff" stroke="none"/><circle cx="${t(69)}" cy="${u(6)}" r="${1.2*sw}" fill="#fff" stroke="none"/>
   </g>`;
 }
 function markCheapSticker(x,y,w,h,f){
  const s=Math.min(w/297,h/210),tx=n=>x+n*s,ty=n=>y+n*s;
  const product=nice(f.title||'TÊN SẢN PHẨM').toLocaleUpperCase('vi-VN');
  const old=priceDigits(f.oldPrice),sale=priceDigits(f.salePrice),installment=nice(f.installmentText||'+ TRẢ GÓP 0% LÃI SUẤT').toLocaleUpperCase('vi-VN');
  const date=printDate(f.validDate),top=2.1;
  let g='<g fill="#050505">';
  g+=`<rect x="${tx(top)}" y="${ty(top)}" width="${(297-2*top)*s}" height="${(210-2*top)*s}" fill="#fff" stroke="#050505" stroke-width="${1.8*s}"/>`;
  g+=`<line x1="${tx(top)}" y1="${ty(61)}" x2="${tx(297-top)}" y2="${ty(61)}" stroke="#050505" stroke-width="${1.8*s}"/>`;
  g+=`<rect x="${tx(top)}" y="${ty(top)}" width="${47.2*s}" height="${(61-top)*s}" fill="#050505"/>`;
  g+=giftSVG(tx(7),ty(2.8),s*.65,s*.83);
  g+=`<text x="${tx(168)}" y="${ty(47)}" text-anchor="middle" font-size="${35*s}" font-family="'Rockwell Extra Bold','Arial Black','Rockwell','Roboto Slab',Georgia,serif" font-weight="900" letter-spacing="${-.7*s}" stroke="#050505" stroke-width="${1.2*s}" paint-order="stroke fill" textLength="${196*s}" lengthAdjust="spacingAndGlyphs">GIÁ RẺ QUÁ</text>`;
  g+=`<line x1="${tx(31)}" y1="${ty(89.7)}" x2="${tx(265)}" y2="${ty(89.7)}" stroke="#050505" stroke-width="${1.7*s}"/>`;
  g+=`<text x="${tx(148.5)}" y="${ty(105.7)}" text-anchor="middle" font-size="${44*s}" font-family="'Impact','Arial Narrow','Roboto Condensed','Arial Black',sans-serif" font-weight="900" letter-spacing="${-.7*s}" textLength="${154*s}" lengthAdjust="spacingAndGlyphs">${xml(old)}</text>`;
  g+=`<text x="${tx(148.5)}" y="${ty(160.8)}" text-anchor="middle" font-size="${64*s}" font-family="'Impact','Arial Narrow','Roboto Condensed','Arial Black',sans-serif" font-weight="900" letter-spacing="${-.9*s}" textLength="${225*s}" lengthAdjust="spacingAndGlyphs">${xml(sale)}</text>`;
  g+=`<text x="${tx(148.5)}" y="${ty(179.2)}" text-anchor="middle" font-size="${12.5*s}" font-family="'Arial Narrow','Roboto Condensed','Impact',sans-serif" font-weight="900" letter-spacing="${-.15*s}" textLength="${128*s}" lengthAdjust="spacingAndGlyphs">${xml(installment)}</text>`;
  const left=5.8,fy=185.6,fh=18,lw=176.2,gap=3.2,rw=297-2*left-lw-gap;
  g+=`<rect x="${tx(left)}" y="${ty(fy)}" width="${lw*s}" height="${fh*s}" fill="#fff" stroke="#050505" stroke-width="${1*s}"/>`;
  g+=`<rect x="${tx(left+lw+gap)}" y="${ty(fy)}" width="${rw*s}" height="${fh*s}" fill="#fff" stroke="#050505" stroke-width="${1*s}"/>`;
  g+=`<text x="${tx(left+lw/2)}" y="${ty(197.3)}" text-anchor="middle" font-size="${6.2*s}" font-family="'Arial Narrow','Roboto Condensed','Impact',sans-serif" font-weight="900" textLength="${Math.min(lw-12,Math.max(60,product.length*3.15))*s}" lengthAdjust="spacingAndGlyphs">${xml(product)}</text>`;
  const dateLabel=`NGÀY IN: ${date}`;
  g+=`<text x="${tx(left+lw+gap+rw/2)}" y="${ty(197.3)}" text-anchor="middle" font-size="${6.2*s}" font-family="'Arial Narrow','Roboto Condensed','Impact',sans-serif" font-weight="900" textLength="${Math.min(rw-7,Math.max(55,dateLabel.length*2.65))*s}" lengthAdjust="spacingAndGlyphs">${xml(dateLabel)}</text></g>`;
  return g;
 }
 function vectorPage(doc,pageIndex=0){const f=doc.fields, w=doc.w,h=doc.h;
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">${rect(0,0,w,h,'white')}`;
 const start=pageIndex*doc.perPage,remain=Math.min(doc.perPage,doc.count-start);
 for(let k=0;k<remain;k++){
  const index=start+k,col=k%doc.cols,row=Math.floor(k/doc.cols);
  const x=doc.margin+col*(doc.labelW+doc.gap),y=doc.margin+row*(doc.labelH+doc.gap);
  svg+=markSVG(x,y,doc.labelW,doc.labelH,doc.kind,f);
  if(f.cutLines)svg+=`<rect x="${x}" y="${y}" width="${doc.labelW}" height="${doc.labelH}" stroke="#a8b3c2" stroke-width=".18" stroke-dasharray="1,1" fill="none"/>`;
 }
 return svg+'</svg>';
 }
 function printHTML(doc,title='Companion-MWG'){
  const pages=Array.from({length:doc.pages},(_,i)=>vectorPage(doc,i));
  const s=pages.map(x=>`<div class="sheet">${x}</div>`).join('');
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><title>${xml(title)}</title><style>@page{size:${doc.w}mm ${doc.h}mm;margin:0}html,body{padding:0;margin:0;background:#fff}.sheet{width:${doc.w}mm;height:${doc.h}mm;page-break-after:always;break-after:page;overflow:hidden}.sheet:last-child{page-break-after:auto;break-after:auto}.sheet svg{display:block;width:100%;height:100%} @media screen {.sheet{margin:16px auto;box-shadow:0 2px 10px #bbb}}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>${s}</html>`;
 }
 function openPrint(doc){const win=window.open('','_blank');if(!win)throw Error('Trình duyệt chặn cửa sổ in. Hãy cho phép popup.');win.document.open();win.document.write(printHTML(doc,'In mẫu Companion-MWG'));win.document.close();win.focus();win.onload=()=>{win.print()};return true;}
 async function png(doc,mode='300',pageIndex=0){
  const scale=mode==='2k'?2048/doc.w:300/25.4;
  const w=Math.round(doc.w*scale),h=Math.round(doc.h*scale);
  if(w*h>33000000)throw Error('Ảnh xuất quá lớn cho thiết bị; hãy chọn PNG 2K.');
  const blob=new Blob([vectorPage(doc,pageIndex)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob);
  try{
   const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Không thể dựng ảnh; kiểm tra ảnh sản phẩm.'));img.src=url});
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='white';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
   const pngBlob=await new Promise((res,rej)=>canvas.toBlob(x=>x?.size?res(x):rej(Error('Không tạo được PNG')),'image/png'));
   return pngBlob;
  }finally{URL.revokeObjectURL(url)}
 }
 function printVectorSvg(svg,title,w=210,h=297){
 const win=window.open('','_blank');if(!win)throw Error('Trình duyệt đang chặn cửa sổ in.');
 const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${xml(title)}</title><style>@page{size:${w}mm ${h}mm;margin:0}html,body{margin:0;padding:0;background:white}.sheet{width:${w}mm;height:${h}mm;overflow:hidden}svg{width:100%;height:100%}@media print{*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><div class="sheet">${svg}</div></body></html>`;
 win.document.open();win.document.write(html);win.document.close();win.focus();win.onload=()=>win.print();return true;
}
window.MWGX_PRINT_ENGINE={mmPage,pageData,vectorPage,printHTML,openPrint,printVectorSvg,png,markSVG,palette};
})();
