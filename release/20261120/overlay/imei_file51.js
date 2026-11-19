/* Companion-MWG v3.5.1: private, read-only file reader for IMEI inventory only.
   CSV and modern XLSX are parsed locally (no third-party API, no upload to external service).
   A legacy XLS workbook may be opened via SheetJS if the existing library is available. */
(function(){
'use strict';
const MAX_BYTES=25*1024*1024;
const asString=x=>String(x??'').trim();
const decode=new TextDecoder('utf-8');
function bytesText(a){return decode.decode(a)}
function extension(file){const n=String(file?.name||'').toLowerCase();return n.slice(n.lastIndexOf('.')+1)}
function csvRows(raw){
 const text=raw.replace(/^\uFEFF/,'');
 const sample=text.split(/\r?\n/).slice(0,6).join('\n');
 const delimiter=['\t',';',','].map(c=>({c,n:(sample.match(new RegExp(c==='\t'?'\t':c===';'?';':',','g'))||[]).length})).sort((a,b)=>b.n-a.n)[0]?.c||',';
 const rows=[];let row=[],cell='',quote=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];if(ch==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++}else quote=!quote;continue}
  if(!quote&&ch===delimiter){row.push(cell);cell='';continue}
  if(!quote&&(ch==='\n'||ch==='\r')){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';continue}
  cell+=ch;
 }
 if(quote)throw new Error('File CSV có dấu nháy kép chưa đóng');
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 return {rows,numericCells:new Set(),sheet:'CSV'};
}
function zipIndex(buf){
 const v=new DataView(buf), len=buf.byteLength, u16=i=>v.getUint16(i,true), u32=i=>v.getUint32(i,true);
 let eocd=-1;for(let i=len-22;i>=Math.max(0,len-65557);i--){if(u32(i)===0x06054b50){eocd=i;break}}
 if(eocd<0)throw new Error('File Excel không hợp lệ: thiếu cấu trúc ZIP');
 const n=u16(eocd+10),start=u32(eocd+16),items=new Map();let at=start;
 if(n>30000)throw new Error('File Excel chứa quá nhiều thành phần');
 for(let i=0;i<n;i++){
  if(at+46>len||u32(at)!==0x02014b50)throw new Error('File Excel có thư mục ZIP lỗi');
  const method=u16(at+10),size=u32(at+20),nlen=u16(at+28),elen=u16(at+30),clen=u16(at+32),offset=u32(at+42);
  const path=decode.decode(new Uint8Array(buf,at+46,nlen)).replace(/^\//,'');
  if(path.length<240)items.set(path,{offset,method,size});
  at+=46+nlen+elen+clen;
 }
 async function read(path){
  const z=items.get(path);if(!z)return null;
  const at=z.offset;if(at+30>len||u32(at)!==0x04034b50)throw new Error('File Excel bị lỗi dữ liệu');
  const start=at+30+u16(at+26)+u16(at+28);
  if(start+z.size>len)throw new Error('File Excel bị thiếu dữ liệu');
  const slice=buf.slice(start,start+z.size);
  if(z.method===0)return bytesText(new Uint8Array(slice));
  if(z.method!==8||typeof DecompressionStream==='undefined')throw new Error('Trình duyệt không hỗ trợ mở Excel cục bộ');
  try{
   const compressed=new Blob([slice]);
   const stream=compressed.stream().pipeThrough(new DecompressionStream('deflate-raw'));
   return await new Response(stream).text();
  }catch(e){throw new Error('Trình duyệt không giải nén được Excel: '+(e?.message||e))}
 }
 return {read,items};
}
function xmlNodes(doc,tag){return Array.from(doc.getElementsByTagNameNS('*',tag))}
function xmlDoc(src){
 if(!src)throw new Error('Thiếu thành phần XML của Excel');
 const d=new DOMParser().parseFromString(src,'application/xml');
 if(d.getElementsByTagName('parsererror').length)throw new Error('File Excel có XML không hợp lệ');
 return d;
}
function cellColumn(label){
 const m=/^([A-Z]+)\d+$/i.exec(label);if(!m)return -1;
 let n=0;for(const ch of m[1].toUpperCase())n=n*26+ch.charCodeAt(0)-64;
 return n-1;
}
function normalizePath(path){
 const parts=[];for(const part of path.split('/')){if(part==='..')parts.pop();else if(part&&part!=='.')parts.push(part)}
 return parts.join('/');
}
async function xlsxRows(bytes){
 const zip=zipIndex(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 const workbook=xmlDoc(await zip.read('xl/workbook.xml'));
 const sheetNodes=xmlNodes(workbook,'sheet');
 if(!sheetNodes.length)throw new Error('Không tìm thấy sheet nào trong Excel');
 const preferred=sheetNodes.find(x=>asString(x.getAttribute('name')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().includes('IMEI'))||sheetNodes[0];
 const id=preferred.getAttribute('r:id')||preferred.getAttribute('id');
 const relXml=await zip.read('xl/_rels/workbook.xml.rels');
 let sheetPath='';
 if(relXml&&id){
  const rel=xmlNodes(xmlDoc(relXml),'Relationship').find(x=>x.getAttribute('Id')===id);
  if(rel){const target=rel.getAttribute('Target')||'';sheetPath=normalizePath(target.startsWith('/')?target:'xl/'+target)}
 }
 if(!sheetPath||!zip.items.has(sheetPath)){
  // Some exports omit workbook relationships but keep the conventional worksheet structure.
  sheetPath=Array.from(zip.items.keys()).find(x=>/^xl\/worksheets\/sheet\d+\.xml$/.test(x))||'';
 }
 if(!sheetPath)throw new Error('Không tìm được nội dung sheet IMEI trong Excel');
 const shared=[];
 const sharedXml=await zip.read('xl/sharedStrings.xml');
 if(sharedXml){
  const d=xmlDoc(sharedXml);
  for(const item of xmlNodes(d,'si')){
   shared.push(xmlNodes(item,'t').map(x=>x.textContent||'').join(''));
  }
 }
 const document=xmlDoc(await zip.read(sheetPath));
 const rows=[],numericCells=new Set();let rowCounter=0;
 for(const rowNode of xmlNodes(document,'row')){
  rowCounter++;const cells=[];let index=0;const excelRow=Number(rowNode.getAttribute('r'))||rowCounter;
  for(const c of xmlNodes(rowNode,'c')){
   const col=cellColumn(c.getAttribute('r')||'');const pos=col>=0?col:index;
   if(pos>50)continue;
   const t=c.getAttribute('t')||'n';
   let val='';
   if(t==='inlineStr')val=xmlNodes(c,'t').map(x=>x.textContent||'').join('');
   else{
    const v=xmlNodes(c,'v')[0];
    val=v?.textContent||'';
    if(t==='s')val=shared[Number(val)]??'';
    else if(t==='n'&&/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(val)&&/[.eE]/.test(val)){
     // Values shorter than 16 digits are safe integers; longer IMEIs must be Text.
     if(Number.isSafeInteger(Number(val)))val=String(Number(val));
    }
    if(t==='n')numericCells.add(excelRow+':'+pos);
   }
   cells[pos]=val;index=pos+1;
  }
  if(cells.some(x=>asString(x)!=='')){cells._excelRow=excelRow;rows.push(cells)}
  if(rows.length>70000)throw new Error('File vượt giới hạn 50.000 IMEI. Hãy tách file.');
 }
 return {rows,numericCells,sheet:preferred.getAttribute('name')};
}
async function sheetJsRows(file){
 if(!window.XLSX)throw new Error('Excel kiểu cũ .xls cần thư viện SheetJS. Hãy lưu thành .xlsx hoặc CSV rồi nhập lại.');
 const wb=window.XLSX.read(new Uint8Array(await file.arrayBuffer()),{type:'array',cellText:true,raw:false});
 const name=wb.SheetNames.find(n=>String(n).toUpperCase().includes('IMEI'))||wb.SheetNames[0];
 const sh=wb.Sheets[name];if(!sh)throw new Error('File Excel không có sheet chứa dữ liệu');
 const rows=window.XLSX.utils.sheet_to_json(sh,{header:1,defval:'',raw:false,blankrows:false});
 const numericCells=new Set();
 for(const addr in sh){if(addr.startsWith('!'))continue;const cell=sh[addr];if(cell?.t!=='n')continue;
  const m=/^([A-Z]+)(\d+)$/i.exec(addr);if(m){const col=cellColumn(addr);numericCells.add(m[2]+':'+col)}
 }
 return {rows,numericCells,sheet:name};
}
async function read(file){
 if(!file||!['xlsx','xls','csv'].includes(extension(file)))throw new Error('Chọn file .xlsx hoặc .csv gồm ba cột Mã Sản Phẩm, Tên Sản Phẩm, IMEI');
 if(!file.size)throw new Error('File không có dữ liệu');
 if(file.size>MAX_BYTES)throw new Error('File IMEI vượt 25 MB');
 const ext=extension(file);
 if(ext==='csv')return csvRows(bytesText(new Uint8Array(await file.arrayBuffer())));
 if(ext==='xls')return sheetJsRows(file);
 if(window.XLSX)return sheetJsRows(file);
 try{return await xlsxRows(new Uint8Array(await file.arrayBuffer()))}
 catch(e){if(window.XLSX)return sheetJsRows(file);throw e}
}
window.MWG_IMEI_FILE={read};
})();
