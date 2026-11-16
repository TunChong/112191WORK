import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync(new URL('./inventory40.js',import.meta.url),'utf8');
function setup({hung=false,missingLib=false}={}){
 const events={},win={navigator:{vibrate(){}},},status={textContent:''};
 const liveButton={disabled:true,textContent:''};
 let starts=0,stops=0,tracksStopped=0,rpcCalls=0,draws=0,lastHtml='';
 const video={readyState:4,srcObject:{getTracks:()=>[{stop:()=>tracksStopped++}]},
  setAttribute(){},pause(){},playsInline:false,muted:false,autoplay:false};
 const reader={querySelector:(q)=>q==='video'?video:null,querySelectorAll:()=>[video]};
 let camera=null;
 class Scanner{
  constructor(id,options){this.id=id;this.options=options;camera=this}
  start(_,settings,onSuccess){
   starts++;this.settings=settings;this.onSuccess=onSuccess;
   return hung?new Promise(()=>{}):Promise.resolve();
  }
  stop(){stops++;return Promise.resolve()}
  clear(){return Promise.resolve()}
 }
 if(!missingLib)win.Html5Qrcode=Scanner;
 const dom={addEventListener:(type,fn)=>events[type]=fn,
  getElementById:(id)=>id==='inv-reader'?reader:id==='inv-last'?status:null,
  querySelector:(q)=>q.includes('stop-camera')?liveButton:null,
  createElement:()=>({remove(){}}),head:{append(el){win.Html5Qrcode=Scanner;setImmediate(()=>el.onload?.())}}};
 const timers=hung?(fn,ms)=>setTimeout(fn,Math.min(ms,5)):setTimeout;
 const context={window:win,document:dom,localStorage:{getItem:()=>null,setItem:()=>{}},
  navigator:{mediaDevices:{getUserMedia(){}},vibrate(){}},
  console,Date,Number,String,Map,Set,Math,Promise,setTimeout:timers,clearTimeout};
 vm.runInNewContext(src,context);
 const inv=win.INV40,s=inv._test.state;
 s.shop='shop';s.sessionId='session';s.sessions=[{id:'session',state:'open',title:'Kỳ'}];s.tab='count';
 inv.configure({shopId:()=>s.shop,manager:()=>true,esc:String,toast(){},
  draw(){draws++;lastHtml=inv.view()},
  api:async(path,{body})=>{
   assert.equal(path,'/rest/v1/rpc/inventory_scan');rpcCalls++;
   return {product_code:body.p_code,product_name:'Tên SP',counted_qty:rpcCalls}
  }
 });
 return {inv,s,video,liveButton,status,get starts(){return starts},get stops(){return stops},
  get tracksStopped(){return tracksStopped},get rpcCalls(){return rpcCalls},
  get lastHtml(){return lastHtml},get draws(){return draws}};
}
const one=setup();
const started=one.inv._test.startCamera();
assert.equal(one.starts,1,'camera.start must run synchronously on iOS tap');
await started;
assert.equal(one.s.cameraPhase,'scanning');
assert.equal(one.s.cameraActive,true);
assert.equal(one.liveButton.disabled,false);
assert.equal(one.liveButton.textContent,'Tắt camera');
assert.equal(one.video.playsInline,true);
assert.equal(one.video.muted,true);
assert.equal(one.video.autoplay,true);
assert.equal(one.s.camera.settings.fps,30);
assert.ok(one.s.camera.settings.qrbox(480,360).width>=420,'wide scan frame for 1D barcodes');
for(let i=0;i<20;i++)one.s.camera.onSuccess('00012');
await new Promise(r=>setTimeout(r,30));
assert.equal(one.rpcCalls,1,'burst of 20 decoded frames increments exactly once');
assert.equal(one.s.cameraActive,false);
assert.equal(one.s.cameraPhase,'idle');
assert.match(one.lastHtml,/QUÉT TIẾP/);
assert.equal(one.rpcCalls,1,'one tap cannot count twice');
assert.equal(one.s.last.counted_qty,1);
assert.doesNotMatch(one.lastHtml,/CHỤP ẢNH MÃ|invPhotoInput/,'direct scanner UI only');

const loading=setup({missingLib:true});
await loading.inv._test.startCamera();
assert.equal(loading.starts,0,'do not lose tap activation by awaiting external library');
await new Promise(r=>setTimeout(r,20));
const second=loading.inv._test.startCamera();
assert.equal(loading.starts,1,'new deliberate button tap opens camera directly');
await second;
await loading.inv.leave();

const failure=setup({hung:true});
await failure.inv._test.startCamera();
assert.equal(failure.s.cameraActive,false,'hung start must reset active flag');
assert.equal(failure.s.cameraPhase,'idle','hung start must restore controls');
assert.equal(failure.s.scanResult,'error','report camera black screen rather than hanging');
assert.match(failure.s.scanError,/9 giây/);
console.log('PASS: synchronous iOS camera start, 30fps, 1 scan per tap, direct QR/barcode only, robust black-screen timeout');