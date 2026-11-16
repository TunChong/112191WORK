import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync(new URL('./quote40.js',import.meta.url),'utf8');
const stores=readFileSync(new URL('./quote_stores.js',import.meta.url),'utf8');
const proxy=readFileSync(new URL('./supabase/functions/quote-image/index.ts',import.meta.url),'utf8');
assert.match(proxy,/auth\/v1\/user/);
assert.match(proxy,/allowedImageHost/);
assert.match(proxy,/checked\(new URL\(next,target\)\.href\)/);
assert.doesNotMatch(proxy,/access-control-allow-origin'\s*:\s*'\*'/);
const browser={},listeners={},storage=new Map();
vm.runInNewContext(stores,{window:browser});
const imageElement={complete:true,naturalWidth:250,src:'data:image/jpeg;base64,YQ=='};
let printed=false,rendered=0,proxyCalls=0,downloadName='',imageAdded=false,downloaded=false;
const quoteNode={scrollWidth:1100,offsetWidth:1100,querySelectorAll:()=>[imageElement]};
function createCanvas(){
 return {width:100,height:100,
  getContext:()=>({fillRect(){},drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(80*80*4).fill(10)})}),
  toDataURL:()=> 'data:image/jpeg;base64,'+'a'.repeat(8000),
  toBlob:cb=>cb({size:8000})};
}
const document={
 addEventListener:(name,fn)=>listeners[name]=fn,
 documentElement:{clientWidth:1200},
 getElementById:id=>id==='quotePrint'?quoteNode:id==='qPreview'?{innerHTML:''}:null,
 querySelectorAll:()=>[],
 createElement:type=>type==='canvas'?createCanvas():{click(){downloaded=true},remove(){},style:{}},
 body:{append(){}},head:{appendChild(){}}
};
class MockImage{
 naturalWidth=800;naturalHeight=500;
 set src(x){queueMicrotask(()=>this.onload?.())}
}
class MockPdf{
 internal={pageSize:{getWidth:()=>297,getHeight:()=>210}};
 constructor(){this.added=false}
 addImage(src,kind,x,y,w,h){
  assert.match(src,/^data:image\/jpeg;base64,/);assert.equal(kind,'JPEG');
  assert.ok(w>0&&h>0&&x>=0&&y>=0);imageAdded=true;
 }
 output(){return new ArrayBuffer(8000)}
 save(name){downloadName=name}
}
browser.html2canvas=async()=>{
 rendered++;
 return {width:2200,height:1700,toDataURL:()=> 'data:image/jpeg;base64,'+'a'.repeat(8000),
  toBlob:cb=>cb({size:8000})};
};
browser.jspdf={jsPDF:MockPdf};
browser.devicePixelRatio=2;
browser.scrollY=0;
browser.print=()=>{printed=true};
const context={window:browser,document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 console,Map,Set,Math,Date,Intl,String,Number,Promise,Image:MockImage,
 URL:{createObjectURL:()=> 'blob:mock',revokeObjectURL(){}},Uint8ClampedArray,
 setTimeout,clearTimeout};
vm.runInNewContext(src,context);
const q=browser.QUOTE40;
q.configure({shopId:()=> 'shop97',shopCode:()=> '97',user:()=>null,
 toast(){},draw(){},resolveProduct:async()=>({title:'Tivi',image:'https://cdn.tgdd.vn/Products/Images/xx.jpg'}),
 resolveQuoteImage:async url=>{proxyCalls++;assert.match(url,/^https:\/\/cdn\.tgdd\.vn\//);return {ok:true,data_url:'data:image/png;base64,YQ=='}}
});
const p=q.data().products[0];
p.name='Tivi';p.url='https://www.dienmayxanh.com/tivi-test';p.image='https://cdn.tgdd.vn/Products/Images/xx.jpg';
await q._test.exportPDF();
assert.equal(proxyCalls,1,'one protected proxy request for image');
assert.equal(rendered,1,'PDF uses the verified screenshot canvas exactly once');
assert.ok(imageAdded,'jsPDF receives an actual JPEG screenshot');
assert.ok(downloadName.endsWith('.pdf'));
assert.equal(printed,false,'no blank browser print pipeline');
assert.match(p.image,/^data:image\/jpeg;base64/,'product image is embedded as same-origin data');
await q._test.captureQuote();
assert.equal(rendered,2,'PNG also uses verified shared canvas path');
assert.ok(downloaded,'PNG download initiated');
assert.equal(proxyCalls,1,'no repeated CDN request after image was embedded');
console.log('PASS: quotation product image embedded; PNG and PDF share nonblank canvas; no html2pdf white page');
