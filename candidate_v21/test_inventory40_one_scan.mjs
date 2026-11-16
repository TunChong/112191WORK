import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const code=readFileSync(new URL('./inventory40.js',import.meta.url),'utf8');
const handlers={};let cameraRef=null;let rpcCalls=0;let cameraStops=0;let scanConfig=null;let constructionOptions=null;
const windowObj={
 navigator:{vibrate:()=>{}},
 Html5Qrcode:class{
  constructor(id,options){cameraRef=this;constructionOptions=options}
  start(settings,opts,onSuccess){scanConfig=opts;this.onSuccess=onSuccess;return Promise.resolve();}
  async stop(){cameraStops++;}
  clear(){}
 }
};
const context={
 window:windowObj,document:{addEventListener:(name,cb)=>handlers[name]=cb,
  getElementById:(id)=>id==='inv-reader'?{}:null},
 navigator:{mediaDevices:{getUserMedia:()=>{}},vibrate:()=>{}},
 localStorage:{getItem:()=>null,setItem:()=>{}},
 console,Map,Set,Date,Number,String,Math,Promise,
};
vm.runInNewContext(code,context);
const inv=windowObj.INV40;
const state=inv._test.state;
state.shop='SHOP-97';state.sessionId='SESSION-1';state.sessions=[{id:'SESSION-1',state:'open',title:'Kiểm kê'}];state.tab='count';
let lastHtml='';
inv.configure({
 shopId:()=>state.shop,manager:()=>true,esc:s=>String(s),
 toast:()=>{},draw:()=>{lastHtml=inv.view()},
 api:async(path,{body}={})=>{
  if(path!=='/rest/v1/rpc/inventory_scan')throw new Error('Unexpected request '+path);
  rpcCalls++;
  return {product_code:body.p_code,product_name:'Camera',counted_qty:rpcCalls};
 }
});
await inv._test.startCamera();
assert.equal(state.cameraPhase,'scanning');
assert.equal(scanConfig.fps,20,'fast scanner decodes up to 20 frames/s');
assert.equal(scanConfig.disableFlip,true,'rear camera avoids redundant horizontal flip');
assert.ok(scanConfig.qrbox(430,300).width>=350,'scan frame enlarged for barcodes');
assert.equal(constructionOptions.useBarCodeDetectorIfSupported,true,'prefer native decoder when available');
for(let i=0;i<19;i++)cameraRef.onSuccess('0000001234');
await new Promise(resolve=>setTimeout(resolve,50));
assert.equal(rpcCalls,1,'19 rapid duplicate camera frames MUST count exactly once');
assert.equal(cameraStops,1,'camera stopped on first accepted code');
assert.equal(state.cameraActive,false);
assert.equal(state.cameraPhase,'idle');
assert.equal(state.last.counted_qty,1);
assert.match(lastHtml,/QUÉT TIẾP/);
assert.match(lastHtml,/ĐÃ QUÉT THÀNH CÔNG/);
assert.doesNotMatch(lastHtml,/data-inv-action="adjust"/);
assert.doesNotMatch(code,/inventory_adjust_count/);
await inv._test.startCamera();
cameraRef.onSuccess('0000001234');
await new Promise(resolve=>setTimeout(resolve,50));
assert.equal(rpcCalls,2,'next explicitly started camera session records exactly +1');
assert.equal(cameraStops,2);
assert.equal(state.last.counted_qty,2);
assert.match(lastHtml,/QUÉT TIẾP/);
console.log('PASS: 19 camera callbacks -> 1 count, auto-stop, visible receipt, SCAN AGAIN -> exactly +1, quantity edits disabled');