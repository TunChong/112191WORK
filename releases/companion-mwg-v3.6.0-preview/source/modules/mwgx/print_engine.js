/* Vector SVG print engine — all coordinates in mm, no foreignObject or external asset fetches. */
(function(){'use strict';
 const NS=window.MWGX;
 const mmPage={A4:[210,297],A5:[148,210],A6:[105,148],A7:[74,105]};
 const esc=NS.esc;
 function nice(value){return String(value??'').trim().slice(0,300)}
 function money(value){return new Intl.NumberFormat('vi-VN').format(Math.round(Number(value)||0))+'đ'}
 function xml(s){return esc(String(s)).replace(/\r/g,' ')}
 function palette(kind){return {
  tgd:['#ffdf08','#131925','#e43336'],dmx:['#115de3','#ffffff','#f72e35'],sale:['#c91926','#ffffff','#fff200'],
  finance:['#04577d','#ffffff','#f8b122'],service:['#106b52','#ffffff','#ffcb55'],sticker:['#f5a900','#131925','#cf202d'],
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
  if(kind==='sticker'){
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
  const [primary,ink,highlight]=palette(kind),pad=Math.min(7,w*0.06), title=nice(f.heading||f.title||'SẢN PHẨM'),label=nice(f.label||'GIÁ ƯU ĐÃI');
  const price=Number(f.salePrice)||0,base=Number(f.oldPrice)||0;
  const ratio=Math.min(1,w/155,h/95),s=(n)=>Math.max(2,n*ratio);
  let g=rect(x,y,w,h,'white',primary,Math.min(3,w*.03));
  g+=rect(x,y,w,Math.min(h*.22,20),primary,'none',2);
  g+=text(x+w/2,y+Math.min(h*.16,14),s(8),label,{fill:ink,bold:true,anchor:'middle'});
  const tx=x+pad,ty=y+Math.min(h*.39,31);
  g+=lineParts(title, Math.round(w/(s(3.2)))).slice(0,2).map((v,i)=>text(tx,ty+i*s(6.8),s(6.2),v,{fill:'#11243d',bold:true})).join('');
  if(base>price&&price>0)g+=`<line x1="${tx}" y1="${y+h*.66}" x2="${tx+Math.min(w*.6,52)}" y2="${y+h*.66}" stroke="#b02b2b" stroke-width=".55"/>`+text(tx,y+h*.66,s(5.8),money(base),{fill:'#6e7891'});
  const short=kind==='sticker'&&h<45;
  g+=text(x+w/2,y+h*(short?.69:.84),s(Math.min(15,w*.115)),money(price||base),{fill:highlight,bold:true,anchor:'middle'});
  if(f.subtitle)g+=text(x+w/2,y+h*.94,s(4.3),nice(f.subtitle).slice(0,55),{fill:'#345',anchor:'middle'});
  if(f.image&&/^data:image\/(?:png|jpeg|webp);base64,/i.test(f.image)){
   let ix=x+w*.71,iy=y+h*.25,iw=w*.24,ih=h*.31;
   g+=`<image href="${f.image}" x="${ix}" y="${iy}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid meet"/>`;
  }
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
