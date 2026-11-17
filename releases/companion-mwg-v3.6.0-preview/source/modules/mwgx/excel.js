/* XLSX builder reused from Companion-MWG v3.5.6, isolated to MWGX; no CDN dependency. */
(function(){
"use strict";
const encoder=new TextEncoder();
function xml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'')}
function colName(n){let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s}
function sheetXml(rows,numbers){
 const count=rows.length;const colCount=Math.max(1,...rows.map(r=>r.length));
 let s='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
 s+=`<dimension ref="A1:${colName(colCount)}${count}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="16"/>`;
 s+='<cols>'+Array.from({length:colCount},(_,i)=>`<col min="${i+1}" max="${i+1}" width="${i===1?55:i===2?24:22}" customWidth="1"/>`).join('')+'</cols><sheetData>';
 for(let r=0;r<rows.length;r++){
  s+=`<row r="${r+1}">`;
  for(let c=0;c<rows[r].length;c++){
   const v=rows[r][c];const ref=colName(c+1)+(r+1);
   if(r>0&&numbers.includes(c)&&Number.isFinite(v)){s+=`<c r="${ref}"><v>${v}</v></c>`}
   else s+=`<c r="${ref}" s="${r===0?1:0}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  }
  s+='</row>';
 }
 s+=`</sheetData><autoFilter ref="A1:${colName(colCount)}${count}"/></worksheet>`;
 return s;
}
function crc(bytes){let x=0xffffffff;for(const b of bytes){x^=b;for(let i=0;i<8;i++)x=(x&1)?(x>>>1)^0xedb88320:x>>>1;}return(x^0xffffffff)>>>0}
function zipParts(files){
 const out=[],directory=[];let offset=0;
 const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
 function emit(part){out.push(part);offset+=part.length}
 for(const [filename,body] of files){
  const path=encoder.encode(filename),bytes=encoder.encode(body),check=crc(bytes),start=offset;
  emit(new Uint8Array([80,75,3,4,...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(check),...u32(bytes.length),...u32(bytes.length),...u16(path.length),...u16(0)]));emit(path);emit(bytes);
  directory.push(new Uint8Array([80,75,1,2,...u16(20),...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(check),...u32(bytes.length),...u32(bytes.length),...u16(path.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(start),...path]));
 }
 const dirOffset=offset;for(const d of directory)emit(d);const dirSize=offset-dirOffset;
 emit(new Uint8Array([80,75,5,6,...u16(0),...u16(0),...u16(directory.length),...u16(directory.length),...u32(dirSize),...u32(dirOffset),...u16(0)]));
 return new Blob(out,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function buildXlsx(sheets){
 const content=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
 const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((v,i)=>`<sheet name="${xml(v.title)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`;
 const rels=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((v,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
 const styles=`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF155BD4"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`;
 const files=[['[Content_Types].xml',content],['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',rels],['xl/styles.xml',styles]];
 sheets.forEach((sheet,i)=>files.push([`xl/worksheets/sheet${i+1}.xml`,sheetXml(sheet.rows,sheet.numeric||[])]));
 return zipParts(files);
}

window.MWGX_EXCEL={buildXlsx};
})();
