import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const code=readFileSync(new URL('./inventory40.js',import.meta.url),'utf8');
const handlers={};
const mockXLSX={
 read:()=>({SheetNames:['TỒN KHO','ĐỐI CHIẾU','BÁO CÁO THIẾU DƯ','DANH MỤC SẢN PHẨM'],Sheets:{'TỒN KHO':{},'DANH MỤC SẢN PHẨM':{}}}),
 utils:{
  sheet_to_json:(sheet)=>sheet===mockXLSX.fakeStock?
    [['Mã sản phẩm','Tên sản phẩm','Số lượng tồn kho'],['0160010000001','Chuột',2],['0160010000001','Chuột',3],['000007','',1]]:
    [['MÃ SẢN PHẨM','TÊN SẢN PHẨM'],['000007','Tên từ danh mục']]
 }
};
mockXLSX.fakeStock={};
mockXLSX.read=()=>({SheetNames:['TỒN KHO','DANH MỤC SẢN PHẨM'],Sheets:{'TỒN KHO':mockXLSX.fakeStock,'DANH MỤC SẢN PHẨM':{}}});
const context={
 window:{XLSX:mockXLSX},document:{addEventListener:(name,fn)=>handlers[name]=fn},
 navigator:{},localStorage:{getItem:()=>null,setItem:()=>{}},
 console,Map,Set,Date,Number,String,Math,Promise,
};
runInNewContext(code,context);
const inv=context.window.INV40;
assert.ok(inv&&typeof inv.compute==='function');
const result=inv.compute([
 {product_code:'0001',product_name:'Máy giặt',expected_qty:5},
 {product_code:'0002',product_name:'Tivi',expected_qty:2},
 {product_code:'0004',product_name:'Hàng đúng',expected_qty:3},
],[
 {product_code:'0001',counted_qty:4},
 {product_code:'0002',counted_qty:3},
 {product_code:'0003',product_name:'Hàng ngoài tồn',counted_qty:2},
 {product_code:'0004',counted_qty:3},
]);
assert.equal(result.missing.length,1);
assert.equal(result.missing[0].code,'0001');
assert.equal(result.missing[0].variance,1);
assert.equal(result.missingQty,1);
assert.equal(result.extraQty,3);
assert.equal(result.extra.length,2);
assert.equal(result.extra.find(x=>x.code==='0003').expected,0);
const book=await inv.parseFile({name:'ton-kho.xlsx',size:500,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer});
assert.equal(book.length,2);
assert.equal(book.find(x=>x.code==='0160010000001').qty,5);
assert.equal(book.find(x=>x.code==='000007').name,'Tên từ danh mục');
assert.match(code,/inventory_scan/);
assert.match(code,/await excelLib/);
assert.match(code,/Html5Qrcode/);
assert.match(code,/data-inv-action="tab"/);
assert.match(code,/CHÊNH LỆCH/);
assert.match(code,/window\.XLSX\.writeFile/);
assert.match(code,/KỲ KIỂM KÊ/);
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const service=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
assert.match(html,/inventory40\.js\?v=3\.3\.2/);
assert.match(html,/inventory40\.css\?v=3\.3\.2/);
assert.match(app,/inventory40:'Kiểm kê 4\.0'/);
assert.match(app,/window\.INV40\?\.load\(\)/);
assert.match(service,/inventory40\.css\?v=3\.3\.2/);
console.log('PASS: Inventory 4.0 parsing, duplicate SKU sums, shortage/surplus, QR and UI integration');