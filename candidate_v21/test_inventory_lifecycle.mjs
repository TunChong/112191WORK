import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./inventory40.js',import.meta.url),'utf8');
const listeners={};const storage=new Map();let shop='SHOP-A',authorized=true,rpcCalls=[];
const stateDB={sessions:[{id:'SESSION-A',shop_id:'SHOP-A',title:'KIỂM KÊ THÁNG 11',state:'closed',closed_at:'2026-11-16'}],stock:[{product_code:'0001',product_name:'Máy giặt',expected_qty:3}],counts:[{product_code:'0001',product_name:'Máy giặt',counted_qty:2}]};
const sandbox={window:{},document:{addEventListener:(n,fn)=>listeners[n]=fn,getElementById:()=>null},
 localStorage:{getItem:(k)=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:(k)=>storage.delete(k)},
 navigator:{},console,Map,Set,Date,Promise,Number,String,Math,Intl};
vm.runInNewContext(source,sandbox);
const inv=sandbox.window.INV40,state=inv._test.state;
inv.configure({shopId:()=>shop,manager:()=>authorized,esc:s=>s,toast:()=>{},draw:()=>{},
 api:async (path,opts)=>{
   if(path.includes('/rest/v1/rpc/')){
     const action=path.split('/').at(-1);rpcCalls.push(action);
     if(action==='inventory_reopen_session'){stateDB.sessions[0].state='open';stateDB.sessions[0].closed_at=null;return null}
     if(action==='inventory_close_session'){stateDB.sessions[0].state='closed';stateDB.sessions[0].closed_at='2026-11-16';return null}
     if(action==='inventory_delete_session'){stateDB.sessions=[];stateDB.stock=[];stateDB.counts=[];return {deleted:true}}
     throw Error('Unexpected RPC '+action);
   }
   if(path.includes('inventory_sessions?'))return stateDB.sessions.map(x=>({...x}));
   if(path.includes('inventory_stock?'))return stateDB.stock.map(x=>({...x}));
   if(path.includes('inventory_counts?'))return stateDB.counts.map(x=>({...x}));
   throw Error('Unexpected API path '+path);
 }});
await inv.load();
assert.match(inv.view(),/Mở khóa kỳ kiểm kê/);
assert.match(inv.view(),/Xóa kỳ kiểm kê/);
assert.doesNotMatch(inv.view(),/data-inv-action="close-session"/);
await inv._test.performAction({dataset:{invAction:'reopen-session'}});
assert.equal(stateDB.sessions[0].state,'open');
assert.equal(state.stock[0].expected_qty,3,'unlock never clears stock');
assert.equal(state.counts[0].counted_qty,2,'unlock never clears counts');
assert.match(inv.view(),/Hoàn tất kiểm kê/);
await inv._test.performAction({dataset:{invAction:'close-session'}});
assert.equal(stateDB.sessions[0].state,'closed');
assert.match(inv.view(),/Mở khóa kỳ kiểm kê/);
await inv._test.performAction({dataset:{invAction:'delete-session'}});
assert.equal(stateDB.sessions.length,0);
assert.equal(state.sessionId,null);
assert.equal(state.stock.length,0);
assert.deepEqual(rpcCalls,['inventory_reopen_session','inventory_close_session','inventory_delete_session']);
authorized=false;
state.sessions=[{id:'XX',title:'Kỳ khác',state:'closed'}];state.sessionId='XX';
assert.doesNotMatch(inv.view(),/data-inv-action="delete-session"/,'staff cannot see destructive buttons');
const css=readFileSync(new URL('./quote40.css',import.meta.url),'utf8');
assert.match(css,/Times New Roman/);
assert.match(css,/@media print/);
const sql=readFileSync(new URL('./supabase/migrations/20261116_inventory40_session_lifecycle.sql',import.meta.url),'utf8');
assert.match(sql,/inventory_reopen_session/);
assert.match(sql,/inventory_delete_session/);
assert.match(sql,/DELETE FROM public\.inventory_counts WHERE session_id=p_session/);
assert.match(sql,/DELETE FROM public\.inventory_stock WHERE session_id=p_session/);
assert.match(sql,/DELETE FROM public\.inventory_sessions WHERE id=p_session/);
assert.match(sql,/work_can_manage_shop\(v_shop\)/);
console.log('PASS: Times New Roman quote; reopen retains counts; complete locks; delete selected session only; staff hidden');